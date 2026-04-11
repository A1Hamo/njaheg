import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { chatAPI, filesAPI, usersAPI } from '../../api/index';
import { getSocket, useSocket } from '../../hooks/index';
import { useVoice } from '../../hooks/useVoice';
import { useAuthStore, useChatStore } from '../../context/store';
import { Card, Avatar, EmptyState, Spinner, Button, Modal, Tag } from '../shared/UI';

const ROOMS = [
  { key: 'mathematics',   name: 'Mathematics',   icon: '📐', color: '#6C63FF' },
  { key: 'science',       name: 'Science',        icon: '🔬', color: '#0ECDA8' },
  { key: 'arabic',        name: 'Arabic',         icon: '📚', color: '#F7B731' },
  { key: 'english',       name: 'English',        icon: '🌐', color: '#38BDF8' },
  { key: 'social_studies',name: 'Social Studies', icon: '🌍', color: '#FF5470' },
  { key: 'b_games',       name: 'B-Games',        icon: '🎮', color: '#F43F5E' },
];

export default function ChatPage() {

  const { user } = useAuthStore();
  const { 
    activeRoom, setActiveRoom, messages, setMessages, addMessage, 
    typing: typingUsers, setTyping, setActivePrivateChat, recentChats, setRecentChats 
  } = useChatStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const socket = useSocket() || getSocket();
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useVoice();
  
  const [profileId, setProfileId] = useState(null);
  const [showStickers, setShowStickers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const room = ROOMS.find(r => r.key === activeRoom) || ROOMS[0];
  const roomMessages = messages[activeRoom] || [];

  // Load history when room changes
  useEffect(() => {
    setLoadingHistory(true);
    chatAPI.getMessages(activeRoom, { limit: 50 })
      .then(({ data }) => setMessages(activeRoom, data.messages))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    // Socket room management
    if (socket) {
      socket.emit('join_room', { subject: activeRoom });
      
      const onMsg = ({ roomId, ...msg }) => {
        if (roomId === `room:${activeRoom}`) addMessage(activeRoom, msg);
      };
      
      const onTyping = ({ userId, name, isTyping, roomId }) => {
        if (roomId === `room:${activeRoom}`) setTyping(activeRoom, userId, name, isTyping);
      };

      socket.on('new_message', onMsg);
      socket.on('user_typing', onTyping);
      
      return () => {
        socket.emit('leave_room', { subject: activeRoom });
        socket.off('new_message', onMsg);
        socket.off('user_typing', onTyping);
      };
    }
  }, [activeRoom, socket, addMessage, setMessages, setTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { subject: activeRoom, content: input.trim() });
    setInput('');
    socket.emit('typing', { subject: activeRoom, isTyping: false });
  };

  const handleTyping = (val) => {
    setInput(val);
    if (!socket) return;
    socket.emit('typing', { subject: activeRoom, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', { subject: activeRoom, isTyping: false });
    }, 2000);
  };

  const handlePrivateChat = (u) => {
    if (u.userId === user?.id) return;
    if (!recentChats.find(c => c.id === u.userId)) {
      setRecentChats([{ id: u.userId, name: u.userName, avatar: u.avatarUrl, lastMsg: 'Direct Signal Initialized' }, ...recentChats]);
    }
    setActivePrivateChat(u.userId);
    navigate('/chat/private');
  };

  const onFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    try {
      toast.loading('Uploading sequence active...', { id: 'upload' });
      const { data } = await filesAPI.upload(file, { subject: activeRoom });
      socket.emit('send_message', { subject: activeRoom, content: file.name, type: file.type.startsWith('image/') ? 'image' : 'file', fileUrl: data.file.file_url });
      toast.success('Transmission complete', { id: 'upload' });
    } catch { toast.error('Uplink failed', { id: 'upload' }); }
  };

  const switchRoom = (key) => {
    setActiveRoom(key);
  };

  const typing = Object.values(typingUsers[activeRoom] || {}).filter(n => n !== user?.name);

  const toggleVoice = async () => {
    if (isRecording) {
      const file = await stopRecording();
      if (file) {
        toast.loading('Encoding audio stream...', { id: 'voice' });
        try {
          const { data } = await filesAPI.upload(file, { subject: activeRoom });
          socket.emit('send_message', { subject: activeRoom, content: 'Voice Message', type: 'audio', fileUrl: data.file.file_url });
          toast.success('Audio link established', { id: 'voice' });
        } catch { toast.error('Uplink failed', { id: 'voice' }); }
      }
    } else {
      const ok = await startRecording();
      if (!ok) toast.error('Microphone access required');
    }
  };

  const sendSticker = (emoji) => {
    if (!socket) return;
    socket.emit('send_message', { subject: activeRoom, content: emoji });
    setShowStickers(false);
  };

  return (
    <div className="animate-fade-up" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-head)', color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ filter: 'drop-shadow(var(--glow))' }}>⚡</span> Neural <span style={{ color: 'var(--primary)' }}>Hubs</span>
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Cross-sector collaborative research environments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, flex: 1, overflow: 'hidden' }}>
        {/* Sector Selection */}
        <div className="scroll-y" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Available Sectors</div>
          {ROOMS.map(r => (
            <motion.div key={r.key}
              onClick={() => switchRoom(r.key)}
              whileHover={{ x: 4, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderRadius: 16, cursor: 'pointer', border: '1px solid',
                background: activeRoom === r.key ? `${r.color}20` : 'rgba(255,255,255,0.02)',
                borderColor: activeRoom === r.key ? r.color : 'rgba(255,255,255,0.05)',
                boxShadow: activeRoom === r.key ? `0 0 20px ${r.color}30` : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: 24, filter: activeRoom === r.key ? 'none' : 'grayscale(1)' }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: activeRoom === r.key ? '#fff' : 'var(--text2)' }}>{r.name}</div>
                {activeRoom === r.key && (
                  <motion.div layoutId="active-dot" style={{ position: 'absolute', right: 16, width: 6, height: 6, borderRadius: '50%', background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Transmission Field */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: 24, background: 'var(--glass)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Neural Header */}
          <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${room.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: `1px solid ${room.color}40` }}>
              {room.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{room.name} Research Block</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cluster Online</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" style={{ height: 40, borderRadius: 12 }}>📜 Briefing</Button>
              <Button variant="ghost" size="sm" style={{ height: 40, borderRadius: 12 }}>📂 Vault</Button>
            </div>
          </div>

          {/* Neural Logs */}
          <div className="scroll-y" style={{ flex: 1, padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loadingHistory ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
            ) : roomMessages.length === 0 ? (
              <EmptyState icon={room.icon} title={`Welcome to the ${room.name} sector`} subtitle="Initiate the first academic transmission." />
            ) : (
              <AnimatePresence initial={false}>
                {roomMessages.map((msg, i) => {
                  const isMe = msg.userId === user?.id;
                  return (
                    <motion.div key={msg.id || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ 
                          display: 'flex', 
                          flexDirection: isMe ? 'row-reverse' : 'row', 
                          gap: 12, 
                          alignItems: 'flex-end',
                          alignSelf: isMe ? 'flex-end' : 'flex-start'
                        }}
                    >
                      {!isMe && (
                        <div onClick={() => setProfileId(msg.userId)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} title="View Profile">
                          <Avatar name={msg.userName} src={msg.avatarUrl} size={36} border />
                        </div>
                      )}
                      <div style={{ maxWidth: '80%' }}>
                        {!isMe && (
                          <div onClick={() => setProfileId(msg.userId)} style={{ cursor: 'pointer' }} title="View Profile">
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 4 }}>{msg.userName}</div>
                          </div>
                        )}
                        <div style={{
                          padding: '12px 18px', borderRadius: 18, fontSize: 14, lineHeight: 1.6, fontWeight: 500,
                          background: isMe ? 'linear-gradient(135deg, var(--primary), #8B5CF6)' : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          boxShadow: isMe ? 'var(--glow-sm)' : 'var(--shadow-none)',
                          borderBottomRightRadius: isMe ? 4 : 18,
                          borderBottomLeftRadius: !isMe ? 4 : 18,
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <MessageContent msg={msg} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, textAlign: isMe ? 'right' : 'left', fontWeight: 600 }}>
                          {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : 'synced'}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {typing.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11, color: 'var(--primary)', fontStyle: 'italic', fontWeight: 600, paddingLeft: 44 }}>
                <span style={{ display: 'inline-flex', gap: 3, marginRight: 8 }}>
                  <span className="animate-pulse" style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%' }} />
                  <span className="animate-pulse" style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%', animationDelay: '0.2s' }} />
                  <span className="animate-pulse" style={{ width: 4, height: 4, background: 'currentColor', borderRadius: '50%', animationDelay: '0.4s' }} />
                </span>
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} syncing credentials...
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Uplink Input Area */}
          <div style={{ padding: '24px 30px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
            <AnimatePresence>
              {showStickers && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass-panel" style={{ position: 'absolute', bottom: 85, left: 30, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, zIndex: 10 }}>
                  {['👍','❤️','🔥','👏','🚀','🎓','📚','💡','🎉','💯'].map(s => (
                    <button key={s} onClick={() => sendSticker(s)} style={{ fontSize: 24, padding: 10, borderRadius: 10 }} className="hover-bg">{s}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 12, background: 'rgba(0,0,0,0.1)', padding: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} hidden onChange={onFileUpload} />
              <Button variant="ghost" onClick={() => setShowStickers(!showStickers)} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20 }}>😊</Button>
              <Button variant="ghost" onClick={() => fileInputRef.current.click()} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20 }}>📎</Button>
              <Button variant={isRecording ? 'danger' : 'ghost'} onClick={toggleVoice} className={isRecording ? 'pulse-recording' : ''} style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20 }}>{isRecording ? '⏹️' : '🎤'}</Button>
              
              {isRecording ? (
                <div style={{ flex: 1, padding: '0 12px', color: 'var(--danger)', fontWeight: 800, fontSize: 14 }}>
                  RECORDING UPLINK... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              ) : (
                <input
                  value={input} onChange={e => handleTyping(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Transmitting to #${room.name.toLowerCase()} block...`}
                  style={{ flex: 1, padding: '10px 12px', fontSize: 15, borderRadius: 12, background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                />
              )}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                style={{ padding: '0 24px', height: 44, background: room.color, color: '#fff',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 0 15px ${room.color}40` }}
              >Transmit</motion.button>
            </div>
          </div>
        </Card>
      </div>

      <UserModal userId={profileId} onClose={() => setProfileId(null)} onMessage={handlePrivateChat} />
    </div>
  );
}

function MessageContent({ msg }) {
  if (msg.type === 'image' || (msg.content?.match(/\.(jpg|jpeg|png|gif|webp)$/i) && msg.fileUrl)) {
    return <img src={msg.fileUrl} alt="Neural Visual" style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }} />;
  }
  if (msg.type === 'file') {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-light)', textDecoration: 'underline' }}>
        <span>📂</span> {msg.content}
      </a>
    );
  }
  if (msg.type === 'audio') {
    return (
      <div className="audio-player">
        <button style={{ fontSize: 20 }}>▶️</button>
        <div className="audio-progress" />
        <audio src={msg.fileUrl} preload="metadata" style={{ display: 'none' }} />
        <span style={{ fontSize: 10, fontWeight: 800 }}>AUDIO</span>
      </div>
    );
  }
  return msg.content;
}

function UserModal({ userId, onClose, onMessage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      usersAPI.getUser(userId)
        .then(res => setData(res.data.profile))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [userId]);

  return (
    <Modal open={!!userId} onClose={onClose} title="Neural Profile Sync" size="sm">
      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size="lg" /></div> : data && (
        <div style={{ textAlign: 'center' }}>
          <Avatar src={data.avatar_url} name={data.name} size={120} />
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 16 }}>{data.name}</h3>
          <p style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Grade {data.grade || '---'} • Level {data.level || 0}</p>
          
          <div className="glass-panel" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, fontStyle: data.bio ? 'italic' : 'normal' }}>
              {data.bio || "No bio established in this sector."}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>{data.sessions_done || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary-light)' }}>{data.xp_points || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>XP Credits</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: 'var(--success)' }}>{data.streak_days || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>Streak</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Button variant="default" fullWidth onClick={onClose}>Close</Button>
            <Button variant="primary" fullWidth onClick={() => { onMessage(data); onClose(); }}>Send Signal</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
