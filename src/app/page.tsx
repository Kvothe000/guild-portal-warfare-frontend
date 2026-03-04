"use client";

import { useState } from "react";
import { Coins, Swords, Gem, Ticket, ShieldAlert } from "lucide-react";
import { api, fetchPlayerWallet, fetchPlayerHeroes, pullGacha } from "@/lib/api";

export default function Dashboard() {
  const [playerId, setPlayerId] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlayerData = async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const wData = await fetchPlayerWallet(playerId);
      setWallet(wData);
      const hData = await fetchPlayerHeroes(playerId);
      setHeroes(hData);
      setMessage("Data loaded successfully.");
    } catch (error: any) {
      setMessage("Error loading data. Make sure the Player ID exists.");
    }
    setLoading(false);
  };

  const handleSummon = async (amount: number, currency: "crystal" | "ticket") => {
    setLoading(true);
    setMessage(`Summoning ${amount}x using ${currency}...`);
    try {
      const res = await pullGacha(playerId, amount, currency);
      setMessage(res.message);
      setWallet(res.wallet_state);
      setHeroes((prev) => [...prev, ...res.heroes_pulled]); // Append new heroes
    } catch (error: any) {
      setMessage(error.response?.data?.detail || "Summon failed.");
    }
    setLoading(false);
  };

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-12">
      {/* HEADER */}
      <header className="flex flex-col items-center space-y-4 text-center">
        <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-indigo-400 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
          God Mode Dashboard
        </h1>
        <p className="text-zinc-400 max-w-2xl text-lg">
          Live Service Admin Panel. Manage economies, roll the Gacha, and view your player's roster in real-time.
        </p>
      </header>

      {/* PLAYER BINDING */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-2 block">
            Target Player ID
          </label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 outline-none focus:border-purple-500 transition-colors"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          />
        </div>
        <button
          onClick={loadPlayerData}
          disabled={loading || !playerId}
          className="mt-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          {loading ? "Syncing..." : "Sync Data"}
        </button>
      </section>

      {message && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 px-4 py-3 rounded-lg text-center animate-pulse">
          {message}
        </div>
      )}

      {/* ADMIN PANELS */}
      {wallet && (
        <div className="grid md:grid-cols-2 gap-8">

          {/* WALLET */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 mb-6">
              <Coins className="text-amber-400" /> Wallet State
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Crystals</span>
                <span className="text-2xl font-black text-rose-400 flex items-center gap-2">
                  <Gem size={20} /> {wallet.crystals_premium}
                </span>
              </div>
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Tickets</span>
                <span className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                  <Ticket size={20} /> {wallet.summon_tickets}
                </span>
              </div>
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                <span className="text-zinc-500 text-xs font-bold uppercase block mb-1">Gold</span>
                <span className="text-2xl font-black text-amber-200">
                  {wallet.gold.toLocaleString()}
                </span>
              </div>
              <div className="bg-zinc-950 rounded-xl p-4 border border-indigo-900/50">
                <span className="text-indigo-400 text-xs font-bold uppercase block mb-1">Pity Counter</span>
                <span className="text-2xl font-black text-indigo-200">
                  {wallet.pity_counter} / 60
                </span>
              </div>
            </div>
          </div>

          {/* GACHA BANNER */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldAlert size={120} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2 mb-2 relative z-10">
              <Swords className="text-purple-400" /> Grand Summon
            </h2>
            <p className="text-sm text-zinc-400 mb-6 relative z-10">
              1% S-Rank Rate • Guaranteed S-Rank at 60 Pity.
            </p>

            <div className="space-y-4 relative z-10">
              <div className="flex gap-4">
                <button
                  onClick={() => handleSummon(1, "crystal")}
                  disabled={loading || wallet.crystals_premium < 100}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  Roll 1x <span className="text-rose-400 font-normal ml-2">100 G</span>
                </button>
                <button
                  onClick={() => handleSummon(10, "crystal")}
                  disabled={loading || wallet.crystals_premium < 1000}
                  className="flex-1 bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 from-purple-600 to-indigo-600 disabled:opacity-50 text-white shadow-lg shadow-purple-500/20 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  Roll 10x <span className="text-rose-300 font-normal ml-2">1000 G</span>
                </button>
              </div>
              <button
                onClick={() => handleSummon(1, "ticket")}
                disabled={loading || wallet.summon_tickets < 1}
                className="w-full bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-700/50 disabled:opacity-50 text-emerald-300 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                Use Summon Ticket (1x)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROSTER */}
      {heroes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-100">Hero Roster <span className="text-zinc-600">({heroes.length})</span></h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {heroes.map((hero) => {
              const rColor = hero.max_hp > 200 ? "border-amber-500/50 bg-amber-950/20 text-amber-200"
                : hero.max_hp > 130 ? "border-purple-500/50 bg-purple-950/20 text-purple-200"
                  : "border-zinc-700/50 bg-zinc-900 text-zinc-400";

              return (
                <div key={hero.id} className={`p-4 rounded-xl border ${rColor} flex flex-col gap-2 hover:scale-105 transition-transform cursor-default`}>
                  <div className="text-xs font-bold uppercase opacity-60 tracking-wider flex justify-between">
                    {hero.role}
                    <span>Lv.{hero.level}</span>
                  </div>
                  <div className="font-black text-lg truncate" title={hero.name}>{hero.name}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs opacity-80 mt-2">
                    <div className="bg-black/30 px-2 py-1 rounded">ATK {hero.attack}</div>
                    <div className="bg-black/30 px-2 py-1 rounded">HP {hero.max_hp}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
