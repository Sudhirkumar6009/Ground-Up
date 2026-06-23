/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  Users, 
  MapPin, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { PlatformStats } from "../types";

interface HeroProps {
  stats: PlatformStats;
  onScrollToExplore: () => void;
  onOpenReportForm: () => void;
}

export default function Hero({ stats, onScrollToExplore, onOpenReportForm }: HeroProps) {
  return (
    <section id="hero-section" className="bg-white border-b border-slate-100 select-none overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* LEFT COLUMN: Clean typography and statistics */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-4">
              <h1 className="font-display text-5xl font-extrabold tracking-tight text-[#0B2545] sm:text-6xl md:text-7xl leading-[1.1]">
                Build Your<br />
                Community From<br />
                The <span className="text-[#22C55E]">Ground Up</span>
              </h1>
              <p className="max-w-xl text-base text-slate-500 sm:text-lg md:text-xl font-normal leading-relaxed">
                Empowering citizens to report, track, and resolve local civic issues. Join thousands making real change in their neighborhoods.
              </p>
            </div>

            {/* Interactive Click triggers */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                id="btn-report-issue"
                onClick={onOpenReportForm}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#0f345e] transition cursor-pointer"
              >
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                id="btn-learn-more"
                onClick={onScrollToExplore}
                className="inline-flex items-center justify-center rounded-lg border border-[#0B2545]/20 bg-white px-6 py-3.5 text-sm font-semibold text-[#0B2545] hover:bg-slate-50 transition cursor-pointer"
              >
                Learn More
              </button>
            </div>

            {/* Stat records identical to mockup footer */}
            <div className="pt-6 flex flex-wrap items-center gap-8 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#22C55E]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0B2545]">12K+</div>
                  <div className="text-xs text-slate-400 font-medium">Active Citizens</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#22C55E]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0B2545]">8.5K</div>
                  <div className="text-xs text-slate-400 font-medium">Issues Resolved</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Gorgeous floating card showing live updates */}
          <div className="lg:col-span-5 flex justify-center animate-fadeIn">
            <div className="relative w-full max-w-md rounded-2xl bg-[#0B2545] p-6 shadow-2xl text-left select-none overflow-hidden">
              
              {/* Decorative radial lighting inside dark card */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#10B981]/10 to-transparent pointer-events-none" />

              {/* Head line with badge */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span className="text-xs font-bold tracking-widest text-slate-300/80 uppercase">
                  Greenwood Dispatch
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E] px-3 py-1 text-xs font-bold text-white shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Live Updates
                </span>
              </div>

              {/* Content entries with elegant left states and times */}
              <div className="space-y-4 relative z-10">
                
                {/* Entry 1 */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-[#22C55E]" />
                      <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">
                        Resolved
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white block">
                      Pothole on Main St
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-350 shrink-0">
                    2 hrs ago
                  </span>
                </div>

                {/* Entry 2 */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        In Progress
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white block">
                      Streetlight repair
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-350 shrink-0">
                    5 hrs ago
                  </span>
                </div>

                {/* Entry 3 */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                        Reported
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white block">
                      Water leak detected
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-350 shrink-0">
                    1 day ago
                  </span>
                </div>

              </div>

              {/* Dynamic connection indicator */}
              <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-white/10 pt-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-ping" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Realtime GIS Data Streams Operational
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
