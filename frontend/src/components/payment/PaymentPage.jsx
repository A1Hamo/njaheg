// src/components/payment/PaymentPage.jsx — Najah Payment System
// Supports: Egyptian Banks (Fawry, CIB), E-Wallets (Vodafone Cash, Orange Money), InstaPay
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from '../../i18n/index';

const PAYMENT_METHODS = [
  { id: 'fawry',    name: 'Fawry',         nameAr: 'فوري',            icon: '🏪', color: '#F7A81B', type: 'bank' },
  { id: 'instapay', name: 'InstaPay',      nameAr: 'إنستا باي',       icon: '🏦', color: '#1E3A5F', type: 'bank' },
  { id: 'cib',      name: 'CIB Bank',      nameAr: 'بنك CIB',        icon: '💳', color: '#003B73', type: 'bank' },
  { id: 'vodafone', name: 'Vodafone Cash', nameAr: 'فودافون كاش',    icon: '📱', color: '#E60000', type: 'wallet' },
  { id: 'orange',   name: 'Orange Money',  nameAr: 'أورنج موني',     icon: '📲', color: '#FF6600', type: 'wallet' },
  { id: 'etisalat', name: 'Etisalat Cash', nameAr: 'اتصالات كاش',    icon: '💰', color: '#009639', type: 'wallet' },
  { id: 'card',     name: 'Visa/Mastercard', nameAr: 'فيزا/ماستركارد', icon: '💎', color: '#6366F1', type: 'card' },
];

const PLANS = [
  { id: 'basic',   name: 'Basic',      nameAr: 'أساسي',     price: 0,    period: 'free',    features: ['AI Chat (5/day)', 'Basic Notes', 'Community Access'] },
  { id: 'student', name: 'Student Pro', nameAr: 'طالب برو', price: 99,   period: 'month',   features: ['Unlimited AI', 'Smart Planner', 'Quiz Generator', 'File Storage 5GB', 'Priority Support'], popular: true },
  { id: 'premium', name: 'Premium',    nameAr: 'بريميوم',   price: 199,  period: 'month',   features: ['Everything in Pro', 'AI Study Plans', 'Advanced Analytics', 'Unlimited Storage', '1-on-1 Tutoring'] },
  { id: 'teacher', name: 'Teacher',    nameAr: 'معلم',      price: 149,  period: 'month',   features: ['Class Management', 'Auto-Grading', 'Curriculum Tools', 'Parent Reports', 'Live Sessions'] },
];

function PlanCard({ plan, isAr, selected, onSelect }) {
  const isSelected = selected === plan.id;
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(plan.id)}
      style={{
        position: 'relative',
        background: isSelected ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--surface)',
        border: `2px solid ${isSelected ? '#6366F1' : 'var(--border)'}`,
        borderRadius: 20, padding: '28px 24px',
        cursor: 'pointer', transition: 'all 0.3s',
        boxShadow: isSelected ? '0 8px 32px rgba(99,102,241,0.3)' : 'var(--shadow-sm)',
        flex: 1, minWidth: 220,
      }}
    >
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -10, right: 16,
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '4px 12px', borderRadius: 20,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {isAr ? 'الأكثر شعبية' : 'Most Popular'}
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#fff' : 'var(--text)', marginBottom: 8 }}>
        {isAr ? plan.nameAr : plan.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: isSelected ? '#fff' : 'var(--text)' }}>
          {plan.price === 0 ? (isAr ? 'مجاني' : 'Free') : `${plan.price}`}
        </span>
        {plan.price > 0 && (
          <span style={{ fontSize: 13, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text3)' }}>
            {isAr ? 'جنيه/شهر' : 'EGP/mo'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#A5B4FC' : '#10B981'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {f}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function PaymentPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === 'ar';
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('student');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) { toast.error(isAr ? 'اختر طريقة الدفع' : 'Select a payment method'); return; }
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (['vodafone','orange','etisalat'].includes(selectedMethod) && !phone) {
      toast.error(isAr ? 'أدخل رقم الموبايل' : 'Enter your phone number'); return;
    }
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2500));
    setProcessing(false);
    setStep(3);
    toast.success(isAr ? 'تم الدفع بنجاح! 🎉' : 'Payment successful! 🎉');
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', marginBottom: 8 }}>
          {isAr ? 'ترقية حسابك' : 'Upgrade Your Plan'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text3)', maxWidth: 500, margin: '0 auto' }}>
          {isAr ? 'اختر الباقة المناسبة لك واستمتع بكل مميزات منصة نجاح' : 'Choose the right plan and unlock all Najah features'}
        </p>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step >= s ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--surface2)',
              color: step >= s ? '#fff' : 'var(--text4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, transition: 'all 0.3s',
              boxShadow: step >= s ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            }}>{s}</div>
            {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? '#6366F1' : 'var(--border)', borderRadius: 2, transition: 'background 0.3s' }} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              {PLANS.map(plan => (
                <PlanCard key={plan.id} plan={plan} isAr={isAr} selected={selectedPlan} onSelect={setSelectedPlan} />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => selectedPlan !== 'basic' ? setStep(2) : toast.success(isAr ? 'أنت على الباقة المجانية بالفعل' : 'You are already on the free plan')}
                style={{
                  padding: '14px 48px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 15, fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                }}
              >
                {isAr ? 'التالي ←' : 'Continue →'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>
                {isAr ? 'اختر طريقة الدفع' : 'Choose Payment Method'}
              </h3>

              {/* Bank Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  {isAr ? 'البنوك المصرية' : 'Egyptian Banks'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.filter(m => m.type === 'bank').map(m => (
                    <motion.button key={m.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedMethod(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                        background: selectedMethod === m.id ? `${m.color}15` : 'var(--surface2)',
                        border: `2px solid ${selectedMethod === m.id ? m.color : 'var(--border)'}`,
                        color: 'var(--text)', fontSize: 14, fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                      {isAr ? m.nameAr : m.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* E-Wallets Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  {isAr ? 'المحافظ الإلكترونية' : 'E-Wallets'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {PAYMENT_METHODS.filter(m => m.type === 'wallet').map(m => (
                    <motion.button key={m.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedMethod(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                        background: selectedMethod === m.id ? `${m.color}15` : 'var(--surface2)',
                        border: `2px solid ${selectedMethod === m.id ? m.color : 'var(--border)'}`,
                        color: 'var(--text)', fontSize: 14, fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{m.icon}</span>
                      {isAr ? m.nameAr : m.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Card Section */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                  {isAr ? 'بطاقات الدفع' : 'Payment Cards'}
                </div>
                {PAYMENT_METHODS.filter(m => m.type === 'card').map(m => (
                  <motion.button key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedMethod(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                      background: selectedMethod === m.id ? `${m.color}15` : 'var(--surface2)',
                      border: `2px solid ${selectedMethod === m.id ? m.color : 'var(--border)'}`,
                      color: 'var(--text)', fontSize: 14, fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{m.icon}</span>
                    {isAr ? m.nameAr : m.name}
                  </motion.button>
                ))}
              </div>

              {/* Phone input for wallets */}
              {['vodafone','orange','etisalat'].includes(selectedMethod) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                    {isAr ? 'رقم الموبايل' : 'Phone Number'}
                  </label>
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder={isAr ? '01xxxxxxxxx' : '01xxxxxxxxx'}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 15, direction: 'ltr' }}
                  />
                </motion.div>
              )}
            </div>

            {/* Summary */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'var(--text3)', fontSize: 14 }}>{isAr ? 'الباقة' : 'Plan'}</span>
                <span style={{ fontWeight: 700 }}>{isAr ? PLANS.find(p => p.id === selectedPlan)?.nameAr : PLANS.find(p => p.id === selectedPlan)?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text3)', fontSize: 14 }}>{isAr ? 'المبلغ' : 'Total'}</span>
                <span style={{ fontWeight: 900, fontSize: 20, color: '#6366F1' }}>{PLANS.find(p => p.id === selectedPlan)?.price} {isAr ? 'جنيه' : 'EGP'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ padding: '14px 28px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, color: 'var(--text3)', fontSize: 14 }}>
                {isAr ? 'رجوع' : '← Back'}
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlePayment} disabled={processing}
                style={{
                  flex: 1, padding: '14px', borderRadius: 12,
                  background: processing ? 'var(--surface3)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#fff', border: 'none', cursor: processing ? 'wait' : 'pointer',
                  fontSize: 15, fontWeight: 700,
                  boxShadow: processing ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
                }}
              >
                {processing ? (isAr ? 'جاري المعالجة...' : 'Processing...') : (isAr ? 'ادفع الآن' : 'Pay Now')}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '60px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: 2, duration: 0.6 }}
              style={{ fontSize: 72, marginBottom: 20 }}
            >✅</motion.div>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, fontFamily: 'var(--font-head)' }}>
              {isAr ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
            </h2>
            <p style={{ color: 'var(--text3)', fontSize: 15, marginBottom: 32 }}>
              {isAr ? 'تم ترقية حسابك بنجاح. استمتع بكل مميزات منصة نجاح!' : 'Your account has been upgraded. Enjoy all Najah features!'}
            </p>
            <motion.a
              href="/" whileHover={{ scale: 1.03 }}
              style={{
                display: 'inline-block', padding: '14px 40px', borderRadius: 14,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15,
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              {isAr ? 'العودة للوحة التحكم' : 'Go to Dashboard'}
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
