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
    const handleCustomEvent = () => setOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomEvent);
    };
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
            initial={{ opacity: 0, scale: 0.9, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            style={{
              width: 600, maxWidth: '94vw', 
              background: 'rgba(20, 20, 25, 0.75)',
              backdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 24,
              overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 24, color: 'var(--primary)', marginRight: 16, filter: 'drop-shadow(0 0 8px var(--primary))' }}>⚡</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="EXECUTIVE SEARCH..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 20, fontFamily: 'var(--font-head)',
                  fontWeight: 900, letterSpacing: '0.05em'
                }}
              />
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 8, fontWeight: 900, letterSpacing: '0.1em' }}>ESC</div>
            </div>
            
            <div style={{ maxHeight: 420, overflowY: 'auto', padding: 12, scrollbarWidth: 'none' }} className="scroll-y">
              {filtered.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700 }}>NO NEURAL MATCHES FOUND</div>
              ) : (
                filtered.map((cmd, idx) => {
                  const active = idx === selectedIndex;
                  return (
                    <motion.div
                      key={cmd.id}
                      onClick={() => { navigate(cmd.path); setOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '16px 20px',
                        cursor: 'pointer', borderRadius: 18,
                        background: active ? 'linear-gradient(90deg, var(--primary), rgba(124,58,237,0.6))' : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                        boxShadow: active ? '0 8px 20px rgba(124,58,237,0.3)' : 'none',
                        transition: 'all 0.22s var(--ease)',
                        marginBottom: 4
                      }}
                    >
                      <span style={{ fontSize: 24, marginRight: 20, filter: active ? 'drop-shadow(0 0 8px #fff)' : 'none' }}>{cmd.icon}</span>
                      <span style={{ fontSize: 16, fontWeight: 900, flex: 1, fontFamily: 'var(--font-head)', letterSpacing: '0.02em' }}>{cmd.title.toUpperCase()}</span>
                      {active && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          style={{ fontSize: 11, opacity: 0.9, fontWeight: 900, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>
                          ENTER ↵
                        </motion.span>
                      )}
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
