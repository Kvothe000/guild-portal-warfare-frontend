"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HeroState {
    id: string;
    name: string;
    max_hp: number;
    current_hp: number;
    max_energy?: number; // Added energy field
    current_energy?: number; // Added energy field
    faction?: string;
    isDead: boolean;
    // Ephemeral animation states fed by the orchestration hook
    isAttacking?: boolean;
    takingDamage?: boolean;
    floatingText?: { id: string; text: string; type: "damage" | "heal" | "status" | "info" }[];
}

interface HeroCardProps {
    hero: HeroState;
    isEnemy?: boolean;
}

export function HeroCard({ hero, isEnemy = false }: HeroCardProps) {
    // Faction colors for the glassmorphism border
    const getFactionColor = (faction?: string) => {
        switch (faction) {
            case "Vanguard":
                return "border-yellow-500/50 shadow-yellow-500/20";
            case "Arcane":
                return "border-purple-500/50 shadow-purple-500/20";
            case "Shadow":
                return "border-red-600/50 shadow-red-600/20";
            default:
                return "border-zinc-500/50 shadow-zinc-500/20";
        }
    };

    const hpPercentage = Math.max(0, Math.min(100, (hero.current_hp / hero.max_hp) * 100));

    return (
        <div className="relative w-full aspect-[3/4] max-w-[140px] mx-auto">
            {/* Floating Texts (Damage, Status) */}
            <div className="absolute -top-8 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
                {hero.floatingText?.map((ft) => (
                    <motion.div
                        key={ft.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -40, scale: 1.2 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                            "font-black text-lg filter drop-shadow-[0_2px_2px_rgba(0,0,0,1)]",
                            ft.type === "damage" && "text-red-500",
                            ft.type === "heal" && "text-green-400",
                            ft.type === "status" && "text-yellow-400",
                            ft.type === "info" && "text-blue-400"
                        )}
                    >
                        {ft.text}
                    </motion.div>
                ))}
            </div>

            <motion.div
                layout
                // Animate attacks and damage
                animate={{
                    x: hero.isAttacking ? (isEnemy ? -30 : 30) : 0,
                    scale: hero.isAttacking ? 1.1 : 1,
                    rotate: hero.takingDamage ? [0, -5, 5, -5, 5, 0] : 0,
                    opacity: hero.isDead ? 0.3 : 1,
                    filter: hero.isDead ? "grayscale(100%)" : "grayscale(0%)",
                }}
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 15 },
                    rotate: { duration: 0.4 },
                }}
                className={cn(
                    "w-full h-full rounded-xl border backdrop-blur-md bg-zinc-900/60 p-3 flex flex-col justify-between overflow-hidden shadow-lg",
                    getFactionColor(hero.faction),
                    hero.isDead && "border-zinc-800 shadow-none"
                )}
            >
                {/* Holographic Inner Glow */}
                {!hero.isDead && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                )}

                {/* Hero Info */}
                <div className="z-10 text-center">
                    <h3 className="text-xs font-bold truncate text-zinc-100 drop-shadow-md">
                        {hero.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                        {hero.faction || "Clone"}
                    </p>
                </div>

                {/* Center portrait placeholder */}
                <div className="flex-1 flex items-center justify-center z-10">
                    {hero.isDead ? (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center opacity-50">
                            <span className="text-xs font-bold text-zinc-500">K.O.</span>
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-800 border-2 border-zinc-600 shadow-inner" />
                    )}
                </div>

                {/* HP Bar */}
                <div className="z-10 w-full mt-2 space-y-1">
                    <div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-300 mb-0.5">
                            <span>HP</span>
                            <span>
                                {hero.current_hp}/{hero.max_hp}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                            {/* The actual HP */}
                            <motion.div
                                className={cn(
                                    "h-full rounded-full",
                                    hpPercentage > 50
                                        ? "bg-green-500"
                                        : hpPercentage > 20
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                )}
                                initial={{ width: `${hpPercentage}%` }}
                                animate={{ width: `${hpPercentage}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Energy Bar */}
                    {hero.max_energy !== undefined && (
                        <div>
                            <div className="flex justify-between text-[8px] font-mono text-zinc-500 mb-0.5">
                                <span>EN</span>
                                <span>{hero.current_energy}/{hero.max_energy}</span>
                            </div>
                            <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-sky-500"
                                    initial={{ width: `${Math.max(0, Math.min(100, ((hero.current_energy || 0) / hero.max_energy) * 100))}%` }}
                                    animate={{ width: `${Math.max(0, Math.min(100, ((hero.current_energy || 0) / hero.max_energy) * 100))}%` }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
