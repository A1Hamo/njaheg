// src/components/shared/ConnectionStatus.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const goOnline  = () => { setOnline(true);  setShowBanner(true); setTimeout(() => setShowBanner(false), 3000); };
    const goOffline = () => { setOnline(false); setShowBanner(true); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            padding: '10px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600,
            background: online ? 'var(--accent2)' : 'var(--danger)',
            color: '#fff',
          }}
        >
          {online ? '✅ Back online!' : '⚠️ No internet connection — some features may not work'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
