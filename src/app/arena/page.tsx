"use client";

import { CombatArena } from "@/components/combat/CombatArena";
import { HeroState } from "@/components/combat/HeroCard";
import { CombatTick } from "@/hooks/useCombatReplay";

// MOCK DATA TO TEST THE VISUALIZER BEFORE THE API CATCH
const mockAttackers: HeroState[] = [
    { id: "a1", name: "Avatar Ignis", max_hp: 1500, current_hp: 1500, max_energy: 100, current_energy: 40, faction: "Vanguard", isDead: false },
    { id: "a2", name: "Válkios", max_hp: 2000, current_hp: 2000, max_energy: 100, current_energy: 20, faction: "Vanguard", isDead: false },
    { id: "a3", name: "Kael'en", max_hp: 1100, current_hp: 1100, max_energy: 100, current_energy: 80, faction: "Shadow", isDead: false },
];

const mockDefenders: HeroState[] = [
    { id: "d1", name: "Avatar Aqua", max_hp: 1800, current_hp: 1800, max_energy: 100, current_energy: 100, faction: "Arcane", isDead: false },
    { id: "d2", name: "Thorne", max_hp: 1600, current_hp: 1600, max_energy: 100, current_energy: 50, faction: "Vanguard", isDead: false },
    { id: "d3", name: "Lyra", max_hp: 1000, current_hp: 1000, max_energy: 100, current_energy: 10, faction: "Arcane", isDead: false },
];

const mockLog: CombatTick[] = [
    {
        tick: 1,
        actor: "Kael'en",
        actions: [
            {
                actor_id: "a3",
                actor_name: "Kael'en",
                skill_used: "Corte Oculto",
                effect_type: "Damage",
                target_id: "d3",
                target_name: "Lyra",
                damage: 450,
                target_hp_remaining: 550,
                target_died: false,
                status_applied: "LowFloat"
            },
            {
                actor_id: "a1",
                actor_name: "Avatar Ignis",
                skill_used: "Combo Calcinante",
                effect_type: "CHASE_COMBO",
                triggered_by: "LowFloat",
                target_id: "d3",
                target_name: "Lyra",
                damage: 200,
                target_hp_remaining: 350,
                target_died: false,
                status_applied: "Repulse"
            }
        ]
    },
    {
        tick: 2,
        actor: "Avatar Ignis",
        actions: [
            {
                actor_id: "a1",
                actor_name: "Avatar Ignis",
                skill_used: "Chuva de Fogo",
                effect_type: "Damage_And_DoT",
                target_id: "d1",
                target_name: "Avatar Aqua",
                damage: 600,
                target_hp_remaining: 1200,
                target_died: false,
                shatter_triggered: true,
                status_applied: "Burn",
                shatter_status: "HighFloat"
            }
        ]
    },
    {
        tick: 3,
        actor: "Avatar Aqua",
        actions: [
            {
                actor_id: "d1",
                actor_name: "Avatar Aqua",
                skill_used: "Onda Curativa",
                effect_type: "Heal",
                target_id: "d3",
                target_name: "Lyra",
                healed: 400,
                target_hp_remaining: 750, // UI will just show the +400 text
            }
        ]
    },
    {
        tick: 4,
        actor: "Válkios",
        actions: [
            {
                actor_id: "a2",
                actor_name: "Válkios",
                skill_used: "Último Suspiro do Mártir",
                effect_type: "Taunt_And_Shield",
                target_id: "a2",
                target_name: "Válkios",
                status_applied: "Shield",
            }
        ]
    },
    {
        tick: 5,
        actor: "Thorne",
        actions: [
            {
                actor_id: "d2",
                actor_name: "Thorne",
                skill_used: "Ombrada",
                effect_type: "Damage",
                target_id: "a2", // Must hit taunter
                target_name: "Válkios",
                damage: 150,
                target_hp_remaining: 1850,
                target_died: false,
            }
        ]
    }
];

import { useState } from "react";

export default function ArenaPage() {
    const [attackers, setAttackers] = useState<HeroState[]>(mockAttackers);
    const [defenders, setDefenders] = useState<HeroState[]>(mockDefenders);
    const [log, setLog] = useState<CombatTick[] | null>(mockLog);
    const [isLoading, setIsLoading] = useState(false);

    // Defaulting to local backend if .env doesn't specify
    const [apiBase, setApiBase] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

    const fetchLiveBattle = async () => {
        setIsLoading(true);
        try {
            // Passo 1: Pedir pro Backend mockar 2 times perfeitos no banco de dados e nos dar os IDs
            const seedResponse = await fetch(`${apiBase}/arena/seed_mock_teams`, { method: "POST" });
            const seedData = await seedResponse.json();

            if (!seedData || !seedData.attacker_id) {
                throw new Error("Falha ao gerar times teste no backend.");
            }

            const atkId = seedData.attacker_id;
            const defId = seedData.defender_id;

            // Passo 2: Mandar o Chaos Engine processar a batalha 3v3 entre as equipes recém-criadas
            const battleResponse = await fetch(`${apiBase}/battles/test_simulation?attacker_player_id=${atkId}&defender_player_id=${defId}`, { method: "POST" });
            const battleData = await battleResponse.json();

            if (battleData && battleData.log) {
                // Sucesso! Alimentamos o Visualizador com o JSON do Render
                setLog(battleData.log);
            }
        } catch (error) {
            console.error("Error fetching live battle, using fallback mock", error);
            alert("Erro ao conectar com API. O servidor Render já atualizou?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen relative">
            {/* Control Panel to Fetch Live */}
            <div className="absolute top-4 left-4 z-50 bg-black/50 p-4 rounded-xl backdrop-blur-md border border-white/10 flex flex-col gap-2 shadow-2xl">
                <h4 className="text-white font-bold text-sm mb-2 opacity-80">Render API Connection</h4>

                {/* Input pro usuário socar a URL de Produção na hora */}
                <input
                    type="text"
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    className="bg-black/50 text-xs text-white p-2 rounded border border-white/20 w-64 outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://sua-api.onrender.com"
                />

                <button
                    onClick={fetchLiveBattle}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-black tracking-wider uppercase text-xs rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Gerando Batalha...
                        </>
                    ) : (
                        "INICIAR APOCALIPSE (LIVE DATA)"
                    )}
                </button>
            </div>

            <CombatArena
                // Using a 'key' to force remount the hook if log changes drastically
                key={log ? log.length : "initial"}
                initialAttackers={attackers}
                initialDefenders={defenders}
                log={log}
            />
        </div>
    );
}
