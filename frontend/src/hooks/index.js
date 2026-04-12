import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore, useUIStore, useNotifStore, useChatStore } from '../context/store';
import { authAPI } from '../api/index';

// src/hooks/index.js

// ── Socket singleton ─────────────────────────────────────
let socketInstance = null;

export function useSocket() {
  const { token } = useAuthStore();
  const { add: addNotif } = useNotifStore();
  const { addMessage, addPrivateMessage } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (!socketInstance) {
      const apiBase = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace(/\/?api\/?$/, '') 
        : 'http://localhost:5000';
      
      const socketURL = import.meta.env.VITE_SOCKET_URL || apiBase;

      socketInstance = io(socketURL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => console.log('🔌 Socket connected:', socketInstance.id));
      socketInstance.on('connect_error', (err) => console.warn('🔌 Socket error:', err.message));
    }

    // Always attach event handlers using the LATEST closures from this render
    const handleNewMessage = ({ roomId, ...msg }) => {
      const room = roomId.replace('room:', '');
      addMessage(room, msg);
    };

    const handleNewPrivateMessage = (msg) => {
      const otherId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      addPrivateMessage(otherId, msg);
    };

    const handleNotification = notif => addNotif(notif);

    socketInstance.on('new_message', handleNewMessage);
    socketInstance.on('new_private_message', handleNewPrivateMessage);
    socketInstance.on('notification', handleNotification);
    socketInstance.on('level_up', handleNotification);
    socketInstance.on('achievement', handleNotification);

    return () => {
      // Safely remove listeners on unmount/effect cleanup to prevent memory leaks/duplicates
      if (socketInstance) {
        socketInstance.off('new_message', handleNewMessage);
        socketInstance.off('new_private_message', handleNewPrivateMessage);
        socketInstance.off('notification', handleNotification);
        socketInstance.off('level_up', handleNotification);
        socketInstance.off('achievement', handleNotification);
      }
    };
  }, [token, user?.id, addMessage, addPrivateMessage, addNotif]);

  return socketInstance;
}

export const getSocket = () => socketInstance;

// ── Auth guard ───────────────────────────────────────────
export function useRequireAuth() {
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    authAPI.me()
      .then(({ data }) => setUser(data.user))
      .catch(() => { logout(); navigate('/login', { replace: true }); });
  }, [isAuthenticated]);

  return isAuthenticated;
}

// ── Translation ──────────────────────────────────────────
const STRINGS = {
  en: {
    dashboard:'Dashboard', planner:'Study Planner', files:'Files',
    notes:'Notes', board:'Shared Board', chat:'Chat', ai:'AI Assistant',
    focus:'Focus Mode', achievements:'Achievements', notifications:'Notifications',
    profile:'Profile', settings:'Settings', analytics:'Analytics',
    login:'Sign In', register:'Create Account', logout:'Sign Out',
    email:'Email', password:'Password', name:'Full Name', grade:'Grade',
    save:'Save', cancel:'Cancel', delete:'Delete', upload:'Upload',
    search:'Search', send:'Send', submit:'Submit', back:'Back',
    loading:'Loading...', noData:'No data yet', required:'Required',
    subject:'Subject', topic:'Topic', duration:'Duration',
    planned:'Planned', completed:'Completed', skipped:'Skipped',
    goodMorning:'Good morning', goodAfternoon:'Good afternoon', goodEvening:'Good evening',
    confirm:'Are you sure?',
  },
  ar: {
    dashboard:'لوحة التحكم', planner:'المخطط الدراسي', files:'الملفات',
    notes:'الملاحظات', board:'اللوحة المشتركة', chat:'الدردشة', ai:'المساعد الذكي',
    focus:'وضع التركيز', achievements:'الإنجازات', notifications:'الإشعارات',
    profile:'الملف الشخصي', settings:'الإعدادات', analytics:'التحليلات',
    login:'تسجيل الدخول', register:'إنشاء حساب', logout:'تسجيل الخروج',
    email:'البريد الإلكتروني', password:'كلمة المرور', name:'الاسم الكامل', grade:'الصف',
    save:'حفظ', cancel:'إلغاء', delete:'حذف', upload:'رفع',
    search:'بحث', send:'إرسال', submit:'تأكيد', back:'رجوع',
    loading:'جاري التحميل...', noData:'لا توجد بيانات', required:'مطلوب',
    subject:'المادة', topic:'الموضوع', duration:'المدة',
    planned:'مخطط', completed:'مكتمل', skipped:'تخطى',
    goodMorning:'صباح الخير', goodAfternoon:'مساء الخير', goodEvening:'مساء النور',
    confirm:'هل أنت متأكد؟',
  },
};

export function useTranslation() {
  const { language } = useUIStore();
  return {
    t: (key) => {
      if (typeof key !== 'string' && typeof key !== 'number') return '';
      const sKey = String(key);
      return STRINGS[language]?.[sKey] ?? STRINGS.en[sKey] ?? sKey;
    },
    lang:    language,
    isAR:    language === 'ar',
  };
}

// ── Page title setter ────────────────────────────────────
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Najah 🎓` : 'Najah Platform 🎓';
  }, [title]);
}


// ── Online/Offline status ────────────────────────────────
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
