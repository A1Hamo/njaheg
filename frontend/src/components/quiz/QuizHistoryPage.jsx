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
        <div className="grid-3" style={{ marginBottom:24 }}>
          {stats.slice(0,3).map(s => (
            <Card key={s.subject}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:24 }}>{S_ICONS[s.subject]||'📝'}</span>
                <div style={{ fontWeight:700, textTransform:'capitalize' }}>{(s.subject||'').replace('_',' ')}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, color:'var(--text3)' }}>
                <span>Avg Score</span>
                <span style={{ fontWeight:700, color: s.avg_score>=80?'var(--accent2)':s.avg_score>=60?'var(--accent)':'var(--danger)' }}>
                  {s.avg_score}%
                </span>
              </div>
              <ProgressBar value={Number(s.avg_score)} max={100}
                color={s.avg_score>=80?'green':s.avg_score>=60?'amber':'red'} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:11, color:'var(--text3)' }}>
                <span>{s.attempts} attempts</span>
                <span style={{ color:'var(--accent)' }}>{s.perfect} perfect 💯</span>
              </div>
            </Card>
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
        <Card><EmptyState icon="📝" title="No quiz attempts yet" subtitle="Generate a quiz in AI Assistant to get started!" /></Card>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {history.map((a,i) => (
            <motion.div key={a.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.03 }}>
              <Card hover>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{
                    width:52, height:52, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:24, fontWeight:800, fontFamily:'var(--font-head)', flexShrink:0,
                    background: a.score_pct>=80?'rgba(14,205,168,0.12)':a.score_pct>=60?'rgba(247,183,49,0.12)':'rgba(255,84,112,0.12)',
                    color: a.score_pct>=80?'var(--accent2)':a.score_pct>=60?'var(--accent)':'var(--danger)',
                  }}>{Math.round(a.score_pct)}%</div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:2, textTransform:'capitalize' }}>
                      {S_ICONS[a.subject]||'📝'} {(a.subject||'').replace('_',' ')}
                      {a.topic ? ` — ${a.topic}` : ''}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>
                      {a.correct_q}/{a.total_q} correct · {a.difficulty||'medium'} · {format(new Date(a.created_at),'MMM d, yyyy HH:mm')}
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:600,
                      color: a.score_pct===100?'var(--accent)':a.score_pct>=80?'var(--accent2)':'var(--text3)',
                    }}>
                      {a.score_pct===100 ? '💯 Perfect!' : a.score_pct>=80 ? '⭐ Excellent' : a.score_pct>=60 ? '👍 Good' : '📚 Keep studying'}
                    </div>
                    {a.time_taken && (
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>⏱ {Math.round(a.time_taken/60)}m</div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
