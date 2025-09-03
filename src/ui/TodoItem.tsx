import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useWiggle } from './useWiggle';
import { useTodos, TodoItem as Todo } from '../store/useTodos';
import { CheckCircle2, Circle, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button, Card, Input, TextArea, cn } from './components';

interface Props {
  todo: Todo;
}

export function TodoListItem({ todo, isDraggingActive }: Props & { isDraggingActive?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } = useSortable({ id: todo.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { toggle, remove, update } = useTodos();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes || '');

  function handleSave() {
    if (!title.trim()) return;
    update(todo.id, { title: title.trim(), notes: notes.trim() || undefined });
    setEditing(false);
  }

  const wiggle = useWiggle({ active: isDragging });
  if (isDraggingActive) return null;
  return (
    <motion.li
      layout
      ref={setNodeRef}
      style={style}
      className={cn('group relative')}
      animate={{
        scale: isDragging ? 1.04 : isSorting ? 1.025 : 1,
        boxShadow: isDragging
          ? '0 0 0 2px #F3F4F833, 0 8px 32px -8px #F3F4F844'
          : isSorting
            ? '0 2px 16px 0 rgba(36,37,38,0.10)'
            : '0 1.5px 4px 0 rgba(36,37,38,0.08)',
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
        {...attributes}
        {...listeners}
        className={cn(
          'p-6 flex flex-col gap-3 overflow-hidden cursor-grab active:cursor-grabbing select-none',
          'hover:shadow-glow focus-within:shadow-glow',
          isDragging && 'ring-2 ring-foreground/30 shadow-glow',
          editing && 'ring-2 ring-foreground/40'
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggle(todo.id)}
            className={cn('mt-0.5 rounded-full transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/40', todo.done ? 'text-success' : 'text-muted-foreground/60')}
            aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
          >
            {todo.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
          </button>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key==='Enter' && handleSave()} />
                <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex gap-2 justify-end pt-1">
                  <Button size="sm" variant="subtle" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className={cn('font-medium tracking-tight text-[16px] leading-tight', todo.done && 'line-through text-muted-foreground/50')}>{todo.title}</p>
                {todo.notes && (
                  <p className="text-xs mt-1 text-muted-foreground/70 line-clamp-2">{todo.notes}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition ml-auto pl-2">
            {!editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit" className="h-7 w-7 p-0"><Pencil className="size-4" /></Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => remove(todo.id)} aria-label="Delete" className="h-7 w-7 p-0 text-danger hover:text-danger"><Trash2 className="size-4" /></Button>
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-1 rounded-md" aria-label="Drag handle">
              <GripVertical className="size-4" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground/50">
          <span>Created {new Date(todo.createdAt).toLocaleDateString()}</span>
          {todo.done && <span className="text-success">Completed</span>}
        </div>
        {isDragging && <div className="absolute inset-0 border-2 border-foreground/20 rounded-2xl pointer-events-none animate-pulse" />}
      </Card>
    </motion.li>
  );
}

export function DragOverlayCard({ todo }: { todo: Todo }) {
  const wiggle = useWiggle({ active: true, amplitudeDeg: 3, bobPx: 4, speed: 2.6 });
  return (
    <motion.div layout className="pointer-events-none" animate={{ rotate: wiggle.rotation, y: wiggle.y }} transition={{ type: 'tween', duration: 0.15 }}>
      <Card className="p-4 pr-3 flex flex-col gap-3 shadow-glow scale-[1.05] origin-center">
        <p className="font-medium tracking-tight text-[15px] leading-tight">
          {todo.title}
        </p>
        {todo.notes && <p className="text-xs mt-1 text-muted-foreground/70 line-clamp-2">{todo.notes}</p>}
      </Card>
    </motion.div>
  );
}