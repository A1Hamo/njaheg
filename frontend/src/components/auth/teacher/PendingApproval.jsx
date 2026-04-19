import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../../i18n/index';

const CHECKLIST = [
  { ar: 'المعلومات الشخصية',   en: 'Personal information',    done: true },
  { ar: 'المعلومات المهنية',    en: 'Professional details',    done: true },
  { ar: 'ربط المؤسسة',         en: 'Institution linked',       done: true },
  { ar: 'المراجعة من الإدارة',  en: 'Admin review (pending)',   done: false },
  { ar: 'تفعيل الحساب',         en: 'Account activation',       done: false },
];

export default function PendingApproval() {
  const { t, lang } = useTranslation();
  const navigate     = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--page-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      <div style={{ width: '100%', maxWidth: 540, textAlign: 'center' }}>

        {/* ── Animated Hourglass ── */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 88, marginBottom: 32, display: 'block' }}
        >
          ⏳
        </motion.div>

        {/* ── Title ── */}
        <h1 style={{ fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>
          {t('teacherReg.pendingTitle')}
        </h1>
        <p style={{
          fontSize: 15, color: 'var(--text3)', lineHeight: 1.8,
          maxWidth: 400, margin: '0 auto 40px',
        }}>
          {t('teacherReg.pendingMessage')}
        </p>

        {/* ── Checklist card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 28,
            boxShadow: 'var(--shadow-md)',
            marginBottom: 28,
          }}
        >
          <div style={{
            fontSize: 12, fontWeight: 800, color: 'var(--text4)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            marginBottom: 18, textAlign: lang === 'ar' ? 'right' : 'left',
          }}>
            {lang === 'ar' ? 'حالة الطلب' : 'Application Status'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHECKLIST.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: item.done ? 'rgba(16,185,129,0.05)' : 'var(--surface3)',
                  border: `1px solid ${item.done ? 'rgba(16,185,129,0.15)' : 'var(--border)'}`,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.done ? 'var(--success)' : 'var(--surface4)',
                  color: item.done ? '#fff' : 'var(--text4)',
                  fontSize: 14, fontWeight: 800, flexShrink: 0,
                }}>
                  {item.done ? '✓' : (i + 1)}
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: item.done ? 'var(--success-dark)' : 'var(--text2)',
                  flex: 1, textAlign: lang === 'ar' ? 'right' : 'left',
                }}>
                  {lang === 'ar' ? item.ar : item.en}
                </span>
                {!item.done && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(245,158,11,0.12)', color: 'var(--warning)',
                      border: '1px solid rgba(245,158,11,0.22)',
                    }}
                  >
                    {lang === 'ar' ? 'قيد المراجعة' : 'Pending'}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Estimated time ── */}
        <div style={{
          fontSize: 13, color: 'var(--text3)', marginBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span>🕐</span>
          <span>
            {lang === 'ar'
              ? 'الوقت المتوقع للمراجعة: ٢٤–٤٨ ساعة'
              : 'Estimated review time: 24–48 hours'}
          </span>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              height: 44, padding: '0 28px', borderRadius: 12,
              background: 'var(--primary)', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {lang === 'ar' ? '🔑 تسجيل الدخول' : '🔑 Sign In'}
          </button>
          <button
            onClick={() => navigate('/welcome')}
            style={{
              height: 44, padding: '0 28px', borderRadius: 12,
              background: 'var(--surface)', color: 'var(--text2)',
              border: '1.5px solid var(--border2)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {lang === 'ar' ? '🏠 الصفحة الرئيسية' : '🏠 Home'}
          </button>
        </div>

      </div>
    </div>
  );
}
