"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, PlayerWallet } from "@/lib/api";
import { Sparkles, Shield, Zap, Heart, Star, Lock, Check } from "lucide-react";

// =============================================================================
// GUARDIAN SPIRIT TYPES
// =============================================================================

export interface GuardianSpirit {
    id: string;
    name: string;
    element: "Fogo" | "Gelo" | "Sombra" | "Luz" | "Natureza";
    rarity: "SSS" | "SS" | "S" | "A";
    level: number;
    passive_name: string;
    passive_description: string;
    stat_bonus: { hp: number; atk: number; def: number; spd: number };
    is_equipped: boolean;
}

const ELEMENT_STYLE: Record<string, { icon: string; gradient: string; border: string; text: string }> = {
    Fogo:     { icon: "🔥", gradient: "from-orange-950/50 to-red-950/30",     border: "border-orange-600/50", text: "text-orange-300" },
    Gelo:     { icon: "❄️", gradient: "from-cyan-950/50 to-blue-950/30",      border: "border-cyan-600/50",   text: "text-cyan-300" },
    Sombra:   { icon: "🌑", gradient: "from-slate-950/50 to-violet-950/30",   border: "border-violet-600/50", text: "text-violet-300" },
    Luz:      { icon: "✨", gradient: "from-amber-950/50 to-yellow-950/30",   border: "border-amber-500/50",  text: "text-amber-300" },
    Natureza: { icon: "🌿", gradient: "from-emerald-950/50 to-green-950/30",  border: "border-emerald-600/50",text: "text-emerald-300" },
};

const RARITY_BORDER: Record<string, string> = {
    SSS: "border-amber-500/60",
    SS:  "border-purple-500/60",
    S:   "border-blue-500/60",
    A:   "border-emerald-500/60",
};

// =============================================================================
// SPIRIT CARD
// =============================================================================

function SpiritCard({ spirit, isSelected, onSelect, onEquip }: {
    spirit: GuardianSpirit;
    isSelected: boolean;
    onSelect: () => void;
    onEquip: () => void;
}) {
    const elem = ELEMENT_STYLE[spirit.element] || ELEMENT_STYLE["Fogo"];

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            className={`
                relative rounded-xl border p-4 cursor-pointer transition-all overflow-hidden
                ${isSelected ? `${elem.border} ring-2 ring-white/20 ${elem.gradient.replace("from-", "bg-gradient-to-br from-")}` :
                  `border-zinc-800 bg-zinc-900/60 hover:border-zinc-600`}
            `}
            onClick={onSelect}
        >
            {/* Equipped badge */}
            {spirit.is_equipped && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Check size={10} className="text-emerald-400" />
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${elem.border} border bg-black/30 flex items-center justify-center text-lg`}>
                    {elem.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white truncate">{spirit.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black ${spirit.rarity === "SSS" ? "text-amber-300" : spirit.rarity === "SS" ? "text-purple-300" : spirit.rarity === "S" ? "text-blue-300" : "text-emerald-300"}`}>
                            {spirit.rarity}
                        </span>
                        <span className="text-[9px] text-zinc-600">·</span>
                        <span className={`text-[9px] ${elem.text}`}>{spirit.element}</span>
                        <span className="text-[9px] text-zinc-600">· Lv.{spirit.level}</span>
                    </div>
                </div>
            </div>

            {/* Passive */}
            <div className="bg-black/20 rounded-lg px-3 py-2 mb-3">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Passiva</div>
                <div className="text-xs text-zinc-300 font-medium leading-tight">{spirit.passive_name}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1 text-center">
                {[
                    { l: "HP",  v: spirit.stat_bonus.hp,  c: "text-emerald-400" },
                    { l: "ATK", v: spirit.stat_bonus.atk, c: "text-red-400" },
                    { l: "DEF", v: spirit.stat_bonus.def, c: "text-blue-400" },
                    { l: "SPD", v: spirit.stat_bonus.spd, c: "text-yellow-400" },
                ].map((s) => (
                    <div key={s.l}>
                        <div className={`text-xs font-bold ${s.c}`}>+{s.v}</div>
                        <div className="text-[8px] text-zinc-600">{s.l}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

// =============================================================================
// SUMMON RESULT
// =============================================================================

function SummonResult({ spirit, onClose }: { spirit: GuardianSpirit; onClose: () => void }) {
    const elem = ELEMENT_STYLE[spirit.element] || ELEMENT_STYLE["Fogo"];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.3, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-2xl border-2 ${RARITY_BORDER[spirit.rarity]} bg-gradient-to-br ${elem.gradient.replace("from-", "")} bg-zinc-900 p-8 shadow-2xl text-center max-w-xs`}
            >
                <div className="text-5xl mb-4">{elem.icon}</div>
                <div className={`text-xs font-black uppercase tracking-widest mb-2 ${
                    spirit.rarity === "SSS" ? "text-amber-300" : spirit.rarity === "SS" ? "text-purple-300" : "text-blue-300"
                }`}>
                    {spirit.rarity} Guardian
                </div>
                <h2 className="text-2xl font-black text-white mb-1">{spirit.name}</h2>
                <p className={`text-sm ${elem.text} mb-4`}>{spirit.element}</p>

                <div className="bg-black/30 rounded-xl p-3 mb-4">
                    <div className="text-xs font-bold text-zinc-400 mb-1">✦ {spirit.passive_name}</div>
                    <p className="text-xs text-zinc-300">{spirit.passive_description}</p>
                </div>

                <button onClick={onClose}
                    className="px-8 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-all"
                >
                    Coletar
                </button>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// GUARDIAN SPIRIT PANEL — MAIN
// =============================================================================

interface GuardianSpiritPanelProps {
    playerId: string;
    spirits: GuardianSpirit[];
    wallet: PlayerWallet;
    onWalletUpdate: (w: PlayerWallet) => void;
    onSpiritsUpdate: (spirits: GuardianSpirit[]) => void;
}

export function GuardianSpiritPanel({ playerId, spirits, wallet, onWalletUpdate, onSpiritsUpdate }: GuardianSpiritPanelProps) {
    const [selected, setSelected] = useState<GuardianSpirit | null>(null);
    const [summonResult, setSummonResult] = useState<GuardianSpirit | null>(null);
    const [isSummoning, setIsSummoning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSummon = wallet.spirit_tickets >= 1;

    const handleSummon = async () => {
        setIsSummoning(true);
        setError(null);
        try {
            const res = await api.post(`/guardians/summon?player_id=${playerId}`);
            const newSpirit: GuardianSpirit = res.data.spirit;
            setSummonResult(newSpirit);
            onSpiritsUpdate([...spirits, newSpirit]);
            if (res.data.wallet_state) onWalletUpdate(res.data.wallet_state);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro na invocação.");
        } finally {
            setIsSummoning(false);
        }
    };

    const handleEquip = async (spirit: GuardianSpirit) => {
        try {
            await api.post(`/guardians/${spirit.id}/equip?player_id=${playerId}`);
            const updated = spirits.map((s) => ({
                ...s,
                is_equipped: s.id === spirit.id,
            }));
            onSpiritsUpdate(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao equipar.");
        }
    };

    const sorted = [...spirits].sort((a, b) => {
        const rarityOrder: Record<string, number> = { SSS: 0, SS: 1, S: 2, A: 3 };
        return (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99);
    });

    return (
        <div className="space-y-6">
            {/* Header + Summon */}
            <div className="rounded-2xl border border-indigo-800/40 bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-zinc-900 p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 text-[100px] opacity-5 leading-none pointer-events-none select-none">✨</div>
                <div className="relative z-10">
                    <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">Guardiões Espirituais</div>
                    <h2 className="text-xl font-black text-white mb-1">Invocar Guardião</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Guardiões concedem bônus passivos e stats ao seu time. Cada jogador equipa 1 ativo.
                    </p>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={canSummon ? { scale: 1.02 } : {}}
                            whileTap={canSummon ? { scale: 0.97 } : {}}
                            onClick={handleSummon}
                            disabled={!canSummon || isSummoning}
                            className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
                                canSummon
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-violet-500/20"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }`}
                        >
                            {isSummoning ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Invocando...</>
                            ) : (
                                <><Sparkles size={15} /> Invocar (1 Ticket)</>
                            )}
                        </motion.button>
                        <div className="text-sm text-zinc-400">
                            <span className="text-indigo-300 font-bold">{wallet.spirit_tickets}</span> tickets restantes
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-center">{error}</div>
            )}

            {/* Collection */}
            {sorted.length > 0 ? (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                        Sua Coleção ({sorted.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {sorted.map((spirit) => (
                            <SpiritCard
                                key={spirit.id}
                                spirit={spirit}
                                isSelected={selected?.id === spirit.id}
                                onSelect={() => setSelected(spirit)}
                                onEquip={() => handleEquip(spirit)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center space-y-3">
                    <div className="text-4xl opacity-30">✨</div>
                    <p className="text-zinc-500 text-sm">Nenhum guardião invocado. Use seus tickets!</p>
                </div>
            )}

            {/* Detail panel */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`rounded-2xl border ${ELEMENT_STYLE[selected.element]?.border || "border-zinc-700"} bg-gradient-to-br ${ELEMENT_STYLE[selected.element]?.gradient || "from-zinc-900 to-zinc-900"} p-5`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-3xl">{ELEMENT_STYLE[selected.element]?.icon || "✨"}</div>
                            <div className="flex-1">
                                <div className="font-black text-white">{selected.name}</div>
                                <div className="text-xs text-zinc-400 mt-0.5">{selected.rarity} · {selected.element} · Lv.{selected.level}</div>

                                <div className="bg-black/20 rounded-lg p-3 mt-3">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">✦ Passiva: {selected.passive_name}</div>
                                    <p className="text-xs text-zinc-300">{selected.passive_description}</p>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                                    {[
                                        { l: "HP",  v: selected.stat_bonus.hp,  c: "text-emerald-400", ic: <Heart size={10} /> },
                                        { l: "ATK", v: selected.stat_bonus.atk, c: "text-red-400",     ic: <Zap size={10} /> },
                                        { l: "DEF", v: selected.stat_bonus.def, c: "text-blue-400",    ic: <Shield size={10} /> },
                                        { l: "SPD", v: selected.stat_bonus.spd, c: "text-yellow-400",  ic: <Star size={10} /> },
                                    ].map((s) => (
                                        <div key={s.l} className="bg-black/20 rounded-lg py-2">
                                            <div className={`${s.c} opacity-60 flex justify-center`}>{s.ic}</div>
                                            <div className={`text-sm font-bold ${s.c}`}>+{s.v}</div>
                                            <div className="text-[8px] text-zinc-600">{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleEquip(selected)}
                                    disabled={selected.is_equipped}
                                    className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        selected.is_equipped
                                            ? "bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 cursor-default"
                                            : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200"
                                    }`}
                                >
                                    {selected.is_equipped ? "✓ Equipado" : "Equipar Guardião"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Summon result overlay */}
            <AnimatePresence>
                {summonResult && (
                    <SummonResult spirit={summonResult} onClose={() => setSummonResult(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
