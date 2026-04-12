// src/components/groups/GroupDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { groupsAPI } from '../../api/index';
import { useAuthStore } from '../../context/store';

/* ── helpers ──────────────────────────────────────────────── */
const TABS = [
  { key:'feed',        label:'📢 Feed' },
  { key:'assignments', label:'📝 Assignments' },
  { key:'members',     label:'👥 Members' },
  { key:'insights',    label:'📊 Insights',  ownerOnly: true },
];

/* ── shared modal base ───────────────────────────────────── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
        backdropFilter:'blur(8px)', zIndex:400,
        display:'flex', alignItems:'center', justifyContent:'center', padding:20,
      }}
    >
      <motion.div
        initial={{ opacity:0, scale:0.93, y:18 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.93, y:10 }}
        transition={{ type:'spring', stiffness:380, damping:28 }}
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:520,
          background:'var(--surface3)', border:'1px solid var(--border2)',
          borderRadius:24, padding:'32px 32px 28px',
          boxShadow:'var(--shadow-xl)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ fontSize:17, fontWeight:800, fontFamily:'var(--font-head)', letterSpacing:'-0.02em' }}>{title}</h2>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>✕</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

const inputStyle = { width:'100%', padding:'10px 14px', background:'var(--surface2)', border:'1.5px solid var(--border)', borderRadius:10, color:'var(--text)', outline:'none', fontSize:14, fontFamily:'inherit', marginBottom:14 };
const labelStyle = { fontSize:12, fontWeight:700, color:'var(--text2)', display:'block', marginBottom:6 };
const submitBtn  = (label, loading, color='var(--primary)') => (
  <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:11, background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit', opacity: loading ? 0.7 : 1 }}>
    {loading ? 'Saving…' : label}
  </button>
);

/* ── Announcement Card ───────────────────────────────────── */
function AnnouncementCard({ ann, isOwner, groupId, onPin, onDelete }) {
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      style={{
        background:'var(--surface)', border:`1px solid ${ann.pinned ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
        borderRadius:16, padding:'18px 20px',
        borderLeft: ann.pinned ? '4px solid #F59E0B' : '4px solid var(--primary)',
        position:'relative',
      }}
    >
      {ann.pinned && (
        <span style={{ position:'absolute', top:14, right:16, fontSize:11, fontWeight:700, color:'#FBBF24', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', padding:'2px 8px', borderRadius:6 }}>📌 Pinned</span>
      )}
      <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', marginBottom:6, letterSpacing:'-0.02em', paddingRight: ann.pinned ? 80 : 0 }}>{ann.title}</div>
      <p style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.65, marginBottom:12 }}>{ann.body}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:11, color:'var(--text3)' }}>
          {ann.teacherName} · {formatDistanceToNow(new Date(ann.createdAt), { addSuffix:true })}
        </span>
        {isOwner && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => onPin(ann._id)} style={{ fontSize:11, fontWeight:600, color:'#FBBF24', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:7, padding:'3px 9px', cursor:'pointer' }}>
              {ann.pinned ? 'Unpin' : '📌 Pin'}
            </button>
            <button onClick={() => onDelete(ann._id)} style={{ fontSize:11, fontWeight:600, color:'#F87171', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:7, padding:'3px 9px', cursor:'pointer' }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Assignment Card ─────────────────────────────────────── */
function AssignmentCard({ assignment, isOwner, userId, groupId, onGrade, onSubmit }) {
  const mySubmission  = assignment.submissions?.find(s => s.studentId === userId);
  const isOverdue     = assignment.dueDate && isPast(new Date(assignment.dueDate)) && !mySubmission;
  const totalSubs     = assignment.submissions?.length || 0;

  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:16, padding:'18px 20px',
        borderLeft: isOverdue ? '4px solid #EF4444' : mySubmission?.status === 'graded' ? '4px solid #10B981' : '4px solid #3B82F6',
      }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em', flex:1 }}>{assignment.title}</div>
        <span style={{
          fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:7, flexShrink:0, marginLeft:10,
          background: mySubmission?.status === 'graded'
            ? 'rgba(16,185,129,0.12)' : mySubmission
            ? 'rgba(59,130,246,0.12)' : isOverdue
            ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
          color: mySubmission?.status === 'graded'
            ? '#34D399' : mySubmission
            ? '#60A5FA' : isOverdue
            ? '#F87171' : '#FBBF24',
          border: '1px solid currentColor',
        }}>
          {mySubmission?.status === 'graded' ? `✓ Graded ${mySubmission.score}/${assignment.maxScore}` : mySubmission ? '📤 Submitted' : isOverdue ? '⚠ Overdue' : '📋 Pending'}
        </span>
      </div>
      {assignment.description && (
        <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:10 }}>{assignment.description}</p>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:12, fontSize:11, color:'var(--text3)' }}>
          {assignment.dueDate && (
            <span>📅 Due: {format(new Date(assignment.dueDate), 'EEE, MMM d, HH:mm')}</span>
          )}
          <span>⭐ Max: {assignment.maxScore} pts</span>
          {isOwner && <span>📤 {totalSubs} submissions</span>}
        </div>
        {!isOwner && !mySubmission && (
          <button onClick={() => onSubmit(assignment)} style={{ padding:'6px 14px', borderRadius:9, background:'linear-gradient(135deg,#3B82F6,#1D4ED8)', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
            Submit →
          </button>
        )}
        {isOwner && totalSubs > 0 && (
          <button onClick={() => onGrade(assignment)} style={{ padding:'6px 14px', borderRadius:9, background:'rgba(16,185,129,0.12)', color:'#34D399', border:'1px solid rgba(16,185,129,0.25)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
            📋 Grade ({totalSubs})
          </button>
        )}
        {mySubmission?.feedback && (
          <div style={{ width:'100%', marginTop:8, padding:'8px 12px', borderRadius:9, background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', fontSize:12, color:'var(--text2)' }}>
            💬 Feedback: {mySubmission.feedback}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════
   GroupDetailPage
═════════════════════════════════════════════════════════ */
export default function GroupDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const qc        = useQueryClient();
  const isTeacher = user?.role === 'teacher';
  const userId    = user?.id;

  const [tab,           setTab]           = useState('feed');
  const [annModal,      setAnnModal]      = useState(false);
  const [assignModal,   setAssignModal]   = useState(false);
  const [submitModal,   setSubmitModal]   = useState(null); // assignment obj
  const [gradeModal,    setGradeModal]    = useState(null); // assignment obj
  const [gradeTarget,   setGradeTarget]   = useState(null); // submission obj
  const [annForm,       setAnnForm]       = useState({ title:'', body:'', pinned:false });
  const [assignForm,    setAssignForm]    = useState({ title:'', description:'', dueDate:'', maxScore:100 });
  const [submitContent, setSubmitContent] = useState('');
  const [gradeForm,     setGradeForm]     = useState({ score:'', feedback:'' });
  const [saving,        setSaving]        = useState(false);

  // ── Queries ──
  const { data: gData } = useQuery({ queryKey:['group',id], queryFn:() => groupsAPI.get(id) });
  const { data: aData, refetch:refetchAnns } = useQuery({ queryKey:['group-anns',id], queryFn:() => groupsAPI.getAnnouncements(id) });
  const { data: asData, refetch:refetchAsgn } = useQuery({ queryKey:['group-asgn',id], queryFn:() => groupsAPI.getAssignments(id) });
  const group       = gData?.data?.group;
  const isOwner     = group ? group.teacherId === userId : false;

  // Use isOwner in queries that restrict to teacher
  const { data: insData } = useQuery({ queryKey:['group-insights',id], queryFn:() => groupsAPI.getInsights(id), enabled: isOwner && tab==='insights' });

  const anns        = aData?.data?.announcements || [];
  const assignments = asData?.data?.assignments  || [];
  const insights    = insData?.data?.insights    || null;

  if (!group) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60, color:'var(--text3)' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:40, marginBottom:10 }}>⏳</div>Loading…</div>
    </div>
  );

  const color = group.color || '#7C3AED';

  // ── Announcement actions ──
  const postAnn = async e => {
    e.preventDefault();
    if (!annForm.title || !annForm.body) { toast.error('Fill in title and body'); return; }
    setSaving(true);
    try {
      await groupsAPI.createAnnouncement(id, annForm);
      toast.success('Announcement posted!');
      setAnnModal(false);
      setAnnForm({ title:'', body:'', pinned:false });
      refetchAnns();
    } catch { }
    finally { setSaving(false); }
  };
  const pinAnn    = async annId => { await groupsAPI.pinAnnouncement(id, annId); refetchAnns(); };
  const deleteAnn = async annId => { if (!window.confirm('Delete this announcement?')) return; await groupsAPI.deleteAnnouncement(id, annId); refetchAnns(); };

  // ── Assignment actions ──
  const createAssign = async e => {
    e.preventDefault();
    if (!assignForm.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await groupsAPI.createAssignment(id, assignForm);
      toast.success('Assignment created!');
      setAssignModal(false);
      setAssignForm({ title:'', description:'', dueDate:'', maxScore:100 });
      refetchAsgn();
    } catch { }
    finally { setSaving(false); }
  };

  const submitAssign = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await groupsAPI.submitAssignment(id, submitModal._id, { content: submitContent });
      toast.success('Submitted successfully! ✅');
      setSubmitModal(null);
      setSubmitContent('');
      refetchAsgn();
    } catch { }
    finally { setSaving(false); }
  };

  const gradeSub = async e => {
    e.preventDefault();
    if (gradeForm.score === '') { toast.error('Enter a score'); return; }
    setSaving(true);
    try {
      await groupsAPI.gradeSubmission(id, gradeModal._id, gradeTarget._id, gradeForm);
      toast.success('Graded!');
      setGradeModal(null);
      setGradeTarget(null);
      setGradeForm({ score:'', feedback:'' });
      refetchAsgn();
    } catch { }
    finally { setSaving(false); }
  };

  const removeMember = async uid => {
    if (!window.confirm('Remove this student from the group?')) return;
    try {
      await groupsAPI.removeMember(id, uid);
      qc.invalidateQueries({ queryKey:['group',id] });
      toast.success('Student removed');
    } catch { }
  };

  const visibleTabs = TABS.filter(t => !t.ownerOnly || isOwner);

  return (
    <div>
      {/* Back + Header banner */}
      <button onClick={() => navigate('/groups')} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, padding:'6px 14px', color:'var(--text2)', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:20, fontFamily:'inherit' }}>
        ← Back to Groups
      </button>

      <div style={{
        borderRadius:22, overflow:'hidden', marginBottom:28,
        background:`linear-gradient(135deg, ${color}22 0%, transparent 80%)`,
        border:`1px solid ${color}40`,
        position:'relative',
      }}>
        <div style={{ height:6, background:color }} />
        <div style={{ padding:'28px 32px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ fontSize:40, width:60, height:60, borderRadius:16, background:`${color}22`, border:`2px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {group.emoji || '📚'}
              </div>
              <div>
                <h1 style={{ fontSize:26, fontWeight:800, fontFamily:'var(--font-head)', letterSpacing:'-0.035em', marginBottom:6 }}>{group.name}</h1>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:8, background:`${color}18`, color, border:`1px solid ${color}30` }}>
                    {group.subject}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text3)' }}>
                    {group.institutionType === 'university' ? '🎓' : group.institutionType === 'college' ? '🏛️' : '🏫'} {group.institution || group.institutionType}
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text3)' }}>👥 {group.students?.length || 0}/{group.maxStudents}</span>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {isOwner && (
                <>
                  {/* Invite code */}
                  <div style={{ padding:'8px 16px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border2)', fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18, letterSpacing:'0.15em', color:'var(--primary-light)', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--text3)', fontFamily:'var(--font-body)', letterSpacing:0 }}>CODE</span>
                    {group.code}
                    <button
                      onClick={() => { navigator.clipboard.writeText(group.code); toast.success('Code copied!'); }}
                      style={{ width:24, height:24, borderRadius:6, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.22)', color:'var(--primary-light)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}
                      title="Copy code"
                    >⎘</button>
                  </div>
                  <button onClick={() => setAnnModal(true)} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', color:'#FBBF24', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                    📢 Post
                  </button>
                  <button onClick={() => setAssignModal(true)} style={{ padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,var(--primary),var(--brand-600))', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                    + Assign
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:4, width:'fit-content' }}>
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight: tab===t.key ? 700 : 500,
            background: tab===t.key ? 'var(--surface3)' : 'transparent',
            color: tab===t.key ? 'var(--text)' : 'var(--text3)',
            border: tab===t.key ? '1px solid var(--border2)' : '1px solid transparent',
            cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Feed Tab ── */}
      {tab === 'feed' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {anns.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📢</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>No announcements yet</div>
              {isOwner && <button onClick={() => setAnnModal(true)} style={{ marginTop:12, padding:'8px 20px', borderRadius:10, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', color:'#FBBF24', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Post First Announcement</button>}
            </div>
          )}
          {anns.map(a => (
            <AnnouncementCard key={a._id} ann={a} isOwner={isOwner} groupId={id} onPin={pinAnn} onDelete={deleteAnn} />
          ))}
        </div>
      )}

      {/* ── Assignments Tab ── */}
      {tab === 'assignments' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {isOwner && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
              <button onClick={() => setAssignModal(true)} style={{ padding:'9px 18px', borderRadius:10, background:'linear-gradient(135deg,var(--primary),var(--brand-600))', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                + New Assignment
              </button>
            </div>
          )}
          {assignments.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
              <div style={{ fontSize:15, fontWeight:600 }}>No assignments yet</div>
            </div>
          )}
          {assignments.map(a => (
            <AssignmentCard
              key={a._id} assignment={a} isOwner={isOwner} userId={userId} groupId={id}
              onSubmit={a => setSubmitModal(a)}
              onGrade={a => setGradeModal(a)}
            />
          ))}
        </div>
      )}

      {/* ── Members Tab ── */}
      {tab === 'members' && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {group.students?.length || 0} Students
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Owner row */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,var(--primary),var(--brand-600))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👨‍🏫</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{group.teacherName || 'Teacher'}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Group Owner</div>
              </div>
              <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:7, background:'rgba(124,58,237,0.12)', color:'var(--primary-light)', border:'1px solid rgba(124,58,237,0.22)' }}>Owner</span>
            </div>

            {group.students?.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text3)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
                <div>No students yet. Share the invite code: <strong style={{ fontFamily:'var(--font-mono)', color:'var(--primary-light)' }}>{group.code}</strong></div>
              </div>
            )}
            {group.students?.map(s => (
              <motion.div key={s.userId} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 18px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#3B82F620,#3B82F640)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>🎓</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name || 'Student'}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Joined {format(new Date(s.joinedAt), 'MMM d, yyyy')}</div>
                </div>
                {isOwner && (
                  <button onClick={() => removeMember(s.userId)} style={{ padding:'4px 10px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', color:'#F87171', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Remove
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Insights Tab (teacher/owner only) ── */}
      {tab === 'insights' && isOwner && (
        <div>
          {!insights ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text3)' }}>Loading insights…</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
              {[
                { label:'Total Students',   value: insights.totalStudents,    icon:'👥', color:'#3B82F6' },
                { label:'Assignments',       value: insights.totalAssignments, icon:'📝', color:'#7C3AED' },
                { label:'Avg Score',         value: insights.avgScore != null ? `${insights.avgScore}%` : '—', icon:'⭐', color:'#F59E0B' },
                { label:'Submission Rate',   value: `${insights.submissionRate}%`, icon:'📤', color:'#10B981' },
              ].map(s => (
                <motion.div key={s.label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:'22px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontSize:30, fontWeight:900, fontFamily:'var(--font-head)', color:s.color, letterSpacing:'-0.04em', marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Post Announcement */}
      <AnimatePresence>
        <Modal open={annModal} onClose={() => setAnnModal(false)} title="📢 Post Announcement">
          <form onSubmit={postAnn}>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={annForm.title} onChange={e => setAnnForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title…" />
            <label style={labelStyle}>Message</label>
            <textarea rows={5} style={{...inputStyle, resize:'vertical', marginBottom:14}} value={annForm.body} onChange={e => setAnnForm(f=>({...f,body:e.target.value}))} placeholder="Write your announcement here…" />
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text2)', marginBottom:18, cursor:'pointer' }}>
              <input type="checkbox" checked={annForm.pinned} onChange={e => setAnnForm(f=>({...f,pinned:e.target.checked}))} /> Pin this announcement
            </label>
            {submitBtn('📢 Post Announcement', saving, '#F59E0B')}
          </form>
        </Modal>
      </AnimatePresence>

      {/* Create Assignment */}
      <AnimatePresence>
        <Modal open={assignModal} onClose={() => setAssignModal(false)} title="📝 Create Assignment">
          <form onSubmit={createAssign}>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={assignForm.title} onChange={e => setAssignForm(f=>({...f,title:e.target.value}))} placeholder="Assignment title…" />
            <label style={labelStyle}>Description</label>
            <textarea rows={3} style={{...inputStyle, resize:'vertical', marginBottom:14}} value={assignForm.description} onChange={e => setAssignForm(f=>({...f,description:e.target.value}))} placeholder="Assignment instructions…" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:4 }}>
              <div>
                <label style={labelStyle}>Due Date</label>
                <input type="datetime-local" style={inputStyle} value={assignForm.dueDate} onChange={e => setAssignForm(f=>({...f,dueDate:e.target.value}))} />
              </div>
              <div>
                <label style={labelStyle}>Max Score</label>
                <input type="number" style={inputStyle} min={1} max={1000} value={assignForm.maxScore} onChange={e => setAssignForm(f=>({...f,maxScore:Number(e.target.value)}))} />
              </div>
            </div>
            {submitBtn('+ Create Assignment', saving)}
          </form>
        </Modal>
      </AnimatePresence>

      {/* Submit Assignment */}
      <AnimatePresence>
        <Modal open={!!submitModal} onClose={() => setSubmitModal(null)} title={`📤 Submit: ${submitModal?.title}`}>
          <form onSubmit={submitAssign}>
            <label style={labelStyle}>Your Answer / Work</label>
            <textarea rows={6} style={{...inputStyle, resize:'vertical', marginBottom:20}} value={submitContent} onChange={e => setSubmitContent(e.target.value)} placeholder="Write or paste your answer here…" />
            {submitBtn('📤 Submit Assignment', saving, '#3B82F6')}
          </form>
        </Modal>
      </AnimatePresence>

      {/* Grade Submissions */}
      <AnimatePresence>
        <Modal open={!!gradeModal} onClose={() => { setGradeModal(null); setGradeTarget(null); }} title={`📋 Grade: ${gradeModal?.title}`}>
          {!gradeTarget ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {gradeModal?.submissions?.length === 0 && <p style={{ color:'var(--text3)', textAlign:'center', padding:20 }}>No submissions yet</p>}
              {gradeModal?.submissions?.map(sub => (
                <div key={sub._id} onClick={() => { setGradeTarget(sub); setGradeForm({ score: sub.score || '', feedback: sub.feedback || '' }); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, cursor:'pointer' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>{sub.studentName || 'Student'}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{sub.status} · {format(new Date(sub.submittedAt), 'MMM d, HH:mm')}</div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color: sub.status==='graded' ? '#34D399' : 'var(--text3)' }}>
                    {sub.status === 'graded' ? `${sub.score}/${gradeModal.maxScore}` : 'Grade →'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={gradeSub}>
              <div style={{ padding:'12px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, marginBottom:14, fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>
                <strong style={{ color:'var(--text)' }}>{gradeTarget.studentName}</strong>'s submission:<br />
                <span style={{ fontStyle:'italic' }}>{gradeTarget.content || '(No text content)'}</span>
              </div>
              <label style={labelStyle}>Score (out of {gradeModal.maxScore})</label>
              <input type="number" style={inputStyle} min={0} max={gradeModal.maxScore} value={gradeForm.score} onChange={e => setGradeForm(f=>({...f,score:Number(e.target.value)}))} placeholder={`0 – ${gradeModal.maxScore}`} />
              <label style={labelStyle}>Feedback (optional)</label>
              <textarea rows={3} style={{...inputStyle, resize:'vertical', marginBottom:16}} value={gradeForm.feedback} onChange={e => setGradeForm(f=>({...f,feedback:e.target.value}))} placeholder="Write feedback for this student…" />
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setGradeTarget(null)} style={{ flex:1, padding:'10px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text2)', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>← Back</button>
                {submitBtn('✓ Save Grade', saving, '#10B981')}
              </div>
            </form>
          )}
        </Modal>
      </AnimatePresence>
    </div>
  );
}
