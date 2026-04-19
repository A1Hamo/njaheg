import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../../i18n/index';
import toast from 'react-hot-toast';

/* ─── Step data ─────────────────────────────────────────── */
const STEPS = [
  { id: 1, key: 'step1Title', icon: '🏷️' },
  { id: 2, key: 'step2Title', icon: '👤' },
  { id: 3, key: 'step3Title', icon: '🎓' },
  { id: 4, key: 'step4Title', icon: '🏫' },
  { id: 5, key: 'step5Title', icon: '✅' },
];

const ACCOUNT_TYPES = [
  { id: 'school',     iconEmoji: '🏫', colorClass: 'blue',   popular: true },
  { id: 'university', iconEmoji: '🎓', colorClass: 'indigo', popular: false },
  { id: 'tutor',      iconEmoji: '👨‍🏫', colorClass: 'amber', popular: false },
];

const SUBJECTS_AR = [
  'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية',
  'اللغة الإنجليزية', 'التاريخ', 'الجغرافيا', 'العلوم', 'الحاسب الآلي',
  'التربية الإسلامية', 'الأحياء', 'الإحصاء', 'الفلسفة', 'علم النفس',
];

const EG_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'أسيوط', 'الأقصر', 'الإسماعيلية',
  'البحيرة', 'بني سويف', 'بورسعيد', 'سوهاج', 'الشرقية', 'الفيوم',
  'القليوبية', 'كفر الشيخ', 'المنيا', 'المنوفية', 'دمياط', 'الغربية',
  'السويس', 'أسوان', 'الواحات البحرية', 'مطروح', 'شمال سيناء',
];

export default function TeacherRegisterWizard() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({
    accountType:   '',
    fullName:      '',
    nationalId:    '',
    dob:           '',
    gender:        '',
    email:         '',
    phone:         '',
    specialization:'',
    subjects:      [],
    yearsExp:      '',
    qualification: '',
    institution:   '',
    centerName:    '',
    governorate:   '',
    sessionRate:   '',
  });

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const toggleSubject = (s) => {
    set('subjects', form.subjects.includes(s)
      ? form.subjects.filter(x => x !== s)
      : [...form.subjects, s]);
  };

  const canAdvance = () => {
    if (step === 1) return !!form.accountType;
    if (step === 2) return form.fullName.length > 2 && form.email.includes('@') && form.gender;
    if (step === 3) return form.subjects.length > 0 && form.yearsExp && form.qualification;
    if (step === 4) return form.accountType === 'tutor' ? (form.centerName && form.governorate) : !!form.institution;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1400)); // Simulate API call
      toast.success(lang === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Application submitted!');
      navigate('/teacher/pending');
    } catch {
      toast.error(t('errors.server'));
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    blue:   { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)', text: '#4338ca', active: '#6366f1' },
    indigo: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)', text: '#4338ca', active: '#6366f1' },
    amber:  { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#b45309', active: '#f59e0b' },
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--page-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', direction: lang === 'ar' ? 'rtl' : 'ltr',
    }}>
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(99,102,241,0.08)', padding: '8px 20px',
            borderRadius: 99, border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 13, fontWeight: 700, color: 'var(--blue-700)', marginBottom: 20,
          }}>
            🎓 {t('teacherReg.title')}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
            {t(`teacherReg.step${step}Title`)}
          </h1>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {STEPS.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: s.id === step ? 'var(--primary)' : s.id < step ? 'var(--success)' : 'var(--surface4)',
                color: s.id <= step ? '#fff' : 'var(--text4)',
                fontSize: 11, fontWeight: 800,
                transition: 'all 0.3s',
              }}>
                <span>{s.id < step ? '✓' : s.iconEmoji}</span>
                <span style={{ display: step === s.id ? 'inline' : 'none' }}>
                  {t(`teacherReg.step${s.id}Title`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step Card ── */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
            style={{
              background: 'var(--surface)', borderRadius: 24, padding: 40,
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
            }}
          >

            {/* Step 1: Account Type */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {ACCOUNT_TYPES.map(type => {
                  const c      = colorMap[type.colorClass];
                  const sel    = form.accountType === type.id;
                  const label  = t(`teacherReg.${type.id === 'school' ? 'schoolTeacher' : type.id === 'university' ? 'universityProf' : 'privateTutor'}`);
                  const desc   = t(`teacherReg.${type.id === 'school' ? 'schoolDesc' : type.id === 'university' ? 'universityDesc' : 'tutorDesc'}`);
                  return (
                    <div key={type.id}
                      onClick={() => set('accountType', type.id)}
                      style={{
                        padding: '22px 24px', borderRadius: 16, cursor: 'pointer',
                        border: `2px solid ${sel ? c.active : 'var(--border)'}`,
                        background: sel ? c.bg : 'var(--surface2)',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 20, position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: 36 }}>{type.iconEmoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: sel ? c.text : 'var(--text)', marginBottom: 4 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>{desc}</div>
                      </div>
                      {type.popular && (
                        <span style={{
                          position: 'absolute', top: 12, insetInlineEnd: 16,
                          background: 'var(--primary)', color: '#fff',
                          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                        }}>
                          {lang === 'ar' ? 'الأكثر شيوعًا' : 'Most Popular'}
                        </span>
                      )}
                      {sel && (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: c.active, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 13, flexShrink: 0,
                        }}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label={t('auth.fullName')} value={form.fullName} onChange={v => set('fullName', v)} placeholder={lang === 'ar' ? 'مثال: محمد أحمد علي' : 'e.g. Ahmed Mohamed'} />
                  <Field label={t('auth.email')} type="email" value={form.email} onChange={v => set('email', v)} placeholder="email@school.edu" />
                  <Field label={lang === 'ar' ? 'رقم الهاتف' : 'Phone'} type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+20 100 000 0000" />
                  <Field label={t('teacherReg.nationalId')} value={form.nationalId} onChange={v => set('nationalId', v)} placeholder={lang === 'ar' ? 'اختياري' : 'Optional'} />
                  <Field label={t('teacherReg.dateOfBirth')} type="date" value={form.dob} onChange={v => set('dob', v)} />
                </div>
                <div>
                  <label className="form-label">{t('teacherReg.gender')}</label>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {[{ val: 'male', label: t('teacherReg.male') }, { val: 'female', label: t('teacherReg.female') }].map(g => (
                      <label key={g.val} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 12,
                        border: `2px solid ${form.gender === g.val ? 'var(--primary)' : 'var(--border)'}`,
                        background: form.gender === g.val ? 'var(--blue-50)' : 'var(--surface2)',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                        color: form.gender === g.val ? 'var(--blue-700)' : 'var(--text2)',
                      }}>
                        <input type="radio" name="gender" value={g.val}
                          checked={form.gender === g.val}
                          onChange={() => set('gender', g.val)}
                          style={{ width: 'auto', height: 'auto', border: 'none' }} />
                        {g.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Professional Info */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="form-label">{t('teacherReg.subjects')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {SUBJECTS_AR.map(s => (
                      <button key={s}
                        onClick={() => toggleSubject(s)}
                        style={{
                          padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                          border: `1.5px solid ${form.subjects.includes(s) ? 'var(--primary)' : 'var(--border2)'}`,
                          background: form.subjects.includes(s) ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
                          color: form.subjects.includes(s) ? 'var(--blue-700)' : 'var(--text3)',
                          cursor: 'pointer', transition: 'all 0.18s',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SelectField label={t('teacherReg.qualification')} value={form.qualification} onChange={v => set('qualification', v)}
                    options={[
                      { val: 'diploma',  label: t('teacherReg.diploma') },
                      { val: 'bachelor', label: t('teacherReg.bachelor') },
                      { val: 'master',   label: t('teacherReg.master') },
                      { val: 'phd',      label: t('teacherReg.phd') },
                    ]}
                  />
                  <Field label={t('teacherReg.yearsExp')} type="number" value={form.yearsExp}
                    onChange={v => set('yearsExp', v)} placeholder="0" />
                  <Field label={t('teacherReg.specialization')} value={form.specialization}
                    onChange={v => set('specialization', v)} placeholder={lang === 'ar' ? 'مثال: رياضيات بحتة' : 'e.g. Pure Mathematics'} />
                </div>
              </div>
            )}

            {/* Step 4: Institution Linking */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {form.accountType === 'tutor' ? (
                  <>
                    <Field label={t('teacherReg.centerName')} value={form.centerName}
                      onChange={v => set('centerName', v)} placeholder={lang === 'ar' ? 'مثال: مركز نجاح التعليمي' : 'e.g. Najah Learning Center'} />
                    <SelectField label={t('teacherReg.location')} value={form.governorate}
                      onChange={v => set('governorate', v)}
                      options={EG_GOVERNORATES.map(g => ({ val: g, label: g }))}
                    />
                    <Field label={t('teacherReg.sessionRate')} type="number" value={form.sessionRate}
                      onChange={v => set('sessionRate', v)} placeholder="150" />
                  </>
                ) : (
                  <Field label={t('teacherReg.institution2')} value={form.institution}
                    onChange={v => set('institution', v)}
                    placeholder={t('teacherReg.searchInst')} />
                )}
                <div style={{
                  padding: '16px 20px', borderRadius: 14,
                  background: 'var(--blue-50)', border: '1px solid var(--blue-200)',
                  fontSize: 13, color: 'var(--blue-700)', lineHeight: 1.7,
                }}>
                  💡 {lang === 'ar'
                    ? 'إذا لم تجد مؤسستك في القائمة، يمكنك إدخال اسمها وسيتم إضافتها بعد المراجعة.'
                    : "If your institution isn't listed, type its name and we'll add it after review."}
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: t('auth.fullName'),             value: form.fullName },
                    { label: t('auth.email'),                value: form.email },
                    { label: t('teacherReg.nationality'),    value: 'مصري / Egyptian' },
                    { label: t('teacherReg.qualification'),  value: form.qualification },
                    { label: lang === 'ar' ? 'نوع الحساب'  : 'Account Type', value: form.accountType },
                    { label: lang === 'ar' ? 'الخبرة'       : 'Experience',   value: `${form.yearsExp} ${lang === 'ar' ? 'سنوات' : 'yrs'}` },
                    { label: lang === 'ar' ? 'المؤسسة'     : 'Institution', value: form.institution || form.centerName },
                    { label: lang === 'ar' ? 'المواضيع'    : 'Subjects', value: form.subjects.slice(0,3).join(' · ') + (form.subjects.length > 3 ? ` +${form.subjects.length - 3}` : '') },
                  ].map(row => (
                    <div key={row.label} style={{
                      padding: '14px 18px', borderRadius: 12,
                      background: 'var(--surface3)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        {row.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {row.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{
                  padding: '16px 20px', borderRadius: 14, margin: '8px 0',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: 13, color: '#059669', fontWeight: 600, lineHeight: 1.7,
                }}>
                  ✅ {lang === 'ar'
                    ? 'بعد الإرسال، سيتم مراجعة طلبك خلال ٤٨ ساعة وستصلك رسالة تأكيد على بريدك الإلكتروني.'
                    : 'After submission, your application will be reviewed within 48 hours and you\'ll receive a confirmation email.'}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{
              height: 44, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'var(--surface)', border: '1.5px solid var(--border2)',
              color: 'var(--text2)', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            ← {t('teacherReg.back')}
          </button>

          {step < 5 ? (
            <button
              onClick={() => canAdvance() && setStep(s => s + 1)}
              disabled={!canAdvance()}
              style={{
                height: 44, padding: '0 32px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: canAdvance() ? 'var(--primary)' : 'var(--surface4)',
                color: canAdvance() ? '#fff' : 'var(--text4)',
                border: 'none', cursor: canAdvance() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: canAdvance() ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {t('teacherReg.next')} →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                height: 44, padding: '0 36px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: loading ? 'var(--surface4)' : 'var(--primary)',
                color: loading ? 'var(--text4)' : '#fff',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display:'block' }} /></>
              ) : `🚀 ${t('teacherReg.submit')}`}
            </button>
          )}
        </div>

        {/* Step counter */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text4)', marginTop: 16 }}>
          {lang === 'ar' ? `خطوة ${step} من ${STEPS.length}` : `Step ${step} of ${STEPS.length}`}
        </p>
      </div>
    </div>
  );
}

/* ─── Micro form components ─────────────────────────────── */
function Field({ label, value, onChange, placeholder='', type='text' }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ marginTop: 4 }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options=[] }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ marginTop: 4 }}>
        <option value="">—</option>
        {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
    </div>
  );
}
