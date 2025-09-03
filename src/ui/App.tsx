import React, { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTodos } from '../store/useTodos';
import { Button, Card, EmptyState, Input, Fab, SettingsModal } from './components';
import { TodoListItem, DragOverlayCard } from './TodoItem';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Sparkles, Star, Settings2 } from 'lucide-react';

export default function App() {
  const { todos, create, reorder, clearCompleted } = useTodos();
  const [title, setTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleAdd() {
    if (!title.trim()) return;
    create({ title });
    setTitle('');
    setShowInput(false);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (active.id !== over?.id && over) {
      const from = todos.findIndex(t => t.id === active.id);
      const to = todos.findIndex(t => t.id === over.id);
      if (from !== -1 && to !== -1) reorder(from, to);
    }
  }
  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  const remaining = todos.filter(t => !t.done).length;
  const completed = todos.length - remaining;

  return (
    <div className="w-full h-screen min-h-screen flex flex-col bg-background">
      <main className="flex-1 w-full h-full flex flex-col px-0 py-0 relative">
        <header className="w-full flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2 animate-pop">
              <span className="inline-block w-3 h-3 rounded-full bg-success mr-2 animate-pulse" />
              To-Do
            </h1>
            <p className="text-base text-muted-foreground/80 mt-1 animate-fade-in">Minimal, glassy, and super clean productivity.</p>
          </div>
          <button
            className="rounded-full p-2 bg-card/80 hover:bg-card shadow-soft border border-border transition-all"
            aria-label="Settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 size={22} />
          </button>
  <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
        </header>

        {/* Onboarding/empty state */}
        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-foreground/80">Welcome!</h2>
            <p className="text-muted-foreground/70 mb-6">Start by adding your first task.</p>
            <Button onClick={() => setShowInput(true)} variant="solid" size="lg" className="gap-2 animate-pop">
              <PlusCircle size={20} /> Add Task
            </Button>
          </div>
        )}

        {/* Stats bar */}
        {todos.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-8 animate-fade-in">
            <div className="flex gap-2 items-center text-xs text-muted-foreground/70">
              <span className="rounded-full bg-card/80 px-3 py-1 font-semibold text-foreground/90 border border-border">{remaining} left</span>
              <span className="rounded-full bg-card/80 px-3 py-1 font-semibold text-muted-foreground border border-border">{completed} done</span>
            </div>
            {completed > 0 && (
              <Button variant="ghost" onClick={clearCompleted} className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground animate-pop">
                <Trash2 size={14} /> Clear {completed}
              </Button>
            )}
          </div>
        )}

        {/* Add task input (modal style) */}
        {showInput && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <Card className="p-8 w-full max-w-lg animate-pop relative border border-border/80">
              <button className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground text-2xl" onClick={() => setShowInput(false)} aria-label="Close">
                ×
              </button>
              <h3 className="text-xl font-bold mb-4 text-foreground/90">Add a new task</h3>
              <Input
                autoFocus
                placeholder="What do you want to do?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                maxLength={120}
                className="mb-4"
              />
              <Button onClick={handleAdd} disabled={!title.trim()} variant="solid" size="lg" className="gap-2 w-full">
                <PlusCircle size={20} /> Add
              </Button>
            </Card>
          </div>
        )}

        {/* Task list */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-6 px-8 w-full max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {todos.map(todo => (
                  <TodoListItem key={todo.id} todo={todo} isDraggingActive={activeId === todo.id} />
                ))}
              </AnimatePresence>
            </ul>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.34,1.56,.64,1)' }}>
            {activeId ? <DragOverlayCard todo={todos.find(t => t.id === activeId)!} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Floating Action Button */}
        <Fab onClick={() => setShowInput(true)} icon={<PlusCircle size={32} />} label="Add Task" />

        <footer className="pt-12 pb-4 text-center text-xs text-muted-foreground/50 animate-fade-in w-full">
          <p>Drag to reorder. Your tasks are stored locally. <span className="text-foreground font-bold">Stay productive!</span></p>
        </footer>
      </main>
    </div>
  );
}
