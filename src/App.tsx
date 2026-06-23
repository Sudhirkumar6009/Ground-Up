/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  HelpCircle,
  Layout,
  Map,
  BarChart,
  Trophy,
  ShieldAlert,
  Loader2,
  Lock,
  ChevronRight,
  Shield,
  Users,
  Building,
  Key,
  Sparkles,
  Globe,
  LogOut,
  Activity,
  FileText,
  CheckCircle2
} from "lucide-react";
import { 
  User, 
  UserRole, 
  Issue, 
  Notification, 
  PlatformStats, 
  IssueStatus 
} from "./types";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import IssueFeed from "./components/IssueFeed";
import IssueReportForm from "./components/IssueReportForm";
import IssueDetailsModal from "./components/IssueDetailsModal";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Leaderboard from "./components/Leaderboard";

export default function App() {
  // Global React Application States
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Dynamic Session & Loading indicators
  const [initialized, setInitialized] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Interaction States
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // Scroll target reference details
  const explorerRef = useRef<HTMLDivElement>(null);

  // Initialize and retrieve current user session on mount
  useEffect(() => {
    synchronizeData(true);

    // High fidelity 4-second reactive polling ticker (simulates real-time sockets)
    const interval = setInterval(() => {
      synchronizeData();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const synchronizeData = async (forceInitial = false) => {
    try {
      // 1. Fetch user parameters
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u);

        // Fetch user notifications if logged in
        if (u && u.id) {
          const notifRes = await fetch(`/api/users/${u.id}/notifications`);
          if (notifRes.ok) {
            const list = await notifRes.json();
            setNotifications(list);
          }
        } else {
          setNotifications([]);
        }
      }

      // 2. Fetch issues list
      const issuesRes = await fetch("/api/issues");
      if (issuesRes.ok) {
        const list = await issuesRes.json();
        setIssues(list);

        // Keep selected modal parameters updated if open
        if (selectedIssue) {
          const updated = list.find((i: Issue) => i.id === selectedIssue.id);
          if (updated) {
            setSelectedIssue(updated);
          }
        }
      }

      // 3. Fetch dashboard platform metrics
      const statsRes = await fetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      
      setInitialized(true);
    } catch (err) {
      console.warn("Synchronize loop encountered network hold", err);
      if (forceInitial) {
        setInitialized(true);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      setLoggingIn("google");
      
      const currentUrl = window.location.origin;
      const redirectUri = `${currentUrl}/auth/callback`;
      
      const res = await fetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (!res.ok) throw new Error("Could not contact the backend authorization endpoint.");
      
      const data = await res.json();
      const popupWidth = 500;
      const popupHeight = 650;
      const left = window.screenX + (window.innerWidth - popupWidth) / 2;
      const top = window.screenY + (window.innerHeight - popupHeight) / 2;
      
      const popup = window.open(
        data.url,
        "google_oauth_popup",
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        throw new Error("Login block: Popup was intercepted. Please allow popups for this civic intelligence workspace to authenticate.");
      }
      
      // Hook up message payload event receiver
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== currentUrl) return;
        
        const { type, userId, error } = event.data || {};
        if (type === "OAUTH_AUTH_SUCCESS") {
          window.removeEventListener("message", handleMessage);
          await synchronizeData();
          setLoggingIn(null);
        } else if (type === "OAUTH_AUTH_FAILED") {
          window.removeEventListener("message", handleMessage);
          setAuthError(error || "OAuth secure identification handshake failed.");
          setLoggingIn(null);
        }
      };
      
      window.addEventListener("message", handleMessage);
      
      // Auto-teardown if window is closed prior to callback
      const popupTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupTimer);
          setTimeout(() => {
            setLoggingIn(null);
          }, 1000);
        }
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "An exception occurred launching Google Login.");
      setLoggingIn(null);
    }
  };

  const handleSimulatedLogin = async (role: UserRole, details: { name: string; email: string; avatar: string }) => {
    try {
      setAuthError(null);
      setLoggingIn(role);
      
      const res = await fetch("/api/auth/login-simulated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: details.name,
          email: details.email,
          avatar: details.avatar
        })
      });
      
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        await synchronizeData();
      } else {
        throw new Error("Could not initialize credentials.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Simulator gateway error");
    } finally {
      setLoggingIn(null);
    }
  };

  const handleLogout = async () => {
    try {
      setActiveTab("feed");
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      console.error("Logout exception", e);
    }
  };

  const handleRoleChange = async (targetRole: UserRole) => {
    try {
      const res = await fetch("/api/auth/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (issueId: string, type: "up" | "down") => {
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        synchronizeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (issueId: string, status: IssueStatus, note: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        synchronizeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitIssue = async (issueData: {
    title: string;
    description: string;
    category: string;
    address: string;
    coordinates: { lng: number; lat: number };
    base64Image?: string;
    isAnonymous: boolean;
  }) => {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData)
    });
    if (res.ok) {
      synchronizeData();
      return res.json();
    }
    throw new Error("Failed to file incident with backend.");
  };

  const handleMarkNotificationsRead = async () => {
    if (!user) return;
    try {
      await fetch(`/api/users/${user.id}/notifications/read`, { method: "PATCH" });
      synchronizeData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleScrollToExplore = () => {
    explorerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!initialized || (user && !stats)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="mx-auto h-12 w-12 rounded-full border-t-2 border-[#1E3A8A]"
          />
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase animate-pulse">Initializing GroundUp GIS Workspace...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show the beautiful, edge-hitting blue/green/white login gate
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#22C55E]/20 text-slate-900 selection:text-[#0B2545]">
        
        {/* Minimal top bar */}
        <header className="bg-white border-b border-slate-100 py-4 px-6 sm:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0B2545] text-white font-black text-base select-none">
                G
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#0B2545]">GroundUp</span>
                <span className="text-[#22C55E] font-extrabold">.</span>
                <span className="ml-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">HYPERLOCAL CIVIC GIS</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse"></span>
              City Server Active
            </div>
          </div>
        </header>

        {/* Hero Section + Split Columns */}
        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Box: Value Propositions, blue/green accent guidelines */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8 text-left py-4">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                  <Activity className="h-3 w-3" />
                  Hyperlocal Action Hub
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B2545] tracking-tight leading-none">
                  Better neighborhoods, <br />
                  <span className="text-slate-900 border-b-4 border-[#22C55E]/40 pb-1">built from the GroundUp</span>
                </h1>
                <p className="text-slate-600 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                  Join a real-time, AI-augmented community infrastructure platform where citizens and city crews collaborate instantly to fix street, utility, safety, and waste concerns.
                </p>
              </div>

              {/* Service Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm transition hover:border-[#22C55E]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22C55E]/10 text-[#22C55E] mb-3">
                    <Map className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-1">Interactive Mapping</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Filing with image evidence and coordinates maps reports directly into regional work corridors.</p>
                </div>

                <div className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm transition hover:border-blue-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-1">AI Classification</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Incidents are autonomously diagnosed to evaluate safety, severity classification, and department agency routing.</p>
                </div>

                <div className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm transition hover:border-blue-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#22C55E] mb-3">
                    <Building className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-1">Agency Action Rails</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Official city authorities dispatch repair tasks, state crews list actions, and file verified resolution evidence logs.</p>
                </div>

                <div className="border border-slate-200 bg-white p-5 rounded-xl shadow-sm transition hover:border-[#22C55E]/60">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-3">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] mb-1">Dynamic Citizen Rewards</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Earn civic XP points, levels, and prestigious merit badges by verifying filings and assisting hazard resolution.</p>
                </div>
              </div>
            </div>

            {/* Right Box: Elegant Secure Login Gateway Card */}
            <div className="lg:col-span-5 flex flex-col justify-between border border-slate-200 bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-left">
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B2545] tracking-tight">Security Gateway</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Authenticate using secure protocols to access the GIS database of Greenwood municipality.</p>
                </div>

                {authError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/50 p-3.5 text-xs text-red-600 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Handshake Rejected</span>
                      {authError}
                    </div>
                  </div>
                )}

                {/* Google Sign-in Command Target */}
                <div>
                  <button
                    disabled={loggingIn !== null}
                    onClick={handleGoogleLogin}
                    className="w-full relative flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer select-none"
                  >
                    {loggingIn === "google" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    ) : (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.5 5.5 0 0 1 8.5 13a5.5 5.5 0 0 1 5.491-5.514c2.216 0 3.81 1.01 4.542 1.69l3.15-3.15C19.462 3.842 16.892 2.5 14 2.5A10.5 10.5 0 0 0 3.5 13a10.5 10.5 0 0 0 10.5 10.5c5.78 0 9.5-4.013 9.5-9.686a9.5 9.5 0 0 0-.154-1.529H12.24z"
                        />
                      </svg>
                    )}
                    <span>
                      {loggingIn === "google" ? "Contacting Google Session..." : "Sign in with Google"}
                    </span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 font-medium mt-2">
                    Standard OAuth protocol redirect securely managed in popup containers.
                  </p>
                </div>

                {/* Simulation Sandbox section */}
                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-bold text-slate-400 tracking-widest text-[9px]">Simulation Sandbox Portals</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Choose a Simulator Role to Review Profile Workflows</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    
                    {/* Simulator Citizen */}
                    <button
                      disabled={loggingIn !== null}
                      onClick={() => handleSimulatedLogin(UserRole.CITIZEN, { 
                        name: "Sudhir Kuchara", 
                        email: "sudhir.kuchara@gmail.com",
                        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      })}
                      className="border border-slate-200 rounded-lg p-3 text-left hover:border-[#22C55E]/70 hover:bg-slate-50/50 transition cursor-pointer select-none disabled:opacity-50 group flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-wider bg-emerald-50 text-[#22C55E] px-1.5 py-0.5 rounded uppercase">Citizen</span>
                        <Users className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#22C55E]" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-slate-900 leading-tight">Sudhir Kuchara</span>
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">Report, upvote, earn XP streaks & badges.</span>
                      </div>
                    </button>

                    {/* Simulator Moderator */}
                    <button
                      disabled={loggingIn !== null}
                      onClick={() => handleSimulatedLogin(UserRole.MODERATOR, { 
                        name: "Sarah Finch", 
                        email: "sarah.finch@greenwood.gov",
                        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                      })}
                      className="border border-slate-200 rounded-lg p-3 text-left hover:border-blue-500/60 hover:bg-slate-50/50 transition cursor-pointer select-none disabled:opacity-50 group flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">Moderator</span>
                        <Shield className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-slate-900 leading-tight">Sarah Finch</span>
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">Audit reports, mark duplicates or flag spam.</span>
                      </div>
                    </button>

                    {/* Simulator Authority */}
                    <button
                      disabled={loggingIn !== null}
                      onClick={() => handleSimulatedLogin(UserRole.AUTHORITY, { 
                        name: "Inspector David", 
                        email: "david.works@greenwood.gov",
                        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                      })}
                      className="border border-slate-200 rounded-lg p-3 text-left hover:border-amber-500/60 hover:bg-slate-50/50 transition cursor-pointer select-none disabled:opacity-50 group flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-wider bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase">Agency Lead</span>
                        <Building className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-slate-900 leading-tight">Inspector David</span>
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">Dispatch crews, state actions, update official resolution logs.</span>
                      </div>
                    </button>

                    {/* Simulator Admin */}
                    <button
                      disabled={loggingIn !== null}
                      onClick={() => handleSimulatedLogin(UserRole.ADMIN, { 
                        name: "Director Peterson", 
                        email: "peterson.admin_center@greenwood.gov",
                        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"
                      })}
                      className="border border-slate-200 rounded-lg p-3 text-left hover:border-slate-800/80 hover:bg-slate-50/50 transition cursor-pointer select-none disabled:opacity-50 group flex flex-col justify-between h-24"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold tracking-wider bg-slate-150 text-slate-800 px-1.5 py-0.5 rounded uppercase">Director Admin</span>
                        <Key className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-800" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-slate-900 leading-tight">Director Peterson</span>
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">Full root database resets, access advanced dashboard analytics.</span>
                      </div>
                    </button>

                  </div>
                </div>

              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[9px] text-slate-400">
                  <Lock className="h-3 w-3" />
                  Protected municipal interface GroundUp v2.4
                </div>
              </div>

            </div>

          </div>
        </main>

        <footer className="bg-white border-t border-slate-100 py-6 px-4 text-center text-[10px] text-slate-400 uppercase tracking-widest select-none">
          © {new Date().getFullYear()} GroundUp Civic Intelligence System • Greenwood Municipality. All Rights Reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Pristine Header matching visual guidelines */}
      <Navbar 
        user={user}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onLogout={handleLogout}
      />

      {/* MINIMALIST SUB-NAVIGATION BAR (STYLISH FLOATING CONTROL RAILS STYLED WITH BLUE & GREEN) */}
      <div className="bg-white border-b border-slate-100 py-3 sticky top-16 z-30 select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
          
          {/* Main Routing Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "feed", label: "Incident Feed", icon: Layout },
              { id: "analytics", label: "Predictive Analytics", icon: BarChart },
              { id: "leaderboard", label: "Leaderboard Standings", icon: Trophy }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "feed") {
                      setShowReportForm(false);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#0B2545] text-white shadow-sm" 
                      : "text-slate-500 hover:text-[#0B2545] hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#22C55E]" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Elegant Role Swapper for Simulation Testing of Autonamous AI logs or Municipality dispatch actions */}
          <div className="flex items-center gap-2 border-l border-slate-100 pl-0 sm:pl-4">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
              <Lock className="h-3 w-3 text-slate-400" />
              Role Mode:
            </span>
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold outline-none cursor-pointer text-[#0B2545] hover:border-[#0B2545] transition-colors"
            >
              <option value={UserRole.CITIZEN}>Citizen</option>
              <option value={UserRole.AUTHORITY}>City Authority</option>
              <option value={UserRole.MODERATOR}>Moderator</option>
              <option value={UserRole.ADMIN}>Administrator</option>
            </select>
          </div>

        </div>
      </div>

      <main className="flex-1">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Live Interactive map / scrolling feed */}
          {activeTab === "feed" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="feed-tab"
            >
              {/* Parallax Hero intro */}
              <Hero 
                stats={stats} 
                onScrollToExplore={handleScrollToExplore} 
                onOpenReportForm={() => {
                  setActiveTab("feed");
                  setShowReportForm(true);
                  setTimeout(() => {
                    handleScrollToExplore();
                  }, 100);
                }}
              />

              <div ref={explorerRef} className="scroll-mt-16 bg-white">
                
                {/* Embedded reporting modal layer */}
                {showReportForm ? (
                  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-white">
                    <IssueReportForm 
                      onSubmitIssue={handleSubmitIssue}
                      onClose={() => setShowReportForm(false)}
                    />
                  </div>
                ) : (
                  <IssueFeed 
                    issues={issues}
                    onSelectIssue={setSelectedIssue}
                    onVote={handleVote}
                    userId={user.id}
                    onOpenReportForm={() => setShowReportForm(true)}
                  />
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 2: Dynamic Analytics Dashboard charts */}
          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="analytics-tab"
            >
              <AnalyticsDashboard stats={stats} />
            </motion.div>
          )}

          {/* TAB 3: Gamified Stands and Badges */}
          {activeTab === "leaderboard" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="leaderboard-tab"
            >
              <Leaderboard currentUser={user} />
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Case Dossier detailed popup modal */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailsModal 
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            userId={user.id}
            userRole={user.role}
            onVote={handleVote}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </AnimatePresence>

      {/* Humble, Professional Flat Footer */}
      <footer className="border-t border-slate-100 bg-[#FAFCFF] py-8 select-none">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:px-6 lg:px-8 text-left">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} GroundUp Civic Intelligence System • Greenwood Municipality. All Rights Reserved.
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Privileges Active: {user.role}</span>
            <span>•</span>
            <span>Sudhir Kuchara ({user.email})</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
