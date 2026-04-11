// src/components/shared/CommandPalette.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/index';

const COMMANDS = [
  { id: 'home', title: 'Go to Dashboard', path: '/', icon: '⊞' },
  { id: 'planner', title: 'Open Planner', path: '/planner', icon: '📅' },
  { id: 'files', title: 'My Files', path: '/files', icon: '📁' },
  { id: 'notes', title: 'Notes', path: '/notes', icon: '✏️' },
  { id: 'chat', title: 'Messages', path: '/chat', icon: '💬' },
  { id: 'ai', title: 'AI Assistant', path: '/ai', icon: '🤖' },
  { id: 'focus', title: 'Focus Timer', path: '/focus', icon: '⏱️' },
  { id: 'settings', title: 'Settings', path: '/settings', icon: '⚙️' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selectedIndex];
      if (cmd) {
        navigate(cmd.path);
        setOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(3, 3, 5, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              width: 560, maxWidth: '90vw', background: 'var(--surface2)',
              border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
              overflow: 'hidden', boxShadow: 'var(--shadow-lg), var(--glow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 20, color: 'var(--text3)', marginRight: 12 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search commands... (e.g. 'files')"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text)', fontSize: 18, fontFamily: 'var(--font-en)'
                }}
              />
              <div style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>ESC</div>
            </div>
            
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: 12 }} className="scroll-y">
              {filtered.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 15 }}>No commands found</div>
              ) : (
                filtered.map((cmd, idx) => {
                  const active = idx === selectedIndex;
                  return (
                    <motion.div
                      key={cmd.id}
                      onClick={() => { navigate(cmd.path); setOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '14px 16px',
                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                        background: active ? 'var(--primary)' : 'transparent',
                        color: active ? '#fff' : 'var(--text2)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: 20, marginRight: 16 }}>{cmd.icon}</span>
                      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{cmd.title}</span>
                      {active && <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>↵ Enter</span>}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
