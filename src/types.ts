/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum IssueCategory {
  POTHOLE = "pothole",
  WATER_LEAK = "water_leak",
  STREETLIGHT = "streetlight",
  WASTE = "waste",
  ROAD_DAMAGE = "road_damage",
  DRAINAGE = "drainage",
  OTHER = "other",
}

export enum IssueSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IssueStatus {
  REPORTED = "reported",
  VERIFIED = "verified",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

export enum UserRole {
  CITIZEN = "citizen",
  MODERATOR = "moderator",
  AUTHORITY = "authority",
  ADMIN = "admin",
}

export interface Coordinates {
  lng: number;
  lat: number;
}

export interface LocationData {
  coordinates: Coordinates;
  address: string;
  ward: string;
  city: string;
}

export interface MediaItem {
  url: string;
  type: "image" | "video";
  aiAnalysis?: string;
}

export interface AIMetadata {
  detectedObjects: string[];
  confidence: number;
  suggestedCategory: string;
  duplicateOfId: string | null;
  similarityScore: number;
  sentimentAnalysis: string;
  estimatedImpact: string;
}

export interface TimelineEvent {
  status: IssueStatus | string;
  note: string;
  updatedBy: string; // User Name
  timestamp: string;
}

export interface Comment {
  id: string;
  issueId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    role: UserRole;
  };
  content: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  subcategory: string;
  severity: IssueSeverity;
  priorityScore: number; // 0 - 100
  status: IssueStatus;
  location: LocationData;
  media: MediaItem[];
  reporter: {
    id: string;
    name: string;
    avatar: string;
    xp: number;
  };
  upvotes: string[]; // User IDs who verified/upvoted
  downvotes: string[]; // User IDs who downvoted
  verificationCount: number;
  aiMetadata: AIMetadata;
  timeline: TimelineEvent[];
  commentsCount: number;
  tags: string[];
  isAnonymous: boolean;
  resolvedAt: string | null;
  resolutionTimeHours: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface UserStats {
  issuesReported: number;
  issuesVerified: number;
  issuesResolved: number;
  xpPoints: number;
  level: number;
  streak: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  stats: UserStats;
  badges: Badge[];
  location: {
    city: string;
    ward: string;
    coordinates: Coordinates;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "badge" | "status" | "comment" | "xp" | "system";
  read: boolean;
  relatedId?: string; // issue id, badge id, etc.
  createdAt: string;
}

export interface PlatformStats {
  totalIssues: number;
  resolvedIssues: number;
  activeCitizens: number;
  avgResolutionTimeHours: number;
  issuesToday: number;
  resolvedThisWeek: number;
}
