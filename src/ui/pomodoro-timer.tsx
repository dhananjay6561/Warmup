import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer, Coffee, Settings, Plus, Minus, Volume2 } from 'lucide-react';
import { useProductivity } from '../store/useProductivity';
import { Button } from './components';
import { cn } from '../lib/utils';

interface PomodoroTimerProps {
  taskId?: string;
  className?: string;
  onTimerComplete?: (type: 'focus' | 'break', duration: number) => void;
}

type TimerType = 'focus' | 'break';
type TimerState = 'idle' | 'running' | 'paused';

interface TimerSession {
  type: TimerType;
  duration: number; // in minutes
  startTime: number;
  pausedTime?: number;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  taskId, 
  className = "",
  onTimerComplete
}) => {
  const { 
    incrementSessionCount,
    sessionCount
  } = useProductivity();

  // Local state for complete timer control
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentSession, setCurrentSession] = useState<TimerSession | null>(null);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customFocusMinutes, setCustomFocusMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [totalTime, setTotalTime] = useState(0); // in seconds
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get display time
  const displayTime = timerState === 'idle' 
    ? formatTime((showCustomTimer ? customFocusMinutes : 25) * 60)
    : formatTime(Math.max(0, timeLeft));

  // Audio notification
  const playNotification = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio notification failed:', error);
    }
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (!currentSession) return;

    playNotification();
    
    if (currentSession.type === 'focus') {
      incrementSessionCount?.();
    }
    
    onTimerComplete?.(currentSession.type, currentSession.duration);
    
    // Auto-transition to break after focus
    const shouldAutoBreak = currentSession.type === 'focus';
    
    setTimerState('idle');
    setCurrentSession(null);
    setTimeLeft(0);
    setTotalTime(0);
    setProgress(0);
    
    if (shouldAutoBreak) {
      setTimeout(() => {
        startBreakSession(customBreakMinutes);
      }, 1000);
    }
  }, [currentSession, playNotification, onTimerComplete, incrementSessionCount, customBreakMinutes]);

  // Timer effect - handles the actual countdown
  useEffect(() => {
    if (timerState === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          
          // Update progress
          const newProgress = totalTime > 0 ? ((totalTime - newTime) / totalTime) * 100 : 0;
          setProgress(newProgress);
          
          // Check for completion
          if (newTime === 0) {
            return 0; // This will trigger the completion effect
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState, totalTime]);

  // Handle timer completion when timeLeft reaches 0
  useEffect(() => {
    if (timerState === 'running' && timeLeft === 0 && totalTime > 0) {
      handleTimerComplete();
    }
  }, [timeLeft, timerState, totalTime, handleTimerComplete]);

  // Input validation helpers
  const validateAndSetFocusMinutes = (value: string) => {
    const num = parseInt(value) || 1;
    setCustomFocusMinutes(Math.max(1, Math.min(180, num)));
  };

  const validateAndSetBreakMinutes = (value: string) => {
    const num = parseInt(value) || 1;
    setCustomBreakMinutes(Math.max(1, Math.min(60, num)));
  };

  // Timer control functions
  const startFocusSession = (minutes: number) => {
    const session: TimerSession = {
      type: 'focus',
      duration: minutes,
      startTime: Date.now()
    };
    const totalSeconds = minutes * 60;
    
    setCurrentSession(session);
    setTimerState('running');
    setTimeLeft(totalSeconds);
    setTotalTime(totalSeconds);
    setProgress(0);
  };

  const startBreakSession = (minutes: number) => {
    const session: TimerSession = {
      type: 'break',
      duration: minutes,
      startTime: Date.now()
    };
    const totalSeconds = minutes * 60;
    
    setCurrentSession(session);
    setTimerState('running');
    setTimeLeft(totalSeconds);
    setTotalTime(totalSeconds);
    setProgress(0);
  };

  const handlePause = () => {
    if (timerState === 'paused') {
      setTimerState('running');
    } else {
      setTimerState('paused');
    }
  };

  const handleStop = () => {
    setTimerState('idle');
    setCurrentSession(null);
    setTimeLeft(0);
    setTotalTime(0);
    setProgress(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Get current colors based on session type
  const getTimerColors = () => {
    if (!currentSession) {
      return {
        primary: '#ef4444', // red
        background: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: 'text-red-500'
      };
    }

    return currentSession.type === 'focus' ? {
      primary: '#ef4444', // red for focus
      background: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-500'
    } : {
      primary: '#eab308', // yellow for break
      background: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-500'
    };
  };

  const colors = getTimerColors();

  return (
    <motion.div 
      className={cn(
        "bg-card/80 backdrop-blur-lg rounded-xl p-4 border border-border/80 shadow-soft",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label="Pomodoro Timer"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {currentSession?.type === 'break' ? (
          <Coffee className={colors.icon} size={20} aria-hidden="true" />
        ) : (
          <Timer className={colors.icon} size={20} aria-hidden="true" />
        )}
        <h3 className="font-semibold text-foreground">
          {currentSession?.type === 'break' ? 'Break Time' : 'Focus Time'}
        </h3>
        {sessionCount > 0 && (
          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
            {sessionCount} completed
          </span>
        )}
        {timerState === 'running' && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-green-500 rounded-full"
            aria-label="Timer active"
          />
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <motion.div
          className="relative w-32 h-32 mx-auto mb-3"
          animate={timerState === 'running' ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Progress Ring */}
          <svg 
            className="w-full h-full transform -rotate-90" 
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted-foreground/20"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={colors.primary}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm transition-all duration-300"
              style={{
                strokeDasharray: `${2 * Math.PI * 45}`,
                strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
              }}
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-2xl font-bold text-foreground tabular-nums"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayTime}
            </span>
          </div>
        </motion.div>

        {/* Status */}
        {timerState !== 'idle' && (
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: timerState === 'running' ? [0.7, 1, 0.7] : 1 }}
            transition={{ duration: 2, repeat: timerState === 'running' ? Infinity : 0 }}
            aria-live="polite"
          >
            {timerState === 'paused' ? 'Paused' : timerState === 'running' ? 'Active' : 'Ready'}
          </motion.p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center mb-4">
        {timerState === 'idle' ? (
          <>
            {showCustomTimer ? (
              <div className="flex gap-2">
                <Button 
                  onClick={() => startFocusSession(customFocusMinutes)}
                  className="gap-2"
                  size="sm"
                  aria-label={`Start ${customFocusMinutes} minute focus session`}
                >
                  <Timer size={16} aria-hidden="true" />
                  Focus ({customFocusMinutes}m)
                </Button>
                <Button 
                  onClick={() => startBreakSession(customBreakMinutes)}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                  aria-label={`Start ${customBreakMinutes} minute break session`}
                >
                  <Coffee size={16} aria-hidden="true" />
                  Break ({customBreakMinutes}m)
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => startFocusSession(25)}
                className="gap-2"
                size="sm"
                aria-label="Start 25 minute focus session"
              >
                <Play size={16} aria-hidden="true" />
                Start Focus
              </Button>
            )}
          </>
        ) : (
          <>
            <Button 
              onClick={handlePause}
              variant="ghost"
              size="sm"
              className="gap-2"
              aria-label={timerState === 'paused' ? 'Resume timer' : 'Pause timer'}
            >
              {timerState === 'paused' ? <Play size={16} /> : <Pause size={16} />}
              {timerState === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={handleStop}
              variant="ghost"
              size="sm"
              className="gap-2 text-danger hover:text-danger"
              aria-label="Stop timer"
            >
              <Square size={16} aria-hidden="true" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Timer Controls - Only show when idle */}
      {timerState === 'idle' && (
        <div className="space-y-4">
          {/* Custom Timer Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowCustomTimer(!showCustomTimer)}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              aria-label={showCustomTimer ? 'Hide custom timer options' : 'Show custom timer options'}
              aria-expanded={showCustomTimer}
            >
              <Settings size={16} aria-hidden="true" />
              {showCustomTimer ? 'Hide' : 'Show'} Custom Timer
            </Button>
          </div>

          {/* Custom Timer Controls */}
          {showCustomTimer && (
            <motion.div 
              className="bg-muted/30 rounded-lg p-4 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Focus Timer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block text-foreground">
                  Focus Duration
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => setCustomFocusMinutes(Math.max(1, customFocusMinutes - 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Decrease focus duration"
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customFocusMinutes}
                      onChange={(e) => validateAndSetFocusMinutes(e.target.value)}
                      className="w-16 text-center bg-background border border-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1"
                      max="180"
                      aria-label="Focus duration in minutes"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <Button
                    onClick={() => setCustomFocusMinutes(Math.min(180, customFocusMinutes + 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Increase focus duration"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Break Timer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block text-foreground">
                  Break Duration
                </label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => setCustomBreakMinutes(Math.max(1, customBreakMinutes - 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Decrease break duration"
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customBreakMinutes}
                      onChange={(e) => validateAndSetBreakMinutes(e.target.value)}
                      className="w-16 text-center bg-background border border-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1"
                      max="60"
                      aria-label="Break duration in minutes"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <Button
                    onClick={() => setCustomBreakMinutes(Math.min(60, customBreakMinutes + 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label="Increase break duration"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preset Timer Cards - Only show when custom timer is hidden */}
          {!showCustomTimer && (
            <div className="space-y-4">
              {/* Focus Timer Cards */}
              <div>
                <h4 className="text-sm font-medium text-center text-foreground mb-3">
                  Focus Sessions
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { minutes: 15, label: "15m", description: "Quick Focus", color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20" },
                    { minutes: 25, label: "25m", description: "Pomodoro", color: "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" },
                    { minutes: 45, label: "45m", description: "Deep Work", color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20" }
                  ].map(({ minutes, label, description, color }) => (
                    <button
                      key={`focus-${minutes}`}
                      onClick={() => startFocusSession(minutes)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          startFocusSession(minutes);
                        }
                      }}
                      className={`${color} border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-primary focus:outline-none`}
                      aria-label={`Start ${minutes} minute ${description.toLowerCase()} session`}
                      tabIndex={0}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Break Timer Cards */}
              <div>
                <h4 className="text-sm font-medium text-center text-foreground mb-3">
                  Break Sessions
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { minutes: 5, label: "5m", description: "Short Break", color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20" },
                    { minutes: 15, label: "15m", description: "Long Break", color: "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20" },
                    { minutes: 30, label: "30m", description: "Meal Break", color: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20" }
                  ].map(({ minutes, label, description, color }) => (
                    <button
                      key={`break-${minutes}`}
                      onClick={() => startBreakSession(minutes)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          startBreakSession(minutes);
                        }
                      }}
                      className={`${color} border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-primary focus:outline-none`}
                      aria-label={`Start ${minutes} minute ${description.toLowerCase()}`}
                      tabIndex={0}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};