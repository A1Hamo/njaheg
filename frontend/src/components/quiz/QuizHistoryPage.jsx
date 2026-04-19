// src/components/quiz/QuizHistoryPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { quizAPI } from '../../api/index';
import { Card, SectionHeader, Select, Spinner, EmptyState, ProgressBar } from '../shared/UI';

const SUBJECTS = ['','mathematics','science','arabic','english','social_studies'];
const S_ICONS  = { mathematics:'📐',science:'🔬',arabic:'📚',english:'🌐',social_studies:'🌍' };

export default function QuizHistoryPage() {
  const [subject, setSubject] = useState('');

  const { data: histData, isLoading: histLoad } = useQuery({
    queryKey: ['quiz-history', subject],
    queryFn:  () => quizAPI.history({ subject: subject||undefined, limit:30 }),
  });
  const { data: statsData } = useQuery({
    queryKey: ['quiz-stats'],
    queryFn:  quizAPI.stats,
  });

  const history = histData?.data?.attempts || [];
  const stats   = statsData?.data?.stats   || [];

  return (
    <div>
      <SectionHeader icon="📝" title="Quiz History" subtitle="Your quiz attempts and performance by subject" />

      {/* Stats overview */}
      {stats.length > 0 && (
        <div className="grid-3" style={{ marginBottom:32 }}>
          {stats.slice(0,3).map(s => (
            <div key={s.subject} className="floating-panel" style={{ padding: 24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <span style={{ fontSize:28 }}>{S_ICONS[s.subject]||'📝'}</span>
                <div style={{ fontWeight:900, textTransform:'uppercase', fontSize: 13, letterSpacing: '0.05em', color: 'var(--text)' }}>
                  {(s.subject||'').replace('_',' ')}
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12, fontWeight: 800, color:'var(--text4)' }}>
                <span>Subject Mastery</span>
                <span style={{ fontWeight:900, color: s.avg_score>=80?'var(--success)':s.avg_score>=60?'var(--warning)':'var(--danger)' }}>
                  {s.avg_score}%
                </span>
              </div>
              <ProgressBar value={Number(s.avg_score)} max={100} height={7}
                color={s.avg_score>=80?'var(--success)':s.avg_score>=60?'var(--warning)':'var(--danger)'} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, fontSize:11, fontWeight: 800, color:'var(--text4)' }}>
                <span>{s.attempts} Assessments</span>
                <span style={{ color:'var(--primary)' }}>{s.perfect} Perfect ✨</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <Select value={subject} onChange={e=>setSubject(e.target.value)} style={{ width:200 }}>
          <option value="">All Subjects</option>
          {SUBJECTS.filter(Boolean).map(s=>(
            <option key={s} value={s}>{S_ICONS[s]} {s.replace('_',' ')}</option>
          ))}
        </Select>
        <span style={{ fontSize:13, color:'var(--text3)' }}>
          {history.length} attempt{history.length!==1?'s':''}
        </span>
      </div>

      {/* History list */}
      {histLoad ? (
        <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Spinner size="lg"/></div>
      ) : history.length===0 ? (
        <div className="floating-panel"><EmptyState icon="📝" title="No quiz attempts yet" subtitle="Generate a quiz in AI Assistant to get started!" /></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {history.map((a,i) => (
            <motion.div key={a.id} 
              initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y: 0 }} 
              whileHover={{ scale: 1.01, x: 4 }}
              transition={{ delay:i*0.02 }}
              className="floating-card"
              style={{
                padding: '20px 24px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.22s var(--ease)'
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{
                  width:56, height:56, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:26, fontWeight:900, fontFamily:'var(--font-head)', flexShrink:0,
                  background: a.score_pct>=80?'rgba(16,185,129,0.12)':a.score_pct>=60?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)',
                  color: a.score_pct>=80?'#10b981':a.score_pct>=60?'#f59e0b':'#ef4444',
                }}>{Math.round(a.score_pct)}%</div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:15, marginBottom:4, color: 'var(--text)', fontFamily: 'var(--font-head)', letterSpacing: '-0.01em' }}>
                    {S_ICONS[a.subject]||'📝'} {(a.subject||'').replace('_',' ').toUpperCase()}
                    {a.topic ? ` — ${a.topic}` : ''}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {a.correct_q}/{a.total_q} correct · {a.difficulty||'medium'} · {format(new Date(a.created_at),'MMM d HH:mm')}
                  </div>
                </div>

                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:900,
                    color: a.score_pct===100?'var(--primary)':a.score_pct>=80?'#10b981':'var(--text4)',
                  }}>
                    {a.score_pct===100 ? '💯 FLAWLESS' : a.score_pct>=80 ? '⭐ EXCELLENT' : a.score_pct>=60 ? '👍 GOOD' : '📚 STUDYING'}
                  </div>
                  {a.time_taken && (
                    <div style={{ fontSize:10, color:'var(--text4)', marginTop:2, fontWeight: 700 }}>⏱ {Math.round(a.time_taken/60)}m elapsed</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
