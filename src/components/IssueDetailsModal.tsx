/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  MapPin, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle, 
  Zap, 
  Bot, 
  Send, 
  CheckCheck,
  Building,
  User as UserIcon,
  CircleDot,
  Trash2
} from "lucide-react";
import { Issue, Comment, UserRole, IssueStatus, IssueSeverity } from "../types";

interface IssueDetailsModalProps {
  issue: Issue;
  onClose: () => void;
  userId: string;
  userRole: UserRole;
  onVote: (issueId: string, type: "up" | "down") => void;
  onUpdateStatus: (issueId: string, status: IssueStatus, note: string) => Promise<any>;
}

export default function IssueDetailsModal({
  issue,
  onClose,
  userId,
  userRole,
  onVote,
  onUpdateStatus
}: IssueDetailsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Authority actions state
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Resolution validation state
  const [resolutionImg, setResolutionImg] = useState("");
  const [validatingResolution, setValidatingResolution] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const stockProofs: Record<string, { valid: string; invalid: string }> = {
    POTHOLE: {
      valid: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80",
      invalid: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=400&q=80"
    },
    STREETLIGHT: {
      valid: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=400&q=80",
      invalid: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80"
    },
    WASTE: {
      valid: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80",
      invalid: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80"
    },
    OTHER: {
      valid: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80",
      invalid: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"
    }
  };

  const activeCategory = stockProofs[issue.category] ? issue.category : "OTHER";
  const proofs = stockProofs[activeCategory];

  const handleValidateResolution = async () => {
    if (!resolutionImg) return;
    setValidatingResolution(true);
    setValidationResult(null);
    try {
      const res = await fetch(`/api/issues/${issue.id}/validate-resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: resolutionImg,
          note: statusNote
        })
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
        if (data.valid) {
          setStatusNote(`[Gemini verified] ${data.reason}`);
        } else {
          setStatusNote(`[Validation Failed] ${data.reason}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setValidatingResolution(false);
    }
  };

  // Load comments
  useEffect(() => {
    fetchComments();
  }, [issue.id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Error loading comments:", e);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newCommentText })
      });
      if (res.ok) {
        setNewCommentText("");
        fetchComments();
        // Update comments local counter visually
        issue.commentsCount += 1;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApplyStatusChange = async () => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(issue.id, selectedStatus, statusNote);
      setStatusNote("");
      // Refresh current issue parameters visually
      issue.status = selectedStatus;
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusStepStyle = (currentStep: IssueStatus, targetStep: string) => {
    const stepsOrder = [IssueStatus.REPORTED, IssueStatus.VERIFIED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED];
    const currentIndex = stepsOrder.indexOf(currentStep);
    const targetIndex = stepsOrder.indexOf(targetStep as IssueStatus);

    if (currentIndex >= targetIndex) {
      return "bg-[#0B2545] text-white border-[#0B2545]";
    }
    return "bg-white text-slate-300 border-slate-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm select-none">
      
      {/* Modal Card content wrapper */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-4xl rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Sticky Header with Blue/Green Branding theme matching top margin guidelines */}
        <div className="flex items-center justify-between bg-[#0B2545] text-white p-4">
          <div className="flex items-center gap-2">
            <Building className="h-4.5 w-4.5 text-[#22C55E]" />
            <h3 className="text-sm font-bold truncate max-w-lg font-display">INCIDENT #{issue.id.split("_")[1]} - DOSSIER</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 border border-white/20 text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Scroll Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-left">
            
            {/* LEFT PROFILE DRAWER: PHOTOS, MAP COORDS, AI INTELLIGENCE */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Media viewer photo or video if exists */}
              {issue.media.length > 0 ? (
                <div className="rounded-xl border border-slate-250 overflow-hidden relative aspect-video bg-black flex items-center justify-center">
                  {issue.media[0].url.endsWith(".mp4") || issue.media[0].url.includes("mixkit.co") ? (
                    <video src={issue.media[0].url} controls autoPlay muted loop className="h-full w-full" />
                  ) : (
                    <img 
                      src={issue.media[0].url} 
                      alt={issue.title} 
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover" 
                    />
                  )}
                  <div className="absolute top-2 left-2 rounded bg-[#0B2545]/80 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-widest">
                    Media Proof
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 aspect-video flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                  <Bot className="h-8 w-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 mt-2">No photo attached</p>
                  <p className="text-[10px] text-slate-400">Enriched via textual intelligence only</p>
                </div>
              )}

              {/* coordinates specifications panel */}
              <div className="rounded-xl border border-slate-100 bg-[#FAFCFF] p-4 space-y-2">
                <h4 className="text-[10px] font-black text-[#0B2545] uppercase tracking-widest leading-none">Geo Mapping Details</h4>
                <div className="flex items-start gap-1.5 pt-1">
                  <MapPin className="h-4 w-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 leading-tight block">{issue.location.address}</span>
                    <span className="text-[10px] text-slate-450 mt-1 block">
                      Lon: {issue.location.coordinates.lng.toFixed(4)} • Lat: {issue.location.coordinates.lat.toFixed(4)} • {issue.location.ward}
                    </span>
                  </div>
                </div>
              </div>

              {/* MULTI-AGENT GEMINI ANALYTICS SPECIFICATIONS CARD (VIVID WHITE/BLUE INTEGRATION) */}
              <div className="rounded-xl border border-slate-100 bg-[#0B2545] text-white p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#10B981]/15 to-transparent pointer-events-none" />

                <div className="flex items-center gap-2 relative z-10">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[#0B2545]">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#22C55E]">Intelligence Diagnostics</h4>
                    <p className="text-[9px] text-slate-300 leading-none">Generated via Gemini autonomous agency</p>
                  </div>
                </div>

                <div className="space-y-3.5 pt-1 text-xs relative z-10">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Object Detection Metrics:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {issue.aiMetadata.detectedObjects.length === 0 ? (
                        <span className="text-[10px] text-slate-300/60">Running objects inspection...</span>
                      ) : (
                        issue.aiMetadata.detectedObjects.map(obj => (
                          <span key={obj} className="rounded bg-white/10 p-1 px-2 text-[9px] font-bold text-slate-200">
                            {obj.toUpperCase()}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-300 uppercase tracking-widest text-[9px] font-bold block">Assurance Confidence:</span>
                      <span className="font-bold text-white block mt-0.5">{Math.round(issue.aiMetadata.confidence * 100)}% Match</span>
                    </div>
                    <div>
                      <span className="text-slate-300 uppercase tracking-widest text-[9px] font-bold block">Mapped Category:</span>
                      <span className="font-bold text-[#22C55E] block mt-0.5">{issue.aiMetadata.suggestedCategory || issue.category.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Sentiment Feedback Context:</span>
                    <p className="text-slate-200 leading-normal italic mt-1 font-semibold text-[11px]">
                      "{issue.aiMetadata.sentimentAnalysis || "Awaiting emotional sensor telemetry..."}"
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Urgency Impact Assessment:</span>
                    <p className="text-slate-200 leading-normal mt-1 text-[11px]">
                      {issue.aiMetadata.estimatedImpact || "Estimating aggregate traffic & community exposure limits..."}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">Routed Department:</span>
                    <p className="text-[#22C55E] font-bold leading-normal mt-1 text-[11px]">
                      {issue.aiMetadata.assignedDepartment || "Awaiting Dispatch Routing..."}
                    </p>
                  </div>

                  {issue.aiMetadata.duplicateOfId && (
                    <div className="border-t border-white/10 pt-3 bg-red-500/10 -mx-5 px-5 py-2 mt-2">
                      <span className="text-[9px] uppercase font-black tracking-widest text-[#22C55E] block">⚠️ AI DUPLICATE DETECTED</span>
                      <p className="text-slate-200 leading-normal mt-1 text-[10.5px]">
                        Looks very similar to item <span className="font-bold text-[#22C55E]">#{issue.aiMetadata.duplicateOfId.split('_')[1]}</span>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT MAIN SECTION: FULL CASE SPECS, STEPPER TIMELINE & COMMENT DISH */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400">CATEGORY: {issue.category.replace("_", " ").toUpperCase()}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-[#0B2545]/80">REPORTER: {issue.reporter.name}</span>
                </div>
                <h2 className="text-2xl font-black text-[#0B2545] font-display">{issue.title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed pt-1">{issue.description}</p>
              </div>

              {/* TIMELINE PROGRESS FLOW STEPPER */}
              <div className="rounded-xl border border-slate-100 p-5 space-y-4 bg-[#FAFCFF]">
                <h4 className="text-[10px] font-black text-[#0B2545] uppercase tracking-widest leading-none">Resolution Milestones</h4>
                
                <div className="flex justify-between items-center relative pt-2">
                  
                  {/* Connecting background progress line */}
                  <div className="absolute left-4 right-4 top-[18px] h-0.5 bg-slate-200 -z-10" />

                  {[
                    { key: IssueStatus.REPORTED, label: "Filer" },
                    { key: IssueStatus.VERIFIED, label: "Audit" },
                    { key: IssueStatus.IN_PROGRESS, label: "Dispatch" },
                    { key: IssueStatus.RESOLVED, label: "Resolve" }
                  ].map((s) => {
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-1.5 shrink-0 z-10">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[8px] font-bold ${getStatusStepStyle(issue.status, s.key)}`}>
                          {s.key === IssueStatus.RESOLVED && issue.status === IssueStatus.RESOLVED ? "✓" : ""}
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Milestone audit comments log */}
                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  {issue.timeline.map((event, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-[#0B2545] pl-3.5 text-left">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                        <span>{event.status.replace("_", " ")}</span>
                        <span>•</span>
                        <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed mt-0.5 font-semibold text-[11px]">{event.note}</p>
                      <span className="text-[9px] text-[#22C55E] block mt-0.5 font-bold">Logged by: {event.updatedBy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Dialogue Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-[#0B2545] uppercase tracking-widest leading-none">Community Dialogue</h4>
                
                {/* Comments feed list */}
                <div className="max-h-52 overflow-y-auto space-y-3.5 pr-1 text-left scrollbar-thin">
                  {comments.length === 0 ? (
                    <p className="text-xs italic text-slate-400 py-4 text-center">No community dialogues logged. Add your feedback or upvote to secure progress!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-2.5 text-xs">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <img src={c.user.avatar} alt={c.user.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span className="text-slate-800 font-bold block">{c.user.name}</span>
                            <span className="block">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed mt-1 font-semibold text-[11px]">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Submit input box */}
                <form onSubmit={handlePostComment} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Contribute constructive community insight..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#0B2545] bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="rounded-lg bg-[#0B2545] border border-[#0B2545] p-2.5 text-white hover:bg-[#0f345e] shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* PUBLIC WORKS / MODERATION ACTION TOOLKIT (AUTHORITY SPECIFIC DETAILS) */}
              {(userRole === UserRole.AUTHORITY || userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR) && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#0B2545]" />
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2545]">MUNICIPAL DEPT. ACTION PANEL</h4>
                      <p className="text-[10px] text-slate-500 leading-none">Authority privileges active for this session</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-left">
                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold block mb-1.5">Dispatch Target Action</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as IssueStatus)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none cursor-pointer hover:border-[#0B2545]"
                      >
                        <option value={IssueStatus.REPORTED}>Filer (REPORTED)</option>
                        <option value={IssueStatus.VERIFIED}>Audited (VERIFIED)</option>
                        <option value={IssueStatus.IN_PROGRESS}>Crew Assigned (IN_PROGRESS)</option>
                        <option value={IssueStatus.RESOLVED}>Hazard Closed (RESOLVED)</option>
                        <option value={IssueStatus.REJECTED}>Dossier Rejected (REJECTED)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase font-bold block mb-1.5">Official Dispatch Log Note</label>
                      <input
                        type="text"
                        placeholder="Add crew details or completion logs..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0B2545]"
                      />
                    </div>
                  </div>

                  {selectedStatus === IssueStatus.RESOLVED && (
                    <div className="border-t border-slate-200/60 pt-3.5 space-y-3.5 text-left">
                      <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wide block">Upload/Select Resolution Proof Photo</label>
                        <p className="text-[10.5px] text-slate-400">Provide photographic evidence of repairs. Gemini will inspect and validate the completion state immediately.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setResolutionImg(proofs.valid); setValidationResult(null); }}
                          className={`rounded-lg p-2 border bg-white flex flex-col gap-1.5 items-center cursor-pointer relative overflow-hidden transition-all ${
                            resolutionImg === proofs.valid ? "border-[#22C55E] ring-2 ring-[#22C55E]/10" : "border-slate-200"
                          }`}
                        >
                          <img src={proofs.valid} alt="Clean Repair Proof" className="h-20 w-full object-cover rounded" referrerPolicy="no-referrer" />
                          <span className="text-[9.5px] font-bold text-slate-705">Valid Proof (Repaired)</span>
                          {resolutionImg === proofs.valid && <span className="absolute top-1 right-1 bg-[#22C55E] text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setResolutionImg(proofs.invalid); setValidationResult(null); }}
                          className={`rounded-lg p-2 border bg-white flex flex-col gap-1.5 items-center cursor-pointer relative overflow-hidden transition-all ${
                            resolutionImg === proofs.invalid ? "border-amber-400 ring-2 ring-amber-400/10" : "border-slate-200"
                          }`}
                        >
                          <img src={proofs.invalid} alt="Incomplete Repair Proof" className="h-20 w-full object-cover rounded" referrerPolicy="no-referrer" />
                          <span className="text-[9.5px] font-bold text-slate-705">Incomplete Proof</span>
                          {resolutionImg === proofs.invalid && <span className="absolute top-1 right-1 bg-amber-400 text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center">!</span>}
                        </button>
                      </div>

                      {resolutionImg && (
                        <div className="flex justify-start">
                          <button
                            type="button"
                            disabled={validatingResolution}
                            onClick={handleValidateResolution}
                            className="rounded-lg border border-[#22C55E]/20 bg-emerald-50/60 hover:bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-[#22C55E] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Zap className="h-3 w-3" />
                            {validatingResolution ? "Gemini Inspecting..." : "Verify Repair via Gemini"}
                          </button>
                        </div>
                      )}

                      {validationResult && (
                        <div className={`rounded-lg p-3 text-[11px] font-semibold border ${
                          validationResult.valid 
                            ? "bg-emerald-50 border-[#22C55E]/20 text-[#127c36]" 
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold uppercase text-[9.5px] tracking-wider mb-1">
                            <Bot className="h-3.5 w-3.5" />
                            <span>Gemini Inspection {validationResult.valid ? "Approved" : "Failed"}</span>
                          </div>
                          <p>{validationResult.reason}</p>
                          <p className="text-[9.5px] text-slate-500 mt-1.5 italic">"Comparison: {validationResult.comparisonSummary}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={handleApplyStatusChange}
                      className="rounded-lg bg-[#0B2545] px-5 py-2 text-xs font-bold text-white hover:bg-[#0f345e] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {updatingStatus ? "Applying logs..." : "Apply status logs"}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
