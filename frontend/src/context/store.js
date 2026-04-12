// src/context/store.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      refresh:         null,
      isAuthenticated: false,

      setAuth: ({ user, token, refresh }) => {
        if (token)   localStorage.setItem('token',   token);
        if (refresh) localStorage.setItem('refresh', refresh);
        set({ user, token, refresh, isAuthenticated: true });
      },
      setUser:  u  => set({ user: u }),
      updateXP: (xp, level) => set(s => ({ user: { ...s.user, xp_points: xp, level } })),
      logout:   () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        set({ user: null, token: null, refresh: null, isAuthenticated: false });
      },
    }),
    {
      name: 'najah-auth',
      partialize: s => ({ token: s.token, refresh: s.refresh, isAuthenticated: s.isAuthenticated, user: s.user }),
    }
  )
);

// ── UI ──────────────────────────────────────────────────
export const useUIStore = create(
  persist(
    (set) => ({
      language:    'en',
      darkMode:    false,
      sidebarOpen: false,

      setLanguage: lang => {
        document.documentElement.setAttribute('dir',  lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        set({ language: lang });
      },
      toggleDark:      ()    => set(s => ({ darkMode: !s.darkMode })),
      setSidebarOpen:  v     => set({ sidebarOpen: v }),
    }),
    { name: 'najah-ui', partialize: s => ({ language: s.language, darkMode: s.darkMode }) }
  )
);

// ── Notifications ────────────────────────────────────────
export const useNotifStore = create(set => ({
  notifications: [],
  unreadCount:   0,
  setAll: (notifications, unreadCount) => set({ notifications, unreadCount }),
  add:    notif  => set(s => ({ notifications: [notif, ...s.notifications], unreadCount: s.unreadCount + 1 })),
  markOne: id    => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount:   Math.max(0, s.unreadCount - 1),
  })),
  clearCount: () => set({ unreadCount: 0 }),
}));

// ── Chat ─────────────────────────────────────────────────
export const useChatStore = create(set => ({
  activeRoom:  'mathematics',
  messages:    {},
  typing:      {},

  setActiveRoom: room => set({ activeRoom: room }),

  setMessages: (room, msgs) => set(s => ({
    messages: { ...s.messages, [room]: msgs },
  })),

  addMessage: (room, msg) => set(s => {
    const old = s.messages[room] || [];
    const msgId = msg.id || msg._id?.toString();
    if (old.some(m => (m.id || m._id?.toString()) === msgId)) return s;
    return {
      messages: { ...s.messages, [room]: [...old, { ...msg, id: msgId }] }
    };
  }),

  setTyping: (room, userId, name, isTyping) => set(s => {
    const rt = { ...(s.typing[room] || {}) };
    if (isTyping) rt[userId] = name; else delete rt[userId];
    return { typing: { ...s.typing, [room]: rt } };
  }),

  // ── Private Chat ──
  privateMessages: {}, // { targetId: [] }
  activePrivateChat: null,
  recentChats: [], // [{ id, name, avatar, lastMsg }]

  setPrivateMessages: (targetId, msgs) => set(s => ({
    privateMessages: { 
      ...s.privateMessages, 
      [targetId]: msgs.map(m => ({ ...m, id: m.id || m._id?.toString() })) 
    }
  })),

  addPrivateMessage: (targetId, msg) => set(s => {
    const old = s.privateMessages[targetId] || [];
    // Robust duplicate check (both id and _id)
    const msgId = msg.id || msg._id?.toString();
    if (old.some(m => (m.id || m._id?.toString()) === msgId)) return s;
    return {
      privateMessages: { ...s.privateMessages, [targetId]: [...old, { ...msg, id: msgId }] }
    };
  }),

  setActivePrivateChat: targetId => set({ activePrivateChat: targetId }),
  
  setRecentChats: chats => set({ recentChats: chats }),
  updateRecentChat: (targetId, update) => set(s => ({
    recentChats: s.recentChats.map(c => c.id === targetId ? { ...c, ...update } : c)
  })),
}));

// ── Groups ────────────────────────────────────────────────
export const useGroupStore = create(set => ({
  groups:       [],
  activeGroup:  null,
  loading:      false,

  setGroups:      groups      => set({ groups }),
  setActiveGroup: group       => set({ activeGroup: group }),
  setLoading:     v           => set({ loading: v }),

  addGroup: group => set(s => ({ groups: [group, ...s.groups] })),

  removeGroup: id => set(s => ({ groups: s.groups.filter(g => g._id !== id) })),

  updateGroup: (id, data) => set(s => ({
    groups: s.groups.map(g => g._id === id ? { ...g, ...data } : g),
    activeGroup: s.activeGroup?._id === id ? { ...s.activeGroup, ...data } : s.activeGroup,
  })),
}));
