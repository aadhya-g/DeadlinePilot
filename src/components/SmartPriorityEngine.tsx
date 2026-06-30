import React, { useState } from "react";
import { Task, SubTask } from "../types";
import { 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertTriangle, 
  Zap, 
  ListTodo, 
  Plus, 
  CheckSquare, 
  Square,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SmartPriorityEngineProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStartFocus: (taskTitle: string, subtask: SubTask) => void;
}

export default function SmartPriorityEngine({ tasks, setTasks, onStartFocus }: SmartPriorityEngineProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDeadline, setNewDeadline] = useState("Tomorrow");
  const [newImportance, setNewImportance] = useState<Task["importance"]>("Medium");
  const [newDifficulty, setNewDifficulty] = useState<Task["difficulty"]>("Medium");
  
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Function to calculate custom AI Priority Score
  const getPriorityScore = (task: Task) => {
    let score = 50; // baseline

    // Importance weighting
    if (task.importance === "Critical") score += 30;
    else if (task.importance === "High") score += 20;
    else if (task.importance === "Medium") score += 10;
    else score += 0;

    // Difficulty weighting (AI prioritizes getting hard things done early or splitting them)
    if (task.difficulty === "High") score += 15;
    else if (task.difficulty === "Medium") score += 5;

    // Deadline urgency
    if (task.deadline === "Today") score += 25;
    else if (task.deadline === "Tomorrow") score += 15;
    else if (task.deadline === "In 3 Days") score += 5;

    return score;
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: "task_" + Date.now(),
      title: newTitle,
      description: newDesc,
      deadline: newDeadline,
      importance: newImportance,
      difficulty: newDifficulty,
      completed: false,
      subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setNewImportance("Medium");
    setNewDifficulty("Medium");
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleTaskCompleted = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const completedState = !t.completed;
        // If completing parent task, also complete all child subtasks
        const updatedSubtasks = t.subtasks.map(sub => ({ ...sub, completed: completedState }));
        return { ...t, completed: completedState, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  const handleToggleSubtaskCompleted = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(sub => 
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        // If all subtasks are completed, mark parent as completed too
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(sub => sub.completed);
        return { ...t, subtasks: updatedSubtasks, completed: allCompleted };
      }
      return t;
    }));
  };

  // AI Breakdown call
  const triggerAIBreakdown = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingTaskId(task.id);
    setExpandedTaskId(task.id);

    try {
      const response = await fetch("/api/gemini/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          importance: task.importance
        })
      });

      if (!response.ok) throw new Error("Breakdown failed");
      const data = await response.json();

      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const apiSubtasks: SubTask[] = data.subtasks.map((sub: any, idx: number) => ({
            id: `sub_${task.id}_${idx}_${Date.now()}`,
            title: sub.title,
            duration: sub.duration,
            difficulty: sub.difficulty as any,
            importance: sub.importance as any,
            category: sub.category,
            motivationQuote: sub.motivationQuote,
            completed: false
          }));

          return {
            ...t,
            estimatedTotalMinutes: data.estimatedTotalMinutes,
            subtasks: apiSubtasks
          };
        }
        return t;
      }));

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Sort tasks by custom smart score (highest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return getPriorityScore(b) - getPriorityScore(a);
  });

  return (
    <div className="space-y-6">
      {/* Task Creation Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Input New Deadline / Task</h3>
            <p className="text-xs text-slate-500">Pilot will analyze the priority and build an execution plan</p>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Task Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Complete AI Assignment, File Taxes..."
                className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:bg-white rounded-lg p-2.5 outline-hidden transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Task Description (Optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief context to help the breakdown..."
                className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-emerald-300 focus:bg-white rounded-lg p-2.5 outline-hidden transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Deadline Urgency</label>
              <select
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-emerald-300 rounded-lg p-2.5 outline-hidden"
              >
                <option value="Today">Today (Critical)</option>
                <option value="Tomorrow">Tomorrow (High)</option>
                <option value="In 3 Days">In 3 Days (Medium)</option>
                <option value="Next Week">Next Week (Low)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Importance Rating</label>
              <select
                value={newImportance}
                onChange={e => setNewImportance(e.target.value as any)}
                className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-emerald-300 rounded-lg p-2.5 outline-hidden"
              >
                <option value="Critical">Critical (S.O.S)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Task Difficulty</label>
              <select
                value={newDifficulty}
                onChange={e => setNewDifficulty(e.target.value as any)}
                className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-emerald-300 rounded-lg p-2.5 outline-hidden"
              >
                <option value="High">High (High Friction)</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low (Simple / Admin)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg py-2.5 px-4 flex items-center justify-center gap-1.5 transition shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Integrate Task into Engine
          </button>
        </form>
      </div>

      {/* Task List / Smart Priority Dashboard */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <h4 className="font-semibold text-sm text-slate-600 uppercase tracking-wider">AI Prioritization Queue</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">Sorted by smart threat level</span>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-12 px-4 text-center">
            <p className="text-sm text-slate-500 font-medium mb-1">No active tasks in your companion.</p>
            <p className="text-xs text-slate-400">Add an assignment or use Voice Assistant to prepare plans!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTasks.map(task => {
              const priorityScore = getPriorityScore(task);
              const isExpanded = expandedTaskId === task.id;
              const hasSubtasks = task.subtasks.length > 0;

              return (
                <div
                  key={task.id}
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className={`bg-white rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                    task.completed 
                      ? "border-slate-100 opacity-65" 
                      : isExpanded 
                        ? "border-emerald-500 ring-2 ring-emerald-50" 
                        : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Task Header */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={(e) => handleToggleTaskCompleted(task.id, e)}
                        className="text-slate-400 hover:text-emerald-600 transition shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-slate-300 hover:border-emerald-500 transition" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`font-semibold text-sm sm:text-base text-slate-800 min-w-0 truncate ${task.completed ? "line-through text-slate-400" : ""}`}>
                            {task.title}
                          </h4>
                          {/* Priority Tag */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            task.importance === "Critical" 
                              ? "bg-rose-50 text-rose-600 border border-rose-100" 
                              : task.importance === "High"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {task.importance}
                          </span>
                          {/* Deadline Tag */}
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-sm">
                            <Clock className="h-3 w-3" />
                            {task.deadline}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 truncate max-w-md">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Smart Score / Action Panel */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Threat Score</span>
                        <span className={`text-base font-extrabold font-mono ${
                          task.completed 
                            ? "text-slate-300"
                            : priorityScore >= 80 
                              ? "text-rose-600" 
                              : priorityScore >= 60 
                                ? "text-amber-500" 
                                : "text-emerald-600"
                        }`}>
                          {priorityScore} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded AI Subtasks & Breakdown Area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-50/50 border-t border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 space-y-4">
                          {/* AI Action Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Micro-Task Architecture</h5>
                              {hasSubtasks ? (
                                <p className="text-xs text-slate-500">
                                  Estimate: <strong className="text-slate-700">{task.estimatedTotalMinutes} mins</strong> distributed across {task.subtasks.length} digestible chunks
                                </p>
                              ) : (
                                <p className="text-xs text-slate-500">No breakdowns created yet. Get Gemini to remove start-up friction!</p>
                              )}
                            </div>

                            <button
                              onClick={(e) => triggerAIBreakdown(task, e)}
                              disabled={loadingTaskId !== null}
                              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg py-1.5 px-3 flex items-center gap-1.5 transition shadow-xs shrink-0"
                            >
                              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                              {loadingTaskId === task.id ? "Analyzing Goal..." : hasSubtasks ? "Re-Plan Breakdown" : "Break down with AI"}
                            </button>
                          </div>

                          {/* Subtask Steps */}
                          {hasSubtasks ? (
                            <div className="space-y-2.5">
                              {task.subtasks.map((sub, index) => (
                                <div
                                  key={sub.id}
                                  className={`bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs transition-all duration-150 ${
                                    sub.completed ? "border-slate-100 opacity-60 bg-slate-50/20" : "hover:border-slate-200"
                                  }`}
                                >
                                  {/* Step Info */}
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubtaskCompleted(task.id, sub.id)}
                                      className="text-slate-400 hover:text-emerald-600 transition shrink-0 mt-0.5"
                                    >
                                      {sub.completed ? (
                                        <CheckSquare className="h-5 w-5 text-emerald-500" />
                                      ) : (
                                        <Square className="h-5 w-5 text-slate-300 hover:text-emerald-500" />
                                      )}
                                    </button>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-extrabold font-mono px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                                          STEP {index + 1}
                                        </span>
                                        <h6 className={`font-semibold text-xs text-slate-800 min-w-0 truncate ${sub.completed ? "line-through text-slate-400" : ""}`}>
                                          {sub.title}
                                        </h6>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" />
                                          {sub.duration} min
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                          sub.difficulty === "High" 
                                            ? "bg-rose-50 text-rose-500" 
                                            : sub.difficulty === "Medium"
                                              ? "bg-amber-50 text-amber-500"
                                              : "bg-emerald-50 text-emerald-500"
                                        }`}>
                                          {sub.difficulty}
                                        </span>
                                      </div>
                                      {sub.motivationQuote && !sub.completed && (
                                        <p className="text-[11px] text-purple-600 font-medium italic mt-1.5 flex items-start gap-1">
                                          <span>💡</span>
                                          <span>"{sub.motivationQuote}"</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Start Sprint Button */}
                                  {!sub.completed && (
                                    <button
                                      onClick={() => onStartFocus(task.title, sub)}
                                      className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-100 hover:border-transparent text-xs font-bold rounded-lg py-1.5 px-3 flex items-center gap-1 transition shrink-0 w-full sm:w-auto justify-center"
                                    >
                                      <Play className="h-3 w-3 fill-current" />
                                      Focus Block
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-slate-100/30 rounded-xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500 font-medium">Click "Break down with AI" to slice this task into high-motivation chunks.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
