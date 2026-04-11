// src/components/board/BoardPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { boardAPI, filesAPI } from '../../api/index';
import { Card, Btn, Modal, Input, Select, Tag, EmptyState, Avatar, SectionHeader, Spinner } from '../shared/UI';

const SUBJECTS = ['mathematics','science','arabic','english','social_studies'];
const S_ICONS  = { mathematics:'📐',science:'🔬',arabic:'📚',english:'🌐',social_studies:'🌍' };

function PostCard({ post, onLike, onSave }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      style={{ 
        background: 'var(--surface)', border: '1px solid var(--border)', 
        borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
      className="glass-panel"
    >
      <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: 'var(--surface2)' }}>
        {post.mime_type?.startsWith('image') && post.file_url ? (
          <img src={post.file_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, opacity: 0.8 }}>
            {S_ICONS[post.subject] || '📄'}
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <Tag color="blue" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none' }}>
            {post.subject?.replace('_',' ').toUpperCase()}
          </Tag>
        </div>
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }} className="truncate">{post.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 16, height: 38, overflow: 'hidden' }}>
          {post.description || 'No description provided.'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Avatar src={post.author_avatar} name={post.author_name} size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{post.author_name}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{format(new Date(post.created_at), 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
          <button onClick={() => onLike(post.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.liked ? 'var(--danger)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, transition: 'all 0.2s' }}>
            {post.liked ? '❤️' : '🤍'} {post.likes_count}
          </button>
          <button onClick={() => onSave(post.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: post.saved ? 'var(--accent)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, transition: 'all 0.2s' }}>
            {post.saved ? '🔖' : '📌'} {post.saves_count}
          </button>
          {post.file_url && (
            <a href={post.file_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
              <Btn size="sm" variant="glass">VIEW</Btn>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function BoardPage() {
  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [shareOpen, setShare] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: 'mathematics', file_id: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['board', subject, search, sort],
    queryFn: () => boardAPI.list({ subject: subject || undefined, search: search || undefined, sort }),
  });
  const { data: filesData } = useQuery({ queryKey: ['files'], queryFn: () => filesAPI.list({ limit: 50 }) });
  const files = filesData?.data?.files || [];
  const posts = data?.data?.posts || [];

  const { mutate: like } = useMutation({ mutationFn: boardAPI.like, onSuccess: () => qc.invalidateQueries(['board']) });
  const { mutate: save_ } = useMutation({ mutationFn: boardAPI.save, onSuccess: () => qc.invalidateQueries(['board']) });
  const { mutate: create, isPending } = useMutation({
    mutationFn: () => boardAPI.create(form),
    onSuccess: () => { qc.invalidateQueries(['board']); setShare(false); toast.success('📋 Resource Shared!'); },
    onError: () => toast.error('Share failed'),
  });

  return (
    <div className="animate-fade-up">
      <SectionHeader 
        icon="📋" 
        title="Community Exchange" 
        subtitle="Access peer-reviewed study resources and share your own expertise with the community."
        action={<Btn variant="primary" onClick={() => setShare(true)}>+ Share Resource</Btn>} 
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface2)', padding: 10, borderRadius: 16, border: '1px solid var(--border)' }}>
        <Btn size="sm" variant={!subject ? 'primary' : 'ghost'} onClick={() => setSubject('')}>ALL RESOURCES</Btn>
        {SUBJECTS.map(s => (
          <Btn key={s} size="sm" variant={subject === s ? 'primary' : 'ghost'} onClick={() => setSubject(s)}>
            {S_ICONS[s]} {s.replace('_',' ').toUpperCase()}
          </Btn>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 140, padding: '7px 12px' }}>
            <option value="newest">NEWEST</option>
            <option value="popular">MOST POPULAR</option>
          </Select>
          <div style={{ width: 220 }}>
            <Input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} prefix="🔍" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 380, borderRadius: 20 }} />)}
        </div>
      ) : posts.length === 0 ? (
        <Card><EmptyState icon="📋" title="No resources found" subtitle="Be the first to share a high-quality resource for this category!" action={<Btn variant="primary" onClick={() => setShare(true)}>+ Share Now</Btn>} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          <AnimatePresence>
            {posts.map(p => <PostCard key={p.id} post={p} onLike={like} onSave={save_} />)}
          </AnimatePresence>
        </div>
      )}

      <Modal open={shareOpen} onClose={() => setShare(false)} title="📤 Share Intellectual Asset" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Asset Title *" placeholder="e.g. Advanced Calculus Summary"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What makes this resource valuable?"
              style={{ 
                width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 12, minHeight: 100,
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', 
                resize: 'none', outline: 'none', transition: 'all 0.2s' 
              }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select label="Subject Category" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
              {SUBJECTS.map(s => <option key={s} value={s}>{S_ICONS[s]} {s.replace('_',' ').toUpperCase()}</option>)}
            </Select>
            <Select label="Source File *" value={form.file_id} onChange={e => setForm(f => ({ ...f, file_id: e.target.value }))}>
              <option value="">Choose from Vault</option>
              {files.map(f => <option key={f.id} value={f.id}>{f.original_name}</option>)}
            </Select>
          </div>

          {files.length === 0 && (
            <div style={{ padding: 12, background: 'rgba(239,68,68,0.05)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
              ⚠️ You must upload a file to the Vault before you can share it.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <Btn variant="ghost" onClick={() => setShare(false)}>Cancel</Btn>
            <Btn variant="primary" loading={isPending} disabled={!form.title || !form.file_id} onClick={() => create()}>Publish Resource →</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
