import { useState, useEffect, useRef } from "react";
import { HeroState } from "@/components/combat/HeroCard";

export interface CombatAction {
    actor_id: string;
    actor_name: string;
    skill_used: string;
    effect_type: string;
    target_id?: string;
    target_name?: string;
    damage?: number;
    healed?: number;
    target_hp_remaining?: number;
    target_died?: boolean;
    shatter_triggered?: boolean;
    shatter_status?: string;
    status_applied?: string;
    triggered_by?: string; // for chases
    summoned_clone?: string;
    slot?: number;
}

export interface CombatTick {
    tick: number;
    actor: string;
    actions: CombatAction[];
}

export interface CombatResult {
    winner: string;
    log: CombatTick[];
}

export function useCombatReplay(initialAttackers: HeroState[], initialDefenders: HeroState[], log: CombatTick[] | null) {
    const [attackers, setAttackers] = useState<HeroState[]>(initialAttackers);
    const [defenders, setDefenders] = useState<HeroState[]>(initialDefenders);
    const [currentTick, setCurrentTick] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [combatEventText, setCombatEventText] = useState<string | null>(null);
    const [combatMessages, setCombatMessages] = useState<string[]>([]);

    const speedMs = 1200; // Time per action loop

    // Helper to deep update a hero's state
    const updateHero = (id: string, updates: Partial<HeroState>) => {
        setAttackers((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
        setDefenders((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    };

    const addFloatingText = (id: string, text: string, type: "damage" | "heal" | "status" | "info") => {
        const textId = Math.random().toString(36).substring(7);

        // Add text
        setAttackers((prev) => prev.map((h) => {
            if (h.id === id) {
                return { ...h, floatingText: [...(h.floatingText || []), { id: textId, text, type }] };
            }
            return h;
        }));
        setDefenders((prev) => prev.map((h) => {
            if (h.id === id) {
                return { ...h, floatingText: [...(h.floatingText || []), { id: textId, text, type }] };
            }
            return h;
        }));

        // Remove text after 1 second (CSS animation duration)
        setTimeout(() => {
            setAttackers((prev) => prev.map((h) => h.id === id ? { ...h, floatingText: h.floatingText?.filter(ft => ft.id !== textId) } : h));
            setDefenders((prev) => prev.map((h) => h.id === id ? { ...h, floatingText: h.floatingText?.filter(ft => ft.id !== textId) } : h));
        }, 1000);
    };

    const processAction = (action: CombatAction) => {
        // 1. Attacker Animation
        updateHero(action.actor_id, { isAttacking: true });

        let eventTitle = `${action.actor_name} usou ${action.skill_used}`;
        if (action.effect_type === "CHASE_COMBO") {
            eventTitle = `PERSEGUIÇÃO! ${action.actor_name} usou ${action.skill_used} avançando no ${action.triggered_by}`;
        }
        if (action.effect_type === "Summon_Clone") {
            eventTitle = `${action.actor_name} usou ${action.skill_used} (Invocação)`;
        }

        setCombatEventText(eventTitle);
        setCombatMessages((prev) => [...prev, `[Tick ${currentTick + 1}] ${eventTitle}`]);

        // 2. Resolve target effects after a slight delay to sync with lunge animation
        setTimeout(() => {
            updateHero(action.actor_id, { isAttacking: false });

            if (action.target_id) {
                updateHero(action.target_id, { takingDamage: true });

                if (action.damage !== undefined) {
                    addFloatingText(action.target_id, `-${action.damage}`, "damage");
                    updateHero(action.target_id, {
                        current_hp: action.target_hp_remaining || 0,
                        isDead: action.target_died || false
                    });
                }

                if (action.healed !== undefined) {
                    addFloatingText(action.target_id, `+${action.healed}`, "heal");
                    // Here we would need the actual max_hp to cap it, but the backend log provides the final state so we assume it's correct if we had it, or we just trust the text.
                    // To be precise we need absolute HP from backend on heal, but for now we just show floating text.
                }

                if (action.shatter_triggered) {
                    addFloatingText(action.target_id, "SHATTER!", "status");
                }
                if (action.status_applied) {
                    addFloatingText(action.target_id, action.status_applied.toUpperCase(), "status");
                }
            }

            // Handle clones
            if (action.effect_type === "Summon_Clone" && action.summoned_clone && action.slot) {
                // Determine which side the actor is on to spawn the clone
                setAttackers((prev) => {
                    if (prev.some(h => h.id === action.actor_id)) {
                        return [...prev, { id: `clone_${action.actor_id}_${Math.random()}`, name: action.summoned_clone, max_hp: 1, current_hp: 1, isDead: false, faction: "Clone" } as HeroState];
                    }
                    return prev;
                });
                setDefenders((prev) => {
                    if (prev.some(h => h.id === action.actor_id)) {
                        return [...prev, { id: `clone_${action.actor_id}_${Math.random()}`, name: action.summoned_clone, max_hp: 1, current_hp: 1, isDead: false, faction: "Clone" } as HeroState];
                    }
                    return prev;
                });
            }

            // Stop taking damage animation
            setTimeout(() => {
                if (action.target_id) updateHero(action.target_id, { takingDamage: false });
            }, 400);

        }, 300);
    };

    useEffect(() => {
        if (!isPlaying || !log || currentTick >= log.length) {
            if (currentTick >= (log?.length || 0) && isPlaying) {
                setIsPlaying(false);
                setCombatEventText("Fim de Combate!");
            }
            return;
        }

        const currentLogTick = log[currentTick];
        let actionIndex = 0;

        // Process all actions in this tick sequentially (e.g. basic attack -> chase 1 -> chase 2)
        const interval = setInterval(() => {
            if (actionIndex < currentLogTick.actions.length) {
                processAction(currentLogTick.actions[actionIndex]);
                actionIndex++;
            } else {
                clearInterval(interval);
                setCurrentTick((prev) => prev + 1);
            }
        }, speedMs); // wait for previous action sequence to finish before next

        return () => clearInterval(interval);

    }, [currentTick, isPlaying, log]);

    const togglePlay = () => setIsPlaying((p) => !p);
    const reset = () => {
        setIsPlaying(false);
        setCurrentTick(0);
        setAttackers(initialAttackers);
        setDefenders(initialDefenders);
        setCombatEventText(null);
        setCombatMessages([]);
    };

    return {
        attackers,
        defenders,
        currentTick,
        totalTicks: log?.length || 0,
        isPlaying,
        combatEventText,
        combatMessages,
        togglePlay,
        reset
    };
}
