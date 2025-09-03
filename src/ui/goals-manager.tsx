import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Trash2, Calendar, Clock } from 'lucide-react';
import { useProductivity } from '../store/useProductivity';
import { Button, Card, Input } from './components';
import { cn } from '../lib/utils';

interface GoalsManagerProps {
  className?: string;
}

export const GoalsManager: React.FC<GoalsManagerProps> = ({ 
  className = "" 
}) => {
  const { goals, addGoal, removeGoal } = useProductivity();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'daily' as 'daily' | 'weekly',
    target: 5,
    description: '',
  });

  const handleAddGoal = () => {
    if (!newGoal.description.trim()) return;
    
    addGoal(newGoal);
    setNewGoal({
      type: 'daily',
      target: 5,
      description: '',
    });
    setShowAddGoal(false);
  };

  const presetGoals = {
    daily: [
      { target: 3, description: 'Complete 3 tasks today' },
      { target: 5, description: 'Complete 5 tasks today' },
      { target: 10, description: 'Complete 10 tasks today' },
    ],
    weekly: [
      { target: 20, description: 'Complete 20 tasks this week' },
      { target: 300, description: 'Focus for 5 hours this week' },
      { target: 500, description: 'Focus for 8+ hours this week' },
    ],
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="text-success" size={24} />
          <h3 className="text-lg font-semibold text-foreground">Goals</h3>
        </div>
        
        <Button
          onClick={() => setShowAddGoal(true)}
          size="sm"
          className="gap-2"
        >
          <Plus size={16} />
          Add Goal
        </Button>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        <AnimatePresence>
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 hover:shadow-glow transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      goal.type === 'daily' 
                        ? "bg-success/20 text-success" 
                        : "bg-blue-500/20 text-blue-500"
                    )}>
                      {goal.type === 'daily' ? (
                        <Calendar size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {goal.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Target: {goal.target} {goal.type}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => removeGoal(goal.id)}
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {goals.length === 0 && (
          <motion.div
            className="text-center py-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No goals set yet</p>
            <p className="text-sm">Add your first goal to start tracking progress</p>
          </motion.div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card/90 backdrop-blur-lg rounded-xl p-6 w-full max-w-md border border-border/80 shadow-glow"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Add New Goal
              </h3>

              {/* Goal Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['daily', 'weekly'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewGoal(prev => ({ ...prev, type }))}
                      className={cn(
                        "p-3 rounded-lg border transition-all text-left",
                        newGoal.type === type
                          ? "border-success bg-success/20 text-success"
                          : "border-border hover:border-foreground/20 hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {type === 'daily' ? (
                          <Calendar size={16} />
                        ) : (
                          <Clock size={16} />
                        )}
                        <span className="capitalize font-medium">{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target
                </label>
                <Input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal(prev => ({ 
                    ...prev, 
                    target: parseInt(e.target.value) || 0 
                  }))}
                  min={1}
                  max={100}
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Input
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="e.g., Complete 5 tasks today"
                />
              </div>

              {/* Preset Goals */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quick Presets
                </label>
                <div className="space-y-1">
                  {presetGoals[newGoal.type].map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setNewGoal(prev => ({
                        ...prev,
                        target: preset.target,
                        description: preset.description,
                      }))}
                      className="w-full text-left p-2 rounded text-sm hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {preset.description}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddGoal(false)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddGoal}
                  disabled={!newGoal.description.trim()}
                  className="flex-1"
                >
                  Add Goal
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
