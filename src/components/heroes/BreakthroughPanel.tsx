"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero, api } from "@/lib/api";
import { Star, Flame, ChevronUp, Zap, Lock } from "lucide-react";

// =============================================================================
// BREAKTHROUGH CONFIG
// =============================================================================

interface BTLevel {
    level: number;
    label: string;
    fragments_required: number;
    stat_bonus: string;
    border: string;
    bg: string;
    glow: string;
    starColor: string;
}

const BT_LEVELS: BTLevel[] = [
    { level: 0, label: "Base",       fragments_required: 0,   stat_bonus: "—",               border: "border-zinc-700",     bg: "bg-zinc-900",           glow: "",                       starColor: "text-zinc-600" },
    { level: 1, label: "BT I",       fragments_required: 30,  stat_bonus: "+5% HP, +3% ATK",  border: "border-emerald-700",  bg: "bg-emerald-950/30",     glow: "shadow-emerald-500/20",  starColor: "text-emerald-400" },
    { level: 2, label: "BT II",      fragments_required: 60,  stat_bonus: "+10% HP, +7% ATK, +Skill Slot", border: "border-blue-600",     bg: "bg-blue-950/30",        glow: "shadow-blue-500/20",     starColor: "text-blue-400" },
    { level: 3, label: "BT III",     fragments_required: 100, stat_bonus: "+18% HP, +12% ATK, +DEF",       border: "border-purple-600",   bg: "bg-purple-950/30",      glow: "shadow-purple-500/20",   starColor: "text-purple-400" },
    { level: 4, label: "BT IV",      fragments_required: 150, stat_bonus: "+25% All Stats",   border: "border-amber-500",    bg: "bg-amber-950/30",       glow: "shadow-amber-500/25",    starColor: "text-amber-400" },
    { level: 5, label: "BT V",       fragments_required: 200, stat_bonus: "+35% All Stats, +Ultimate Evolve",  border: "border-rose-500",     bg: "bg-rose-950/30",        glow: "shadow-rose-500/25",     starColor: "text-rose-400" },
    { level: 6, label: "Ascensão",   fragments_required: 300, stat_bonus: "+50% All Stats, +Modelo Ascendido", border: "border-amber-400",    bg: "bg-gradient-to-br from-amber-950/50 to-orange-950/30", glow: "shadow-amber-400/30", starColor: "text-amber-300" },
];

const RARITY_FRAG_ICON: Record<string, string> = {
    SSS: "💎",
    SS:  "🔮",
    S:   "🔵",
    A:   "🟢",
    B:   "⚪",
};

// =============================================================================
// FRAGMENT PROGRESS BAR
// =============================================================================

function FragmentBar({ current, required, color }: { current: number; required: number; color: string }) {
    const pct = Math.min(100, (current / required) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Fragmentos</span>
                <span className="text-zinc-200">{current} / {required}</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

// =============================================================================
// BT LEVEL NODE
// =============================================================================

function BTNode({ btLevel, isCurrent, isCompleted, isLocked }: {
    btLevel: BTLevel;
    isCurrent: boolean;
    isCompleted: boolean;
    isLocked: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all text-sm
                ${isCompleted ? `${btLevel.border} ${btLevel.bg} ${btLevel.glow} shadow-lg` :
                  isCurrent   ? `${btLevel.border} ${btLevel.bg} animate-pulse shadow-lg ${btLevel.glow}` :
                  isLocked    ? "border-zinc-800 bg-zinc-950 opacity-50" : `${btLevel.border} ${btLevel.bg}`}
            `}>
                {isCompleted ? <Star size={16} className={`${btLevel.starColor} fill-current`} /> :
                 isLocked    ? <Lock size={12} className="text-zinc-700" /> :
                 isCurrent   ? <ChevronUp size={16} className={btLevel.starColor} /> :
                               <span className="text-zinc-600 text-xs">{btLevel.level}</span>}
            </div>
            <span className={`text-[9px] font-bold ${isCompleted ? btLevel.starColor : isCurrent ? btLevel.starColor : "text-zinc-700"}`}>
                {btLevel.label}
            </span>
        </div>
    );
}

// =============================================================================
// MAIN BREAKTHROUGH PANEL
// =============================================================================

interface BreakthroughPanelProps {
    hero: Hero;
    fragments: number; // fragmentos disponíveis deste herói
    onBreakthroughSuccess: (updatedHero: Hero) => void;
}

export function BreakthroughPanel({ hero, fragments, onBreakthroughSuccess }: BreakthroughPanelProps) {
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentBT = BT_LEVELS[hero.breakthrough_level] || BT_LEVELS[0];
    const nextBT = BT_LEVELS[hero.breakthrough_level + 1];
    const isMaxed = !nextBT;
    const canUpgrade = nextBT && fragments >= nextBT.fragments_required;

    const handleBreakthrough = async () => {
        if (!nextBT || !canUpgrade) return;
        setIsUpgrading(true);
        setError(null);
        try {
            const res = await api.post(`/heroes/${hero.id}/breakthrough`);
            setShowCelebration(true);
            setTimeout(() => {
                setShowCelebration(false);
                onBreakthroughSuccess(res.data);
            }, 2500);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Falha no Breakthrough.");
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Hero identity */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${currentBT.bg} ${currentBT.border} border flex items-center justify-center text-2xl shadow-lg ${currentBT.glow}`}>
                    {RARITY_FRAG_ICON[hero.rarity] || "⚔️"}
                </div>
                <div className="flex-1">
                    <div className="font-black text-white">{hero.name}</div>
                    <div className="text-xs text-zinc-400">{hero.rarity} · {hero.faction} · {hero.role}</div>
                    <div className={`text-xs font-bold mt-0.5 ${currentBT.starColor}`}>
                        {isMaxed ? "✦ Ascensão Completa ✦" : currentBT.label}
                    </div>
                </div>
            </div>

            {/* BT Path — visual nodes */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="flex items-center justify-between">
                    {BT_LEVELS.map((bt, i) => (
                        <div key={bt.level} className="flex items-center">
                            <BTNode
                                btLevel={bt}
                                isCurrent={bt.level === hero.breakthrough_level}
                                isCompleted={bt.level < hero.breakthrough_level}
                                isLocked={bt.level > hero.breakthrough_level + 1}
                            />
                            {i < BT_LEVELS.length - 1 && (
                                <div className={`w-4 sm:w-6 h-0.5 mx-1 rounded-full ${
                                    bt.level < hero.breakthrough_level ? "bg-emerald-600" : "bg-zinc-800"
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Current x Next comparison */}
            {nextBT && (
                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl border p-3 ${currentBT.border} ${currentBT.bg}`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Atual</div>
                        <div className={`text-sm font-bold ${currentBT.starColor}`}>{currentBT.label}</div>
                        <p className="text-xs text-zinc-400 mt-1">{currentBT.stat_bonus}</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${nextBT.border} ${nextBT.bg} relative overflow-hidden`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Próximo</div>
                        <div className={`text-sm font-bold ${nextBT.starColor}`}>{nextBT.label}</div>
                        <p className="text-xs text-zinc-400 mt-1">{nextBT.stat_bonus}</p>
                        <Flame size={40} className="absolute -bottom-2 -right-2 opacity-5" />
                    </div>
                </div>
            )}

            {/* Fragment bar */}
            {nextBT && (
                <FragmentBar
                    current={fragments}
                    required={nextBT.fragments_required}
                    color={`bg-gradient-to-r ${
                        nextBT.level <= 2 ? "from-emerald-500 to-green-400" :
                        nextBT.level <= 4 ? "from-purple-500 to-indigo-400" :
                                            "from-amber-500 to-orange-400"
                    }`}
                />
            )}

            {/* Action */}
            {isMaxed ? (
                <div className="rounded-xl bg-gradient-to-r from-amber-950/40 to-orange-950/30 border border-amber-500/40 p-4 text-center">
                    <div className="text-lg">👑</div>
                    <p className="text-amber-300 font-bold text-sm mt-1">Ascensão Máxima Alcançada</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Este herói atingiu seu potencial máximo.</p>
                </div>
            ) : (
                <motion.button
                    whileHover={canUpgrade ? { scale: 1.02 } : {}}
                    whileTap={canUpgrade ? { scale: 0.97 } : {}}
                    onClick={handleBreakthrough}
                    disabled={!canUpgrade || isUpgrading}
                    className={`w-full py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-3 ${
                        canUpgrade
                            ? `bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/20`
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                >
                    {isUpgrading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ascendendo...</>
                    ) : canUpgrade ? (
                        <><ChevronUp size={18} /> Breakthrough para {nextBT.label}</>
                    ) : (
                        `Faltam ${nextBT.fragments_required - fragments} fragmentos`
                    )}
                </motion.button>
            )}

            {error && (
                <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                    {error}
                </div>
            )}

            {/* Celebration overlay */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotateZ: -10 }}
                            animate={{ scale: 1, rotateZ: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="text-center space-y-4"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-7xl"
                            >
                                ⭐
                            </motion.div>
                            <div className={`text-3xl font-black ${nextBT?.starColor || "text-white"}`}>
                                {nextBT?.label} Desbloqueado!
                            </div>
                            <p className="text-zinc-400 text-sm">{nextBT?.stat_bonus}</p>
                            {/* Particle burst */}
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full bg-amber-400"
                                    style={{ left: "50%", top: "50%" }}
                                    animate={{
                                        x: Math.cos((i / 12) * Math.PI * 2) * 120,
                                        y: Math.sin((i / 12) * Math.PI * 2) * 120,
                                        opacity: [1, 0],
                                        scale: [1, 0],
                                    }}
                                    transition={{ duration: 1.2, delay: 0.2 + i * 0.05 }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
