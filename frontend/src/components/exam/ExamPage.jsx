// src/components/exam/ExamPage.jsx
// NEW FEATURE: Timed exam mode with auto-grading, score analytics, review mode
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { aiAPI } from '../../api/index';
import { Card, Btn, Select, Input, SectionHeader, ProgressBar, Spinner } from '../shared/UI';

const SUBJECTS = [
  { value:'mathematics',    label:'📐 Mathematics'   },
  { value:'science',        label:'🔬 Science'        },
  { value:'arabic',         label:'📚 Arabic'         },
  { value:'english',        label:'🌐 English'        },
  { value:'social_studies', label:'🌍 Social Studies' },
  { value:'physics',        label:'⚡ Physics'        },
  { value:'chemistry',      label:'⚗️ Chemistry'      },
  { value:'biology',        label:'🧬 Biology'        },
];

const DURATIONS = [
  { value:10,  label:'10 minutes — Quick drill'    },
  { value:20,  label:'20 minutes — Short exam'     },
  { value:30,  label:'30 minutes — Standard exam'  },
  { value:45,  label:'45 minutes — Full exam'      },
  { value:60,  label:'60 minutes — Final exam'     },
];

const DIFFICULTIES = [
  { value:'easy',   label:'🟢 Easy'   },
  { value:'medium', label:'🟡 Medium' },
  { value:'hard',   label:'🔴 Hard'   },
];

// ── Setup screen ─────────────────────────────────────────
function ExamSetup({ onStart, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { subject:'mathematics', count:10, difficulty:'medium', duration:20, topic:'' },
  });

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <SectionHeader
        icon="📝"
        title="Exam Mode"
        subtitle="Generate a timed exam and test your knowledge under pressure"
      />

      <Card>
        <form onSubmit={handleSubmit(onStart)} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Select label="Subject" {...register('subject', { required: true })}>
            {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>

          <Input
            label="Topic (optional)"
            placeholder="e.g. Fractions, Photosynthesis, Grammar..."
            {...register('topic')}
          />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="Number of Questions" {...register('count')}>
              {[5,10,15,20].map(n => <option key={n} value={n}>{n} questions</option>)}
            </Select>
            <Select label="Difficulty" {...register('difficulty')}>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </div>

          <Select label="Time Limit" {...register('duration')}>
            {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>

          <div style={{
            padding:'14px 16px', background:'rgba(108,99,255,0.08)',
            border:'1px solid rgba(108,99,255,0.15)', borderRadius:10,
            fontSize:13, color:'var(--text2)', lineHeight:1.6,
          }}>
            <strong style={{ color:'var(--primary-light)' }}>ℹ️ How it works:</strong> An AI-generated exam will be created with
            a countdown timer. You must submit before time runs out. Each question is worth equal points
            and your results are saved to your profile.
          </div>

          <Btn type="submit" variant="primary" size="lg" loading={loading}
            style={{ marginTop:4 }}>
            🚀 Generate & Start Exam
          </Btn>
        </form>
      </Card>
    </div>
  );
}

// ── Timer ring ───────────────────────────────────────────
function TimerRing({ seconds, totalSeconds, color }) {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const pct    = seconds / totalSeconds;
  const offset = circ * (1 - pct);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const ringColor = pct > 0.5 ? '#0ECDA8' : pct > 0.25 ? '#F7B731' : '#FF5470';

  return (
    <div style={{ position:'relative', width:124, height:124 }}>
      <svg width="124" height="124" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="62" cy="62" r={radius} fill="none" stroke="var(--surface3)" strokeWidth="7" />
        <circle cx="62" cy="62" r={radius} fill="none"
          stroke={ringColor} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition:'stroke-dashoffset 1s linear, stroke 0.5s' }}
        />
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ fontSize:24, fontWeight:800, fontVariantNumeric:'tabular-nums',
          fontFamily:'var(--font-head)', color: ringColor, lineHeight:1 }}>{mm}:{ss}</div>
        <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>remaining</div>
      </div>
    </div>
  );
}

// ── Active exam ──────────────────────────────────────────
function ExamActive({ exam, totalSeconds, onSubmit }) {
  const [answers,    setAnswers]    = useState({});
  const [seconds,    setSeconds]    = useState(totalSeconds);
  const [current,    setCurrent]    = useState(0);
  const [flagged,    setFlagged]    = useState(new Set());
  const [timeUp,     setTimeUp]     = useState(false);
  const timerRef = useRef(null);

  const questions = exam.questions || [];

  // Countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setTimeUp(true);
          toast.error('⏰ Time is up! Submitting your exam…');
          setTimeout(() => onSubmit(answers, true), 1500);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const answer    = idx => setAnswers(a => ({ ...a, [current]: idx }));
  const toggleFlag = () => setFlagged(f => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; });
  const answered  = Object.keys(answers).length;
  const q         = questions[current];

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    const unanswered = questions.length - answered;
    if (unanswered > 0) {
      if (!window.confirm(`You have ${unanswered} unanswered question${unanswered>1?'s':''}. Submit anyway?`)) return;
    }
    onSubmit(answers, false);
  };

  if (!q) return null;

  return (
    <div>
      {/* Header bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:20, padding:'16px 20px',
        background:'var(--surface)', borderRadius:'var(--radius)',
        border:'1px solid var(--border2)',
      }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{exam.subject?.replace('_',' ')} Exam</div>
          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
            {answered}/{questions.length} answered
            {flagged.size > 0 && <span style={{ color:'var(--accent)', marginLeft:8 }}>🚩 {flagged.size} flagged</span>}
          </div>
        </div>
        <TimerRing seconds={seconds} totalSeconds={totalSeconds} />
        <Btn variant="primary" onClick={handleSubmit}>Submit Exam →</Btn>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:20 }}>
        <ProgressBar value={answered} max={questions.length} color="green" height={4} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:16, alignItems:'start' }}>
        {/* Question */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>
              QUESTION {current + 1} OF {questions.length}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {flagged.has(current) && <span style={{ fontSize:11, color:'var(--accent)' }}>🚩 Flagged</span>}
              <Btn size="sm" onClick={toggleFlag}>
                {flagged.has(current) ? '🚩 Unflag' : '🚩 Flag'}
              </Btn>
            </div>
          </div>

          <div style={{ fontSize:16, fontWeight:600, lineHeight:1.6, marginBottom:20, color:'var(--text)' }}>
            {q.question}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {q.options.map((opt, oi) => {
              const selected = answers[current] === oi;
              return (
                <motion.div key={oi}
                  onClick={() => answer(oi)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding:'13px 18px', borderRadius:10, cursor:'pointer',
                    border:'1px solid',
                    background: selected ? 'rgba(108,99,255,0.12)' : 'var(--surface)',
                    borderColor: selected ? 'var(--primary)' : 'var(--border)',
                    color: selected ? 'var(--text)' : 'var(--text2)',
                    fontSize:14, transition:'all 0.15s',
                  }}
                >
                  <span style={{ fontWeight:600, marginRight:8, color:selected?'var(--primary-light)':'var(--text3)' }}>
                    {String.fromCharCode(65 + oi)})
                  </span>
                  {opt.replace(/^[A-Da-d]\)\s*/, '')}
                </motion.div>
              );
            })}
          </div>

          {/* Prev / Next */}
          <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'space-between' }}>
            <Btn onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Prev</Btn>
            <span style={{ fontSize:12, color:'var(--text3)', alignSelf:'center' }}>{current+1}/{questions.length}</span>
            <Btn onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}>Next →</Btn>
          </div>
        </Card>

        {/* Question navigator */}
        <Card style={{ padding:16 }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Question Navigator</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6 }}>
            {questions.map((_, qi) => {
              const isAnswered = answers[qi] !== undefined;
              const isFlagged  = flagged.has(qi);
              const isCurrent  = qi === current;
              return (
                <motion.div key={qi}
                  onClick={() => setCurrent(qi)}
                  whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                  style={{
                    width:32, height:32, borderRadius:7,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, fontWeight:700, cursor:'pointer',
                    border:'1px solid',
                    background: isCurrent   ? 'var(--primary)'
                              : isFlagged  ? 'rgba(247,183,49,0.2)'
                              : isAnswered ? 'rgba(14,205,168,0.15)'
                              : 'var(--surface)',
                    borderColor: isCurrent  ? 'var(--primary)'
                              : isFlagged  ? 'var(--accent)'
                              : isAnswered ? 'var(--accent2)'
                              : 'var(--border)',
                    color: isCurrent ? '#fff' : isFlagged ? 'var(--accent)' : isAnswered ? 'var(--accent2)' : 'var(--text3)',
                  }}
                >{qi + 1}</motion.div>
              );
            })}
          </div>

          <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:6, fontSize:11, color:'var(--text3)' }}>
            {[
              { bg:'rgba(14,205,168,0.15)', bc:'var(--accent2)', label:'Answered' },
              { bg:'rgba(247,183,49,0.2)',  bc:'var(--accent)',  label:'Flagged' },
              { bg:'var(--surface)',        bc:'var(--border)',  label:'Not answered' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:14, height:14, borderRadius:3, background:item.bg, border:`1px solid ${item.bc}` }} />
                {item.label}
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, padding:'12px', background:'var(--surface2)', borderRadius:8, fontSize:12 }}>
            <div style={{ color:'var(--text3)', marginBottom:4 }}>Difficulty</div>
            <div style={{ fontWeight:600, textTransform:'capitalize', color:'var(--primary-light)' }}>
              {exam.difficulty}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Results screen ───────────────────────────────────────
function ExamResults({ exam, answers, timeTaken, onRetry, onNew }) {
  const questions = exam.questions || [];
  const correct   = questions.filter((q, i) => answers[i] === q.correct).length;
  const total     = questions.length;
  const score     = Math.round((correct / total) * 100);
  const mins      = Math.floor(timeTaken / 60);
  const secs      = timeTaken % 60;

  const grade =
    score >= 90 ? { label:'A+', color:'#0ECDA8', emoji:'🏆' } :
    score >= 80 ? { label:'A',  color:'#0ECDA8', emoji:'⭐' } :
    score >= 70 ? { label:'B',  color:'#6C63FF', emoji:'👍' } :
    score >= 60 ? { label:'C',  color:'#F7B731', emoji:'📚' } :
                  { label:'D',  color:'#FF5470', emoji:'💪' };

  const [showReview, setShowReview] = useState(false);

  return (
    <div style={{ maxWidth:720, margin:'0 auto' }}>
      {/* Score card */}
      <motion.div
        initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        transition={{ type:'spring', stiffness:200, damping:20 }}
      >
        <Card style={{ textAlign:'center', padding:'40px 32px', marginBottom:20 }}>
          <div style={{ fontSize:60, marginBottom:12 }}>{grade.emoji}</div>
          <div style={{ fontSize:64, fontWeight:800, fontFamily:'var(--font-head)', color:grade.color, marginBottom:4 }}>
            {score}%
          </div>
          <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>
            Grade <span style={{ color:grade.color }}>{grade.label}</span>
          </div>
          <div style={{ fontSize:14, color:'var(--text3)', marginBottom:24 }}>
            {correct} correct out of {total} questions
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[
              { icon:'✅', val:correct, label:'Correct' },
              { icon:'❌', val:total-correct, label:'Wrong' },
              { icon:'⏱️', val:`${mins}m ${secs}s`, label:'Time taken' },
              { icon:'📊', val:`${score}%`, label:'Score' },
            ].map(s => (
              <div key={s.label} style={{ padding:'14px 8px', background:'var(--surface)', borderRadius:10, textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--font-head)' }}>{s.val}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <Btn onClick={() => setShowReview(v => !v)}>
              {showReview ? 'Hide Review' : '📋 Review Answers'}
            </Btn>
            <Btn onClick={onRetry}>↺ Retry Same</Btn>
            <Btn variant="primary" onClick={onNew}>+ New Exam</Btn>
          </div>
        </Card>
      </motion.div>

      {/* Review */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
          >
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {questions.map((q, qi) => {
                const userAns    = answers[qi];
                const isCorrect  = userAns === q.correct;
                const isSkipped  = userAns === undefined;
                return (
                  <Card key={qi} style={{ borderColor: isCorrect ? 'rgba(14,205,168,0.3)' : 'rgba(255,84,112,0.3)' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
                      <span style={{ fontSize:20 }}>{isSkipped ? '⏭️' : isCorrect ? '✅' : '❌'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, marginBottom:8, lineHeight:1.5 }}>
                          Q{qi+1}: {q.question}
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {q.options.map((opt, oi) => {
                            const isUserAns    = oi === userAns;
                            const isCorrectAns = oi === q.correct;
                            return (
                              <div key={oi} style={{
                                padding:'8px 12px', borderRadius:8, fontSize:13,
                                background: isCorrectAns ? 'rgba(14,205,168,0.1)' : isUserAns && !isCorrect ? 'rgba(255,84,112,0.1)' : 'var(--surface)',
                                color:      isCorrectAns ? 'var(--accent2)'        : isUserAns && !isCorrect ? 'var(--danger)' : 'var(--text2)',
                                border:     `1px solid ${isCorrectAns ? 'rgba(14,205,168,0.25)' : isUserAns && !isCorrect ? 'rgba(255,84,112,0.25)' : 'var(--border)'}`,
                                display:'flex', alignItems:'center', gap:8,
                              }}>
                                <span style={{ fontWeight:700, minWidth:20 }}>{String.fromCharCode(65+oi)})</span>
                                {opt.replace(/^[A-Da-d]\)\s*/, '')}
                                {isCorrectAns && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700 }}>✓ Correct</span>}
                                {isUserAns && !isCorrect && <span style={{ marginLeft:'auto', fontSize:12 }}>✗ Your answer</span>}
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div style={{
                            marginTop:10, padding:'10px 12px', background:'rgba(108,99,255,0.07)',
                            borderRadius:8, fontSize:12, color:'var(--text2)', lineHeight:1.6,
                            borderLeft:'3px solid var(--primary)',
                          }}>
                            <strong style={{ color:'var(--primary-light)' }}>💡 Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Exam Page ───────────────────────────────────────
export default function ExamPage() {
  const [phase,     setPhase]     = useState('setup');   // setup | loading | active | results
  const [exam,      setExam]      = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [config,    setConfig]    = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [loading,   setLoading]   = useState(false);

  const generateExam = async (formData) => {
    setLoading(true);
    setConfig(formData);
    try {
      const { data } = await aiAPI.generateQuiz({
        subject:    formData.subject,
        topic:      formData.topic || '',
        difficulty: formData.difficulty,
        count:      Number(formData.count),
        language:   'en',
      });
      if (!data?.questions?.length) throw new Error('No questions returned');
      setExam({ ...data, duration: formData.duration });
      setStartTime(Date.now());
      setAnswers({});
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to generate exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async (finalAnswers, wasTimedOut) => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setTimeTaken(elapsed);
    setAnswers(finalAnswers);

    // Save result
    const questions = exam?.questions || [];
    const correct   = questions.filter((q, i) => finalAnswers[i] === q.correct).length;
    const score     = Math.round((correct / questions.length) * 100);

    try {
      await aiAPI.submitQuiz({
        subject:    exam.subject,
        topic:      exam.topic || '',
        totalQ:     questions.length,
        correctQ:   correct,
        difficulty: exam.difficulty,
        timeTaken:  elapsed,
        questions:  questions.map((q, i) => ({ ...q, userAnswer: finalAnswers[i] })),
      });
    } catch {}

    if (wasTimedOut) {
      toast.error(`⏰ Time's up! You scored ${score}%`);
    } else {
      score >= 80
        ? toast.success(`🎉 Excellent! ${score}% — ${correct}/${questions.length} correct!`)
        : score >= 60
          ? toast(`👍 Good effort! ${score}% — keep practising!`)
          : toast(`📚 ${score}% — review the material and try again`);
    }

    setPhase('results');
  }, [exam, startTime]);

  return (
    <div className="animate-fade">
      {phase === 'setup' && (
        <ExamSetup onStart={generateExam} loading={loading} />
      )}

      {phase === 'loading' && (
        <div style={{ textAlign:'center', padding:'80px 24px' }}>
          <Spinner size="lg" />
          <p style={{ marginTop:16, color:'var(--text3)' }}>Generating your exam with AI…</p>
        </div>
      )}

      {phase === 'active' && exam && (
        <ExamActive
          exam={exam}
          totalSeconds={config.duration * 60}
          onSubmit={submitExam}
        />
      )}

      {phase === 'results' && exam && (
        <ExamResults
          exam={exam}
          answers={answers}
          timeTaken={timeTaken}
          onRetry={() => { setPhase('active'); setStartTime(Date.now()); setAnswers({}); }}
          onNew={() => setPhase('setup')}
        />
      )}
    </div>
  );
}
