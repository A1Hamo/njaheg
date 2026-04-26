// src/components/teacher/EssayGrader.jsx — Najah v7
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI } from '../../api/index';
import { useTranslation } from '../../i18n/index';
import toast from 'react-hot-toast';

const DEFAULT_CRITERIA_AR = 'المحتوى والمعلومات، التنظيم والبنية، اللغة والأسلوب، الإبداع والأفكار';
const DEFAULT_CRITERIA_EN = 'Content & Information, Organization & Structure, Language & Style, Creativity & Ideas';

function ScoreMeter({ score, max }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={130} height={130} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={65} cy={65} r={52} fill="none" stroke="var(--surface3)" strokeWidth={10} />
        <motion.circle
          cx={65} cy={65} r={52} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={2 * Math.PI * 52}
          initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - pct/100) }}
          transition={{ duration:1.5, ease:'easeOut', delay:0.3 }}
          strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 8px ${color}88)` }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          transform="rotate(90, 65, 65)"
          style={{ fill:'var(--text)', fontSize:26, fontWeight:900, fontFamily:'var(--font-head)' }}>
          {score}
        </text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle"
          transform="rotate(90, 65, 65)"
          style={{ fill:'var(--text3)', fontSize:11, fontWeight:700 }}>
          /{max}
        </text>
      </svg>
      <div style={{ fontSize:24, fontWeight:900, color, fontFamily:'var(--font-head)', letterSpacing:'-0.02em' }}>
        {grade}
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)' }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function TagList({ items, color, label, icon }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
        {icon} {label}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map((item, i) => (
          <motion.span key={i} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1, transition:{ delay: i*0.07 } }}
            style={{ padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:700, background:`${color}14`, color, border:`1px solid ${color}33` }}>
            {item}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export default function EssayGrader() {
  const { lang } = useTranslation();
  const isAr = lang === 'ar';

  const [essay,    setEssay]    = useState('');
  const [criteria, setCriteria] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [language, setLanguage] = useState('ar');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const handleGrade = async () => {
    if (!essay.trim()) return toast.error(isAr ? 'الرجاء إدخال نص الإجابة' : 'Please enter an essay/answer');
    if (essay.trim().split(' ').length < 10) return toast.error(isAr ? 'النص قصير جداً (10 كلمات على الأقل)' : 'Text too short (at least 10 words)');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.gradeEssay({
        essay,
        criteria: criteria || (isAr ? DEFAULT_CRITERIA_AR : DEFAULT_CRITERIA_EN),
        maxScore,
        language,
      });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.error || (isAr ? 'تعذر التقييم' : 'Grading failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setEssay(''); setResult(null); };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'0 4px' }}>
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:26, fontWeight:900, fontFamily:'var(--font-head)', letterSpacing:'-0.03em', color:'var(--text)' }}>
          ✍️ {isAr ? 'مقيّم الإجابات والمقالات' : 'AI Essay Grader'}
        </h1>
        <p style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>
          {isAr ? 'قيّم إجابات الطلاب وأنشئ تغذية راجعة تفصيلية بالذكاء الاصطناعي' : 'Grade student answers and generate detailed feedback with AI'}
        </p>
      </motion.div>

      <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:20, alignItems:'start' }}>

        {/* Input panel */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            {/* Max score */}
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', display:'block', marginBottom:6 }}>
                🎯 {isAr ? 'الدرجة الكاملة' : 'Max Score'}
              </label>
              <div style={{ display:'flex', gap:6 }}>
                {[5,10,20,50,100].map(n => (
                  <motion.button key={n} whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
                    onClick={() => setMaxScore(n)}
                    style={{ padding:'7px 11px', borderRadius:8, fontSize:12, fontWeight:800, cursor:'pointer', background: maxScore === n ? 'var(--primary)' : 'var(--surface2)', color: maxScore === n ? '#fff' : 'var(--text2)', border:`1px solid ${maxScore === n ? 'var(--primary)' : 'var(--border)'}` }}
                  >{n}</motion.button>
                ))}
              </div>
            </div>
            {/* Language */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', display:'block', marginBottom:6 }}>
                🌐 {isAr ? 'لغة التغذية الراجعة' : 'Feedback Language'}
              </label>
              <div style={{ display:'flex', gap:6 }}>
                {[{ v:'ar', l:'عربي' },{ v:'en', l:'English' }].map(o => (
                  <motion.button key={o.v} whileHover={{ scale:1.06 }}
                    onClick={() => setLanguage(o.v)}
                    style={{ padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', background: language === o.v ? '#6366F1' : 'var(--surface2)', color: language === o.v ? '#fff' : 'var(--text2)', border:`1px solid ${language === o.v ? '#6366F1' : 'var(--border)'}` }}
                  >{o.l}</motion.button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', display:'block', marginBottom:6 }}>
              📋 {isAr ? 'معايير التقييم (اختياري)' : 'Grading Criteria (optional)'}
            </label>
            <input value={criteria} onChange={e => setCriteria(e.target.value)}
              placeholder={isAr ? DEFAULT_CRITERIA_AR : DEFAULT_CRITERIA_EN}
              style={{ width:'100%', padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text)', boxSizing:'border-box', outline:'none', direction: isAr ? 'rtl' : 'ltr' }}
            />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text3)', display:'block', marginBottom:6 }}>
              📝 {isAr ? 'إجابة الطالب' : 'Student Answer / Essay'}
            </label>
            <textarea value={essay} onChange={e => setEssay(e.target.value)}
              placeholder={isAr ? 'الصق نص إجابة الطالب هنا...' : 'Paste the student\'s answer here...'}
              rows={10}
              style={{
                width:'100%', padding:'12px 14px', background:'var(--surface2)', border:'1px solid var(--border2)',
                borderRadius:12, fontSize:13, color:'var(--text)', resize:'vertical', boxSizing:'border-box',
                fontFamily:'var(--font-body)', lineHeight:1.7, outline:'none', direction: language === 'ar' ? 'rtl' : 'ltr',
              }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e  => e.target.style.borderColor = 'var(--border2)'}
            />
            <div style={{ fontSize:11, color:'var(--text4)', textAlign:'right', marginTop:4 }}>
              {essay.trim().split(/\s+/).filter(Boolean).length} {isAr ? 'كلمة' : 'words'}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {result && (
              <button onClick={handleReset} style={{ padding:'12px 20px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', color:'var(--text2)' }}>
                🔄 {isAr ? 'إعادة' : 'Reset'}
              </button>
            )}
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={handleGrade} disabled={loading || !essay.trim()}
              style={{ flex:1, padding:'13px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor: loading || !essay.trim() ? 'not-allowed' : 'pointer', boxShadow:'0 4px 20px rgba(99,102,241,0.35)', opacity: loading || !essay.trim() ? 0.7 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
            >
              {loading
                ? <><span style={{ width:18, height:18, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> {isAr ? 'جاري التقييم...' : 'Grading...'}</>
                : `🤖 ${isAr ? 'قيّم الإجابة' : 'Grade Answer'}`
              }
            </motion.button>
          </div>
        </div>

        {/* Result panel */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:16 }}>
                <div>
                  <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text)', fontFamily:'var(--font-head)' }}>
                    📊 {isAr ? 'نتيجة التقييم' : 'Grading Result'}
                  </h3>
                  <p style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>
                    {isAr ? 'تقييم آلي بالذكاء الاصطناعي' : 'AI-powered assessment'}
                  </p>
                </div>
                <ScoreMeter score={result.score} max={maxScore} />
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div style={{ marginBottom:20, padding:16, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:14 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    💬 {isAr ? 'التغذية الراجعة' : 'Detailed Feedback'}
                  </div>
                  <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {result.feedback}
                  </p>
                </div>
              )}

              <TagList items={result.strengths}    color="#10B981" label={isAr ? 'نقاط القوة'   : 'Strengths'}    icon="✅" />
              <TagList items={result.improvements} color="#F59E0B" label={isAr ? 'مقترحات التحسين' : 'Improvements'} icon="💡" />

              <motion.button whileHover={{ scale:1.02 }} onClick={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); toast.success(isAr ? 'تم نسخ النتيجة' : 'Result copied'); }}
                style={{ width:'100%', marginTop:16, padding:'10px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, fontSize:12, fontWeight:700, cursor:'pointer', color:'var(--text2)' }}>
                📋 {isAr ? 'نسخ النتيجة' : 'Copy Result'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
