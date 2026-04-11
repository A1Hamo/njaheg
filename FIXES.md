# 🔧 Bug Fixes & New Features — Changelog

## 🐛 Critical Bugs Fixed

### 1. Circular Import in Layout.jsx
**Problem:** `import { useSocket }` was placed at the *bottom* of the file (line 220), after `export function AppShell`. ES modules are statically analysed — imports at the bottom can cause `undefined` references during initialisation.
**Fix:** Moved `useSocket` import to the top with all other imports.

### 2. Double `module.exports` in achievements.js
**Problem:** The file contained two routers — `achR` (achievements) and `quizR` (quiz history) — with **two separate `module.exports`** statements. Node.js only honours the first export; the quiz router was silently unreachable, meaning `/api/quiz/history` and `/api/quiz/stats` returned 404 for every request.
**Fix:** Moved quiz router to its own standalone `routes/quiz.js` file with a single `module.exports`.

### 3. Double `module.exports` in subjects.js
**Problem:** Same issue — stray analytics router code at the bottom with a second `module.exports`, overriding the subjects router.
**Fix:** Removed the stray analytics code (analytics has its own `routes/analytics.js`).

### 4. `Button` not exported from UI.jsx
**Problem:** `UI.jsx` exported `Btn` but **seven components** (`PlannerPage`, `FilesPage`, `NotesPage`, `AIAssistant`, `pages.jsx`, `board/BoardPage`, `focus/FocusPage`) all imported `Button`. This caused a **React render crash** on every one of those pages.
**Fix:** Added `export const Button = Btn` as an alias — both names now work.

### 5. `pages.jsx` — mid-file and bottom-level `import` statements
**Problem:** `pages.jsx` contained imports scattered at lines 162, 449, 450, 451, 538, 539 (mid-file and end-of-file). ES Module spec requires all `import` declarations at the top. Webpack/Babel may hoist these but they cause unpredictable issues and break fast-refresh.
**Fix:** The file was deleted entirely. All four components it contained (`BoardPage`, `FocusPage`, `AchievementsPage`, `NotificationsPage`) already had their own clean standalone files — `pages.jsx` was unreferenced dead code.

### 6. Dynamic `import()` inside async function in FilesPage.jsx
**Problem:** `await import('../../api/index').then(m => m.aiAPI.askFile(...))` created a new module reference on every call. While Webpack caches modules, this pattern bypasses tree-shaking and causes odd behaviour in StrictMode.
**Fix:** Changed to static `import { aiAPI } from '../../api/index'` at the top of the file.

### 7. `onSuccess` in `useQuery` (TanStack Query v5 breaking change)
**Problem:** TanStack Query v5 **removed** the `onSuccess` callback from `useQuery`. `NotificationsPage.jsx` was using it to sync the notification count to the Zustand store. This silently failed — the badge counter never updated.
**Fix:** Replaced with a `useEffect` that watches `data` and calls `setAll()` when it changes.

### 8. CORS blocked all development requests
**Problem:** `CORS_ORIGIN` was set to the single string `process.env.CLIENT_URL`. During development when `CLIENT_URL` is `undefined`, all API requests from `localhost:3000` were rejected with CORS errors.
**Fix:** Changed to a function-based origin validator that explicitly allows `localhost:3000`, `127.0.0.1:3000`, and the env value.

### 9. Google OAuth callback used undefined CLIENT_URL
**Problem:** `googleCallback` redirected to `${process.env.CLIENT_URL}/auth/callback` without a fallback. If `CLIENT_URL` was unset, the redirect went to `undefined/auth/callback`, breaking OAuth completely.
**Fix:** Added `|| 'http://localhost:3000'` fallback.

### 10. Missing `migrate.js` file
**Problem:** `package.json` declared `"migrate": "node src/config/migrate.js"` but the file didn't exist. Running `npm run migrate` crashed immediately.
**Fix:** Created `src/config/migrate.js` as a standalone migration runner.

### 11. No admin user in database seed
**Problem:** The admin panel required a user with `role: 'admin'`, but `seed.js` never created one. There was no way to log into the admin panel after a fresh install.
**Fix:** `seed.js` now auto-creates `admin@najah.eg` / `Admin@123456` if no admin user exists.

### 12. No `ErrorBoundary` component
**Problem:** Any unhandled JavaScript error in a page component caused the entire app to crash to a blank white screen with no user feedback.
**Fix:** Created `ErrorBoundary` (class component) and wrapped all protected routes.

### 13. No 404 page
**Problem:** `<Route path="*">` redirected to `/` instead of showing an error page, confusing users who typed a wrong URL.
**Fix:** Added a proper 404 page with a back-to-dashboard link.

### 14. `node-fetch` CommonJS/ESM incompatibility
**Problem:** `node-fetch` v3+ is ESM-only and can't be `require()`d in CommonJS backends. If v3 was installed, `aiController.js` and `filesController.js` would crash on startup.
**Fix:** Added a try/catch that falls back to `global.fetch` (Node 18+ built-in) if `require('node-fetch')` fails.

---

## ✨ New Features Added

### Exam Mode (`/exam`)
A full timed exam experience built on top of the AI quiz engine:
- **Setup screen**: Choose subject, topic, question count (5–20), difficulty, time limit (10–60 min)
- **Active exam**: SVG countdown timer ring that turns amber → red as time runs out. Question navigator grid showing answered/flagged/unanswered states. Flag questions for review. Auto-submit when timer hits zero.
- **Results screen**: Letter grade (A+/A/B/C/D), score percentage, correct/wrong/time-taken stats, and full answer review with explanations
- **Saves to profile**: Quiz results recorded to `quiz_attempts` table, XP awarded based on score

### Error Boundary
All protected routes wrapped in `<ErrorBoundary>` — React errors show a friendly "Something went wrong" page instead of a blank screen.

### 404 Page  
Unknown URLs now show a proper 404 page instead of silently redirecting to dashboard.

---

## 🚀 Getting Started (Fixed Quick Start)

```bash
# 1. Start databases (Docker)
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
cp .env.development .env
# Fill in OPENAI_API_KEY, GOOGLE_*, FIREBASE_* in .env
npm install
npm run dev       # → :5000, auto-migrates on start

# 3. Seed (first run only)
npm run seed      # Creates subjects + achievements + admin user

# 4. Frontend
cd ../frontend
cp .env.development .env
npm install
npm start         # → :3000

# Admin panel: open admin/index.html in browser
# Login: admin@najah.eg / Admin@123456
```

## 🔑 Required External Services (fill in .env)

| Service | Where to get it | Used for |
|---------|-----------------|----------|
| OpenAI API key | platform.openai.com | AI chat, quiz, summary, study plan |
| Google OAuth | console.cloud.google.com | Sign in with Google |
| Firebase project | console.firebase.google.com | File uploads (PDF/images) |
| Gmail App Password | Google Account → Security → App Passwords | Email verification, reminders |

**The app runs without these** (auth/files/AI features will show errors, everything else works).
