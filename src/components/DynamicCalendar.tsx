import React, { useState } from "react";
import { Task, CalendarEvent, ScheduledBlock } from "../types";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  Sliders, 
  Trash2, 
  CalendarDays,
  Zap,
  Coffee,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DynamicCalendarProps {
  tasks: Task[];
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  scheduleBlocks: ScheduledBlock[];
  setScheduleBlocks: React.Dispatch<React.SetStateAction<ScheduledBlock[]>>;
}

export default function DynamicCalendar({ 
  tasks, 
  calendarEvents, 
  setCalendarEvents,
  scheduleBlocks,
  setScheduleBlocks
}: DynamicCalendarProps) {
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventStart, setNewEventStart] = useState("14:00");
  const [newEventEnd, setNewEventEnd] = useState("15:00");
  const [newEventType, setNewEventType] = useState<CalendarEvent["type"]>("meeting");

  const [peakHours, setPeakHours] = useState<string>("morning");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [advice, setAdvice] = useState<string>("Plan your agenda to see context advice!");

  // Handle adding an external meeting to our simulated Google calendar
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: "event_" + Date.now(),
      title: newEventTitle,
      startTime: newEventStart,
      endTime: newEventEnd,
      type: newEventType
    };

    setCalendarEvents(prev => [...prev, newEvent]);
    setNewEventTitle("");
  };

  const handleDeleteEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(ev => ev.id !== id));
  };

  // Triggers Gemini AI Scheduler
  const calculateAISchedule = async () => {
    setLoadingSchedule(true);

    try {
      // Gather incomplete subtasks and parent tasks to schedule
      const incompleteSteps: any[] = [];
      tasks.forEach(task => {
        if (!task.completed) {
          if (task.subtasks.length > 0) {
            task.subtasks.forEach(sub => {
              if (!sub.completed) {
                incompleteSteps.push({
                  id: sub.id,
                  title: `${task.title}: ${sub.title}`,
                  duration: sub.duration,
                  importance: sub.importance,
                  category: sub.category
                });
              }
            });
          } else {
            incompleteSteps.push({
              id: task.id,
              title: task.title,
              duration: task.difficulty === "High" ? 90 : task.difficulty === "Medium" ? 45 : 20,
              importance: task.importance,
              category: "General"
            });
          }
        }
      });

      const response = await fetch("/api/gemini/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: incompleteSteps.slice(0, 5), // take top 5 subtasks so the schedule isn't overwhelmed
          calendarEvents: calendarEvents.map(ev => ({
            title: ev.title,
            startTime: ev.startTime,
            endTime: ev.endTime,
            type: ev.type
          })),
          userPreferences: { peakHours },
          currentDateTime: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("Scheduling API failed");
      const data = await response.json();

      if (data.schedule) {
        setScheduleBlocks(data.schedule);
      }
      if (data.schedulingAdvice) {
        setAdvice(data.schedulingAdvice);
      }

    } catch (err) {
      console.error(err);
      // fallback in case of errors
      setAdvice("Could not dynamically build agenda with server. Attempting a local backup allocation.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Sorted calendar events
  const sortedCalendarEvents = [...calendarEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Calendar Sync & Custom Blocks */}
      <div className="lg:col-span-5 space-y-6">
        {/* Simulated Calendar Sync */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Google & Outlook Calendar</h3>
              <p className="text-xs text-slate-500">Add dynamic busy-slots (classes, meetings, personal syncs)</p>
            </div>
          </div>

          <form onSubmit={handleAddEvent} className="space-y-3.5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Event / Meeting Name</label>
              <input
                type="text"
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                placeholder="e.g. Sync: Team Standup, Gym..."
                className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-300 rounded-lg p-2 outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Start Time</label>
                <input
                  type="time"
                  value={newEventStart}
                  onChange={e => setNewEventStart(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-300 rounded-lg p-2 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">End Time</label>
                <input
                  type="time"
                  value={newEventEnd}
                  onChange={e => setNewEventEnd(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-300 rounded-lg p-2 outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Type</label>
              <select
                value={newEventType}
                onChange={e => setNewEventType(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-200 focus:border-indigo-300 rounded-lg p-2 outline-hidden"
              >
                <option value="meeting">💼 Work Meeting / Sync</option>
                <option value="lecture">🎓 Class / Lecture</option>
                <option value="personal">🏃 Personal / Physical</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg py-2 transition"
            >
              Add Busy Block
            </button>
          </form>

          {/* List of Simulated Calendar Events */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Busy Slots</span>
            {sortedCalendarEvents.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2 text-center">Your calendar is completely open today.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {sortedCalendarEvents.map(ev => (
                  <div key={ev.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-8 rounded-full ${
                        ev.type === "meeting" ? "bg-indigo-500" : ev.type === "lecture" ? "bg-purple-500" : "bg-teal-500"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{ev.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {ev.startTime} - {ev.endTime}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Preferences / Peak Hours */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h4 className="font-semibold text-slate-800 text-sm">Chronobiology Preference</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">Tell Pilot your productivity peak so it schedules complex coding sprints when your brain is strongest.</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "morning", label: "🌅 Morning Sunrise", sub: "8 AM - 12 PM" },
              { id: "afternoon", label: "☀️ Mid-Day Focus", sub: "12 PM - 4 PM" },
              { id: "evening", label: "🌆 Evening Drive", sub: "4 PM - 8 PM" },
              { id: "night", label: "🦉 Night Owl", sub: "8 PM - 12 AM" }
            ].map(pref => (
              <button
                key={pref.id}
                onClick={() => setPeakHours(pref.id)}
                className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                  peakHours === pref.id 
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-50" 
                    : "border-slate-100 hover:border-slate-200 text-slate-600"
                }`}
              >
                <div className="font-semibold">{pref.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{pref.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: AI-GENERATED AGENDA */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs h-full flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-base">DeadlinePilot Smart Schedule</h3>
                <p className="text-xs text-slate-500">AI-generated time allocation avoiding meetings</p>
              </div>
            </div>

            <button
              onClick={calculateAISchedule}
              disabled={loadingSchedule}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 text-xs font-bold rounded-lg py-2 px-3.5 flex items-center gap-1.5 transition shadow-xs self-end"
            >
              <Zap className={`h-3.5 w-3.5 ${loadingSchedule ? "animate-spin" : ""}`} />
              {loadingSchedule ? "Plotting Agenda..." : "Sync & Calculate Schedule"}
            </button>
          </div>

          {/* AI Coach Advice Bubble */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <strong className="font-bold text-slate-700">AI Pilot Coordinator:</strong> {advice}
            </div>
          </div>

          {/* Interactive Timeline */}
          <div className="flex-1 space-y-3">
            {scheduleBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-slate-200 rounded-xl">
                <Calendar className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-xs text-slate-500 font-bold max-w-xs">No schedule simulated yet.</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">Make sure you have added tasks on the left, then click "Sync & Calculate Schedule" above!</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                {scheduleBlocks.map((block, idx) => {
                  const isEvent = block.type === "event";
                  const isBreak = block.type === "break" || block.type === "buffer";

                  return (
                    <div key={block.id || idx} className="relative group">
                      {/* Timeline dot marker */}
                      <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isEvent ? "bg-indigo-500" : isBreak ? "bg-amber-400" : "bg-emerald-500 animate-pulse"
                      }`} />

                      <div className={`rounded-xl border p-3.5 transition shadow-xs hover:shadow-md ${
                        isEvent 
                          ? "bg-slate-50 border-slate-100" 
                          : isBreak 
                            ? "bg-amber-50/20 border-amber-100/40" 
                            : "bg-emerald-50/10 border-emerald-100/50"
                      }`}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isBreak ? (
                                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                              ) : isEvent ? (
                                <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                              ) : (
                                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              <h4 className={`text-xs font-bold ${
                                isEvent ? "text-slate-600" : isBreak ? "text-amber-700" : "text-emerald-800"
                              } truncate`}>
                                {block.title}
                              </h4>
                            </div>

                            {block.reasoning && (
                              <p className="text-[11px] text-slate-500 mt-1 pl-5">
                                {block.reasoning}
                              </p>
                            )}
                          </div>

                          <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                            {block.startTime} - {block.endTime} ({block.duration} min)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
