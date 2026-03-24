"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchClanBoss, createClan, fetchClans, joinClan, donateToClan, fetchClanBuffs, api, Clan, ClanBossSession } from "@/lib/api";
import { Users, Crown, Flame, Shield, ChevronRight, AlertCircle, Swords, Zap, Coins } from "lucide-react";
import { CombatViewer } from "@/components/combat/CombatViewer";

// =============================================================================
// BOSS HP BAR
// =============================================================================

function BossHPBar({ current, max, level }: { current: number; max: number; level: number }) {
    const pct = Math.max(0, (current / max) * 100);
    const barColor =
        pct > 60 ? "from-emerald-500 to-green-400" :
        pct > 30 ? "from-amber-500 to-yellow-400" :
                   "from-red-600 to-rose-500";

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-black text-white">Lich Soberano de Valdris</h3>
                    <p className="text-xs text-zinc-400">Boss do Clã — Nível {level}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold text-zinc-200">{current.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">/ {max.toLocaleString()} HP</div>
                </div>
            </div>
            <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/60 shadow-inner">
                <motion.div
                    className={`h-full bg-gradient-to-r ${barColor} rounded-full shadow-lg`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                <span>{pct.toFixed(1)}% HP restante</span>
                <span>{(max - current).toLocaleString()} de dano causado</span>
            </div>
        </div>
    );
}

// =============================================================================
// BOSS ATTACK RESULT
// =============================================================================

function AttackResultToast({ result, onClose }: {
    result: { damage_dealt: number; boss_defeated: boolean };
    onClose: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`rounded-2xl border p-5 shadow-2xl ${
                result.boss_defeated
                    ? "border-amber-500/60 bg-gradient-to-br from-amber-950/80 to-zinc-900"
                    : "border-red-700/50 bg-zinc-900/90"
            }`}
        >
            {result.boss_defeated ? (
                <div className="text-center space-y-2">
                    <div className="text-3xl">👑</div>
                    <div className="text-lg font-black text-amber-300">Boss Derrotado!</div>
                    <div className="text-sm text-zinc-300">
                        Seu Clã destruiu o Lich Soberano. Recompensas distribuídas!
                    </div>
                </div>
            ) : (
                <div className="text-center space-y-2">
                    <div className="text-2xl">⚔️</div>
                    <div className="text-sm font-bold text-white">
                        +{result.damage_dealt.toLocaleString()} de dano ao Boss
                    </div>
                    <div className="text-xs text-zinc-400">Ataque registrado com sucesso</div>
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// CLÃ — CRIAR / ENTRAR
// =============================================================================

function ClanBrowser({ playerId, onJoined }: { playerId: string; onJoined: (clanId: string) => void }) {
    const [clans, setClans] = useState<Clan[]>([]);
    const [newClanName, setNewClanName] = useState("");
    const [newClanDesc, setNewClanDesc] = useState("");
    const [mode, setMode] = useState<"browse" | "create">("browse");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClans().then(setClans).catch(console.error);
    }, []);

    const handleCreate = async () => {
        setIsLoading(true); setError(null);
        try {
            const clan = await createClan({ name: newClanName, description: newClanDesc });
            await joinClan(playerId, clan.id);
            onJoined(clan.id);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao criar Clã.");
        } finally { setIsLoading(false); }
    };

    const handleJoin = async (clanId: string) => {
        setIsLoading(true); setError(null);
        try {
            await joinClan(playerId, clanId);
            onJoined(clanId);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao entrar no Clã.");
        } finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-6">
            {/* Toggle */}
            <div className="flex gap-2">
                {(["browse", "create"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                            mode === m ? "border-violet-500/60 bg-violet-900/30 text-violet-200"
                                       : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {m === "browse" ? "🔍 Buscar Clãs" : "⚔️ Criar Clã"}
                    </button>
                ))}
            </div>

            {/* Create form */}
            {mode === "create" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3"
                >
                    <input
                        value={newClanName} onChange={(e) => setNewClanName(e.target.value)}
                        placeholder="Nome do Clã (único em Valdris)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 text-sm outline-none focus:border-violet-500 transition-colors"
                    />
                    <textarea
                        value={newClanDesc} onChange={(e) => setNewClanDesc(e.target.value)}
                        placeholder="Descrição (opcional)"
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 text-sm outline-none focus:border-violet-500 transition-colors resize-none"
                    />
                    <button onClick={handleCreate} disabled={isLoading || !newClanName.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-sm transition-all"
                    >
                        {isLoading ? "Forjando o Clã..." : "Fundar Clã ⚔️"}
                    </button>
                </motion.div>
            )}

            {/* Browse list */}
            {mode === "browse" && (
                <div className="space-y-3">
                    {clans.length === 0 ? (
                        <div className="text-center text-zinc-500 text-sm py-8">Nenhum Clã encontrado. Seja o primeiro!</div>
                    ) : (
                        clans.map((clan, i) => (
                            <motion.div key={clan.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-900/40 border border-violet-700/40 flex items-center justify-center text-lg">
                                    🏰
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-white">{clan.name}</div>
                                    <div className="text-xs text-zinc-500 truncate">{clan.description || "Sem descrição"}</div>
                                    <div className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-2">
                                        <span>⭐ Nível {clan.level}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleJoin(clan.id)} disabled={isLoading}
                                    className="shrink-0 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-violet-900/50 border border-zinc-700 hover:border-violet-600 text-xs font-bold text-zinc-300 hover:text-violet-200 transition-all disabled:opacity-40"
                                >
                                    Entrar
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-300 text-sm bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// CLÃ TAB — MAIN COMPONENT
// =============================================================================

interface ClanTabProps {
    playerId: string;
    clanId: string | null;
    onClanJoined: (clanId: string) => void;
}

export function ClanTab({ playerId, clanId, onClanJoined }: ClanTabProps) {
    const [boss, setBoss] = useState<ClanBossSession | null>(null);
    const [clanData, setClanData] = useState<Clan | null>(null);
    const [clanBuffs, setClanBuffs] = useState<any>(null);
    const [attacksLeft, setAttacksLeft] = useState(3);
    const [isAttacking, setIsAttacking] = useState(false);
    const [isDonating, setIsDonating] = useState(false);
    const [attackResult, setAttackResult] = useState<{ damage_dealt: number; boss_defeated: boolean, log?: any[] } | null>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSection, setCurrentSection] = useState<"boss" | "members" | "hall">("boss");

    const loadClanData = useCallback(async () => {
        if (!clanId) return;
        try {
            const [b, buffs, clans] = await Promise.all([
                fetchClanBoss(clanId).catch(() => null),
                fetchClanBuffs(clanId).catch(() => null),
                fetchClans().catch(() => [])
            ]);
            setBoss(b);
            setClanBuffs(buffs);
            const myClan = clans.find(c => c.id === clanId);
            if (myClan) setClanData(myClan);
        } catch (e) { console.error("Erro ao carregar clã", e); }
    }, [clanId]);

    useEffect(() => { loadClanData(); }, [loadClanData]);

    const handleAttackBoss = async () => {
        if (!clanId || !boss || attacksLeft <= 0) return;
        setIsAttacking(true); setError(null);
        try {
            const res = await api.post(`/clans/${clanId}/boss/attack?player_id=${playerId}&attacker_player_id=${playerId}`);
            setBoss((prev) => prev ? { ...prev, boss_current_hp: res.data.boss_hp_remaining } : prev);
            setAttacksLeft((n) => Math.max(0, n - 1));
            setAttackResult({
                damage_dealt: res.data.damage_dealt,
                boss_defeated: res.data.boss_defeated,
                log: res.data.combat_log
            });
            setShowViewer(true);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Ataque falhou. Tente novamente.");
        } finally {
            setIsAttacking(false);
        }
    };

    const handleCreateBossSession = async () => {
        if (!clanId) return;
        try {
            const res = await api.post(`/clans/${clanId}/boss/create?boss_level=1`);
            setBoss(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao criar sessão.");
        }
    };

    const handleDonate = async (amount: number, currency: "gold" | "crystals") => {
        if (!clanId) return;
        setIsDonating(true); setError(null);
        try {
            const res = await donateToClan(clanId, playerId, amount, currency);
            alert(res.message);
            await loadClanData(); // Refresh buffs and exp
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro na doação.");
        } finally {
            setIsDonating(false);
        }
    };

    // --- No Clan ---
    if (!clanId) {
        return (
            <div className="space-y-8">
                <div className="text-center space-y-2">
                    <div className="text-5xl">🏰</div>
                    <h2 className="text-2xl font-black text-white">Entre em um Clã</h2>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                        Junte-se a outros guerreiros de Valdris. Juntos vocês conquistarão os Portais de Éter e derrotarão o Boss semanal.
                    </p>
                </div>
                <ClanBrowser playerId={playerId} onJoined={onClanJoined} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Tabs */}
            <div className="flex gap-2">
                {([
                    { id: "boss",    label: "💀 Boss",    icon: <Flame size={13} /> },
                    { id: "members", label: "👥 Membros", icon: <Users size={13} /> },
                    { id: "hall",    label: "🏆 Hall",    icon: <Crown size={13} /> },
                ] as const).map((s) => (
                    <button key={s.id} onClick={() => setCurrentSection(s.id)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            currentSection === s.id
                                ? "border-red-600/60 bg-red-950/30 text-red-200"
                                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* BOSS SECTION */}
            {currentSection === "boss" && (
                <div className="space-y-6">
                    {boss ? (
                        <>
                            {/* Boss Card */}
                            <div className="rounded-2xl border border-red-900/60 bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-900 p-6 shadow-2xl">
                                <BossHPBar
                                    current={boss.boss_current_hp}
                                    max={boss.boss_max_hp}
                                    level={boss.boss_level}
                                />

                                {boss.status === "Active" ? (
                                    <div className="mt-5 space-y-3">
                                        {/* Attacks remaining */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">Ataques disponíveis hoje</span>
                                            <div className="flex gap-1.5">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className={`w-3 h-3 rounded-full ${i < attacksLeft ? "bg-red-500" : "bg-zinc-800"}`} />
                                                ))}
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={attacksLeft > 0 ? { scale: 1.02 } : {}}
                                            whileTap={attacksLeft > 0 ? { scale: 0.97 } : {}}
                                            onClick={handleAttackBoss}
                                            disabled={isAttacking || attacksLeft <= 0}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 disabled:opacity-40 text-white font-black text-base shadow-xl shadow-red-700/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            {isAttacking ? (
                                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Atacando...</>
                                            ) : attacksLeft <= 0 ? (
                                                "⏳ Sem ataques — volte amanhã"
                                            ) : (
                                                <><Swords size={18} /> Atacar Boss</>
                                            )}
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div className="mt-5 text-center space-y-3">
                                        <div className="text-3xl">💀</div>
                                        <p className="text-amber-300 font-bold">Boss Derrotado esta semana!</p>
                                        <p className="text-zinc-500 text-sm">Nova sessão começa em breve.</p>
                                    </div>
                                )}
                            </div>

                            {/* Contributions table */}
                            {boss.damage_contributions && boss.damage_contributions.length > 0 && (
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                        Contribuições ao Boss
                                    </div>
                                    <div className="divide-y divide-zinc-800/50">
                                        {boss.damage_contributions
                                            .sort((a, b) => b.damage_dealt - a.damage_dealt)
                                            .map((c, i) => (
                                            <div key={c.player_id} className="px-5 py-3 flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black ${i === 0 ? "text-amber-300" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-600"}`}>
                                                        #{i + 1}
                                                    </span>
                                                    <span className="text-zinc-300 font-medium truncate max-w-[120px]">{c.player_id.slice(0, 8)}...</span>
                                                </div>
                                                <span className="text-red-400 font-bold">{c.damage_dealt.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center space-y-4">
                            <div className="text-5xl opacity-30">💀</div>
                            <p className="text-zinc-400 text-sm">Nenhum Boss ativo no momento.</p>
                            <button onClick={handleCreateBossSession}
                                className="px-6 py-3 rounded-xl bg-red-900/30 border border-red-700/40 text-red-300 text-sm font-bold hover:bg-red-800/30 transition-all"
                            >
                                Despertar o Boss (Admin)
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {attackResult && showViewer && attackResult.log && (
                            <CombatViewer
                                combatLog={attackResult.log}
                                winner={attackResult.boss_defeated ? "attacker" : "defender"}
                                onClose={() => setShowViewer(false)}
                            />
                        )}
                        {attackResult && !showViewer && (
                            <AttackResultToast result={attackResult} onClose={() => setAttackResult(null)} />
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="flex items-center gap-2 text-red-300 text-sm bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3">
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* MEMBERS SECTION */}
            {currentSection === "members" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-4">
                    <div className="text-4xl opacity-30">👥</div>
                    <h3 className="text-lg font-black text-zinc-300">Lista de Membros</h3>
                    <p className="text-zinc-500 text-sm">Em breve: lista de membros com pontuação no Boss e Arena.</p>
                </div>
            )}

            {/* CLAN HALL SECTION */}
            {currentSection === "hall" && clanData && clanBuffs && (
                <div className="space-y-6">
                    {/* Header do Clã */}
                    <div className="rounded-2xl border border-violet-900/60 bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 p-6 shadow-xl flex items-center justify-between">
                        <div>
                            <div className="text-xs text-violet-400 font-bold uppercase tracking-widest mb-1">Nível {clanData.level}</div>
                            <h2 className="text-2xl font-black text-white">{clanData.name}</h2>
                            <p className="text-sm text-zinc-400 mt-1 max-w-sm">{clanData.description || "O Salão Sagrado do Clã"}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black mb-1">
                                {(clanData.level * 5000 - clanData.experience).toLocaleString()}
                            </div>
                            <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Restantes pro Nv {clanData.level + 1}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Area de Doação */}
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Coins size={18} className="text-amber-400" />
                                <h3 className="text-sm font-bold text-zinc-200">Contribuição</h3>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                Doe para ajudar seu clã a subir de nível. <br className="hidden sm:block" />
                                10 Gold = 1 EXP | 1 Cristal = 5 EXP
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleDonate(500, "gold")} disabled={isDonating}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-900/30 bg-amber-950/20 hover:bg-amber-900/40 transition-all text-amber-200"
                                >
                                    <span className="text-lg font-black mb-1">500</span>
                                    <span className="text-[10px] uppercase font-bold">Gold 🟡</span>
                                </button>
                                <button onClick={() => handleDonate(100, "crystals")} disabled={isDonating}
                                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-cyan-900/30 bg-cyan-950/20 hover:bg-cyan-900/40 transition-all text-cyan-200"
                                >
                                    <span className="text-lg font-black mb-1">100</span>
                                    <span className="text-[10px] uppercase font-bold">Cristais 💎</span>
                                </button>
                            </div>
                        </div>

                        {/* Buffs Ativos */}
                        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap size={18} className="text-emerald-400" />
                                <h3 className="text-sm font-bold text-emerald-200">Buffs Passivos</h3>
                            </div>
                            <p className="text-xs text-emerald-400/70 mb-5 pb-4 border-b border-emerald-900/30">
                                {clanBuffs.description}
                            </p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300 font-bold">❤️ Vida Bônus</span>
                                    <span className="text-emerald-400 font-black">+{clanBuffs.buffs.hp_bonus_pct * 100}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300 font-bold">⚔️ Ataque Bônus</span>
                                    <span className="text-emerald-400 font-black">+{clanBuffs.buffs.atk_bonus_pct * 100}%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300 font-bold">🛡️ Defesa Bônus</span>
                                    <span className="text-emerald-400 font-black">+{clanBuffs.buffs.def_bonus_pct * 100}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
