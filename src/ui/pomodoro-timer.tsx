import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer, Coffee, Settings, Plus, Minus } from 'lucide-react';
import { useProductivity } from '../store/useProductivity';
import { Button } from './components';
import { cn } from '../lib/utils';

interface PomodoroTimerProps {
  taskId?: string;
  className?: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  taskId, 
  className = "" 
}) => {
  const { 
    currentPomodoro, 
    timeLeft,
    isBreak,
    sessionCount,
    startPomodoro, 
    pausePomodoro, 
    resumePomodoro, 
    completePomodoro, 
    cancelPomodoro,
    formatTime,
    getProgress
  } = useProductivity();

  const [currentProgress, setCurrentProgress] = useState(0);
  const [showCustomTimer, setShowCustomTimer] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState(5);

  // Update progress when timeLeft or currentPomodoro changes
  useEffect(() => {
    const progress = getProgress();
    setCurrentProgress(progress);
  }, [timeLeft, currentPomodoro, getProgress]);

  // Calculate display progress 
  const displayProgress = currentPomodoro ? currentProgress : 0;

  const handleStart = () => {
    if (isBreak) {
      startPomodoro(taskId, showCustomTimer ? customBreakMinutes : 5);
    } else {
      startPomodoro(taskId, showCustomTimer ? customMinutes : 25);
    }
  };

  const handlePause = () => {
    if (currentPomodoro?.endTime) {
      resumePomodoro();
    } else {
      pausePomodoro();
    }
  };

  const isPaused = currentPomodoro?.endTime && !currentPomodoro.completed;

  return (
    <motion.div 
      className={cn(
        "bg-card/80 backdrop-blur-lg rounded-xl p-4 border border-border/80 shadow-soft",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-4">
        {isBreak ? (
          <Coffee className="text-yellow-500" size={20} />
        ) : (
          <Timer className="text-red-500" size={20} />
        )}
        <h3 className="font-semibold text-foreground">
          {isBreak ? 'Break Time' : 'Focus Time'}
        </h3>
        {sessionCount > 0 && (
          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
            {sessionCount} completed
          </span>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-4">
        <motion.div
          className="relative w-32 h-32 mx-auto mb-3"
          animate={{ scale: currentPomodoro ? [1, 1.02, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
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
            {/* Progress Circle - Always visible with red color */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#ef4444"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="drop-shadow-sm"
              style={{
                strokeDasharray: `${2 * Math.PI * 45}`,
                strokeDashoffset: `${2 * Math.PI * 45 * (1 - displayProgress / 100)}`,
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">
              {currentPomodoro ? formatTime(timeLeft) : '25:00'}
            </span>
          </div>
        </motion.div>

        {/* Status */}
        {currentPomodoro && (
          <motion.p 
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isPaused ? 'Paused' : 'Active'}
          </motion.p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!currentPomodoro ? (
          <Button 
            onClick={handleStart}
            className="gap-2"
            size="sm"
          >
            <Play size={16} />
            Start {isBreak ? 'Break' : 'Focus'}
          </Button>
        ) : (
          <>
            <Button 
              onClick={handlePause}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={cancelPomodoro}
              variant="ghost"
              size="sm"
              className="gap-2 text-danger hover:text-danger"
            >
              <Square size={16} />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Timer Controls */}
      {!currentPomodoro && (
        <div className="mt-4 space-y-3">
          {/* Custom Timer Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowCustomTimer(!showCustomTimer)}
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Settings size={16} />
              Custom Timer
            </Button>
          </div>

          {/* Custom Timer Controls */}
          {showCustomTimer && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-3">
              {/* Focus Timer */}
              <div className="space-y-2">
                <p className="text-xs text-center font-medium text-foreground">Focus Duration</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => setCustomMinutes(Math.max(1, customMinutes - 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center bg-background border border-border rounded px-2 py-1 text-sm"
                      min="1"
                      max="180"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <Button
                    onClick={() => setCustomMinutes(Math.min(180, customMinutes + 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              {/* Break Timer */}
              <div className="space-y-2">
                <p className="text-xs text-center font-medium text-foreground">Break Duration</p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => setCustomBreakMinutes(Math.max(1, customBreakMinutes - 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customBreakMinutes}
                      onChange={(e) => setCustomBreakMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center bg-background border border-border rounded px-2 py-1 text-sm"
                      min="1"
                      max="60"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                  <Button
                    onClick={() => setCustomBreakMinutes(Math.min(60, customBreakMinutes + 1))}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => startPomodoro(taskId, customMinutes)}
                  className="gap-2"
                  size="sm"
                >
                  <Timer size={16} />
                  Focus
                </Button>
                <Button
                  onClick={() => startPomodoro(taskId, customBreakMinutes)}
                  variant="outline"
                  className="gap-2"
                  size="sm"
                >
                  <Coffee size={16} />
                  Break
                </Button>
              </div>
            </div>
          )}

          {/* Quick Duration Presets */}
          {!showCustomTimer && (
            <div className="space-y-4">
              {/* Focus Timer Cards */}
              <div>
                <p className="text-sm font-medium text-center text-foreground mb-3">Focus Sessions</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { minutes: 15, label: "15m", description: "Quick Focus", color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20" },
                    { minutes: 25, label: "25m", description: "Pomodoro", color: "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" },
                    { minutes: 45, label: "45m", description: "Deep Work", color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20" }
                  ].map(({ minutes, label, description, color }) => (
                    <div
                      key={minutes}
                      onClick={() => startPomodoro(taskId, minutes)}
                      className={`${color} border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Break Timer Cards */}
              <div>
                <p className="text-sm font-medium text-center text-foreground mb-3">Break Sessions</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { minutes: 5, label: "5m", description: "Short Break", color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20" },
                    { minutes: 15, label: "15m", description: "Long Break", color: "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20" },
                    { minutes: 30, label: "30m", description: "Meal Break", color: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20" }
                  ].map(({ minutes, label, description, color }) => (
                    <div
                      key={`break-${minutes}`}
                      onClick={() => startPomodoro(taskId, minutes)}
                      className={`${color} border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                      </div>
                    </div>
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
