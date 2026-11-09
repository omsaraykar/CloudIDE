# CloudIDE — Modern Browser-Based Development Environment

A fully functional, visually polished browser-based development environment inspired by **VS Code**, **Cursor**, and **CodeSandbox**.

CloudIDE allows developers to create isolated workspaces, edit code with Monaco Editor, execute programs in real time with live streaming stdout/stderr, interact through a real-time xterm.js terminal, and synchronize filesystem changes automatically.

---

## 🌟 Key Features

- **Monaco Editor Experience:**
  - Syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS, JSON, Markdown.
  - Multi-file tabs with dirty state indicators and keyboard shortcuts (`Ctrl+S` / `Cmd+S` to save, `Ctrl+Enter` / `Cmd+Enter` to run).
  - Custom charcoal dark theme matching IDE aesthetics.
  - Debounced autosave (750ms).
- **Docker Container Management & Sandboxed Execution:**
  - Fastify backend orchestrates Docker containers via Dockerode.
  - Resource isolation: memory limits (`256MB`), CPU limits (`50%`), process limits (`pids: 50`), non-root execution (`node` user).
  - Automatic fallback to process sandbox runner if Docker daemon is not active.
  - Real-time stdout, stderr, and execution duration streaming.
- **Interactive Terminal:**
  - Integrated xterm.js terminal with `@xterm/addon-fit` and `@xterm/addon-web-links`.
  - Bi-directional streaming over Socket.IO connected to Docker container TTY or host sandbox shell.
- **Live Filesystem Synchronization:**
  - Chokidar file watcher detects file creation, edits, renames, and deletions.
  - Emits real-time `fs:change` events to update the browser File Explorer instantly.
- **Database & Metadata Persistence:**
  - PostgreSQL persistence with Prisma ORM.
  - Zero-downtime persistent metadata store fallback for standalone local execution.
  - Docker volume persistence for workspaces.

---

## 🧱 Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js 15 Web App                   │
│  (Monaco Editor, xterm.js, ReUI Explorer, Zustand)     │
└───────────────▲────────────────────────▲───────────────┘
                │ REST API               │ Socket.IO
                ▼                        ▼
┌────────────────────────────────────────────────────────┐
│                  Fastify 5 Backend                     │
│  ┌───────────────────────┐  ┌────────────────────────┐ │
│  │   Workspace Manager   │  │   Execution Engine     │ │
│  └───────────────────────┘  └────────────────────────┘ │
│  ┌───────────────────────┐  ┌────────────────────────┐ │
│  │   Filesystem Service  │  │   Terminal Service     │ │
│  │      (Chokidar)       │  │      (Docker/PTY)      │ │
│  └───────────────────────┘  └────────────────────────┘ │
└───────────────┬────────────────────────┬───────────────┘
                │ Prisma Client          │ Dockerode
                ▼                        ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     PostgreSQL 16         │  │     Docker Engine       │
│  (Docker Compose service) │  │  (Isolated Containers)  │
└───────────────────────────┘  └─────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, `@monaco-editor/react`, `@xterm/xterm`, Zustand, Lucide Icons, `react-resizable-panels`.
- **Backend:** Node.js, Fastify 5, Socket.IO, Dockerode, Chokidar, Prisma ORM, PostgreSQL.
- **Monorepo:** pnpm workspaces.
- **Containers:** Dockerode, Alpine Linux container images, Docker Compose.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Docker Desktop** (optional for Docker container mode; process sandbox mode activates automatically if Docker is offline)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Generate Database Client & Build Packages
```bash
pnpm --filter @cloud-ide/shared build
pnpm --filter @cloud-ide/server prisma:generate
pnpm --filter @cloud-ide/server build
```

### 4. Run Both Server and Web Frontend
```bash
# In one terminal: run Fastify backend (Port 4000)
pnpm dev:server

# In another terminal: run Next.js frontend (Port 3000)
pnpm dev:web
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🐳 Running with Docker Compose

To start PostgreSQL, the Fastify backend, and the Next.js web application together:

```bash
docker compose up --build
```

- Web UI: `http://localhost:3000`
- API & Socket.IO: `http://localhost:4000`
- PostgreSQL: `localhost:5432` (`cloudide` / `cloudide_password`)

---

## 🧭 Milestone Verification

1. Open `http://localhost:3000` in your browser.
2. Click **Node.js JavaScript** or click **New Workspace**.
3. The IDE loads the workspace with `index.js`, `package.json`, and `README.md`.
4. Edit code in Monaco Editor — observe the autosave indicator change from **Unsaved** to **Saving...** to **Saved**.
5. Click **Run** in the top bar (or press `Ctrl+Enter` / `Cmd+Enter`).
6. Watch stdout/stderr stream in real time in the **Output** tab.
7. Switch to the **Terminal** tab to type interactive commands inside the workspace.
8. Create a new file or directory from the left explorer; inspect it instantly in the file tree.
