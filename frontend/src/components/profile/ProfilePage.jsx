// src/components/profile/ProfilePage.jsx — Professional v3
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { usersAPI, achievementsAPI } from '../../api/index';
import { useAuthStore } from '../../context/store';
import { Card, Button, Input, Select, Avatar, ProgressBar, Spinner, SectionHeader } from '../shared/UI';

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Prep 1','Prep 2','Prep 3','Sec 1','Sec 2','Sec 3'];
const LANGUAGES = [{ value:'en', label:'English' },{ value:'ar', label:'العربية' }];

/* ── SVG Icons ───────────────────────────────────────────── */
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const StatIcons = {
  Sessions: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Knowledge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  Archives: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Medals: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
};

/* ── Animation Config ────────────────────────────────────── */
const stagger = {
  hidden: {}, visible: { transition: { staggerChildren: 0.1 } }
};
const itemAnim = {
  hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } }
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: profileData, isLoading: loadingProfile } = useQuery({ queryKey:['profile'], queryFn:usersAPI.getProfile });
  const { data: achData }     = useQuery({ queryKey:['achievements'], queryFn:achievementsAPI.list });

  const profile  = profileData?.data?.profile || user;
  const earned   = (achData?.data?.achievements || []).filter(a => a.earned);
  const xpNext   = profile?.level * 500;
  const xpPct    = Math.min(100, (profile?.xp_points / xpNext) * 100) || 0;

  const { register, handleSubmit, formState:{isSubmitting}, reset } = useForm();

  const onSubmit = data => updateProfile(data);

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        grade: profile.grade,
        school: profile.school,
        language: profile.language,
        bio: profile.bio,
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        phone: profile.phone || '',
        social_links: JSON.stringify(profile.social_links || {}, null, 2),
      });
    }
  }, [profile, reset]);

  const { mutate: updateProfile } = useMutation({
    mutationFn: (data) => {
      let parsedSocial = {};
      try { parsedSocial = JSON.parse(data.social_links || '{}'); } catch { parsedSocial = {}; }
      return usersAPI.updateProfile({ ...data, social_links: parsedSocial });
    },
    onSuccess: ({ data }) => { 
      setUser({ ...user, ...data.user }); 
      qc.invalidateQueries(['profile']); 
      toast.success('Profile updated successfully!'); 
    },
  });

  const { mutate: uploadAvatar } = useMutation({
    mutationFn: usersAPI.uploadAvatar,
    onSuccess: ({ data }) => { setUser({ ...user, avatar_url: data.avatarUrl }); toast.success('Profile picture updated!'); },
    onError:   (err) => toast.error(err.response?.data?.error || 'Upload failed'),
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxSize: 5*1024*1024, maxFiles: 1,
    onDrop: ([file]) => file && uploadAvatar(file),
  });

  if (loadingProfile) return <div style={{ display:'flex', justifyContent:'center', padding:100 }}><Spinner size="lg" /></div>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ maxWidth: 1080, margin: '0 auto' }}>
      <SectionHeader 
        icon={<UserIcon />} 
        title="Identity Protocol" 
        subtitle="Manage your academic credentials and personal details" 
        gradient
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 360px) 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: Identity Card */}
        <motion.div variants={itemAnim} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card style={{ padding: 40, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, pointerEvents: 'none' }} />
            
            <div {...getRootProps()} style={{ cursor:'pointer', display:'inline-block', marginBottom:24 }}>
              <input {...getInputProps()} />
              <div style={{ position:'relative', display:'inline-block' }}>
                <Avatar src={profile?.avatar_url} name={profile?.name} size={120} ring />
                <motion.div 
                  whileHover={{ scale: 1.1, backgroundColor: 'var(--brand-600)' }}
                  style={{ position:'absolute', bottom:2, right:2, width:38, height:38, borderRadius:'50%',
                    background:'var(--primary)', border:'3px solid var(--surface)', color: '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', boxShadow: 'var(--glow-sm)', transition: 'background-color 0.2s' }}>
                  <CameraIcon />
                </motion.div>
              </div>
            </div>

            <h2 style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-head)', color:'var(--text)', marginBottom:4, letterSpacing: '-0.02em' }}>
              {profile?.name}
            </h2>
            <div style={{ fontSize:13, color:'var(--text3)', fontWeight:600, marginBottom:20 }}>
              {profile?.email}
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:26 }}>
              {[
                { label: profile?.grade, color: 'var(--primary-light)', bg: 'rgba(124,58,237,0.12)' },
                { label: `Level ${profile?.level}`, color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
                { label: `🔥 ${profile?.streak_days}d Streak`, color: '#FBBF24', bg: 'rgba(245,158,11,0.12)' }
              ].map(badge => (
                <div key={badge.label} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, color: badge.color, background: badge.bg, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {badge.label}
                </div>
              ))}
            </div>

            <div style={{ marginBottom:32, textAlign: 'left' }}>
              <div style={{ marginBottom:8, fontSize:11.5, fontWeight:700, color:'var(--text2)', display:'flex', justifyContent:'space-between', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Sync Progress</span>
                <span style={{ color: 'var(--primary-light)' }}>{Math.round(xpPct)}%</span>
              </div>
              <ProgressBar value={xpPct} max={100} color="primary" height={10} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
                <span>LVL {profile?.level}</span>
                <span>{xpNext - (profile?.xp_points || 0)} XP TO NEXT SYNC</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label:'Sessions', val: profile?.sessions_done, key: 'Sessions' },
                { label:'Knowledge', val: profile?.files_count, key: 'Knowledge' },
                { label:'Archives', val: profile?.notes_count, key: 'Archives' },
                { label:'Medals', val: profile?.ach_count, key: 'Medals' },
              ].map(s=>(
                <div key={s.label} className="glass-panel" style={{ padding: '14px 12px', borderRadius: 16 }}>
                  <div style={{ color: 'var(--text2)', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{StatIcons[s.key]}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{s.val||0}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Achievements Ribbon */}
          {earned.length > 0 && (
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Tactical Merits</span>
                <span style={{ color: 'var(--primary-light)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>VIEW ALL</span>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {earned.map(a => (
                  <motion.div 
                    key={a.id} whileHover={{ y: -4, scale: 1.05 }}
                    title={a.name}
                    style={{ 
                      minWidth: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, boxShadow: 'inset 0 0 12px rgba(245,158,11,0.08)', cursor: 'help'
                    }}>
                    {a.icon}
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>

        {/* Right: Configuration Form */}
        <motion.div variants={itemAnim} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card style={{ padding: 36 }}>
            <h3 style={{ fontWeight:800, fontSize:19, color:'var(--text)', marginBottom:28, borderLeft: '3px solid var(--primary)', paddingLeft: 14, letterSpacing: '-0.02em', fontFamily: 'var(--font-head)' }}>
              Base Configuration
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <Input label="Neural Handle (Name)" {...register('name', { required:"Name is required" })} />
                <Input label="Temporal Marker (DOB)" type="date" {...register('dob')} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <Input label="Comm Signal (Phone)" placeholder="+20..." {...register('phone')} />
                <Select label="Cadet Grade" {...register('grade')}>
                  {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                </Select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <Input label="Research Institute (School)" placeholder="Al-Azhar Academy..." {...register('school')} />
                <Select label="Lexicon (Language)" {...register('language')}>
                  {LANGUAGES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
                </Select>
              </div>

              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:'var(--text2)', display:'flex', gap: 4, marginBottom:6 }}>Personnel Narrative (Bio)</label>
                <textarea {...register('bio')} placeholder="Briefly describe your academic drive..."
                  style={{ width:'100%', minHeight:110, padding:'14px 16px', fontSize:14, borderRadius:12, resize:'vertical',
                    background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)',
                    outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit', lineHeight: 1.6 }} 
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div>
                <label style={{ fontSize:12.5, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Signal Links (Social JSON)</label>
                <Input placeholder='{"github": "...", "linkedin": "..."}' {...register('social_links')} />
              </div>

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="primary" loading={isSubmitting} size="lg">
                  Synchronize Identity Data
                </Button>
              </div>
            </form>
          </Card>

          {/* Account Security Insight */}
          <div className="glass-panel" style={{ padding: '24px 30px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 20, border: '1px solid rgba(16,185,129,0.25)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, transparent 100%)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}>
              <ShieldIcon />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-head)' }}>Security Protocol Active</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Your personal data is heavily encrypted. Only authorized personnel in your sync circle can view your public academic progress markers.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
