import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/index';

export default function StudentProfile() {
  const { lang } = useTranslation();
  const isAr = lang === 'ar';
  const { groupId, studentId } = useParams();
  const navigate = useNavigate();

  // Mocked rich data for MVP (would normally fetch from API)
  const student = {
    id: studentId,
    name: 'Ahmed Khaled',
    email: 'ahmed.khaled@najah.edu',
    joinedAt: '2025-09-01T10:00:00Z',
    guardianContact: '01012345678',
    stats: {
      attendance: 92,
      assignmentsCompleted: 14,
      totalAssignments: 15,
      averageGrade: 88.5,
      xp: 4200,
    },
    recentActivity: [
      { id: 1, type: 'submission', title: 'Calculus Quiz 3', date: '2026-04-10T14:30:00Z', score: '95/100' },
      { id: 2, type: 'attendance', title: 'Live Session: Limits', date: '2026-04-09T09:00:00Z', score: isAr ? 'حاضر' : 'Present' },
      { id: 3, type: 'submission', title: 'Chapter 2 Homework', date: '2026-04-05T20:15:00Z', score: '82/100' },
    ]
  };

  const statCardProps = {
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    style: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', direction: isAr ? 'rtl' : 'ltr' }}>
      <button onClick={() => navigate(`/groups/${groupId}?tab=members`)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '24px' }}>
        {isAr ? 'العودة إلى الأعضاء →' : '← Back to Members'}
      </button>

      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)', border: '1px solid var(--border)', borderRadius: '32px', padding: '40px', display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
         <div style={{ width: '120px', height: '120px', borderRadius: '32px', background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 900 }}>
           {student.name.charAt(0)}
         </div>
         <div style={{ flex: 1 }}>
           <h1 style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: '8px' }}>{student.name}</h1>
           <div style={{ display: 'flex', gap: '16px', color: 'var(--text2)', fontSize: '14px', fontWeight: 600 }}>
             <span>📧 {student.email}</span>
             <span>📞 {isAr ? 'ولي الأمر:' : 'Guardian:'} {student.guardianContact}</span>
           </div>
         </div>
         <div>
           <button style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--primary-600)', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
             {isAr ? 'مراسلة الطالب' : 'Message Student'}
           </button>
         </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <motion.div {...statCardProps} transition={{ delay: 0.1 }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)' }}>{student.stats.averageGrade}%</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{isAr ? 'متوسط الدرجات' : 'Avg Grade'}</div>
        </motion.div>
        <motion.div {...statCardProps} transition={{ delay: 0.15 }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)' }}>{student.stats.assignmentsCompleted}/{student.stats.totalAssignments}</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{isAr ? 'التكاليف' : 'Assignments'}</div>
        </motion.div>
        <motion.div {...statCardProps} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)' }}>{student.stats.attendance}%</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{isAr ? 'الحضور' : 'Attendance'}</div>
        </motion.div>
        <motion.div {...statCardProps} transition={{ delay: 0.25 }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⭐</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary-500)' }}>{student.stats.xp.toLocaleString()}</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{isAr ? 'إجمالي النقاط' : 'Total XP'}</div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Recent Activity */}
        <motion.div {...statCardProps} transition={{ delay: 0.3 }} style={{ ...statCardProps.style, padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '24px' }}>{isAr ? 'النشاط الأخير' : 'Recent Activity'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {student.recentActivity.map(act => (
              <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--surface2)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: act.type === 'submission' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: act.type === 'submission' ? '#3B82F6' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {act.type === 'submission' ? '📤' : '✅'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '14px' }}>{act.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Date(act.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--text)' }}>{act.score}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Private Notes */}
        <motion.div {...statCardProps} transition={{ delay: 0.4 }} style={{ ...statCardProps.style, padding: '32px', background: 'var(--surface2)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>{isAr ? 'ملاحظات المعلم الخاصة' : 'Private Teacher Notes'}</h3>
          <textarea 
            placeholder={isAr ? "أضف ملاحظة خاصة حول تقدم هذا الطالب أو سلوكه..." : "Add a private note about this student's progress or behavior..."}
            rows={8}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', resize: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <button style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--text)', color: 'var(--surface)', fontWeight: 700, marginTop: '16px', border: 'none', cursor: 'pointer' }}>
            {isAr ? 'حفظ الملاحظة' : 'Save Note'}
          </button>
        </motion.div>
      </div>

    </div>
  );
}
