// src/components/planner/PlannerPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { plannerAPI, aiAPI } from '../../api/index';
import { Card, Button, Input, Select, Modal, Tabs, ProgressBar, EmptyState, SectionHeader, Btn } from '../shared/UI';

const SUBJECTS = [
  { value: 'mathematics',   label: '📐 Mathematics',   color: '#6C63FF' },
  { value: 'science',       label: '🔬 Science',        color: '#0ECDA8' },
  { value: 'arabic',        label: '📚 Arabic',         color: '#F7B731' },
  { value: 'english',       label: '🌐 English',        color: '#38BDF8' },
  { value: 'social_studies',label: '🌍 Social Studies', color: '#FF5470' },
];

const STATUS_COLORS = {
  planned:     { bg: 'rgba(108,99,255,0.12)', color: '#9D96FF', label: 'Planned' },
  in_progress: { bg: 'rgba(247,183,49,0.12)', color: '#F7B731', label: 'In Progress' },
  completed:   { bg: 'rgba(14,205,168,0.12)', color: '#0ECDA8', label: 'Completed' },
  skipped:     { bg: 'rgba(255,84,112,0.12)', color: '#FF5470', label: 'Skipped' },
};

// ── Add Session Modal ──
function AddSessionModal({ open, onClose, onSaved }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { subject: 'mathematics', topic: '', start_time: '', end_time: '', notes: '' }
  });

  const onSubmit = async (data) => {
    await plannerAPI.createSession(data);
    toast.success('✅ Session added!');
    reset();
    onSaved();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="📅 Add Study Session">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Select label="Subject" {...register('subject', { required: true })}>
          {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Input label="Topic (optional)" placeholder="e.g. Chapter 3 — Fractions" {...register('topic')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Start Time" type="datetime-local" error={errors.start_time?.message}
            {...register('start_time', { required: 'Start time required' })} />
          <Input label="End Time" type="datetime-local" error={errors.end_time?.message}
            {...register('end_time', { required: 'End time required' })} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Notes</label>
          <textarea {...register('notes')} placeholder="Any notes or goals for this session..."
            style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 8,
              minHeight: 80, resize: 'vertical', border: '1px solid var(--border2)',
              background: 'var(--surface)', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>Add Session →</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Weekly View ──
function WeeklyView({ sessions, onStatusChange, onDelete }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayHasSessions = (day) =>
    sessions.some(s => isSameDay(parseISO(s.start_time), day));

  const selectedSessions = sessions.filter(s =>
    isSameDay(parseISO(s.start_time), selectedDay)
  ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button size="sm" onClick={() => setWeekStart(d => addDays(d, -7))}>← Prev</Button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <Button size="sm" onClick={() => setWeekStart(d => addDays(d, 7))}>Next →</Button>
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 20 }}>
        {days.map(day => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDay);
          const hasSessions = dayHasSessions(day);

          return (
            <motion.div key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 6px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                border: '1px solid',
                background: isSelected 
                  ? 'linear-gradient(135deg, var(--primary), var(--brand-600))' 
                  : isToday ? 'rgba(124,58,237,0.08)' : 'var(--surface2)',
                borderColor: isSelected ? 'transparent' : isToday ? 'var(--primary)' : 'var(--border)',
                boxShadow: isSelected ? '0 8px 16px rgba(124,58,237,0.3)' : 'none',
                transition: 'all 0.22s var(--ease)',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-head)',
                color: isSelected ? '#fff' : 'var(--text)' }}>{format(day, 'd')}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text4)',
                marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format(day, 'EEE')}</div>
              {hasSessions && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', margin: '6px auto 0',
                  background: isSelected ? '#fff' : 'var(--primary)', boxShadow: isSelected ? 'none' : '0 0 8px var(--primary)' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected day sessions */}
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
        {format(selectedDay, 'EEEE, MMMM d')}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text3)' }}>
          {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence>
        {selectedSessions.length === 0 ? (
          <EmptyState icon="📅" title="No sessions this day" subtitle="Click 'Add Session' to plan your study time" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedSessions.map(s => {
              const subj = SUBJECTS.find(x => x.value === s.subject);
              const st = STATUS_COLORS[s.status] || STATUS_COLORS.planned;
              return (
                <motion.div key={s.id} layout
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="floating-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                    borderRadius: 16,
                    borderLeft: `4px solid ${subj?.color || 'var(--primary)'}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, textTransform: 'capitalize' }}>
                      {s.subject.replace('_', ' ')}{s.topic ? ` — ${s.topic}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {format(parseISO(s.start_time), 'HH:mm')} – {format(parseISO(s.end_time), 'HH:mm')} · {s.duration}min
                    </div>
                    {s.notes && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.notes}</div>}
                  </div>

                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select
                      value={s.status}
                      onChange={e => onStatusChange(s.id, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8,
                        background: st.bg, color: st.color, border: `1px solid ${st.color}44`,
                        fontWeight: 600, cursor: 'pointer' }}
                    >
                      {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="danger" onClick={() => onDelete(s.id)}>🗑</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AI Schedule Tab ──
function AIScheduleTab() {
  const { register, handleSubmit } = useForm({
    defaultValues: { subject: 'mathematics', deadline: '', dailyHours: 2, currentLevel: 'intermediate' }
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await aiAPI.studyPlan({ ...data, language: 'en' });
      setPlan(res.data);
      toast.success('✨ AI study plan generated!');
    } catch { toast.error('Failed to generate plan'); }
    finally { setLoading(false); }
  };

  const applySessions = async () => {
    if (!plan) return;
    const sessions = [];
    for (const day of (plan.plan || [])) {
      for (const s of (day.sessions || [])) {
        if (s.type === 'rest') continue;
        const dateStr = day.date;
        const [h, m] = s.time.split(':');
        const start = new Date(`${dateStr}T${h}:${m}:00`);
        const end = new Date(start.getTime() + s.duration * 60000);
        sessions.push({
          subject: plan.subject,
          topic: s.topic,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: s.goal,
        });
      }
    }
    await Promise.all(sessions.map(s => plannerAPI.createSession(s)));
    qc.invalidateQueries(['sessions']);
    toast.success(`📅 ${sessions.length} sessions added to your planner!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="floating-panel" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 900, fontFamily: 'var(--font-head)', marginBottom: 20 }}>🤖 Generate AI Study Schedule</h3>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Select label="Subject" {...register('subject')}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Input label="Exam Deadline" type="date" {...register('deadline', { required: true })} />
          <Select label="Daily Study Hours" {...register('dailyHours')}>
            {[1,2,3,4,5].map(h => <option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
          </Select>
          <Select label="Current Level" {...register('currentLevel')}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ gridColumn: '1/-1', padding: '12px', fontSize: 15, fontWeight: 800 }}
          >
            {loading ? '✨ Generating...' : '✨ Generate AI Plan'}
          </motion.button>
        </form>
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card glow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  📋 {plan.daysUntil}-Day Plan — {SUBJECTS.find(s=>s.value===plan.subject)?.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  ~{plan.totalHours}h total · {plan.dailyHours}h/day
                </div>
              </div>
              <Button variant="primary" onClick={applySessions}>📅 Apply to Planner</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {(plan.plan || []).map(day => (
                <div key={day.day} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                    Day {day.day} · {day.date}
                  </div>
                  {(day.sessions || []).map((s, si) => (
                    <div key={si} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>
                      <span style={{ color: 'var(--text3)', minWidth: 45 }}>{s.time}</span>
                      <span style={{ flex: 1 }}>{s.topic}</span>
                      <span style={{ color: 'var(--text3)' }}>{s.duration}min</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: 6, fontSize: 10,
                        background: s.type === 'rest' ? 'rgba(14,205,168,0.1)' : 'rgba(108,99,255,0.1)',
                        color: s.type === 'rest' ? 'var(--accent2)' : 'var(--primary-light)',
                      }}>{s.type}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {plan.tips?.length > 0 && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(108,99,255,0.06)',
                borderRadius: 10, borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--primary-light)' }}>💡 AI Tips</div>
                {plan.tips.map((t, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>• {t}</div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ── Main Planner Page ──
export default function PlannerPage() {

  const [activeTab, setActiveTab] = useState('weekly');
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => plannerAPI.getSessions({
      start: new Date(Date.now() - 30 * 86400000).toISOString(),
      end:   new Date(Date.now() + 60 * 86400000).toISOString(),
    }),
  });
  const sessions = data?.data?.sessions || [];

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => plannerAPI.updateSession(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['sessions']); toast.success('Status updated'); },
  });

  const { mutate: deleteSession } = useMutation({
    mutationFn: plannerAPI.deleteSession,
    onSuccess: () => { qc.invalidateQueries(['sessions']); toast.success('Session deleted'); },
  });

  const completed = sessions.filter(s => s.status === 'completed').length;
  const totalMinutes = sessions.filter(s => s.status === 'completed').reduce((acc, s) => acc + (s.duration || 0), 0);

  const TABS = [
    { key: 'weekly', label: 'Weekly View', icon: '📅' },
    { key: 'ai',     label: 'AI Schedule', icon: '🤖' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 4 }}>📅 Study Planner</h2>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Plan, track, and optimise your study sessions</p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add Session</Button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Sessions', value: sessions.length, icon: '📅', color: 'var(--primary)' },
          { label: 'Completed',      value: completed,       icon: '✨', color: 'var(--success)' },
          { label: 'Hours Studied',  value: `${Math.round(totalMinutes/60)}h`, icon: '💎', color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="floating-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-head)', color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'weekly' && (
        <div className="floating-panel" style={{ padding: 28 }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 16 }} />)}
            </div>
          ) : (
            <WeeklyView
              sessions={sessions}
              onStatusChange={(id, status) => updateStatus({ id, status })}
              onDelete={(id) => { if (window.confirm('Delete this session?')) deleteSession(id); }}
            />
          )}
        </div>
      )}

      {activeTab === 'ai' && <AIScheduleTab />}

      <AddSessionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => qc.invalidateQueries(['sessions'])}
      />
    </div>
  );
}
