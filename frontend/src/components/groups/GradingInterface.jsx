import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { groupsAPI } from '../../api/index';

export default function GradingInterface() {
  const { id, assignmentId } = useParams();
  const navigate = useNavigate();
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // This expects the API to fetch an assignment with populated submissions
  const { data: asgnData, refetch } = useQuery({ 
    queryKey: ['group-asgn', id], 
    queryFn: () => groupsAPI.getAssignments(id) 
  });
  
  const assignment = asgnData?.data?.assignments?.find(a => a._id === assignmentId);
  const submissions = assignment?.submissions || [];
  const currentSub = submissions[activeSubIdx];

  const [form, setForm] = useState({ score: '', feedback: '' });

  // Load current submission grade to form
  if (currentSub && form.score === '' && form.feedback === '' && currentSub.status === 'graded') {
    setForm({ score: currentSub.score, feedback: currentSub.feedback || '' });
  } else if (currentSub && (form.score !== '' || form.feedback !== '') && !saving) {
    if (form.score === '' && currentSub.status !== 'graded') {
      // Just loaded an ungraded sub, reset form.
    }
  }

  const handleGrade = async () => {
    if (!form.score) { toast.error('Score is required'); return; }
    setSaving(true);
    try {
      await groupsAPI.gradeSubmission(id, assignmentId, currentSub._id, form);
      toast.success('Saved successfully!');
      refetch();
    } catch {
      toast.error('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  const nextSub = () => {
    if (activeSubIdx < submissions.length - 1) {
      setActiveSubIdx(idx => idx + 1);
      setForm({ score: '', feedback: '' });
    }
  };

  const prevSub = () => {
    if (activeSubIdx > 0) {
      setActiveSubIdx(idx => idx - 1);
      setForm({ score: '', feedback: '' });
    }
  };

  if (!assignment) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading Assignment Details...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)' }}>
      
      {/* Left Pane: Document / Content Viewer */}
      <div style={{ flex: 2, background: 'var(--surface2)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Viewer Header */}
        <div style={{ padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <button onClick={() => navigate(`/groups/${id}`)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
             <div>
               <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>{assignment.title}</div>
               <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{submissions.length} total submissions</div>
             </div>
           </div>
           
           {/* Pagination Nav */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)' }}>Student {activeSubIdx + 1} of {submissions.length}</span>
             <div style={{ display: 'flex', gap: '4px' }}>
               <button onClick={prevSub} disabled={activeSubIdx === 0} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: activeSubIdx === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
               <button onClick={nextSub} disabled={activeSubIdx === submissions.length - 1} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: activeSubIdx === submissions.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
             </div>
           </div>
        </div>

        {/* The Document Area */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          {currentSub ? (
            <motion.div key={currentSub._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: '800px', minHeight: '800px', background: '#fff', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '60px' }}>
                {/* Mocked PDF / Document Paper */}
                <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'serif', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '32px' }}>
                  {currentSub.studentName || 'Student'} - Assignment Submission
                </h2>
                <div style={{ fontSize: '16px', lineHeight: 1.8, fontFamily: 'serif', color: '#333', whiteSpace: 'pre-wrap' }}>
                  {currentSub.content || 'Submission content was empty or file was not attached correctly.'}
                </div>
            </motion.div>
          ) : (
            <div style={{ color: 'var(--text3)', marginTop: '100px', textAlign: 'center' }}>Select a submission to grade</div>
          )}
        </div>
      </div>

      {/* Right Pane: Grading Panel */}
      <div style={{ flex: 1, minWidth: '350px', maxWidth: '420px', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
         <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              📋 Evaluation Panel
            </h3>
         </div>

         {currentSub ? (
           <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
             
             {/* Student Quick Stats */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', background: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--brand-600))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {currentSub.studentName?.[0] || 'S'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>{currentSub.studentName || 'Unknown Student'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Submitted {new Date(currentSub.submittedAt).toLocaleString()}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: currentSub.status === 'graded' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: currentSub.status === 'graded' ? '#10B981' : '#F59E0B', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                    {currentSub.status}
                  </span>
                </div>
             </div>

             {/* Grading Form */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: '8px' }}>Final Score (Out of {assignment.maxScore})</label>
                  <input 
                    type="number" 
                    value={form.score}
                    onChange={e => setForm({ ...form, score: e.target.value })}
                    placeholder={`e.g. ${assignment.maxScore}`}
                    style={{ width: '100%', padding: '16px', background: 'var(--surface2)', border: '2px solid var(--primary-200)', borderRadius: '12px', fontSize: '24px', fontWeight: 900, textAlign: 'center', color: 'var(--primary-600)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: '8px' }}>Private Feedback</label>
                  <textarea 
                    rows={6}
                    value={form.feedback}
                    onChange={e => setForm({ ...form, feedback: e.target.value })}
                    placeholder="Leave constructive feedback for the student..."
                    style={{ width: '100%', padding: '14px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  <button onClick={handleGrade} disabled={saving} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}>
                    {saving ? 'Saving...' : 'Save & Publish Score'}
                  </button>
                  <button onClick={nextSub} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'transparent', border: '1.5px solid var(--border2)', color: 'var(--text2)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    Skip to Next Student
                  </button>
                </div>
             </div>

           </div>
         ) : (
           <div style={{ padding: '24px', color: 'var(--text3)' }}>No submissions available to grade.</div>
         )}
      </div>

    </div>
  );
}
