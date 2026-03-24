"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, FastForward, X, Shield, Swords, Zap, Heart, Skull, ArrowRight } from "lucide-react";

export interface CombatViewerProps {
    combatLog: any[];
    winner: "attacker" | "defender";
    onClose: () => void;
}

export function CombatViewer({ combatLog, winner, onClose }: CombatViewerProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [visibleEvents, setVisibleEvents] = useState<any[]>([]);
    
    const maxTurns = combatLog.length;
    const isFinished = currentTurnIndex >= maxTurns;

    // Scrolling to bottom automatically
    const feedRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [visibleEvents]);

    // Main playback loop
    useEffect(() => {
        if (!isPlaying || isFinished) return;

        const baseDelay = 1200; // ms per turn
        const delay = baseDelay / speedMultiplier;

        const timer = setTimeout(() => {
            const turn = combatLog[currentTurnIndex];
            
            // Expand the turn into individual event objects for the feed
            const newEvents = turn.actions.map((act: any, idx: number) => ({
                id: `turn-${turn.tick}-act-${idx}`,
                tick: turn.tick,
                actor: turn.actor,
                side: turn.side,
                ...act
            }));

            // Add the "Turn Start" header as an event
            const turnHeader = {
                id: `turn-${turn.tick}-header`,
                type: "HEADER",
                tick: turn.tick,
                actor: turn.actor,
                side: turn.side
            };

            setVisibleEvents(prev => [...prev, turnHeader, ...newEvents]);
            setCurrentTurnIndex(prev => prev + 1);

        }, delay);

        return () => clearTimeout(timer);
    }, [isPlaying, currentTurnIndex, isFinished, combatLog, speedMultiplier]);

    // Render each event dynamically based on the effect_type
    const renderEvent = (evt: any) => {
        if (evt.type === "HEADER") {
            const isAttacker = evt.side === "attacker";
            return (
                <div key={evt.id} className={`flex items-center gap-3 my-4 py-2 border-y ${isAttacker ? 'border-indigo-900/30 text-indigo-300 bg-indigo-950/20' : 'border-rose-900/30 text-rose-300 bg-rose-950/20'} px-4`}>
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Turno {evt.tick}</span>
                    <span className="font-bold flex items-center gap-1.5"><ArrowRight size={14}/> {evt.actor} Age</span>
                </div>
            );
        }

        // Damage Action
        if (evt.effect_type === "Damage" || evt.effect_type === "Damage_Ignore_Def" || evt.effect_type === "Absorb_HP") {
            return (
                <motion.div initial={{ opacity: 0, x: evt.side === "attacker" ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} key={evt.id} className="flex flex-col gap-1 px-4 py-2 bg-zinc-900/40 rounded-lg ml-4 border-l-2 border-zinc-700">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="font-bold text-zinc-100">{evt.actor_name}</span> usou <span className="text-amber-300 font-semibold">{evt.skill_used}</span> em <span className="font-bold text-zinc-100">{evt.target_name}</span>
                    </div>
                    {(evt.damage !== undefined) && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-rose-400 font-black">- {evt.damage} HP</span>
                            {evt.is_crit && <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 rounded uppercase font-bold animate-pulse">Critical</span>}
                            {evt.is_shatter && <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 rounded uppercase font-bold animate-pulse">Shatter</span>}
                            <span className="text-zinc-600 ml-auto">{evt.target_hp_remaining} Restante</span>
                        </div>
                    )}
                    {evt.target_died && (
                        <div className="text-red-500 text-xs font-black flex items-center gap-1 mt-1"><Skull size={12}/> {evt.target_name} foi abatido!</div>
                    )}
                </motion.div>
            );
        }

        // Chase / Spirit Chase
        if (evt.effect_type === "CHASE_COMBO" || evt.effect_type === "SPIRIT_CHASE") {
            return (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={evt.id} className="flex flex-col gap-1 px-4 py-2 bg-indigo-950/20 rounded-lg ml-8 border-l-2 border-indigo-500">
                    <div className="flex items-center gap-2 text-sm text-indigo-200">
                        <Zap size={14} className="text-indigo-400 text-xs" />
                        <span className="font-bold text-indigo-100">{evt.actor_name}</span> perseguiu com <span className="text-indigo-300 font-semibold">{evt.skill_used}</span>
                    </div>
                    {evt.damage > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-rose-400 font-black">- {evt.damage} HP</span>
                            <span className="text-zinc-500 ml-auto">({evt.target_name})</span>
                        </div>
                    )}
                    {evt.target_died && (
                        <div className="text-red-500 text-xs font-black flex items-center gap-1 mt-1"><Skull size={12}/> {evt.target_name} foi abatido!</div>
                    )}
                    {evt.combo_count && (
                        <div className="text-amber-500/70 text-[9px] font-black uppercase mt-1 tracking-widest">{evt.combo_count} Hits Combo!</div>
                    )}
                </motion.div>
            );
        }

        // CCs and Buffs
        if (evt.effect_type === "CC_APPLIED" || evt.effect_type === "DOT_APPLIED") {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={evt.id} className="flex items-center gap-2 px-4 py-1 ml-4 text-xs text-orange-200">
                    <Zap size={12} className="text-orange-400" />
                    <span><span className="font-bold">{evt.target_name}</span> sofreu <span className="font-black text-orange-400 uppercase">{evt.status}</span> ({evt.duration} turnos)</span>
                </motion.div>
            );
        }

        // Heals
        if (evt.healed !== undefined) {
             return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={evt.id} className="flex items-center gap-2 px-4 py-1.5 ml-4 bg-emerald-950/20 rounded-lg text-xs text-emerald-200 border-l-2 border-emerald-500">
                    <Heart size={12} className="text-emerald-400" />
                    <span className="font-bold">{evt.target_name}</span> recuperou <span className="font-black text-emerald-400">+{evt.healed} HP</span>
                    {evt.shield_applied > 0 && <span className="text-cyan-400 font-bold flex items-center gap-1 ml-2"><Shield size={10}/> +{evt.shield_applied} Shield</span>}
                </motion.div>
            );
        }

        // Fallback
        return (
             <div key={evt.id} className="px-4 py-1 ml-4 text-xs text-zinc-500 italic">
                {evt.actor_name} realizou uma ação ({evt.effect_type}).
             </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-md">
            
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/50">
                        <Swords size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white leading-tight">Logs de Batalha</h2>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Resolução do Conflito</p>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Combat Feed */}
            <div 
                ref={feedRef}
                className="w-full max-w-2xl flex-1 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl overflow-y-auto custom-scrollbar p-2 pb-10"
                style={{ scrollBehavior: "smooth" }}
            >
                {visibleEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center flex-col gap-4 opacity-50">
                        <div className="w-8 h-8 border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin"/>
                        <p className="text-sm font-medium text-zinc-400">Iniciando embate...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 relative">
                        {/* Linha do tempo vertical pra dar estilo */}
                        <div className="absolute left-[31px] top-6 bottom-4 w-px bg-gradient-to-b from-zinc-800/80 via-zinc-800/40 to-transparent pointer-events-none" />
                        
                        {visibleEvents.map(evt => renderEvent(evt))}
                        
                        {/* Vitória Final */}
                        {isFinished && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                                className="mt-8 p-6 text-center border border-zinc-800 rounded-2xl bg-zinc-900/50 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                <div className={`text-4xl mb-4 ${winner === "attacker" ? "text-indigo-400" : "text-rose-400"}`}>
                                    {winner === "attacker" ? "🏆" : "☠️"}
                                </div>
                                <h3 className={`text-2xl font-black mb-1 ${winner === "attacker" ? "text-indigo-400" : "text-rose-400"}`}>
                                    {winner === "attacker" ? "Vitória Esmagadora!" : "Derrota Amarga"}
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    O combate terminou após {maxTurns} turnos.
                                </p>
                                
                                <button
                                    onClick={onClose}
                                    className="mt-6 px-8 py-3 bg-white text-black font-black uppercase text-sm rounded-xl hover:bg-zinc-200 transition-transform active:scale-95"
                                >
                                    Retornar
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="w-full max-w-2xl mt-4 flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-purple-600 text-white'}`}
                        disabled={isFinished}
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" />}
                    </button>
                    
                    <button
                        onClick={() => {
                            if (isFinished) {
                                setVisibleEvents([]);
                                setCurrentTurnIndex(0);
                                setIsPlaying(true);
                            } else {
                                // Skip to end
                                setIsPlaying(false);
                                setCurrentTurnIndex(maxTurns);
                                
                                const allEvts: any[] = [];
                                combatLog.forEach((turn: any) => {
                                    allEvts.push({ id: `t-${turn.tick}-h`, type: "HEADER", ...turn });
                                    turn.actions.forEach((a: any, i: number) => allEvts.push({ id: `t-${turn.tick}-a-${i}`, tick: turn.tick, side: turn.side, ...a}));
                                });
                                setVisibleEvents(allEvts);
                            }
                        }}
                        className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        {isFinished ? "Repetir" : "Pular para o Fim"}
                    </button>
                </div>
                
                <button
                    onClick={() => setSpeedMultiplier(prev => prev >= 4 ? 1 : prev * 2)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/30 text-indigo-300 border border-indigo-500/30 font-black text-sm hover:bg-indigo-900/40 transition-colors"
                >
                    {speedMultiplier}x <FastForward size={16} fill="currentColor" />
                </button>
            </div>
        </div>
    );
}
