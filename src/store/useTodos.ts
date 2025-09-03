import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
  due?: string;
  priority: 'low' | 'medium' | 'high';
}

interface TodoState {
  todos: TodoItem[];
  create: (data: Partial<Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  toggle: (id: string) => void;
  update: (id: string, patch: Partial<Omit<TodoItem, 'id'>>) => void;
  remove: (id: string) => void;
  reorder: (from: number, to: number) => void;
  clearCompleted: () => void;
}

export const useTodos = create<TodoState>()(persist((set) => ({
  todos: [
    { id: nanoid(), title: 'Explore the new UI ✨', done: false, createdAt: Date.now(), updatedAt: Date.now(), priority: 'medium' },
    { id: nanoid(), title: 'Add your first real task ➕', done: false, createdAt: Date.now(), updatedAt: Date.now(), priority: 'low' }
  ],
  create: (data) => set((s) => ({
    todos: [
      ...s.todos,
      { id: nanoid(), title: data.title?.trim() || 'Untitled', notes: data.notes, done: false, createdAt: Date.now(), updatedAt: Date.now(), priority: data.priority || 'low', due: data.due }
    ]
  })),
  toggle: (id) => set((s) => ({
    todos: s.todos.map(t => t.id === id ? { ...t, done: !t.done, updatedAt: Date.now() } : t)
  })),
  update: (id, patch) => set((s) => ({
    todos: s.todos.map(t => t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)
  })),
  remove: (id) => set((s) => ({ todos: s.todos.filter(t => t.id !== id) })),
  reorder: (from, to) => set((s) => {
    const copy = [...s.todos];
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    return { todos: copy };
  }),
  clearCompleted: () => set((s) => ({ todos: s.todos.filter(t => !t.done) }))
}), { name: 'cute-todos-v1' }));
