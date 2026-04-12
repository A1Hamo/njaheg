// src/components/auth/AuthPages.jsx — Najah v6 — Split Role Auth
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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

/* ── Dynamic Logo ────────────────────────────────────────── */
const LogoMark = ({ role = 'student' }) => {
  const isTeacher = role === 'teacher';
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id={`auth-logo-${role}`} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isTeacher ? '#0891B2' : '#6366F1'}/>
          <stop offset="100%" stopColor={isTeacher ? '#06B6D4' : '#A5B4FC'}/>
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="14" fill={`url(#auth-logo-${role})`}/>
      {isTeacher ? (
        <>
          <rect x="12" y="14" width="20" height="14" rx="2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 32 L28 32 M22 28 L22 32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M13 32 L22 12 L31 32" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 26 L28 26" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="22" cy="12" r="2.5" fill="#fff"/>
        </>
      )}
    </svg>
  );
};

/* ── Dynamic Background Scene ────────────────────────────── */
function AuthScene({ role = 'student' }) {
  const isTeacher = role === 'teacher';
  const color1 = isTeacher ? 'rgba(8, 145, 178, 0.15)' : 'rgba(99, 102, 241, 0.15)';
  const color2 = isTeacher ? 'rgba(6, 182, 212, 0.10)' : 'rgba(165, 180, 252, 0.10)';

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {[
        { x: '-8%',  y: '-12%', c: color1, s: 700, dur: 20 },
        { x: '68%',  y: '55%',  c: color2, s: 500, dur: 16 },
        { x: '20%',  y: '70%',  c: color1, s: 350, dur: 18 },
      ].map((o, i) => (
        <motion.div key={i}
          animate={{ background: `radial-gradient(circle, ${o.c}, transparent 68%)` }}
          style={{
            position: 'absolute', left: o.x, top: o.y,
            width: o.s, height: o.s, borderRadius: '50%',
            filter: 'blur(60px)',
          }}
          transition={{ duration: 1 }}
        />
      ))}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'linear-gradient(rgba(100,116,172,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,172,0.08) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
    </div>
  );
}

/* ── Split Layout ────────────────────────────────────────── */
function AuthLayout({ children, wide = false, role = 'student', setRole }) {
  const isTeacher = role === 'teacher';

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', position: 'relative' }}>
      <AuthScene role={role} />

      {/* Left panel — Role Specific Showcase */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 64px', position: 'relative', zIndex: 1,
        borderRight: '1px solid var(--border)',
        background: isTeacher
          ? 'linear-gradient(135deg, rgba(8,145,178,0.06) 0%, transparent 100%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
        transition: 'background 0.4s ease'
      }} className="auth-left-panel">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 50 }}>
            <LogoMark role={role} />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: 'var(--text)' }}>Najah</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {isTeacher ? 'Teacher Portal' : 'Student Portal'}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={role} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h1 style={{
                fontFamily: 'var(--font-head)', fontSize: 44, fontWeight: 800,
                letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 20,
                background: isTeacher
                  ? 'linear-gradient(135deg, var(--text) 30%, #06B6D4 100%)'
                  : 'linear-gradient(135deg, var(--text) 30%, #818CF8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {isTeacher ? <><span style={{display:'block'}}>Empower Your</span> Students.</> : <><span style={{display:'block'}}>Learn Smarter,</span> Achieve More.</>}
              </h1>
              <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 400, marginBottom: 48 }}>
                {isTeacher
                  ? "The complete classroom management platform. Track student progress, host interactive quizzes, and leverage AI to plan lessons effortlessly."
                  : "The all-in-one AI-powered platform built for Egyptian students — study tools, exams, real-time chat, and personalized analytics."}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(isTeacher ? [
                  { icon: '📊', label: 'Class Analytics', desc: 'Monitor progress instantly' },
                  { icon: '🧠', label: 'AI Lesson Planner', desc: 'Create study plans in seconds' },
                  { icon: '📝', label: 'Automated Quizzes', desc: 'Generate & grade MCQ easily' },
                ] : [
                  { icon: '🤖', label: 'AI Tutor', desc: 'Egyptian curriculum expert' },
                  { icon: '📅', label: 'Smart Planner', desc: 'Personalized study schedules' },
                  { icon: '💬', label: 'Community', desc: 'Real-time group & private chat' },
                ]).map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 11,
                      background: isTeacher ? 'rgba(8,145,178,0.1)' : 'rgba(99,102,241,0.1)',
                      border: '1px solid',
                      borderColor: isTeacher ? 'rgba(8,145,178,0.2)' : 'rgba(99,102,241,0.2)',
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
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right panel — Form */}
      <div style={{
        width: wide ? '55%' : '500px', maxWidth: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1, margin: '0 auto',
      }}>
        {/* Top Role Switcher (Mobile & Desktop) */}
        {!setRole ? null : (
          <div style={{
            display: 'flex', background: 'var(--surface2)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 32, width: '100%', maxWidth: 360
          }}>
            {['student', 'teacher'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 8,
                background: role === r ? (r === 'teacher' ? 'var(--teacher)' : 'var(--student)') : 'transparent',
                color: role === r ? '#fff' : 'var(--text3)',
                textTransform: 'capitalize', transition: 'all 0.2s', boxShadow: role === r ? 'var(--shadow-sm)' : 'none'
              }}>
                {r === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
              </button>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 440 }}
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

/* ────────────────────────────────────────────────────────
   LoginPage
   ──────────────────────────────────────────────────────── */
export function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState('student');
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
    <AuthLayout role={role} setRole={setRole}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--text)' }}>
          Welcome Back {role === 'teacher' ? 'Professor' : ''}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Sign in to continue to your dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Email Address" type="email" icon={<MailIcon />}
          placeholder={role === 'teacher' ? "mr.ahmed@school.edu" : "student@email.com"}
          error={errors.email?.message}
          {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+/, message: 'Invalid email' } })}
        />
        <Input
          label="Password" type={showPwd ? 'text' : 'password'} icon={<LockIcon />} placeholder="••••••••"
          error={errors.password?.message}
          rightIcon={showPwd ? <EyeOff /> : <EyeOpen />}
          onRightIconClick={() => setShowPwd(v => !v)}
          {...register('password', { required: 'Password is required' })}
        />

        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link to="/forgot-password" style={{ fontSize: 12, color: role==='teacher'?'var(--teacher)':'var(--student)', fontWeight: 600 }}>
            Forgot password?
          </Link>
        </div>

        <Btn type="submit" loading={isSubmitting} size="lg"
          style={{ width: '100%', marginTop: 4, borderRadius: 12, background: role==='teacher'?'var(--teacher)':'var(--student)', color: '#fff', border: 'none' }}>
          Sign In →
        </Btn>
      </form>

      <Divider label="or continue with" margin={24} />

      <motion.button onClick={() => authAPI.googleLogin()}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <GoogleIcon /> Continue with Google
      </motion.button>

      {role === 'student' && (
        <motion.button onClick={async () => {
          try {
            const { data } = await authAPI.guestRegister();
            setAuth(data);
            navigate('/');
          } catch { toast.error('Error starting guest session'); }
        }}
        style={{ width: '100%', marginTop: 12, padding: '12px', background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Continue as Guest
        </motion.button>
      )}

      <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--text3)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: role==='teacher'?'var(--teacher)':'var(--student)', fontWeight: 700 }}>
          Create account →
        </Link>
      </p>
    </AuthLayout>
  );
}

/* ────────────────────────────────────────────────────────
   RegisterPage
   ──────────────────────────────────────────────────────── */
export function RegisterPage() {
  const [showPwd,  setShowPwd]  = useState(false);
  const [role,     setRole]     = useState('student');
  const [grade,    setGrade]    = useState('');
  const [instType, setInstType] = useState('school');
  const [subjects, setSubjects] = useState([]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  const toggleSubject = s => setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const onSubmit = async d => {
    if (role === 'student' && !grade) { toast.error('Please select your grade/year level'); return; }
    if (role === 'teacher' && subjects.length === 0) { toast.error('Please select at least one subject'); return; }
    try {
      const payload = {
        ...d, role, institutionType: role === 'teacher' ? instType : 'school',
        grade: role === 'student' ? grade : undefined,
        subjects: role === 'teacher' ? subjects.join(',') : undefined,
      };
      const { data } = await authAPI.register(payload);
      setAuth(data);
      toast.success(role === 'teacher' ? 'Welcome, Professor! 🎉' : 'Your learning journey begins! 🎓');
      navigate('/');
    } catch (err) { toast.error(err.response?.data?.error || 'Unable to register'); }
  };

  return (
    <AuthLayout role={role} setRole={setRole}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', marginBottom: 5, color: 'var(--text)' }}>
          Join Najah 🚀
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Register to unlock the full {role} experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name" required icon={<UserIcon />} placeholder={role === 'teacher' ? 'Your full name (e.g. Mr. Ahmed)' : 'Your full name'} {...register('name', { required: true })} />
        <Input label="Email Address" type="email" required icon={<MailIcon />} placeholder="your@email.com" {...register('email', { required: true })} />
        <Input label="Password" type={showPwd ? 'text' : 'password'} required icon={<LockIcon />} placeholder="Minimum 8 chars" rightIcon={showPwd ? <EyeOff /> : <EyeOpen />} onRightIconClick={() => setShowPwd(v => !v)} {...register('password', { required: true, minLength: 8 })} />

        {role === 'student' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Current Grade *</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} required style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: 10, color: 'var(--text)', outline: 'none' }}>
              <option value="">Select your grade...</option>
              {STUDENT_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}

        {role === 'teacher' && (
          <div style={{ padding: '16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 12 }}>I teach... (Select all that apply) *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TEACHER_SUBJECTS.map(s => (
                <button type="button" key={s} onClick={() => toggleSubject(s)} style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
                  background: subjects.includes(s) ? 'var(--teacher)' : 'transparent',
                  color: subjects.includes(s) ? '#fff' : 'var(--text3)', border: `1px solid ${subjects.includes(s) ? 'var(--teacher)' : 'var(--border)'}`
                }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
               <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Institution Type</label>
               <select value={instType} onChange={e => setInstType(e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text)' }}>
                 <option value="school">School (K-12)</option>
                 <option value="college">College</option>
                 <option value="university">University</option>
               </select>
            </div>
          </div>
        )}

        <Btn type="submit" loading={isSubmitting} size="lg" style={{ marginTop: 8, borderRadius: 12, background: role==='teacher'?'var(--teacher)':'var(--student)', color: '#fff', border: 'none' }}>
          Create Account
        </Btn>
      </form>

      <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--text3)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: role==='teacher'?'var(--teacher)':'var(--student)', fontWeight: 700 }}>
          Sign in →
        </Link>
      </p>
    </AuthLayout>
  );
}

/* ────────────────────────────────────────────────────────
   Fallback standard components (Forgot/Reset PW)
   ──────────────────────────────────────────────────────── */
export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const onSubmit = async d => {
    toast.success('If the email is registered, you will receive a reset link shortly.');
    try { await authAPI.forgotPassword(d); } catch (e) {}
  };
  return (
    <AuthLayout role="student" setRole={null}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, textAlign: 'center' }}>Reset Password</h2>
      <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginBottom: 24 }}>Enter your email address to receive a recovery link.</p>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Email Address" type="email" icon={<MailIcon />} {...register('email', { required: true })} />
        <Btn type="submit" loading={isSubmitting} variant="primary">Send Link</Btn>
      </form>
      <div style={{ textAlign: 'center', marginTop: 20 }}><Link to="/login" style={{ fontSize: 13, color: 'var(--text2)' }}>← Back to login</Link></div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() { return <AuthLayout><h2 style={{color: 'var(--text)'}}>Reset Password (Sent via Email)</h2></AuthLayout>; }
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token) {
      localStorage.setItem('token', token);
      if (refresh) localStorage.setItem('refresh', refresh);
      
      authAPI.me()
        .then(res => {
          setAuth({ ...res.data.user, token, refresh });
          toast.success('Successfully logged in with Google!');
          navigate('/');
        })
        .catch(err => {
          console.error(err);
          toast.error('Unable to retrieve profile data.');
          navigate('/login');
        });
    } else {
      toast.error('Authentication failed. No token provided.');
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <AuthLayout role="student" setRole={null}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Spinner size="lg" />
        <h3 style={{ marginTop: 24, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          Authenticating with Google
        </h3>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text3)' }}>
          Please wait while we log you in securely...
        </p>
      </div>
    </AuthLayout>
  );
}
