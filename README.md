# Schedule Manager

A browser-based Gantt chart management tool built with React, Vite, and TypeScript.

## Features

- Interactive Gantt chart display with multiple zoom levels (day / week / month / quarter)
- Drag-and-drop bar editing (move, resize)
- Swim lane management (add, reorder, group)
- Milestone markers
- PNG / PDF export
- Data persistence via localStorage
- Light / Dark theme support
- Responsive layout with fixed and auto display modes

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build:** Vite 6
- **State:** Zustand
- **Export:** html2canvas + jsPDF

## Getting Started

```bash
cd webapp
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Build

```bash
cd webapp
npm run build
```

Output is generated in `webapp/dist/`.

## Deploy (Vercel)

This project is configured for Vercel static SPA deployment.

- **Framework Preset:** Vite
- **Root Directory:** `webapp`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Rewrites are configured in `webapp/vercel.json` to support client-side routing.

## License

MIT
