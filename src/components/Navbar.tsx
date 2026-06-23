/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Bell, LogOut } from "lucide-react";
import { User, Notification } from "../types";

interface NavbarProps {
  user: User;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onLogout: () => void;
}

export default function Navbar({
  user,
  notifications,
  onMarkNotificationsRead,
  onLogout
}: NavbarProps) {
  const [showNotifOpen, setShowNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "badge": return "🏆";
      case "xp": return "⚡";
      case "comment": return "💬";
      default: return "🔔";
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-baseline font-display text-2xl font-extrabold tracking-tight">
            <span className="text-[#0B2545]">Ground</span>
            <span className="text-[#22C55E]">Up</span>
          </div>
        </div>

        {/* User Info & Actions - STRICTLY Profile Image and Notification Indicator */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown Container */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => {
                setShowNotifOpen(!showNotifOpen);
                if (!showNotifOpen && unreadCount > 0) {
                  onMarkNotificationsRead();
                }
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#22C55E] text-[9px] font-extrabold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Menu Card */}
            {showNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-fadeIn">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Community Alerts</span>
                  <span className="text-[10px] text-[#22C55E] font-bold uppercase tracking-wider">{unreadCount} Unread</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No updates yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`group rounded-lg p-2.5 transition hover:bg-slate-50 text-left ${!n.read ? "bg-emerald-50/20" : ""}`}
                      >
                        <div className="flex gap-2">
                          <span className="text-sm shrink-0">{getNotifIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 hover:text-red-500 hover:border-red-100 hover:bg-red-50/40 transition cursor-pointer select-none"
            title="Log Out of Session"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
            <span className="hidden sm:inline">Log Out</span>
          </button>

          {/* User Rounded Avatar */}
          <div className="flex h-9 w-9 overflow-hidden rounded-full border border-slate-200 shadow-sm">
            <img 
              src={user.avatar} 
              alt={user.name} 
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

        </div>
      </div>
    </header>
  );
}
