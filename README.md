# Cute To-Do

A delightful dark-themed to-do app (not jet black) built with Vite + React + TypeScript + Tailwind + dnd-kit + Framer Motion + Zustand. Data persists locally. Drag to reorder.

## Features
- Add, edit, delete tasks
- Optional notes per task
- Mark complete / incomplete
- Drag & drop reorder (smooth)
- Animated appearance & interactions
- Persist to localStorage
- Clear completed
- Keyboard: Enter to add / save
- Accessible focus states
- Pomodoro timer + productivity stats & goals
- DSA Sheet view
- NEW: YouTube Playlist Study Boards (paste a playlist URL + API key to turn videos into trackable watched / revisit checklist)
	- Configure your YouTube Data API key via environment variable: create a `.env` with `VITE_YT_API_KEY=YOUR_KEY` (the UI does not prompt the end-user for it).

## Getting Started
Install deps then run dev server.

```
pnpm install # or npm install / yarn
pnpm dev
```

Open http://localhost:5173

## Tech
- React 18
- TypeScript
- TailwindCSS
- dnd-kit (drag & drop)
- Framer Motion (animations)
- Zustand (state)
- Lucide Icons

## License
MIT
