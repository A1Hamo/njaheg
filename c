[33mcommit 65f51604b46306606a4a55ecded1f95e1e86c977[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m
Author: A1Hamo <ahmed1abdalkrem1@gmail.com>
Date:   Mon Apr 6 20:52:35 2026 +0200

    first commit

[1mdiff --git a/README.md b/README.md[m
[1mnew file mode 100644[m
[1mindex 0000000..af3eb3a[m
[1m--- /dev/null[m
[1m+++ b/README.md[m
[36m@@ -0,0 +1,397 @@[m
[32m+[m[32m<<<<<<< HEAD[m[41m[m
[32m+[m[32m# 🎓 Najah Platform — Complete Production System[m[41m[m
[32m+[m[41m[m
[32m+[m[32m**The complete full-stack Egyptian school educational platform.**[m[41m[m
[32m+[m[32mAI-powered learning, real-time chat, file management, study planning, gamification, and more.[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 📁 Repository Structure[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[32mnajah-complete/[m[41m[m
[32m+[m[32m├── backend/                    # Node.js/Express API[m[41m[m
[32m+[m[32m│   ├── src/[m[41m[m
[32m+[m[32m│   │   ├── server.js           # Entry point — all middleware, routes mounted[m[41m[m
[32m+[m[32m│   │   ├── config/             # postgres, mongo, redis, firebase, passport, socket[m[41m[m
[32m+[m[32m│   │   ├── middleware/         # auth (JWT), errorHandler, rateLimiter, upload[m[41m[m
[32m+[m[32m│   │   ├── controllers/        # authController, filesController, aiController[m[41m[m
[32m+[m[32m│   │   ├── routes/             # auth, users, planner, files, notes, board, chat,[m[41m[m
[32m+[m[32m│   │   │                       # ai, notifications, achievements, quiz, subjects, analytics[m[41m[m
[32m+[m[32m│   │   ├── services/           # achievementService (20 achievements), emailService[m[41m[m
[32m+[m[32m│   │   ├── jobs/               # cronJobs (reminders, streak reset, weekly summary)[m[41m[m
[32m+[m[32m│   │   └── utils/              # logger (Winston), tokens (JWT helpers)[m[41m[m
[32m+[m[32m│   ├── package.json[m[41m[m
[32m+[m[32m│   └── .env.example[m[41m[m
[32m+[m[32m│[m[41m[m
[32m+[m[32m├── frontend/                   # React 18 SPA[m[41m[m
[32m+[m[32m│   ├── public/index.html[m[41m[m
[32m+[m[32m│   ├── src/[m[41m[m
[32m+[m[32m│   │   ├── App.jsx             # Router, QueryClient, auth guards, lazy loading[m[41m[m
[32m+[m[32m│   │   ├── index.js[m[41m[m
[32m+[m[32m│   │   ├── api/index.js        # All API modules (authAPI, filesAPI, aiAPI, …)[m[41m[m
[32m+[m[32m│   │   ├── context/store.js    # Zustand: auth, UI (lang/dark), chat, notifications[m[41m[m
[32m+[m[32m│   │   ├── hooks/index.js      # useSocket, useRequireAuth, useTranslation, usePageTitle[m[41m[m
[32m+[m[32m│   │   ├── styles/global.css   # Full design system — tokens, RTL, grid, animations[m[41m[m
[32m+[m[32m│   │   └── components/[m[41m[m
[32m+[m[32m│   │       ├── shared/         # UI.jsx (Button, Card, Modal, Input, …), Layout.jsx[m[41m[m
[32m+[m[32m│   │       ├── auth/           # Login, Register, ForgotPassword, AuthCallback[m[41m[m
[32m+[m[32m│   │       ├── dashboard/      # Dashboard with stats, schedule, quick actions[m[41m[m
[32m+[m[32m│   │       ├── planner/        # Weekly calendar, session CRUD, AI schedule import[m[41m[m
[32m+[m[32m│   │       ├── files/          # Drag-drop upload, Firebase progress, AI analysis[m[41m[m
[32m+[m[32m│   │       ├── notes/          # Rich text editor (contentEditable), pin, word count[m[41m[m
[32m+[m[32m│   │       ├── board/          # Community posts, like/save toggle, subject filter[m[41m[m
[32m+[m[32m│   │       ├── chat/           # Socket.IO rooms, typing indicators, message history[m[41m[m
[32m+[m[32m│   │       ├── ai/             # GPT-4o chat+memory, PDF summary, quiz gen, study plan[m[41m[m
[32m+[m[32m│   │       ├── focus/          # Pomodoro SVG ring timer, XP recording[m[41m[m
[32m+[m[32m│   │       ├── achievements/   # 20 achievements, XP, levels, leaderboard[m[41m[m
[32m+[m[32m│   │       ├── notifications/  # Grouped by date, mark-read, real-time push[m[41m[m
[32m+[m[32m│   │       ├── analytics/      # Subject breakdown, quiz stats, heatmap, weekly chart[m[41m[m
[32m+[m[32m│   │       ├── profile/        # Avatar upload, profile edit, stats[m[41m[m
[32m+[m[32m│   │       └── settings/       # Dark mode, Arabic/RTL, change password[m[41m[m
[32m+[m[32m│   └── package.json[m[41m[m
[32m+[m[32m│[m[41m[m
[32m+[m[32m└── devops/                     # Infrastructure[m[41m[m
[32m+[m[32m    ├── docker-compose.yml      # 5 services: postgres, mongo, redis, backend, frontend, nginx[m[41m[m
[32m+[m[32m    ├── docker-compose.prod.yml # Resource limits + replicas[m[41m[m
[32m+[m[32m    ├── docker/[m[41m[m
[32m+[m[32m    │   ├── backend/Dockerfile  # Node 20 Alpine, multi-stage, non-root user[m[41m[m
[32m+[m[32m    │   ├── frontend/Dockerfile # React build → Nginx static serve[m[41m[m
[32m+[m[32m    │   └── postgres/init.sql   # Extensions: pgcrypto, uuid-ossp[m[41m[m
[32m+[m[32m    ├── nginx/[m[41m[m
[32m+[m[32m    │   ├── nginx.conf          # Upstreams, rate limiting zones, gzip[m[41m[m
[32m+[m[32m    │   └── conf.d/najah.conf   # SSL, WebSocket proxy, CSP headers, SPA routing[m[41m[m
[32m+[m[32m    ├── .github/workflows/[m[41m[m
[32m+[m[32m    │   └── deploy.yml          # CI: test → build images → push → SSH deploy[m[41m[m
[32m+[m[32m    └── scripts/[m[41m[m
[32m+[m[32m        ├── setup-server.sh     # One-command Ubuntu 22.04 setup + SSL + firewall[m[41m[m
[32m+[m[32m        └── backup.sh           # Daily PG + Mongo backups, 30-day retention[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## ⚡ Quick Start (Local Development)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Prerequisites[m[41m[m
[32m+[m[32m- Node.js ≥ 18, npm ≥ 9[m[41m[m
[32m+[m[32m- Docker + Docker Compose[m[41m[m
[32m+[m[32m- PostgreSQL 16, MongoDB 7, Redis 7 (or use Docker below)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### 1. Clone and configure[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mgit clone https://github.com/YOUR/najah-platform.git[m[41m[m
[32m+[m[32mcd najah-platform[m[41m[m
[32m+[m[41m[m
[32m+[m[32m# Backend[m[41m[m
[32m+[m[32mcd backend[m[41m[m
[32m+[m[32mcp .env.example .env[m[41m[m
[32m+[m[32m# Fill in: DB credentials, JWT secrets, Google OAuth, Firebase, OpenAI, SMTP[m[41m[m
[32m+[m[41m[m
[32m+[m[32m# Frontend[m[41m[m
[32m+[m[32mcd ../frontend[m[41m[m
[32m+[m[32mcp .env.example .env[m[41m[m
[32m+[m[32m# REACT_APP_API_URL=http://localhost:5000/api[m[41m[m
[32m+[m[32m# REACT_APP_SOCKET_URL=http://localhost:5000[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### 2. Start databases with Docker[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mcd devops[m[41m[m
[32m+[m[32mdocker compose up postgres mongo redis -d[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### 3. Start backend[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mcd backend[m[41m[m
[32m+[m[32mnpm install[m[41m[m
[32m+[m[32mnpm run dev        # → http://localhost:5000[m[41m[m
[32m+[m[32m# On first run, migrations run automatically and achievements are seeded[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### 4. Start frontend[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mcd frontend[m[41m[m
[32m+[m[32mnpm install[m[41m[m
[32m+[m[32mnpm start          # → http://localhost:3000[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 🚀 Production Deployment (30 minutes)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 1 — Get a VPS (Ubuntu 22.04)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m| Provider | Instance | Price | Specs |[m[41m[m
[32m+[m[32m|----------|----------|-------|-------|[m[41m[m
[32m+[m[32m| Hetzner  | CX21     | €5/mo | 2 vCPU, 4GB RAM, 40GB SSD |[m[41m[m
[32m+[m[32m| DigitalOcean | Basic | $12/mo | 2 vCPU, 2GB RAM |[m[41m[m
[32m+[m[32m| Linode   | Shared   | $12/mo | 2 vCPU, 4GB RAM |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 2 — DNS[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[32mA  yourdomain.com      → SERVER_IP[m[41m[m
[32m+[m[32mA  www.yourdomain.com  → SERVER_IP[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 3 — Server setup[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mssh root@YOUR_IP[m[41m[m
[32m+[m[32mcurl -sSL https://raw.githubusercontent.com/YOUR/REPO/main/devops/scripts/setup-server.sh \[m[41m[m
[32m+[m[32m  | bash -s -- yourdomain.com admin@email.com[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 4 — Fill secrets[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32mnano /opt/najah/.env.production[m[41m[m
[32m+[m[32m# Fill in every value — NEVER skip any field[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 5 — Deploy[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```bash[m[41m[m
[32m+[m[32m# Copy project to server[m[41m[m
[32m+[m[32mrsync -avz . user@SERVER:/opt/najah/[m[41m[m
[32m+[m[41m[m
[32m+[m[32m# Start everything[m[41m[m
[32m+[m[32mcd /opt/najah[m[41m[m
[32m+[m[32mdocker compose -f docker-compose.yml -f docker-compose.prod.yml up -d[m[41m[m
[32m+[m[32mdocker compose exec backend node src/config/seed.js  # seed achievements + subjects[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Step 6 — CI/CD (auto-deploy on git push)[m[41m[m
[32m+[m[41m[m
[32m+[m[32mAdd these GitHub Secrets (Settings → Secrets → Actions):[m[41m[m
[32m+[m[41m[m
[32m+[m[32m| Secret | Value |[m[41m[m
[32m+[m[32m|--------|-------|[m[41m[m
[32m+[m[32m| `SERVER_HOST` | Your server IP |[m[41m[m
[32m+[m[32m| `SERVER_USER` | SSH username |[m[41m[m
[32m+[m[32m| `SSH_PRIVATE_KEY` | Private key content |[m[41m[m
[32m+[m[32m| `GOOGLE_CLIENT_ID` | From Google Console |[m[41m[m
[32m+[m[32m| `SLACK_WEBHOOK_URL` | Slack webhook (optional) |[m[41m[m
[32m+[m[41m[m
[32m+[m[32mNow every `git push main` automatically tests, builds Docker images, and deploys. 🎉[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 🔑 Required API Keys (get these first)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Google OAuth 2.0[m[41m[m
[32m+[m[32m1. [console.cloud.google.com](https://console.cloud.google.com) → Create project[m[41m[m
[32m+[m[32m2. APIs & Services → Credentials → OAuth 2.0 Client ID (Web)[m[41m[m
[32m+[m[32m3. Authorized redirect: `https://yourdomain.com/api/auth/google/callback`[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Firebase Storage[m[41m[m
[32m+[m[32m1. [console.firebase.google.com](https://console.firebase.google.com) → Create project[m[41m[m
[32m+[m[32m2. Storage → Enable → Project Settings → Service Accounts → Generate key[m[41m[m
[32m+[m[32m3. Storage Rules: allow authenticated users to read/write their own files[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### OpenAI[m[41m[m
[32m+[m[32m1. [platform.openai.com](https://platform.openai.com) → API Keys → Create key[m[41m[m
[32m+[m[32m2. Recommended model: `gpt-4o` (best balance of speed + quality)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Gmail SMTP (for emails)[m[41m[m
[32m+[m[32m1. Google Account → Security → 2-Step Verification → App Passwords[m[41m[m
[32m+[m[32m2. Generate password for "Mail" → use as `SMTP_PASS`[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 🏗️ Architecture[m[41m[m
[32m+[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[32m                    ┌─────────────┐[m[41m[m
[32m+[m[32m                    │   Browser   │[m[41m[m
[32m+[m[32m                    └──────┬──────┘[m[41m[m
[32m+[m[32m                           │ HTTPS[m[41m[m
[32m+[m[32m                    ┌──────▼──────┐[m[41m[m
[32m+[m[32m                    │    Nginx    │  ← SSL termination, rate limiting[m[41m[m
[32m+[m[32m                    │  (reverse   │  ← WebSocket upgrade for Socket.IO[m[41m[m
[32m+[m[32m                    │   proxy)    │  ← Static asset caching[m[41m[m
[32m+[m[32m                    └──┬──────┬───┘[m[41m[m
[32m+[m[32m               /api/*  │      │  /socket.io/*  + /[m[41m[m
[32m+[m[32m        ┌──────▼───┐   │   ┌──▼────────┐[m[41m[m
[32m+[m[32m        │ Backend  │   │   │ Frontend  │[m[41m[m
[32m+[m[32m        │ Express  │   │   │  Nginx    │  ← Serves React build[m[41m[m
[32m+[m[32m        │ +Socket  │   │   │  (static) │[m[41m[m
[32m+[m[32m        └─┬─┬─┬─┬─┘   │   └───────────┘[m[41m[m
[32m+[m[32m          │ │ │ │[m[41m[m
[32m+[m[32m    ┌─────┘ │ │ └────────────────┐[m[41m[m
[32m+[m[32m    │  ┌────┘ └────┐             │[m[41m[m
[32m+[m[32m    ▼  ▼           ▼             ▼[m[41m[m
[32m+[m[32m  ┌──┐ ┌──┐    ┌──────┐    ┌─────────┐[m[41m[m
[32m+[m[32m  │PG│ │MG│    │Redis │    │Firebase │[m[41m[m
[32m+[m[32m  │DB│ │DB│    │Cache │    │Storage  │[m[41m[m
[32m+[m[32m  └──┘ └──┘    └──────┘    └─────────┘[m[41m[m
[32m+[m[32mPostgreSQL  MongoDB   Redis      Firebase[m[41m[m
[32m+[m[32m(main data) (chat+AI) (JWT/cache) (files)[m[41m[m
[32m+[m[32m```[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 📡 Complete API Reference[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Authentication (`/api/auth`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| POST | `/register` | Email/password registration |[m[41m[m
[32m+[m[32m| POST | `/login` | Login → returns JWT + refresh |[m[41m[m
[32m+[m[32m| POST | `/refresh` | Refresh access token |[m[41m[m
[32m+[m[32m| POST | `/logout` | Blacklist token in Redis |[m[41m[m
[32m+[m[32m| GET  | `/me` | Get current user with stats |[m[41m[m
[32m+[m[32m| GET  | `/google` | Google OAuth redirect |[m[41m[m
[32m+[m[32m| GET  | `/google/callback` | OAuth callback → redirect with tokens |[m[41m[m
[32m+[m[32m| GET  | `/verify/:token` | Verify email address |[m[41m[m
[32m+[m[32m| POST | `/forgot-password` | Send reset email |[m[41m[m
[32m+[m[32m| POST | `/reset-password` | Apply new password |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Users (`/api/users`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/profile` | Full profile with all counts |[m[41m[m
[32m+[m[32m| PATCH | `/profile` | Update name, grade, school, language, bio |[m[41m[m
[32m+[m[32m| POST | `/avatar` | Upload + compress avatar → Firebase |[m[41m[m
[32m+[m[32m| POST | `/change-password` | Verify old + set new |[m[41m[m
[32m+[m[32m| POST | `/pomodoro` | Record completed Pomodoro session |[m[41m[m
[32m+[m[32m| GET  | `/progress` | Subject progress breakdown |[m[41m[m
[32m+[m[32m| GET  | `/stats` | Aggregate dashboard stats |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Planner (`/api/planner`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/` | List sessions (filter: start, end, subject, status) |[m[41m[m
[32m+[m[32m| POST | `/` | Create session (auto-calculates duration) |[m[41m[m
[32m+[m[32m| PATCH | `/:id` | Update status → triggers XP + achievement check |[m[41m[m
[32m+[m[32m| DELETE | `/:id` | Remove session |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Files (`/api/files`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/` | List files (filter: subject, tag, search) |[m[41m[m
[32m+[m[32m| POST | `/` | Upload → Firebase (multipart/form-data, max 200MB) |[m[41m[m
[32m+[m[32m| GET  | `/:id` | Get single file |[m[41m[m
[32m+[m[32m| PATCH | `/:id` | Update tags/subject/description |[m[41m[m
[32m+[m[32m| DELETE | `/:id` | Delete file + Firebase object |[m[41m[m
[32m+[m[32m| GET  | `/:id/extract` | Extract text from PDF (for AI) |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### AI (`/api/ai`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| POST | `/chat` | GPT-4o conversation with memory |[m[41m[m
[32m+[m[32m| GET  | `/conversations` | List AI conversation history |[m[41m[m
[32m+[m[32m| GET  | `/conversations/:id` | Get full conversation |[m[41m[m
[32m+[m[32m| DELETE | `/conversations/:id` | Delete conversation |[m[41m[m
[32m+[m[32m| POST | `/summarize` | Summarize PDF by fileId (cached 2h) |[m[41m[m
[32m+[m[32m| POST | `/quiz` | Generate MCQ quiz (JSON format, optional fileId) |[m[41m[m
[32m+[m[32m| POST | `/quiz/submit` | Record quiz result + award XP |[m[41m[m
[32m+[m[32m| POST | `/study-plan` | AI-optimized study schedule |[m[41m[m
[32m+[m[32m| POST | `/ask-file` | Q&A from specific uploaded file |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Notes (`/api/notes`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/` | List (filter: subject, search, pinned) |[m[41m[m
[32m+[m[32m| POST | `/` | Create (auto word count) |[m[41m[m
[32m+[m[32m| GET  | `/:id` | Get single note |[m[41m[m
[32m+[m[32m| PUT  | `/:id` | Update (auto word count update) |[m[41m[m
[32m+[m[32m| DELETE | `/:id` | Remove |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Board (`/api/board`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/` | List posts (filter: subject, sort: newest/popular) |[m[41m[m
[32m+[m[32m| POST | `/` | Create post (requires owned file) |[m[41m[m
[32m+[m[32m| POST | `/:id/like` | Toggle like (XP to author) |[m[41m[m
[32m+[m[32m| POST | `/:id/save` | Toggle save |[m[41m[m
[32m+[m[32m| DELETE | `/:id` | Remove own post |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Chat (`/api/chat`)[m[41m[m
[32m+[m[32m| Method | Path | Description |[m[41m[m
[32m+[m[32m|--------|------|-------------|[m[41m[m
[32m+[m[32m| GET  | `/rooms` | List all chat room subjects |[m[41m[m
[32m+[m[32m| GET  | `/:subject/messages` | Message history (paginated) |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m### Real-time (Socket.IO)[m[41m[m
[32m+[m[32m| Event (client→server) | Payload | Description |[m[41m[m
[32m+[m[32m|----------------------|---------|-------------|[m[41m[m
[32m+[m[32m| `join_room` | `{ subject }` | Join subject chat room |[m[41m[m
[32m+[m[32m| `leave_room` | `{ subject }` | Leave room |[m[41m[m
[32m+[m[32m| `send_message` | `{ subject, content, type? }` | Send message |[m[41m[m
[32m+[m[32m| `react_message` | `{ messageId, emoji }` | React to message |[m[41m[m
[32m+[m[32m| `typing` | `{ subject, isTyping }` | Typing indicator |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m| Event (server→client) | Description |[m[41m[m
[32m+[m[32m|----------------------|-------------|[m[41m[m
[32m+[m[32m| `new_message` | New message in joined room |[m[41m[m
[32m+[m[32m| `user_joined/left` | Room membership change |[m[41m[m
[32m+[m[32m| `user_typing` | Typing indicator |[m[41m[m
[32m+[m[32m| `notification` | Push notification |[m[41m[m
[32m+[m[32m| `level_up` | XP level up event |[m[41m[m
[32m+[m[32m| `achievement` | Achievement unlocked |[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 🛡️ Security[m[41m[m
[32m+[m[41m[m
[32m+[m[32m- JWT access tokens (7d) + refresh tokens (30d) with Redis blacklisting on logout[m[41m[m
[32m+[m[32m- bcrypt password hashing (12 rounds)[m[41m[m
[32m+[m[32m- Google OAuth 2.0 upsert (no password stored for OAuth users)[m[41m[m
[32m+[m[32m- Rate limiting: 60 req/min general, 10 req/min auth, 5 req/min uploads, 10 req/min AI[m[41m[m
[32m+[m[32m- File type whitelist (PDF, JPEG, PNG, GIF, WEBP) + 200 MB size limit[m[41m[m
[32m+[m[32m- Helmet.js security headers[m[41m[m
[32m+[m[32m- CORS restricted to `CLIENT_URL` only[m[41m[m
[32m+[m[32m- Parameterized SQL queries (no injection risk)[m[41m[m
[32m+[m[32m- Nginx: TLS 1.2/1.3 only, HSTS, X-Frame-Options, X-Content-Type-Options[m[41m[m
[32m+[m[32m- Non-root Docker user in production[m[41m[m
[32m+[m[32m- UFW firewall + Fail2ban on VPS[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 🏆 Gamification System[m[41m[m
[32m+[m[41m[m
[32m+[m[32m**20 achievements across 10 categories:**[m[41m[m
[32m+[m[32m- 📖 Study (first session, 10 sessions, 50 sessions)[m[41m[m
[32m+[m[32m- 🔥 Streak (3 days, 7 days, 30 days)[m[41m[m
[32m+[m[32m- 📁 Files (first upload, 10 uploads)[m[41m[m
[32m+[m[32m- 🧠 Quiz (first quiz, perfect score, 10 quizzes)[m[41m[m
[32m+[m[32m- 📋 Community (first board post, 100 likes received)[m[41m[m
[32m+[m[32m- ⏱️ Focus (10 pomodoros, 50 pomodoros)[m[41m[m
[32m+[m[32m- 🤖 AI (first AI chat)[m[41m[m
[32m+[m[32m- ✏️ Notes (first note, 20 notes)[m[41m[m
[32m+[m[32m- ⭐ Level (level 10, 20, 50)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m**XP System:** Every action awards XP — session complete (+50), chat message (+5), AI chat (+5), Pomodoro (+25), board post liked (+5), quiz score (score% × 10)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m**Level formula:** `level × 200 XP` per level (Level 1→2: 200 XP, Level 10→11: 2000 XP)[m[41m[m
[32m+[m[41m[m
[32m+[m[32m---[m[41m[m
[32m+[m[41m[m
[32m+[m[32m## 📦 Tech Stack[m[41m[m
[32m+[m[41m[m
[32m+[m[32m| Layer | Technology |[m[41m[m
[32m+[m[32m|-------|-----------|[m[41m[m
[32m+[m[32m| Frontend | React 18, React Router 6, Framer Motion, TanStack Query, Zustand |[m[41m[m
[32m+[m[32m| Styling | CSS Variables (design tokens), RTL support (Arabic) |[m[41m[m
[32m+[m[32m| Real-time | Socket.IO (WebSocket + fallback polling) |[m[41m[m
[32m+[m[32m| Backend | Node.js 20, Express 4, Passport.js |[m[41m[m
[32m+[m[32m| Primary DB | PostgreSQL 16 (users, sessions, files, notes, board, achievements) |[m[41m[m
[32m+[m[32m| Chat/AI DB | MongoDB 7 (messages, AI conversation history) |[m[41m[m
[32m+[m[32m| Cache | Redis 7 (JWT blacklist, API response cache) |[m[41m[m
[32m+[m[32m| File Storage | Firebase Storage (images, PDFs up to 200MB) |[m[41m[m
[32m+[m[32m| AI | OpenAI GPT-4o (chat, quiz, summary, study plan) |[m[41m[m
[32m+[m[32m| Email | Nodemailer + SMTP (verification, reset, reminders) |[m[41m[m
[32m+[m[32m| Proxy | Nginx (SSL, WebSocket, rate limiting, SPA routing) |[m[41m[m
[32m+[m[32m| Container | Docker + Docker Compose |[m[41m[m
[32m+[m[32m| CI/CD | GitHub Actions (test → build → push → SSH deploy) |[m[41m[m
[32m+[m[32m=======[m[41m[m
[32m+[m[32m# New-njah1[m[41m[m
[32m+[m[32m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[m[41m[m
[32m+[m[32m>>>>>>> dcccd644fbeadd1f5a15f4d8ff3c7435fc0de5a7[m[41m[m
[32m+[m[32m#   n j a h b r o  [m
[32m+[m[32m [m
\ No newline at end of file[m
