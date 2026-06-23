/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
import * as LNamespace from "leaflet";
const L = (LNamespace as any).default || LNamespace;

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

  // Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize interactive Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Greenwood / Seattle coordinates
      const map = L.map(mapContainerRef.current, {
        center: [47.605, -122.33],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync marks onto the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Custom CSS style for beautiful marker pulses
    const styleId = "leaflet-marker-pulse-style";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        @keyframes customMarkerPulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .marker-pulse-ring {
          animation: customMarkerPulse 1.8s ease-out infinite;
        }
      `;
      document.head.appendChild(styleEl);
    }

    filteredIssues.forEach((issue) => {
      const { lat, lng } = issue.location.coordinates;
      if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
        let color = "#F59E0B"; // reported orange
        if (issue.status === IssueStatus.RESOLVED) color = "#22C55E"; // resolved green
        else if (issue.status === IssueStatus.IN_PROGRESS) color = "#0EA5E9"; // in progress blue
        else if (issue.status === IssueStatus.VERIFIED) color = "#10B981"; // verified emerald

        const iconHtml = `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div style="position: absolute; width: 11px; height: 11px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4); z-index: 10;"></div>
            <div class="marker-pulse-ring" style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; opacity: 0.35; z-index: 1;"></div>
          </div>
        `;

        const divIcon = L.divIcon({
          className: "custom-leaflet-pin",
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon: divIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #1e293b; max-width: 180px; text-align: left; padding: 2px;">
            <div style="font-weight: 700; color: #0b2545; margin-bottom: 3.5px; font-size: 11px; line-height: 1.3;">
              ${issue.title}
            </div>
            <div style="font-size: 9.5px; color: #64748b; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
              ${issue.location.address || "Greenwood Municipal Area"}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background-color: #f1f5f9; color: #475569; font-weight: 700; padding: 1px 4px; border-radius: 3px; font-size: 8.5px; text-transform: uppercase;">
                ${issue.severity.toUpperCase()}
              </span>
              <span style="font-weight: 700; color: ${color}; text-transform: uppercase; font-size: 8.5px;">
                ${issue.status.replace("_", " ")}
              </span>
            </div>
          </div>
        `, {
          closeButton: false,
          minWidth: 150
        });

        marker.on("click", () => {
          onSelectIssue(issue);
        });

        markersRef.current.push(marker);
      }
    });

    if (filteredIssues.length > 0) {
      const coords = filteredIssues
        .map((i) => [i.location.coordinates.lat, i.location.coordinates.lng] as [number, number])
        .filter(([la, ln]) => typeof la === "number" && !isNaN(la) && typeof ln === "number" && !isNaN(ln));

      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [filteredIssues, onSelectIssue]);

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
        
        {/* LEFT COLUMN: INTERACTIVE LEAFLET GIS MAP */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-100 bg-white overflow-hidden h-[540px] shadow-sm">
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between text-left">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">GIS Mapping Feed</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time GPS mapping & citizen verification pins</p>
            </div>
            <span className="rounded bg-emerald-50 text-[#10B981] border border-emerald-100 text-[9px] uppercase font-bold p-1 px-2">
              🛰️ Live GPS
            </span>
          </div>

          <div className="flex-1 relative bg-slate-50/10 h-full w-full">
            {/* Real Leaflet Map mount target element */}
            <div 
              ref={mapContainerRef} 
              className="absolute inset-0 w-full h-full z-10" 
              style={{ minHeight: "100%", minWidth: "100%" }}
            />
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

                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 leading-none">{issue.location.ward}</span>
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
