import React, { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useTodos } from '../store/useTodos';
import { Button, Card, EmptyState, Input, Fab, SettingsModal, DeviceBlockModal } from './components';
import { TodoListItem, DragOverlayCard } from './TodoItem';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, Sparkles, Star, Settings2, Timer, BarChart3, Target, Youtube } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { BackgroundGradientAnimation } from './background-gradient-animation';
import { PomodoroTimer } from './pomodoro-timer';
import { ProgressDashboard } from './progress-dashboard';
import { GoalsManager } from './goals-manager';
import DSASheet from './dsa-sheet/DSASheet';
import { PlaylistsManager } from './playlists-manager';
import PlaylistTrackerPage from './playlist-tracker-page';
import { Routes, Route, useNavigate } from 'react-router-dom';

export default function App() {
  const { todos, create, reorder, clearCompleted } = useTodos();
  const [title, setTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'todos' | 'timer' | 'progress' | 'goals' | 'dsa' | 'playlists'>('todos');
  const navigate = useNavigate();

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
      <BackgroundGradientAnimation 
        gradientBackgroundStart="rgb(18, 18, 20)"
        gradientBackgroundEnd="rgb(24, 26, 27)"
        firstColor="46, 217, 141"
        secondColor="255, 95, 95"
        thirdColor="243, 244, 248"
        fourthColor="162, 186, 255"
        fifthColor="255, 204, 112"
        pointerColor="243, 244, 248"
        size="50%"
        blendingValue="soft-light"
        containerClassName="fixed inset-0 z-0 opacity-30"
        interactive={true}
      />
      <div className="w-full h-screen min-h-screen flex flex-col bg-transparent relative z-10">
        <main className="flex-1 w-full flex flex-col px-0 py-0 relative overflow-hidden">
          <Routes>
            <Route path="/" element={
              <>
                <header className="w-full flex items-center justify-between px-4 md:px-8 pt-6 md:pt-8 pb-3 md:pb-4 sticky top-0 z-30 backdrop-blur-lg bg-background/60 border-b border-white/5">
                  <div className="relative w-full flex items-start justify-between">
                    {/* Center Top Highlighted Motivation Line */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-4 md:-top-5 flex flex-col items-center w-full select-none group">
                      <span className="relative px-7 py-2.5 rounded-full bg-card/90 backdrop-blur-xl border border-white/10 text-lg md:text-2xl font-semibold tracking-wide md:tracking-widest text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_6px_16px_-2px_rgba(0,0,0,0.55),0_10px_36px_-6px_rgba(0,0,0,0.65)] animate-fade-in whitespace-nowrap [text-shadow:0_2px_10px_rgba(255,255,255,0.22)] overflow-hidden transition-all duration-500 group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_6px_22px_-2px_rgba(0,0,0,0.5),0_14px_44px_-6px_rgba(0,0,0,0.7)] group-hover:scale-[1.05] group-hover:bg-card">
                        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 animate-shine bg-[length:200%_100%]" />
                        <span className="absolute -inset-px rounded-full pointer-events-none border border-white/5 group-hover:border-white/15" />
                        <span className="relative pr-1">Be thankful to everything you have, and hope for the best</span>
                        <span className="ml-1 text-success/80 group-hover:text-success">✦</span>
                      </span>
                      <span className="mt-1 text-xs md:text-sm text-muted-foreground/70 font-medium italic tracking-wide">– Sanchit Thareja</span>
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2 animate-pop">
                        <span className="inline-block w-3 h-3 rounded-full bg-success mr-2 animate-pulse" />
                        To-Do
                      </h1>
                      <p className="text-base text-muted-foreground/80 mt-1 animate-fade-in">Minimal, glassy, and super clean productivity.</p>
                    </div>
                    <div className="pt-1 pl-4 md:pl-8 flex-shrink-0">
                      <button
                        className="rounded-full p-2 bg-card/80 hover:bg-card shadow-soft border border-border transition-all"
                        aria-label="Settings"
                        onClick={() => setShowSettings(true)}
                      >
                        <Settings2 size={22} />
                      </button>
                    </div>
                    <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
                  </div>
                </header>

                {/* Navigation Tabs */}
                <div className="px-4 md:px-8 mb-6">
                  <div className="flex gap-2 bg-card/80 p-1 rounded-lg border border-border/60 backdrop-blur-sm">
                    <button
                      onClick={() => setCurrentView('todos')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'todos'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <PlusCircle size={16} />
                      Tasks
                    </button>
                    <button
                      onClick={() => setCurrentView('timer')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'timer'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Timer size={16} />
                      Timer
                    </button>
                    <button
                      onClick={() => setCurrentView('progress')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'progress'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <BarChart3 size={16} />
                      Progress
                    </button>
                    <button
                      onClick={() => setCurrentView('goals')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'goals'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Target size={16} />
                      Goals
                    </button>
                    <button
                      onClick={() => setCurrentView('dsa')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'dsa'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Sparkles size={16} />
                      DSA Sheet
                    </button>
                    <button
                      onClick={() => setCurrentView('playlists')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        currentView === 'playlists'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Youtube size={16} />
                      Playlists
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="pb-24">
                    {currentView === 'todos' && (
                      <>
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
                      </>
                    )}

                    {currentView === 'timer' && (
                      <div className="px-4 md:px-8">
                        <PomodoroTimer />
                      </div>
                    )}

                    {currentView === 'progress' && (
                      <div className="px-4 md:px-8">
                        <ProgressDashboard />
                      </div>
                    )}

                    {currentView === 'goals' && (
                      <div className="px-4 md:px-8">
                        <GoalsManager />
                      </div>
                    )}

                    {currentView === 'dsa' && (
                      <div className="px-4 md:px-8">
                        <DSASheet />
                      </div>
                    )}

                    {currentView === 'playlists' && (
                      <div className="px-4 md:px-8">
                        <PlaylistsManager />
                      </div>
                    )}
                  </div>
                </div>

                {currentView === 'todos' && (
                  <Fab onClick={() => setShowInput(true)} icon={<PlusCircle size={32} />} label="Add Task" className="right-4 bottom-20 sm:right-8 sm:bottom-24" />
                )}

                <footer className="bg-muted/50 h-16 flex items-center justify-center relative border-t border-border/40">
                  <p className="text-xs text-muted-foreground/60 text-center px-4">
                    Your todos are stored locally, stay productive!
                  </p>
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
              </>
            } />
            <Route path="/playlists/:playlistId" element={<PlaylistTrackerPage />} />
          </Routes>
        </main>
      </div>
      <Analytics />
    </>
  );
}