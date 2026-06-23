/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Building2, 
  MapPin, 
  Bot, 
  CheckCircle2, 
  TrendingUp, 
  AlertOctagon,
  TrendingDown,
  Sparkles,
  BarChart,
  Grid
} from "lucide-react";
import { PlatformStats } from "../types";

interface AnalyticsDashboardProps {
  stats: PlatformStats;
}

export default function AnalyticsDashboard({ stats }: AnalyticsDashboardProps) {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRegenerateForecasts = async () => {
    setRecalculating(true);
    try {
      const res = await fetch("/api/dashboard/generate-insights", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setTrends(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch("/api/dashboard/predictions");
      if (res.ok) {
        const data = await res.json();
        setTrends(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Precompiled statistics vector calculations for donut chart styled with Navy Blue & Emerald Green accents
  const DONUT_CHART = [
    { label: "Potholes & Roads", percentage: 38, strokeDash: "119 100", offset: "0", color: "text-[#0B2545]" },
    { label: "Water & Drainage", percentage: 26, strokeDash: "81 100", offset: "-119", color: "text-[#22C55E]" },
    { label: "Streetlights Out", percentage: 20, strokeDash: "62 100", offset: "-200", color: "text-sky-400" },
    { label: "Illegal Waste Dump", percentage: 16, strokeDash: "50 100", offset: "-262", color: "text-emerald-300" }
  ];

  return (
    <div id="analytics-panel" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 select-none font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-5 text-left">
        <div>
          <h2 className="text-2xl font-black text-[#0B2545] tracking-tight flex items-center gap-2 font-display">
            <Building2 className="h-5 w-5 text-[#22C55E]" />
            GroundUp Civic Insight Panel
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">Real-time prediction indexes for Greenwood municipal managers and active citizen auditors.</p>
        </div>
        <div className="rounded-lg bg-emerald-50/50 p-2 px-3.5 text-xs font-bold border border-[#22C55E]/10 text-slate-600 flex items-center gap-1.5 self-start md:self-auto">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          DATABASE STREAM: Green Ward 4 Active Hub active
        </div>
      </div>

      {/* Grid statistics metrics panel cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: "Recorded reports", count: stats.totalIssues, helper: "Total active complaints registered" },
          { label: "Total resolved", count: stats.resolvedIssues, helper: "Permanent repair tasks completed" },
          { label: "Active civilian loggers", count: stats.activeCitizens, helper: "Signed citizen verifying authorities" },
          { label: "Avg repair closure duration", count: `${stats.avgResolutionTimeHours} Hrs`, helper: "Department dispatch efficiency rate" }
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0B2545]/40 block leading-none">{c.label}</span>
            <div className="text-3xl font-black text-[#0B2545] mt-2.5 leading-none font-display">{c.count}</div>
            <p className="text-[10px] font-semibold text-slate-400 mt-2 leading-none">{c.helper}</p>
          </div>
        ))}
      </div>

      {/* SVG Graphics section (Donut splits, Line resolution progression, predictions drawer) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-8">
        
        {/* DONUT: CATEGORY SHARE COMPOSITION */}
        <div className="lg:col-span-4 rounded-xl border border-slate-100 bg-white p-5 flex flex-col justify-between h-[360px] text-left">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Category Share Composition</span>
            <h3 className="text-sm font-extrabold text-[#0B2545] mt-1 font-display">Incident Categorization</h3>
          </div>

          {/* SVG Donut */}
          <div className="flex items-center justify-center p-2">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 36 36" className="h-full w-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                
                {DONUT_CHART.map((d) => (
                  <circle 
                    key={d.label}
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    className={`${d.color} stroke-current`} 
                    strokeWidth="3.2" 
                    strokeDasharray={d.strokeDash} 
                    strokeDashoffset={d.offset} 
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[#0B2545] leading-none">85%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase mt-1">Accuracy Index</span>
              </div>
            </div>
          </div>

          {/* Legend index table */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            {DONUT_CHART.map(d => (
              <div key={d.label} className="flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-sm bg-current ${d.color}`} />
                <span className="text-slate-500 truncate">{d.label} ({d.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* LINE: AVERAGE TASK RESOLUTION THROUGHPUT */}
        <div className="lg:col-span-5 rounded-xl border border-slate-100 bg-white p-5 flex flex-col justify-between h-[360px] text-left">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Service Progression Over Time</span>
            <h3 className="text-sm font-extrabold text-[#0B2545] mt-1 font-display">Weekly Resolution Rate</h3>
          </div>

          <div className="flex-1 flex items-end justify-between px-2 pt-6 pb-2 h-40">
            {/* Custom high-performance animated bar graph of monthly resolution volumes */}
            {[
              { val: 45, label: "W1" },
              { val: 68, label: "W2" },
              { val: 56, label: "W3" },
              { val: 82, label: "W4" },
              { val: 91, label: "W5" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-slate-800">{b.val}%</span>
                <div className="relative w-7 bg-slate-50 rounded-md overflow-hidden h-28 border border-slate-100">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${b.val}%` }}
                    transition={{ duration: 0.8 }}
                    className="absolute bottom-0 w-full bg-[#22C55E] rounded-md" 
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{b.label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-450 leading-none">
            <span>Overall Dispatch Rate Improvement: +14.2%</span>
            <span>Target Goal: 90%</span>
          </div>
        </div>

        {/* INSIGHTS PANEL (PREDICTIVE ANALYTICS ENGINE) */}
        <div className="lg:col-span-3 rounded-xl border border-slate-100 bg-[#0B2545] text-white p-5 flex flex-col justify-between h-[360px] text-left relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#10B981]/15 to-transparent pointer-events-none" />

          <div className="relative z-10 flex justify-between items-start w-full">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-white text-[#0B2545] p-1">
                  <Bot className="h-3 w-3" />
                </span>
                <span className="text-[9px] uppercase font-black tracking-widest text-[#22C55E]">Forecast Agent</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 font-display mt-1">Greenwood Trends</h3>
            </div>

            <button
              type="button"
              onClick={handleRegenerateForecasts}
              disabled={recalculating}
              className="text-[10px] text-[#22C55E] hover:text-[#2ee06e] font-black tracking-wider uppercase border border-[#22C55E]/20 rounded-md px-2 py-1 bg-white/5 cursor-pointer disabled:opacity-40 transition-all self-start"
            >
              {recalculating ? "CALC..." : "REFRESH"}
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-300 relative z-10">Loading forecast...</div>
          ) : trends ? (
            <div className="space-y-4 pt-1 relative z-10">
              <div>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider block">Agent Weather/Sewer Hazard Forecast:</span>
                <p className="text-[11px] leading-relaxed font-bold text-white mt-1.5">
                  "{trends.predictedNextWeek}"
                </p>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-2">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider block">Clustered Risk Hotzones:</span>
                {trends.hotspots.map((h: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[10.5px]">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                      <span className="font-semibold text-slate-200 uppercase">{h.category} Category</span>
                    </div>
                    <span className="font-bold text-slate-300">{h.issueCount} events active</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-8 relative z-10">Problem compiling scheduled agent forecast telemetry. Check secrets.</div>
          )}

          <div className="border-t border-white/10 pt-3 flex items-center gap-1 text-[9px] text-slate-300 leading-none relative z-10">
            <Sparkles className="h-3 w-3 text-[#22C55E]" />
            <span>AI intelligence logs run on 6h telemetry ticks.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
