// src/components/achievements/AchievementsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { achievementsAPI } from '../../api/index';
import { useAuthStore } from '../../context/store';
import { Card, Tabs, SectionHeader, Avatar, ProgressBar, EmptyState, Spinner } from '../shared/UI';

export default function AchievementsPage() {
  const { user }  = useAuthStore();
  const [tab, setTab] = useState('achievements');

  const { data: achData, isLoading }  = useQuery({ queryKey:['achievements'],  queryFn:achievementsAPI.list });
  const { data: lbData,  isLoading:lbLoad } = useQuery({ queryKey:['leaderboard'], queryFn:achievementsAPI.leaderboard });

  const all        = achData?.data?.achievements || [];
  const earned     = all.filter(a=>a.earned);
  const locked     = all.filter(a=>!a.earned);
  const leaderboard= lbData?.data?.leaderboard || [];
  const xpPct      = ((user?.xp_points % (user?.level * 200)) / (user?.level * 200) * 100) || 0;

  const CAT_COLORS = { general:'var(--primary)',study:'var(--accent2)',files:'var(--info)',
    streak:'var(--danger)',quiz:'var(--accent)',community:'#A78BFA',focus:'#34D399',ai:'var(--primary-light)',
    notes:'#F9A8D4', level:'#F7B731' };

  const TABS = [
    { key:'achievements', label:'Achievements', icon:'🏆' },
    { key:'leaderboard',  label:'Leaderboard',  icon:'👑' },
  ];

  return (
    <div>
      <SectionHeader icon="🏆" title="Achievements" subtitle="Track your milestones and compete on the leaderboard" />

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { icon:'⭐', val:`Level ${user?.level||1}`, label:'Current Level', c:'var(--accent)' },
          { icon:'💎', val:(user?.xp_points||0).toLocaleString(), label:'Total XP', c:'var(--primary)' },
          { icon:'🏆', val:earned.length, label:'Earned', c:'#F7B731' },
          { icon:'🔥', val:`${user?.streak_days||0}d`, label:'Streak', c:'var(--danger)' },
        ].map(s=>(
          <Card key={s.label} style={{ textAlign:'center', padding:16 }}>
            <div style={{ fontSize:28, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.c, fontFamily:'var(--font-head)' }}>{s.val}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom:20, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:6 }}>
          <span>Level {user?.level}</span><span>{user?.level*200 - (user?.xp_points%((user?.level||1)*200))} XP to next</span>
        </div>
        <ProgressBar value={xpPct} max={100} color="amber" height={8} />
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'achievements' && (
        <>
          {isLoading ? <div style={{textAlign:'center',padding:48}}><Spinner size="lg"/></div> : (
            <>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--accent)' }}>
                🌟 Unlocked ({earned.length})
              </div>
              <div className="grid-2" style={{ marginBottom:24 }}>
                <AnimatePresence>
                  {earned.map((a,i) => (
                    <motion.div key={a.id} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:i*0.04}}
                      style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                        background:'var(--surface)', borderRadius:12,
                        border:`1px solid rgba(247,183,49,0.18)`,
                        boxShadow:'0 0 20px rgba(247,183,49,0.05)' }}>
                      <div style={{ width:52, height:52, borderRadius:12, background:'rgba(247,183,49,0.1)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{a.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{a.title}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{a.description}</div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:10, fontWeight:600, color:'var(--accent)' }}>+{a.xp_reward} XP</span>
                          {a.earned_at && <span style={{ fontSize:10, color:'var(--text3)' }}>· {format(new Date(a.earned_at),'MMM d, yyyy')}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'var(--text3)' }}>
                🔒 Locked ({locked.length})
              </div>
              <div className="grid-2">
                {locked.map(a=>(
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px',
                    background:'var(--surface)', borderRadius:12, border:'1px solid var(--border)',
                    opacity:0.42, filter:'grayscale(0.8)' }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'var(--surface2)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{a.title}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'leaderboard' && (
        <Card>
          {lbLoad ? <div style={{textAlign:'center',padding:32}}><Spinner/></div> :
          leaderboard.length===0 ? <EmptyState icon="👑" title="No rankings yet" /> :
          leaderboard.map((u,i)=>(
            <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'12px 0', borderBottom: i<leaderboard.length-1 ? '1px solid var(--border)' : '' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center',
                justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0,
                background: i===0?'rgba(247,183,49,0.2)':i===1?'rgba(192,192,192,0.2)':i===2?'rgba(205,127,50,0.2)':'var(--surface)',
                color: i===0?'#F7B731':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text3)' }}>
                {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
              </div>
              <Avatar name={u.name} src={u.avatar_url} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{u.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Level {u.level} · {u.grade||'Student'}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color:'var(--accent)', fontFamily:'var(--font-head)' }}>
                {Number(u.xp_points).toLocaleString()} XP
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
