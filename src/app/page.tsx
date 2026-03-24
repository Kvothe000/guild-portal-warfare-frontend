"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassSelection } from "@/components/onboarding/ClassSelection";
import { CommanderCard, HeroRosterCard } from "@/components/dashboard/CommanderCard";
import { GachaHub } from "@/components/gacha/GachaHub";
import { ClanTab } from "@/components/clan/ClanTab";
import { ArenaTab } from "@/components/arena/ArenaTab";
import { CampaignMap } from "@/components/campaign/CampaignMap";
import { BreakthroughPanel } from "@/components/heroes/BreakthroughPanel";
import { GuardianSpiritPanel, type GuardianSpirit } from "@/components/heroes/GuardianSpiritPanel";
import { EquipmentPanel, type Equipment } from "@/components/heroes/EquipmentPanel";
import {
    fetchPlayer, fetchPlayerWallet, fetchBanners, createPlayer,
    playCampaignStage, dropEquipment,
    Player, PlayerWallet, Hero, GachaBanner, OrderClass
} from "@/lib/api";
import { Swords, Users, Map, Gem, Ticket, Scroll, Trophy, LogIn, ShieldPlus } from "lucide-react";
import { CombatViewer } from "@/components/combat/CombatViewer";

// =============================================================================
// TYPES + STATES
// =============================================================================

type AppTab = "dashboard" | "campaign" | "gacha" | "heroes" | "arena" | "clan";

// =============================================================================
// NAVIGATION BAR
// =============================================================================

function NavBar({ activeTab, onTabChange, username }: {
    activeTab: AppTab;
    onTabChange: (t: AppTab) => void;
    username: string;
}) {
    const tabs: { id: AppTab; icon: React.ReactNode; label: string }[] = [
        { id: "dashboard", icon: <Scroll size={16} />, label: "Quartel" },
        { id: "campaign",  icon: <Map size={16} />,    label: "Campanha" },
        { id: "gacha",     icon: <Gem size={16} />,    label: "Invocar" },
        { id: "heroes",    icon: <ShieldPlus size={16} />, label: "Heróis" },
        { id: "arena",     icon: <Trophy size={16} />, label: "Arena" },
        { id: "clan",      icon: <Users size={16} />,  label: "Clã" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/60 safe-area-bottom">
            <div className="max-w-5xl mx-auto flex items-center justify-around px-4 py-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                            activeTab === tab.id
                                ? "text-white bg-white/10"
                                : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {tab.icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// =============================================================================
// WALLET BAR (top)
// =============================================================================

function WalletBar({ wallet }: { wallet: PlayerWallet }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Gem size={13} />
                <span>{wallet.crystals_premium.toLocaleString()}</span>
            </div>
            <div className="text-zinc-700">|</div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Ticket size={13} />
                <span>{wallet.summon_tickets}</span>
            </div>
            <div className="text-zinc-700">|</div>
            <div className="text-amber-300 font-bold text-xs">
                🟡 {wallet.gold.toLocaleString()}
            </div>
        </div>
    );
}

// =============================================================================
// TAB: DASHBOARD
// =============================================================================

function DashboardTab({ player, wallet }: { player: Player; wallet: PlayerWallet }) {
    const inTeam   = player.heroes.filter((h) => h.team_slot !== null).sort((a, b) => (a.team_slot ?? 99) - (b.team_slot ?? 99));
    const inRoster = player.heroes.filter((h) => h.team_slot === null);

    return (
        <div className="space-y-8">
            {/* Commander */}
            {player.commander ? (
                <CommanderCard
                    commander={player.commander}
                    username={player.username}
                    arenaPoints={1000}
                />
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
                    Nenhum Comandante registrado para esta conta.
                </div>
            )}

            {/* Active Team */}
            {inTeam.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                        <Swords size={14} />
                        Time Ativo ({inTeam.length}/5)
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {inTeam.map((h) => <HeroRosterCard key={h.id} hero={h} />)}
                    </div>
                </div>
            )}

            {/* Roster */}
            {inRoster.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
                        Reserva ({inRoster.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {inRoster.map((h) => <HeroRosterCard key={h.id} hero={h} />)}
                    </div>
                </div>
            )}

            {player.heroes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-2">
                    <div className="text-4xl opacity-30">🗡️</div>
                    <p className="text-zinc-500 text-sm">Seu roster está vazio. Vá à Invocação para chamar seus primeiros heróis!</p>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// TAB: HERÓIS (Breakthrough + Equipamento + Guardião)
// =============================================================================

type HeroSubTab = "breakthrough" | "equipment" | "guardian";

function HeroesTab({ playerId, player, wallet, spirits, equipment, onWalletUpdate, onSpiritsUpdate, onEquipmentUpdate, onHeroUpdate }: {
    playerId: string;
    player: Player;
    wallet: PlayerWallet;
    spirits: GuardianSpirit[];
    equipment: Equipment[];
    onWalletUpdate: (w: PlayerWallet) => void;
    onSpiritsUpdate: (s: GuardianSpirit[]) => void;
    onEquipmentUpdate: (e: Equipment[]) => void;
    onHeroUpdate: (h: Hero) => void;
}) {
    const [subTab, setSubTab] = useState<HeroSubTab>("breakthrough");
    const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

    const selectedHero = player.heroes.find((h) => h.id === selectedHeroId);

    const subTabs: { id: HeroSubTab; label: string; icon: string }[] = [
        { id: "breakthrough", label: "Breakthrough", icon: "⭐" },
        { id: "equipment",    label: "Equipamento",  icon: "⚔️" },
        { id: "guardian",     label: "Guardião",     icon: "✨" },
    ];

    return (
        <div className="space-y-6">
            {/* Sub-navigation */}
            <div className="flex gap-2">
                {subTabs.map((st) => (
                    <button key={st.id} onClick={() => setSubTab(st.id)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            subTab === st.id
                                ? "border-amber-600/60 bg-amber-950/30 text-amber-200"
                                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {st.icon} {st.label}
                    </button>
                ))}
            </div>

            {subTab === "breakthrough" && (
                <div className="space-y-6">
                    {/* Hero selector */}
                    {player.heroes.length > 0 ? (
                        <>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                                    Selecione um herói para Breakthrough
                                </h3>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {player.heroes.map((hero) => (
                                        <button
                                            key={hero.id}
                                            onClick={() => setSelectedHeroId(hero.id)}
                                            className={`p-2 rounded-lg border text-center transition-all ${
                                                selectedHeroId === hero.id
                                                    ? "border-amber-500/60 bg-amber-950/30 text-white"
                                                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                        >
                                            <div className="text-xs font-bold truncate">{hero.name}</div>
                                            <div className="text-[9px] text-zinc-600">{hero.rarity} · BT{hero.breakthrough_level}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedHero ? (
                                <BreakthroughPanel
                                    hero={selectedHero}
                                    fragments={selectedHero.breakthrough_level * 20 + 15} // Mock: needs backend route
                                    onBreakthroughSuccess={onHeroUpdate}
                                />
                            ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500 text-sm">
                                    Selecione um herói acima para ver o Breakthrough
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center space-y-2">
                            <div className="text-4xl opacity-30">⭐</div>
                            <p className="text-zinc-500 text-sm">Invoque heróis primeiro para usar o Breakthrough.</p>
                        </div>
                    )}
                </div>
            )}

            {subTab === "equipment" && (
                <EquipmentPanel
                    playerId={playerId}
                    equipment={equipment}
                    heroes={player.heroes}
                    onEquipmentUpdate={onEquipmentUpdate}
                />
            )}

            {subTab === "guardian" && (
                <GuardianSpiritPanel
                    playerId={playerId}
                    spirits={spirits}
                    wallet={wallet}
                    onWalletUpdate={onWalletUpdate}
                    onSpiritsUpdate={onSpiritsUpdate}
                />
            )}
        </div>
    );
}


// =============================================================================
// ONBOARDING FLOW — Criar conta
// =============================================================================

function OnboardingFlow({ onComplete }: { onComplete: (playerId: string) => void }) {
    const [step, setStep] = useState<"id-or-create" | "class-select" | "form">("id-or-create");
    const [selectedClass, setSelectedClass] = useState<OrderClass | null>(null);
    const [form, setForm] = useState({ username: "", email: "", password: "", playerId: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClassSelected = (cls: OrderClass) => {
        setSelectedClass(cls);
        setStep("form");
    };

    const handleLogin = async () => {
        if (!form.playerId.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            await fetchPlayer(form.playerId.trim());
            localStorage.setItem("vod_player_id", form.playerId.trim());
            onComplete(form.playerId.trim());
        } catch {
            setError("Player ID não encontrado. Verifique ou crie uma nova conta.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        if (!selectedClass || !form.username || !form.email || !form.password) return;
        setIsLoading(true);
        setError(null);
        try {
            const player = await createPlayer({
                username: form.username, email: form.email,
                password: form.password, order_class: selectedClass,
            });
            localStorage.setItem("vod_player_id", player.id);
            onComplete(player.id);
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Erro ao criar conta.");
        } finally {
            setIsLoading(false);
        }
    };

    if (step === "class-select") {
        return <ClassSelection onSelect={handleClassSelected} isLoading={isLoading} />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-zinc-950 to-red-950/10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md space-y-8"
            >
                {/* Logo */}
                <div className="text-center">
                    <p className="text-zinc-500 uppercase tracking-[0.4em] text-xs font-bold mb-3">Bem-vindo a</p>
                    <h1 className="text-5xl font-black text-white mb-2">
                        Veil of{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Dominion
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-sm">A batalha pelos Portais de Éter começa aqui.</p>
                </div>

                {step === "id-or-create" && (
                    <div className="space-y-6">
                        {/* Existing Player */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                            <div className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                <LogIn size={14} />
                                Retornar com Player ID
                            </div>
                            <input
                                type="text"
                                placeholder="Cole seu Player ID aqui..."
                                value={form.playerId}
                                onChange={(e) => setForm({ ...form, playerId: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 text-sm outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                            <button
                                onClick={handleLogin}
                                disabled={isLoading || !form.playerId.trim()}
                                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-bold text-sm transition-all"
                            >
                                {isLoading ? "Verificando..." : "Entrar →"}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-zinc-800" />
                            <span className="text-zinc-600 text-xs font-bold uppercase tracking-wider">ou</span>
                            <div className="flex-1 h-px bg-zinc-800" />
                        </div>

                        {/* New Player */}
                        <button
                            onClick={() => setStep("class-select")}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-base shadow-xl shadow-orange-500/20 transition-all"
                        >
                            ⚔️ Criar Nova Conta
                        </button>
                    </div>
                )}

                {step === "form" && selectedClass && (
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4"
                    >
                        <div className="text-sm font-bold text-zinc-300 mb-2">Criar sua identidade em Valdris</div>
                        {[
                            { key: "username", label: "Nome de Comandante", placeholder: "Ex: LordOfAshes" },
                            { key: "email",    label: "Email",              placeholder: "seu@email.com" },
                            { key: "password", label: "Senha",              placeholder: "••••••••", type: "password" },
                        ].map(({ key, label, placeholder, type = "text" }) => (
                            <div key={key}>
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">{label}</label>
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    value={(form as any)[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 text-sm outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>
                        ))}

                        <div className="flex gap-3 mt-2">
                            <button onClick={() => setStep("class-select")} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-bold transition-all">
                                ← Voltar
                            </button>
                            <button
                                onClick={handleCreateAccount}
                                disabled={isLoading || !form.username || !form.email || !form.password}
                                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-black text-sm transition-all"
                            >
                                {isLoading ? "Criando lenda..." : "Jurar lealdade ⚔️"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// =============================================================================
// ROOT PAGE
// =============================================================================

export default function VeilOfDominionApp() {
    const [playerId, setPlayerId]     = useState<string | null>(null);
    const [player, setPlayer]         = useState<Player | null>(null);
    const [wallet, setWallet]         = useState<PlayerWallet | null>(null);
    const [banners, setBanners]       = useState<GachaBanner[]>([]);
    const [activeTab, setActiveTab]   = useState<AppTab>("dashboard");
    const [isLoading, setIsLoading]   = useState(false);
    const [clanId, setClanId] = useState<string | null>(null);
    const [combatViewerState, setCombatViewerState] = useState<{ log: any[], winner: "attacker" | "defender", onFinish: () => void } | null>(null);
    const [spirits, setSpirits]       = useState<GuardianSpirit[]>([]);
    const [equipment, setEquipment]   = useState<Equipment[]>([]);

    useEffect(() => {
        const savedId = localStorage.getItem("vod_player_id");
        if (savedId) loadPlayerData(savedId);
    }, []);

    const loadPlayerData = async (id: string) => {
        setIsLoading(true);
        try {
            const [p, w, b] = await Promise.all([
                fetchPlayer(id),
                fetchPlayerWallet(id),
                fetchBanners(),
            ]);
            setPlayerId(id);
            setPlayer(p);
            setWallet(w);
            setBanners(b);
            setClanId(p.clan_id);
        } catch {
            localStorage.removeItem("vod_player_id");
            setPlayerId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHeroesAdded = (newHeroes: Hero[]) => {
        setPlayer((prev) => prev ? { ...prev, heroes: [...prev.heroes, ...newHeroes] } : prev);
    };

    const handleClanJoined = (newClanId: string) => {
        setClanId(newClanId);
        setPlayer((prev) => prev ? { ...prev, clan_id: newClanId } : prev);
    };

    const handleStagePlay = async (stageNumber: number) => {
        if (!playerId || !player) return;
        setIsLoading(true);
        try {
            const result = await playCampaignStage(playerId, stageNumber);
            
            // Apresenta a luta visual!
            setCombatViewerState({
                log: result.combat_log,
                winner: result.winner,
                onFinish: async () => {
                    setCombatViewerState(null);
                    
                    if (result.winner === "attacker") {
                        alert(result.message + `\nGold: +${result.gold_reward} | XP: +${result.xp_reward}`);
                        if (stageNumber % 3 === 0 || Math.random() > 0.5) {
                            try {
                                const drop = await dropEquipment(playerId, "campaign");
                                alert(drop.message);
                            } catch (e) {}
                        }
                    } else {
                        alert(result.message);
                    }
                    
                    // Atualiza os dados locais do player
                    await loadPlayerData(playerId);
                }
            });
        } catch (error: any) {
            alert("Erro na campanha: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsLoading(false);
        }
    };


    if (!playerId && !isLoading) {
        return <OnboardingFlow onComplete={loadPlayerData} />;
    }

    if (isLoading || !player || !wallet) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin mx-auto" />
                    <p className="text-zinc-400 text-sm">Invocando Valdris...</p>
                </div>
            </div>
        );
    }

    const arenaPoints = player.commander ? 1000 : 1000; // Will come from PlayerProgress

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Top Header */}
            <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/60">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-black text-sm">
                        <span className="text-zinc-400">⚔️</span>{" "}
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Veil</span>{" "}
                        <span className="text-zinc-200">of Dominion</span>
                    </div>
                    {wallet && <WalletBar wallet={wallet} />}
                    <button
                        onClick={() => { localStorage.removeItem("vod_player_id"); setPlayerId(null); setPlayer(null); }}
                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 pb-28">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >
                        {activeTab === "dashboard" && (
                            <DashboardTab player={player} wallet={wallet} />
                        )}
                        {activeTab === "campaign" && (
                            <CampaignMap
                                highestStage={player.progress?.highest_stage_number ?? 0}
                                onStagePlay={(stage) => handleStagePlay(stage.number)}
                            />
                        )}
                        {activeTab === "gacha" && (
                            <GachaHub
                                playerId={playerId!}
                                banners={banners}
                                wallet={wallet}
                                onWalletUpdate={setWallet}
                                onHeroesAdded={handleHeroesAdded}
                            />
                        )}
                        {activeTab === "heroes" && (
                            <HeroesTab
                                playerId={playerId!}
                                player={player}
                                wallet={wallet}
                                spirits={spirits}
                                equipment={equipment}
                                onWalletUpdate={setWallet}
                                onSpiritsUpdate={setSpirits}
                                onEquipmentUpdate={setEquipment}
                                onHeroUpdate={(updated: Hero) => {
                                    setPlayer((prev) => prev ? {
                                        ...prev,
                                        heroes: prev.heroes.map((h) => h.id === updated.id ? updated : h)
                                    } : prev);
                                }}
                            />
                        )}
                        {activeTab === "arena" && (
                            <ArenaTab
                                playerId={playerId!}
                                currentPoints={arenaPoints}
                            />
                        )}
                        {activeTab === "clan" && (
                            <ClanTab
                                playerId={playerId!}
                                clanId={clanId}
                                onClanJoined={handleClanJoined}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Nav */}
            <NavBar activeTab={activeTab} onTabChange={setActiveTab} username={player.username} />
        </div>
    );
}
