<<<<<<< HEAD
# 🎓 Najah Platform — Complete Production System

**The complete full-stack Egyptian school educational platform.**
AI-powered learning, real-time chat, file management, study planning, gamification, and more.

---

## 📁 Repository Structure

```
najah-complete/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── server.js           # Entry point — all middleware, routes mounted
│   │   ├── config/             # postgres, mongo, redis, firebase, passport, socket
│   │   ├── middleware/         # auth (JWT), errorHandler, rateLimiter, upload
│   │   ├── controllers/        # authController, filesController, aiController
│   │   ├── routes/             # auth, users, planner, files, notes, board, chat,
│   │   │                       # ai, notifications, achievements, quiz, subjects, analytics
│   │   ├── services/           # achievementService (20 achievements), emailService
│   │   ├── jobs/               # cronJobs (reminders, streak reset, weekly summary)
│   │   └── utils/              # logger (Winston), tokens (JWT helpers)
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React 18 SPA
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx             # Router, QueryClient, auth guards, lazy loading
│   │   ├── index.js
│   │   ├── api/index.js        # All API modules (authAPI, filesAPI, aiAPI, …)
│   │   ├── context/store.js    # Zustand: auth, UI (lang/dark), chat, notifications
│   │   ├── hooks/index.js      # useSocket, useRequireAuth, useTranslation, usePageTitle
│   │   ├── styles/global.css   # Full design system — tokens, RTL, grid, animations
│   │   └── components/
│   │       ├── shared/         # UI.jsx (Button, Card, Modal, Input, …), Layout.jsx
│   │       ├── auth/           # Login, Register, ForgotPassword, AuthCallback
│   │       ├── dashboard/      # Dashboard with stats, schedule, quick actions
│   │       ├── planner/        # Weekly calendar, session CRUD, AI schedule import
│   │       ├── files/          # Drag-drop upload, Firebase progress, AI analysis
│   │       ├── notes/          # Rich text editor (contentEditable), pin, word count
│   │       ├── board/          # Community posts, like/save toggle, subject filter
│   │       ├── chat/           # Socket.IO rooms, typing indicators, message history
│   │       ├── ai/             # GPT-4o chat+memory, PDF summary, quiz gen, study plan
│   │       ├── focus/          # Pomodoro SVG ring timer, XP recording
│   │       ├── achievements/   # 20 achievements, XP, levels, leaderboard
│   │       ├── notifications/  # Grouped by date, mark-read, real-time push
│   │       ├── analytics/      # Subject breakdown, quiz stats, heatmap, weekly chart
│   │       ├── profile/        # Avatar upload, profile edit, stats
│   │       └── settings/       # Dark mode, Arabic/RTL, change password
│   └── package.json
│
└── devops/                     # Infrastructure
    ├── docker-compose.yml      # 5 services: postgres, mongo, redis, backend, frontend, nginx
    ├── docker-compose.prod.yml # Resource limits + replicas
    ├── docker/
    │   ├── backend/Dockerfile  # Node 20 Alpine, multi-stage, non-root user
    │   ├── frontend/Dockerfile # React build → Nginx static serve
    │   └── postgres/init.sql   # Extensions: pgcrypto, uuid-ossp
    ├── nginx/
    │   ├── nginx.conf          # Upstreams, rate limiting zones, gzip
    │   └── conf.d/najah.conf   # SSL, WebSocket proxy, CSP headers, SPA routing
    ├── .github/workflows/
    │   └── deploy.yml          # CI: test → build images → push → SSH deploy
    └── scripts/
        ├── setup-server.sh     # One-command Ubuntu 22.04 setup + SSL + firewall
        └── backup.sh           # Daily PG + Mongo backups, 30-day retention
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18, npm ≥ 9
- Docker + Docker Compose
- PostgreSQL 16, MongoDB 7, Redis 7 (or use Docker below)

### 1. Clone and configure

```bash
git clone https://github.com/YOUR/najah-platform.git
cd najah-platform

# Backend
cd backend
cp .env.example .env
# Fill in: DB credentials, JWT secrets, Google OAuth, Firebase, OpenAI, SMTP

# Frontend
cd ../frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_SOCKET_URL=http://localhost:5000
```

### 2. Start databases with Docker

```bash
cd devops
docker compose up postgres mongo redis -d
```

### 3. Start backend

```bash
cd backend
npm install
npm run dev        # → http://localhost:5000
# On first run, migrations run automatically and achievements are seeded
```

### 4. Start frontend

```bash
cd frontend
npm install
npm start          # → http://localhost:3000
```

---

## 🚀 Production Deployment (30 minutes)

### Step 1 — Get a VPS (Ubuntu 22.04)

| Provider | Instance | Price | Specs |
|----------|----------|-------|-------|
| Hetzner  | CX21     | €5/mo | 2 vCPU, 4GB RAM, 40GB SSD |
| DigitalOcean | Basic | $12/mo | 2 vCPU, 2GB RAM |
| Linode   | Shared   | $12/mo | 2 vCPU, 4GB RAM |

### Step 2 — DNS

```
A  yourdomain.com      → SERVER_IP
A  www.yourdomain.com  → SERVER_IP
```

### Step 3 — Server setup

```bash
ssh root@YOUR_IP
curl -sSL https://raw.githubusercontent.com/YOUR/REPO/main/devops/scripts/setup-server.sh \
  | bash -s -- yourdomain.com admin@email.com
```

### Step 4 — Fill secrets

```bash
nano /opt/najah/.env.production
# Fill in every value — NEVER skip any field
```

### Step 5 — Deploy

```bash
# Copy project to server
rsync -avz . user@SERVER:/opt/najah/

# Start everything
cd /opt/najah
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec backend node src/config/seed.js  # seed achievements + subjects
```

### Step 6 — CI/CD (auto-deploy on git push)

Add these GitHub Secrets (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Your server IP |
| `SERVER_USER` | SSH username |
| `SSH_PRIVATE_KEY` | Private key content |
| `GOOGLE_CLIENT_ID` | From Google Console |
| `SLACK_WEBHOOK_URL` | Slack webhook (optional) |

Now every `git push main` automatically tests, builds Docker images, and deploys. 🎉

---

## 🔑 Required API Keys (get these first)

### Google OAuth 2.0
1. [console.cloud.google.com](https://console.cloud.google.com) → Create project
2. APIs & Services → Credentials → OAuth 2.0 Client ID (Web)
3. Authorized redirect: `https://yourdomain.com/api/auth/google/callback`

### Firebase Storage
1. [console.firebase.google.com](https://console.firebase.google.com) → Create project
2. Storage → Enable → Project Settings → Service Accounts → Generate key
3. Storage Rules: allow authenticated users to read/write their own files

### OpenAI
1. [platform.openai.com](https://platform.openai.com) → API Keys → Create key
2. Recommended model: `gpt-4o` (best balance of speed + quality)

### Gmail SMTP (for emails)
1. Google Account → Security → 2-Step Verification → App Passwords
2. Generate password for "Mail" → use as `SMTP_PASS`

---

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │    Nginx    │  ← SSL termination, rate limiting
                    │  (reverse   │  ← WebSocket upgrade for Socket.IO
                    │   proxy)    │  ← Static asset caching
                    └──┬──────┬───┘
               /api/*  │      │  /socket.io/*  + /
        ┌──────▼───┐   │   ┌──▼────────┐
        │ Backend  │   │   │ Frontend  │
        │ Express  │   │   │  Nginx    │  ← Serves React build
        │ +Socket  │   │   │  (static) │
        └─┬─┬─┬─┬─┘   │   └───────────┘
          │ │ │ │
    ┌─────┘ │ │ └────────────────┐
    │  ┌────┘ └────┐             │
    ▼  ▼           ▼             ▼
  ┌──┐ ┌──┐    ┌──────┐    ┌─────────┐
  │PG│ │MG│    │Redis │    │Firebase │
  │DB│ │DB│    │Cache │    │Storage  │
  └──┘ └──┘    └──────┘    └─────────┘
PostgreSQL  MongoDB   Redis      Firebase
(main data) (chat+AI) (JWT/cache) (files)
```

---

## 📡 Complete API Reference

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Email/password registration |
| POST | `/login` | Login → returns JWT + refresh |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Blacklist token in Redis |
| GET  | `/me` | Get current user with stats |
| GET  | `/google` | Google OAuth redirect |
| GET  | `/google/callback` | OAuth callback → redirect with tokens |
| GET  | `/verify/:token` | Verify email address |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Apply new password |

### Users (`/api/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/profile` | Full profile with all counts |
| PATCH | `/profile` | Update name, grade, school, language, bio |
| POST | `/avatar` | Upload + compress avatar → Firebase |
| POST | `/change-password` | Verify old + set new |
| POST | `/pomodoro` | Record completed Pomodoro session |
| GET  | `/progress` | Subject progress breakdown |
| GET  | `/stats` | Aggregate dashboard stats |

### Planner (`/api/planner`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | List sessions (filter: start, end, subject, status) |
| POST | `/` | Create session (auto-calculates duration) |
| PATCH | `/:id` | Update status → triggers XP + achievement check |
| DELETE | `/:id` | Remove session |

### Files (`/api/files`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | List files (filter: subject, tag, search) |
| POST | `/` | Upload → Firebase (multipart/form-data, max 200MB) |
| GET  | `/:id` | Get single file |
| PATCH | `/:id` | Update tags/subject/description |
| DELETE | `/:id` | Delete file + Firebase object |
| GET  | `/:id/extract` | Extract text from PDF (for AI) |

### AI (`/api/ai`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | GPT-4o conversation with memory |
| GET  | `/conversations` | List AI conversation history |
| GET  | `/conversations/:id` | Get full conversation |
| DELETE | `/conversations/:id` | Delete conversation |
| POST | `/summarize` | Summarize PDF by fileId (cached 2h) |
| POST | `/quiz` | Generate MCQ quiz (JSON format, optional fileId) |
| POST | `/quiz/submit` | Record quiz result + award XP |
| POST | `/study-plan` | AI-optimized study schedule |
| POST | `/ask-file` | Q&A from specific uploaded file |

### Notes (`/api/notes`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | List (filter: subject, search, pinned) |
| POST | `/` | Create (auto word count) |
| GET  | `/:id` | Get single note |
| PUT  | `/:id` | Update (auto word count update) |
| DELETE | `/:id` | Remove |

### Board (`/api/board`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | List posts (filter: subject, sort: newest/popular) |
| POST | `/` | Create post (requires owned file) |
| POST | `/:id/like` | Toggle like (XP to author) |
| POST | `/:id/save` | Toggle save |
| DELETE | `/:id` | Remove own post |

### Chat (`/api/chat`)
| Method | Path | Description |
|--------|------|-------------|
| GET  | `/rooms` | List all chat room subjects |
| GET  | `/:subject/messages` | Message history (paginated) |

### Real-time (Socket.IO)
| Event (client→server) | Payload | Description |
|----------------------|---------|-------------|
| `join_room` | `{ subject }` | Join subject chat room |
| `leave_room` | `{ subject }` | Leave room |
| `send_message` | `{ subject, content, type? }` | Send message |
| `react_message` | `{ messageId, emoji }` | React to message |
| `typing` | `{ subject, isTyping }` | Typing indicator |

| Event (server→client) | Description |
|----------------------|-------------|
| `new_message` | New message in joined room |
| `user_joined/left` | Room membership change |
| `user_typing` | Typing indicator |
| `notification` | Push notification |
| `level_up` | XP level up event |
| `achievement` | Achievement unlocked |

---

## 🛡️ Security

- JWT access tokens (7d) + refresh tokens (30d) with Redis blacklisting on logout
- bcrypt password hashing (12 rounds)
- Google OAuth 2.0 upsert (no password stored for OAuth users)
- Rate limiting: 60 req/min general, 10 req/min auth, 5 req/min uploads, 10 req/min AI
- File type whitelist (PDF, JPEG, PNG, GIF, WEBP) + 200 MB size limit
- Helmet.js security headers
- CORS restricted to `CLIENT_URL` only
- Parameterized SQL queries (no injection risk)
- Nginx: TLS 1.2/1.3 only, HSTS, X-Frame-Options, X-Content-Type-Options
- Non-root Docker user in production
- UFW firewall + Fail2ban on VPS

---

## 🏆 Gamification System

**20 achievements across 10 categories:**
- 📖 Study (first session, 10 sessions, 50 sessions)
- 🔥 Streak (3 days, 7 days, 30 days)
- 📁 Files (first upload, 10 uploads)
- 🧠 Quiz (first quiz, perfect score, 10 quizzes)
- 📋 Community (first board post, 100 likes received)
- ⏱️ Focus (10 pomodoros, 50 pomodoros)
- 🤖 AI (first AI chat)
- ✏️ Notes (first note, 20 notes)
- ⭐ Level (level 10, 20, 50)

**XP System:** Every action awards XP — session complete (+50), chat message (+5), AI chat (+5), Pomodoro (+25), board post liked (+5), quiz score (score% × 10)

**Level formula:** `level × 200 XP` per level (Level 1→2: 200 XP, Level 10→11: 2000 XP)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Framer Motion, TanStack Query, Zustand |
| Styling | CSS Variables (design tokens), RTL support (Arabic) |
| Real-time | Socket.IO (WebSocket + fallback polling) |
| Backend | Node.js 20, Express 4, Passport.js |
| Primary DB | PostgreSQL 16 (users, sessions, files, notes, board, achievements) |
| Chat/AI DB | MongoDB 7 (messages, AI conversation history) |
| Cache | Redis 7 (JWT blacklist, API response cache) |
| File Storage | Firebase Storage (images, PDFs up to 200MB) |
| AI | OpenAI GPT-4o (chat, quiz, summary, study plan) |
| Email | Nodemailer + SMTP (verification, reset, reminders) |
| Proxy | Nginx (SSL, WebSocket, rate limiting, SPA routing) |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions (test → build → push → SSH deploy) |
=======
# New-njah1
your-github-pat-here
>>>>>>> dcccd644fbeadd1f5a15f4d8ff3c7435fc0de5a7
#   N e w - n j a h 
 
 
