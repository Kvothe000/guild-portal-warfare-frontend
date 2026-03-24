"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GachaBanner, Hero, PlayerWallet, pullGacha } from "@/lib/api";
import { Gem, Ticket, Sparkles, Star } from "lucide-react";

// Raridade → estrelas e cor
const RARITY_META: Record<string, { stars: number; color: string; glow: string; label: string }> = {
    SSS: { stars: 3, color: "text-amber-300",  glow: "shadow-amber-500/60",  label: "SSS" },
    SS:  { stars: 2, color: "text-purple-300", glow: "shadow-purple-500/60", label: "SS" },
    S:   { stars: 1, color: "text-blue-300",   glow: "shadow-blue-500/60",   label: "S" },
    A:   { stars: 0, color: "text-emerald-400",glow: "shadow-emerald-500/40",label: "A" },
    B:   { stars: 0, color: "text-zinc-400",   glow: "",                     label: "B" },
};

const FACTION_ICON: Record<string, string> = {
    Vanguard: "🛡️",
    Arcane:   "✨",
    Shadow:   "🗡️",
    Neutral:  "⚔️",
};

// =============================================================================
// PULL RESULT CARD — exibido após invocação
// =============================================================================

function PullResultCard({ hero, delay }: { hero: Hero; delay: number }) {
    const meta = RARITY_META[hero.rarity] || RARITY_META["B"];
    const isHighRarity = hero.rarity === "SSS" || hero.rarity === "SS";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.5, delay, type: "spring", stiffness: 200 }}
            className={`
                relative rounded-xl border p-4 flex flex-col items-center gap-2 overflow-hidden
                ${hero.rarity === "SSS" ? "border-amber-500/70 bg-gradient-to-b from-amber-950/60 to-zinc-900" :
                  hero.rarity === "SS"  ? "border-purple-500/70 bg-gradient-to-b from-purple-950/60 to-zinc-900" :
                  hero.rarity === "S"   ? "border-blue-500/70 bg-gradient-to-b from-blue-950/60 to-zinc-900" :
                  "border-zinc-800 bg-zinc-900"}
                shadow-xl ${meta.glow}
            `}
        >
            {/* Shimmer effect for high rarity */}
            {isHighRarity && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeInOut" }}
                />
            )}

            <div className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</div>

            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl">
                {FACTION_ICON[hero.faction] || "⚔️"}
            </div>

            <div className="text-center">
                <div className="font-black text-xs text-white leading-tight truncate max-w-[100px]" title={hero.name}>
                    {hero.name}
                </div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">{hero.role}</div>
            </div>

            {/* Stars */}
            {meta.stars > 0 && (
                <div className="flex gap-0.5">
                    {[...Array(meta.stars)].map((_, i) => (
                        <Star key={i} size={10} className={`${meta.color} fill-current`} />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// GACHA HUB — MAIN COMPONENT
// =============================================================================

interface GachaHubProps {
    playerId: string;
    banners: GachaBanner[];
    wallet: PlayerWallet;
    onWalletUpdate: (w: PlayerWallet) => void;
    onHeroesAdded: (heroes: Hero[]) => void;
}

export function GachaHub({ playerId, banners, wallet, onWalletUpdate, onHeroesAdded }: GachaHubProps) {
    const [selectedBannerIdx, setSelectedBannerIdx] = useState(0);
    const [isRolling, setIsRolling] = useState(false);
    const [pullResults, setPullResults] = useState<Hero[] | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const activeBanners = banners.filter((b) => b.is_active);
    const banner = activeBanners[selectedBannerIdx];

    const canAffordCrystal1  = wallet.crystals_premium >= 100;
    const canAffordCrystal10 = wallet.crystals_premium >= 1000;
    const canAffordTicket    = wallet.summon_tickets >= 1;

    const handlePull = async (amount: 1 | 10, currency: "crystal" | "ticket") => {
        if (!banner || !playerId) return;
        setIsRolling(true);
        setErrorMsg(null);
        setPullResults(null);

        try {
            const res = await pullGacha(playerId, banner.id, amount);
            const heroes = res.pulls.map((p) => p.hero);
            setPullResults(heroes);
            onWalletUpdate(res.wallet_state);
            onHeroesAdded(heroes);
        } catch (err: any) {
            setErrorMsg(err?.response?.data?.detail || "Erro ao invocar. Tente novamente.");
        } finally {
            setIsRolling(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner Selector */}
            {activeBanners.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {activeBanners.map((b, i) => (
                        <button
                            key={b.id}
                            onClick={() => { setSelectedBannerIdx(i); setPullResults(null); }}
                            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                i === selectedBannerIdx
                                    ? "border-purple-500/60 bg-purple-900/30 text-purple-200"
                                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                            }`}
                        >
                            {b.name}
                        </button>
                    ))}
                </div>
            )}

            {banner ? (
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden shadow-2xl">
                    {/* Banner Header */}
                    <div className="relative p-6 bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-zinc-900 border-b border-zinc-800/60 overflow-hidden">
                        <div className="absolute top-0 right-0 text-[140px] opacity-5 leading-none pointer-events-none select-none font-black">
                            ✨
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Banner de Invocação</div>
                                {banner.expires_at && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-300 uppercase tracking-wider animate-pulse">
                                        ⏳ Evento Sazonal Ativo
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-black text-white mb-1">{banner.name}</h2>
                            <p className="text-sm text-zinc-400">{banner.description}</p>
                            
                            <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                                <span>🏆 SSS: 1.2%</span>
                                <span>⚡ Soft pity: pull {banner.soft_pity_start}</span>
                                <span>💎 Hard pity: pull {banner.hard_pity_count}</span>
                                {banner.faction_focus && <span>🎯 Foco: {banner.faction_focus}</span>}
                            </div>
                            
                            {banner.expires_at && (
                                <div className="mt-3 text-xs font-medium text-rose-400/80 bg-rose-950/30 w-max px-2 py-1 rounded border border-rose-900/40">
                                    Termina em: {new Date(banner.expires_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Wallet Preview */}
                    <div className="px-6 py-3 border-b border-zinc-800/40 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-rose-400 font-bold">
                            <Gem size={14} />
                            <span>{wallet.crystals_premium.toLocaleString()}</span>
                            <span className="text-zinc-600 font-normal">Cristais</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <Ticket size={14} />
                            <span>{wallet.summon_tickets}</span>
                            <span className="text-zinc-600 font-normal">Tickets</span>
                        </div>
                        <div className="ml-auto text-zinc-500 text-xs">
                            Pity: <span className="text-indigo-300 font-bold">{wallet.pity_counter} / {banner.hard_pity_count}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => handlePull(1, "crystal")}
                                disabled={isRolling || !canAffordCrystal1}
                                className="py-4 rounded-xl border border-zinc-700 bg-zinc-800/70 hover:bg-zinc-700/70 disabled:opacity-40 text-white font-bold transition-all text-sm flex flex-col items-center gap-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Gem size={14} className="text-rose-400" />
                                    Invocar 1×
                                </div>
                                <span className="text-xs text-rose-400 font-semibold">100 Cristais</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                onClick={() => handlePull(10, "crystal")}
                                disabled={isRolling || !canAffordCrystal10}
                                className="py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold transition-all text-sm shadow-lg shadow-purple-500/20 flex flex-col items-center gap-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={14} />
                                    Invocar 10×
                                </div>
                                <span className="text-xs text-purple-200 font-semibold">1.000 Cristais</span>
                            </motion.button>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            onClick={() => handlePull(1, "ticket")}
                            disabled={isRolling || !canAffordTicket}
                            className="w-full py-3 rounded-xl border border-emerald-700/50 bg-emerald-900/20 hover:bg-emerald-800/30 disabled:opacity-40 text-emerald-300 font-bold transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <Ticket size={14} />
                            Usar Ticket de Invocação (1×)
                        </motion.button>
                    </div>

                    {/* Loading Spinner */}
                    {isRolling && (
                        <div className="px-6 pb-6 flex justify-center">
                            <div className="flex items-center gap-3 text-zinc-400">
                                <div className="w-5 h-5 border-2 border-zinc-700 border-t-purple-400 rounded-full animate-spin" />
                                <span className="text-sm">Os véus do destino se abrem...</span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {errorMsg && (
                        <div className="mx-6 mb-6 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                            {errorMsg}
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-zinc-500">
                    Nenhum banner ativo no momento.
                </div>
            )}

            {/* Pull Results */}
            <AnimatePresence>
                {pullResults && pullResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {/* Check for high rarity */}
                        {pullResults.some((h) => h.rarity === "SSS") && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-3"
                            >
                                <div className="text-2xl font-black text-amber-300 tracking-wider animate-pulse">
                                    ⭐ INVOCAÇÃO SSS ⭐
                                </div>
                                <div className="text-sm text-zinc-400 mt-1">O destino sorriu para você!</div>
                            </motion.div>
                        )}

                        <div className={`grid gap-3 ${pullResults.length >= 10 ? "grid-cols-5" : pullResults.length >= 5 ? "grid-cols-5" : "grid-cols-3"}`}>
                            {pullResults.map((hero, i) => (
                                <PullResultCard key={hero.id} hero={hero} delay={i * 0.07} />
                            ))}
                        </div>

                        <button
                            onClick={() => setPullResults(null)}
                            className="w-full py-2 rounded-lg text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
                        >
                            Fechar resultados
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
