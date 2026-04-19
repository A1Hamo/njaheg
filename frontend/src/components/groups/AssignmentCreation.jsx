import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../context/store';
import toast from 'react-hot-toast';
import { groupsAPI } from '../../api/index';

export default function AssignmentCreation() {
  const { id } = useParams(); // group Id
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    allowLate: false,
    plagiarismCheck: false,
  });

  const submit = async e => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      await groupsAPI.createAssignment(id, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        maxScore: Number(form.maxScore),
      });
      toast.success('Assignment published successfully!');
      navigate(`/groups/${id}?tab=assignments`);
    } catch {
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = {
    display: 'block', width: '100%', padding: '14px 16px', fontSize: '15px',
    background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '12px',
    color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s',
  };

  const labelStyles = { display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <button onClick={() => navigate(`/groups/${id}`)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '16px' }}>
            ← Back to Group
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Create Assignment</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Configure instructions, rubrics, and settings for this task.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 700, cursor: 'pointer' }}>Save Draft</button>
           <button onClick={submit} disabled={loading} style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--brand-600))', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(99,102,241,0.2)' }}>
              {loading ? 'Publishing...' : 'Publish Assignment'}
           </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
            <label style={labelStyles}>Assignment Title *</label>
            <input 
              style={{ ...inputStyles, fontSize: '20px', fontWeight: 800, padding: '16px' }} 
              placeholder="e.g. Chapter 4 Integration Practice..."
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} 
            />

            <div style={{ marginTop: '24px' }}>
              <label style={labelStyles}>Instructions</label>
              <textarea 
                rows={8}
                style={{ ...inputStyles, resize: 'vertical', lineHeight: 1.6 }} 
                placeholder="Write detailed instructions or rubrics here. Students will see this when they open the assignment."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} 
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Attachments</h3>
                <button style={{ padding: '8px 16px', background: 'var(--primary-50)', color: 'var(--primary-600)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>+ Add File</button>
             </div>
             <div style={{ border: '2px dashed var(--border2)', borderRadius: '16px', padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
               <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
               <p style={{ fontWeight: 600 }}>Drag & drop files here, or click to browse.</p>
               <p style={{ fontSize: '12px', marginTop: '8px' }}>Supports PDF, DOCX, Images, and Zips up to 50MB.</p>
             </div>
          </motion.div>

        </div>

        {/* Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Grading & Dates</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyles}>Due Date & Time</label>
              <input type="datetime-local" style={inputStyles} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>

            <div>
              <label style={labelStyles}>Maximum Score</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" min={1} style={{ ...inputStyles, flex: 1 }} value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
                <span style={{ fontWeight: 700, color: 'var(--text3)' }}>Points</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Advanced Settings</h3>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
              <input type="checkbox" checked={form.allowLate} onChange={e => setForm({ ...form, allowLate: e.target.checked })} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>Allow Late Submissions</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.4 }}>If checked, students can submit after the deadline but it will be flagged.</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.plagiarismCheck} onChange={e => setForm({ ...form, plagiarismCheck: e.target.checked })} style={{ width: '18px', height: '18px', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>Enable Plagiarism Check</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', lineHeight: 1.4 }}>Automatically scan submissions against web sources and peers.</div>
              </div>
            </label>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
