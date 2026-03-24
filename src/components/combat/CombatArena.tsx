"use client";

import { useCombatReplay, CombatTick } from "@/hooks/useCombatReplay";
import { HeroCard, HeroState } from "./HeroCard";
import { motion } from "framer-motion";

interface CombatArenaProps {
    initialAttackers: HeroState[];
    initialDefenders: HeroState[];
    log: CombatTick[] | null;
}

export function CombatArena({ initialAttackers, initialDefenders, log }: CombatArenaProps) {
    const {
        attackers,
        defenders,
        currentTick,
        totalTicks,
        isPlaying,
        combatEventText,
        combatMessages,
        togglePlay,
        reset,
    } = useCombatReplay(initialAttackers, initialDefenders, log);

    // Helper to render a 3x3 grid (Slots 1 to 9)
    const renderGrid = (heroes: HeroState[], isEnemy: boolean) => {
        // 3x3 grid layout (slots 1-9). Each slot rendered as its own cell.
        return (
            <div className="grid grid-cols-3 gap-2 w-full max-w-[450px]">
                {Array.from({ length: 9 }).map((_, i) => {
                    const slotNumber = i + 1;
                    // Find hero by their actual team_slot — not by array index (bug fix)
                    const heroInSlot = heroes.find(h => (h as any).team_slot === slotNumber);

                    return (
                        <div
                            key={slotNumber}
                            className="aspect-[3/4] rounded-lg border border-white/5 bg-black/20 flex flex-col items-center justify-center relative"
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-4xl pointer-events-none">
                                {slotNumber}
                            </div>
                            {heroInSlot && (
                                <HeroCard key={heroInSlot.id} hero={heroInSlot} isEnemy={isEnemy} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-zinc-900 to-red-900/10 z-0 pointer-events-none" />

            {/* Top Bar Controls */}
            <div className="z-10 w-full max-w-5xl flex justify-between items-center bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl mb-8">
                <div>
                    <h2 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        ARENA SIMULATOR
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Tick: {currentTick} / {totalTicks}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={reset}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-bold transition-all"
                    >
                        Reset
                    </button>
                    <button
                        onClick={togglePlay}
                        disabled={!log || currentTick >= totalTicks}
                        className="px-6 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-sm font-bold transition-all disabled:opacity-50"
                    >
                        {isPlaying ? "Pause" : "Play Battle"}
                    </button>
                </div>
            </div>

            {/* Center Event Caster */}
            <div className="z-10 h-16 mb-4 flex items-center justify-center">
                {combatEventText && (
                    <motion.div
                        key={combatEventText}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2 rounded-full bg-zinc-800/80 backdrop-blur-md border border-zinc-700 shadow-xl text-yellow-400 font-bold tracking-wide"
                    >
                        {combatEventText}
                    </motion.div>
                )}
            </div>

            {/* The Battlefield */}
            <div className="z-10 w-full max-w-7xl flex flex-col xl:flex-row items-start justify-between gap-8 relative perspective-[1000px]">

                {/* Left Side: The Battlefield */}
                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 w-full relative">
                    {/* VS Badge */}
                    <div className="hidden lg:flex absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-zinc-900 border-4 border-zinc-800 items-center justify-center z-50 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                        <span className="font-black italic text-2xl bg-gradient-to-br from-zinc-300 to-zinc-600 bg-clip-text text-transparent">VS</span>
                    </div>

                    {/* ---------------- ATTACKERS (LEFT) ---------------- */}
                    <div className="flex flex-col items-center w-full lg:w-1/2">
                        <h3 className="text-blue-400 font-bold tracking-widest mb-4 uppercase text-sm drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                            Equipe Aliada
                        </h3>
                        {renderGrid(attackers, false)}
                    </div>

                    {/* ---------------- DEFENDERS (RIGHT) ---------------- */}
                    <div className="flex flex-col items-center w-full lg:w-1/2">
                        <h3 className="text-red-400 font-bold tracking-widest mb-4 uppercase text-sm drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            Equipe Inimiga
                        </h3>
                        {renderGrid(defenders, true)}
                    </div>
                </div>

                {/* Right Side: Combat Log Chat */}
                <div className="w-full xl:w-[320px] h-[500px] bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col shadow-2xl shrink-0">
                    <h3 className="text-zinc-300 font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2 mb-3">
                        Combat Log
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {combatMessages.length === 0 ? (
                            <p className="text-zinc-600 text-xs italic text-center mt-10">
                                A batalha ainda não começou...
                            </p>
                        ) : (
                            combatMessages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-zinc-800/50 rounded-lg p-2 text-[11px] font-mono text-zinc-300 border-l-2 border-indigo-500"
                                >
                                    {msg}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
