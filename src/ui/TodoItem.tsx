import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useWiggle } from './useWiggle';
import { useTodos, TodoItem as Todo } from '../store/useTodos';
import { CheckCircle2, Circle, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Input, TextArea, cn } from './components';

interface Props {
  todo: Todo;
  isDraggingActive?: boolean;
}

export function TodoListItem({ todo, isDraggingActive }: Props) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging, 
    isSorting 
  } = useSortable({ 
    id: todo.id,
    data: {
      type: 'todo',
      todo,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Make original semi-transparent while dragging
  };

  const { toggle, remove, update } = useTodos();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes || '');
  const [actionsVisible, setActionsVisible] = useState(false);

  // Always show actions on small screens or touch devices
  const shouldShowActions = window.innerWidth < 768 || 'ontouchstart' in window;

  function handleSave() {
    if (!title.trim()) return;
    update(todo.id, { title: title.trim(), notes: notes.trim() || undefined });
    setEditing(false);
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(todo.id);
  }

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
    setActionsVisible(false);
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this task?')) {
      remove(todo.id);
    }
  }

  function handleCardPress() {
    if (shouldShowActions && !editing) {
      setActionsVisible(!actionsVisible);
    }
  }

  const wiggle = useWiggle({ active: isDragging });

  // Don't render the original item if it's being dragged by the overlay
  if (isDraggingActive) {
    return null;
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      className="group relative"
      layout
      animate={{
        scale: isDragging ? 0.95 : isSorting ? 1.02 : 1,
        rotate: wiggle.rotation,
        y: wiggle.y,
      }}
      transition={{
        type: 'spring',
        stiffness: isSorting ? 340 : 420,
        damping: isSorting ? 18 : 32,
        mass: 0.7,
      }}
    >
      <Card
        className={cn(
          'p-4 sm:p-6 flex flex-col gap-3 overflow-hidden',
          'transition-all duration-200',
          'hover:shadow-lg focus-within:shadow-lg',
          isDragging && 'ring-2 ring-blue-500/50 shadow-xl',
          editing && 'ring-2 ring-foreground/40',
          actionsVisible && 'ring-1 ring-foreground/20',
          shouldShowActions && 'cursor-pointer'
        )}
        onClick={handleCardPress}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            className={cn(
              'mt-1 rounded-full transition-all hover:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/40',
              'min-w-[28px] min-h-[28px] flex items-center justify-center',
              todo.done ? 'text-green-600' : 'text-gray-400'
            )}
            aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
          >
            {todo.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                    if (e.key === 'Escape') {
                      setEditing(false);
                      setTitle(todo.title);
                      setNotes(todo.notes || '');
                    }
                  }}
                  autoFocus
                  className="text-base"
                  placeholder="Task title..."
                />
                <TextArea 
                  rows={3} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-base resize-none"
                  placeholder="Add notes (optional)..."
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditing(false);
                      setTitle(todo.title);
                      setNotes(todo.notes || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!title.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pr-2">
                <p className={cn(
                  'font-medium text-base leading-snug break-words',
                  todo.done && 'line-through text-gray-500'
                )}>
                  {todo.title}
                </p>
                {todo.notes && (
                  <p className="text-sm mt-2 text-gray-600 line-clamp-3 break-words">
                    {todo.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Desktop Actions - Always visible on hover */}
          {!shouldShowActions && (
            <div className={cn(
              'flex items-start gap-1 transition-opacity duration-200',
              'opacity-0 group-hover:opacity-100'
            )}>
              {!editing && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleEdit}
                  aria-label="Edit" 
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="size-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDelete}
                aria-label="Delete" 
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </Button>
              <div 
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded transition-colors touch-manipulation"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Actions - Show when tapped or always visible */}
        {shouldShowActions && !editing && (
          <div className={cn(
            'flex gap-2 pt-3 border-t border-gray-200 transition-all duration-200',
            actionsVisible || shouldShowActions ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
          )}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleEdit}
              className="flex-1 h-10 gap-2"
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDelete}
              className="flex-1 h-10 gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
            <div 
              {...attributes}
              {...listeners}
              className="flex items-center justify-center min-w-[44px] cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md transition-colors touch-manipulation"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex gap-2 items-center justify-between text-xs text-gray-500 pt-1">
          <span>Created {new Date(todo.createdAt).toLocaleDateString()}</span>
          {todo.done && <span className="text-green-600 font-medium">✓ Completed</span>}
        </div>

        {/* Drag indicator overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50/50 border-2 border-blue-300 rounded-lg pointer-events-none" />
        )}
      </Card>
    </motion.li>
  );
}

// Drag overlay component - this shows while dragging
export function DragOverlayCard({ todo }: { todo: Todo }) {
  const wiggle = useWiggle({ active: true, amplitudeDeg: 2, bobPx: 3, speed: 2.5 });
  
  return (
    <motion.div 
      className="pointer-events-none transform-gpu"
      animate={{ 
        rotate: wiggle.rotation, 
        y: wiggle.y,
        scale: 1.05,
      }} 
      transition={{ type: 'tween', duration: 0.1 }}
    >
      <Card className="p-4 sm:p-6 shadow-2xl border-2 border-blue-300 bg-white">
        <div className="flex items-start gap-3">
          <div className={cn(
            'mt-1 rounded-full flex items-center justify-center min-w-[28px] min-h-[28px]',
            todo.done ? 'text-green-600' : 'text-gray-400'
          )}>
            {todo.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              'font-medium text-base leading-snug break-words',
              todo.done && 'line-through text-gray-500'
            )}>
              {todo.title}
            </p>
            {todo.notes && (
              <p className="text-sm mt-2 text-gray-600 line-clamp-2 break-words">
                {todo.notes}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}