"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle, Play, Star, Zap, MapPin } from "lucide-react";

// =============================================================================
// CAMPAIGN DATA — Mundos e Fases de Valdris
// =============================================================================

interface Stage {
    number: number;      // 101 = Mundo 1 Fase 1
    name: string;
    world: number;
    lore: string;
    difficulty: "Normal" | "Difícil" | "Elite" | "Inferno";
    rewards: string[];
    // AFK rewards (desbloqueados ao completar)
    afk_xp: number;
    afk_gold: number;
}

interface World {
    id: number;
    name: string;
    region: string;
    lore: string;
    icon: string;
    gradient: string;
    border: string;
    stages: Stage[];
}

const WORLDS: World[] = [
    {
        id: 1,
        name: "Ruínas de Valdris",
        region: "A Capital Caída",
        lore: "As ruas que um dia abrigavam o maior mercado de Éter do mundo agora cheiram a cinza e sangue. O Veil avança e você acabou de chegar.",
        icon: "🏚️",
        gradient: "from-stone-900 to-zinc-900",
        border: "border-stone-600/40",
        stages: [
            { number: 101, name: "Portal da Entrada", world: 1, lore: "O primeiro portal ainda pulsa com Éter fraco. Guardado por soldados desorientados.", difficulty: "Normal", rewards: ["60 XP", "120 Gold", "1 Fragmento de Herói"], afk_xp: 60, afk_gold: 120 },
            { number: 102, name: "Mercado Abandonado", world: 1, lore: "Comerciantes se tornaram bandidos. Os poucos que restam atacam qualquer um.", difficulty: "Normal", rewards: ["80 XP", "150 Gold", "1 Ticket de Invocação"], afk_xp: 80, afk_gold: 150 },
            { number: 103, name: "Distrito dos Magos", world: 1, lore: "O Círculo Etereal abandonou a cidade mas deixou guardiões arcanos automáticos.", difficulty: "Normal", rewards: ["100 XP", "200 Gold", "3 Fragmentos"], afk_xp: 100, afk_gold: 200 },
            { number: 104, name: "Salão do Conselho", world: 1, lore: "O conselho está morto. Um golem de pedra guarda seus segredos.", difficulty: "Difícil", rewards: ["150 XP", "300 Gold", "5 Cristais"], afk_xp: 150, afk_gold: 300 },
            { number: 105, name: "Trono de Valdris", world: 1, lore: "O último rei de Valdris... ou o que restou dele. Agora serve ao Veil.", difficulty: "Difícil", rewards: ["200 XP", "500 Gold", "10 Cristais", "Acesso ao Mundo 2"], afk_xp: 200, afk_gold: 500 },
        ],
    },
    {
        id: 2,
        name: "Florestas do Éter",
        region: "O Verde que Consome",
        lore: "As florestas ao norte de Valdris foram corrompidas pelo vazamento de Éter dos cristais quebrados. A natureza virou arma.",
        icon: "🌿",
        gradient: "from-emerald-950 to-zinc-900",
        border: "border-emerald-700/40",
        stages: [
            { number: 201, name: "Borda Corrompida", world: 2, lore: "As primeiras árvores já não são árvores. São sensores vivos do Veil.", difficulty: "Normal", rewards: ["120 XP", "200 Gold", "2 Fragmentos"], afk_xp: 120, afk_gold: 200 },
            { number: 202, name: "Lago dos Ecos", world: 2, lore: "O lago reflete o futuro, não o presente. Cuidado em quem você vê.", difficulty: "Normal", rewards: ["150 XP", "250 Gold", "3 Fragmentos"], afk_xp: 150, afk_gold: 250 },
            { number: 203, name: "Altar da Seiva", world: 2, lore: "Um ritual antigo foi pervertido. A floresta ataca como um único organismo.", difficulty: "Difícil", rewards: ["200 XP", "400 Gold", "8 Cristais"], afk_xp: 200, afk_gold: 400 },
            { number: 204, name: "Árvore-Lich", world: 2, lore: "A maior árvore da floresta abriga a mente de um lich morto há séculos.", difficulty: "Elite", rewards: ["300 XP", "600 Gold", "15 Cristais", "Guardião Espiritual: Espírito da Floresta"], afk_xp: 300, afk_gold: 600 },
        ],
    },
    {
        id: 3,
        name: "Cidadela das Sombras",
        region: "Berço da Liga",
        lore: "A Liga das Sombras construiu sua fortaleza onde a luz nunca chega. Toda entrada é uma armadilha. Toda saída, um teste.",
        icon: "🌑",
        gradient: "from-slate-950 to-red-950",
        border: "border-red-800/40",
        stages: [
            { number: 301, name: "Corredor dos Sussurros", world: 3, lore: "As paredes falam. Literalmente. E elas relatam tudo que você disse em voz alta.", difficulty: "Difícil", rewards: ["250 XP", "400 Gold", "5 Fragmentos"], afk_xp: 250, afk_gold: 400 },
            { number: 302, name: "Câmara dos Clones", world: 3, lore: "A Liga treina com espelhos vivos. Você não sabe qual atacar primeiro.", difficulty: "Difícil", rewards: ["300 XP", "500 Gold", "10 Cristais"], afk_xp: 300, afk_gold: 500 },
            { number: 303, name: "Sala do Mestre", world: 3, lore: "O Mestre da Liga nunca perdeu um duelo. Não porque é invencível — porque é justo.", difficulty: "Elite", rewards: ["400 XP", "800 Gold", "20 Cristais", "Arma de Elite"], afk_xp: 400, afk_gold: 800 },
        ],
    },
];

const DIFFICULTY_STYLE: Record<string, string> = {
    Normal:  "text-emerald-400 bg-emerald-950/30 border-emerald-700/30",
    Difícil: "text-amber-400  bg-amber-950/30  border-amber-700/30",
    Elite:   "text-purple-400 bg-purple-950/30 border-purple-700/30",
    Inferno: "text-red-400    bg-red-950/30    border-red-700/30",
};

// =============================================================================
// STAGE NODE
// =============================================================================

function StageNode({ stage, isCompleted, isCurrent, isLocked, onClick }: {
    stage: Stage;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={!isLocked ? { scale: 1.08, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={!isLocked ? onClick : undefined}
            className={`relative flex flex-col items-center gap-2 group ${isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
            {/* Node circle */}
            <div className={`
                w-14 h-14 rounded-full flex items-center justify-center text-lg border-2 shadow-lg transition-all
                ${isCompleted ? "bg-emerald-900/60 border-emerald-500 shadow-emerald-500/30" :
                  isCurrent   ? "bg-amber-900/60 border-amber-500 shadow-amber-500/40 animate-pulse" :
                  isLocked    ? "bg-zinc-900 border-zinc-700" :
                               "bg-zinc-800 border-zinc-600 group-hover:border-indigo-500"}
            `}>
                {isCompleted ? <CheckCircle size={22} className="text-emerald-400" /> :
                 isLocked    ? <Lock size={18} className="text-zinc-600" /> :
                 isCurrent   ? <Play size={18} className="text-amber-400 fill-amber-400" /> :
                               <MapPin size={16} className="text-zinc-400 group-hover:text-indigo-300" />}
            </div>

            {/* Stage number + name */}
            <div className="text-center">
                <div className={`text-[10px] font-black ${isCompleted ? "text-emerald-400" : isCurrent ? "text-amber-300" : "text-zinc-500"}`}>
                    {stage.number}
                </div>
                <div className="text-[9px] text-zinc-600 max-w-[70px] leading-tight">{stage.name}</div>
            </div>
        </motion.button>
    );
}

// =============================================================================
// STAGE DETAIL MODAL
// =============================================================================

function StageDetail({ stage, isCompleted, onClose, onPlay }: {
    stage: Stage;
    isCompleted: boolean;
    onClose: () => void;
    onPlay: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 60, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Fase {stage.number}</div>
                            <h3 className="text-lg font-black text-white">{stage.name}</h3>
                            <span className={`inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[stage.difficulty]}`}>
                                {stage.difficulty}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-xl leading-none">×</button>
                    </div>
                </div>

                {/* Lore */}
                <div className="p-5 space-y-4">
                    <p className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3">{stage.lore}</p>

                    {/* AFK Rewards */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                            <Zap size={11} />
                            AFK Farm (ao completar)
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-zinc-300">⚡ {stage.afk_xp} XP/h</div>
                            <div className="text-amber-300">🟡 {stage.afk_gold} Gold/h</div>
                        </div>
                    </div>

                    {/* Rewards */}
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                            <Star size={11} />
                            Recompensas (1ª vez)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {stage.rewards.map((r, i) => (
                                <span key={i} className="text-xs px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                                    {r}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 flex gap-3">
                    {isCompleted ? (
                        <>
                            <button onClick={onPlay} className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                                🔄 Rejoglar
                            </button>
                            <button onClick={onPlay} className="flex-1 py-3 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-700/40 text-emerald-300 font-bold text-sm transition-all flex items-center justify-center gap-2">
                                ⚡ Varredura
                            </button>
                        </>
                    ) : (
                        <button onClick={onPlay} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-base transition-all flex items-center justify-center gap-2">
                            <Play size={16} className="fill-white" />
                            Iniciar Batalha
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// =============================================================================
// CAMPAIGN MAP — MAIN
// =============================================================================

interface CampaignMapProps {
    highestStage: number; // ex: 102 = completou até 102
    onStagePlay: (stage: Stage) => void;
}

export function CampaignMap({ highestStage, onStagePlay }: CampaignMapProps) {
    const [selectedWorld, setSelectedWorld] = useState(0);
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

    const world = WORLDS[selectedWorld];

    const isCompleted = (s: Stage) => s.number <= highestStage;
    const isCurrent   = (s: Stage) => s.number === highestStage + 1;
    // Unlocked if previous stage completed
    const isLocked    = (s: Stage) => s.number > highestStage + 1;

    return (
        <div className="space-y-6">
            {/* World Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {WORLDS.map((w, i) => {
                    // World is locked if first stage of world hasn't been reached
                    const firstStage = w.stages[0].number;
                    const worldLocked = firstStage > highestStage + 1 && highestStage < firstStage - 1;
                    return (
                        <button
                            key={w.id}
                            onClick={() => !worldLocked && setSelectedWorld(i)}
                            disabled={worldLocked}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                selectedWorld === i ? `bg-gradient-to-r ${w.gradient} ${w.border} text-white` :
                                worldLocked ? "border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50" :
                                "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                            }`}
                        >
                            <span>{w.icon}</span>
                            <span>{w.name}</span>
                            {worldLocked && <Lock size={11} />}
                        </button>
                    );
                })}
            </div>

            {/* World info */}
            <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-gradient-to-br ${world.gradient} ${world.border} p-5`}
            >
                <div className="flex items-start gap-4">
                    <div className="text-4xl shrink-0">{world.icon}</div>
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{world.region}</div>
                        <h2 className="text-xl font-black text-white mb-1">{world.name}</h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">{world.lore}</p>

                        {/* World progress */}
                        <div className="mt-3 text-xs text-zinc-500">
                            {world.stages.filter((s) => isCompleted(s)).length} / {world.stages.length} fases concluídas
                        </div>
                        <div className="mt-1 h-1.5 w-full bg-zinc-900/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-green-400 rounded-full transition-all"
                                style={{ width: `${(world.stages.filter((s) => isCompleted(s)).length / world.stages.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stages path */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 overflow-x-auto">
                <div className="flex items-start gap-6 min-w-max">
                    {world.stages.map((stage, i) => (
                        <div key={stage.number} className="flex items-center gap-6">
                            <StageNode
                                stage={stage}
                                isCompleted={isCompleted(stage)}
                                isCurrent={isCurrent(stage)}
                                isLocked={isLocked(stage)}
                                onClick={() => setSelectedStage(stage)}
                            />
                            {i < world.stages.length - 1 && (
                                <div className={`h-0.5 w-8 rounded-full ${isCompleted(stage) ? "bg-emerald-600" : "bg-zinc-800"}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* AFK Farm summary */}
            {highestStage > 0 && (
                <div className="rounded-2xl border border-amber-700/30 bg-amber-950/20 p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">⚡ AFK Farm Ativo</div>
                        <div className="text-sm text-zinc-300">
                            Baseado na Fase {highestStage}
                        </div>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-amber-200 font-bold">
                            {WORLDS.flatMap((w) => w.stages).find((s) => s.number === highestStage)?.afk_gold || 0} Gold/h
                        </div>
                        <div className="text-zinc-500 text-xs">
                            {WORLDS.flatMap((w) => w.stages).find((s) => s.number === highestStage)?.afk_xp || 0} XP/h
                        </div>
                    </div>
                </div>
            )}

            {/* Stage detail modal */}
            <AnimatePresence>
                {selectedStage && (
                    <StageDetail
                        stage={selectedStage}
                        isCompleted={isCompleted(selectedStage)}
                        onClose={() => setSelectedStage(null)}
                        onPlay={() => {
                            onStagePlay(selectedStage);
                            setSelectedStage(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
