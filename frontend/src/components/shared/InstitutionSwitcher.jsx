import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../context/store';
import toast from 'react-hot-toast';

export default function InstitutionSwitcher() {
  const [open, setOpen] = React.useState(false);
  const { institutionMode, setInstitutionMode } = useUIStore();
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleSwitch = (m) => {
    setInstitutionMode(m);
    setOpen(false);
    toast.success(`Protocol: ${m.toUpperCase()} ACTIVATED`, {
      icon: m === 'school' ? '🏫' : '🎓',
      style: { 
        borderRadius: '16px', 
        background: 'var(--surface3)', 
        color: 'var(--text)',
        border: '1px solid var(--border)',
        fontWeight: 800,
        fontFamily: 'var(--font-head)',
        letterSpacing: '0.05em'
      }
    });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(124,58,237,0.2)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="floating-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          borderRadius: '14px',
          background: 'var(--glass)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          color: 'var(--text)',
          fontWeight: 800,
          fontFamily: 'var(--font-head)',
          fontSize: '12px',
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase'
        }}
      >
        <motion.div 
          animate={{ rotate: institutionMode === 'school' ? 0 : 360 }}
          style={{
            width: 24, height: 24, borderRadius: '8px',
            background: institutionMode === 'school' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(14, 165, 233, 0.2)',
            color: institutionMode === 'school' ? '#10b981' : '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
            boxShadow: `0 0 15px ${institutionMode === 'school' ? 'rgba(16,185,129,0.3)' : 'rgba(14,165,233,0.3)'}`
          }}
        >
          {institutionMode === 'school' ? '🏫' : '🎓'}
        </motion.div>
        <span className="hide-mobile">{institutionMode === 'school' ? 'School' : 'University'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'flex' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, scale: 0.92, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="floating-panel"
            style={{
              position: 'absolute',
              top: '100%',
              insetInlineEnd: 0,
              marginTop: '12px',
              padding: '10px',
              width: '240px',
              zIndex: 1000,
              boxShadow: 'var(--shadow-2xl), 0 0 40px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ padding: '6px 14px 10px', fontSize: '10px', fontWeight: 900, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>
                Identity Control
            </div>
            
            <SwitcherItem 
                active={institutionMode === 'school'} 
                onClick={() => handleSwitch('school')} 
                icon="🏫" 
                label="Academic (School)" 
                sub="K-12 Educational Track"
                color="rgba(16, 185, 129, 1)"
            />
            
            <SwitcherItem 
                active={institutionMode === 'university'} 
                onClick={() => handleSwitch('university')} 
                icon="🎓" 
                label="Advanced (University)" 
                sub="Higher Ed & Campus Life"
                color="rgba(14, 165, 233, 1)"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SwitcherItem({ active, onClick, icon, label, sub, color }) {
    return (
        <motion.button
            whileHover={{ x: 4, background: 'var(--surface2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                display: 'flex', width: '100%', textAlign: 'start', alignItems: 'center', gap: '14px',
                padding: '12px 14px', borderRadius: '14px', cursor: 'pointer',
                background: active ? `${color}15` : 'transparent',
                border: active ? `1px solid ${color}30` : '1px solid transparent',
                color: active ? color : 'var(--text)', 
                transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                marginBottom: 4
            }}
        >
            <span style={{ fontSize: 24, filter: active ? 'none' : 'grayscale(0.6) opacity(0.6)', transition: '0.2s' }}>{icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '-0.01em' }}>{label}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text4)', marginTop: 1 }}>{sub}</div>
            </div>
            {active && (
                <motion.div layoutId="switcher-active" style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: color }} />
            )}
        </motion.button>
    );
}
