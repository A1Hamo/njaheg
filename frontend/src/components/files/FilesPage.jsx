// src/components/files/FilesPage.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { filesAPI, aiAPI } from '../../api/index';
import { Card, Button, Tag, Modal, Input, Select, Spinner, EmptyState, SectionHeader, Btn, ProgressBar } from '../shared/UI';

const SUBJECTS = ['mathematics','science','arabic','english','social_studies'];
const SUBJECT_ICONS = { mathematics:'📐', science:'🔬', arabic:'📚', english:'🌐', social_studies:'🌍' };
const MIME_ICONS = { 'application/pdf':'📄', 'image/jpeg':'🖼️', 'image/png':'🖼️', 'image/gif':'🖼️', 'image/webp':'🖼️' };

function UploadDropzone({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState({ subject: 'mathematics', tags: '', is_public: false });

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    try {
      for (const file of files) {
        await filesAPI.upload(file, meta, setProgress);
        toast.success(`✅ ${file.name} uploaded successfully!`);
      }
      onUploaded?.();
    } catch (err) { 
      console.error(err);
      toast.error(err.response?.data?.error || 'Upload failed. Please check your connection.'); 
    }
    finally { setUploading(false); setProgress(0); }
  }, [meta, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, 
    accept: { 
      'application/pdf': ['.pdf'], 
      'image/*': ['.jpg','.jpeg','.png','.gif','.webp'] 
    },
    maxSize: 200 * 1024 * 1024, 
    disabled: uploading,
  });

  return (
    <Card>
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18, fontFamily: 'var(--font-head)' }}>📥 Secure Vault Upload</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Select value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}>
          {SUBJECTS.map(s => <option key={s} value={s}>{SUBJECT_ICONS[s]} {s.replace('_',' ').toUpperCase()}</option>)}
        </Select>
        <Input 
          placeholder="Tags: notes, exam, summary..." 
          value={meta.tags}
          onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))}
        />
      </div>

      <motion.div {...getRootProps()}
        animate={{ 
          borderColor: isDragActive ? 'var(--primary)' : 'var(--border)',
          background: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface2)' 
        }}
        whileHover={{ scale: 1.01, borderColor: 'var(--primary)' }}
        style={{
          border: '2px dashed', borderRadius: 16, padding: '40px 24px',
          textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <Spinner size="lg" />
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Uploading Excellence... {progress}%</div>
            <div style={{ marginTop: 12, height: 6, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden', maxWidth: 300, margin: '12px auto 0' }}>
              <motion.div style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}
                animate={{ width: `${progress}%` }} transition={{ ease: 'linear' }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 44, marginBottom: 12, filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.2))' }}>
              {isDragActive ? '📂' : '✨'}
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: 'var(--text)' }}>
              {isDragActive ? 'Release to Upload' : 'Drag & drop academic assets here'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>OR CLICK TO BROWSE LOCAL FILES</div>
          </>
        )}
      </motion.div>
    </Card>
  );
}

function FileCard({ file, onDelete, onAnalyze }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01, borderColor: 'var(--border2)' }}
      className="glass-panel"
      style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--surface)', border: '1px solid var(--border)',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ 
        width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 24,
        background: file.mime_type === 'application/pdf' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
        border: '1px solid transparent',
        borderColor: file.mime_type === 'application/pdf' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)'
      }}>
        {MIME_ICONS[file.mime_type] || '📎'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }} className="truncate">{file.original_name}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{Math.round(file.size_bytes / 1024)} KB</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{file.subject?.replace('_',' ')}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{format(new Date(file.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {file.mime_type === 'application/pdf' && (
          <Btn size="sm" variant="glass" onClick={() => onAnalyze(file)}>🤖 AI ANALYZE</Btn>
        )}
        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
          <Btn size="sm" variant="ghost">👁</Btn>
        </a>
        <Btn size="sm" variant="danger" onClick={() => onDelete(file.id)}>🗑</Btn>
      </div>
    </motion.div>
  );
}

export default function FilesPage() {

  const [subject, setSubject] = useState('');
  const [search, setSearch] = useState('');
  const [analyzeFile, setAnalyzeFile] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['files', subject, search],
    queryFn: () => filesAPI.list({ subject: subject || undefined, search: search || undefined }),
  });
  const files = data?.data?.files || [];

  const { mutate: deleteFile } = useMutation({
    mutationFn: filesAPI.remove,
    onSuccess: () => { qc.invalidateQueries(['files']); toast.success('Removed from Vault'); },
    onError:   (err) => toast.error(err.response?.data?.error || 'Removal failed'),
  });

  return (
    <div className="animate-fade-up">
      <SectionHeader 
        icon="📁" 
        title="Knowledge Vault" 
        subtitle="Manage your academic repository. Access, analyze, and organize your study materials with ease." 
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UploadDropzone onUploaded={() => qc.invalidateQueries(['files'])} />
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface2)', padding: 8, borderRadius: 14, border: '1px solid var(--border)' }}>
            <Btn size="sm" variant={!subject ? 'primary' : 'ghost'} onClick={() => setSubject('')}>ALL ASSETS</Btn>
            {SUBJECTS.map(s => (
              <Btn key={s} size="sm" variant={subject === s ? 'primary' : 'ghost'} onClick={() => setSubject(s)}>
                {SUBJECT_ICONS[s]} {s.replace('_',' ').toUpperCase()}
              </Btn>
            ))}
            <div style={{ marginLeft: 'auto', width: 240 }}>
              <Input placeholder="Search Vault..." value={search} onChange={e => setSearch(e.target.value)} prefix="🔍" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)
            ) : files.length === 0 ? (
              <Card><EmptyState icon="📦" title="Vault is Empty" subtitle="Start uploading your study guides and notes to populate your repository." /></Card>
            ) : (
              <AnimatePresence>
                {files.map(f => (
                  <FileCard key={f.id} file={f}
                    onDelete={(id) => { if (window.confirm('Remove this file from your vault?')) deleteFile(id); }}
                    onAnalyze={(f) => setAnalyzeFile(f)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, fontFamily: 'var(--font-head)' }}>Vault Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface2)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{files.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>TOTAL ASSETS</div>
              </div>
              <div style={{ padding: 16, borderRadius: 12, background: 'var(--surface2)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{files.filter(f => f.mime_type === 'application/pdf').length}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700 }}>PDF GUIDES</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase' }}>Subject Distribution</h4>
              {SUBJECTS.map(s => {
                const count = files.filter(f => f.subject === s).length;
                const pct = (count / (files.length || 1)) * 100;
                return (
                  <div key={s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{SUBJECT_ICONS[s]} {s.replace('_',' ')}</span>
                      <span style={{ color: 'var(--text3)', fontWeight: 800 }}>{count}</span>
                    </div>
                    <ProgressBar value={pct} height={6} color="var(--primary)" />
                  </div>
                );
              })}
            </div>
          </Card>
          
          <Card style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)', border: 'none', color: '#fff' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#fff' }}>AI Vault Analysis</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
              Use our advanced AI to summarize your PDFs, generate quizzes, and answer specific questions from your documents instantly.
            </p>
            <div style={{ fontSize: 40, textAlign: 'center', opacity: 0.5 }}>🤖</div>
          </Card>
        </div>
      </div>

      <Modal open={!!analyzeFile} onClose={() => setAnalyzeFile(null)} title={`🤖 INTELLECT ANALYSIS — ${analyzeFile?.original_name}`} size="lg">
        {analyzeFile && <AIFileAnalysis file={analyzeFile} />}
      </Modal>
    </div>
  );
}

function AIFileAnalysis({ file }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await aiAPI.askFile({ question: question.trim(), fileId: file.id });
      setAnswer(res.data.answer);
    } catch (err) { toast.error(err.response?.data?.error || 'Analysis engine failed'); }
    finally { setLoading(false); }
  };

  const runAction = async (action) => {
    setLoading(true);
    try {
      const res = action === 'summarize' 
        ? await aiAPI.summarize({ fileId: file.id })
        : await aiAPI.generateQuiz({ subject: file.subject || 'general', topic: file.original_name, fileId: file.id });
      setAnswer(action === 'summarize' ? res.data.summary : JSON.stringify(res.data, null, 2));
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Btn variant="glass" onClick={() => runAction('summarize')} disabled={loading}>📋 GENERATE SUMMARY</Btn>
        <Btn variant="glass" onClick={() => runAction('quiz')} disabled={loading}>📝 GENERATE QUIZ</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Input 
          value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Query this document..."
          onKeyDown={e => e.key === 'Enter' && ask()}
        />
        <Btn variant="primary" onClick={ask} loading={loading}>ASK INTELLECT</Btn>
      </div>

      <AnimatePresence>
        {answer && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 20, fontSize: 14, lineHeight: 1.8, color: 'var(--text)',
              maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap',
              boxShadow: 'var(--shadow-inner)'
            }}
          >
            {String(answer)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
