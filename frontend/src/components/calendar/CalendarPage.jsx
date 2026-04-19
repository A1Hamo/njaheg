import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../shared/UI';

const MOCK_SESSIONS = [
  { id: 's1', title: 'Calculus Review', date: '2026-04-14', time: '14:00', duration: 60, type: 'live', group: 'Advanced Calculus' },
  { id: 's2', title: 'Chem Lab Q&A', date: '2026-04-16', time: '16:00', duration: 45, type: 'office_hours', group: 'Chemistry Basics' },
  { id: 's3', title: 'Exam Prep Session', date: '2026-04-18', time: '10:00', duration: 90, type: 'live', group: 'Math 101' },
];

export default function CalendarPage() {
  const [view, setView] = useState('Month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Basic date iteration for a dummy month view
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Calendar & Sessions</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Schedule live video sessions, office hours, and group events.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', background: 'var(--ink2)', borderRadius: 10, padding: 4 }}>
            {['Month', 'Week'].map(v => (
              <button key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: view === v ? 'var(--surface)' : 'transparent',
                  color: view === v ? 'var(--text)' : 'var(--text3)',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s', border: 'none', cursor: 'pointer'
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsModalOpen(true)}>+ Schedule Session</Button>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border2)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ background: 'var(--surface2)', padding: '12px 16px', fontSize: 12, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', textAlign: 'center' }}>
              {day}
            </div>
          ))}
          
          {/* Empty padding for the start of the month dummy layout */}
          {Array.from({ length: 3 }).map((_, i) => <div key={`empty-${i}`} style={{ background: 'var(--surface)' }} />)}
          
          {daysInMonth.map(day => {
            // Find mockup sessions for this day
            const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
            const daySessions = MOCK_SESSIONS.filter(s => s.date === dateStr);

            return (
              <div 
                key={day} 
                onClick={() => setIsModalOpen(true)}
                style={{ 
                  background: 'var(--surface)', minHeight: 120, padding: 12, cursor: 'pointer',
                  border: '1px solid transparent', transition: 'border 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {daySessions.map(session => (
                    <div key={session.id} style={{ 
                      fontSize: 11, fontWeight: 700, padding: '6px 8px', borderRadius: 6,
                      background: session.type === 'live' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: session.type === 'live' ? 'var(--primary-700)' : 'var(--warning)',
                      borderLeft: `2px solid ${session.type === 'live' ? 'var(--primary-500)' : 'var(--warning)'}`,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      <span style={{ opacity: 0.6, marginRight: 4 }}>{session.time}</span>
                      {session.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Schedule Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel"
              style={{ position: 'relative', width: '100%', maxWidth: 500, padding: 32 }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: 'var(--text)' }}>Schedule Remote Session</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>Session Title</label>
                  <input type="text" placeholder="e.g. Midterm Q&A" />
                </div>
                
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>Date</label>
                    <input type="date" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>Time</label>
                    <input type="time" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>Target Group</label>
                  <select>
                    <option>Select Group/Class</option>
                    <option>Chemistry Basics</option>
                    <option>Advanced Calculus</option>
                    <option>Math 101</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>Session Platform</label>
                  <select>
                    <option>Built-in Najah Livecast</option>
                    <option>Google Meet (Auto-generate)</option>
                    <option>Zoom Link (Manual entry)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsModalOpen(false)}>Schedule Session</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
