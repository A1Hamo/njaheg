// src/components/groups/GroupsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { groupsAPI } from '../../api/index';
import { useAuthStore } from '../../context/store';

/* ── helpers ────────────────────────────────────────────── */
const SUBJECT_COLORS = {
  mathematics:'#7C3AED', science:'#10B981', arabic:'#F59E0B', english:'#3B82F6',
  physics:'#8B5CF6', chemistry:'#EC4899', biology:'#06B6D4', history:'#F43F5E',
  geography:'#14B8A6', default:'#7C3AED',
};
const getColor = s => SUBJECT_COLORS[s?.toLowerCase()] || SUBJECT_COLORS.default;

const INSTITUTION_ICONS = { school:'🏫', college:'🏛️', university:'🎓' };
const EMOJIS = ['📚','🧮','🔬','🌍','📖','✏️','🎨','💡','🏆','🌟'];
const COLORS  = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#8B5CF6','#F43F5E','#14B8A6'];

/* ── Card ────────────────────────────────────────────────── */
function GroupCard({ group, isTeacher, isOwner, onOpen, onDelete }) {
  const color = group.color || getColor(group.subject);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => onOpen(group._id)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.22s var(--ease)',
        position: 'relative',
      }}
    >
      {/* Color stripe */}
      <div style={{ height: 5, background: color }} />

      <div style={{ padding: '20px 22px 22px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${color}22`,
            border: `2px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {group.emoji || '📚'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {group.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize' }}>
              {INSTITUTION_ICONS[group.institutionType] || '🏫'} {group.institutionType} · {group.subject}
            </div>
          </div>
            {isOwner && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(group._id, group.name); }}
              style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
                color: '#F87171', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; }}
              title="Delete group"
            >✕</button>
          )}
        </div>

        {/* Description */}
        {group.description && (
          <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {group.description}
          </p>
        )}

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
              👥 {group.students?.length || 0}/{group.maxStudents}
            </span>
          </div>

          {/* Invite code badge */}
          {isOwner && (
            <CodeBadge code={group.code} />
          )}

          {!isOwner && group.institution && (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>🏛 {group.institution}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CodeBadge({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = e => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      title="Click to copy invite code"
      style={{
        padding: '4px 10px', borderRadius: 8,
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.1)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.25)'}`,
        color: copied ? '#34D399' : 'var(--primary-light)',
        fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
        cursor: 'pointer', fontFamily: 'var(--font-mono)',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
      }}
    >
      {copied ? '✓ Copied' : `# ${code}`}
    </button>
  );
}

/* ── Modal base ──────────────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            background: 'var(--surface3)',
            border: '1px solid var(--border2)',
            borderRadius: 24, padding: '32px 32px 28px',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em' }}>{title}</h2>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Create Group Modal ──────────────────────────────────── */
function CreateGroupModal({ open, onClose, onCreated, isTeacher }) {
  const [form, setForm] = useState({ name:'', description:'', subject:'', institutionType:'school', institution:'', maxStudents:40, color: COLORS[0], emoji: EMOJIS[0] });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const subjects = ['Mathematics','Science','Arabic','English','Physics','Chemistry','Biology','History','Geography','Computer Science','Art','Physical Education'];

  const submit = async e => {
    e.preventDefault();
    if (!form.name || !form.subject) { toast.error('Name and subject required'); return; }
    setLoading(true);
    try {
      const { data } = await groupsAPI.create({ ...form, maxStudents: Number(form.maxStudents) });
      toast.success(`Group "${data.group.name}" created! Code: ${data.group.code}`);
      onCreated(data.group);
      onClose();
      setForm({ name:'', description:'', subject:'', institutionType:'school', institution:'', maxStudents:40, color: COLORS[0], emoji: EMOJIS[0] });
    } catch { }
    finally { setLoading(false); }
  };

  const inp = (label, key, type='text', placeholder='') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit' }} />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isTeacher ? "✨ Create New Class" : "✨ Create Study Group"}>
      <form onSubmit={submit}>
        {inp(isTeacher ? 'Class Name *' : 'Group Name *', 'name', 'text', isTeacher ? 'e.g. Math Class — Year 2' : 'e.g. Calculus Study Group')}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 6 }}>Subject *</label>
          <select value={form.subject} onChange={e => set('subject', e.target.value)}
            style={{ width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit' }}>
            <option value="">Select subject…</option>
            {subjects.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 6 }}>Institution Type</label>
            <select value={form.institutionType} onChange={e => set('institutionType', e.target.value)}
              style={{ width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit' }}>
              <option value="school">🏫 School</option>
              <option value="college">🏛️ College</option>
              <option value="university">🎓 University</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 6 }}>Max Students</label>
            <input type="number" min={2} max={200} value={form.maxStudents} onChange={e => set('maxStudents',e.target.value)}
              style={{ width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit' }} />
          </div>
        </div>
        {inp('Institution Name (optional)', 'institution', 'text', 'e.g. Cairo University, Al-Azhar School')}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 8 }}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description of this group…"
            style={{ width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit', resize:'vertical' }} />
        </div>
        {/* Color & Emoji pickers */}
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 8 }}>Color</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color',c)} style={{ width:24, height:24, borderRadius:6, background:c, border: form.color===c ? '2px solid white' : '2px solid transparent', cursor:'pointer', outline:'none' }} />
              ))}
            </div>
          </div>
          <div style={{ flex:1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 8 }}>Icon</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => set('emoji',e)} style={{ width:28, height:28, borderRadius:6, background: form.emoji===e ? 'var(--surface4)' : 'var(--surface2)', border: form.emoji===e ? '1px solid var(--border2)' : '1px solid transparent', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>{e}</button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{
          width:'100%', padding:'12px', borderRadius:12,
          background: 'linear-gradient(135deg, var(--primary), var(--brand-600))',
          color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', border:'none',
          fontFamily:'inherit', opacity: loading ? 0.7 : 1,
          boxShadow:'0 4px 20px rgba(124,58,237,0.35)',
        }}>
          {loading ? 'Creating…' : (isTeacher ? '✨ Create Class' : '✨ Create Study Group')}
        </button>
      </form>
    </Modal>
  );
}

/* ── Join Group Modal ────────────────────────────────────── */
function JoinGroupModal({ open, onClose, onJoined }) {
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (code.trim().length !== 6) { toast.error('Enter the 6-character invite code'); return; }
    setLoading(true);
    try {
      const { data } = await groupsAPI.join(code.trim());
      toast.success(`Joined "${data.group.name}" successfully! 🎉`);
      onJoined(data.group);
      onClose();
      setCode('');
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="🔑 Join a Group">
      <form onSubmit={submit}>
        <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
          Ask your teacher for the 6-character invite code and enter it below.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display:'block', marginBottom: 8 }}>Invite Code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            maxLength={6}
            style={{
              width:'100%', padding:'14px 18px',
              background:'var(--surface2)', border:'2px solid var(--border2)',
              borderRadius:12, color:'var(--text)', outline:'none',
              fontSize:22, fontFamily:'var(--font-mono)', fontWeight:800,
              letterSpacing:'0.25em', textAlign:'center', textTransform:'uppercase',
            }}
          />
        </div>
        <button type="submit" disabled={loading} style={{
          width:'100%', padding:'12px', borderRadius:12,
          background:'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', border:'none',
          fontFamily:'inherit', opacity: loading ? 0.7 : 1,
          boxShadow:'0 4px 20px rgba(59,130,246,0.35)',
        }}>
          {loading ? 'Joining…' : '🔑 Join Group'}
        </button>
      </form>
    </Modal>
  );
}

/* ═════════════════════════════════════════════════════════
   Main GroupsPage
═════════════════════════════════════════════════════════ */
export default function GroupsPage() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const isTeacher  = user?.role === 'teacher';

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn:  () => groupsAPI.list(),
  });
  const groups = data?.data?.groups || [];

  const deleteGroup = async (id, name) => {
    if (!window.confirm(`Delete group "${name}"? This cannot be undone.`)) return;
    try {
      await groupsAPI.remove(id);
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group deleted');
    } catch { }
  };

  const handleCreated = () => qc.invalidateQueries({ queryKey: ['groups'] });
  const handleJoined  = () => qc.invalidateQueries({ queryKey: ['groups'] });

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, fontFamily:'var(--font-head)', letterSpacing:'-0.035em', marginBottom:6,
            background:'linear-gradient(135deg,#fff 30%,var(--primary-light) 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>
            {isTeacher ? '🏫 My Classes' : '📚 My Groups'}
          </h1>
          <p style={{ fontSize:14, color:'var(--text3)' }}>
            {isTeacher
              ? `${groups.length} active group${groups.length !== 1 ? 's' : ''} · Create and manage your classes`
              : `Member of ${groups.length} group${groups.length !== 1 ? 's' : ''} · Join more with an invite code`}
          </p>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          {isTeacher ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              style={{
                padding:'10px 20px', borderRadius:12,
                background:'linear-gradient(135deg,var(--primary),var(--brand-600))',
                color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none',
                fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
                boxShadow:'0 4px 18px rgba(124,58,237,0.35)',
              }}
            >+ New Class</motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowJoin(true)}
                style={{
                  padding:'10px 20px', borderRadius:12,
                  background:'linear-gradient(135deg,#3B82F6,#1D4ED8)',
                  color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none',
                  fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
                  boxShadow:'0 4px 18px rgba(59,130,246,0.35)',
                }}
              >🔑 Join with Code</motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                style={{
                  padding:'10px 20px', borderRadius:12,
                  background:'linear-gradient(135deg,var(--primary),var(--brand-600))',
                  color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none',
                  fontFamily:'inherit', display:'flex', alignItems:'center', gap:8,
                  boxShadow:'0 4px 18px rgba(124,58,237,0.35)',
                }}
              >+ New Study Group</motion.button>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display:'flex', justifyContent:'center', padding:60, color:'var(--text3)' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
            <div style={{ fontSize:14 }}>Loading groups…</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && groups.length === 0 && (
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{
            textAlign:'center', padding:'80px 40px',
            background:'var(--surface)', border:'1px dashed var(--border2)',
            borderRadius:24,
          }}
        >
          <div style={{ fontSize:64, marginBottom:20 }}>{isTeacher ? '🏫' : '🔑'}</div>
          <h3 style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-head)', marginBottom:10 }}>
            {isTeacher ? 'Create your first class' : 'No groups yet'}
          </h3>
          <p style={{ fontSize:14, color:'var(--text3)', maxWidth:380, margin:'0 auto 28px', lineHeight:1.7 }}>
            {isTeacher
              ? 'Create a group for your students, post announcements, assign homework and track progress.'
              : 'Ask your teacher for a 6-character invite code to join a group.'}
          </p>
          {isTeacher ? (
            <button onClick={() => setShowCreate(true)} style={{ padding:'12px 28px', borderRadius:14, background:'linear-gradient(135deg,var(--primary),var(--brand-600))', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
              + Create First Class
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowJoin(true)} style={{ padding:'12px 28px', borderRadius:14, background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                🔑 Join with Code
              </button>
              <button onClick={() => setShowCreate(true)} style={{ padding:'12px 28px', borderRadius:14, background:'linear-gradient(135deg,var(--primary),var(--brand-600))', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                + Create Study Group
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Groups grid */}
      {!isLoading && groups.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
          {groups.map((g, i) => (
            <GroupCard
              key={g._id}
              group={g}
              isTeacher={isTeacher}
              isOwner={g.teacherId === (user?.id || user?.userId)}
              onOpen={id => navigate(`/groups/${id}`)}
              onDelete={deleteGroup}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} isTeacher={isTeacher} />
      <JoinGroupModal   open={showJoin}   onClose={() => setShowJoin(false)}   onJoined={handleJoined}  />
    </div>
  );
}
