import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  startTime: number;
  endTime?: number;
  duration: number; // in minutes
  completed: boolean;
}

export interface Goal {
  id: string;
  type: 'daily' | 'weekly';
  target: number;
  description: string;
  createdAt: number;
}

export interface ProductivityStats {
  totalTasksCompleted: number;
  totalPomodoroSessions: number;
  totalFocusTime: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  weeklyStats: Record<string, number>; // week key -> completed tasks
  dailyStats: Record<string, number>; // date key -> completed tasks
}

interface ProductivityState {
  stats: ProductivityStats;
  goals: Goal[];
  pomodoroSessions: PomodoroSession[];
  currentPomodoro?: PomodoroSession;
  
  // Timer state
  timeLeft: number;
  isBreak: boolean;
  sessionCount: number;
  timerInterval?: number;
  
  // Pomodoro actions
  startPomodoro: (taskId?: string, duration?: number) => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  completePomodoro: () => void;
  cancelPomodoro: () => void;
  
  // Timer actions
  updateTimer: () => void;
  setTimerInterval: (interval: number) => void;
  clearTimerInterval: () => void;
  
  // Stats actions
  trackTaskCompletion: () => void;
  updateStreak: () => void;
  
  // Goals actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  removeGoal: (id: string) => void;
  
  // Helper functions
  getTodayProgress: () => number;
  getWeekProgress: () => number;
  getCurrentStreak: () => number;
  formatTime: (milliseconds: number) => string;
  getProgress: () => number;
}

const getDateKey = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

const getWeekKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
  return `${year}-W${week}`;
};

export const useProductivity = create<ProductivityState>()(
  persist(
    (set, get) => ({
      stats: {
        totalTasksCompleted: 0,
        totalPomodoroSessions: 0,
        totalFocusTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyStats: {},
        dailyStats: {},
      },
      goals: [
        {
          id: 'daily-tasks',
          type: 'daily',
          target: 5,
          description: 'Complete 5 tasks today',
          createdAt: Date.now(),
        },
        {
          id: 'weekly-focus',
          type: 'weekly', 
          target: 300,
          description: 'Focus for 5 hours this week',
          createdAt: Date.now(),
        },
      ],
      pomodoroSessions: [],
      
      // Timer state
      timeLeft: 0,
      isBreak: false,
      sessionCount: 0,
      timerInterval: undefined,
      
      startPomodoro: (taskId, duration = 25) => {
        const { clearTimerInterval } = get();
        clearTimerInterval(); // Clear any existing timer
        
        const session: PomodoroSession = {
          id: `pomodoro-${Date.now()}`,
          taskId,
          startTime: Date.now(),
          duration,
          completed: false,
        };
        
        set({ 
          currentPomodoro: session,
          timeLeft: duration * 60 * 1000, // Convert to milliseconds
        });
        
        // Start the timer
        const interval = setInterval(() => {
          get().updateTimer();
        }, 1000) as unknown as number;
        
        get().setTimerInterval(interval);
        
        // Immediately call updateTimer to set initial progress
        get().updateTimer();
      },
      
      pausePomodoro: () => {
        const { currentPomodoro, clearTimerInterval } = get();
        if (currentPomodoro && !currentPomodoro.endTime) {
          clearTimerInterval(); // Stop the timer
          set({
            currentPomodoro: {
              ...currentPomodoro,
              endTime: Date.now(),
            }
          });
        }
      },
      
      resumePomodoro: () => {
        const { currentPomodoro } = get();
        if (currentPomodoro && currentPomodoro.endTime) {
          const pausedDuration = Date.now() - currentPomodoro.endTime;
          set({
            currentPomodoro: {
              ...currentPomodoro,
              startTime: currentPomodoro.startTime + pausedDuration,
              endTime: undefined,
            }
          });
          
          // Restart the timer
          const interval = setInterval(() => {
            get().updateTimer();
          }, 1000) as unknown as number;
          
          get().setTimerInterval(interval);
        }
      },
      
      completePomodoro: () => {
        const { currentPomodoro, stats, pomodoroSessions, clearTimerInterval } = get();
        if (currentPomodoro) {
          clearTimerInterval();
          
          const completedSession = {
            ...currentPomodoro,
            endTime: Date.now(),
            completed: true,
          };
          
          set({
            currentPomodoro: undefined,
            timeLeft: 0,
            pomodoroSessions: [...pomodoroSessions, completedSession],
            stats: {
              ...stats,
              totalPomodoroSessions: stats.totalPomodoroSessions + 1,
              totalFocusTime: stats.totalFocusTime + currentPomodoro.duration,
            }
          });
        }
      },
      
      cancelPomodoro: () => {
        const { clearTimerInterval } = get();
        clearTimerInterval();
        set({ 
          currentPomodoro: undefined,
          timeLeft: 0,
          isBreak: false,
        });
      },
      
      trackTaskCompletion: () => {
        const { stats } = get();
        const today = getDateKey();
        const week = getWeekKey();
        
        set({
          stats: {
            ...stats,
            totalTasksCompleted: stats.totalTasksCompleted + 1,
            dailyStats: {
              ...stats.dailyStats,
              [today]: (stats.dailyStats[today] || 0) + 1,
            },
            weeklyStats: {
              ...stats.weeklyStats,
              [week]: (stats.weeklyStats[week] || 0) + 1,
            },
          }
        });
        
        get().updateStreak();
      },
      
      updateStreak: () => {
        const { stats } = get();
        const today = getDateKey();
        const yesterday = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
        
        const todayTasks = stats.dailyStats[today] || 0;
        const yesterdayTasks = stats.dailyStats[yesterday] || 0;
        
        let newStreak = stats.currentStreak;
        
        if (todayTasks > 0) {
          if (stats.lastCompletedDate === yesterday || !stats.lastCompletedDate) {
            newStreak = stats.currentStreak + 1;
          } else if (stats.lastCompletedDate !== today) {
            newStreak = 1;
          }
        }
        
        set({
          stats: {
            ...stats,
            currentStreak: newStreak,
            longestStreak: Math.max(stats.longestStreak, newStreak),
            lastCompletedDate: todayTasks > 0 ? today : stats.lastCompletedDate,
          }
        });
      },
      
      addGoal: (goal) => {
        const { goals } = get();
        const newGoal: Goal = {
          ...goal,
          id: `goal-${Date.now()}`,
          createdAt: Date.now(),
        };
        
        set({ goals: [...goals, newGoal] });
      },
      
      removeGoal: (id) => {
        const { goals } = get();
        set({ goals: goals.filter(g => g.id !== id) });
      },
      
      getTodayProgress: () => {
        const { stats } = get();
        const today = getDateKey();
        return stats.dailyStats[today] || 0;
      },
      
      getWeekProgress: () => {
        const { stats } = get();
        const week = getWeekKey();
        return stats.weeklyStats[week] || 0;
      },
      
      getCurrentStreak: () => {
        const { stats } = get();
        return stats.currentStreak;
      },
      
      // Timer methods
      updateTimer: () => {
        const { currentPomodoro, isBreak, sessionCount } = get();
        if (!currentPomodoro) {
          set({ timeLeft: 0 });
          return;
        }

        // Don't update timer if paused
        if (currentPomodoro.endTime && !currentPomodoro.completed) {
          return;
        }

        const now = Date.now();
        const elapsed = now - currentPomodoro.startTime;
        const totalDuration = currentPomodoro.duration * 60 * 1000; // convert to milliseconds
        const remaining = Math.max(0, totalDuration - elapsed);
        
        set({ timeLeft: remaining });
        
        // Auto-complete when time runs out
        if (remaining === 0) {
          get().completePomodoro();
          set({ sessionCount: sessionCount + 1 });
          
          // Start break automatically
          if (!isBreak) {
            set({ isBreak: true });
            const breakDuration = sessionCount > 0 && (sessionCount + 1) % 4 === 0 ? 15 : 5; // Long break every 4 sessions
            get().startPomodoro(undefined, breakDuration);
          } else {
            set({ isBreak: false });
          }
        }
      },
      
      setTimerInterval: (interval: number) => {
        set({ timerInterval: interval });
      },
      
      clearTimerInterval: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
          set({ timerInterval: undefined });
        }
      },
      
      formatTime: (milliseconds: number) => {
        const minutes = Math.floor(milliseconds / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      },
      
      getProgress: () => {
        const { currentPomodoro, timeLeft } = get();
        if (!currentPomodoro || currentPomodoro.duration === 0) return 0;
        const totalDuration = currentPomodoro.duration * 60 * 1000;
        const progress = Math.max(0, Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100));
        return progress;
      },
    }),
    {
      name: 'productivity-storage',
    }
  )
);
