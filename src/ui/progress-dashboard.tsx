import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Flame, Clock, Trophy, Calendar } from 'lucide-react';
import { useProductivity } from '../store/useProductivity';
import { useTodos } from '../store/useTodos';
import { cn } from '../lib/utils';

interface ProgressDashboardProps {
  className?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ 
  className = "" 
}) => {
  const { 
    stats, 
    goals, 
    getTodayProgress, 
    getWeekProgress, 
    getCurrentStreak 
  } = useProductivity();
  
  const { todos } = useTodos();
  
  const todayProgress = getTodayProgress();
  const weekProgress = getWeekProgress();
  const currentStreak = getCurrentStreak();
  
  const completedToday = todos.filter(t => {
    if (!t.done || !t.completedAt) return false;
    const today = new Date().toDateString();
    const completedDate = new Date(t.completedAt).toDateString();
    return today === completedDate;
  }).length;

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = "text-foreground",
    trend
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div
      className="bg-card/80 backdrop-blur-lg rounded-xl p-4 border border-border/80 shadow-soft"
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("p-2 rounded-lg bg-accent/20", color)}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {trend && (
              <TrendingUp 
                size={16} 
                className={cn(
                  "transition-colors",
                  trend === 'up' ? 'text-success' : 
                  trend === 'down' ? 'text-danger' : 'text-muted-foreground'
                )}
              />
            )}
          </div>
        </div>
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </motion.div>
  );

  const ProgressBar = ({ 
    progress, 
    target, 
    label, 
    color = "bg-success" 
  }: {
    progress: number;
    target: number;
    label: string;
    color?: string;
  }) => {
    const percentage = Math.min((progress / target) * 100, 100);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-foreground font-medium">{label}</span>
          <span className="text-muted-foreground">
            {progress}/{target}
          </span>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", color)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {percentage.toFixed(0)}% complete
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          title="Today"
          value={completedToday}
          subtitle="tasks completed"
          color="text-success"
          trend={completedToday > 0 ? 'up' : 'neutral'}
        />
        
        <StatCard
          icon={Flame}
          title="Streak"
          value={currentStreak}
          subtitle="days"
          color="text-orange-500"
          trend={currentStreak > 0 ? 'up' : 'neutral'}
        />
        
        <StatCard
          icon={Clock}
          title="Focus Time"
          value={`${Math.floor(stats.totalFocusTime / 60)}h`}
          subtitle={`${stats.totalFocusTime % 60}m total`}
          color="text-blue-500"
          trend="up"
        />
        
        <StatCard
          icon={Trophy}
          title="Completed"
          value={stats.totalTasksCompleted}
          subtitle="all time"
          color="text-purple-500"
          trend="up"
        />
      </div>

      {/* Goals Progress */}
      <motion.div
        className="bg-card/80 backdrop-blur-lg rounded-xl p-6 border border-border/80 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-success" size={24} />
          <h3 className="text-lg font-semibold text-foreground">Goals</h3>
        </div>
        
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const progress = goal.type === 'daily' ? todayProgress : weekProgress;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProgressBar
                  progress={progress}
                  target={goal.target}
                  label={goal.description}
                  color={goal.type === 'daily' ? 'bg-success' : 'bg-blue-500'}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Weekly Overview */}
      <motion.div
        className="bg-card/80 backdrop-blur-lg rounded-xl p-6 border border-border/80 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-blue-500" size={24} />
          <h3 className="text-lg font-semibold text-foreground">This Week</h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
            const date = new Date();
            date.setDate(date.getDate() - date.getDay() + index);
            const dateKey = date.toISOString().split('T')[0];
            const dayTasks = stats.dailyStats[dateKey] || 0;
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            
            return (
              <motion.div
                key={day}
                className={cn(
                  "text-center p-3 rounded-lg border transition-colors",
                  isToday 
                    ? "bg-accent border-success text-foreground" 
                    : "bg-muted/20 border-border/40 text-muted-foreground"
                )}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="text-xs font-medium mb-1">{day}</div>
                <div className="text-lg font-bold">{dayTasks}</div>
                <div className="w-2 h-2 mx-auto mt-1 rounded-full bg-current opacity-30" />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
