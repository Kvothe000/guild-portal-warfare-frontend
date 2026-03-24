"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderClass } from "@/lib/api";

// =============================================================================
// CLASS DATA — Dados visuais e temáticos de cada classe de Comandante
// =============================================================================

interface ClassInfo {
    id: OrderClass;
    name: string;
    title: string;
    faction: "Vanguard" | "Arcane" | "Shadow";
    role: string;
    lore: string;
    uniqueTrait: string;
    stats: { hp: number; atk: number; def: number; spd: number };
    gradient: string;
    borderColor: string;
    glowColor: string;
    icon: string;
}

const CLASSES: ClassInfo[] = [
    {
        id: "FlameInquisitor",
        name: "Inquisidor de Chama",
        title: "Purificador da Vanguarda",
        faction: "Vanguard",
        role: "Carry / AoE",
        lore: "Nascido nas forjas subterrâneas de Valdris, o Inquisidor serve ao único deus que ainda responde: o fogo. Sua lâmina queima o que toca e sua presença no campo consume a energia dos inimigos.",
        uniqueTrait: "Basic tem 25% de chance de Repulse. Ultimate aplica Burn em todos os inimigos.",
        stats: { hp: 2000, atk: 180, def: 110, spd: 105 },
        gradient: "from-orange-950 via-red-900 to-zinc-900",
        borderColor: "border-orange-500/60",
        glowColor: "shadow-orange-500/30",
        icon: "🔥",
    },
    {
        id: "EtherChronist",
        name: "Cronista do Éter",
        title: "Arquiteto do Tempo",
        faction: "Arcane",
        role: "Control / Support",
        lore: "O Éter não é uma força bruta — é uma linguagem. O Cronista aprendeu a reescrever o fluxo do tempo, empurrando aliados para o presente e relegando inimigos ao esquecimento.",
        uniqueTrait: "Ultimate avança um aliado 100% na fila de turno. Cada Basic gera +5 Energia extra.",
        stats: { hp: 1700, atk: 140, def: 100, spd: 145 },
        gradient: "from-indigo-950 via-violet-900 to-zinc-900",
        borderColor: "border-violet-500/60",
        glowColor: "shadow-violet-500/30",
        icon: "⏳",
    },
    {
        id: "SpectralBlade",
        name: "Lâmina Espectral",
        title: "Executor das Sombras",
        faction: "Shadow",
        role: "Assassino",
        lore: "Não existe na luz. Sua existência é o espaço entre os golpes — o momento que o inimigo já está caindo mas ainda não percebeu. A Liga das Sombras não o criou. Ele criou a si mesmo.",
        uniqueTrait: "Ignora 30% da defesa inimiga. Ultimate garante Knockdown + Bleed no alvo.",
        stats: { hp: 1500, atk: 200, def: 90, spd: 155 },
        gradient: "from-zinc-950 via-slate-900 to-red-950",
        borderColor: "border-red-700/60",
        glowColor: "shadow-red-700/30",
        icon: "🗡️",
    },
    {
        id: "StoneCleric",
        name: "Clérigo da Pedra",
        title: "Bastião da Ordem",
        faction: "Vanguard",
        role: "Support / Tank",
        lore: "A Pedra não ataca. A Pedra sustenta. O Clérigo da Pedra é o motivo pelo qual seu time ainda está em pé quando todos os outros caíram. Sua fé não é em um deus — é em cada aliado a sua volta.",
        uniqueTrait: "Ultimate concede Shield ao time inteiro. Chase de Low Float cura o aliado com menor HP.",
        stats: { hp: 2400, atk: 110, def: 180, spd: 95 },
        gradient: "from-stone-900 via-zinc-900 to-amber-950",
        borderColor: "border-amber-600/60",
        glowColor: "shadow-amber-600/30",
        icon: "🛡️",
    },
    {
        id: "LunarHunter",
        name: "Caçador Lunar",
        title: "Flecha da Lua Crescente",
        faction: "Arcane",
        role: "Multihit / Chase",
        lore: "A lua não escolhe a quem ilumina. O Caçador Lunar também não — ele atira em todos os que a lua revela. Cada flecha é um link de corrente que conecta o ataque seguinte ao próximo.",
        uniqueTrait: "Basic Attack acerta 2 vezes. Passive ativa no COMBO_5 e COMBO_10.",
        stats: { hp: 1600, atk: 160, def: 95, spd: 135 },
        gradient: "from-sky-950 via-cyan-900 to-zinc-900",
        borderColor: "border-cyan-500/60",
        glowColor: "shadow-cyan-500/30",
        icon: "🌙",
    },
];

// =============================================================================
// STAT BAR COMPONENT
// =============================================================================

function StatBar({ label, value, max = 2500, color }: { label: string; value: number; max?: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>{label}</span>
                <span className="text-zinc-200 font-semibold">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                />
            </div>
        </div>
    );
}

// =============================================================================
// CLASS SELECTION SCREEN
// =============================================================================

interface ClassSelectionProps {
    onSelect: (cls: OrderClass) => void;
    isLoading?: boolean;
}

export function ClassSelection({ onSelect, isLoading }: ClassSelectionProps) {
    const [selected, setSelected] = useState<OrderClass | null>(null);
    const [hoveredClass, setHoveredClass] = useState<ClassInfo | null>(null);
    const displayClass = CLASSES.find((c) => c.id === selected) || hoveredClass;

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-white/10"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0, 0.6, 0],
                            scale: [0, 1.5, 0],
                            y: [0, -30, -60],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            {/* Ambient glow based on selected class */}
            <AnimatePresence>
                {displayClass && (
                    <motion.div
                        key={displayClass.id}
                        className={`absolute inset-0 pointer-events-none`}
                        style={{
                            background: `radial-gradient(ellipse at center, ${
                                displayClass.faction === "Vanguard" ? "rgba(251,146,60,0.06)" :
                                displayClass.faction === "Arcane"   ? "rgba(167,139,250,0.06)" :
                                "rgba(239,68,68,0.06)"
                            } 0%, transparent 70%)`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                className="text-center mb-12 z-10"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <p className="text-zinc-500 uppercase tracking-[0.4em] text-xs font-bold mb-3">Veil of Dominion</p>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
                    Escolha sua{" "}
                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                        Ordem
                    </span>
                </h1>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    O Comandante que você escolhe hoje definirá sua lenda em Valdris. Esta escolha não pode ser desfeita facilmente.
                </p>
            </motion.div>

            <div className="z-10 w-full max-w-6xl flex flex-col xl:flex-row gap-8 items-start">

                {/* Class Cards */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-3 xl:max-h-[520px] xl:overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {CLASSES.map((cls, i) => (
                        <motion.button
                            key={cls.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            onClick={() => setSelected(cls.id)}
                            onMouseEnter={() => setHoveredClass(cls)}
                            onMouseLeave={() => setHoveredClass(null)}
                            className={`
                                relative p-4 rounded-xl border text-left transition-all duration-200
                                ${selected === cls.id
                                    ? `${cls.borderColor} bg-gradient-to-r ${cls.gradient} shadow-xl ${cls.glowColor}`
                                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
                                }
                            `}
                        >
                            {selected === cls.id && (
                                <motion.div
                                    className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-white"
                                    layoutId="selected-dot"
                                />
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{cls.icon}</span>
                                <div>
                                    <div className="font-bold text-sm text-white leading-tight">{cls.name}</div>
                                    <div className="text-[11px] text-zinc-400 mt-0.5">{cls.role}</div>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Detail Panel */}
                <div className="flex-[2] xl:min-h-[520px]">
                    <AnimatePresence mode="wait">
                        {displayClass ? (
                            <motion.div
                                key={displayClass.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35 }}
                                className={`rounded-2xl border bg-gradient-to-br ${displayClass.gradient} ${displayClass.borderColor} p-8 shadow-2xl ${displayClass.glowColor}`}
                            >
                                {/* Class Header */}
                                <div className="flex items-start gap-5 mb-6">
                                    <div className={`w-20 h-20 rounded-2xl bg-black/30 border ${displayClass.borderColor} flex items-center justify-center text-4xl shadow-inner`}>
                                        {displayClass.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-1">
                                            {displayClass.faction} • {displayClass.role}
                                        </div>
                                        <h2 className="text-2xl font-black text-white leading-tight">{displayClass.name}</h2>
                                        <p className="text-sm text-zinc-300 italic mt-1">"{displayClass.title}"</p>
                                    </div>
                                </div>

                                {/* Lore */}
                                <p className="text-zinc-300 text-sm leading-relaxed mb-6 border-l-2 border-white/20 pl-4">
                                    {displayClass.lore}
                                </p>

                                {/* Unique Trait */}
                                <div className={`rounded-xl border ${displayClass.borderColor} bg-black/30 p-4 mb-6`}>
                                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">✦ Traço Único</div>
                                    <p className="text-sm text-zinc-100">{displayClass.uniqueTrait}</p>
                                </div>

                                {/* Stats */}
                                <div className="space-y-2.5">
                                    <StatBar label="HP" value={displayClass.stats.hp} max={2500} color="bg-emerald-500" />
                                    <StatBar label="ATK" value={displayClass.stats.atk} max={220} color="bg-red-500" />
                                    <StatBar label="DEF" value={displayClass.stats.def} max={220} color="bg-blue-500" />
                                    <StatBar label="SPD" value={displayClass.stats.spd} max={180} color="bg-yellow-400" />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/30 flex flex-col items-center justify-center p-8 xl:min-h-[520px] text-center"
                            >
                                <span className="text-5xl mb-4 opacity-30">⚔️</span>
                                <p className="text-zinc-500 text-sm">Passe o mouse sobre uma classe <br /> ou selecione para ver os detalhes</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Confirm Button */}
            <motion.div
                className="z-10 mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: selected ? 1 : 0.4, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <motion.button
                    onClick={() => selected && onSelect(selected)}
                    disabled={!selected || isLoading}
                    whileHover={selected ? { scale: 1.04 } : {}}
                    whileTap={selected ? { scale: 0.97 } : {}}
                    className={`
                        px-12 py-4 rounded-xl font-black text-lg tracking-wide transition-all duration-300
                        ${selected
                            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-2xl shadow-orange-500/40 hover:shadow-orange-400/60 cursor-pointer"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        }
                    `}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Jurando lealdade...
                        </div>
                    ) : selected ? (
                        `Jurar lealdade como ${CLASSES.find((c) => c.id === selected)?.name}`
                    ) : (
                        "Escolha uma classe para continuar"
                    )}
                </motion.button>
            </motion.div>
        </div>
    );
}
