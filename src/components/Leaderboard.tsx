/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Award, 
  Flame, 
  Compass, 
  Star, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { User, Badge } from "../types";

interface LeaderboardProps {
  currentUser: User;
}

export default function Leaderboard({ currentUser }: LeaderboardProps) {
  const [board, setBoard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUser.stats.xpPoints]); // Refresh on XP transactions!

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/users/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setBoard(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getLevelTier = (level: number) => {
    switch (level) {
      case 1: return "Newcomer";
      case 2: return "Observer";
      case 3: return "Active Reporter";
      case 4: return "Civic Advocate";
      case 5: return "Local Hero";
      case 6: return "Community Master";
      default: return "Citizen";
    }
  };

  return (
    <div id="gamified-leaderboard" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 select-none font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-5 text-left animate-fadeIn">
        <div>
          <h2 className="text-2xl font-black text-[#0B2545] tracking-tight flex items-center gap-2 font-display">
            <Trophy className="h-5.5 w-5.5 text-[#22C55E]" />
            Community Standings
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Greenwood rankings highlighting municipal pioneers reporting, verifying, and fixing neighborhood disrepair.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-left">
        
        {/* LEFT PROFILE HIGHLIGHT BOX (THE LOGGED IN CITIZEN CLAD IN BLUE & GREEN ATRIBUTES) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-100 bg-[#FAFCFF] p-6 flex flex-col justify-between h-[420px] shadow-sm relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#22C55E]/5 to-transparent pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#0B2545]/40 leading-none">Your Hero Dossier</h3>
            
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-[#22C55E]">
                <img src={currentUser.avatar} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#0B2545] leading-none font-display">{currentUser.name}</h4>
                <div className="flex items-center gap-1.5 mt-2">
                  <Star className="h-3.5 w-3.5 text-[#22C55E] fill-current" />
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">{getLevelTier(currentUser.stats.level)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-3 text-xs">
              <div className="rounded bg-white p-2 border border-slate-100 shadow-xs">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Reported</span>
                <span className="text-base font-black text-[#0B2545] block mt-1 leading-none font-display">{currentUser.stats.issuesReported}</span>
              </div>
              <div className="rounded bg-white p-2 border border-slate-100 shadow-xs">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">Verified</span>
                <span className="text-base font-black text-[#0B2545] block mt-1 leading-none font-display">{currentUser.stats.issuesVerified}</span>
              </div>
              <div className="rounded bg-white p-2 border border-slate-100 shadow-xs">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none">XP Points</span>
                <span className="text-base font-black text-[#22C55E] block mt-1 leading-none font-display">{currentUser.stats.xpPoints}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3.5 relative z-10">
            <span className="text-[10px] font-black text-[#0B2545]/40 uppercase tracking-widest block">Unlocked Badges ({currentUser.badges.length}):</span>
            
            <div className="flex gap-2 flex-wrap">
              {currentUser.badges.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic pb-2">Log community issues or verify reports to claim badges!</p>
              ) : (
                currentUser.badges.map((b: Badge) => (
                  <div 
                    key={b.id} 
                    className="flex items-center gap-1 rounded-full bg-white border border-[#22C55E]/20 px-3 py-1 text-xs font-semibold select-none shadow-xs text-slate-700"
                    title={b.description}
                  >
                    <span>{b.icon}</span>
                    <span>{b.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT TOP-10 RANKINGS LEADER table */}
        <div className="lg:col-span-8 rounded-xl border border-slate-100 bg-white p-6 shadow-sm min-h-[420px]">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 leading-none mb-6">Greenwood Top Citizen rank</h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading standings...</div>
          ) : (
            <div className="space-y-3">
              {board.map((u, idx) => {
                const rank = idx + 1;
                const isMe = u.id === currentUser.id;
                
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center justify-between rounded-lg p-3 transition border ${
                      isMe 
                        ? "bg-[#FAFCFF] border-[#0B2545] shadow-xs" 
                        : "bg-white border-slate-100 hover:border-[#0B2545]/20"
                    }`}
                  >
                    
                    {/* Rank, Image, Name credentials */}
                    <div className="flex items-center gap-4.5">
                      <span className="text-xs font-black text-[#0B2545] block text-center w-6">
                        {getRankBadge(rank)}
                      </span>

                      <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 shrink-0">
                        <img src={u.avatar} alt="Citizen Avatar" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      </div>

                      <div className="text-left">
                        <h4 className="text-xs font-black text-[#0B2545] uppercase tracking-wide leading-none">{u.name}</h4>
                        <div className="flex items-center gap-1 mt-1 font-bold text-[10px] text-slate-450 uppercase">
                          <span>Lv.{u.stats.level}</span>
                          <span>•</span>
                          <span>{getLevelTier(u.stats.level)}</span>
                        </div>
                      </div>

                    </div>

                    {/* Stats metrics right */}
                    <div className="flex items-center gap-6 text-xs text-right">
                      {u.stats.streak > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold" title="Day consecutive streak">
                          <Flame className="h-4.5 w-4.5 fill-current" />
                          <span>{u.stats.streak}d</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-xs font-black text-[#22C55E] block leading-none font-display">{u.stats.xpPoints} XP</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mt-1 leading-none">
                          {u.stats.issuesReported} reported
                        </span>
                      </div>

                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
