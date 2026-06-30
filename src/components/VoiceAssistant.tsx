import React, { useState, useEffect } from "react";
import { Task } from "../types";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CornerDownLeft, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  HelpCircle,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceAssistantProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export default function VoiceAssistant({ tasks, setTasks }: VoiceAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [assistantSpokenText, setAssistantSpokenText] = useState("Hi there! Try saying 'I have a job interview on Friday' or ask me to restructure your day.");
  const [loading, setLoading] = useState(false);
  
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const [prepGuides, setPrepGuides] = useState<string[]>([]);

  // Function to read text aloud via Web Speech Synthesis (resilient to frame sandbox)
  const speakAloud = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any existing spoken words
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a nice natural English voice if possible
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en-"));
    if (optimalVoice) utterance.voice = optimalVoice;
    
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Triggers TTS list load on initial interaction
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleVoiceSubmit = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setInputText("");

    try {
      const response = await fetch("/api/gemini/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: textToSend,
          currentTasks: tasks.map(t => ({ title: t.title, completed: t.completed }))
        })
      });

      if (!response.ok) throw new Error("Voice interpreter failed");
      const data = await response.json();

      setAssistantSpokenText(data.spokenFeedback);
      setSuggestedTasks(data.suggestedTasks || []);
      setPrepGuides(data.prepGuides || []);

      // Speak feedback aloud
      speakAloud(data.spokenFeedback);

    } catch (err) {
      console.error(err);
      setAssistantSpokenText("Sorry, my speech interpreter ran into a connection glitch. Let me try again shortly!");
    } finally {
      setLoading(false);
    }
  };

  // Commits the AI recommended actions/sprints to our actual checklist
  const commitTasksToDashboard = () => {
    if (suggestedTasks.length === 0) return;

    // Create a new master parent task containing recommended subtasks
    const taskTitle = suggestedTasks[0].title.startsWith("Action Plan") 
      ? suggestedTasks[0].title 
      : `Voice Blueprint: Preparations`;

    const newParentTask: Task = {
      id: "voice_task_" + Date.now(),
      title: taskTitle,
      description: "AI-generated practice roadmap from voice command.",
      deadline: "In 3 Days",
      importance: "High",
      difficulty: "High",
      completed: false,
      subtasks: suggestedTasks.map((sub, idx) => ({
        id: `sub_voice_${idx}_${Date.now()}`,
        title: sub.title,
        duration: sub.duration || 30,
        difficulty: "Medium",
        importance: "High",
        category: sub.category || "Deep Work",
        motivationQuote: "This step was crafted from your voice request. Focus completely!",
        completed: false
      }))
    };

    setTasks(prev => [newParentTask, ...prev]);
    setSuggestedTasks([]); // clear after committing
    speakAloud("Action plan integrated! I have structured the checklist on your smart dashboard.");
  };

  // Simulates microphone listening for demonstration safety (highly reliable)
  const simulateMicListening = () => {
    setIsRecording(true);
    setAssistantSpokenText("Listening to your pitch...");
    
    setTimeout(() => {
      setIsRecording(false);
      // Randomly select an interesting vocal phrase
      const presets = [
        "I have a technical coding interview this Friday.",
        "I need a plan to train for the running event.",
        "I have a math exam tomorrow morning and haven't prepared.",
        "Rearrange my schedule to prioritize rest today."
      ];
      const selected = presets[Math.floor(Math.random() * presets.length)];
      setInputText(selected);
      setAssistantSpokenText("Audio processed. Review your speech line and press enter below!");
    }, 2200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">AI Speech Companion</h3>
            <p className="text-xs text-slate-500 font-medium">Talk to Pilot to create automatic prep roadmaps</p>
          </div>
        </div>

        {/* Speak Toggle */}
        <button
          onClick={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
          }}
          className={`p-2 rounded-lg transition-all ${
            voiceEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
          }`}
          title={voiceEnabled ? "Mute Companion" : "Enable Speech Synthesis"}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>

      {/* Voice Simulation Waveform / Status Bubble */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-48 shadow-lg">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600 rounded-full blur-3xl opacity-20" />

        <div className="z-10">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Speaker Transcript Output</span>
          <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
            "{assistantSpokenText}"
          </p>
        </div>

        {/* Waveform graphic */}
        <div className="z-10 flex items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-1.5 flex-1 justify-center">
            {isRecording ? (
              <div className="flex items-end gap-1 h-8">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 28, 8] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity }}
                    className="w-1 bg-purple-400 rounded-full"
                  />
                ))}
              </div>
            ) : loading ? (
              <p className="text-xs text-purple-400 font-semibold animate-pulse flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Pilot is decomposing intent...
              </p>
            ) : (
              <div className="flex items-center gap-0.5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1 h-1.5 bg-slate-700 rounded-full" />
                ))}
              </div>
            )}
          </div>

          {/* Voice Command Button */}
          <button
            onClick={simulateMicListening}
            disabled={isRecording || loading}
            className={`p-3.5 rounded-full shadow-lg transition-all transform hover:scale-105 shrink-0 ${
              isRecording 
                ? "bg-rose-500 animate-pulse text-white ring-8 ring-rose-500/20" 
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Manual text backup */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Or type your command</label>
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleVoiceSubmit(inputText)}
            placeholder="e.g. I have an interview Friday, prepare plan..."
            className="w-full text-sm bg-slate-50 border border-slate-100 focus:border-purple-300 rounded-xl py-3 pl-4 pr-12 outline-hidden"
          />
          <button
            onClick={() => handleVoiceSubmit(inputText)}
            className="absolute right-2 top-2 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Voice Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demo Presets</span>
        <div className="flex flex-wrap gap-2">
          {[
            { text: "I have an interview Friday.", label: "💼 Interview" },
            { text: "I have a difficult exam tomorrow.", label: "🎓 School Exam" },
            { text: "Give me intense motivation!", label: "🔥 Motivation" }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleVoiceSubmit(item.text)}
              className="text-xs bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-100 hover:border-purple-200 py-1.5 px-3 rounded-lg transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Recommendations Commitment Board */}
      <AnimatePresence>
        {(suggestedTasks.length > 0 || prepGuides.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border border-purple-100 bg-purple-50/20 rounded-2xl p-4.5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> AI Recommended Roadmap
              </span>
              <button
                onClick={commitTasksToDashboard}
                className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="h-3 w-3" /> Integrate Roadmap
              </button>
            </div>

            {/* List of recommended subtasks */}
            {suggestedTasks.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-purple-500 font-bold uppercase block">Structured Action Items:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100/50">
                      <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{t.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t.duration} mins • {t.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preparation guide questions */}
            {prepGuides.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-purple-100/40">
                <span className="text-[10px] text-purple-500 font-bold uppercase block flex items-center gap-0.5">
                  <HelpCircle className="h-3 w-3" /> Key Prep Questions to Practice:
                </span>
                <ul className="space-y-1.5">
                  {prepGuides.map((guide, idx) => (
                    <li key={idx} className="text-xs text-slate-600 list-disc list-inside leading-relaxed">
                      {guide}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
