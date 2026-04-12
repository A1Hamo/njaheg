// src/App.jsx  — FIXED VERSION
// Changes: ErrorBoundary wrapping, correct lazy imports, no double socket init,
// proper light/dark sync, RTL/LTR sync, 404 page
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useUIStore } from './context/store';
import { AppShell } from './components/shared/Layout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { Spinner } from './components/shared/UI';
import { CommandPalette } from './components/shared/CommandPalette';
import './styles/global.css';

// ── Lazy load all pages (code splitting) ────────────────
const LoginPage          = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage       = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage  = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.ResetPasswordPage })));
const AuthCallback       = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.AuthCallback })));
const Dashboard          = lazy(() => import('./components/dashboard/Dashboard'));
const PlannerPage        = lazy(() => import('./components/planner/PlannerPage'));
const FilesPage          = lazy(() => import('./components/files/FilesPage'));
const NotesPage          = lazy(() => import('./components/notes/NotesPage'));
const BoardPage          = lazy(() => import('./components/board/BoardPage'));
const ChatPage           = lazy(() => import('./components/chat/ChatPage'));
const AIAssistant        = lazy(() => import('./components/ai/AIAssistant'));
const FocusPage          = lazy(() => import('./components/focus/FocusPage'));
const AchievementsPage   = lazy(() => import('./components/achievements/AchievementsPage'));
const NotificationsPage  = lazy(() => import('./components/notifications/NotificationsPage'));
const AnalyticsPage      = lazy(() => import('./components/analytics/AnalyticsPage'));
const ProfilePage        = lazy(() => import('./components/profile/ProfilePage'));
const SettingsPage       = lazy(() => import('./components/settings/SettingsPage'));
const ExamPage           = lazy(() => import('./components/exam/ExamPage'));
const PrivateChat        = lazy(() => import('./components/chat/PrivateChat'));
const QuizHistoryPage    = lazy(() => import('./components/quiz/QuizHistoryPage'));
const GroupsPage         = lazy(() => import('./components/groups/GroupsPage'));
const GroupDetailPage    = lazy(() => import('./components/groups/GroupDetailPage'));
const StudyTools         = lazy(() => import('./components/tools/StudyTools'));


// ── QueryClient ─────────────────────────────────────────
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,       // 5 min
      gcTime:    10 * 60 * 1000,       // 10 min
      refetchOnWindowFocus: false,
    },
  },
});

// ── Full-page loader ─────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', gap: 24,
    }}>
      <div style={{ fontSize: 48, animation: 'ambient-drift 3s ease-in-out infinite alternate' }}>🎓</div>
      <Spinner size="lg" />
    </div>
  );
}

// ── Protected route ──────────────────────────────────────
function Protected({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    // AppShell already calls useSocket() internally
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

// ── Public route (redirect if already logged in) ─────────
function Public({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Theme + language sync + Service Worker Clear ────────
function GlobalSync() {
  const { darkMode, language } = useUIStore();
  
  useEffect(() => {
    // Clear potentially corrupted Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let r of regs) r.unregister();
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('dir',  language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [darkMode, language]);
  return null;
}

// ── 404 page ─────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 64px' }}>
        <div style={{ fontSize: 64, marginBottom: 24, textShadow: 'var(--glow)' }}>🔍</div>
        <h2 className="neon-text" style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 12 }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: 15, marginBottom: 32 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" style={{
          padding: '12px 28px', background: 'var(--primary)', color: '#fff',
          borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          display: 'inline-block', transition: 'all 0.3s ease', boxShadow: 'var(--glow-intense)'
        }}>← Back to Dashboard</a>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <GlobalSync />
          <CommandPalette />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--surface3)',
                color: 'var(--text)',
                border: '1px solid var(--border2)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                boxShadow: 'var(--shadow)',
                backdropFilter: 'var(--glass-blur)',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* ── Public ── */}
            <Route path="/login"            element={<Public><LoginPage /></Public>} />
            <Route path="/register"         element={<Public><RegisterPage /></Public>} />
            <Route path="/forgot-password"        element={<Public><ForgotPasswordPage /></Public>} />
            <Route path="/reset-password/:token"  element={<Public><ResetPasswordPage /></Public>} />
            <Route path="/auth/callback"          element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />

            {/* ── Protected ── */}
            <Route path="/"                 element={<Protected><Dashboard /></Protected>} />
            <Route path="/planner"          element={<Protected><PlannerPage /></Protected>} />
            <Route path="/files"            element={<Protected><FilesPage /></Protected>} />
            <Route path="/notes"            element={<Protected><NotesPage /></Protected>} />
            <Route path="/board"            element={<Protected><BoardPage /></Protected>} />
            <Route path="/chat"             element={<Protected><ChatPage /></Protected>} />
            <Route path="/chat/private"     element={<Protected><PrivateChat /></Protected>} />
            <Route path="/ai"               element={<Protected><AIAssistant /></Protected>} />
            <Route path="/focus"            element={<Protected><FocusPage /></Protected>} />
            <Route path="/achievements"     element={<Protected><AchievementsPage /></Protected>} />
            <Route path="/notifications"    element={<Protected><NotificationsPage /></Protected>} />
            <Route path="/analytics"        element={<Protected><AnalyticsPage /></Protected>} />
            <Route path="/profile"          element={<Protected><ProfilePage /></Protected>} />
            <Route path="/settings"         element={<Protected><SettingsPage /></Protected>} />

            <Route path="/exam"            element={<Protected><ExamPage /></Protected>} />
            <Route path="/quiz-history"    element={<Protected><QuizHistoryPage /></Protected>} />
            <Route path="/groups"          element={<Protected><GroupsPage /></Protected>} />
            <Route path="/groups/:id"      element={<Protected><GroupDetailPage /></Protected>} />
            <Route path="/tools"           element={<Protected><StudyTools /></Protected>} />


            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
