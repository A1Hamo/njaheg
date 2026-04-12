// src/components/auth/AuthPages.jsx — Professional v3
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/index';
import { useAuthStore } from '../../context/store';
import { Btn, Input, Spinner, Divider } from '../shared/UI';

const STUDENT_GRADES = [
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
  'Prep 1','Prep 2','Prep 3','Sec 1','Sec 2','Sec 3',
  'Year 1','Year 2','Year 3','Year 4','Year 5','Year 6',
  'Postgrad',
];

const TEACHER_SUBJECTS = [
  'Mathematics','Science','Arabic','English','Physics',
  'Chemistry','Biology','History','Geography','Computer Science',
  'Art','Physical Education','Philosophy','Economics',
];

/* ── SVG Icons ───────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const SchoolIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);
const LogoMark = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <defs>
      <linearGradient id="auth-logo-g" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect width="44" height="44" rx="14" fill="url(#auth-logo-g)"/>
    <path d="M13 32 L22 12 L31 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 26 L28 26" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="22" cy="12" r="2.5" fill="#fff"/>
  </svg>
);

/* ── Background Scene ────────────────────────────────────── */
function AuthScene() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {/* Layered orbs */}
      {[
        { x: '-8%',  y: '-12%', c: 'rgba(124,58,237,0.18)',  s: 700, dur: 20 },
        { x: '68%',  y: '55%',  c: 'rgba(6,182,212,0.10)',   s: 500, dur: 16 },
        { x: '80%',  y: '-8%',  c: 'rgba(244,63,94,0.07)',   s: 400, dur: 24 },
        { x: '20%',  y: '70%',  c: 'rgba(124,58,237,0.07)',  s: 350, dur: 18 },
      ].map((o, i) => (
        <motion.div key={i}
          style={{
            position: 'absolute', left: o.x, top: o.y,
            width: o.s, height: o.s, borderRadius: '50%',
            background: `radial-gradient(circle, ${o.c}, transparent 68%)`,
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.12, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.2,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>

      {/* Bottom gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(to top, var(--ink) 0%, transparent 100%)',
      }}/>
    </div>
  );
}

/* ── Split Layout ────────────────────────────────────────── */
function AuthLayout({ children, wide = false }) {
  return (
    <div style={{
      minHeight: '100vh', minHeight: '100dvh',
      display: 'flex', position: 'relative',
    }}>
      <AuthScene />

      {/* Left panel — brand showcase */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', zIndex: 1,
        borderRight: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
      }}
      className="auth-left-panel"
      >
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <LogoMark />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: 'var(--text)' }}>Najah</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Smart Learning</div>
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 20,
            background: 'linear-gradient(135deg, #fff 30%, var(--primary-light) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Learn Smarter,<br />Achieve More.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 400, marginBottom: 48 }}>
            The all-in-one AI-powered platform built for Egyptian students — study tools, exams, real-time chat, and personalized analytics.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '🤖', label: 'AI Tutor', desc: 'Egyptian curriculum expert' },
              { icon: '📅', label: 'Smart Planner', desc: 'Personalized study schedules' },
              { icon: '📊', label: 'Deep Analytics', desc: 'Track every learning metric' },
              { icon: '💬', label: 'Community', desc: 'Real-time group & private chat' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: wide ? '55%' : '480px', maxWidth: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1, margin: '0 auto',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          style={{
            width: '100%', maxWidth: 440,
            background: 'rgba(13,13,26,0.7)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(124,58,237,0.22)',
            borderRadius: 24,
            padding: '36px 32px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 80px rgba(124,58,237,0.08)',
          }}
        >
          {children}
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 960px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Google icon ─────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ════════════════════════════════════════════════════════
   LoginPage
   ════════════════════════════════════════════════════════ */
export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const onSubmit = async d => {
    try {
      const { data } = await authAPI.login(d);
      setAuth(data);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to sign in. Check your credentials.');
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5 }}
          style={{ display: 'inline-block', marginBottom: 14 }}>
          <LogoMark />
        </motion.div>
        <h1 style={{
          fontSize: 26, fontWeight: 800,
          fontFamily: 'var(--font-head)', letterSpacing: '-0.03em',
          marginBottom: 6,
          background: 'linear-gradient(135deg, #fff 40%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Sign in to continue your learning journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Email Address" type="email"
          icon={<MailIcon />}
          placeholder="student@email.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+/, message: 'Invalid email address' } })}
          autoComplete="email"
        />
        <Input
          label="Password" type={showPwd ? 'text' : 'password'}
          icon={<LockIcon />}
          placeholder="••••••••"
          error={errors.password?.message}
          rightIcon={showPwd ? <EyeOff /> : <EyeOpen />}
          onRightIconClick={() => setShowPwd(v => !v)}
          {...register('password', { required: 'Password is required' })}
          autoComplete="current-password"
        />

        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary-light)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <Btn type="submit" variant="primary" size="lg" loading={isSubmitting}
          style={{ width: '100%', marginTop: 4, borderRadius: 13 }}>
          Sign In →
        </Btn>
      </form>

      <Divider label="or continue with" margin={20} />

      {/* OAuth */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={() => authAPI.googleLogin()}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, color: 'var(--text)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s var(--ease)',
          }}
        >
          <GoogleIcon /> Continue with Google
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
          onClick={async () => {
            try {
              const { data } = await authAPI.guestRegister();
              setAuth(data);
              toast.success('Guest session started! Convert to full account anytime.');
              navigate('/');
            } catch (err) {
              toast.error(err.response?.data?.error || 'Could not start guest session');
            }
          }}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: 'var(--text2)', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s var(--ease)',
          }}
        >
          👤 Continue as Guest
        </motion.button>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text3)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
          Create account →
        </Link>
      </p>
    </AuthLayout>
  );
}

/* ════════════════════════════════════════════════════════
   RegisterPage
   ════════════════════════════════════════════════════════ */
export function RegisterPage() {
  const [showPwd,  setShowPwd]  = useState(false);
  const [grade,    setGrade]    = useState('');
  const [role,     setRole]     = useState('student');   // 'student' | 'teacher'
  const [instType, setInstType] = useState('school');    // 'school' | 'college' | 'university'
  const [subjects, setSubjects] = useState([]);          // teacher subject multi-select
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const toggleSubject = s => setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const onSubmit = async d => {
    if (role === 'student' && !grade) { toast.error('Please select your grade/year level'); return; }
    if (role === 'teacher' && subjects.length === 0) { toast.error('Please select at least one subject you teach'); return; }
    try {
      const payload = {
        ...d,
        role,
        institutionType: instType,
        grade: role === 'student' ? grade : undefined,
        subjects: role === 'teacher' ? subjects.join(',') : undefined,
      };
      const { data } = await authAPI.register(payload);
      setAuth(data);
      toast.success(`Welcome to Najah! 🎉 ${role === 'teacher' ? 'Teacher account created.' : 'Your journey begins now.'}`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to create account');
    }
  };

  const INST_OPTIONS = [
    { value:'school',     label:'School',     icon:'🏡', desc:'K-12 education' },
    { value:'college',    label:'College',    icon:'🏗️', desc:'Higher diploma / college' },
    { value:'university', label:'University', icon:'🎓', desc:'University degree' },
  ];

  return (
    <AuthLayout wide>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ display: 'inline-block', marginBottom: 12 }}><LogoMark /></div>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', marginBottom: 5,
          background: 'linear-gradient(135deg, #fff 40%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Join Najah</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Create your account to get started</p>
      </div>

      {/* Role selector */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 10 }}>I am a…</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[{ value:'student', icon:'🎓', label:'Student', desc:'Learning & growing' },
            { value:'teacher', icon:'👨‍🏫', label:'Teacher', desc:'Teaching & managing' }].map(r => (
            <motion.button key={r.value} type="button" onClick={() => setRole(r.value)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '14px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                border: '2px solid',
                borderColor: role === r.value
                  ? (r.value === 'teacher' ? '#0EA5E9' : 'var(--primary)')
                  : 'var(--border)',
                background: role === r.value
                  ? (r.value === 'teacher' ? 'rgba(14,165,233,0.10)' : 'rgba(124,58,237,0.10)')
                  : 'var(--surface)',
                transition: 'all 0.18s var(--ease)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 5 }}>{r.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Full Name" required icon={<UserIcon />} placeholder={role === 'teacher' ? 'Ahmed Mohamed (Teacher)' : 'Your full name'}
          error={errors.name?.message}
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name too short' } })}
          autoComplete="name"
        />
        <Input label="Email Address" type="email" required icon={<MailIcon />} placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+/, message: 'Invalid email' } })}
          autoComplete="email"
        />
        <Input label="Password" type={showPwd ? 'text' : 'password'} required icon={<LockIcon />} placeholder="Minimum 8 characters"
          error={errors.password?.message}
          rightIcon={showPwd ? <EyeOff /> : <EyeOpen />}
          onRightIconClick={() => setShowPwd(v => !v)}
          {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
          autoComplete="new-password"
        />

        {/* Institution type */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Institution Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {INST_OPTIONS.map(o => (
              <motion.button key={o.value} type="button" onClick={() => setInstType(o.value)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                style={{
                  padding: '10px 6px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${instType === o.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: instType === o.value ? 'rgba(124,58,237,0.10)' : 'var(--surface)',
                  transition: 'all 0.15s var(--ease)', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 3 }}>{o.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: instType === o.value ? 'var(--primary-light)' : 'var(--text2)' }}>{o.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <Input label={`${role === 'teacher' ? 'School / College Name' : 'Institution'} (optional)`} icon={<SchoolIcon />}
          placeholder={instType === 'university' ? 'e.g. Cairo University' : instType === 'college' ? 'e.g. Alexandria College' : 'e.g. Al-Azhar School'}
          {...register('institution')}
        />

        {/* Student: grade picker */}
        {role === 'student' && (
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Grade / Year Level <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {STUDENT_GRADES.map(g => (
                <motion.button key={g} type="button" onClick={() => setGrade(g)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '7px 4px', borderRadius: 9, fontSize: 10.5, fontWeight: 600,
                    border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s var(--ease)',
                    background: grade === g ? 'linear-gradient(135deg,var(--primary),var(--brand-600))' : 'var(--surface)',
                    borderColor: grade === g ? 'var(--primary)' : 'var(--border)',
                    color: grade === g ? '#fff' : 'var(--text3)',
                    boxShadow: grade === g ? 'var(--glow)' : 'none',
                  }}
                >{g}</motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Teacher: subjects picker */}
        {role === 'teacher' && (
          <div>
            <label style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Subjects You Teach <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TEACHER_SUBJECTS.map(s => (
                <motion.button key={s} type="button" onClick={() => toggleSubject(s)}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    padding: '6px 12px', borderRadius: 9, fontSize: 11.5, fontWeight: 600,
                    border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: subjects.includes(s) ? 'rgba(14,165,233,0.14)' : 'var(--surface)',
                    borderColor: subjects.includes(s) ? '#0EA5E9' : 'var(--border)',
                    color: subjects.includes(s) ? '#38BDF8' : 'var(--text3)',
                  }}
                >{s}</motion.button>
              ))}
            </div>
          </div>
        )}

        <Btn type="submit" variant="primary" size="lg" loading={isSubmitting}
          style={{ width: '100%', marginTop: 8, borderRadius: 13,
            background: role === 'teacher' ? 'linear-gradient(135deg,#0EA5E9,#0369A1)' : undefined,
          }}>
          {role === 'teacher' ? '👨‍🏫 Create Teacher Account →' : 'Create Student Account →'}
        </Btn>
      </form>

      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: 'var(--text3)' }}>
        By creating an account you agree to our{' '}
        <span style={{ color: 'var(--primary-light)', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>{' '}and{' '}
        <span style={{ color: 'var(--primary-light)', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>.
      </p>
      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--text3)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Sign in →</Link>
      </p>
    </AuthLayout>
  );
}

/* ════════════════════════════════════════════════════════
   ForgotPasswordPage
   ════════════════════════════════════════════════════════ */
export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async d => {
    try {
      await authAPI.forgotPassword(d.email);
      setSent(true);
    } catch {
      setSent(true); // Don't reveal if email exists
    }
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 16px',
        }}>
          🔑
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 800,
          fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', marginBottom: 5,
          background: 'linear-gradient(135deg, #fff 40%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Reset Password
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>
          {sent ? 'Check your email inbox' : "We'll send you a secure reset link"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '10px 0' }}
          >
            <div style={{
              width: 72, height: 72, borderRadius: 999,
              background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto 20px',
            }}>
              ✓
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              If that email is registered, a reset link has been sent. Check your inbox and spam folder.
            </p>
            <Link to="/login">
              <Btn variant="primary" size="md" style={{ width: '100%', borderRadius: 12 }}>
                ← Back to Sign In
              </Btn>
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <Input
              label="Email Address" type="email"
              icon={<MailIcon />} placeholder="your@email.com"
              {...register('email', { required: 'Email is required' })}
              autoComplete="email"
            />
            <Btn type="submit" variant="primary" size="lg" loading={isSubmitting}
              style={{ width: '100%', borderRadius: 13 }}>
              Send Reset Link →
            </Btn>
            <Link to="/login" style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              ← Back to sign in
            </Link>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

/* ════════════════════════════════════════════════════════
   AuthCallback
   ════════════════════════════════════════════════════════ */
export function AuthCallback() {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const refresh = params.get('refresh');

    if (token) {
      setAuth({ token, refresh });
      authAPI.me()
        .then(({ data }) => { setAuth({ user: data.user, token, refresh }); navigate('/', { replace: true }); })
        .catch(() => navigate('/login', { replace: true }));
    } else {
      navigate('/login', { replace: true });
    }
  }, [setAuth, navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <LogoMark />
      <Spinner size="lg" />
      <p style={{ color: 'var(--text3)', fontSize: 14 }}>Completing sign in…</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   ResetPasswordPage
   ════════════════════════════════════════════════════════ */
import { useParams } from 'react-router-dom';

export function ResetPasswordPage() {
  const { token } = useParams();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async d => {
    if (d.password !== d.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authAPI.resetPassword({ token, password: d.password });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password. Link may be expired.');
    }
  };

  return (
    <AuthLayout>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 16px',
        }}>
          🛡️
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 800,
          fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', marginBottom: 5,
          background: 'linear-gradient(135deg, #fff 40%, var(--primary-light) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          New Password
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>
          Enter a new secure password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="New Password" type={showPwd ? 'text' : 'password'}
          icon={<LockIcon />} placeholder="Minimum 8 characters"
          error={errors.password?.message}
          rightIcon={showPwd ? <EyeOff /> : <EyeOpen />}
          onRightIconClick={() => setShowPwd(v => !v)}
          {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
        />
        <Input
          label="Confirm Password" type={showPwd ? 'text' : 'password'}
          icon={<LockIcon />} placeholder="Re-enter password"
          error={errors.confirm?.message}
          {...register('confirm', { required: 'Please confirm password' })}
        />
        <Btn type="submit" variant="primary" size="lg" loading={isSubmitting}
          style={{ width: '100%', borderRadius: 13, background: 'linear-gradient(135deg, #10B981, #047857)' }}>
          Secure My Account →
        </Btn>
        <Link to="/login" style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          ← Cancel
        </Link>
      </form>
    </AuthLayout>
  );
}
