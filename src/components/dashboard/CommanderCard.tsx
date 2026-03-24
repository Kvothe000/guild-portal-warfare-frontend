"use client";

import { motion } from "framer-motion";
import { Commander, Hero } from "@/lib/api";
import { Shield, Swords, Zap, Heart } from "lucide-react";

// Labels e cores por classe
const CLASS_META: Record<string, { label: string; icon: string; faction: string; gradient: string; border: string }> = {
    FlameInquisitor: {
        label: "Inquisidor de Chama",
        icon: "🔥",
        faction: "Vanguarda",
        gradient: "from-orange-900/60 to-red-900/40",
        border: "border-orange-500/40",
    },
    EtherChronist: {
        label: "Cronista do Éter",
        icon: "⏳",
        faction: "Arcano",
        gradient: "from-violet-900/60 to-indigo-900/40",
        border: "border-violet-500/40",
    },
    SpectralBlade: {
        label: "Lâmina Espectral",
        icon: "🗡️",
        faction: "Sombras",
        gradient: "from-slate-900/60 to-red-950/40",
        border: "border-red-700/40",
    },
    StoneCleric: {
        label: "Clérigo da Pedra",
        icon: "🛡️",
        faction: "Vanguarda",
        gradient: "from-stone-900/60 to-amber-950/40",
        border: "border-amber-600/40",
    },
    LunarHunter: {
        label: "Caçador Lunar",
        icon: "🌙",
        faction: "Arcano",
        gradient: "from-sky-900/60 to-cyan-900/40",
        border: "border-cyan-500/40",
    },
};

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className="bg-zinc-950/70 rounded-xl p-3 flex flex-col items-center gap-1 border border-zinc-800/50">
            <div className={`${color} opacity-70`}>{icon}</div>
            <span className="text-lg font-black text-white">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</span>
        </div>
    );
}

interface CommanderCardProps {
    commander: Commander;
    username: string;
    arenaPoints?: number;
}

export function CommanderCard({ commander, username, arenaPoints }: CommanderCardProps) {
    const meta = CLASS_META[commander.order_class] || { label: commander.order_class, icon: "⚔️", faction: "—", gradient: "from-zinc-900 to-zinc-900", border: "border-zinc-700" };
    const hpPct = (commander.current_hp / commander.max_hp) * 100;
    const expToNextLevel = commander.level * 1000;
    const expPct = Math.min(100, (commander.experience / expToNextLevel) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`rounded-2xl border bg-gradient-to-br ${meta.gradient} ${meta.border} shadow-2xl overflow-hidden`}
        >
            {/* Top — Commander Identity */}
            <div className="relative p-6 pb-4">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 text-[120px] leading-none opacity-5 select-none pointer-events-none font-black">
                    {meta.icon}
                </div>

                <div className="relative z-10 flex items-start gap-5">
                    {/* Avatar placeholder */}
                    <div className={`w-20 h-20 rounded-xl border-2 ${meta.border} bg-zinc-900/60 flex items-center justify-center text-4xl shadow-lg shrink-0`}>
                        {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-0.5">
                            {meta.faction} — Lv. {commander.level}
                        </div>
                        <h2 className="text-xl font-black text-white truncate">{username}</h2>
                        <p className="text-sm text-zinc-300 italic">{meta.label}</p>

                        {arenaPoints !== undefined && (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1 text-xs font-bold text-amber-300 border border-amber-700/40">
                                🏆 {arenaPoints.toLocaleString()} pts Arena
                            </div>
                        )}
                    </div>
                </div>

                {/* HP Bar */}
                <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400 font-mono">
                        <span>HP do Comandante</span>
                        <span>{commander.current_hp.toLocaleString()} / {commander.max_hp.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPct}%` }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* EXP Bar */}
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                        <span>Experiência</span>
                        <span>{commander.experience.toLocaleString()} / {expToNextLevel.toLocaleString()}</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${expPct}%` }}
                            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-6 pb-6 grid grid-cols-4 gap-2">
                <StatChip icon={<Heart size={14} />} label="HP" value={commander.max_hp} color="text-emerald-400" />
                <StatChip icon={<Swords size={14} />} label="ATK" value={commander.attack} color="text-red-400" />
                <StatChip icon={<Shield size={14} />} label="DEF" value={commander.defense} color="text-blue-400" />
                <StatChip icon={<Zap size={14} />} label="SPD" value={commander.speed} color="text-yellow-400" />
            </div>
        </motion.div>
    );
}

// =============================================================================
// HERO ROSTER CARD — usado no dashboard de heróis
// =============================================================================

const RARITY_STYLE: Record<string, string> = {
    SSS: "border-amber-500/60 bg-gradient-to-b from-amber-950/60 to-zinc-900 text-amber-200",
    SS:  "border-purple-500/60 bg-gradient-to-b from-purple-950/60 to-zinc-900 text-purple-200",
    S:   "border-blue-500/60 bg-gradient-to-b from-blue-950/60 to-zinc-900 text-blue-200",
    A:   "border-emerald-500/60 bg-gradient-to-b from-emerald-950/60 to-zinc-900 text-emerald-200",
    B:   "border-zinc-700/50 bg-zinc-900 text-zinc-400",
};

const FACTION_ICON: Record<string, string> = {
    Vanguard: "🛡️",
    Arcane:   "✨",
    Shadow:   "🗡️",
    Neutral:  "⚔️",
};

export function HeroRosterCard({ hero }: { hero: Hero }) {
    const style = RARITY_STYLE[hero.rarity] || RARITY_STYLE["B"];
    const hpPct = (hero.current_hp / hero.max_hp) * 100;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`p-4 rounded-xl border ${style} flex flex-col gap-3 cursor-default relative overflow-hidden`}
        >
            {/* Rarity badge */}
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tracking-widest opacity-80">{hero.rarity}</span>
                <span className="text-base">{FACTION_ICON[hero.faction] || "⚔️"}</span>
            </div>

            {/* Portrait */}
            <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-2xl shadow-inner">
                    {FACTION_ICON[hero.faction] || "⚔️"}
                </div>
            </div>

            {/* Info */}
            <div className="text-center">
                <div className="font-black text-sm leading-tight truncate" title={hero.name}>{hero.name}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">{hero.role} · Lv.{hero.level}</div>
            </div>

            {/* HP Bar */}
            <div className="space-y-0.5">
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all"
                        style={{ width: `${hpPct}%` }}
                    />
                </div>
            </div>

            {/* Breakthrough indicator */}
            {hero.breakthrough_level > 0 && (
                <div className="absolute top-1.5 right-1.5 text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                    BT{hero.breakthrough_level}
                </div>
            )}

            {/* In team indicator */}
            {hero.team_slot !== null && (
                <div className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                    Slot {hero.team_slot}
                </div>
            )}
        </motion.div>
    );
}
