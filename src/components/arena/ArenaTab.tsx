"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchArenaLeaderboard, attackArena, api } from "@/lib/api";
import { Trophy, Swords, TrendingUp, TrendingDown, Minus, Shield, Search, ChevronRight } from "lucide-react";
import { CombatViewer } from "@/components/combat/CombatViewer";

// =============================================================================
// TYPES
// =============================================================================

interface LeaderboardEntry {
    player_id: string;
    username: string;
    arena_points: number;
    rank: number;
}

interface MatchResult {
    winner_side: "attacker" | "defender" | "draw";
    points_exchanged: number;
    match_id: string;
    log: unknown[];
}

// =============================================================================
// RANK BADGE
// =============================================================================

function RankBadge({ rank, points }: { rank: number; points: number }) {
    const tier =
        points >= 2200 ? { label: "Guardião", color: "text-amber-300 bg-amber-950/40 border-amber-600/40", icon: "👑" } :
        points >= 1800 ? { label: "Campeão",  color: "text-purple-300 bg-purple-950/40 border-purple-600/40", icon: "💎" } :
        points >= 1400 ? { label: "Veterano", color: "text-blue-300 bg-blue-950/40 border-blue-500/40",    icon: "⚔️" } :
        points >= 1100 ? { label: "Soldado",  color: "text-emerald-300 bg-emerald-950/40 border-emerald-600/40", icon: "🛡️" } :
                         { label: "Recruta",  color: "text-zinc-400 bg-zinc-900 border-zinc-700",            icon: "🗡️" };

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tier.color}`}>
            {tier.icon} {tier.label}
        </span>
    );
}

// =============================================================================
// MATCH RESULT DISPLAY
// =============================================================================

function MatchResultCard({ result, onClose }: { result: MatchResult; onClose: () => void }) {
    const won = result.winner_side === "attacker";
    const draw = result.winner_side === "draw";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`rounded-2xl border p-6 text-center shadow-2xl ${
                won  ? "border-amber-500/60 bg-gradient-to-br from-amber-950/50 to-zinc-900" :
                draw ? "border-zinc-600 bg-zinc-900" :
                       "border-red-700/50 bg-gradient-to-br from-red-950/40 to-zinc-900"
            }`}
        >
            <div className="text-4xl mb-3">{won ? "🏆" : draw ? "🤝" : "💀"}</div>
            <div className={`text-xl font-black mb-1 ${won ? "text-amber-300" : draw ? "text-zinc-300" : "text-red-400"}`}>
                {won ? "Vitória!" : draw ? "Empate!" : "Derrota"}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm mb-4">
                {won ? <TrendingUp size={14} className="text-emerald-400" /> :
                 draw ? <Minus size={14} className="text-zinc-400" /> :
                       <TrendingDown size={14} className="text-red-400" />}
                <span className={won ? "text-emerald-400 font-bold" : draw ? "text-zinc-400" : "text-red-400 font-bold"}>
                    {won ? "+" : draw ? "±" : "-"}{result.points_exchanged} pts
                </span>
            </div>
            <button onClick={onClose}
                className="px-6 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold transition-all"
            >
                Fechar
            </button>
        </motion.div>
    );
}

// =============================================================================
// LEADERBOARD ROW
// =============================================================================

function LeaderboardRow({ entry, currentPlayerId, onChallenge, isChallenging }: {
    entry: LeaderboardEntry;
    currentPlayerId: string;
    onChallenge: (id: string, name: string) => void;
    isChallenging: boolean;
}) {
    const isMe = entry.player_id === currentPlayerId;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-4 px-5 py-4 ${isMe ? "bg-amber-950/20 border-l-2 border-amber-500" : "hover:bg-zinc-800/30"} transition-all`}
        >
            {/* Rank number */}
            <div className={`w-8 text-center font-black text-sm ${
                entry.rank === 1 ? "text-amber-400" :
                entry.rank === 2 ? "text-zinc-300" :
                entry.rank === 3 ? "text-orange-400" :
                "text-zinc-600"
            }`}>
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
            </div>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                isMe ? "bg-amber-900/40 border border-amber-600/40 text-amber-200"
                     : "bg-zinc-800 border border-zinc-700 text-zinc-400"
            }`}>
                {entry.username.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${isMe ? "text-amber-200" : "text-zinc-200"}`}>
                    {entry.username} {isMe && <span className="text-xs text-amber-400">(você)</span>}
                </div>
                <RankBadge rank={entry.rank} points={entry.arena_points} />
            </div>

            {/* Points */}
            <div className="text-right">
                <div className="text-sm font-black text-zinc-200">{entry.arena_points.toLocaleString()}</div>
                <div className="text-[10px] text-zinc-600">pontos</div>
            </div>

            {/* Challenge button */}
            {!isMe && (
                <button
                    onClick={() => onChallenge(entry.player_id, entry.username)}
                    disabled={isChallenging}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/40 border border-zinc-700 hover:border-red-700/50 text-xs font-bold text-zinc-400 hover:text-red-300 transition-all disabled:opacity-40 flex items-center gap-1"
                >
                    <Swords size={11} />
                    Desafiar
                </button>
            )}
        </motion.div>
    );
}

// =============================================================================
// ARENA TAB — MAIN
// =============================================================================

interface ArenaTabProps {
    playerId: string;
    currentPoints: number;
}

export function ArenaTab({ playerId, currentPoints }: ArenaTabProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChallenging, setIsChallenging] = useState(false);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [showViewer, setShowViewer] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [myPoints, setMyPoints] = useState(currentPoints);

    const loadLeaderboard = useCallback(async () => {
        try {
            const data = await fetchArenaLeaderboard(50);
            setLeaderboard(data);
        } catch (e) {
            console.error("Leaderboard error:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

    const handleChallenge = async (defenderId: string, defenderName: string) => {
        setIsChallenging(true);
        try {
            const result = await attackArena(playerId, defenderId);
            setMatchResult(result);
            setShowViewer(true);
            if (result.winner_side === "attacker") {
                setMyPoints((p) => p + result.points_exchanged);
            } else if (result.winner_side === "defender") {
                setMyPoints((p) => Math.max(0, p - result.points_exchanged));
            }
            await loadLeaderboard();
        } catch (e: any) {
            console.error("Challenge error:", e);
        } finally {
            setIsChallenging(false);
        }
    };

    const filtered = leaderboard.filter((e) =>
        !searchQuery || e.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const myRank = leaderboard.findIndex((e) => e.player_id === playerId) + 1;

    return (
        <div className="space-y-6">
            {/* My Arena Status */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-700/30 bg-gradient-to-br from-amber-950/30 to-zinc-900/60 p-5"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Sua posição</div>
                        <div className="text-3xl font-black text-white">
                            {myRank > 0 ? `#${myRank}` : "—"}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Pontos</div>
                        <div className="text-3xl font-black text-amber-300">
                            {myPoints.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <RankBadge rank={myRank} points={myPoints} />
                    </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, (myPoints / 2500) * 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                    <span>0</span>
                    <span>Guardião: 2200+</span>
                    <span>2500</span>
                </div>
            </motion.div>

            {/* Match result overlay */}
            <AnimatePresence>
                {matchResult && showViewer && (
                    <CombatViewer 
                        combatLog={matchResult.log} 
                        winner={matchResult.winner_side === "attacker" ? "attacker" : "defender"} 
                        onClose={() => setShowViewer(false)} 
                    />
                )}
                {matchResult && !showViewer && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <MatchResultCard result={matchResult} onClose={() => setMatchResult(null)} />
                    </div>
                )}
            </AnimatePresence>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                        <Trophy size={14} className="text-amber-400" />
                        Ranking da Arena
                    </div>
                    <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar jogador..."
                            className="pl-8 pr-4 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 outline-none focus:border-amber-500 transition-colors w-36"
                        />
                    </div>
                </div>

                {/* Rows */}
                {isLoading ? (
                    <div className="py-10 flex justify-center">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 text-sm">
                        {searchQuery ? "Nenhum jogador encontrado." : "Leaderboard vazio. Seja o primeiro!"}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/40 max-h-[420px] overflow-y-auto">
                        {filtered.map((entry) => (
                            <LeaderboardRow
                                key={entry.player_id}
                                entry={entry}
                                currentPlayerId={playerId}
                                onChallenge={handleChallenge}
                                isChallenging={isChallenging}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
