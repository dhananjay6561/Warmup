import React, { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTodos } from '../store/useTodos';
import { Button, Card, EmptyState, Input, Fab, SettingsModal, DeviceBlockModal } from './components';
import { TodoListItem, DragOverlayCard } from './TodoItem';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Sparkles, Star, Settings2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const { todos, create, reorder, clearCompleted } = useTodos();
  const [title, setTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
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
    <>
      <DeviceBlockModal />
      <div className="w-full h-screen min-h-screen flex flex-col bg-background">
        <main className="flex-1 w-full flex flex-col px-0 py-0 relative overflow-hidden">
          <header className="w-full flex items-center justify-between px-4 md:px-8 pt-6 md:pt-8 pb-3 md:pb-4">
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

          <div className="flex-1 overflow-y-auto">
            <div className="pb-24">
              {todos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in px-4">
                  <h2 className="text-2xl font-bold mb-2 text-foreground/80 text-center">Welcome!</h2>
                  <p className="text-muted-foreground/70 mb-6 text-center">Start by adding your first task.</p>
                  <Button onClick={() => setShowInput(true)} variant="solid" size="lg" className="gap-2 animate-pop w-full max-w-xs">
                    <PlusCircle size={20} /> Add Task
                  </Button>
                </div>
              )}

              {todos.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 px-4 md:px-8 gap-2 animate-fade-in">
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

              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-4 px-2 sm:px-4 md:px-8 w-full max-w-3xl mx-auto">
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
            </div>
          </div>

          <Fab onClick={() => setShowInput(true)} icon={<PlusCircle size={32} />} label="Add Task" className="right-4 bottom-20 sm:right-8 sm:bottom-24" />
        </main>

        <footer className="bg-muted/50 h-16 flex items-center justify-center relative border-t border-border/40">
          <a 
            href="https://vercel.com/dhananjay-aggarwals-projects/warmup" 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-2 right-3 text-sm opacity-60 hover:opacity-100 transition-all duration-300 text-foreground bg-card/50 px-2 py-1 rounded-md hover:bg-card/80"
            title="Vercel Dashboard"
          >
            ▲
          </a>
        </footer>

        {showInput && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-2">
            <Card className="p-6 sm:p-8 w-full max-w-lg animate-pop relative border border-border/80">
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
      </div>
      <Analytics />
    </>
  );
}