// src/components/ai/AIAssistant.jsx  — Professional Redesign with Internal/External Provider
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiAPI, filesAPI } from '../../api/index';
import { useUIStore } from '../../context/store';
import { useAIProvider } from '../../context/aiProviderStore';
import {
  Card, Button, Input, Select, Tabs, Spinner,
  EmptyState, SectionHeader, Btn, Tag, Modal,
} from '../shared/UI';

// ════════════════════════════════════════════════════════
// PROVIDER SELECTOR PANEL
// ════════════════════════════════════════════════════════
function ProviderSelector() {
  const { provider, setProvider, providerInfo, setProviderInfo } = useAIProvider();

  useQuery({
    queryKey: ['ai-provider'],
    queryFn: async () => {
      const { data } = await aiAPI.getProvider();
      setProviderInfo(data);
      return data;
    },
    staleTime: 60000,
  });

  const options = [
    {
      key: 'internal',
      icon: '⚡',
      name: 'Internal AI',
      tag: 'ALWAYS ON',
      tagColor: '#10B981',
      desc: 'Built-in engine · Zero API key · Instant responses',
      available: true,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
    },
    {
      key: 'external',
      icon: '🧠',
      name: 'OpenAI GPT-4o',
      tag: 'PREMIUM',
      tagColor: '#6366F1',
      desc: 'Highest quality · Requires API key · Fallback-safe',
      available: providerInfo?.external?.available ?? true,
      gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    },
  ];

  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      borderRadius: 20, padding: '20px 24px', marginBottom: 28,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>
        AI Engine
      </div>
      <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const isActive = provider === opt.key;
          return (
            <motion.button
              key={opt.key}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setProvider(opt.key);
                toast.success(`Switched to ${opt.name}`);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                borderRadius: 14, border: '1px solid',
                borderColor: isActive ? 'transparent' : 'var(--border)',
                background: isActive ? opt.gradient : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--text2)',
                cursor: 'pointer', transition: 'all 0.3s',
                boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
                minWidth: 200, flex: 1,
              }}
            >
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{opt.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 7px',
                    borderRadius: 20, background: isActive ? 'rgba(255,255,255,0.25)' : `${opt.tagColor}20`,
                    color: isActive ? '#fff' : opt.tagColor,
                  }}>{opt.tag}</span>
                </div>
                <div style={{ fontSize: 11, opacity: isActive ? 0.85 : 0.7, marginTop: 2 }}>{opt.desc}</div>
              </div>
              {/* Status dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: opt.available ? '#10B981' : '#EF4444',
                boxShadow: opt.available ? '0 0 8px #10B981' : '0 0 8px #EF4444',
              }} />
            </motion.button>
          );
        })}
      </div>
      {/* Fallback note */}
      <div style={{
        fontSize: 11, color: 'var(--text3)', fontWeight: 500,
        padding: '6px 12px', background: 'var(--surface)', borderRadius: 8,
        border: '1px solid var(--border)', flexShrink: 0,
      }}>
        🛡️ Auto-fallback enabled
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// CHAT
// ════════════════════════════════════════════════════════
function AIChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "👋 Hello! I'm your study assistant. Ask me anything about **Mathematics**, **Science**, **Arabic**, or **English**. I can explain concepts, solve problems, and help you prepare for exams!",
    provider: 'internal',
    ts: new Date(),
  }]);
  const [convId, setConvId]     = useState(null);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showHistory, setShowHistory]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const { language }            = useUIStore();
  const { provider }            = useAIProvider();

  const { data: histData, refetch: refetchHistory } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiAPI.getConversations(),
    select: d => d.data.conversations || [],
  });
  const conversations = histData || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const { data } = await aiAPI.chat({ message: msg, conversationId: convId, language, provider });
      setConvId(data.conversationId);
      const usedProvider = data.provider || provider;
      if (usedProvider === 'internal_fallback') {
        toast('⚡ Switched to Internal AI (external quota exceeded)', { icon: '🔄' });
      }
      setMessages(prev => [...prev, {
        role: 'assistant', content: data.reply,
        provider: usedProvider, ts: new Date(),
      }]);
      refetchHistory();
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, I had trouble connecting. Please try again.',
        provider: 'error', ts: new Date(),
      }]);
    } finally { setLoading(false); }
  };

  const loadConversation = async (id) => {
    try {
      const { data } = await aiAPI.getConversation(id);
      const conv = data.conversation;
      setConvId(conv._id);
      setMessages(
        (conv.messages || []).map(m => ({ role: m.role, content: m.content, ts: m.createdAt }))
      );
      setShowHistory(false);
      toast.success('Conversation loaded');
    } catch { toast.error('Failed to load conversation'); }
  };

  const QUICK_PROMPTS = [
    '📐 Explain fractions', '🔬 What is photosynthesis?',
    '📝 Arabic grammar help', '🔢 How to solve equations?',
    '💡 Study tips', '⚡ Quiz me on science',
  ];

  const copyMsg = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied!');
  };

  const providerBadge = (p) => {
    if (p === 'external')          return { label: 'GPT-4o', color: '#6366F1' };
    if (p === 'internal_fallback') return { label: '⚡ Fallback', color: '#F59E0B' };
    if (p === 'error')             return { label: '⚠️ Error', color: '#EF4444' };
    return { label: '⚡ Internal', color: '#10B981' };
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showHistory ? '280px 1fr' : '1fr', gap: 20, transition: 'all 0.4s' }}>
      {/* Conversation History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              background: 'var(--surface2)', borderRadius: 20, padding: 16,
              border: '1px solid var(--border)', maxHeight: 600,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 8 }}>
              Chat History
            </div>
            <div className="scroll-y" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {conversations.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>No past conversations</div>
              ) : conversations.map(c => (
                <motion.button
                  key={c._id} whileHover={{ x: 4 }}
                  onClick={() => loadConversation(c._id)}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                    background: convId === c._id ? 'var(--primary)18' : 'var(--surface)',
                    border: `1px solid ${convId === c._id ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }} className="truncate">{c.title || 'Chat'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{new Date(c.updatedAt).toLocaleDateString()}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 360px)', minHeight: 480 }}>
        {/* Chat Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Btn size="sm" variant={showHistory ? 'primary' : 'default'} onClick={() => setShowHistory(p => !p)}>
            📚 History
          </Btn>
          <Btn size="sm" variant="default" onClick={() => {
            setMessages([{ role: 'assistant', content: "👋 New conversation started! What would you like to learn?", provider: 'internal', ts: new Date() }]);
            setConvId(null);
          }}>
            ✨ New Chat
          </Btn>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', padding: '4px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            {messages.length - 1} messages
          </div>
        </div>

        {/* Messages */}
        <div className="scroll-y" style={{
          flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
          background: 'var(--surface2)', borderRadius: 20, border: '1px solid var(--border)', marginBottom: 14,
        }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const badge = msg.role === 'assistant' ? providerBadge(msg.provider) : null;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  style={{ maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {/* Provider Badge */}
                  {msg.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>🤖</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, letterSpacing: 0.5 }}>{badge.label}</span>
                    </div>
                  )}
                  {/* Bubble */}
                  <div style={{ position: 'relative' }} className="msg-bubble-wrap">
                    <div style={{
                      padding: '14px 20px', borderRadius: 18, fontSize: 14, lineHeight: 1.75,
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                        : 'var(--surface)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text)',
                      border: '1px solid', whiteSpace: 'pre-wrap',
                      borderColor: msg.role === 'user' ? 'transparent' : 'var(--border2)',
                      boxShadow: msg.role === 'user' ? 'var(--glow)' : 'var(--shadow-sm)',
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 18,
                    }}>
                      {msg.content}
                    </div>
                    {/* Actions */}
                    <motion.button
                      className="msg-copy-btn"
                      onClick={() => copyMsg(msg.content)}
                      style={{
                        position: 'absolute', top: 8, right: msg.role === 'user' ? -36 : 'auto', left: msg.role === 'assistant' ? -36 : 'auto',
                        opacity: 0, width: 28, height: 28, borderRadius: 8,
                        background: 'var(--surface3)', border: '1px solid var(--border)',
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.2s',
                      }}
                    >📋</motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>🤖</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', letterSpacing: 0.5 }}>Thinking...</span>
              </div>
              <div style={{
                padding: '14px 20px', background: 'var(--surface)', borderRadius: 18, borderBottomLeftRadius: 4,
                display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border2)',
              }}>
                {[0, 1, 2].map(i => (
                  <motion.span key={i}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'block' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {QUICK_PROMPTS.map(p => (
            <motion.button key={p} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(p)}
              style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 20,
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontWeight: 600,
              }}
            >{p}</motion.button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about your studies…"
              style={{
                width: '100%', padding: '16px 52px 16px 20px', borderRadius: 30,
                fontSize: 14, background: 'var(--surface2)',
                border: '1px solid var(--border2)',
              }}
            />
            {input && (
              <button onClick={() => setInput('')}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
              >✕</button>
            )}
          </div>
          <Btn variant="primary" onClick={() => sendMessage()} loading={loading}
            style={{ height: 52, width: 110, borderRadius: 26, fontSize: 13 }}
          >
            SEND ↑
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// PDF SUMMARIZER
// ════════════════════════════════════════════════════════
function PDFSummarizer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary]           = useState(null);
  const { language }                    = useUIStore();
  const { provider }                    = useAIProvider();

  const { data: filesData, isLoading } = useQuery({
    queryKey: ['files', 'pdf'],
    queryFn: () => filesAPI.list({ limit: 50 }),
  });
  const pdfs = (filesData?.data?.files || []).filter(f => f.mime_type === 'application/pdf');

  const { mutate: summarize, isPending } = useMutation({
    mutationFn: () => aiAPI.summarize({ fileId: selectedFile, language, provider }),
    onSuccess: ({ data }) => { setSummary(data); toast.success('Analysis complete!'); },
    onError: () => toast.error('Failed to summarize'),
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
      {/* File List */}
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)' }}>Select PDF</h3>
        <div className="scroll-y" style={{ flex: 1, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isLoading ? <Spinner /> : pdfs.length === 0 ? (
            <EmptyState icon="📄" title="No PDFs" subtitle="Upload PDFs to your Vault first." />
          ) : pdfs.map(f => (
            <motion.div key={f.id} onClick={() => setSelectedFile(f.id)} whileHover={{ x: 4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: selectedFile === f.id ? 'rgba(99,102,241,0.12)' : 'var(--surface2)',
                border: '1px solid', borderColor: selectedFile === f.id ? 'var(--primary)' : 'var(--border)',
                borderRadius: 14, cursor: 'pointer', transition: 'all 0.25s',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }} className="truncate">{f.original_name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{f.subject?.toUpperCase() || 'GENERAL'}</div>
              </div>
              {selectedFile === f.id && <span style={{ color: 'var(--primary)', fontSize: 16 }}>✓</span>}
            </motion.div>
          ))}
        </div>
        <Btn variant="primary" style={{ width: '100%', height: 46, borderRadius: 12 }}
          disabled={!selectedFile} loading={isPending} onClick={() => summarize()}
        >
          🔬 Analyze Document
        </Btn>
      </Card>

      {/* Summary Panel */}
      <AnimatePresence mode="wait">
        {summary ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <Card style={{ padding: 28, height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>📋 Document Analysis</h3>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>
                    {summary.fileName} · {summary.pages} pages ·{' '}
                    <span style={{ color: summary.provider === 'external' ? '#6366F1' : '#10B981' }}>
                      {summary.provider === 'external' ? 'GPT-4o' : '⚡ Internal AI'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setSummary(null)}>↩ Reset</Btn>
                  <Btn size="sm" variant="default" onClick={() => navigator.clipboard.writeText(summary.summary).then(() => toast.success('Copied!'))}>
                    📋 Copy
                  </Btn>
                </div>
              </div>
              <div className="scroll-y" style={{
                background: 'var(--surface2)', borderRadius: 14, padding: 20,
                fontSize: 14, lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap',
                border: '1px solid var(--border)', maxHeight: 420,
              }}>
                {summary.summary}
              </div>
            </Card>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 20, minHeight: 300 }}>
            <EmptyState icon="🧬" title="Ready for Analysis" subtitle="Select a document and click Analyze to extract key concepts." />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// QUIZ GENERATOR — Multi-step wizard
// ════════════════════════════════════════════════════════
function QuizGenerator() {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { subject: 'mathematics', topic: '', count: 5, difficulty: 'medium' },
  });
  const [step, setStep]         = useState('config');   // config | taking | results
  const [quiz, setQuiz]         = useState(null);
  const [answers, setAnswers]   = useState({});
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed]   = useState(0);
  const { language }            = useUIStore();
  const { provider }            = useAIProvider();

  // Timer
  useEffect(() => {
    if (step !== 'taking') return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [step, startTime]);

  const { mutate: generate, isPending } = useMutation({
    mutationFn: (data) => aiAPI.generateQuiz({ ...data, language, provider }),
    onSuccess: ({ data }) => {
      setQuiz(data);
      setAnswers({});
      setElapsed(0);
      setStartTime(Date.now());
      setStep('taking');
      toast.success(`${data.count} questions generated!`);
    },
    onError: () => toast.error('Failed to generate quiz'),
  });

  const submitQuiz = async () => {
    const score = quiz.questions.filter((q, i) => answers[i] === q.correct).length;
    const pct   = Math.round((score / quiz.questions.length) * 100);
    setStep('results');
    try {
      await aiAPI.submitQuiz({
        subject: quiz.subject, topic: quiz.topic || '',
        totalQ: quiz.questions.length, correctQ: score,
        difficulty: quiz.difficulty, timeTaken: elapsed,
      });
    } catch {}
    toast.success(`Score: ${pct}% — Well done!`);
  };

  const score    = quiz ? quiz.questions.filter((q, i) => answers[i] === q.correct).length : 0;
  const scorePct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  // ── CONFIG ──
  if (step === 'config') return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Card style={{ padding: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24, color: 'var(--text)' }}>⚙️ Quiz Configuration</h3>
        <form onSubmit={handleSubmit(generate)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select label="Subject" {...register('subject')}>
              <option value="mathematics">📐 Mathematics</option>
              <option value="science">🔬 Science</option>
              <option value="arabic">📖 Arabic</option>
              <option value="english">🔤 English</option>
            </Select>
            <Select label="Difficulty" {...register('difficulty')}>
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </Select>
          </div>
          <Input label="Specific Topic (optional)" placeholder="e.g. Fractions, Newton's laws…" {...register('topic')} />
          <Select label="Number of Questions" {...register('count')}>
            {[3, 5, 10].map(n => <option key={n} value={n}>{n} Questions</option>)}
          </Select>
          <Btn type="submit" variant="primary" loading={isPending} style={{ height: 50, borderRadius: 14, marginTop: 8 }}>
            ✨ Generate Quiz
          </Btn>
        </form>
      </Card>
    </div>
  );

  // ── TAKING ──
  if (step === 'taking' && quiz) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 4, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
            style={{ height: '100%', background: 'var(--primary)', borderRadius: 4 }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', minWidth: 60, textAlign: 'right' }}>
          ⏱ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>
          {Object.keys(answers).length}/{quiz.questions.length}
        </span>
      </div>

      <AnimatePresence>
        {quiz.questions.map((q, qi) => (
          <motion.div key={qi} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.04 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', marginBottom: 10, letterSpacing: 1 }}>
                QUESTION {qi + 1} OF {quiz.questions.length}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, lineHeight: 1.5 }}>{q.question}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  return (
                    <motion.div key={oi} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                      style={{
                        padding: '14px 18px', borderRadius: 12, fontSize: 13, cursor: 'pointer',
                        border: '1px solid', fontWeight: isSelected ? 700 : 500,
                        background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--surface2)',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        color: isSelected ? 'var(--primary-light)' : 'var(--text)',
                        transition: 'all 0.2s',
                      }}
                    >{opt}</motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
        <Btn variant="default" onClick={() => setStep('config')}>← Reconfigure</Btn>
        <Btn variant="primary" size="lg" onClick={submitQuiz}
          disabled={Object.keys(answers).length < quiz.questions.length}
          style={{ minWidth: 200, height: 52, borderRadius: 26 }}
        >
          Submit Assessment ✓
        </Btn>
      </div>
    </div>
  );

  // ── RESULTS ──
  if (step === 'results' && quiz) {
    const color = scorePct >= 80 ? '#10B981' : scorePct >= 50 ? '#F59E0B' : '#EF4444';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Score Card */}
        <Card style={{ padding: 32, textAlign: 'center', background: `linear-gradient(135deg, ${color}12, transparent)`, border: `1px solid ${color}30` }}>
          <div style={{ fontSize: 72, fontWeight: 900, color, marginBottom: 8, fontFamily: 'var(--font-head)' }}>{scorePct}%</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            {scorePct >= 80 ? '🏆 Excellent!' : scorePct >= 50 ? '👍 Good Effort' : '📚 Keep Practicing'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>{score} / {quiz.questions.length} correct · {Math.floor(elapsed / 60)}m {elapsed % 60}s</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <Btn variant="default" onClick={() => { setStep('config'); setQuiz(null); }}>← New Quiz</Btn>
            <Btn variant="primary" onClick={() => { setAnswers({}); setElapsed(0); setStartTime(Date.now()); setStep('taking'); }}>🔄 Retry</Btn>
          </div>
        </Card>

        {/* Review */}
        {quiz.questions.map((q, qi) => {
          const isCorrect = answers[qi] === q.correct;
          return (
            <Card key={qi} style={{ padding: 20, borderColor: isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{isCorrect ? '✅' : '❌'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Q{qi + 1}: {q.question}</div>
                  <div style={{ fontSize: 13, color: '#10B981', marginBottom: 4 }}>✓ {q.options[q.correct]}</div>
                  {!isCorrect && <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 4 }}>✗ Your answer: {q.options[answers[qi]] ?? 'Not answered'}</div>}
                  {q.explanation && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
  return null;
}

// ════════════════════════════════════════════════════════
// STUDY PLAN GENERATOR
// ════════════════════════════════════════════════════════
function StudyPlanGenerator() {
  const { register, handleSubmit } = useForm();
  const [plan, setPlan]           = useState(null);
  const { language }              = useUIStore();
  const { provider }              = useAIProvider();

  const { mutate: generate, isPending } = useMutation({
    mutationFn: (data) => aiAPI.studyPlan({ ...data, language, provider }),
    onSuccess: ({ data }) => { setPlan(data); toast.success('Study plan ready!'); },
    onError: () => toast.error('Failed to generate plan'),
  });

  const typeColors = { study: 'var(--primary)', review: 'var(--info)', practice: 'var(--warning)', rest: 'var(--success)', test: 'var(--accent2)' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 28 }}>
      <Card style={{ height: 'fit-content', padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 20 }}>
          Plan Parameters
        </h3>
        <form onSubmit={handleSubmit(generate)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select label="Subject" {...register('subject', { required: true })}>
            <option value="mathematics">📐 Mathematics</option>
            <option value="science">🔬 Science</option>
            <option value="arabic">📖 Arabic</option>
            <option value="english">🔤 English</option>
          </Select>
          <Input label="Exam / Deadline Date" type="date" {...register('deadline', { required: true })} />
          <Select label="Daily Study Hours" {...register('dailyHours')}>
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={3}>3 hours</option>
            <option value={4}>4 hours</option>
          </Select>
          <Select label="Current Level" {...register('currentLevel')}>
            <option value="beginner">🌱 Beginner</option>
            <option value="intermediate">📈 Intermediate</option>
            <option value="advanced">🚀 Advanced</option>
          </Select>
          <Btn type="submit" variant="primary" loading={isPending} style={{ height: 48, marginTop: 8, borderRadius: 12 }}>
            ✨ Generate Plan
          </Btn>
        </form>
      </Card>

      <div>
        <AnimatePresence mode="wait">
          {plan ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Card style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>📅 Your Study Plan</h3>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {plan.subject} · {plan.daysUntil} days · {plan.totalHours}h total ·{' '}
                      <span style={{ color: plan.provider === 'external' ? '#6366F1' : '#10B981' }}>
                        {plan.provider === 'external' ? 'GPT-4o' : '⚡ Internal'}
                      </span>
                    </div>
                  </div>
                  <Btn size="sm" variant="ghost" onClick={() => setPlan(null)}>↩ Reset</Btn>
                </div>

                <div className="scroll-y" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 440 }}>
                  {(plan.plan || []).slice(0, 14).map(day => (
                    <div key={day.day} style={{
                      background: 'var(--surface2)', borderRadius: 14, padding: '16px 20px',
                      border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>DAY {day.day}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{day.date}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(day.sessions || []).map((s, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[s.type] || 'var(--primary)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: 'var(--text3)', minWidth: 40 }}>{s.time}</span>
                            <span style={{ flex: 1, color: 'var(--text)' }}>{s.topic}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                              background: `color-mix(in srgb, ${typeColors[s.type] || 'var(--primary)'} 15%, transparent)`,
                              color: typeColors[s.type] || 'var(--primary)',
                            }}>{s.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {plan.tips?.length > 0 && (
                  <div style={{ marginTop: 20, padding: 20, background: 'var(--surface2)', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12, color: 'var(--text3)' }}>💡 Strategic Tips</h4>
                    {plan.tips.map((t, i) => (
                      <div key={i} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 10, marginBottom: 6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          ) : (
            <div style={{ height: '100%', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 20 }}>
              <EmptyState icon="🗓️" title="No Plan Yet" subtitle="Configure your parameters and generate a personalized study plan." />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// AI SETTINGS PANEL
// ════════════════════════════════════════════════════════
function AISettings() {
  const { provider, setProvider, language: aiLang, setLanguage: setAILang } = useAIProvider();
  const { language } = useUIStore();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card style={{ padding: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)' }}>⚙️ AI Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 10 }}>Default AI Provider</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['internal', 'external'].map(p => (
                <Btn key={p} variant={provider === p ? 'primary' : 'default'} onClick={() => setProvider(p)} style={{ flex: 1 }}>
                  {p === 'internal' ? '⚡ Internal AI' : '🧠 OpenAI GPT-4o'}
                </Btn>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 10 }}>Response Language</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['en', 'ar'].map(l => (
                <Btn key={l} variant={aiLang === l ? 'primary' : 'default'} onClick={() => setAILang(l)} style={{ flex: 1 }}>
                  {l === 'en' ? '🇺🇸 English' : '🇪🇬 Arabic'}
                </Btn>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)' }}>🔍 Engine Capabilities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'AI Chat',          internal: 'Good',      external: 'Excellent' },
            { label: 'PDF Summary',      internal: 'Good',      external: 'Excellent' },
            { label: 'Quiz Generation',  internal: 'Excellent', external: 'Excellent' },
            { label: 'Study Plans',      internal: 'Excellent', external: 'Excellent' },
          ].map(c => (
            <div key={c.label} style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: 700 }}>⚡ {c.internal}</div>
                <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818CF8', fontWeight: 700 }}>🧠 {c.external}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: 'var(--text2)' }}>
          🛡️ <strong>Auto-fallback:</strong> If OpenAI quota is exceeded, the system automatically switches to Internal AI so your work never stops.
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ROOT COMPONENT
// ════════════════════════════════════════════════════════
export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('chat');
  const TABS = [
    { key: 'chat',     label: 'Neural Chat',   icon: '💬' },
    { key: 'summary',  label: 'Doc Analysis',  icon: '📄' },
    { key: 'quiz',     label: 'Assessments',   icon: '📝' },
    { key: 'plan',     label: 'Study Plan',    icon: '📅' },
    { key: 'settings', label: 'Settings',      icon: '⚙️' },
  ];

  return (
    <div className="animate-fade-up">
      <SectionHeader
        icon="⚡"
        title="Elite Core Intelligence"
        subtitle="Powered by your choice of Internal AI (always on) or OpenAI GPT-4o (premium). Switch anytime."
      />

      {/* Provider Selector */}
      <ProviderSelector />

      {/* Tab Navigation */}
      <div style={{ marginBottom: 28 }}>
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'chat'     && <AIChat />}
          {activeTab === 'summary'  && <PDFSummarizer />}
          {activeTab === 'quiz'     && <QuizGenerator />}
          {activeTab === 'plan'     && <StudyPlanGenerator />}
          {activeTab === 'settings' && <AISettings />}
        </motion.div>
      </AnimatePresence>

      {/* Global style injection for msg hover actions */}
      <style>{`
        .msg-bubble-wrap:hover .msg-copy-btn { opacity: 1 !important; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .scroll-y { overflow-y: auto; }
      `}</style>
    </div>
  );
}
