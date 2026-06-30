import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialize Gemini client to ensure startup is resilient and handles missing keys gracefully
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using simulated responses.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 1. Task Breakdown Engine
  app.post("/api/gemini/breakdown", async (req, res) => {
    try {
      const { title, description, deadline, importance } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback for mock demo when key is not present
        return res.json(getMockBreakdown(title));
      }

      const ai = getAI();
      const prompt = `Break down this task into smaller actionable subtasks that can be accomplished one at a time.
Task Title: ${title}
Description: ${description || "None provided"}
Deadline: ${deadline || "Not specified"}
Importance: ${importance || "Medium"}

Provide structured subtasks, estimating the time required (in minutes) and task difficulty/category. Keep the durations realistic.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert project manager and cognitive psychologist who splits overwhelming tasks into small, frictionless steps (under 90 mins each) to prevent procrastination.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedTotalMinutes: { type: Type.INTEGER },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Actionable specific step title" },
                    duration: { type: Type.INTEGER, description: "Estimated completion time in minutes" },
                    difficulty: { type: Type.STRING, description: "Friction rating: Low, Medium, High" },
                    importance: { type: Type.STRING, description: "Subtask priority: High, Medium, Low" },
                    category: { type: Type.STRING, description: "e.g. Research, Setup, Deep Work, Review, Admin" },
                    motivationQuote: { type: Type.STRING, description: "Short motivational context-aware booster line to start this exact step" }
                  },
                  required: ["title", "duration", "difficulty", "importance", "category", "motivationQuote"]
                }
              }
            },
            required: ["title", "estimatedTotalMinutes", "subtasks"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error breaking down task:", error);
      res.status(500).json({ error: error.message || "Failed to process task breakdown" });
    }
  });

  // 2. Intelligent Dynamic Scheduler
  app.post("/api/gemini/schedule", async (req, res) => {
    try {
      const { tasks, calendarEvents, userPreferences, currentDateTime } = req.body;
      // tasks: array of subtasks or general tasks that need scheduling
      // calendarEvents: existing events (e.g., "Meeting 2-3 PM")
      // userPreferences: productivity peak hours (e.g., "morning", "night", "afternoon")

      if (!process.env.GEMINI_API_KEY) {
        return res.json(getMockSchedule(tasks, calendarEvents, currentDateTime));
      }

      const ai = getAI();
      const prompt = `You are an expert daily organizer. Create an optimized agenda scheduling the unscheduled tasks into the free slots of the day, respecting existing calendar events.
      
Unscheduled Tasks:
${JSON.stringify(tasks, null, 2)}

Existing Calendar Events (Busy Times):
${JSON.stringify(calendarEvents, null, 2)}

User's Peak Productivity Hours: ${userPreferences?.peakHours || "flexible"}
Current Time: ${currentDateTime || new Date().toISOString()}

Return a precise time-blocked schedule of when the user should execute each task/subtask today. Do not overlap with busy slots. Leave short buffer gaps of 5-10 minutes between blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an intelligent scheduling coordinator. Your job is to pair tasks with the user's focus patterns, block time on their calendar, and find optimal gaps.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              schedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "Reference ID or unique key" },
                    title: { type: Type.STRING },
                    startTime: { type: Type.STRING, description: "ISO string or HH:MM format" },
                    endTime: { type: Type.STRING, description: "ISO string or HH:MM format" },
                    duration: { type: Type.INTEGER, description: "Duration in minutes" },
                    type: { type: Type.STRING, description: "task, event, buffer, or break" },
                    reasoning: { type: Type.STRING, description: "Why scheduled at this time" }
                  },
                  required: ["title", "startTime", "endTime", "duration", "type", "reasoning"]
                }
              },
              schedulingAdvice: { type: Type.STRING, description: "Overall advice for managing today's workload" }
            },
            required: ["schedule", "schedulingAdvice"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error scheduling tasks:", error);
      res.status(500).json({ error: error.message || "Failed to calculate schedule" });
    }
  });

  // 3. Deadline Rescue Mode Advisor
  app.post("/api/gemini/rescue", async (req, res) => {
    try {
      const { tasks, remainingHours, requiredHours, deadlineTitle } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json(getMockRescuePlan(deadlineTitle, remainingHours, requiredHours));
      }

      const ai = getAI();
      const prompt = `EMERGENCY DEADLINE RESCUE S.O.S.
      The user is facing a major crunch!
      Project: "${deadlineTitle}"
      Time remaining until deadline: ${remainingHours} hours.
      Estimated total effort needed: ${requiredHours} hours.
      
      Tasks remaining:
      ${JSON.stringify(tasks, null, 2)}
      
      We need a high-impact, hyper-focused "Rescue Plan". Since time is critical, consolidate research, slash non-essential steps, insert brief 5-min physiological resets (breathing/water), and formulate a tight hour-by-hour visual timeline to cross the finish line.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the ultimate 'Deadline Rescue Coordinator' - high energy, highly encouraging, hyper-practical, helping the user stay calm and execute under extreme time constraints without panicking.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rescueTitle: { type: Type.STRING },
              urgencyFactor: { type: Type.STRING, description: "e.g. Extreme, Severe, Manageable" },
              strategySummary: { type: Type.STRING, description: "The survival plan in 2 sentences" },
              suggestedDeletions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "What tasks to skip or downscope to save time"
              },
              emergencyTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeSlot: { type: Type.STRING, description: "e.g. Hour 1, Hour 2-3, or specific time" },
                    taskTitle: { type: Type.STRING },
                    actionFocus: { type: Type.STRING, description: "Exactly what to do during this sprint" },
                    resetBreaks: { type: Type.STRING, description: "A micro break recommendation" }
                  },
                  required: ["timeSlot", "taskTitle", "actionFocus", "resetBreaks"]
                }
              },
              motivationalSpeech: { type: Type.STRING, description: "A powerful, inspiring coach-like booster quote to light a fire under them" }
            },
            required: ["rescueTitle", "urgencyFactor", "strategySummary", "suggestedDeletions", "emergencyTimeline", "motivationalSpeech"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error creating rescue plan:", error);
      res.status(500).json({ error: error.message || "Failed to construct rescue plan" });
    }
  });

  // 4. Natural Voice Assistant Interpreter
  app.post("/api/gemini/voice", async (req, res) => {
    try {
      const { transcript, currentTasks } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json(getMockVoiceResponse(transcript));
      }

      const ai = getAI();
      const prompt = `The user said to their voice assistant: "${transcript}"
      
Current state of tasks in app:
${JSON.stringify(currentTasks || [], null, 2)}

Interpret the user's intent. They might be trying to:
- Add a new deadline or task (e.g. "I have an interview Friday")
- Update an existing task or schedule
- Ask for motivation or productivity status
- Ask to reschedule things or reschedule their habits

Formulate a response. Return:
1. Spoken feedback: What the AI assistant speaks back (concise, warm, proactive).
2. Actions: Any background tasks, subtasks, practice sessions, or calendar slots that should be automatically created in their dashboard as a result.
3. Preparation guidelines: Interview questions or preparation steps if they mentioned an exam/interview, or habit tips.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the vocal core of DeadlinePilot. You are encouraging, highly action-oriented, and immediately structure plans so the user doesn't have to think.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenFeedback: { type: Type.STRING, description: "Vocal response transcript to be read by TTS" },
              detectedIntent: { type: Type.STRING, description: "e.g. add_task, reschedule, seek_motivation, add_interview" },
              suggestedTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.INTEGER, description: "Estimated minutes" },
                    importance: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["title", "duration", "importance", "category"]
                },
                description: "Tasks to automatically add to their checklist"
              },
              prepGuides: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Preparation steps, tips, or interview practice questions if applicable"
              }
            },
            required: ["spokenFeedback", "detectedIntent", "suggestedTasks", "prepGuides"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in voice assistant endpoint:", error);
      res.status(500).json({ error: error.message || "Failed to process voice intent" });
    }
  });

  // 5. Daily Insights Report
  app.post("/api/gemini/insights", async (req, res) => {
    try {
      const { taskHistory, habitStatus } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json(getMockInsights());
      }

      const ai = getAI();
      const prompt = `Generate a productivity audit report based on today's logged performance:
Task History:
${JSON.stringify(taskHistory || [], null, 2)}

Habit Streaks & Progress:
${JSON.stringify(habitStatus || {}, null, 2)}

Provide a dynamic focus score, analyze time well spent, highlight waste vectors, recommend their optimal focus window, and give actionable advice for tomorrow.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a world-class performance coach. Your insights are objective, empowering, and strictly practical. No generic advice; highlight specific accomplishments or missed patterns.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              focusScore: { type: Type.INTEGER, description: "Overall productivity score from 0-100" },
              completedCount: { type: Type.INTEGER },
              minutesFocused: { type: Type.INTEGER },
              streakBooster: { type: Type.STRING, description: "A sentence highlighting streaks or habits" },
              workingHoursRecommendation: { type: Type.STRING, description: "e.g. 10:00 AM - 1:00 PM is when you crushed tasks" },
              timeDrainAnalysis: { type: Type.STRING, description: "What held them back or caused distraction" },
              tomorrowPriorities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Top 3 priorities recommended for tomorrow morning"
              },
              coachNote: { type: Type.STRING, description: "Personalized word of wisdom from the AI coach" }
            },
            required: ["focusScore", "completedCount", "minutesFocused", "streakBooster", "workingHoursRecommendation", "timeDrainAnalysis", "tomorrowPriorities", "coachNote"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error calculating insights:", error);
      res.status(500).json({ error: error.message || "Failed to fetch productivity insights" });
    }
  });

  // --- Static File Routing & Development Integration ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DeadlinePilot] Server running on http://localhost:${PORT}`);
  });
}

// --- MOCK OUTCOMES (fallback when API Key is missing for robust local developer demo run) ---

function getMockBreakdown(title: string) {
  return {
    title: title,
    estimatedTotalMinutes: 195,
    subtasks: [
      {
        title: "Initial Setup & Research Sandbox",
        duration: 30,
        difficulty: "Low",
        importance: "High",
        category: "Research",
        motivationQuote: "Getting started is 90% of the battle. Let's research simple frameworks and gather templates!"
      },
      {
        title: "Core Core Architecture Blockout",
        duration: 60,
        difficulty: "High",
        importance: "Critical",
        category: "Deep Work",
        motivationQuote: "Put your phone in another room. This is the meat of the project. Focus on the foundational system!"
      },
      {
        title: "Integration & API Polish",
        duration: 45,
        difficulty: "Medium",
        importance: "High",
        category: "Coding",
        motivationQuote: "Almost there. Connect the endpoints together and ensure data binds smoothly."
      },
      {
        title: "Failsafe Testing & Error Handlers",
        duration: 30,
        difficulty: "Low",
        importance: "Medium",
        category: "Review",
        motivationQuote: "Let's iron out the bugs so it runs flawlessly during the presentation."
      },
      {
        title: "Polish Demo Slide Deck",
        duration: 30,
        difficulty: "Low",
        importance: "Medium",
        category: "PPT",
        motivationQuote: "Finish strong! A great project deserves a beautiful demonstration."
      }
    ]
  };
}

function getMockSchedule(tasks: any[], calendarEvents: any[], currentDateTime: string) {
  return {
    schedule: [
      {
        id: "block-1",
        title: tasks[0]?.title || "Research and Outline",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        duration: 60,
        type: "task",
        reasoning: "Placed in your energetic morning slot before other commitments."
      },
      {
        id: "busy-1",
        title: "Calendar Sync: Team Alignment Meeting",
        startTime: "02:00 PM",
        endTime: "03:00 PM",
        duration: 60,
        type: "event",
        reasoning: "Auto-synced calendar event."
      },
      {
        id: "block-2",
        title: tasks[1]?.title || "Deep Implementation Phase",
        startTime: "03:15 PM",
        endTime: "04:45 PM",
        duration: 90,
        type: "task",
        reasoning: "Perfect block right after your sync, with a 15-minute transition gap."
      },
      {
        id: "block-3",
        title: tasks[2]?.title || "Testing and Review",
        startTime: "05:00 PM",
        endTime: "05:45 PM",
        duration: 45,
        type: "task",
        reasoning: "End-of-day review before final wrap-up."
      }
    ],
    schedulingAdvice: "Your day looks highly balanced! You have 3 focused hours slotted around your meeting. We left solid breather gaps so you stay refreshed."
  };
}

function getMockRescuePlan(deadlineTitle: string, remainingHours: number, requiredHours: number) {
  return {
    rescueTitle: `${deadlineTitle} - Survival Blueprint`,
    urgencyFactor: "Severe CRITICAL",
    strategySummary: "Time-box tightly. Cut minor slides, borrow pre-made UI components, and focus 100% on a bulletproof MVP core.",
    suggestedDeletions: [
      "Custom authentication configuration (using local profile instead)",
      "Polishing edge cases (focus purely on primary user journey instead)"
    ],
    emergencyTimeline: [
      {
        timeSlot: "Sprint 1 (60 mins)",
        taskTitle: "Refine Crucial Logic Only",
        actionFocus: "Nail the primary data model and hard-code any static configs to avoid setup drag.",
        resetBreaks: "Drink 2 glasses of water, 10 deep breaths."
      },
      {
        timeSlot: "Sprint 2 (90 mins)",
        taskTitle: "Frontend Integration & Binding",
        actionFocus: "Get the dashboard completely interactive. Use ready-made Tailwind classes directly.",
        resetBreaks: "Stand up and stretch for 5 minutes."
      },
      {
        timeSlot: "Sprint 3 (45 mins)",
        taskTitle: "Testing Demo Scenarios",
        actionFocus: "Rehearse your presentation sequence 3 times. Verify failure states are guided.",
        resetBreaks: "Wash face with cold water."
      }
    ],
    motivationalSpeech: "You've got this. Sprints like this build core developer instincts. Block out all noise, focus on the next 15 minutes, and execute!"
  };
}

function getMockVoiceResponse(transcript: string) {
  const containsInterview = transcript.toLowerCase().includes("interview");
  const containsExam = transcript.toLowerCase().includes("exam") || transcript.toLowerCase().includes("test");

  if (containsInterview) {
    return {
      spokenFeedback: "I've processed your upcoming interview! I am creating a tailored interview preparation blueprint. I added slots for research, mock answering practice, and formulated critical questions.",
      detectedIntent: "add_interview",
      suggestedTasks: [
        { title: "Research Target Company & Job Role", duration: 45, importance: "High", category: "Research" },
        { title: "Review Resume & Match Key Accomplishments", duration: 30, importance: "High", category: "Deep Work" },
        { title: "Practice Star Technique Answering", duration: 60, importance: "High", category: "Deep Work" },
        { title: "Prepare Questions for Interviewer", duration: 20, importance: "Medium", category: "Research" }
      ],
      prepGuides: [
        "What are your greatest technical contributions in recent projects?",
        "Describe a scenario where you solved a major bug under stressful conditions.",
        "How do you handle disagreement with senior developers or managers?",
        "Why do you want to join our organization specifically?"
      ]
    };
  }

  return {
    spokenFeedback: `Understood! I've logged your request: "${transcript}". I am dynamically restructuring your agenda to ensure you make maximum progress with minimal friction. Check your schedule.`,
    detectedIntent: "add_task",
    suggestedTasks: [
      { title: `Action Plan: ${transcript}`, duration: 40, importance: "High", category: "Deep Work" },
      { title: "Review Progress", duration: 15, importance: "Medium", category: "Review" }
    ],
    prepGuides: [
      "Keep sessions under 45 minutes to maximize continuous attention span.",
      "Turn off browser notifications to protect focus flow."
    ]
  };
}

function getMockInsights() {
  return {
    focusScore: 84,
    completedCount: 6,
    minutesFocused: 215,
    streakBooster: "Your streak is currently at 5 days! Keep pushing forward.",
    workingHoursRecommendation: "10:00 AM - 12:30 PM (You completed 4 complex tasks in this golden morning window)",
    timeDrainAnalysis: "Sluggish start between 2:00 PM and 3:30 PM due to overlapping transition blocks.",
    tomorrowPriorities: [
      "Review feedback and build phase updates",
      "Refine dashboard styling and interactive guides",
      "Sync updated metrics to cloud database"
    ],
    coachNote: "Excellent focus today. You successfully completed 84% of your planned blocks. Let's tackle tomorrow's highest friction task first thing when you've got full energy."
  };
}

startServer();
