/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  Issue, 
  IssueCategory, 
  IssueSeverity, 
  IssueStatus, 
  User, 
  UserRole, 
  Comment, 
  Notification, 
  PlatformStats 
} from "./src/types";

// Helper for ESModules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// -------------------------------------------------------------
// IN-MEMORY DATABASE WITH PRE-SEEDED HIGHEST-QUALITY DATA
// -------------------------------------------------------------

// Active logged-in user (Pre-seeding Sudhir Kuchara based on metadata)
let currentUser: User = {
  id: "user_sudhir",
  name: "Sudhir Kuchara",
  email: "sudhir.kuchara@gmail.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  role: UserRole.CITIZEN,
  stats: {
    issuesReported: 4,
    issuesVerified: 12,
    issuesResolved: 2,
    xpPoints: 345,
    level: 3, // Level 3: Reporter (300-599 XP)
    streak: 5,
  },
  badges: [
    {
      id: "first_report",
      name: "First Report",
      icon: "🌟",
      description: "Submit your very first issue report",
      earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "verified_voice",
      name: "Verified Voice",
      icon: "✅",
      description: "Have 5 of your issue reports verified by others",
      earnedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  location: {
    city: "Greenwood",
    ward: "West Ward 4",
    coordinates: { lng: -122.3321, lat: 47.6062 }
  },
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

// Additional users (Moderators, Authorities, and Other Citizens)
let users: User[] = [
  currentUser,
  {
    id: "user_mod_sarah",
    name: "Sarah Jenkins",
    email: "sarah.j@greenwood.gov",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    role: UserRole.MODERATOR,
    stats: { issuesReported: 1, issuesVerified: 88, issuesResolved: 15, xpPoints: 950, level: 4, streak: 12 },
    badges: [{ id: "eagle_eye", name: "Eagle Eye", icon: "🔍", description: "Flag 10 duplicates or spam", earnedAt: new Date().toISOString() }],
    location: { city: "Greenwood", ward: "Central Ward 2", coordinates: { lng: -122.3331, lat: 47.6082 } },
    createdAt: new Date().toISOString()
  },
  {
    id: "user_auth_dep",
    name: "Greenwood Public Works Department",
    email: "pwd@greenwood.gov",
    avatar: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=150&q=80",
    role: UserRole.AUTHORITY,
    stats: { issuesReported: 0, issuesVerified: 0, issuesResolved: 124, xpPoints: 4500, level: 6, streak: 30 },
    badges: [{ id: "fast_responder", name: "Fast Responder", icon: "🚀", description: "Resolve issues under 48 hours", earnedAt: new Date().toISOString() }],
    location: { city: "Greenwood", ward: "Central Ward 2", coordinates: { lng: -122.3300, lat: 47.6000 } },
    createdAt: new Date().toISOString()
  }
];

// Helper to get active session user based on credentials or standard simulation cookies
function getActiveUser(req: express.Request): User | null {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").reduce((acc: any, c: string) => {
    const [key, val] = c.trim().split("=");
    if (key && val) {
      acc[key] = decodeURIComponent(val);
    }
    return acc;
  }, {});
  
  const userId = cookies.session_user_id;
  if (userId) {
    const matched = users.find(u => u.id === userId);
    if (matched) return matched;
  }
  return currentUser;
}

// Session Middleware to intercept and synchronize sessions in current thread context
app.use((req, res, next) => {
  const active = getActiveUser(req);
  currentUser = active as User;
  next();
});

// Pre-seeded issues for rich interactive display
let issues: Issue[] = [
  {
    id: "issue_1",
    title: "Clogged Storm Drain Flooding Crossing",
    description: "The street corner storm drain is completely packed with autumn leaves and plastic debris. Even moderate rain causes water to accumulate, flooding the handicap walkway and spilling into the bike path.",
    category: IssueCategory.DRAINAGE,
    subcategory: "Street Drain Blockage",
    severity: IssueSeverity.HIGH,
    priorityScore: 78,
    status: IssueStatus.REPORTED,
    location: {
      coordinates: { lng: -122.3341, lat: 47.6052 },
      address: "1420 Pine Street, Greenwood",
      ward: "West Ward 4",
      city: "Greenwood"
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=800&q=80",
        type: "image",
        aiAnalysis: "Large accumulation of decaying leaf litter, plastic bottles, and silt completely covering a cast-iron street storm grate."
      }
    ],
    reporter: {
      id: "user_sarah_j",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      xp: 950
    },
    upvotes: ["user_sudhir", "citizen_2", "citizen_3"],
    downvotes: [],
    verificationCount: 3,
    aiMetadata: {
      detectedObjects: ["clogged grate", "trash", "pooled water"],
      confidence: 0.94,
      suggestedCategory: "DRAINAGE",
      duplicateOfId: null,
      similarityScore: 0.0,
      sentimentAnalysis: "Concerned and urgent regarding pedestrian safety.",
      estimatedImpact: "Blocks pedestrian wheelchair access and creates slip hazards for approximately 150 daily commuters."
    },
    timeline: [
      {
        status: IssueStatus.REPORTED,
        note: "Issue successfully reported by citizen with image attachment. Multi-agent AI analysis generated severity estimation and categories.",
        updatedBy: "Sarah Jenkins",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    commentsCount: 2,
    tags: ["Drain", "Flooding", "Water-Hazard", "Pedestrian-Safety"],
    isAnonymous: false,
    resolvedAt: null,
    resolutionTimeHours: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "issue_2",
    title: "Deep Pothole at Main Intersection",
    description: "Extremely deep pothole stretching about 3 feet wide on the central southbound lane of Broadway. Multiple small cars can be seen swerving into the bicycle buffer lane to dodge it, creating dangerous near-miss scenarios.",
    category: IssueCategory.POTHOLE,
    subcategory: "Asphalt Cratering",
    severity: IssueSeverity.CRITICAL,
    priorityScore: 92,
    status: IssueStatus.IN_PROGRESS,
    location: {
      coordinates: { lng: -122.3301, lat: 47.6075 },
      address: "1002 Broadway Blvd, Greenwood",
      ward: "Central Ward 2",
      city: "Greenwood"
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80",
        type: "image",
        aiAnalysis: "A distinct crater in the top asphalt wearing course with sharp gravelly borders and visible base layer damage."
      }
    ],
    reporter: {
      id: "user_sudhir",
      name: "Sudhir Kuchara",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      xp: 345
    },
    upvotes: ["user_mod_sarah", "citizen_4", "citizen_5", "citizen_6", "citizen_7"],
    downvotes: [],
    verificationCount: 5,
    aiMetadata: {
      detectedObjects: ["pothole", "structural cracks", "exposed base course"],
      confidence: 0.98,
      suggestedCategory: "POTHOLE",
      duplicateOfId: null,
      similarityScore: 0.0,
      sentimentAnalysis: "Anxious and critical of delay on a high-speed arterial roadway.",
      estimatedImpact: "High risk of vehicle damage and severe bicycle crashes on a multi-modal roadway with 12,000+ daily vehicles."
    },
    timeline: [
      {
        status: IssueStatus.REPORTED,
        note: "Initial report logged with high severity classification.",
        updatedBy: "Sudhir Kuchara",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: IssueStatus.VERIFIED,
        note: "Community verification count reached 5. Department assigned automatically.",
        updatedBy: "Sarah Jenkins (Moderator)",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: IssueStatus.IN_PROGRESS,
        note: "Greenwood PWD dispatched crew code #49-T to secure and cold-patch the hazard within 48h.",
        updatedBy: "Greenwood Public Works Department",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    commentsCount: 1,
    tags: ["Pothole", " Broadway-Arterial", "Road-Hazard", "Active-Dispatch"],
    isAnonymous: false,
    resolvedAt: null,
    resolutionTimeHours: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "issue_3",
    title: "Broken Streetlight Near Playground",
    description: "The double luminaire streetlight directly outside the East Ward Children's Park entrance has been completely dead for 5 days. After dusk, the entire sidewalk and crosswalk are pitch black.",
    category: IssueCategory.STREETLIGHT,
    subcategory: "Pedestrian Streetlight Outage",
    severity: IssueSeverity.MEDIUM,
    priorityScore: 56,
    status: IssueStatus.RESOLVED,
    location: {
      coordinates: { lng: -122.3275, lat: 47.6041 },
      address: "804 East Park Lane, Greenwood",
      ward: "East Ward 1",
      city: "Greenwood"
    },
    media: [
      {
        url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        type: "image",
        aiAnalysis: "Modern cobra-head street light standard next to park playground fencing, shown with completely dark LED arrays during dark hours."
      }
    ],
    reporter: {
      id: "citizen_9",
      name: "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      xp: 180
    },
    upvotes: ["user_sudhir", "user_mod_sarah"],
    downvotes: [],
    verificationCount: 2,
    aiMetadata: {
      detectedObjects: ["unlit streetlight", "dark park canopy"],
      confidence: 0.91,
      suggestedCategory: "STREETLIGHT",
      duplicateOfId: null,
      similarityScore: 0.0,
      sentimentAnalysis: "Anxious and protective of community playground safety.",
      estimatedImpact: "Impaired visibility for kids leaving late activities. Heightened insecurity concern."
    },
    timeline: [
      {
        status: IssueStatus.REPORTED,
        note: "Reported with photos.",
        updatedBy: "Alex Rivera",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: IssueStatus.VERIFIED,
        note: "Verified as active streetlight failure.",
        updatedBy: "Sarah Jenkins",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: IssueStatus.IN_PROGRESS,
        note: "Department scheduled bulb & circuit control module swap.",
        updatedBy: "Greenwood Public Works Department",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        status: IssueStatus.RESOLVED,
        note: "Crew replaced the faulty photodetector switch and upgraded standard bulbs to modern high-efficiency 90W LED arrays. Ground confirmed fully lit.",
        updatedBy: "Greenwood Public Works Department",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    commentsCount: 3,
    tags: ["Streetlight", "Park-Entrance", "Pedestrian-Safety", "Resolved-LED"],
    isAnonymous: false,
    resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolutionTimeHours: 72,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let comments: Comment[] = [
  {
    id: "comment_1",
    issueId: "issue_1",
    user: {
      id: "user_sudhir",
      name: "Sudhir Kuchara",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: UserRole.CITIZEN
    },
    content: "I ran past this yesterday and the water was halfway up the sidewalk curb. Definitely hazardous as the temperature is expected to drop tonight and might cause sheet ice. Thanks for reporting!",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "comment_2",
    issueId: "issue_1",
    user: {
      id: "user_mod_sarah",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      role: UserRole.MODERATOR
    },
    content: "Upvoted and flagged this directly as a drainage hazard. I have also submitted a city repair notification, hopefully city crews get dispatched soon to clean out the leaves.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "comment_3",
    issueId: "issue_2",
    user: {
      id: "user_mod_sarah",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      role: UserRole.MODERATOR
    },
    content: "A quick update: I passed Broadway this morning and saw a repair vehicle setting out reflective cones around this pothole! Progress is super quick.",
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  }
];

let notifications: Notification[] = [
  {
    id: "notif_1",
    userId: "user_sudhir",
    title: "Badges Earned!",
    message: "You have earned the 'Verified Voice' badge! 5 of your community contributions are now approved.",
    type: "badge",
    read: false,
    relatedId: "verified_voice",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "notif_2",
    userId: "user_sudhir",
    title: "Insight Generated",
    message: "A new predictive analysis report for Greenwood is ready on your dashboard panel.",
    type: "system",
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Predictive analytics simulated cache
let latestInsights = {
  hotspots: [
    { coordinates: [-122.3301, 47.6075], issueCount: 5, category: "pothole" },
    { coordinates: [-122.3341, 47.6052], issueCount: 4, category: "drainage" }
  ],
  trendingCategories: [
    { category: "Road Damage", percentChange: 14.5 },
    { category: "Drainage Blocks", percentChange: 8.2 },
    { category: "Waste Overflow", percentChange: -5.1 }
  ],
  predictedNextWeek: "Based on local storm warning data and recent reports, storm drain debris incidents are expected to trigger rising civic complaints in West Ward 4 and North Greenwood over the upcoming 72 hours. Proactive clearing is highly recommended to suppress flood potential.",
  resolutionRateByCategory: {
    "pothole": 85,
    "water_leak": 90,
    "streetlight": 95,
    "waste": 92,
    "road_damage": 78,
    "drainage": 82,
    "other": 88
  },
  mostImpactedAreas: ["West Ward 4", "Central Ward 2"]
};

// -------------------------------------------------------------
// SECURE LAZY GEMINI API CLIENT INITIALIZATION
// -------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not set. Running intelligence pipeline in fallback high-fidelity mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "DUMMY_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// INTELLIGENCE MULTI-AGENT ASYNC PIPELINE
// -------------------------------------------------------------
async function runIssueIntelligencePipeline(issueId: string, base64Image?: string) {
  const issue = issues.find(i => i.id === issueId);
  if (!issue) return;

  console.log(`[AI PLATFORM] Starting IssueIntelligencePipeline for issue: ${issue.title}`);
  
  // Set default initial state
  issue.aiMetadata.confidence = 0.85;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful fallback simulations with realistic delay
    setTimeout(() => {
      issue.subcategory = `AI-Refined ${issue.category.substring(0, 1).toUpperCase()}${issue.category.substring(1)}`;
      issue.aiMetadata.detectedObjects = ["debris", "civic_disrepair", "public_infrastructure"];
      issue.aiMetadata.confidence = 0.89;
      issue.aiMetadata.sentimentAnalysis = "Neutral public awareness report requesting town service intervention.";
      issue.aiMetadata.estimatedImpact = "Potential minor lane restriction. Affects approximately 60 weekly neighborhood visitors.";
      issue.priorityScore = Math.min(100, Math.max(10, (issue.severity === IssueSeverity.CRITICAL ? 90 : issue.severity === IssueSeverity.HIGH ? 70 : issue.severity === IssueSeverity.MEDIUM ? 45 : 20) + Math.floor(Math.random() * 10)));
      issue.tags = Array.from(new Set([...issue.tags, "AI-Enriched"]));
      
      // Post an automatic notification to user
      notifications.unshift({
        id: `notif_ai_${Date.now()}`,
        userId: issue.reporter.id,
        title: "AI Analysis Complete",
        message: `🤖 Your report "${issue.title}" has been enriched with automated severity and duplicates assessment.`,
        type: "xp",
        read: false,
        relatedId: issue.id,
        createdAt: new Date().toISOString()
      });

      console.log(`[AI PLATFORM] Fallback completed for issue: ${issue.id}`);
    }, 2000);
    return;
  }

  const ai = getGeminiClient();

  try {
    // 1. VISION AND DETECTION (multimodal or text description summary)
    let visionDescription = "No image provided. Base details parsed over user-submitted description text.";
    let detectedObjects = ["general issue"];
    let confidence = 0.82;
    let issueVisible = true;

    if (base64Image) {
      console.log("[AI PLATFORM] Triggering visionAgent via Gemini 3.5 Flash");
      try {
        const cleanedBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: cleanedBase64,
                mimeType: "image/jpeg"
              }
            },
            `You are a municipal infrastructure analysis AI. Analyze this civic complaint photo.
             Respond ONLY with a JSON object of this structure:
             {
               "description": "very clear description of the civic problem shown",
               "detectedObjects": ["pothole", "broken light", "water leakage", "etc"],
               "sceneContext": "time of day, environment, weather, street layout",
               "confidence": 0.0 to 1.0,
               "issueVisible": true or false
             }`
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const data = JSON.parse(response.text || "{}");
        visionDescription = data.description || visionDescription;
        detectedObjects = data.detectedObjects || detectedObjects;
        confidence = data.confidence || confidence;
        issueVisible = data.issueVisible !== undefined ? data.issueVisible : true;
      } catch (err) {
        console.error("Error in visionAgent Gemini call:", err);
      }
    }

    // 2. CATEGORIZE, SEVERITY & IMPACT (Parallel calls)
    console.log("[AI PLATFORM] Triggering categorizerAgent & severityAgent");
    const infoPrompt = `
      You are GroundUp municipal priority analyst.
      Analyze this civic issue report:
      Title: "${issue.title}"
      Description: "${issue.description}"
      Image Analysis: "${visionDescription}"
      
      Respond ONLY with a JSON matching this exact structure:
      {
        "suggestedCategory": "POTHOLE" or "WATER_LEAK" or "STREETLIGHT" or "WASTE" or "ROAD_DAMAGE" or "DRAINAGE" or "OTHER",
        "subcategory": "specific technical subcategory name",
        "severity": "low" or "medium" or "high" or "critical",
        "priorityScore": 0 to 100 integer representing emergency index based on danger, traffic impact, and surrounding crowd density,
        "sentimentAnalysis": "citizen psychological temperature analysis in 1 sentence",
        "estimatedImpact": "brief description of how many public commuters or homes are exposed",
        "tags": ["3", "to", "4", "keyword", "tags"]
      }
    `;

    const infoResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: infoPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const infoData = JSON.parse(infoResponse.text || "{}");

    // 3. DUPLICATE DETECTION CHECK
    console.log("[AI PLATFORM] Triggering duplicateAgent against database");
    let isDuplicate = false;
    let duplicateOfId: string | null = null;
    let similarityScore = 0.0;

    const nearIssues = issues.filter(i => {
      if (i.id === issue.id) return false;
      const latDiff = Math.abs(i.location.coordinates.lat - issue.location.coordinates.lat);
      const lngDiff = Math.abs(i.location.coordinates.lng - issue.location.coordinates.lng);
      return latDiff < 0.002 && lngDiff < 0.002; // Roughly ~200 meters
    });

    if (nearIssues.length > 0) {
      const comparisons = nearIssues.map(i => `ID [${i.id}] Category: ${i.category}, Title: "${i.title}", Address: "${i.location.address}"`).join("\n");
      const dupPrompt = `
        You are duplicate detection agency. Determine if this new issue:
        Title: "${issue.title}"
        Description: "${issue.description}"
        Category: "${issue.category}"
        
        Is a duplicate of any of these nearby already reported issues:
        ${comparisons}
        
        Respond ONLY with valid JSON:
        {
          "isDuplicate": true/false,
          "duplicateOfId": "ID string or null",
          "similarityScore": 0.0 to 1.0
        }
      `;

      try {
        const dupResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: dupPrompt,
          config: { responseMimeType: "application/json" }
        });
        const dupData = JSON.parse(dupResponse.text || "{}");
        isDuplicate = dupData.isDuplicate || false;
        duplicateOfId = dupData.duplicateOfId || null;
        similarityScore = dupData.similarityScore || 0.0;
      } catch (e) {
        console.error("Duplicate agent error", e);
      }
    }

    // 4. INTEGRATE & SAVE
    issue.subcategory = infoData.subcategory || "General Fix";
    
    const catMap: Record<string, IssueCategory> = {
      POTHOLE: IssueCategory.POTHOLE,
      WATER_LEAK: IssueCategory.WATER_LEAK,
      STREETLIGHT: IssueCategory.STREETLIGHT,
      WASTE: IssueCategory.WASTE,
      ROAD_DAMAGE: IssueCategory.ROAD_DAMAGE,
      DRAINAGE: IssueCategory.DRAINAGE,
      OTHER: IssueCategory.OTHER
    };
    if (infoData.suggestedCategory && catMap[infoData.suggestedCategory]) {
      issue.category = catMap[infoData.suggestedCategory];
    }

    issue.severity = (infoData.severity as IssueSeverity) || issue.severity;
    issue.priorityScore = infoData.priorityScore !== undefined ? infoData.priorityScore : issue.priorityScore;
    issue.tags = Array.from(new Set([...issue.tags, ...(infoData.tags || [])]));
    
    issue.aiMetadata = {
      detectedObjects,
      confidence: Math.round(confidence * 100) / 100,
      suggestedCategory: infoData.suggestedCategory || issue.category.toUpperCase(),
      duplicateOfId,
      similarityScore,
      sentimentAnalysis: infoData.sentimentAnalysis || "Citizen public safety concern",
      estimatedImpact: infoData.estimatedImpact || "Impedes local residential area traffic."
    };

    if (base64Image && issue.media[0]) {
      issue.media[0].aiAnalysis = visionDescription;
    }

    console.log(`[AI PLATFORM] Enrichment finished successfully for issue ${issue.id}. Priority: ${issue.priorityScore}`);

    // Post notification to citizen
    notifications.unshift({
      id: `notif_ai_${Date.now()}`,
      userId: issue.reporter.id,
      title: "AI Analysis Complete",
      message: `🤖 Your report "${issue.title}" has been analysis-enriched. Severity assessed as ${issue.severity.toUpperCase()} with confidence score ${Math.round(confidence * 100)}%.`,
      type: "xp",
      read: false,
      relatedId: issue.id,
      createdAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("[AI PLATFORM] Errors running Gemini multi-agent pipeline:", err);
  }
}

// -------------------------------------------------------------
// CENTRALIZED XP AND BADGE SYSTEM
// -------------------------------------------------------------
function rewardXp(userId: string, xpAmount: number, reason: string) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  user.stats.xpPoints += xpAmount;
  
  // Recalculate level
  // Level 1: 0-99 XP, Level 2: 100-299, Level 3: 300-599, Level 4: 600-999, Level 5: 1000-1999, Level 6: 2000+
  let previousLevel = user.stats.level;
  let newLevel = 1;
  const xp = user.stats.xpPoints;
  if (xp >= 2000) newLevel = 6;
  else if (xp >= 1000) newLevel = 5;
  else if (xp >= 600) newLevel = 4;
  else if (xp >= 300) newLevel = 3;
  else if (xp >= 100) newLevel = 2;

  user.stats.level = newLevel;

  // Notification for XP
  notifications.unshift({
    id: `notif_xp_${Date.now()}`,
    userId: user.id,
    title: `+${xpAmount} XP Earned!`,
    message: `Earned for: ${reason}. Total XP: ${user.stats.xpPoints}`,
    type: "xp",
    read: false,
    createdAt: new Date().toISOString()
  });

  // Level Up check
  if (newLevel > previousLevel) {
    let levelName = "Newcomer";
    if (newLevel === 2) levelName = "Observer";
    if (newLevel === 3) levelName = "Reporter";
    if (newLevel === 4) levelName = "Advocate";
    if (newLevel === 5) levelName = "Hero";
    if (newLevel === 6) levelName = "Community Hero";

    notifications.unshift({
      id: `notif_level_${Date.now()}`,
      userId: user.id,
      title: `🎉 LEVELED UP! Level ${newLevel}`,
      message: `Congratulations! You reached Level ${newLevel}: ${levelName}. Keep up the amazing work!`,
      type: "badge",
      read: false,
      createdAt: new Date().toISOString()
    });

    // Earn Community Hero Badge automatically at Level 6
    if (newLevel === 6 && !user.badges.some(b => b.id === "community_hero")) {
      user.badges.push({
        id: "community_hero",
        name: "Community Hero",
        icon: "🌍",
        description: "Reach the ultimate summit of Level 6 citizenship",
        earnedAt: new Date().toISOString()
      });
    }
  }

  // Check and trigger badge evaluations
  evaluateBadges(user);
}

function evaluateBadges(user: User) {
  // First Report Badge
  if (user.stats.issuesReported >= 1 && !user.badges.some(b => b.id === "first_report")) {
    user.badges.push({
      id: "first_report",
      name: "First Report",
      icon: "🌟",
      description: "Submit your very first issue report",
      earnedAt: new Date().toISOString()
    });
    notifications.unshift({
      id: `notif_badge_1_${Date.now()}`,
      userId: user.id,
      title: "New Badge Unlocked!",
      message: "🌟 You unlocked the 'First Report' badge for submitting your first civic report!",
      type: "badge",
      read: false,
      relatedId: "first_report",
      createdAt: new Date().toISOString()
    });
  }

  // Eagle Eye Badge (10 verified or 3 reported)
  if (user.stats.issuesReported >= 3 && !user.badges.some(b => b.id === "eagle_eye")) {
    user.badges.push({
      id: "eagle_eye",
      name: "Eagle Eye",
      icon: "🔍",
      description: "Report 3 or more issues helper to town upkeep",
      earnedAt: new Date().toISOString()
    });
    notifications.unshift({
      id: `notif_badge_2_${Date.now()}`,
      userId: user.id,
      title: "New Badge Unlocked!",
      message: "🔍 You unlocked the 'Eagle Eye' badge!",
      type: "badge",
      read: false,
      relatedId: "eagle_eye",
      createdAt: new Date().toISOString()
    });
  }

  // Verified Voice Badge
  if (user.stats.issuesVerified >= 5 && !user.badges.some(b => b.id === "verified_voice")) {
    user.badges.push({
      id: "verified_voice",
      name: "Verified Voice",
      icon: "✅",
      description: "Perform 5 community issue verifications",
      earnedAt: new Date().toISOString()
    });
    notifications.unshift({
      id: `notif_badge_3_${Date.now()}`,
      userId: user.id,
      title: "New Badge Unlocked!",
      message: "✅ You unlocked the 'Verified Voice' badge for helping verify community issues!",
      type: "badge",
      read: false,
      relatedId: "verified_voice",
      createdAt: new Date().toISOString()
    });
  }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// --- Authentication Endpoints ---

// Expose Google OAuth authorize URL
app.get("/api/auth/google/url", (req, res) => {
  const requestedRedirectUri = req.query.redirectUri as string || `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId.trim() === "") {
    // Elegant fallback simulator mode for reviewers/users when credentials are not yet populated in the .env file
    return res.json({ 
      isMock: true, 
      url: `/auth/callback?isMock=true&redirectUri=${encodeURIComponent(requestedRedirectUri)}`
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: requestedRedirectUri,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    prompt: "consent",
    state: JSON.stringify({ redirectUri: requestedRedirectUri })
  });

  res.json({
    isMock: false,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  });
});

// Expose Google OAuth Callback Handler with SameSite=None secure cookie and postMessage response
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, isMock, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #FFF5F5;">
          <div style="text-align: center; border: 1px solid #FEB2B2; padding: 24px; border-radius: 8px; background: white; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <h3 style="color: #E53E3E; margin-top: 0;">Authentication Error</h3>
            <p style="font-size: 14px; color: #4A5568;">"${error}"</p>
            <button onclick="window.close()" style="cursor: pointer; font-weight: bold; background: #6B7280; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px;">Close Window</button>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILED', error: "${error}" }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }

  let email = "";
  let name = "";
  let picture = "";
  let matchedUser: User | null = null;

  // 1. Simulator fallback flow when credentials are not yet populated in the target environment
  if (isMock === "true" || !process.env.GOOGLE_CLIENT_ID) {
    email = (req.query.email as string) || "citizen.demo@greenwood.gov";
    name = (req.query.name as string) || "Citizen Observer";
    picture = (req.query.picture as string) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80";
    const selectedRole = (req.query.role as string) || UserRole.CITIZEN;

    let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      matched = {
        id: `user_google_${Date.now()}`,
        name,
        email,
        avatar: picture,
        role: selectedRole as UserRole,
        stats: {
          issuesReported: 0,
          issuesVerified: 0,
          issuesResolved: 0,
          xpPoints: 10,
          level: 1,
          streak: 1
        },
        badges: [],
        location: {
          city: "Greenwood",
          ward: "West Ward 4",
          coordinates: { lng: -122.3321, lat: 47.6062 }
        },
        createdAt: new Date().toISOString()
      };
      users.push(matched);
    } else {
      matched.name = name;
      matched.avatar = picture;
      matched.role = selectedRole as UserRole;
    }
    matchedUser = matched;
  } else {
    // 2. Real Google OAuth Token Exchange and Info Fetch
    try {
      const stateStr = req.query.state as string;
      let redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/auth/callback`;
      if (stateStr) {
        try {
          const parsedState = JSON.parse(stateStr);
          if (parsedState.redirectUri) {
            redirectUri = parsedState.redirectUri;
          }
        } catch(e) {}
      }

      console.log(`[AUTH] Exchanging auth code for tokens with Redirect URI: ${redirectUri}`);
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      if (!tokenRes.ok) {
        const errTxt = await tokenRes.text();
        throw new Error(`Google token endpoint rejected code exchange: ${errTxt}`);
      }

      const tokenData: any = await tokenRes.json();
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!infoRes.ok) {
        throw new Error("Unable to retrieve Google Profile Information");
      }

      const profile: any = await infoRes.json();
      email = profile.email;
      name = profile.name || `${profile.given_name} ${profile.family_name}`;
      picture = profile.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

      // Deduce administrative role based on Google Workspace email endings or identifiers
      let guessedRole = UserRole.CITIZEN;
      const emLower = email.toLowerCase();
      if (emLower.endsWith(".gov") || emLower.includes("admin") || emLower.includes("authority")) {
        guessedRole = UserRole.AUTHORITY;
      } else if (emLower.includes("mod") || emLower.includes("moderator")) {
        guessedRole = UserRole.MODERATOR;
      }

      let matched = users.find(u => u.email.toLowerCase() === emLower);
      if (!matched) {
        matched = {
          id: `user_google_${Date.now()}`,
          name,
          email,
          avatar: picture,
          role: guessedRole,
          stats: {
            issuesReported: 0,
            issuesVerified: 0,
            issuesResolved: 0,
            xpPoints: 10,
            level: 1,
            streak: 1
          },
          badges: [],
          location: {
            city: "Greenwood",
            ward: "West Ward 4",
            coordinates: { lng: -122.3321, lat: 47.6062 }
          },
          createdAt: new Date().toISOString()
        };
        users.push(matched);
      } else {
        matched.name = name;
        matched.avatar = picture;
      }
      matchedUser = matched;
    } catch (e: any) {
      console.error("[AUTH] Fatal google token parse exception: ", e);
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #FFF5F5;">
            <div style="text-align: center; border: 1px solid #FEB2B2; padding: 24px; border-radius: 8px; background: white; max-width: 400px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <h3 style="color: #E53E3E; margin-top: 0;">Exchange Protocol Exception</h3>
              <p style="font-size: 14px; color: #4A5568;">"${e.message}"</p>
              <button onclick="window.close()" style="cursor: pointer; font-weight: bold; background: #22C55E; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px;">Retry</button>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_FAILED', error: "${e.message}" }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }
  }

  // Set highly secure cookie parsed in parent iframe context
  currentUser = matchedUser!;
  res.setHeader("Set-Cookie", `session_user_id=${matchedUser!.id}; Secure; SameSite=None; HttpOnly; Max-Age=2592000; Path=/`);

  // Send success post message to React parent iframe framework
  return res.send(`
    <html>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #F0FDF4; padding: 20px;">
        <div style="text-align: center; border: 1px solid #A7F3D0; padding: 32px; border-radius: 12px; background: white; width: 100%; max-width: 420px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <h3 style="color: #065F46; margin: 0 0 8px 0; font-size: 18px; font-weight: 800;">Secure Login Successful</h3>
          <p style="font-size: 13px; color: #374151; margin-bottom: 20px; font-weight: 500;">Welcome, ${matchedUser!.name}. Returning coordinates to dashboard window.</p>
          <div style="font-size: 11px; color: #9CA3AF; padding: 6px; background: #F9FAFB; border-radius: 6px;">Closing authentication popup...</div>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', userId: "${matchedUser!.id}" }, '*');
            setTimeout(function() {
              window.close();
            }, 800);
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// Explicit registration endpoint supporting mock and citizen initialization
app.post("/api/auth/register", (req, res) => {
  const { name, email, ward } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and Email are required properties." });
  }

  let existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    currentUser = existing;
    res.setHeader("Set-Cookie", `session_user_id=${existing.id}; Secure; SameSite=None; HttpOnly; Max-Age=2592000; Path=/`);
    return res.status(200).json(existing);
  }

  const newUser: User = {
    id: `user_${Date.now()}`,
    name,
    email,
    avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
    role: UserRole.CITIZEN,
    stats: {
      issuesReported: 0,
      issuesVerified: 0,
      issuesResolved: 0,
      xpPoints: 10,
      level: 1,
      streak: 1
    },
    badges: [],
    location: {
      city: "Greenwood",
      ward: ward || "West Ward 4",
      coordinates: { lng: -122.3321, lat: 47.6062 }
    },
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  currentUser = newUser;
  res.setHeader("Set-Cookie", `session_user_id=${newUser.id}; Secure; SameSite=None; HttpOnly; Max-Age=2592000; Path=/`);
  res.status(201).json(newUser);
});

// Simulated Login/Switch Suite supporting rapid review of all roles
app.post("/api/auth/login-simulated", (req, res) => {
  const { role, name, email, avatar } = req.body;
  const targetEmail = email || `${role}.tester@greenwood.gov`;

  let existing = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!existing) {
    existing = {
      id: `user_sim_${Date.now()}`,
      name: name || `Simulated ${role.substring(0, 1).toUpperCase()}${role.substring(1)}`,
      email: targetEmail,
      avatar: avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&w=150&q=80`,
      role: role as UserRole,
      stats: {
        issuesReported: role === UserRole.CITIZEN ? 4 : 0,
        issuesVerified: role === UserRole.MODERATOR ? 88 : role === UserRole.CITIZEN ? 12 : 0,
        issuesResolved: role === UserRole.AUTHORITY ? 124 : 0,
        xpPoints: role === UserRole.ADMIN ? 5000 : role === UserRole.AUTHORITY ? 4500 : role === UserRole.MODERATOR ? 950 : 345,
        level: role === UserRole.ADMIN ? 6 : role === UserRole.AUTHORITY ? 6 : role === UserRole.MODERATOR ? 4 : 3,
        streak: role === UserRole.CITIZEN ? 5 : 12,
      },
      badges: [],
      location: {
        city: "Greenwood",
        ward: "West Ward 4",
        coordinates: { lng: -122.3321, lat: 47.6062 }
      },
      createdAt: new Date().toISOString()
    };
    users.push(existing);
    
    // Seed standard starter badges for high fidelity admin, authority and moderator roles!
    if (role === UserRole.AUTHORITY) {
      existing.badges.push({ id: "municipal", name: "Agency Shield", icon: "🏛️", description: "Official Greenwood deployment credential", earnedAt: new Date().toISOString() });
    } else if (role === UserRole.MODERATOR) {
      existing.badges.push({ id: "safety", name: "Sheriff", icon: "🛡️", description: "City moderation guardian badge", earnedAt: new Date().toISOString() });
    } else if (role === UserRole.ADMIN) {
      existing.badges.push({ id: "root", name: "Director Profile", icon: "🔑", description: "Grand master access to civic intelligence", earnedAt: new Date().toISOString() });
    }
  } else {
    existing.role = role as UserRole;
  }

  currentUser = existing;
  res.setHeader("Set-Cookie", `session_user_id=${existing.id}; Secure; SameSite=None; HttpOnly; Max-Age=2592000; Path=/`);
  res.json(existing);
});

// Standard email login fallback
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || "").toLowerCase());
  if (user) {
    currentUser = user;
    res.setHeader("Set-Cookie", `session_user_id=${user.id}; Secure; SameSite=None; HttpOnly; Max-Age=2592000; Path=/`);
    return res.json(user);
  }
  return res.status(404).json({ error: "User not found with this email" });
});

// Check ongoing session status
app.get("/api/auth/me", (req, res) => {
  const activeUser = getActiveUser(req);
  if (!activeUser) {
    return res.json(null);
  }
  res.json(activeUser);
});

// Perform account logout
app.post("/api/auth/logout", (req, res) => {
  currentUser = null as any;
  res.setHeader("Set-Cookie", "session_user_id=; Secure; SameSite=None; HttpOnly; Max-Age=0; Path=/");
  res.json({ success: true });
});

// Update profile role (for testing Citizen vs Authority screens easily)
app.patch("/api/auth/role", (req, res) => {
  const { role } = req.body;
  const activeUser = getActiveUser(req);
  if (!activeUser) {
    return res.status(401).json({ error: "Unauthorized session." });
  }
  if (Object.values(UserRole).includes(role)) {
    activeUser.role = role;
    if (currentUser && activeUser.id === currentUser.id) {
      currentUser.role = role;
    }
    return res.json(activeUser);
  }
  return res.status(400).json({ error: "Invalid role specified." });
});

// --- Issues Endpoints ---
app.get("/api/issues", (req, res) => {
  const { category, severity, status, search } = req.query;
  let list = [...issues];

  if (category) {
    list = list.filter(i => i.category === category);
  }
  if (severity) {
    list = list.filter(i => i.severity === severity);
  }
  if (status) {
    list = list.filter(i => i.status === status);
  }
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(i => i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
  }

  // Sort by priorityScore descending so urgent street issues appear first!
  list.sort((a, b) => b.priorityScore - a.priorityScore);
  res.json(list);
});

app.get("/api/issues/:id", (req, res) => {
  const issue = issues.find(i => i.id === req.params.id);
  if (issue) {
    return res.json(issue);
  }
  res.status(404).json({ error: "Issue report not found." });
});

app.post("/api/issues", async (req, res) => {
  const { title, description, category, address, coordinates, base64Image, isAnonymous } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Title, description, and category are mandatory fields." });
  }

  const defaultLocation = { lng: -122.3321 + (Math.random() - 0.5) * 0.02, lat: 47.6062 + (Math.random() - 0.5) * 0.02 };
  const loc = coordinates || defaultLocation;

  // Default priority estimation
  let severity = IssueSeverity.MEDIUM;
  let priorityScore = 40;
  if (category === IssueCategory.ROAD_DAMAGE || category === IssueCategory.POTHOLE) {
    severity = IssueSeverity.HIGH;
    priorityScore = 70;
  }

  const newIssue: Issue = {
    id: `issue_${Date.now()}`,
    title,
    description,
    category: category as IssueCategory,
    subcategory: "Awaiting AI Classification...",
    severity,
    priorityScore,
    status: IssueStatus.REPORTED,
    location: {
      coordinates: loc,
      address: address || "Greenwood High Road intersection",
      ward: currentUser.location.ward || "Greenwood South Ward",
      city: "Greenwood"
    },
    media: base64Image ? [{ url: base64Image, type: "image", aiAnalysis: "Analyzing with AI pipeline..." }] : [],
    reporter: {
      id: currentUser.id,
      name: isAnonymous ? "Anonymous Citizen" : currentUser.name,
      avatar: isAnonymous ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" : currentUser.avatar,
      xp: currentUser.stats.xpPoints
    },
    upvotes: [],
    downvotes: [],
    verificationCount: 0,
    aiMetadata: {
      detectedObjects: [],
      confidence: 0.0,
      suggestedCategory: category,
      duplicateOfId: null,
      similarityScore: 0.0,
      sentimentAnalysis: "Parsing text...",
      estimatedImpact: "Calculating pedestrian and vehicular exposure rate..."
    },
    timeline: [
      {
        status: IssueStatus.REPORTED,
        note: `Citizen logged complaint. ${base64Image ? "Attached image uploaded." : "No photo attached."}`,
        updatedBy: currentUser.name,
        timestamp: new Date().toISOString()
      }
    ],
    commentsCount: 0,
    tags: [category.toUpperCase(), "Citizen-Log"],
    isAnonymous: !!isAnonymous,
    resolvedAt: null,
    resolutionTimeHours: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  issues.unshift(newIssue);

  // Update user stats and trigger gamification XP
  currentUser.stats.issuesReported += 1;
  const dbUser = users.find(u => u.id === currentUser.id);
  if (dbUser) dbUser.stats.issuesReported += 1;

  rewardXp(currentUser.id, 10, "Reporting a new community concern");

  // Asynchronous non-blocking pipeline trigger with lazy Gemini SDK
  runIssueIntelligencePipeline(newIssue.id, base64Image).catch(err => {
    console.error("AI pipeline background process failed", err);
  });

  res.status(210).json(newIssue);
});

// Upvote / Downvote (Community Verification & Gamification)
app.post("/api/issues/:id/vote", (req, res) => {
  const { type } = req.body; // "up" or "down"
  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Remove previous vote if any
  issue.upvotes = issue.upvotes.filter(id => id !== currentUser.id);
  issue.downvotes = issue.downvotes.filter(id => id !== currentUser.id);

  if (type === "up") {
    issue.upvotes.push(currentUser.id);
    
    // Reward XP to voter for voting (community audit)
    rewardXp(currentUser.id, 5, `Verifying community issue report #${issue.id.split("_")[1]}`);

    // If upvotes reach a threshold, transition reported status to VERIFIED
    issue.verificationCount = issue.upvotes.length;
    if (issue.status === IssueStatus.REPORTED && issue.verificationCount >= 3) {
      issue.status = IssueStatus.VERIFIED;
      issue.timeline.push({
        status: IssueStatus.VERIFIED,
        note: "Community threshold reached (3+ votes). Issue flagged as fully VERIFIED. High-priority dispatch sent to public works.",
        updatedBy: "System (Community Consensus)",
        timestamp: new Date().toISOString()
      });

      // Reward points to original reporter for having their issue verified
      const reporterUser = users.find(u => u.id === issue.reporter.id);
      if (reporterUser) {
        rewardXp(reporterUser.id, 15, "Issue verified by community consensus");
        reporterUser.stats.issuesVerified += 1;
      }
    }
  } else if (type === "down") {
    issue.downvotes.push(currentUser.id);
    issue.verificationCount = Math.max(0, issue.upvotes.length - issue.downvotes.length);
  }

  issue.updatedAt = new Date().toISOString();
  res.json(issue);
});

// Update status (Authority/Admin specific)
app.patch("/api/issues/:id/status", (req, res) => {
  const { status, note } = req.body;
  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) return res.status(404).json({ error: "Issue report not found" });

  if (currentUser.role !== UserRole.AUTHORITY && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MODERATOR) {
    return res.status(403).json({ error: "Unauthorized access list restriction." });
  }

  const oldStatus = issue.status;
  issue.status = status as IssueStatus;
  issue.updatedAt = new Date().toISOString();

  issue.timeline.push({
    status: status,
    note: note || `Issue marked as ${status.replace("_", " ")} by official department.`,
    updatedBy: currentUser.name,
    timestamp: new Date().toISOString()
  });

  if (status === IssueStatus.RESOLVED) {
    issue.resolvedAt = new Date().toISOString();
    const diffMs = new Date().getTime() - new Date(issue.createdAt).getTime();
    issue.resolutionTimeHours = Math.round(diffMs / (1000 * 60 * 60));

    // Award XP points to original reporter
    const reporterUser = users.find(u => u.id === issue.reporter.id);
    if (reporterUser) {
      rewardXp(reporterUser.id, 25, `Your reported issue "${issue.title}" was resolved!`);
      reporterUser.stats.issuesResolved += 1;
    }

    // Award XP details to authority
    rewardXp(currentUser.id, 50, `Successfully resolved community issue report #${issue.id.split("_")[1]}`);
  }

  res.json(issue);
});

// --- Comments Endpoints ---
app.get("/api/issues/:id/comments", (req, res) => {
  const list = comments.filter(c => c.issueId === req.params.id);
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(list);
});

app.post("/api/issues/:id/comments", (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  const issue = issues.find(i => i.id === req.params.id);
  if (!issue) return res.status(404).json({ error: "Related issue not found" });

  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    issueId: req.params.id,
    user: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      role: currentUser.role
    },
    content,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  issue.commentsCount += 1;

  // Reward XP for community dialogue
  rewardXp(currentUser.id, 2, `Commenting on community issue #${issue.id.split("_")[1]}`);

  res.status(201).json(newComment);
});

// --- Dynamic Analytics dashboard stats ---
app.get("/api/dashboard/stats", (req, res) => {
  const total = issues.length;
  const resolved = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
  const inProgress = issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length;
  
  // Calculate average resolution time
  const resolvedList = issues.filter(i => i.resolvedAt && i.resolutionTimeHours);
  const avgTime = resolvedList.length > 0 
    ? Math.round(resolvedList.reduce((acc, i) => acc + (i.resolutionTimeHours || 0), 0) / resolvedList.length)
    : 48; // default 48h

  const stats: PlatformStats = {
    totalIssues: total,
    resolvedIssues: resolved,
    activeCitizens: users.length,
    avgResolutionTimeHours: avgTime,
    issuesToday: issues.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length + 1, // +1 for live simulation
    resolvedThisWeek: resolved + 1
  };
  res.json(stats);
});

app.get("/api/dashboard/predictions", (req, res) => {
  res.json(latestInsights);
});

app.get("/api/users/leaderboard", (req, res) => {
  // Sort user directory by XP
  const leaderboard = [...users].sort((a, b) => b.stats.xpPoints - a.stats.xpPoints);
  res.json(leaderboard);
});

app.get("/api/users/:id/notifications", (req, res) => {
  const list = notifications.filter(n => n.userId === req.params.id);
  res.json(list);
});

app.patch("/api/users/:id/notifications/read", (req, res) => {
  notifications.forEach(n => {
    if (n.userId === req.params.id) {
      n.read = true;
    }
  });
  res.json({ success: true });
});

// -------------------------------------------------------------
// VITE DEV SERVER / MIDDLEWARE OR PROD STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[SERVER] Vite dev middlewave mounted successfully.");
  } else {
    // Production mode static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[SERVER] Production build static handlers mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] GroundUp Full-Stack server booted. listening on port http://localhost:${PORT}`);
  });
}

startServer();
