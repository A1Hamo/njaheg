// src/components/analytics/AnalyticsPage.jsx
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { analyticsAPI, quizAPI } from '../../api/index';
import { Card, SectionHeader, ProgressBar, Spinner, EmptyState } from '../shared/UI';

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey:['analytics'], queryFn:analyticsAPI.dashboard });
  const { data: streak }    = useQuery({ queryKey:['streak'], queryFn:analyticsAPI.streakHistory });
  const { data: qStats }    = useQuery({ queryKey:['quiz-stats'], queryFn:quizAPI.stats });

  const d        = data?.data  || {};
  const streakDays = streak?.data?.history || [];
  const quizStats  = qStats?.data?.stats   || [];

  if (isLoading) return <div style={{display:'flex',justifyContent:'center',padding:64, minHeight: '60vh', alignItems: 'center'}}><Spinner size="lg"/></div>;

  return (
    <div className="animate-fade-up">
      <SectionHeader 
        icon="📊" 
        title="Performance Analytics" 
        subtitle="Harness data to optimize your learning trajectory and master your subjects." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
        <Card>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 20 }}>Knowledge Mastery</h3>
          {!(d.subjectBreakdown?.length) ? <EmptyState icon="📖" title="Awaiting Data" subtitle="Complete study sessions to begin subject mapping." /> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {d.subjectBreakdown.map((s,i) => {
                const maxMins = Math.max(...d.subjectBreakdown.map(x=>Number(x.total_mins)),1);
                const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--accent)', 'var(--accent2)'];
                return (
                  <div key={s.subject}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                      <span style={{ textTransform:'capitalize', fontWeight:700, color: 'var(--text)' }}>{s.subject.replace('_',' ')}</span>
                      <span style={{ color:'var(--text2)', fontWeight: 600 }}>
                        {Math.round(Number(s.total_mins)/60)}h Studied · {s.completed} Tasks
                      </span>
                    </div>
                    <ProgressBar value={Number(s.total_mins)} max={maxMins} color={colors[i%colors.length]} height={10} />
                  </div>
                );
              })}
            </div>
          }
        </Card>

        <Card>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 20 }}>Cognitive Assessments</h3>
          {!quizStats.length ? <EmptyState icon="📝" title="No Assessments Yet" subtitle="Take a quiz in the AI Assistant to measure your progress." /> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {quizStats.map((q,i) => (
                <div key={q.subject} className="glass-panel" style={{ 
                  display:'flex', alignItems:'center', gap:16, padding:'16px 20px', 
                  marginBottom: 10, background: 'var(--surface)'
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    {SUBJ_ICON[q.subject] || '📝'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, textTransform:'capitalize' }}>{q.subject.replace('_',' ')}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop: 2 }}>{q.attempts} attempts · {q.perfect} perfect scores</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div className="neon-text" style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-head)',
                      color: q.avg_score>=80?'var(--success)':q.avg_score>=60?'var(--primary)':'var(--danger)' }}>{q.avg_score}%</div>
                    <div style={{ fontSize:10, color:'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Score</div>
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>

      <Card style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', marginBottom: 24 }}>Learning Velocity</h3>
        {!d.weeklyActivity?.length ? <EmptyState icon="📅" title="No recent activity" /> : (
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', height:160, padding: '0 10px' }}>
            {d.weeklyActivity.map((day, idx) => {
              const maxM = Math.max(...d.weeklyActivity.map(x=>Number(x.minutes)),1);
              const h = Math.max(12, Math.round((Number(day.minutes)/maxM)*140));
              return (
                <div key={day.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    style={{ 
                      width:'100%', height: h, background: idx === 6 ? 'var(--accent2)' : 'var(--primary)', 
                      borderRadius: 8, transformOrigin: 'bottom',
                      boxShadow: idx === 6 ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none'
                    }} 
                  />
                  <div style={{ fontSize:11, fontWeight: 700, color: idx === 6 ? 'var(--text)' : 'var(--text3)' }}>{day.date?.slice(5)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)' }}>Study Dedication Heatmap</h3>
          <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--text3)', fontWeight: 600 }}>
            {[['var(--surface3)','NONE'],['var(--primary)','STUDIED'],['var(--accent2)','ELITE']].map(([c,l])=>(
              <span key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:10, height:10, borderRadius:2, background:c, display:'inline-block' }} />{l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {Array.from({ length: 140 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (139 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayData = streakDays.find(s => s.date.split('T')[0] === dateStr);
            const count = Number(dayData?.sessions || 0);
            
            return (
              <motion.div key={dateStr} 
                title={`${dateStr}: ${count} sessions`}
                whileHover={{ scale: 1.25, zIndex: 10 }}
                style={{ 
                  width:16, height:16, borderRadius:4,
                  background: count >= 3 ? 'var(--accent2)' : count >= 1 ? 'var(--primary)' : 'var(--surface3)',
                  opacity: count >= 1 ? 1 : 0.2,
                  cursor: 'pointer',
                  boxShadow: count >= 3 ? '0 0 10px rgba(244, 63, 94, 0.4)' : 'none'
                }} 
              />
            );
          })}
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
          Visualizing your dedication over the last 140 days. Keep the flame alive! 🔥
        </p>
      </Card>
    </div>
  );
}

const SUBJ_ICON  = { mathematics:'📐',science:'🔬',arabic:'📚',english:'🌐',social_studies:'🌍' };
