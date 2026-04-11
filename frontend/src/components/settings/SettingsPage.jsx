// src/components/settings/SettingsPage.jsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usersAPI } from '../../api/index';
import { useUIStore } from '../../context/store';
import { Card, Btn, Input, SectionHeader, Divider } from '../shared/UI';

/* ── SVG Icons ───────────────────────────────────────────── */
const PaintBrushIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ShieldAlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};
const itemAnim = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } }
};

export default function SettingsPage() {
  const { darkMode, toggleDark, language, setLanguage } = useUIStore();
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();
  
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  const { mutate: changePwd, isSuccess: saved } = useMutation({
    mutationFn: usersAPI.changePassword,
    onSuccess: () => { toast.success('Password updated successfully!'); reset(); },
    onError:   (err) => toast.error(err.response?.data?.error || 'Current password incorrect'),
  });

  const onPwdSubmit = d => {
    if (d.newPassword !== d.confirmPassword) { toast.error('Passwords do not match'); return; }
    changePwd({ currentPassword: d.currentPassword, newPassword: d.newPassword });
  };

  const newPwd = watch('newPassword', '');

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ maxWidth: 840, margin: '0 auto' }}>
      
      <SectionHeader 
        icon={<PaintBrushIcon />} 
        title="Settings" 
        subtitle="Manage your platform preferences and security"
        gradient 
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Appearance & Language */}
        <motion.div variants={itemAnim}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaintBrushIcon />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Appearance & Locale
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Dark Theme</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Use the dark interface across the platform</div>
                </div>
                <Toggle checked={darkMode} onChange={toggleDark} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Arabic Layout (RTL)</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Switch interface alignment to right-to-left</div>
                </div>
                <Toggle checked={language === 'ar'} onChange={() => setLanguage(language === 'ar' ? 'en' : 'ar')} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security & Password */}
        <motion.div variants={itemAnim}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockIcon />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', color: 'var(--text)' }}>
                Security & Password
              </h3>
            </div>

            <form onSubmit={handleSubmit(onPwdSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input 
                label="Current Password" type={showCur ? 'text' : 'password'} 
                icon={<LockIcon />} placeholder="Enter your current password"
                rightIcon={showCur ? <EyeOffIcon /> : <EyeIcon />}
                onRightIconClick={() => setShowCur(v => !v)}
                {...register('currentPassword', { required: 'Required' })} 
                error={errors.currentPassword?.message} 
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
                <Input 
                  label="New Password" type={showNew ? 'text' : 'password'} 
                  icon={<ShieldAlertIcon />} placeholder="Min. 8 characters"
                  rightIcon={showNew ? <EyeOffIcon /> : <EyeIcon />}
                  onRightIconClick={() => setShowNew(v => !v)}
                  error={errors.newPassword?.message}
                  {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} 
                />
                <Input 
                  label="Confirm Password" type={showCfm ? 'text' : 'password'} 
                  icon={<ShieldAlertIcon />} placeholder="Repeat new password"
                  rightIcon={showCfm ? <EyeOffIcon /> : <EyeIcon />}
                  onRightIconClick={() => setShowCfm(v => !v)}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Required',
                    validate: v => v === newPwd || 'Passwords do not match'
                  })} 
                />
              </div>

              <Divider margin={12}/>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn type="submit" variant="primary" loading={isSubmitting}>
                  {saved ? 'Password Updated ✓' : 'Save New Password'}
                </Btn>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemAnim}>
          <Card style={{ 
            borderColor: 'rgba(239,68,68,0.22)', 
            background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, transparent 100%)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlertIcon />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.02em', color: 'var(--danger)' }}>
                Danger Zone
              </h3>
            </div>
            
            <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
              Deleting your account is permanent and cannot be undone. All your study sessions, XP, notes, and messages will be permanently erased.
            </p>
            
            <Btn variant="danger"
              onClick={() => { 
                if (window.confirm('Are you strictly sure? This will wipe your account completely.')) {
                  toast.error('Deletion requested — contact support@najah.edu.eg to confirm.'); 
                }
              }}>
              Delete My Account
            </Btn>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}

/* ── Custom Toggle Switch ───────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <motion.button
      type="button"
      onClick={onChange}
      style={{
        width: 50, height: 26, borderRadius: 13,
        background: checked ? 'var(--primary)' : 'var(--surface3)',
        border: '1px solid',
        borderColor: checked ? 'var(--primary)' : 'var(--border2)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex', alignItems: 'center',
        transition: 'background 0.3s, border-color 0.3s',
        flexShrink: 0
      }}
    >
      <motion.div
        layout
        initial={false}
        animate={{ 
          x: checked ? 24 : 2,
          boxShadow: checked ? '0 2px 5px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{
          width: 20, height: 20,
          borderRadius: 10,
          background: '#fff',
        }}
      />
    </motion.button>
  );
}
