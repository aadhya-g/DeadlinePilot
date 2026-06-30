import React, { useState } from "react";
import { Task, RescuePlan } from "../types";
import { 
  AlertTriangle, 
  Zap, 
  Flame, 
  ShieldAlert, 
  Scissors, 
  Clock, 
  Activity,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DeadlineRescueProps {
  tasks: Task[];
  rescuePlan: RescuePlan | null;
  setRescuePlan: React.Dispatch<React.SetStateAction<RescuePlan | null>>;
}

export default function DeadlineRescue({ tasks, rescuePlan, setRescuePlan }: DeadlineRescueProps) {
  const [loading, setLoading] = useState(false);
  const [remainingHours, setRemainingHours] = useState(4);
  const [requiredHours, setRequiredHours] = useState(6);
  const [projectName, setProjectName] = useState("AI Hackathon Project");

  // Call the Gemini S.O.S Rescue Plan API
  const calculateRescuePlan = async () => {
    setLoading(false);
    setLoading(true);

    try {
      const activeTasks = tasks.filter(t => !t.completed).map(t => ({
        title: t.title,
        difficulty: t.difficulty,
        subtaskCount: t.subtasks.length
      }));

      const response = await fetch("/api/gemini/rescue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          remainingHours: Number(remainingHours),
          requiredHours: Number(requiredHours),
          deadlineTitle: projectName
        })
      });

      if (!response.ok) throw new Error("Rescue formulation failed");
      const data = await response.json();

      setRescuePlan(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
      {/* Decorative Warning Stripe Header */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-400 to-red-500" />

      {/* Title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl animate-pulse">
          <ShieldAlert className="h-5.5 w-5.5" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-1.5">
            Deadline Rescue Mode <span className="bg-rose-500 text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded-sm">S.O.S</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">When you are mathematically running out of time, Pilot restructures your goal.</p>
        </div>
      </div>

      {/* Input Config Area */}
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Project</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Remaining Hours</label>
          <input
            type="number"
            value={remainingHours}
            onChange={e => setRemainingHours(Number(e.target.value))}
            className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-hidden focus:border-amber-500"
            min={1}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Required Work Hours</label>
          <div className="relative">
            <input
              type="number"
              value={requiredHours}
              onChange={e => setRequiredHours(Number(e.target.value))}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2 text-white outline-hidden focus:border-amber-500"
              min={1}
            />
            <button
              onClick={calculateRescuePlan}
              disabled={loading}
              className="absolute right-1 top-1 bg-amber-600 hover:bg-amber-700 hover:text-white px-3 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 text-white"
            >
              <Zap className="h-3 w-3 fill-current" />
              Rescue
            </button>
          </div>
        </div>
      </div>

      {/* Render rescue response */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center space-y-3"
          >
            <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">Formulating Survival Blueprint...</p>
            <p className="text-[10px] text-slate-500 max-w-sm mx-auto">Decomposing non-essential criteria & creating focused sprints...</p>
          </motion.div>
        ) : rescuePlan ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-black text-rose-500 tracking-wider">Severity Level</span>
                <h4 className="text-base font-extrabold text-rose-400">{rescuePlan.urgencyFactor}</h4>
              </div>
              <p className="text-xs text-slate-300 max-w-md italic">
                "{rescuePlan.strategySummary}"
              </p>
            </div>

            {/* Downscoped Features to Skip */}
            {rescuePlan.suggestedDeletions?.length > 0 && (
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Scissors className="h-3.5 w-3.5" /> Deletions & Compromises (Scope Trimming)
                </span>
                <p className="text-xs text-slate-400">Skip these secondary elements immediately to protect the primary presentation:</p>
                <div className="space-y-1.5 pl-1">
                  {rescuePlan.suggestedDeletions.map((del, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">✕</span>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Hour Sprints */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Emergency Hour-By-Hour Timeline
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rescuePlan.emergencyTimeline?.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold font-mono text-emerald-400 px-1.5 py-0.5 rounded-sm bg-emerald-500/10">
                          {item.timeSlot}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Focus block</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-200">{item.taskTitle}</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {item.actionFocus}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/60 mt-3 pt-2 text-[10px] text-amber-400 flex items-start gap-1">
                      <Activity className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Reset: {item.resetBreaks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Speech */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
              <Flame className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] uppercase font-extrabold text-amber-500 block mb-1">AI Coach Fire booster</span>
                <p className="text-xs text-amber-200/90 leading-relaxed italic font-semibold">
                  "{rescuePlan.motivationalSpeech}"
                </p>
              </div>
            </div>

          </motion.div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
            <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">No active SOS blueprint.</p>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-0.5">Toggle remaining hours above and click "Rescue" if deadlines are getting too narrow.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
