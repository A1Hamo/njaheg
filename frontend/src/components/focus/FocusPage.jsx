// src/components/focus/FocusPage.jsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usersAPI } from '../../api/index';
import { Card, Btn, Select, SectionHeader } from '../shared/UI';
import toast from 'react-hot-toast';

const MODES = {
  focus: { label:'Focus',      min:25, color:'var(--primary)' },
  short: { label:'Short Break',min:5,  color:'var(--accent2)' },
  long:  { label:'Long Break', min:15, color:'var(--accent)'  },
};
const SUBJECTS = ['mathematics','science','arabic','english','social_studies'];
const S_ICONS  = { mathematics:'📐',science:'🔬',arabic:'📚',english:'🌐',social_studies:'🌍' };

export default function FocusPage() {
  const [mode,    setMode]   = useState('focus');
  const [secs,    setSecs]   = useState(25*60);
  const [running, setRunning]= useState(false);
  const [subject, setSubject]= useState('mathematics');
  const [done,    setDone]   = useState(0);
  const intv = useRef(null);

  const maxSecs = MODES[mode].min * 60;
  const pct     = secs / maxSecs;
  const circ    = 2 * Math.PI * 88;

  const reset = (m=mode) => { clearInterval(intv.current); setRunning(false); setSecs(MODES[m].min*60); };
  const switchMode = m => { setMode(m); reset(m); };

  const toggle = () => {
    if (running) { clearInterval(intv.current); setRunning(false); return; }
    setRunning(true);
    intv.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intv.current);
          setRunning(false);
          if (mode === 'focus') {
            setDone(d => d+1);
            usersAPI.recordPomodoro({ type:'focus', duration:25, subject, completed:true }).catch(()=>{});
            toast.success('🍅 Pomodoro complete! Take a break!');
            if (Notification.permission==='granted') new Notification('Najah',{body:'Pomodoro done! Take a break.'});
          } else {
            toast.success('☕ Break over! Time to focus!');
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => { Notification.requestPermission?.(); return ()=>clearInterval(intv.current); }, []);

  const mm = String(Math.floor(secs/60)).padStart(2,'0');
  const ss = String(secs%60).padStart(2,'0');
  const modeColor = MODES[mode].color;

  const TIPS = [
    'Work focused for 25 min, then rest 5 min',
    'After 4 pomodoros, take a 15–30 min break',
    'Remove all distractions before starting',
    'Keep a notepad for interrupting thoughts',
    'Drink water during your breaks',
  ];

  return (
    <div>
      <SectionHeader icon="⏱️" title="Focus Mode" subtitle="Pomodoro timer for deep, distraction-free study" />

      <div className="grid-2" style={{ gap:24 }}>
        <Card style={{ textAlign:'center', padding:'40px 32px' }}>
          {/* Mode switcher */}
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:32 }}>
            {Object.entries(MODES).map(([k,v])=>(
              <motion.button key={k} onClick={()=>switchMode(k)} whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                style={{ padding:'7px 18px', borderRadius:20, fontSize:12, fontWeight:600,
                  border:'1px solid', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
                  background: mode===k ? v.color : 'var(--surface)',
                  borderColor: mode===k ? v.color : 'var(--border)',
                  color: mode===k ? '#fff' : 'var(--text3)' }}>{v.label}</motion.button>
            ))}
          </div>

          {/* SVG ring */}
          <div style={{ position:'relative', width:200, height:200, margin:'0 auto 28px' }}>
            <svg width="200" height="200" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--surface3)" strokeWidth="8"/>
              <circle cx="100" cy="100" r="88" fill="none"
                stroke={modeColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
                style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:44, fontWeight:800, fontFamily:'var(--font-head)',
                fontVariantNumeric:'tabular-nums', color:modeColor }}>{mm}:{ss}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{MODES[mode].label.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:20 }}>
            <Btn variant="primary" size="lg" onClick={toggle}
              style={{ background:modeColor, borderColor:modeColor, minWidth:120 }}>
              {running ? '⏸ Pause' : '▶ Start'}
            </Btn>
            <Btn size="lg" onClick={()=>reset()}>↺ Reset</Btn>
          </div>

          {/* Pomodoro dots */}
          <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{ width:12, height:12, borderRadius:'50%',
                background: i<done%4 ? 'var(--danger)' : 'var(--surface3)' }} />
            ))}
            <span style={{ fontSize:11, color:'var(--text3)', marginLeft:8 }}>
              {done} done today
            </span>
          </div>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card>
            <div style={{ fontWeight:700, marginBottom:14 }}>📊 Today's Focus</div>
            <div className="grid-2" style={{ gap:10 }}>
              {[
                { label:'Pomodoros', value:done, icon:'🍅' },
                { label:'Focus Time', value:`${done*25}m`, icon:'⏱️' },
              ].map(s=>(
                <div key={s.label} style={{ padding:14, background:'var(--surface)', borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-head)' }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight:700, marginBottom:12 }}>🎯 Session Settings</div>
            <Select label="Currently Studying" value={subject} onChange={e=>setSubject(e.target.value)}>
              {SUBJECTS.map(s=><option key={s} value={s}>{S_ICONS[s]} {s.replace('_',' ')}</option>)}
            </Select>
          </Card>

          <Card>
            <div style={{ fontWeight:700, marginBottom:12 }}>💡 Pomodoro Tips</div>
            {TIPS.map((tip,i)=>(
              <div key={i} style={{ fontSize:12, color:'var(--text2)', padding:'7px 0',
                borderBottom: i<TIPS.length-1?'1px solid var(--border)':'' }}>
                {i+1}. {tip}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
