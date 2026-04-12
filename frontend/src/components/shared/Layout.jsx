// src/components/shared/Layout.jsx — Professional v3 with SVG icon set
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUIStore, useNotifStore } from '../../context/store';
import { useTranslation, useSocket } from '../../hooks/index';
import { authAPI } from '../../api/index';
import { Avatar } from './UI';
import toast from 'react-hot-toast';

/* ── SVG Icon set (no emoji dependency) ─────────────────── */
const Icons = {
  dashboard:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  ai:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/></svg>,
  analytics:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  planner:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  notes:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  files:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  focus:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  exam:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  quizHistory:() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M3.05 11a9 9 0 1 1 .5 4.5"/></svg>,
  chat:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  messages:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  board:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  achievements:()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  notifications:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  profile:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  groups:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  tools:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  logout:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  sun:        () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:       () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  search:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  chevron:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  menu:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

/* ── Nav config ──────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { key:'dashboard',     path:'/',             Icon: Icons.dashboard,    label:'Dashboard' },
      { key:'ai',            path:'/ai',           Icon: Icons.ai,           label:'AI Assistant' },
      { key:'analytics',     path:'/analytics',    Icon: Icons.analytics,    label:'Analytics' },
    ],
  },
  {
    label: 'Study',
    items: [
      { key:'planner',       path:'/planner',      Icon: Icons.planner,      label:'Planner' },
      { key:'notes',         path:'/notes',        Icon: Icons.notes,        label:'Notes' },
      { key:'files',         path:'/files',        Icon: Icons.files,        label:'Files' },
      { key:'focus',         path:'/focus',        Icon: Icons.focus,        label:'Focus Timer' },
      { key:'exam',          path:'/exam',         Icon: Icons.exam,         label:'Exam Mode' },
      { key:'quiz-history',  path:'/quiz-history', Icon: Icons.quizHistory,  label:'Quiz History' },
      { key:'tools',         path:'/tools',        Icon: Icons.tools,        label:'Study Tools' },
    ],
  },
  {
    label: 'Community',
    items: [
      { key:'groups',        path:'/groups',       Icon: Icons.groups,       label:'Groups' },
      { key:'chat',          path:'/chat',         Icon: Icons.chat,         label:'Group Chat' },
      { key:'private_chat',  path:'/chat/private', Icon: Icons.messages,     label:'Messages', badge: true },
      { key:'board',         path:'/board',        Icon: Icons.board,        label:'Board' },
      { key:'achievements',  path:'/achievements', Icon: Icons.achievements, label:'Achievements' },
      { key:'notifications', path:'/notifications',Icon: Icons.notifications,label:'Notifications', badge: true },
    ],
  },
];

const TEACHER_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { key:'dashboard',     path:'/',             Icon: Icons.dashboard,    label:'Dashboard' },
      { key:'analytics',     path:'/analytics',    Icon: Icons.analytics,    label:'Analytics' },
    ],
  },
  {
    label: 'Class Tools',
    items: [
      { key:'groups',        path:'/groups',       Icon: Icons.groups,       label:'My Classes' },
      { key:'files',         path:'/files',        Icon: Icons.files,        label:'Resources' },
      { key:'notes',         path:'/notes',        Icon: Icons.notes,        label:'Notes' },
      { key:'tools',         path:'/tools',        Icon: Icons.tools,        label:'Study Tools' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key:'chat',          path:'/chat',         Icon: Icons.chat,         label:'Group Chat' },
      { key:'private_chat',  path:'/chat/private', Icon: Icons.messages,     label:'Messages', badge: true },
      { key:'notifications', path:'/notifications',Icon: Icons.notifications,label:'Notifications', badge: true },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

/* ── Logo Mark ───────────────────────────────────────────── */
function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#logo-g)"/>
      <path d="M10 26 L18 10 L26 26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 21 L23 21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="18" cy="10" r="2" fill="#fff"/>
    </svg>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */
export function Sidebar({ open, onToggle }) {
  const location        = useLocation();
  const navigate        = useNavigate();
  const { unreadCount } = useNotifStore();
  const { user }        = useAuthStore();
  const isTeacher       = user?.role === 'teacher';
  const sections        = isTeacher ? TEACHER_SECTIONS : NAV_SECTIONS;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && window.innerWidth < 1100 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onToggle}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(3,3,8,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 148,
            }}
          />
        )}
      </AnimatePresence>

      <motion.nav
        animate={{ width: open ? 268 : 72 }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className="main-sidebar"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
        }}
      >
        {/* ── Logo / Toggle ───────────────────────────────── */}
        <div style={{
          height: 68,
          display: 'flex',
          alignItems: 'center',
          padding: open ? '0 16px' : '0',
          justifyContent: open ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <motion.div
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <LogoMark size={36} />
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
                >
                  <span style={{
                    fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 19,
                    letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1,
                  }}>Najah</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em' }}>
                    SMART LEARNING
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          {open && (
            <button
              onClick={onToggle}
              style={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <Icons.close />
            </button>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px 8px' }}>
          {sections.map((section, sIdx) => (
            <div key={section.label} style={{ marginBottom: 6 }}>
              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: sIdx * 0.03 } }} exit={{ opacity: 0 }}
                    style={{
                      fontSize: 9.5, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: 'var(--text3)',
                      padding: '10px 12px 5px',
                    }}
                  >
                    {section.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {section.items.map(item => {
                const active   = location.pathname === item.path ||
                                 (item.path !== '/' && location.pathname.startsWith(item.path));
                const hasBadge = item.badge && unreadCount > 0;

                return (
                  <motion.div
                    key={item.key}
                    onClick={() => { navigate(item.path); if (open && window.innerWidth < 1100) onToggle(); }}
                    whileHover={{ x: active ? 0 : 2 }}
                    whileTap={{ scale: 0.97 }}
                    data-tip={!open ? item.label : undefined}
                    style={{
                      height: 42,
                      borderRadius: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: open ? '0 12px' : '0',
                      justifyContent: open ? 'flex-start' : 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      marginBottom: 2,
                      background: active
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(124,58,237,0.08))'
                        : 'transparent',
                      color: active ? 'var(--primary-light)' : 'var(--text3)',
                      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.18s var(--ease)',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--surface)';
                        e.currentTarget.style.color = 'var(--text2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text3)';
                      }
                    }}
                  >
                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="nav-active-dot"
                        style={{
                          position: 'absolute',
                          left: -1,
                          width: 3,
                          height: 22,
                          borderRadius: 4,
                          background: 'linear-gradient(180deg, var(--primary-light), var(--accent-cyan))',
                          boxShadow: '0 0 10px rgba(124,58,237,0.6)',
                        }}
                      />
                    )}

                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      width: 22, color: 'inherit',
                    }}>
                      <item.Icon />
                    </span>

                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: 0.04 } }}
                          exit={{ opacity: 0, x: -6, transition: { duration: 0.1 } }}
                          style={{
                            fontSize: 13.5, fontWeight: active ? 700 : 500,
                            whiteSpace: 'nowrap', flex: 1, color: 'inherit',
                          }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {hasBadge && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          position: open ? 'static' : 'absolute',
                          top: open ? 'auto' : 7, right: open ? 'auto' : 7,
                          minWidth: 17, height: 17, borderRadius: 99,
                          padding: '0 4px',
                          background: 'linear-gradient(135deg, #EF4444, #F43F5E)',
                          color: '#fff', fontSize: 9, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Bottom user strip ────────────────────────────── */}
        <SidebarUserStrip open={open} />
      </motion.nav>
    </>
  );
}

function SidebarUserStrip({ open }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';
  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: open ? '14px 12px' : '14px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      transition: 'background 0.18s',
    }}
    onClick={() => navigate('/profile')}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Avatar src={user?.avatar_url} name={user?.name} size={34} />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ flex: 1, minWidth: 0 }}
          >
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
              <span style={{
                fontSize: 9.5, fontWeight: 800, padding:'1px 7px', borderRadius:6,
                background: isTeacher ? 'rgba(14,165,233,0.14)' : 'rgba(124,58,237,0.12)',
                color: isTeacher ? '#38BDF8' : 'var(--primary-light)',
                border: `1px solid ${isTeacher ? 'rgba(14,165,233,0.28)' : 'rgba(124,58,237,0.22)'}`,
                textTransform:'uppercase', letterSpacing:'0.08em',
              }}>
                {isTeacher ? '👨‍🏫 Teacher' : '🎓 Student'}
              </span>
              {!isTeacher && (
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>Lvl {user?.level || 1}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Header ───────────────────────────────────────────────── */
export function Header({ sidebarOpen, onToggle }) {
  const { user, logout }                           = useAuthStore();
  const { language, setLanguage, toggleDark, darkMode } = useUIStore();
  const { unreadCount }                            = useNotifStore();
  const navigate                                   = useNavigate();
  const location                                   = useLocation();
  const [profileOpen, setProfileOpen]              = useState(false);
  const profileRef                                 = useRef(null);

  const currentNav = ALL_NAV.find(n =>
    n.path !== '/' ? location.pathname.startsWith(n.path) : location.pathname === n.path
  );
  const pageLabel = currentNav?.label || 'Dashboard';

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout(); navigate('/login');
    toast.success('Signed out. See you soon! 👋');
  };

  useEffect(() => {
    const close = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  return (
    <header style={{
      height: 68,
      background: 'var(--glass)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px 0 16px',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* Menu toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        style={{
          width: 38, height: 38,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text2)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        <Icons.menu />
      </motion.button>

      {/* Page label + breadcrumb */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: 16.5, fontWeight: 700,
          fontFamily: 'var(--font-head)',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {pageLabel}
        </h1>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Search (decorative; global search is via CommandPalette) */}
        <HeaderBtn title="Search (⌘K)" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
          <Icons.search />
        </HeaderBtn>

        {/* Dark / Light */}
        <HeaderBtn title={darkMode ? 'Light mode' : 'Dark mode'} onClick={toggleDark}>
          {darkMode ? <Icons.sun /> : <Icons.moon />}
        </HeaderBtn>

        {/* Language */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          title="Switch language"
          style={{
            padding: '0 10px', height: 38, borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            cursor: 'pointer', fontSize: 11, fontWeight: 700,
            color: 'var(--text2)',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s',
          }}
        >
          {language === 'ar' ? '🇬🇧 EN' : '🇪🇬 AR'}
        </motion.button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <HeaderBtn onClick={() => navigate('/notifications')} title="Notifications">
            <Icons.notifications />
          </HeaderBtn>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: 5, right: 5,
                width: 15, height: 15, borderRadius: 99,
                background: 'linear-gradient(135deg, #EF4444, #F43F5E)',
                color: '#fff', fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239,68,68,0.6)',
                border: '1.5px solid var(--ink)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <motion.div
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setProfileOpen(v => !v)}
            style={{
              cursor: 'pointer', borderRadius: '50%', padding: 2,
              border: `2px solid ${profileOpen ? 'var(--primary)' : 'transparent'}`,
              background: profileOpen ? 'rgba(124,58,237,0.15)' : 'transparent',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <Avatar src={user?.avatar_url} name={user?.name} size={36} />
          </motion.div>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  position: 'absolute', top: 50, right: 0, width: 256,
                  background: 'var(--surface3)',
                  border: '1px solid var(--border2)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  borderRadius: 18, padding: 8,
                  zIndex: 300,
                  boxShadow: 'var(--shadow-lg), var(--glow)',
                }}
              >
                {/* User header */}
                <div style={{
                  padding: '12px 14px 14px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar src={user?.avatar_url} name={user?.name} size={42} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(124,58,237,0.12)', color: 'var(--primary-light)', border: '1px solid rgba(124,58,237,0.22)' }}>
                      Lv {user?.level || 1}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.22)' }}>
                      ★ {(user?.xp_points || 0).toLocaleString()} XP
                    </span>
                    {user?.streak_days > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                        🔥 {user?.streak_days}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { Icon: Icons.profile,  label: 'Profile',   path: '/profile' },
                  { Icon: Icons.settings, label: 'Settings',  path: '/settings' },
                  { Icon: Icons.analytics,label: 'Analytics', path: '/analytics' },
                ].map(item => (
                  <ProfileMenuItem key={item.path} Icon={item.Icon} label={item.label}
                    onClick={() => { navigate(item.path); setProfileOpen(false); }} />
                ))}

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', width: '100%', padding: '9px 12px',
                      borderRadius: 10, gap: 10, alignItems: 'center',
                      background: 'none', border: 'none',
                      color: 'var(--danger)', fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icons.logout /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/* ── Micro components ─────────────────────────────────────── */
function HeaderBtn({ children, onClick, title }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      onClick={onClick} title={title}
      style={{
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text2)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
    >
      {children}
    </motion.button>
  );
}

function ProfileMenuItem({ Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', width: '100%', padding: '9px 12px',
        textAlign: 'left', background: 'none', border: 'none',
        color: 'var(--text2)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', borderRadius: 10, gap: 10, alignItems: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text2)'; }}
    >
      <Icon /> {label}
    </button>
  );
}

/* ── AppShell ─────────────────────────────────────────────── */
export function AppShell({ children }) {
  const [open, setOpen] = useState(window.innerWidth >= 1100);
  useSocket();

  useEffect(() => {
    const handle = () => {
      if (window.innerWidth < 1100) setOpen(false);
      else setOpen(true);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar open={open} onToggle={() => setOpen(v => !v)} />
      <div className="main-content">
        <Header sidebarOpen={open} onToggle={() => setOpen(v => !v)} />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
}
