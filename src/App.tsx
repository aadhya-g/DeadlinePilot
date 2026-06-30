import React, { useState, useEffect } from "react";
import { Task, CalendarEvent, ScheduledBlock, Habit, RescuePlan, DailyInsights, SubTask } from "./types";
import SmartPriorityEngine from "./components/SmartPriorityEngine";
import DynamicCalendar from "./components/DynamicCalendar";
import VoiceAssistant from "./components/VoiceAssistant";
import FocusMode from "./components/FocusMode";
import DeadlineRescue from "./components/DeadlineRescue";
import ProductivityInsights from "./components/ProductivityInsights";
import { 
  Zap, 
  Sparkles, 
  Calendar, 
  Mic, 
  Sliders, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  BellRing,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initial Demo Preset Data
const INITIAL_TASKS: Task[] = [
  {
    id: "task_demo_1",
    title: "DeadlinePilot Presentation Pitch",
    description: "Formulate the pitch deck, write clear scenarios, and rehearse the vocal script.",
    deadline: "Tomorrow",
    importance: "Critical",
    difficulty: "High",
    completed: false,
    estimatedTotalMinutes: 120,
    subtasks: [
      {
        id: "sub_demo_1_1",
        title: "Draft 3-Minute Slide Outline",
        duration: 30,
        difficulty: "Low",
        importance: "High",
        category: "Research",
        motivationQuote: "Start with the 'why' - establish why passive reminders are ignored!",
        completed: true
      },
      {
        id: "sub_demo_1_2",
        title: "Record Voice Assistant Demo Scenarios",
        duration: 45,
        difficulty: "High",
        importance: "Critical",
        category: "Deep Work",
        motivationQuote: "This is the highlight. Practice the interaction so it flows cleanly.",
        completed: false
      },
      {
        id: "sub_demo_1_3",
        title: "Polish Frontend Metrics & Spacing",
        duration: 45,
        difficulty: "Medium",
        importance: "High",
        category: "Review",
        motivationQuote: "Make sure colors pop and typography balances perfectly under presentation.",
        completed: false
      }
    ]
  },
  {
    id: "task_demo_2",
    title: "Refactor API Routing Parameters",
    description: "Align endpoint parsing to support custom structured chronobiology blocks.",
    deadline: "In 3 Days",
    importance: "High",
    difficulty: "Medium",
    completed: false,
    subtasks: []
  }
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "event_demo_1",
    title: "Class: Advanced AI Architectures",
    startTime: "09:00",
    endTime: "10:30",
    type: "lecture"
  },
  {
    id: "event_demo_2",
    title: "Team Sync: Venture Evaluation",
    startTime: "14:00",
    endTime: "15:00",
    type: "meeting"
  }
];

const INITIAL_HABITS: Habit[] = [
  { id: "hab_1", name: "Deep Focus Code Block", icon: "Code", completed: false, streak: 5, goal: "Complete 1 focus block" },
  { id: "hab_2", name: "Math/Algorithm Review", icon: "BookOpen", completed: false, streak: 3, goal: "Review 30 mins study" },
  { id: "hab_3", name: "Water Intake Hydration", icon: "Droplet", completed: true, streak: 8, goal: "Drink 3 liters" },
  { id: "hab_4", name: "Physical Stretch & Gym", icon: "Dumbbell", completed: false, streak: 0, goal: "45 min exercise" }
];

export default function App() {
  // Primary States
  const [tasks, setTasks] = useState<Task[]>(() => {
    const local = localStorage.getItem("dp_tasks");
    return local ? JSON.parse(local) : INITIAL_TASKS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const local = localStorage.getItem("dp_events");
    return local ? JSON.parse(local) : INITIAL_EVENTS;
  });

  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduledBlock[]>(() => {
    const local = localStorage.getItem("dp_schedule");
    return local ? JSON.parse(local) : [];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const local = localStorage.getItem("dp_habits");
    return local ? JSON.parse(local) : INITIAL_HABITS;
  });

  const [rescuePlan, setRescuePlan] = useState<RescuePlan | null>(() => {
    const local = localStorage.getItem("dp_rescue");
    return local ? JSON.parse(local) : null;
  });

  const [insights, setInsights] = useState<DailyInsights | null>(() => {
    const local = localStorage.getItem("dp_insights");
    return local ? JSON.parse(local) : null;
  });

  // Focus Session States
  const [focusTaskTitle, setFocusTaskTitle] = useState<string>("");
  const [focusSubtask, setFocusSubtask] = useState<SubTask | null>(null);

  // Stats Counters
  const [completedFocusCount, setCompletedFocusCount] = useState<number>(() => {
    return Number(localStorage.getItem("dp_focus_count") || "2");
  });
  const [focusedMinutesCount, setFocusedMinutesCount] = useState<number>(() => {
    return Number(localStorage.getItem("dp_minutes_count") || "75");
  });

  // UI Tabs State
  const [activeTab, setActiveTab] = useState<"dashboard" | "scheduler" | "speech" | "insights" | "rescue">("dashboard");

  // Save states persistently to LocalStorage
  useEffect(() => {
    localStorage.setItem("dp_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("dp_events", JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem("dp_schedule", JSON.stringify(scheduleBlocks));
  }, [scheduleBlocks]);

  useEffect(() => {
    localStorage.setItem("dp_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("dp_rescue", JSON.stringify(rescuePlan));
  }, [rescuePlan]);

  useEffect(() => {
    localStorage.setItem("dp_insights", JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem("dp_focus_count", completedFocusCount.toString());
  }, [completedFocusCount]);

  useEffect(() => {
    localStorage.setItem("dp_minutes_count", focusedMinutesCount.toString());
  }, [focusedMinutesCount]);

  // Handle beginning an active deep work Pomodoro
  const startFocusSession = (taskTitle: string, sub: SubTask) => {
    setFocusTaskTitle(taskTitle);
    setFocusSubtask(sub);
  };

  // Complete an active deep work pomodoro
  const handleCompleteFocus = () => {
    if (!focusSubtask) return;

    // Increment completed counts
    setCompletedFocusCount(prev => prev + 1);
    setFocusedMinutesCount(prev => prev + focusSubtask.duration);

    // Mark subtask as complete in master state
    setTasks(prev => prev.map(t => {
      if (t.subtasks.some(s => s.id === focusSubtask.id)) {
        const updatedSubtasks = t.subtasks.map(s => 
          s.id === focusSubtask.id ? { ...s, completed: true } : s
        );
        const allCompleted = updatedSubtasks.every(s => s.completed);
        return { ...t, subtasks: updatedSubtasks, completed: allCompleted };
      }
      return t;
    }));

    setFocusSubtask(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm hover:shadow-emerald-200 shadow-emerald-50 hover:scale-105 transition-all">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                DeadlinePilot <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">V2.0 PRO</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">AI Active Productivity Companion</p>
            </div>
          </div>

          {/* Local Statistics Summary Bar */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Daily Streaks</span>
              <span className="text-xs font-extrabold text-amber-600 flex items-center gap-0.5 justify-end">
                🔥 {habits.reduce((acc, curr) => Math.max(acc, curr.streak), 0)} Days
              </span>
            </div>
            <div className="text-right border-l border-slate-100 pl-6">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Sprints Complete</span>
              <span className="text-xs font-extrabold text-slate-800">{completedFocusCount} sessions</span>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-HEADER SUGGESTIONS BAR (Context-Aware Reminders) */}
      <div className="bg-emerald-600 text-white text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-medium">
          <p className="flex items-center gap-1.5">
            <BellRing className="h-4 w-4 animate-bounce" />
            <span><strong>Proactive Context Sync:</strong> "I found 45 free minutes before your next Venture Mentoring sync. Should we start presentation pitch section 2?"</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setActiveTab("scheduler");
                const incomplete = tasks.find(t => !t.completed);
                if (incomplete) {
                  // highlight scheduler
                }
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-[11px] px-2.5 py-0.5 rounded-sm transition"
            >
              Allocate Now
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2 overflow-x-auto whitespace-nowrap">
            {[
              { id: "dashboard", label: "📋 Active Sprints", icon: Sliders },
              { id: "scheduler", label: "🗓️ Scheduler & Sync", icon: Calendar },
              { id: "speech", label: "🎙️ Speech Interpreter", icon: Mic },
              { id: "insights", label: "📊 Efficiency Audit", icon: Sparkles },
              { id: "rescue", label: "⚠️ SOS Rescue Mode", icon: ShieldAlert }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                    isActive
                      ? tab.id === "rescue"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-100"
                        : "bg-emerald-600 text-white shadow-md shadow-emerald-50"
                      : tab.id === "rescue"
                        ? "text-rose-600 hover:bg-rose-50/50"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tasks & AI Breakdown Queue */}
                <div className="lg:col-span-8">
                  <SmartPriorityEngine 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    onStartFocus={startFocusSession} 
                  />
                </div>

                {/* Dashboard Side Widgets */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Explainer / Onboarding widget */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-3">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <HelpCircle className="h-4.5 w-4.5 text-emerald-600" />
                      Hackathon Demo Guide
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      DeadlinePilot helps users finish work. Instead of sending generic notifications:
                    </p>
                    <ul className="space-y-1.5 pl-1">
                      <li className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-emerald-500">1.</span>
                        <span>Click <strong>"Break down with AI"</strong> inside a task to decompose it into digestible steps.</span>
                      </li>
                      <li className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-emerald-500">2.</span>
                        <span>Synchronize with your <strong>Calendar Sync</strong> tab to plan around lectures or meetings automatically.</span>
                      </li>
                      <li className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-emerald-500">3.</span>
                        <span>If you run out of hours, toggle <strong>SOS Rescue Mode</strong> to downscope and outline a survival plan.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Habit checklist snapshot */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Habit Streaks Snapshot</h4>
                    <div className="space-y-2">
                      {habits.slice(0, 3).map(h => (
                        <div key={h.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-semibold">{h.name}</span>
                          <span className="text-amber-600 font-bold">🔥 {h.streak}d</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "scheduler" && (
              <DynamicCalendar 
                tasks={tasks}
                calendarEvents={calendarEvents}
                setCalendarEvents={setCalendarEvents}
                scheduleBlocks={scheduleBlocks}
                setScheduleBlocks={setScheduleBlocks}
              />
            )}

            {activeTab === "speech" && (
              <div className="max-w-2xl mx-auto">
                <VoiceAssistant 
                  tasks={tasks}
                  setTasks={setTasks}
                />
              </div>
            )}

            {activeTab === "insights" && (
              <ProductivityInsights 
                habits={habits}
                setHabits={setHabits}
                insights={insights}
                setInsights={setInsights}
                completedFocusCount={completedFocusCount}
                focusedMinutesCount={focusedMinutesCount}
              />
            )}

            {activeTab === "rescue" && (
              <div className="max-w-3xl mx-auto">
                <DeadlineRescue 
                  tasks={tasks}
                  rescuePlan={rescuePlan}
                  setRescuePlan={setRescuePlan}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>DeadlinePilot Companion • Designed with professional cognitive principles to prevent procrastination.</p>
          <p className="mt-1 text-[11px] text-slate-300">All logic computed server-side securely. HMR bypassed cleanly.</p>
        </div>
      </footer>

      {/* ACTIVE FOCUS MODE SPRINT IMMERSIVE OVERLAY */}
      <AnimatePresence>
        {focusSubtask && (
          <FocusMode
            taskTitle={focusTaskTitle}
            subtask={focusSubtask}
            onClose={() => setFocusSubtask(null)}
            onComplete={handleCompleteFocus}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
