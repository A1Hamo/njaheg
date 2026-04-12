// src/components/landing/LandingPage.jsx — Najah v5 Stunning Landing
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../context/store';

/* ── Logo Mark ─────────────────────────────────────────────── */
function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="land-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#land-g)"/>
      <path d="M11 30 L20 11 L29 30" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 24 L26 24" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="20" cy="11" r="2" fill="#fff"/>
    </svg>
  );
}

/* ── Animated Orb Background ─────────────────────────────── */
function OrbScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {[
        { left: '-5%',  top: '-10%', size: 700, color: 'rgba(124,58,237,0.25)',  dur: 22 },
        { left: '60%',  top: '50%',  size: 500, color: 'rgba(6,182,212,0.18)',   dur: 18 },
        { left: '75%',  top: '-5%',  size: 380, color: 'rgba(244,63,94,0.10)',   dur: 26 },
        { left: '15%',  top: '60%',  size: 440, color: 'rgba(99,102,241,0.12)',  dur: 20 },
        { left: '45%',  top: '30%',  size: 300, color: 'rgba(124,58,237,0.08)', dur: 14 },
      ].map((o, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: o.left, top: o.top,
            width: o.size, height: o.size, borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color}, transparent 68%)`,
            filter: 'blur(60px)',
            transformOrigin: 'center center',
          }}
          animate={{
            scale: [1, 1.15, 1, 0.95, 1],
            x: [0, 40, -20, 30, 0],
            y: [0, -30, 20, -10, 0],
          }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '52px 52px',
      }}/>
    </div>
  );
}

/* ── Animated counter ──────────────────────────────────────── */
function Counter({ target, suffix = '', label, icon }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.6 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ fontSize: 36, marginBottom: 6 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 40, fontWeight: 900,
        letterSpacing: '-0.04em', lineHeight: 1,
        background: 'linear-gradient(135deg, #fff 30%, var(--primary-light) 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', marginTop: 6 }}>{label}</div>
    </motion.div>
  );
}

/* ── Feature card ─────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.16,1,0.3,1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        background: 'var(--surface)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '28px 24px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        transition: 'box-shadow 0.3s',
      }}
    >
      {/* Top color bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'20px 20px 0 0' }}/>
      <div style={{
        width: 52, height: 52, borderRadius: 14, fontSize: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        background: `${color.replace(')', ',0.15)').replace('linear-gradient(135deg,', 'linear-gradient(135deg,')}`,
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(124,58,237,0.20)',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--text)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.65 }}>{desc}</p>
    </motion.div>
  );
}

/* ── Testimonial ──────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Ahmed Khaled', role: 'Secondary 3 Student', avatar: '👨‍🎓', quote: 'Najah AI explained photosynthesis in a way my teacher never could. I got 95% on my biology exam!', grade: 'Bio 95%' },
  { name: 'Nour Salem', role: 'University Year 2', avatar: '👩‍💻', quote: 'The study planner keeps me organized across 6 subjects. Best app I\'ve ever used for studying.', grade: 'GPA 3.9' },
  { name: 'Omar Farouk', role: 'Prep 3 Student', avatar: '🧑‍🏫', quote: 'I failed math last year. This year with Najah AI tutoring me daily, I passed with an A.', grade: 'Math A+' },
  { name: 'Sara Ahmed', role: 'High School Teacher', avatar: '👩‍🏫', quote: 'Managing my classes, assignments, and announcements is so much easier. My students love the group chat.', grade: 'Teacher' },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[idx];
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{t.avatar}</div>
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border2)',
            borderRadius: 20, padding: '28px 32px',
            boxShadow: 'var(--shadow), var(--glow)',
            marginBottom: 16,
            position: 'relative',
          }}>
            <div style={{ fontSize: 48, position: 'absolute', top: 12, left: 20, opacity: 0.12, fontFamily: 'Georgia', color: 'var(--primary-light)', lineHeight: 1 }}>"</div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text)', fontStyle: 'italic', position: 'relative', zIndex: 1 }}>"{t.quote}"</p>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{t.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{t.role}</div>
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)',
          }}>{t.grade}</span>
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
        {TESTIMONIALS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{
              width: i === idx ? 24 : 8, height: 8,
              borderRadius: 99, border: 'none', cursor: 'pointer',
              background: i === idx ? 'var(--primary)' : 'var(--surface3)',
              transition: 'all 0.3s var(--ease)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main Landing Page ─────────────────────────────────────── */
const FEATURES = [
  { icon:'🤖', title:'Najah AI Tutor', desc:'Gemini-powered AI that explains any Egyptian curriculum topic step-by-step, in Arabic or English, with warmth and patience.', color:'linear-gradient(135deg,#7C3AED,#5B21B6)' },
  { icon:'📅', title:'Smart Planner', desc:'Personalized study schedules with Pomodoro timers, deadline reminders, and calendar integration. Never miss a session.', color:'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
  { icon:'🧠', title:'AI Quiz Engine', desc:'Generate unlimited multiple-choice quizzes for any subject and difficulty level. Track your scores and improve weaknesses.', color:'linear-gradient(135deg,#10B981,#047857)' },
  { icon:'💬', title:'Real-Time Chat', desc:'Study groups with subject channels, private messaging, and real-time presence. Connect with classmates and teachers.', color:'linear-gradient(135deg,#F59E0B,#D97706)' },
  { icon:'📊', title:'Deep Analytics', desc:'Hourly study heatmaps, subject mastery radar, XP progress, and streaks. Visualize every learning metric.', color:'linear-gradient(135deg,#EF4444,#DC2626)' },
  { icon:'📁', title:'Files & Notes', desc:'Upload PDFs, create rich notes with Markdown, organize by subject. AI can summarize any document instantly.', color:'linear-gradient(135deg,#EC4899,#BE185D)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { toggleDark, darkMode } = useUIStore();
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 100], ['rgba(8,11,20,0)', 'rgba(8,11,20,0.90)']);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', position: 'relative', overflowX: 'hidden' }}>
      <OrbScene />

      {/* ── Sticky Nav ─────────────────────────────────────── */}
      <motion.nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: navBg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={36} />
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Najah
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginLeft: 2 }}>
            Smart Learning
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={toggleDark}
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              padding: '9px 20px', borderRadius: 11, border: '1.5px solid var(--border2)',
              background: 'transparent', color: 'var(--primary-light)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Sign In
          </motion.button>
          <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/register')}
            style={{
              padding: '9px 20px', borderRadius: 11, border: 'none',
              background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(124,58,237,0.40)',
            }}
          >
            Get Started Free →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative', zIndex: 1,
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 18px 6px 8px', borderRadius: 99,
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.30)',
              marginBottom: 32, cursor: 'default',
            }}
          >
            <span style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', color:'#fff', padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:800 }}>✨ NEW</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Gemini 2.0 Flash AI · Now in Egypt</span>
          </motion.div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 84px)', fontWeight: 900,
            fontFamily: 'var(--font-head)', letterSpacing: '-0.05em', lineHeight: 1.05,
            marginBottom: 28, maxWidth: 900, margin: '0 auto 28px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #fff 20%, #A78BFA 60%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Learn Smarter.<br />Score Higher.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text2)', lineHeight: 1.7,
            maxWidth: 600, margin: '0 auto 48px',
          }}>
            The all-in-one AI-powered platform for Egyptian students & teachers.
            Personalized tutoring, smart study plans, real-time collaboration — in Arabic & English.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '16px 36px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
                color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.50)',
              }}
            >
              Start Learning Free →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '16px 32px', borderRadius: 16,
                border: '1.5px solid var(--border2)',
                background: 'rgba(124,58,237,0.10)',
                color: 'var(--primary-light)', fontWeight: 700, fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Sign In
            </motion.button>
          </div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
          >
            <div style={{ display: 'flex' }}>
              {['🧑‍🎓','👩‍🎓','👨‍🎓','👩‍🏫','🧑‍💻'].map((e,i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface3)', border: '2px solid var(--ink)',
                  marginLeft: i === 0 ? 0 : -10, zIndex: 5-i,
                }}>{e}</div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--text)' }}>5,000+</strong> students already learning
            </span>
            <span style={{ color: '#FBBF24', fontSize: 14 }}>★★★★★</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          borderRadius: 28, padding: '48px 24px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
          boxShadow: 'var(--shadow-lg), var(--glow)',
        }}>
          <Counter target={5000} suffix="+" label="Active Students" icon="🎓" />
          <Counter target={50000} suffix="+" label="AI Chat Sessions" icon="🤖" />
          <Counter target={12} suffix=" Subjects" label="Egyptian Curriculum" icon="📚" />
          <Counter target={98} suffix="%" label="Student Satisfaction" icon="⭐" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--primary-light)', marginBottom: 14 }}>
            EVERYTHING YOU NEED
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900,
            fontFamily: 'var(--font-head)', letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #fff 30%, var(--primary-light) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 16,
          }}>
            Built for Egyptian Students
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 560, margin: '0 auto' }}>
            From Primary 1 to University — Najah covers the complete Egyptian Ministry of Education curriculum.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px', maxWidth: 800, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent-cyan)', marginBottom: 14 }}>
            STUDENT STORIES
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #fff 30%, var(--accent-cyan) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Real Results, Real Students
          </h2>
        </motion.div>
        <TestimonialCarousel />
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 48px 120px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          style={{
            maxWidth: 800, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.20) 0%, rgba(6,182,212,0.10) 100%)',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 32, padding: '60px 48px',
            boxShadow: '0 0 80px rgba(124,58,237,0.20)',
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 20 }}>🚀</div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, fontFamily: 'var(--font-head)',
            letterSpacing: '-0.04em', marginBottom: 16,
            background: 'linear-gradient(135deg, #fff 30%, var(--primary-light) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Ready to Excel?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 36, lineHeight: 1.7 }}>
            Join thousands of Egyptian students transforming their learning with AI.
            Free forever. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '18px 44px', borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#7C3AED,#5B21B6)',
                color: '#fff', fontWeight: 800, fontSize: 18, cursor: 'pointer',
                fontFamily: 'var(--font-head)', letterSpacing: '-0.01em',
                boxShadow: '0 8px 40px rgba(124,58,237,0.60)',
              }}
            >
              Start for Free — It's Fast →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)',
        padding: '32px 48px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <LogoMark size={24} />
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>Najah</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          © 2026 Najah Platform · Built with ❤️ for Egyptian Students · Powered by Google Gemini AI
        </p>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .landing-nav-desktop { display: none !important; }
        }
        @media (max-width: 640px) {
          [class*="landing"] nav { padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
}
