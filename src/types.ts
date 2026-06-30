export interface SubTask {
  id: string;
  title: string;
  duration: number; // in minutes
  difficulty: "Low" | "Medium" | "High";
  importance: "Low" | "Medium" | "High";
  category: string;
  motivationQuote: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string or Date string
  importance: "Critical" | "High" | "Medium" | "Low";
  difficulty: "Low" | "Medium" | "High";
  completed: boolean;
  estimatedTotalMinutes?: number;
  subtasks: SubTask[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // HH:MM (e.g. "14:00")
  endTime: string; // HH:MM (e.g. "15:00")
  type: "meeting" | "personal" | "lecture";
}

export interface ScheduledBlock {
  id: string;
  title: string;
  startTime: string; // "10:00 AM" or similar
  endTime: string;
  duration: number;
  type: "task" | "event" | "buffer" | "break";
  reasoning?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  streak: number;
  goal: string;
}

export interface RescuePlan {
  rescueTitle: string;
  urgencyFactor: string;
  strategySummary: string;
  suggestedDeletions: string[];
  emergencyTimeline: {
    timeSlot: string;
    taskTitle: string;
    actionFocus: string;
    resetBreaks: string;
  }[];
  motivationalSpeech: string;
}

export interface DailyInsights {
  focusScore: number;
  completedCount: number;
  minutesFocused: number;
  streakBooster: string;
  workingHoursRecommendation: string;
  timeDrainAnalysis: string;
  tomorrowPriorities: string[];
  coachNote: string;
}
