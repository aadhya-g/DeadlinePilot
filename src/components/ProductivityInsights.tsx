import React, { useState } from "react";
import { Habit, DailyInsights } from "../types";
import { 
  Flame, 
  Droplet, 
  BookOpen, 
  Code, 
  Dumbbell, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Skull, 
  Compass,
  CheckCircle,
  Lightbulb,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductivityInsightsProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  insights: DailyInsights | null;
  setInsights: React.Dispatch<React.SetStateAction<DailyInsights | null>>;
  completedFocusCount: number;
  focusedMinutesCount: number;
}

export default function ProductivityInsights({
  habits,
  setHabits,
  insights,
  setInsights,
  completedFocusCount,
  focusedMinutesCount
}: ProductivityInsightsProps) {
  const [loading, setLoading] = useState(false);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const nextCompletedState = !h.completed;
        return {
          ...h,
          completed: nextCompletedState,
          streak: nextCompletedState ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    }));
  };

  // Calls the Gemini Daily insights generator
  const generateDailyAudit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskHistory: {
            completedCount: completedFocusCount,
            minutesFocused: focusedMinutesCount
          },
          habitStatus: habits.map(h => ({ name: h.name, completed: h.completed, streak: h.streak }))
        })
      });

      if (!response.ok) throw new Error("Insights failed");
      const data = await response.json();
      setInsights(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Habit Streak Deck */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Flame className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Habits & Goal Sprints</h3>
                <p className="text-xs text-slate-500">Track and compound daily micro-commitments</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {habits.map(habit => {
              const IconComponent = habit.icon === "BookOpen" 
                ? BookOpen 
                : habit.icon === "Dumbbell" 
                  ? Dumbbell 
                  : habit.icon === "Droplet" 
                    ? Droplet 
                    : Code;

              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    habit.completed 
                      ? "bg-amber-50/20 border-amber-200/50" 
                      : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      habit.completed ? "bg-amber-100 text-amber-600" : "bg-white text-slate-400"
                    }`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{habit.name}</p>
                      <p className="text-[10px] text-slate-400">{habit.goal}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                      <Flame className="h-3 w-3 fill-current" />
                      {habit.streak}d streak
                    </div>
                    {habit.completed ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Local Summary Cards */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <h4 className="font-semibold text-xs text-indigo-300 uppercase tracking-wider">Session Logins Today</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Deep Focus Runs</span>
              <span className="text-2xl font-black font-mono text-emerald-400">{completedFocusCount}</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Minutes Logged</span>
              <span className="text-2xl font-black font-mono text-indigo-300">{focusedMinutesCount} mins</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            "We adjust schedules tomorrow based on any missed goals today. Continuous compound metrics build real momentum."
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: AI PERFORMANCE AUDIT */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs h-full flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">AI Performance Audit</h3>
                  <p className="text-xs text-slate-500">Continuous pattern insights by performance coach</p>
                </div>
              </div>

              <button
                onClick={generateDailyAudit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-xs font-bold rounded-lg py-2 px-3.5 flex items-center gap-1.5 transition shadow-xs self-end"
              >
                <Moon className="h-3.5 w-3.5" />
                {loading ? "Auditing patterns..." : "Generate Evening Audit"}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">Scanning today's focus metrics...</p>
                </div>
              ) : insights ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Gauge Metric Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Score Gauge */}
                    <div className="bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl text-center flex flex-col justify-center items-center">
                      <span className="text-[10px] text-indigo-500 uppercase font-extrabold tracking-wider">Productivity Rate</span>
                      <div className="text-3xl font-black font-mono text-indigo-600 my-1">{insights.focusScore}%</div>
                      <span className="text-[10px] text-slate-400 font-medium">calculated score</span>
                    </div>

                    {/* Best hour */}
                    <div className="bg-emerald-50/20 border border-emerald-100/40 p-4 rounded-xl flex flex-col justify-center">
                      <span className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider flex items-center gap-0.5">
                        <Clock className="h-3.5 w-3.5" /> Golden Window
                      </span>
                      <p className="text-xs font-bold text-slate-700 mt-1">{insights.workingHoursRecommendation}</p>
                    </div>

                    {/* Drain analysis */}
                    <div className="bg-rose-50/20 border border-rose-100/30 p-4 rounded-xl flex flex-col justify-center">
                      <span className="text-[10px] text-rose-500 uppercase font-extrabold tracking-wider flex items-center gap-0.5">
                        <Skull className="h-3.5 w-3.5" /> Drag Vector
                      </span>
                      <p className="text-xs text-slate-600 font-medium mt-1">{insights.timeDrainAnalysis}</p>
                    </div>
                  </div>

                  {/* Coach Note Bubble */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Coach Feedback Note:</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed italic">
                        "{insights.coachNote}"
                      </p>
                    </div>
                  </div>

                  {/* Tomorrow's Action items */}
                  {insights.tomorrowPriorities?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Tomorrow Morning priorities</span>
                      <div className="space-y-1.5">
                        {insights.tomorrowPriorities.map((prior, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span>{prior}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Habit Booster line */}
                  <p className="text-[11px] text-emerald-600 font-semibold text-center flex items-center justify-center gap-1 bg-emerald-50/50 py-1.5 rounded-lg border border-emerald-100/20">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    {insights.streakBooster}
                  </p>

                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <TrendingUp className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Audit report not run yet.</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mt-0.5">Click "Generate Evening Audit" to query Gemini for personalized efficiency diagnostics!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
