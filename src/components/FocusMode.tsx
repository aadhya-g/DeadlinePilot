import React, { useState, useEffect } from "react";
import { SubTask } from "../types";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Volume2, 
  HeartPulse, 
  Award,
  Zap,
  VolumeX,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FocusModeProps {
  taskTitle: string;
  subtask: SubTask;
  onClose: () => void;
  onComplete: () => void;
}

export default function FocusMode({ taskTitle, subtask, onClose, onComplete }: FocusModeProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(subtask.duration * 60);
  const [isActive, setIsActive] = useState(true);
  const [ticks, setTicks] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [adviceMessage, setAdviceMessage] = useState(subtask.motivationQuote || "Breathe in, block out the external noise, and begin.");

  // Physiological reset reminders that rotate as time passes
  const physiologicalBreaks = [
    "Drop your shoulders and unlock your jaw.",
    "Breathe in deeply for 4 seconds, hold, then let go.",
    "Breathe out the tension. Your cognitive focus is peaking.",
    "Excellent pace! Focus on one single sentence at a time.",
    "Take a quick sip of water. Keep the brain hydrated!"
  ];

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
        setTicks(t => t + 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsActive(false);
      // Play a standard success note
      playSuccessBeep();
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  // Periodically rotate advice/physiological reminders
  useEffect(() => {
    if (ticks > 0 && ticks % 45 === 0) {
      const randomAdvice = physiologicalBreaks[Math.floor(Math.random() * physiologicalBreaks.length)];
      setAdviceMessage(randomAdvice);
      playSoftTick();
    }
  }, [ticks]);

  // Audio trigger helpers
  const playSoftTick = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // ignore browser audio blocker
    }
  };

  const playSuccessBeep = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5 note
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // ignore
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = ((subtask.duration * 60 - secondsRemaining) / (subtask.duration * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-50 flex items-center justify-center p-4 text-white overflow-y-auto">
      {/* Background soft glowing accent circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-8 py-6">
        {/* Top Header Panel */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Deep Work In Progress</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="text-slate-400 hover:text-white transition p-1"
              title={audioEnabled ? "Mute audio cues" : "Unmute audio cues"}
            >
              {audioEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Task Title Banner */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Current Goal Block</span>
          <h2 className="text-2xl font-extrabold text-slate-100">{subtask.title}</h2>
          <p className="text-xs text-slate-400">{taskTitle}</p>
        </div>

        {/* Big Circular Ring Countdown */}
        <div className="flex justify-center py-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Outer track */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Inner active ring */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-emerald-500"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progressPercent) / 100}
                strokeLinecap="round"
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>

            <div className="space-y-1">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white block">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {subtask.category} Sprint
              </span>
            </div>
          </div>
        </div>

        {/* Encouraging coach message */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 max-w-md mx-auto">
          <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center justify-center gap-1 mb-2">
            <Sparkles className="h-3 w-3 animate-pulse" /> AI Companion Advice
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            "{adviceMessage}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              setSecondsRemaining(subtask.duration * 60);
              setTicks(0);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition text-slate-300"
            title="Reset Block"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className={`py-3.5 px-8 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl transition transform hover:scale-105 ${
              isActive 
                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isActive ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current" />}
            {isActive ? "Pause Sprint" : "Resume Sprint"}
          </button>

          <button
            onClick={onComplete}
            className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full transition"
            title="Quick Complete Block"
          >
            <Award className="h-5 w-5" />
          </button>
        </div>

        {/* Micro-tips footer */}
        <div className="pt-4 flex justify-center gap-6 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <HeartPulse className="h-3.5 w-3.5 text-rose-500" /> Focus Shield: Activated
          </span>
          <span className="flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-sky-400" /> No notifications
          </span>
        </div>
      </div>
    </div>
  );
}
