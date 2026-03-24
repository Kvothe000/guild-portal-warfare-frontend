import axios from "axios";

// Instância base do Axios apontando para o Backend FastAPI
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

// =============================================================================
// TYPES
// =============================================================================

export type OrderClass =
    | "FlameInquisitor"
    | "EtherChronist"
    | "SpectralBlade"
    | "StoneCleric"
    | "LunarHunter";

export interface PlayerWallet {
    gold: number;
    crystals_premium: number;
    summon_tickets: number;
    spirit_tickets: number;
    clan_coins: number;
    pity_counter: number;
}

export interface Commander {
    player_id: string;
    order_class: OrderClass;
    level: number;
    experience: number;
    team_slot: number;
    max_hp: number;
    current_hp: number;
    attack: number;
    defense: number;
    speed: number;
}

export interface Skill {
    id: string;
    name: string;
    skill_type: "Basic" | "Active" | "Ultimate" | "Passive";
    cooldown: number;
    energy_cost: number;
    effect_type: string;
    multiplier: number;
}

export interface Hero {
    id: string;
    name: string;
    role: string;
    faction: "Vanguard" | "Arcane" | "Shadow" | "Neutral";
    rarity: "SSS" | "SS" | "S" | "A" | "B";
    level: number;
    breakthrough_level: number;
    max_hp: number;
    current_hp: number;
    attack: number;
    defense: number;
    speed: number;
    team_slot: number | null;
    skills: Skill[];
}

export interface PlayerProgress {
    player_id: string;
    highest_stage_number: number;
    daily_sweeps_remaining: number;
    daily_fast_rewards_remaining: number;
    daily_boss_attacks_remaining: number;
    arena_points: number;
}

export interface Player {
    id: string;
    username: string;
    email: string;
    clan_id: string | null;
    commander: Commander | null;
    heroes: Hero[];
    progress?: PlayerProgress;
}

export interface GachaBanner {
    id: string;
    name: string;
    description: string;
    faction_focus: string | null;
    cost_amount: number;
    cost_currency: string;
    hard_pity_count: number;
    soft_pity_start: number;
    is_active: boolean;
    expires_at?: string;
}

export interface DamageContribution {
    player_id: string;
    damage_dealt: number;
    attacks_used: number;
    last_attack_at: string | null;
}

export interface ClanBossSession {
    id: string;
    clan_id: string;
    boss_name: string;
    boss_max_hp: number;
    boss_current_hp: number;
    boss_level: number;
    status: "Active" | "Defeated";
    damage_contributions: DamageContribution[];
}

export interface Clan {
    id: string;
    name: string;
    level: number;
    experience: number;
    description: string | null;
}

// =============================================================================
// PLAYER API
// =============================================================================

export const createPlayer = async (data: {
    username: string;
    email: string;
    password: string;
    order_class: OrderClass;
}): Promise<Player> => {
    const res = await api.post("/players/", data);
    return res.data;
};

export const fetchPlayer = async (playerId: string): Promise<Player> => {
    const res = await api.get(`/players/${playerId}`);
    return res.data;
};

export const fetchPlayerHeroes = async (playerId: string): Promise<Hero[]> => {
    const res = await api.get(`/players/${playerId}/heroes`);
    return res.data;
};

// =============================================================================
// WALLET & GACHA API
// =============================================================================

export const fetchPlayerWallet = async (playerId: string): Promise<PlayerWallet> => {
    const res = await api.get(`/economy/wallet/${playerId}`);
    return res.data;
};

export const fetchBanners = async (): Promise<GachaBanner[]> => {
    const res = await api.get("/economy/gacha/banners");
    return res.data;
};

export const pullGacha = async (
    playerId: string,
    bannerId: string,
    amount: 1 | 10
): Promise<{ pulls: Array<{ hero: Hero; is_hard_pity: boolean; pity_counter_sss: number }>; wallet_state: PlayerWallet; message: string }> => {
    const res = await api.post(`/economy/gacha/${playerId}/pull/${bannerId}?amount=${amount}`);
    return res.data;
};

// =============================================================================
// CLAN API
// =============================================================================

export const createClan = async (data: { name: string; description?: string }): Promise<Clan> => {
    const res = await api.post("/clans/", data);
    return res.data;
};

export const fetchClans = async (): Promise<Clan[]> => {
    const res = await api.get("/clans/");
    return res.data;
};

export const joinClan = async (playerId: string, clanId: string): Promise<Player> => {
    const res = await api.put(`/players/${playerId}/clan?clan_id=${clanId}`);
    return res.data;
};

export const fetchClanBoss = async (clanId: string): Promise<ClanBossSession> => {
    const res = await api.get(`/clans/${clanId}/boss`);
    return res.data;
};

export const donateToClan = async (clanId: string, playerId: string, amount: number, currency: string) => {
    const res = await api.post(`/clans/${clanId}/donate?player_id=${playerId}&amount=${amount}&currency=${currency}`);
    return res.data;
};

export const fetchClanBuffs = async (clanId: string) => {
    const res = await api.get(`/clans/${clanId}/buffs`);
    return res.data;
};

// =============================================================================
// BATTLE & CAMPAIGN API
// =============================================================================

export const playCampaignStage = async (playerId: string, stageNumber: number) => {
    const res = await api.post(`/campaign/play?player_id=${playerId}&stage_number=${stageNumber}`);
    return res.data;
};

export const simulateBattle = async (
    attackerPlayerId: string,
    defenderPlayerId: string
): Promise<{ winner: "attacker" | "defender" | "draw"; log: unknown[] }> => {
    const res = await api.post(`/battles/simulate?attacker_player_id=${attackerPlayerId}&defender_player_id=${defenderPlayerId}`);
    return res.data;
};

// =============================================================================
// ARENA API
// =============================================================================

export const fetchArenaLeaderboard = async (limit = 50) => {
    const res = await api.get(`/arena/leaderboard?limit=${limit}`);
    return res.data;
};

export const attackArena = async (attackerPlayerId: string, defenderPlayerId: string) => {
    const res = await api.post(`/arena/match/${defenderPlayerId}`, {
        attacker_player_id: attackerPlayerId,
    });
    return res.data;
};

// =============================================================================
// BREAKTHROUGH API
// =============================================================================

export const fetchHeroFragments = async (heroId: string, playerId: string) => {
    const res = await api.get(`/heroes/${heroId}/fragments?player_id=${playerId}`);
    return res.data as {
        hero_id: string; name: string; current_bt: number;
        fragments: number; next_bt_cost: number | null; can_breakthrough: boolean;
    };
};

export const executeBreakthrough = async (heroId: string, playerId: string) => {
    const res = await api.post(`/heroes/${heroId}/breakthrough?player_id=${playerId}`);
    return res.data;
};

export const addFragments = async (heroId: string, playerId: string, amount: number) => {
    const res = await api.post(`/heroes/${heroId}/fragments/add?player_id=${playerId}&amount=${amount}`);
    return res.data;
};

// =============================================================================
// GUARDIAN SPIRITS API
// =============================================================================

export const fetchGuardians = async (playerId: string) => {
    const res = await api.get(`/guardians/?player_id=${playerId}`);
    return res.data as import("@/components/heroes/GuardianSpiritPanel").GuardianSpirit[];
};

export const summonGuardian = async (playerId: string) => {
    const res = await api.post(`/guardians/summon?player_id=${playerId}`);
    return res.data;
};

export const equipGuardian = async (spiritId: string, playerId: string) => {
    const res = await api.post(`/guardians/${spiritId}/equip?player_id=${playerId}`);
    return res.data;
};

// =============================================================================
// EQUIPMENT API
// =============================================================================

export const fetchEquipment = async (playerId: string) => {
    const res = await api.get(`/equipment/?player_id=${playerId}`);
    return res.data as import("@/components/heroes/EquipmentPanel").Equipment[];
};

export const upgradeEquipment = async (equipId: string, playerId: string) => {
    const res = await api.post(`/equipment/${equipId}/upgrade?player_id=${playerId}`);
    return res.data;
};

export const equipToHero = async (equipId: string, heroId: string, playerId: string) => {
    const res = await api.post(`/equipment/${equipId}/equip?hero_id=${heroId}&player_id=${playerId}`);
    return res.data;
};

export const dropEquipment = async (playerId: string, source = "campaign") => {
    const res = await api.post(`/equipment/drop?player_id=${playerId}&source=${source}`);
    return res.data;
};
