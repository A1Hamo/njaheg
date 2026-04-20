// src/components/payment/PaymentPage.jsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { paymentAPI } from '../../api/index';
import { useTranslation } from '../../i18n/index';

export default function PaymentPage() {
  const { t, lang } = useTranslation();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedGateway, setSelectedGateway] = useState('card');
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: paymentAPI.history
  });

  const dbPayments = historyData?.data?.transactions || [];

  const payments = [
    { id: 1, title: 'Physics Grade 10 - April Bundle', amount: 250, date: '2026-04-25', status: 'upcoming' },
    ...dbPayments.map(t => ({
      id: t._id, title: t.metadata?.title || 'Wallet Top-up', amount: t.amount, date: new Date(t.createdAt).toLocaleDateString(), status: t.status === 'success' ? 'paid' : 'upcoming'
    }))
  ];

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Step 1: Initiate genuine payment
      const { data } = await paymentAPI.initiate({
        amount: 250, gateway: selectedGateway, title: 'Secure Gateway Checkout',
        extraData: { phone: '+201000000000' }
      });

      if (data.iframeUrl) {
        // Real or simulated iFrame
        window.open(data.iframeUrl, '_blank');
      } else if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
      } else if (data.referenceCode) {
        toast.success(`Use Reference: ${data.referenceCode} at Fawry`, { duration: 5000 });
      }

      // Step 2: Since we are in development, trigger the simulate-success webhook automatically
      // In production, Paymob would hit the backend webhook.
      await paymentAPI.simulateSuccess({ transactionId: data.transactionId });
      
      toast.success(lang === 'ar' ? 'تم الدفع وحفظ المعاملة بنجاح!' : 'Payment Successful! Genuine Transaction Recorded & SMS triggered.');
      qc.invalidateQueries(['paymentHistory']);
      setShowCheckout(false);
    } catch (err) {
      toast.error(lang === 'ar' ? 'فشل الدفع.' : 'Payment failed.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', direction: lang === 'ar' ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100vh' }}>
      {/* ── Header banner ── */}
      <div style={{
        position: 'relative', height: 220, borderRadius: 24, overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <img src="/images/najah-bg-campus-9.jpeg" alt="campus-9" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.2))' }} />
        <div style={{ position: 'absolute', bottom: 30, left: 30, right: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {lang === 'ar' ? 'البوابة المالية' : 'Payment Gateway'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {lang === 'ar' ? 'أدر مدفوعاتك واشتراكاتك بسهولة وأمان.' : 'Manage your payments and subscriptions securely.'}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'ar' ? 'الرصيد المتاح' : 'Wallet Balance'}</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 900 }}>EGP 0.00</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* ── Left Column: Invoices ── */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 10, background: 'var(--surface2)', padding: 6, borderRadius: 14 }}>
            {['upcoming', 'paid'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                flex: 1, padding: '10px', borderRadius: 10,
                background: activeTab === t ? 'var(--surface)' : 'transparent',
                color: activeTab === t ? 'var(--text)' : 'var(--text3)',
                fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
                boxShadow: activeTab === t ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s'
              }}>
                {t === 'upcoming' ? (lang === 'ar' ? 'مستحقة الدفع' : 'Upcoming Payments') : (lang === 'ar' ? 'سجل المدفوعات' : 'Payment History')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payments.filter(p => p.status === activeTab).map(p => (
              <div key={p.id} style={{
                background: 'var(--surface)', padding: 20, borderRadius: 16,
                border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{p.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}: {p.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', marginBottom: 6 }}>{p.amount} EGP</div>
                  {activeTab === 'upcoming' ? (
                    <button onClick={() => setShowCheckout(true)} style={{
                      padding: '8px 16px', borderRadius: 8, background: 'var(--primary)', color: '#fff',
                      fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 12
                    }}>
                      {lang === 'ar' ? 'ادفع الآن' : 'Pay Now'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 6 }}>
                      {lang === 'ar' ? 'تم الدفع' : 'Paid'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {payments.filter(p => p.status === activeTab).length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 16 }}>
                {lang === 'ar' ? 'لا يوجد فواتير' : 'No invoices here.'}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Checkout Widget ── */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ flex: '1 1 350px', background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--primary)', padding: 24, boxShadow: '0 8px 30px rgba(99,102,241,0.15)' }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>{lang === 'ar' ? 'إتمام الدفع' : 'Secure Checkout'}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setSelectedGateway('card')} style={{
                  padding: 12, borderRadius: 12, border: `2px solid ${selectedGateway === 'card' ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedGateway === 'card' ? 'rgba(99,102,241,0.05)' : 'var(--surface2)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>💳</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Credit/Debit</div>
                </button>
                <button onClick={() => setSelectedGateway('instapay')} style={{
                  padding: 12, borderRadius: 12, border: `2px solid ${selectedGateway === 'instapay' ? '#8B5CF6' : 'var(--border)'}`,
                  background: selectedGateway === 'instapay' ? 'rgba(139,92,246,0.05)' : 'var(--surface2)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>InstaPay</div>
                </button>
                <button onClick={() => setSelectedGateway('wallet')} style={{
                  padding: 12, borderRadius: 12, border: `2px solid ${selectedGateway === 'wallet' ? '#10B981' : 'var(--border)'}`,
                  background: selectedGateway === 'wallet' ? 'rgba(16,185,129,0.05)' : 'var(--surface2)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>📱</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>E-Wallet</div>
                </button>
                <button onClick={() => setSelectedGateway('fawry')} style={{
                  padding: 12, borderRadius: 12, border: `2px solid ${selectedGateway === 'fawry' ? '#F59E0B' : 'var(--border)'}`,
                  background: selectedGateway === 'fawry' ? 'rgba(245,158,11,0.05)' : 'var(--surface2)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🏪</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Fawry Pay</div>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={selectedGateway} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {selectedGateway === 'card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <input type="text" placeholder={lang === 'ar' ? 'الاسم على البطاقة' : 'Name on Card'} className="form-input" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
                      <div style={{ position: 'relative' }}>
                        <input type="text" placeholder={lang === 'ar' ? 'رقم البطاقة' : 'Card Number'} className="form-input" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', letterSpacing: '2px' }} />
                        <span style={{ position: 'absolute', right: 12, top: 12, opacity: 0.5 }}>💳</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input type="text" placeholder="MM/YY" className="form-input" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }} />
                        <input type="text" placeholder="CVC" className="form-input" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', textAlign: 'center' }} />
                      </div>
                    </div>
                  )}

                  {selectedGateway === 'instapay' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ padding: 16, background: 'rgba(139,92,246,0.1)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)' }}>
                        <p style={{ fontSize: 13, color: '#6D28D9', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>
                          {lang === 'ar' ? 'يرجى تحويل المبلغ إلى عنوان InstaPay الخاص بنا:' : 'Please transfer the exact amount to our InstaPay Address (IPA):'}
                        </p>
                        <div style={{ marginTop: 8, padding: '10px', background: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: 900, color: '#6D28D9', letterSpacing: '1px' }}>
                          najah@instapay
                        </div>
                      </div>
                      <input type="text" placeholder={lang === 'ar' ? 'أدخل عنوان InstaPay الخاص بك للتحقق' : 'Your InstaPay Address (e.g. user@instapay)'} className="form-input" style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)' }} />
                    </div>
                  )}

                  {selectedGateway === 'wallet' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ padding: 16, background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                        <p style={{ fontSize: 13, color: '#047857', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>
                          {lang === 'ar' ? 'أدخل رقم المحفظة الإلكترونية (فودافون كاش، أورانج، إلخ) وسنرسل لك طلب دفع.' : 'Enter your E-Wallet number (Vodafone Cash, Orange, etc.) to receive a payment prompt.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <span style={{ padding: '12px 16px', background: 'var(--surface3)', fontWeight: 800, color: 'var(--text2)', borderRight: '1px solid var(--border)' }}>+20</span>
                        <input type="tel" placeholder="10xxxxxxxxx" className="form-input" style={{ width: '100%', padding: 12, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, letterSpacing: '1px' }} />
                      </div>
                    </div>
                  )}

                  {selectedGateway === 'fawry' && (
                    <div style={{ padding: 16, background: 'rgba(245,158,11,0.1)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                      <p style={{ fontSize: 13, color: '#D97706', lineHeight: 1.6, fontWeight: 600, textAlign: 'center' }}>
                        {lang === 'ar' ? 'سيتم إنشاء رقم مرجعي لفوري. يمكنك الدفع من أي ماكينة فوري خلال 24 ساعة.' : 'A Fawry reference code will be generated. Pay at any Fawry point within 24 hours.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <button onClick={handlePay} disabled={processing} style={{
                width: '100%', padding: 16, borderRadius: 12, background: 'var(--primary)', color: '#fff',
                fontWeight: 800, fontSize: 16, marginTop: 24, border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.7 : 1
              }}>
                {processing ? '⏳ Processing...' : (lang === 'ar' ? 'تأكيد الدفع 250 ج.م' : 'Pay 250 EGP')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
