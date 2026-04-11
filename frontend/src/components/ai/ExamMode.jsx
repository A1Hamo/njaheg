// src/components/ai/ExamMode.jsx
// NEW FEATURE: Timed exam mode with auto-grading
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { aiAPI } from '../../api/index';
import { Card, Btn, Input, Select, ProgressBar, SectionHeader, Spinner, EmptyState } from '../shared/UI';

const SUBJECTS = ['mathematics','science','arabic','english','social_studies','physics','chemistry','biology'];
const S_ICONS  = { mathematics:'📐',science:'🔬',arabic:'📚',english:'🌐',social_studies:'🌍',physics:'⚡',chemistry:'⚗️',biology:'🧬' };

function Timer({ seconds, max, onExpire }) {
  const pct = (seconds / max) * 100;
  const mins = String(Math.floor(seconds / 60)).padStart(2,'0');
  const secs = String(seconds % 60).padStart(2,'0');
  const color = pct > 50 ? 'var(--accent2)' : pct > 20 ? 'var(--accent)' : 'var(--danger)';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-head)', color, fontVariantNumeric:'tabular-nums', minWidth:60 }}>
        {mins}:{secs}
      </div>
      <div style={{ flex:1 }}>
        <ProgressBar value={seconds} max={max} color={pct > 50 ? 'green' : pct > 20 ? 'amber' : 'red'} height={5} />
      </div>
    </div>
  );
}

export default function ExamMode() {
  const [phase, setPhase]       = useState('config');   // config | exam | results
  const [exam, setExam]         = useState(null);
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeMax, setTimeMax]   = useState(0);
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const [flagged, setFlagged]   = useState(new Set());
  const [current, setCurrent]   = useState(0);
  const timerRef = useRef(null);
  const { register, handleSubmit } = useForm({
    defaultValues: { subject:'mathematics', count:20, difficulty:'medium', timeMinutes:30 }
  });

  const startExam = async (config) => {
    setLoading(true);
    try {
      const { data } = await aiAPI.generateQuiz({
        subject:    config.subject,
        difficulty: config.difficulty,
        count:      parseInt(config.count),
        language:   'en',
      });
      setExam({ ...data, config });
      setAnswers({});
      setFlagged(new Set());
      setCurrent(0);
      const secs = parseInt(config.timeMinutes) * 60;
      setTimeLeft(secs);
      setTimeMax(secs);
      setPhase('exam');
      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); submitExam({}, data); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch { toast.error('Failed to generate exam'); }
    finally { setLoading(false); }
  };

  const submitExam = (ans = answers, examData = exam) => {
    clearInterval(timerRef.current);
    const questions = examData?.questions || [];
    const finalAnswers = { ...ans };
    const correct = questions.filter((q, i) => finalAnswers[i] === q.correct).length;
    const wrong   = questions.filter((q, i) => finalAnswers[i] !== undefined && finalAnswers[i] !== q.correct).length;
    const skipped = questions.length - correct - wrong;
    const score   = Math.round((correct / questions.length) * 100);

    setResults({ correct, wrong, skipped, score, total: questions.length, timeUsed: timeMax - timeLeft, answers: finalAnswers });
    setPhase('results');

    // Save result to backend
    aiAPI.submitQuiz({
      subject:    examData?.config?.subject || 'general',
      totalQ:     questions.length,
      correctQ:   correct,
      difficulty: examData?.config?.difficulty || 'medium',
      timeTaken:  timeMax - timeLeft,
    }).catch(() => {});
  };

  const toggleFlag = (i) => setFlagged(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Config Phase ──
  if (phase === 'config') return (
    <div>
      <SectionHeader icon="📝" title="Exam Mode" subtitle="Timed exam with auto-grading and detailed results" />
      <div style={{ maxWidth:560, margin:'0 auto' }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>⚙️ Configure Exam</div>
          <form onSubmit={handleSubmit(startExam)} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Select label="Subject" {...register('subject')}>
              {SUBJECTS.map(s => <option key={s} value={s}>{S_ICONS[s]} {s.replace('_',' ')}</option>)}
            </Select>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Select label="Difficulty" {...register('difficulty')}>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </Select>
              <Select label="Questions" {...register('count')}>
                {[10,15,20,25,30].map(n => <option key={n} value={n}>{n} questions</option>)}
              </Select>
            </div>
            <Select label="Time Limit" {...register('timeMinutes')}>
              {[10,15,20,30,45,60,90].map(m => <option key={m} value={m}>{m} minutes</option>)}
            </Select>
            <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width:'100%', marginTop:8 }}>
              🚀 Start Exam
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );

  // ── Exam Phase ──
  if (phase === 'exam' && exam) {
    const q = exam.questions[current];
    const answered = Object.keys(answers).length;
    return (
      <div>
        {/* Exam header */}
        <div style={{ background:'var(--glass2)', backdropFilter:'blur(12px)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>
            {S_ICONS[exam.config?.subject]} {(exam.config?.subject||'').replace('_',' ')} Exam
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{answered}/{exam.questions.length} answered</div>
          <div style={{ flex:1 }}>
            <Timer seconds={timeLeft} max={timeMax} />
          </div>
          <Btn variant="primary" onClick={() => submitExam()}>Submit Exam →</Btn>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:16 }}>
          {/* Question */}
          <div>
            <Card style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>Question {current+1} of {exam.questions.length}</span>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn size="sm" variant={flagged.has(current)?'primary':'default'} onClick={() => toggleFlag(current)}>
                    {flagged.has(current)?'🚩 Flagged':'⛳ Flag'}
                  </Btn>
                </div>
              </div>
              <div style={{ fontSize:16, fontWeight:600, lineHeight:1.55, marginBottom:20, color:'var(--text)' }}>{q.question}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {q.options.map((opt, oi) => (
                  <motion.div key={oi}
                    onClick={() => setAnswers(a => ({ ...a, [current]: oi }))}
                    whileHover={{ x:4 }} whileTap={{ scale:0.99 }}
                    style={{
                      padding:'13px 18px', borderRadius:10, cursor:'pointer',
                      border:'1px solid', fontSize:14, transition:'all 0.2s',
                      background: answers[current]===oi ? 'rgba(108,99,255,0.1)' : 'var(--surface)',
                      borderColor: answers[current]===oi ? 'var(--primary)' : 'var(--border)',
                      color: answers[current]===oi ? 'var(--primary-light)' : 'var(--text)',
                      fontWeight: answers[current]===oi ? 600 : 400,
                    }}
                  >{opt}</motion.div>
                ))}
              </div>
            </Card>

            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              <Btn onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current===0}>← Previous</Btn>
              <Btn variant="primary" onClick={() => {
                if (current < exam.questions.length - 1) setCurrent(c => c+1);
                else submitExam();
              }}>
                {current < exam.questions.length - 1 ? 'Next →' : '✅ Submit'}
              </Btn>
            </div>
          </div>

          {/* Question navigator */}
          <div>
            <Card style={{ padding:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', marginBottom:10 }}>QUESTIONS</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
                {exam.questions.map((_, i) => (
                  <motion.button key={i}
                    onClick={() => setCurrent(i)}
                    whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
                    style={{
                      width:'100%', aspectRatio:'1', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid',
                      cursor:'pointer', fontFamily:'inherit',
                      background: i===current ? 'var(--primary)' : answers[i]!==undefined ? 'rgba(14,205,168,0.12)' : 'var(--surface)',
                      borderColor: i===current ? 'var(--primary)' : flagged.has(i) ? 'var(--accent)' : answers[i]!==undefined ? 'var(--accent2)' : 'var(--border)',
                      color: i===current ? '#fff' : answers[i]!==undefined ? 'var(--accent2)' : 'var(--text3)',
                    }}
                  >{i+1}</motion.button>
                ))}
              </div>
              <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:6, fontSize:11 }}>
                {[
                  { c:'var(--accent2)', label:`Answered (${Object.keys(answers).length})` },
                  { c:'var(--accent)',  label:`Flagged (${flagged.size})` },
                  { c:'var(--text3)',   label:`Unanswered (${exam.questions.length - Object.keys(answers).length})` },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:s.c }} />
                    <span style={{ color:'var(--text3)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── Results Phase ──
  if (phase === 'results' && results) {
    const grade = results.score>=90?'A+':results.score>=80?'A':results.score>=70?'B':results.score>=60?'C':results.score>=50?'D':'F';
    const gradeColor = results.score>=70?'var(--accent2)':results.score>=50?'var(--accent)':'var(--danger)';
    return (
      <div>
        <SectionHeader icon="📊" title="Exam Results" />
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          {/* Score card */}
          <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
            style={{ textAlign:'center', padding:'36px 24px', background:'var(--glass)', border:'1px solid var(--border2)', borderRadius:'var(--radius-lg)', marginBottom:20 }}>
            <div style={{ fontSize:80, fontWeight:900, fontFamily:'var(--font-head)', color:gradeColor, lineHeight:1, marginBottom:8 }}>{grade}</div>
            <div style={{ fontSize:36, fontWeight:800, color:gradeColor, marginBottom:4 }}>{results.score}%</div>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>
              {results.correct} correct · {results.wrong} wrong · {results.skipped} skipped
            </div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              Time used: {Math.floor(results.timeUsed/60)}m {results.timeUsed%60}s
            </div>
          </motion.div>

          {/* Per-question breakdown */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📋 Question Review</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {(exam?.questions||[]).map((q, i) => {
                const userAns = results.answers[i];
                const isCorrect = userAns === q.correct;
                const wasSkipped = userAns === undefined;
                return (
                  <div key={i} style={{ padding:'12px 14px', background:'var(--surface)', borderRadius:10,
                    borderLeft:`3px solid ${isCorrect?'var(--accent2)':wasSkipped?'var(--text3)':'var(--danger)'}` }}>
                    <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:8 }}>
                      <span style={{ fontSize:16 }}>{isCorrect?'✅':wasSkipped?'⏭️':'❌'}</span>
                      <div style={{ fontSize:13, fontWeight:500, flex:1 }}>Q{i+1}. {q.question}</div>
                    </div>
                    {!isCorrect && (
                      <div style={{ fontSize:12, color:'var(--accent2)', marginBottom:wasSkipped?0:4 }}>
                        ✓ Correct: {q.options[q.correct]}
                      </div>
                    )}
                    {!wasSkipped && !isCorrect && (
                      <div style={{ fontSize:12, color:'var(--danger)' }}>
                        ✗ Your answer: {q.options[userAns]}
                      </div>
                    )}
                    {q.explanation && (
                      <div style={{ fontSize:11, color:'var(--text3)', marginTop:4, fontStyle:'italic' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div style={{ display:'flex', gap:10 }}>
            <Btn style={{ flex:1 }} onClick={() => setPhase('config')}>📝 New Exam</Btn>
            <Btn variant="primary" style={{ flex:1 }} onClick={() => window.print()}>🖨️ Print Results</Btn>
          </div>
        </div>
      </div>
    );
  }

  return <div style={{ display:'flex', justifyContent:'center', padding:64 }}><Spinner size="lg" /></div>;
}
