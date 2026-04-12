// src/App.jsx — Najah v5 — Landing + Onboarding + full routes
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

// ── Lazy load all pages ──────────────────────────────────────
const LandingPage       = lazy(() => import('./components/landing/LandingPage'));
const LoginPage         = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.LoginPage })));
const RegisterPage      = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage= lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.ResetPasswordPage })));
const AuthCallback      = lazy(() => import('./components/auth/AuthPages').then(m => ({ default: m.AuthCallback })));
const Dashboard         = lazy(() => import('./components/dashboard/Dashboard'));
const PlannerPage       = lazy(() => import('./components/planner/PlannerPage'));
const FilesPage         = lazy(() => import('./components/files/FilesPage'));
const NotesPage         = lazy(() => import('./components/notes/NotesPage'));
const BoardPage         = lazy(() => import('./components/board/BoardPage'));
const ChatPage          = lazy(() => import('./components/chat/ChatPage'));
const AIAssistant       = lazy(() => import('./components/ai/AIAssistant'));
const FocusPage         = lazy(() => import('./components/focus/FocusPage'));
const AchievementsPage  = lazy(() => import('./components/achievements/AchievementsPage'));
const NotificationsPage = lazy(() => import('./components/notifications/NotificationsPage'));
const AnalyticsPage     = lazy(() => import('./components/analytics/AnalyticsPage'));
const ProfilePage       = lazy(() => import('./components/profile/ProfilePage'));
const SettingsPage      = lazy(() => import('./components/settings/SettingsPage'));
const ExamPage          = lazy(() => import('./components/exam/ExamPage'));
const PrivateChat       = lazy(() => import('./components/chat/PrivateChat'));
const QuizHistoryPage   = lazy(() => import('./components/quiz/QuizHistoryPage'));
const GroupsPage        = lazy(() => import('./components/groups/GroupsPage'));
const GroupDetailPage   = lazy(() => import('./components/groups/GroupDetailPage'));
const StudyTools        = lazy(() => import('./components/tools/StudyTools'));

// ── QueryClient ─────────────────────────────────────────────
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Full-page loader ─────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink)', gap: 20,
    }}>
      <div style={{ fontSize: 44 }}>🎓</div>
      <Spinner size="lg" />
      <p style={{ fontSize: 13, color: 'var(--text3)' }}>Loading Najah…</p>
    </div>
  );
}

// ── Protected route ──────────────────────────────────────────
function Protected({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

// ── Public route (redirect if already logged in) ─────────────
function Public({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Theme + language sync ────────────────────────────────────
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

// ── 404 page ─────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--ink)',
    }}>
      <div style={{
        textAlign: 'center', padding: '48px 64px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'var(--glass-blur)',
      }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🔍</div>
        <h2 style={{
          fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-head)',
          marginBottom: 12, letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg,#fff 30%,var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: 15, marginBottom: 32, lineHeight: 1.65 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" style={{
          padding: '13px 32px', background: 'var(--grad-primary)', color: '#fff',
          borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
          display: 'inline-block', boxShadow: 'var(--glow-intense)',
          transition: 'all 0.3s var(--ease)',
        }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────
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
                borderRadius: 12,
                fontSize: 14,
                boxShadow: 'var(--shadow), var(--glow)',
                backdropFilter: 'var(--glass-blur)',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* ── Marketing ── */}
            <Route path="/welcome" element={
              <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>
            } />

            {/* ── Public (auth) ── */}
            <Route path="/login"                 element={<Public><LoginPage /></Public>} />
            <Route path="/register"              element={<Public><RegisterPage /></Public>} />
            <Route path="/forgot-password"       element={<Public><ForgotPasswordPage /></Public>} />
            <Route path="/reset-password/:token" element={<Public><ResetPasswordPage /></Public>} />
            <Route path="/auth/callback"         element={<Suspense fallback={<PageLoader />}><AuthCallback /></Suspense>} />

            {/* ── Protected ── */}
            <Route path="/"                element={<Protected><Dashboard /></Protected>} />
            <Route path="/planner"         element={<Protected><PlannerPage /></Protected>} />
            <Route path="/files"           element={<Protected><FilesPage /></Protected>} />
            <Route path="/notes"           element={<Protected><NotesPage /></Protected>} />
            <Route path="/board"           element={<Protected><BoardPage /></Protected>} />
            <Route path="/chat"            element={<Protected><ChatPage /></Protected>} />
            <Route path="/chat/private"    element={<Protected><PrivateChat /></Protected>} />
            <Route path="/ai"              element={<Protected><AIAssistant /></Protected>} />
            <Route path="/focus"           element={<Protected><FocusPage /></Protected>} />
            <Route path="/achievements"    element={<Protected><AchievementsPage /></Protected>} />
            <Route path="/notifications"   element={<Protected><NotificationsPage /></Protected>} />
            <Route path="/analytics"       element={<Protected><AnalyticsPage /></Protected>} />
            <Route path="/profile"         element={<Protected><ProfilePage /></Protected>} />
            <Route path="/settings"        element={<Protected><SettingsPage /></Protected>} />
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
