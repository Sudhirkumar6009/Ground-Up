/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  AlertTriangle, 
  ThumbsUp, 
  MessageSquare, 
  ChevronRight,
  ShieldCheck,
  Zap,
  CircleDot
} from "lucide-react";
import { Issue, IssueCategory, IssueSeverity, IssueStatus } from "../types";

interface IssueFeedProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onVote: (issueId: string, type: "up" | "down") => void;
  userId: string;
  onOpenReportForm: () => void;
}

export default function IssueFeed({
  issues,
  onSelectIssue,
  onVote,
  userId,
  onOpenReportForm
}: IssueFeedProps) {
  // Filters State
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map state
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Wards definition for vector GIS overview map with stunning light blue/green styling
  const WARDS = [
    { id: "west_ward", name: "West Ward 4", path: "M 10,120 L 10,10 L 150,10 L 120,240 Z", fill: "fill-sky-50/40 hover:fill-emerald-50/50", center: { x: 75, y: 100 } },
    { id: "central_ward", name: "Central Ward 2", path: "M 150,10 L 290,10 L 250,220 L 120,240 Z", fill: "fill-sky-50/20 hover:fill-emerald-50/40", center: { x: 200, y: 110 } },
    { id: "east_ward", name: "East Ward 1", path: "M 290,10 L 390,10 L 390,260 L 250,220 Z", fill: "fill-sky-50/30 hover:fill-emerald-50/50", center: { x: 320, y: 120 } }
  ];

  // Filtering Logic
  const filteredIssues = issues.filter(issue => {
    if (categoryFilter !== "all" && issue.category !== categoryFilter) return false;
    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      const matchAddress = issue.location.address.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddress) return false;
    }
    return true;
  });

  const getSeverityStyle = (s: IssueSeverity) => {
    switch (s) {
      case IssueSeverity.CRITICAL:
        return "bg-rose-50 text-rose-600 border border-rose-100 font-semibold";
      case IssueSeverity.HIGH:
        return "bg-[#0B2545]/5 text-[#0B2545] border border-[#0B2545]/10 font-semibold";
      case IssueSeverity.MEDIUM:
        return "bg-slate-50 border border-slate-200 text-slate-600";
      default:
        return "bg-slate-50 border border-slate-100 text-slate-400";
    }
  };

  const getStatusStyle = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.REPORTED: return "text-amber-600 bg-amber-50 border border-amber-100";
      case IssueStatus.VERIFIED: return "text-emerald-600 bg-emerald-50 border border-emerald-100";
      case IssueStatus.IN_PROGRESS: return "text-sky-600 bg-sky-50 border border-sky-100";
      case IssueStatus.RESOLVED: return "text-emerald-700 bg-emerald-100/50 border border-emerald-200";
      default: return "text-slate-500 bg-slate-50 border border-slate-100";
    }
  };

  return (
    <div id="issue-explorer-container" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 select-none">
      
      {/* Dynamic Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-extrabold text-[#0B2545] tracking-tight flex items-center gap-2 font-display">
            <CircleDot className="h-5 w-5 text-[#22C55E]" />
            Live Citizen Incident Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">Explore real-time infrastructure logs tracked and analyzed on the Greenwood municipal network.</p>
        </div>
        <button
          id="btn-report-fab"
          onClick={onOpenReportForm}
          className="rounded-lg bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#0f345e] transition flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <MapPin className="h-4 w-4" />
          File New Incident Report
        </button>
      </div>

      {/* Filter and Search Layout Rows */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-[#FAFCFF] p-4 sm:grid-cols-2 lg:grid-cols-5 animate-fadeIn">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            id="search-input"
            type="text"
            placeholder="Search titles, descriptions, wards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs outline-none focus:border-[#0B2545] transition-colors"
          />
        </div>

        <div>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none cursor-pointer hover:border-[#0B2545] transition-colors"
          >
            <option value="all">🔍 All Concerns</option>
            <option value={IssueCategory.POTHOLE}>Potholes & Roads</option>
            <option value={IssueCategory.DRAINAGE}>Drainage & Floods</option>
            <option value={IssueCategory.STREETLIGHT}>Street Lights Out</option>
            <option value={IssueCategory.WASTE}>Waste & Trash</option>
            <option value={IssueCategory.ROAD_DAMAGE}>Road Damage</option>
            <option value={IssueCategory.WATER_LEAK}>Water Leaks</option>
          </select>
        </div>

        <div>
          <select
            id="filter-severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none cursor-pointer hover:border-[#0B2545] transition-colors"
          >
            <option value="all">⚠️ All Severities</option>
            <option value={IssueSeverity.LOW}>Low Intensity</option>
            <option value={IssueSeverity.MEDIUM}>Medium</option>
            <option value={IssueSeverity.HIGH}>High Danger</option>
            <option value={IssueSeverity.CRITICAL}>Critical Threat</option>
          </select>
        </div>

        <div>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none cursor-pointer hover:border-[#0B2545] transition-colors"
          >
            <option value="all">⚡ All Statuses</option>
            <option value={IssueStatus.REPORTED}>Reported</option>
            <option value={IssueStatus.VERIFIED}>Verified</option>
            <option value={IssueStatus.IN_PROGRESS}>In Progress</option>
            <option value={IssueStatus.RESOLVED}>Resolved</option>
          </select>
        </div>
      </div>

      {/* Main split-screen panel (Interactive GIS vector map + Feed) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: GORGEOUS FLAT SVG SECTOR MAP */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-100 bg-white overflow-hidden h-[540px] shadow-sm">
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between text-left">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">GIS Mapping Feed</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">District sectors with real-time mapped pinpoints</p>
            </div>
            {hoveredWard && (
              <span className="rounded bg-[#0B2545] text-white text-[10px] uppercase font-bold p-1 px-2">
                {hoveredWard}
              </span>
            )}
          </div>

          <div className="flex-1 relative bg-slate-50/20 flex items-center justify-center p-3">
            {/* SVG MAP SHAPES */}
            <svg 
              viewBox="0 0 400 280" 
              className="w-full h-full max-h-[400px] stroke-slate-200 stroke-[1.5px] cursor-pointer"
            >
              {WARDS.map((w) => (
                <g 
                  key={w.id}
                  onMouseEnter={() => setHoveredWard(w.name)}
                  onMouseLeave={() => setHoveredWard(null)}
                >
                  <path 
                    d={w.path} 
                    className={`${w.fill} stroke-slate-200 transition-all duration-300`} 
                  />
                  <text 
                    x={w.center.x} 
                    y={w.center.y} 
                    className="fill-[#0B2545]/40 text-[9px] font-bold text-center pointer-events-none select-none uppercase tracking-widest font-mono"
                  >
                    {w.name.split(" ")[0]}
                  </text>
                </g>
              ))}

              {/* RENDER ACTIVE INCIDENTS COORDINATE PIN drops on top of map quadrants */}
              {filteredIssues.map((issue) => {
                const lngStart = -122.3400;
                const latStart = 47.6150;
                const lngRange = 0.02;
                const latRange = 0.02;

                const x = ((issue.location.coordinates.lng - lngStart) / lngRange) * 400;
                const y = ((latStart - issue.location.coordinates.lat) / latRange) * 280;

                // Color code markers based on state
                let colorClass = "fill-amber-500";
                if (issue.status === IssueStatus.RESOLVED) colorClass = "fill-[#22C55E]";
                else if (issue.status === IssueStatus.IN_PROGRESS) colorClass = "fill-sky-500";
                else if (issue.status === IssueStatus.VERIFIED) colorClass = "fill-emerald-500";

                return (
                  <g 
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    className="group"
                  >
                    {/* Ring Pulse animation for Critical/High issues */}
                    {(issue.severity === IssueSeverity.CRITICAL || issue.severity === IssueSeverity.HIGH) && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        className={`stroke-current ${colorClass} opacity-25 animate-ping pointer-events-none`} 
                      />
                    )}
                    
                    {/* Core pin circle */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="6.5" 
                      className={`${colorClass} hover:r-9 transition-all duration-300 stroke-white stroke-2 drop-shadow-sm cursor-pointer`} 
                    />
                    
                    {/* Miniature hover overlay tooltip box */}
                    <g className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                      <rect 
                        x={Math.max(10, Math.min(270, x - 60))} 
                        y={Math.max(10, y - 48)} 
                        width="120" 
                        height="32" 
                        rx="4" 
                        className="fill-[#0B2545] stroke-[#0B2545]/20" 
                      />
                      <text 
                        x={Math.max(10, Math.min(270, x - 60)) + 6}
                        y={Math.max(10, y - 48) + 12}
                        className="fill-white text-[9px] font-bold truncate block w-100"
                        style={{ maxWidth: '100px' }}
                      >
                        {issue.title.length > 20 ? issue.title.substring(0, 18) + "..." : issue.title}
                      </text>
                      <text 
                        x={Math.max(10, Math.min(270, x - 60)) + 6}
                        y={Math.max(10, y - 48) + 24}
                        className="fill-emerald-400 text-[8px] font-semibold"
                      >
                        Priority Index: {issue.priorityScore}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 grid grid-cols-4 gap-2 text-[10px] text-center font-semibold">
            <div className="flex flex-col items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-amber-400" />
              <span className="text-slate-500 uppercase tracking-wider">Reported</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
              <span className="text-slate-500 uppercase tracking-wider">Verified</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 border border-sky-400" />
              <span className="text-slate-500 uppercase tracking-wider">In Progress</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] border border-emerald-500" />
              <span className="text-slate-500 uppercase tracking-wider">Resolved</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCROLLABLE LIST FEED OF COMMUNITY INCIDENTS */}
        <div className="lg:col-span-7 flex flex-col h-[540px]">
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {filteredIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-[#FAFCFF] border border-slate-100 p-6">
                <AlertTriangle className="h-8 w-8 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-800 mt-4">No community issues found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">No recorded reports match your filter metrics. Change search queries or report an incident yourself!</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    layoutId={`issue-card-${issue.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelectIssue(issue)}
                    className="group rounded-xl border border-slate-100 bg-white p-5 hover:border-[#0B2545] hover:shadow-sm transition cursor-pointer relative text-left"
                  >
                    
                    {/* Header Row (Status & Gravity indicators) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-md p-1 px-2 text-[9px] uppercase tracking-widest font-bold leading-none ${getSeverityStyle(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        
                        <span className={`rounded-md p-1 px-2 text-[9px] uppercase tracking-wider font-bold leading-none ${getStatusStyle(issue.status)}`}>
                          {issue.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-500" title="Emergency priority rating scored by AI agents">
                        <Zap className="h-3.5 w-3.5 text-[#22C55E]" />
                        <span className="text-xs font-bold text-slate-700 leading-none">{issue.priorityScore} Priority Score</span>
                      </div>
                    </div>

                    {/* Middle Section (Body, Location coordinates) */}
                    <div className="mt-4 flex gap-4">
                      
                      {issue.media.length > 0 && (
                        <div className="h-16 w-16 w-max-16 shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 relative">
                          <img 
                            src={issue.media[0].url} 
                            alt={issue.title} 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 leading-tight group-hover:text-[#0B2545] truncate">
                          {issue.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>

                    </div>

                    {/* Footer Actions (Upvotes, Ward Address, Reporter stats) */}
                    <div className="border-t border-slate-50 mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-slate-400 text-[10px]">
                      
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-bold text-slate-500 truncate max-w-[200px]">{issue.location.address}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        
                        {/* Vote/Audit Trigger (Community verification counts) */}
                        <button
                          id={`btn-vote-${issue.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onVote(issue.id, "up");
                          }}
                          className={`flex items-center gap-1 rounded bg-slate-50 hover:bg-slate-100 p-1 px-2.5 font-bold transition cursor-pointer ${
                            issue.upvotes.includes(userId) ? "bg-[#0B2545] text-white hover:bg-[#0f345e]" : "text-slate-700 border border-slate-100"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3 fill-current" />
                          <span>Verify ({issue.upvotes.length})</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-semibold">{issue.commentsCount} comments</span>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1" />

                      </div>

                    </div>

                    {/* Miniature identifier of AI analysis completeness */}
                    {issue.aiMetadata.confidence > 0 && (
                      <div className="absolute top-2 right-[125px] hidden sm:flex items-center gap-0.5 text-[9px] font-bold text-[#22C55E]/80 uppercase tracking-widest leading-none">
                        <ShieldCheck className="h-3 w-3" />
                        <span>AI ANALYZED</span>
                      </div>
                    )}

                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
