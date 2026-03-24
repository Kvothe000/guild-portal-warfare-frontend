"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Hero } from "@/lib/api";
import { Swords, Shield, Gem, Zap, Lock, ChevronRight, ArrowUpRight, Star } from "lucide-react";

// =============================================================================
// EQUIPMENT TYPES
// =============================================================================

export type EquipSlot = "Weapon" | "Armor" | "Accessory" | "Relic";
export type EquipRarity = "Lendário" | "Épico" | "Raro" | "Comum";

export interface Equipment {
    id: string;
    name: string;
    slot: EquipSlot;
    rarity: EquipRarity;
    level: number;
    max_level: number;
    stats: { atk?: number; def?: number; hp?: number; spd?: number; crit_rate?: number; crit_dmg?: number };
    set_name: string | null;
    set_bonus: string | null;
    hero_id: string | null;  // null = unequipped
}

const SLOT_META: Record<EquipSlot, { icon: React.ReactNode; label: string; color: string }> = {
    Weapon:    { icon: <Swords size={14} />,  label: "Arma",       color: "text-red-400" },
    Armor:     { icon: <Shield size={14} />,  label: "Armadura",   color: "text-blue-400" },
    Accessory: { icon: <Gem size={14} />,     label: "Acessório",  color: "text-purple-400" },
    Relic:     { icon: <Star size={14} />,    label: "Relíquia",   color: "text-amber-400" },
};

const RARITY_STYLE: Record<EquipRarity, { border: string; bg: string; text: string }> = {
    "Lendário": { border: "border-amber-500/60",   bg: "bg-amber-950/30",   text: "text-amber-300" },
    "Épico":    { border: "border-purple-500/60",  bg: "bg-purple-950/30",  text: "text-purple-300" },
    "Raro":     { border: "border-blue-500/60",    bg: "bg-blue-950/30",    text: "text-blue-300" },
    "Comum":    { border: "border-zinc-700",       bg: "bg-zinc-900",       text: "text-zinc-400" },
};

// =============================================================================
// EQUIPMENT CARD
// =============================================================================

function EquipCard({ equip, isSelected, onClick }: {
    equip: Equipment; isSelected: boolean; onClick: () => void;
}) {
    const rStyle = RARITY_STYLE[equip.rarity];
    const slot   = SLOT_META[equip.slot];

    return (
        <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            onClick={onClick}
            className={`
                relative rounded-xl border p-3 text-left transition-all overflow-hidden w-full
                ${isSelected ? `${rStyle.border} ring-2 ring-white/10 ${rStyle.bg}` : `border-zinc-800 bg-zinc-900/60 hover:border-zinc-600`}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-black/30 border border-zinc-800 flex items-center justify-center ${slot.color}`}>
                    {slot.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white truncate">{equip.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black ${rStyle.text}`}>{equip.rarity}</span>
                        <span className="text-[9px] text-zinc-600">·</span>
                        <span className="text-[9px] text-zinc-500">{slot.label}</span>
                        <span className="text-[9px] text-zinc-600">·</span>
                        <span className="text-[9px] text-zinc-500">+{equip.level}</span>
                    </div>
                </div>
                {equip.hero_id && (
                    <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <Swords size={9} className="text-emerald-400" />
                    </div>
                )}
            </div>

            {/* Quick stats */}
            <div className="flex gap-2 mt-2">
                {Object.entries(equip.stats).map(([key, val]) => (
                    val ? (
                        <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-zinc-400 font-mono">
                            {key === "crit_rate" ? "CR" : key === "crit_dmg" ? "CD" : key.toUpperCase()} +{typeof val === "number" && val < 1 ? `${(val * 100).toFixed(0)}%` : val}
                        </span>
                    ) : null
                ))}
            </div>

            {/* Set indicator */}
            {equip.set_name && (
                <div className="mt-2 text-[8px] uppercase tracking-wider text-zinc-600 font-bold flex items-center gap-1">
                    <Gem size={8} />
                    Set: {equip.set_name}
                </div>
            )}
        </motion.button>
    );
}

// =============================================================================
// EQUIPMENT DETAIL
// =============================================================================

function EquipDetail({ equip, heroes, onEquip, onUpgrade, isUpgrading }: {
    equip: Equipment;
    heroes: Hero[];
    onEquip: (heroId: string) => void;
    onUpgrade: () => void;
    isUpgrading: boolean;
}) {
    const rStyle = RARITY_STYLE[equip.rarity];
    const slot   = SLOT_META[equip.slot];
    const isMaxLevel = equip.level >= equip.max_level;
    const equippedHero = heroes.find((h) => h.id === equip.hero_id);
    const availableHeroes = heroes.filter((h) => h.team_slot !== null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`rounded-2xl border ${rStyle.border} ${rStyle.bg} p-5 space-y-4`}
        >
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-black/30 border ${rStyle.border} flex items-center justify-center ${slot.color}`}>
                    {slot.icon}
                </div>
                <div className="flex-1">
                    <div className={`text-xs font-black ${rStyle.text}`}>{equip.rarity}</div>
                    <h3 className="text-lg font-black text-white">{equip.name}</h3>
                    <div className="text-xs text-zinc-400">{slot.label} · Nível {equip.level}/{equip.max_level}</div>
                </div>
            </div>

            {/* Level progress */}
            <div className="space-y-1">
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                            equip.rarity === "Lendário" ? "from-amber-500 to-orange-400" :
                            equip.rarity === "Épico" ? "from-purple-500 to-indigo-400" :
                            "from-blue-500 to-cyan-400"
                        }`}
                        style={{ width: `${(equip.level / equip.max_level) * 100}%` }}
                    />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
                {Object.entries(equip.stats).map(([key, val]) => {
                    if (!val) return null;
                    const isPercent = key === "crit_rate" || key === "crit_dmg";
                    const display = isPercent ? `${(val * 100).toFixed(1)}%` : `+${val}`;
                    const label = key === "crit_rate" ? "Taxa Crítica" : key === "crit_dmg" ? "Dano Crítico" :
                                  key === "atk" ? "Ataque" : key === "def" ? "Defesa" :
                                  key === "hp" ? "HP" : key === "spd" ? "Velocidade" : key;
                    return (
                        <div key={key} className="bg-black/20 rounded-lg p-2.5 text-center">
                            <div className="text-sm font-bold text-zinc-200">{display}</div>
                            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Set bonus */}
            {equip.set_name && (
                <div className="bg-black/20 rounded-lg p-3 border border-zinc-800/50">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                        <Gem size={10} /> Set: {equip.set_name}
                    </div>
                    <p className="text-xs text-zinc-300">
                        {equip.set_bonus || "2 peças: Bônus elemental. 4 peças: Habilidade de Set."}
                    </p>
                </div>
            )}

            {/* Equipped on */}
            {equippedHero && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Swords size={11} />
                    Equipado em: <span className="text-white font-bold">{equippedHero.name}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <motion.button
                    whileHover={!isMaxLevel ? { scale: 1.02 } : {}}
                    whileTap={!isMaxLevel ? { scale: 0.97 } : {}}
                    onClick={onUpgrade}
                    disabled={isMaxLevel || isUpgrading}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        isMaxLevel ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" :
                        `bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/15`
                    }`}
                >
                    {isUpgrading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isMaxLevel ? (
                        "Nível Máximo"
                    ) : (
                        <><ArrowUpRight size={14} /> Aprimorar</>
                    )}
                </motion.button>

                {/* Equip quick menu */}
                {availableHeroes.length > 0 && (
                    <div className="relative group">
                        <button className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-bold transition-all flex items-center gap-1">
                            <Swords size={12} /> Equipar
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden hidden group-hover:block z-20">
                            {availableHeroes.map((hero) => (
                                <button key={hero.id}
                                    onClick={() => onEquip(hero.id)}
                                    className="w-full px-4 py-2.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-between"
                                >
                                    <span>{hero.name}</span>
                                    <span className="text-zinc-600">{hero.rarity}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// =============================================================================
// EQUIPMENT PANEL — MAIN
// =============================================================================

interface EquipmentPanelProps {
    playerId: string;
    equipment: Equipment[];
    heroes: Hero[];
    onEquipmentUpdate: (equips: Equipment[]) => void;
}

export function EquipmentPanel({ playerId, equipment, heroes, onEquipmentUpdate }: EquipmentPanelProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filterSlot, setFilterSlot] = useState<EquipSlot | "all">("all");
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filtered = equipment.filter((e) => filterSlot === "all" || e.slot === filterSlot);
    const selected = equipment.find((e) => e.id === selectedId);

    const handleUpgrade = async (equipId: string) => {
        setIsUpgrading(true);
        setError(null);
        try {
            const res = await api.post(`/equipment/${equipId}/upgrade?player_id=${playerId}`);
            const updated = equipment.map((e) => e.id === equipId ? { ...e, ...res.data } : e);
            onEquipmentUpdate(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao aprimorar.");
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleEquip = async (equipId: string, heroId: string) => {
        try {
            await api.post(`/equipment/${equipId}/equip?hero_id=${heroId}`);
            const updated = equipment.map((e) => e.id === equipId ? { ...e, hero_id: heroId } : e);
            onEquipmentUpdate(updated);
        } catch (e: any) {
            setError(e?.response?.data?.detail || "Erro ao equipar.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterSlot("all")}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        filterSlot === "all" ? "border-zinc-600 bg-zinc-800 text-white" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    Todos ({equipment.length})
                </button>
                {(["Weapon", "Armor", "Accessory", "Relic"] as EquipSlot[]).map((slot) => {
                    const slotMeta = SLOT_META[slot];
                    const count = equipment.filter((e) => e.slot === slot).length;
                    return (
                        <button key={slot} onClick={() => setFilterSlot(slot)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                filterSlot === slot ? `border-zinc-600 bg-zinc-800 text-white` : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {slotMeta.icon}
                            {slotMeta.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((equip) => (
                        <EquipCard
                            key={equip.id}
                            equip={equip}
                            isSelected={selectedId === equip.id}
                            onClick={() => setSelectedId(equip.id === selectedId ? null : equip.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center space-y-3">
                    <div className="text-4xl opacity-30">⚔️</div>
                    <p className="text-zinc-500 text-sm">Nenhum equipamento encontrado nesta categoria.</p>
                </div>
            )}

            {/* Detail */}
            <AnimatePresence>
                {selected && (
                    <EquipDetail
                        equip={selected}
                        heroes={heroes}
                        onEquip={(heroId) => handleEquip(selected.id, heroId)}
                        onUpgrade={() => handleUpgrade(selected.id)}
                        isUpgrading={isUpgrading}
                    />
                )}
            </AnimatePresence>

            {error && (
                <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-center">{error}</div>
            )}
        </div>
    );
}
