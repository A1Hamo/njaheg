# 🎓 تقرير التشخيص الكامل — مشروع نجاح
> فحص شامل لكل ملفات المشروع مع الكود الجاهز للتعديل

---

## 📊 ملخص المشروع

| الجانب | التفاصيل |
|--------|----------|
| **Frontend** | React + Vite + TypeScript |
| **Backend** | Node.js + Express + PostgreSQL + Redis |
| **AI Engine** | Gemini 2.0 Flash + Najah Cognitive Core (Xenova) |
| **Auth** | JWT + Refresh Token + Google OAuth |
| **i18n** | نظام ترجمة مخصص (ar/en) |
| **State** | Zustand |

---

## 🔴 المشكلة الأولى: كل الفئات بتشوف نفس الواجهات

### 🔍 التشخيص الدقيق

فحصت `Dashboard.jsx` — الكود الحالي:

```jsx
export default function Dashboard() {
  const { user } = useAuthStore();
  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }
  return <StudentDashboard />;  // ← طالب مدرسة وطالب جامعة بيشوفوا نفس الحاجة!
}
```

**المشكلة:** المنطق بيفرّق بس بين `teacher` و `student` — مفيش فرق بين طالب مدرسة وطالب جامعة.

فحصت `Layout.jsx` — الـ Sidebar فيه نوعين بس:
- `NAV_SECTIONS_DEF` — للطلاب
- `TEACHER_SECTIONS_DEF` — للمدرسين

**الحل:** إضافة `role: 'university_student'` في قاعدة البيانات والتعامل معها في كل مكان.

---

### ✅ الكود الجاهز — الخطوة 1: تعديل `store.js`

```js
// src/context/store.js — أضف دالة مساعدة
export const getUserRole = (user) => {
  if (!user) return null;
  if (user.role === 'teacher') return 'teacher';
  if (user.role === 'admin') return 'admin';
  // الفرق بين طالب جامعة وطالب مدرسة
  const uniGrades = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Postgrad'];
  if (uniGrades.includes(user.grade) || user.institution_type === 'university') {
    return 'university_student';
  }
  return 'school_student';
};
```

---

### ✅ الكود الجاهز — الخطوة 2: تعديل `Dashboard.jsx`

استبدل الـ export الأخير بالكود ده:

```jsx
// في نهاية Dashboard.jsx — استبدل الـ export الأخير
import { getUserRole } from '../../context/store';

// dashboard لطالب جامعة مختلف
function UniversityStudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const isAr = lang === 'ar';

  const { data: statsData } = useQuery({ queryKey: ['stats'], queryFn: () => usersAPI.getStats() });
  const stats = statsData?.data?.stats || {};

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible">
      <motion.div variants={stagger.item}>
        <WelcomeBanner user={user} />
      </motion.div>

      {/* إحصائيات خاصة بالجامعة */}
      <motion.div variants={stagger.item} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:28 }}>
        <StatCard icon="🎓" value={user?.grade || 'Year 1'} label={isAr ? 'الفرقة الدراسية' : 'Academic Year'} color="#6366F1" />
        <StatCard icon="📊" value={stats.avg_score ? `${stats.avg_score}%` : '—'} label={isAr ? 'المعدل التراكمي' : 'GPA / Avg Score'} color="#10B981" />
        <StatCard icon="📝" value={stats.quizzes_taken || 0} label={isAr ? 'اختبارات منجزة' : 'Exams Done'} color="#06B6D4" />
        <StatCard icon="💎" value={(user?.xp_points || 0).toLocaleString()} label="XP" color="#F59E0B" onClick={() => navigate('/achievements')} />
      </motion.div>

      {/* أدوات الجامعة */}
      <motion.div variants={stagger.item} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <div className="floating-panel" style={{ padding:24 }}>
          <h3 style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>
            {isAr ? '🎯 روابط سريعة للجامعة' : '🎯 University Quick Links'}
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:'🤖', label: isAr ? 'مساعد الأبحاث' : 'Research AI', path:'/ai', grad:'linear-gradient(135deg,#7C3AED,#5B21B6)' },
              { icon:'📁', label: isAr ? 'مكتبة الملفات' : 'File Library', path:'/files', grad:'linear-gradient(135deg,#F59E0B,#D97706)' },
              { icon:'📅', label: isAr ? 'الجدول الدراسي' : 'Schedule', path:'/planner', grad:'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
              { icon:'👥', label: isAr ? 'مجموعات الدراسة' : 'Study Groups', path:'/groups', grad:'linear-gradient(135deg,#10B981,#059669)' },
              { icon:'📊', label: isAr ? 'التحليلات' : 'Analytics', path:'/analytics', grad:'linear-gradient(135deg,#EC4899,#BE185D)' },
              { icon:'🛠️', label: isAr ? 'الأدوات' : 'Tools', path:'/tools', grad:'linear-gradient(135deg,#EF4444,#DC2626)' },
            ].map((a, i) => (
              <motion.button key={a.label} onClick={() => navigate(a.path)}
                whileHover={{ y:-4, scale:1.04 }} whileTap={{ scale:0.96 }}
                className="floating-card"
                style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'16px 14px', borderRadius:16, cursor:'pointer', gap:6, position:'relative', overflow:'hidden', background:'var(--glass)', border:'1px solid var(--border)' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:a.grad, borderRadius:'16px 16px 0 0' }}/>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div style={{ fontSize:12, fontWeight:800, color:'var(--text)' }}>{a.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <QuickActions navigate={navigate} />
      </motion.div>

      <motion.div variants={stagger.item}>
        <DailyQuoteWidget />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Export ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const role = getUserRole(user);

  if (role === 'teacher') {
    return (
      <Suspense fallback={<div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner /></div>}>
        <TeacherDashboard />
      </Suspense>
    );
  }

  if (role === 'university_student') {
    return <UniversityStudentDashboard />;
  }

  // school_student (default)
  return <StudentDashboard />;
}
```

---

### ✅ الكود الجاهز — الخطوة 3: تعديل `Layout.jsx` — إضافة Sidebar لطالب الجامعة

ابحث في `Layout.jsx` عن `TEACHER_SECTIONS_DEF` وأضف بعده:

```js
const UNIVERSITY_SECTIONS_DEF = [
  {
    labelKey: 'Overview',
    items: [
      { key:'dashboard',    path:'/',             Icon: Icons.dashboard,    tKey:'nav.dashboard' },
      { key:'ai',           path:'/ai',           Icon: Icons.ai,           tKey:'nav.ai' },
      { key:'analytics',    path:'/analytics',    Icon: Icons.analytics,    tKey:'nav.analytics' },
    ],
  },
  {
    labelKey: 'Academic',
    items: [
      { key:'planner',      path:'/planner',      Icon: Icons.planner,      tKey:'nav.planner' },
      { key:'files',        path:'/files',        Icon: Icons.files,        tKey:'nav.files' },
      { key:'groups',       path:'/groups',       Icon: Icons.groups,       tKey:'nav.groups' },
      { key:'notes',        path:'/notes',        Icon: Icons.notes,        tKey:'nav.notes' },
      { key:'exam',         path:'/exam',         Icon: Icons.exam,         tKey:'nav.exam' },
      { key:'tools',        path:'/tools',        Icon: Icons.tools,        tKey:'nav.tools' },
    ],
  },
  {
    labelKey: 'Community',
    items: [
      { key:'messages',     path:'/chat',         Icon: Icons.messages,     tKey:'nav.messages', badge: true },
      { key:'achievements', path:'/achievements', Icon: Icons.achievements, tKey:'nav.achievements' },
      { key:'notifications',path:'/notifications',Icon: Icons.notifications,tKey:'nav.notifications', badge: true },
      { key:'payment',      path:'/payment',      Icon: Icons.payment,      tKey:'nav.payment' },
      { key:'help',         path:'/help',         Icon: Icons.help,         tKey:'nav.help' },
    ],
  },
];
```

ثم ابحث في `Layout.jsx` عن السطر اللي بيختار الـ sections حسب الـ role وعدّله:

```jsx
// ابحث عن هذا السطر تقريباً:
const sections = user?.role === 'teacher' ? TEACHER_SECTIONS_DEF : NAV_SECTIONS_DEF;

// استبدله بـ:
import { getUserRole } from '../../context/store';
const userRole = getUserRole(user);
const sections = userRole === 'teacher'
  ? TEACHER_SECTIONS_DEF
  : userRole === 'university_student'
  ? UNIVERSITY_SECTIONS_DEF
  : NAV_SECTIONS_DEF;
```

---

## 🔴 المشكلة الثانية: الذكاء الاصطناعي الداخلي ضعيف

### 🔍 التشخيص الدقيق

فحصت `geminiAI.js` — الـ System Prompt الحالي:

```js
systemInstruction: "You are Najah AI, an expert educational assistant for Egyptian students. Be warm, helpful, and use Arabic when asked."
```

**المشاكل:**
1. الـ System Prompt قصير جداً (سطر واحد) — مش بيحدد شخصية واضحة
2. الـ prompt مش بيبعت context المستخدم (الصف الدراسي، الدور، المادة)
3. `CognitiveEngine.js` بيستخدم `Xenova/nli-deberta-v3-small` للـ Intent Analysis — بيتحمل بطيء ومش محتاجه مع Gemini
4. مفيش memory حقيقية — `const context = { confidence: 0.8, topics: [] }; // Mocked for now`
5. الـ temperature مضبوطة على `0.85` — عالية شوية للتعليم

---

### ✅ الكود الجاهز — تحسين `geminiAI.js`

**استبدل الـ System Prompt وإعدادات النموذج:**

```js
// في geminiAI.js — استبدل SYSTEM_PROMPT وإعدادات النموذج

// ── إعدادات النموذج المحسّنة ─────────────────────────────────
const MODEL_CONFIG = {
  model: 'gemini-2.0-flash',
  safetySettings,
  generationConfig: {
    temperature:     0.7,   // أقل للتعليم = إجابات أدق
    topK:            40,
    topP:            0.92,
    maxOutputTokens: 3000,  // أكبر للشرح المفصّل
  },
};

model      = genAI.getGenerativeModel({ ...MODEL_CONFIG });
modelStream = genAI.getGenerativeModel({ ...MODEL_CONFIG });

// ── System Prompt الاحترافي ─────────────────────────────────
const SYSTEM_PROMPT = `
أنت **نجاح AI** — مساعد تعليمي ذكي ومتخصص للطلاب والمعلمين في مصر والوطن العربي.

## شخصيتك
- تتحدث بنبرة أستاذ مصري دافئ ومتحمس يحب طلابه
- تستخدم أمثلة من الحياة اليومية المصرية (سوق الخضار، المترو، نيل القاهرة...)
- تحتفل بالإنجازات الصغيرة: "ممتاز!", "برافو عليك!", "ده كلام!"
- عندما يصعب الفهم تقول: "لا تقلق خالص، خليني أشرح بطريقة تانية"
- عمرك ما تقول "لا أعرف" — دائماً تحاول وتقدم ما تستطيع

## قواعد اللغة
- إذا كتب الطالب بالعربية ← أجب بالعربية الكاملة
- إذا كتب بالإنجليزية ← أجب بالإنجليزية
- إذا خلط ← اتبع اللغة السائدة
- للمعادلات والأرقام استخدم الأرقام الإنجليزية دائماً

## أسلوب التدريس
1. **لا تعطِ الإجابة مباشرة للواجبات** — وجّه الطالب للتفكير خطوة بخطوة
2. **اشرح بأمثلة** — مش بس نظرية
3. **تحقق من الفهم** — اختم بسؤال: "هل ده واضح؟" أو "جرب تحل المثال ده"
4. **استخدم Markdown** — عناوين، bold، bullet points، معادلات
5. **اذكر السياق السابق** — "زي ما قلنا عن المشتقات..."

## المناهج المغطاة (المنهج المصري)
- الرياضيات: حساب، جبر، هندسة، تفاضل وتكامل، إحصاء
- العلوم: فيزياء، كيمياء، أحياء (بكل مراحلها)
- اللغات: عربي، إنجليزي
- الدراسات: تاريخ، جغرافيا، تربية وطنية
- الجامعة: كل التخصصات العلمية والأدبية

## للمعلمين تحديداً
- ساعد في إعداد خطط الدروس
- اقترح أسئلة امتحان بمستويات مختلفة (سهل/متوسط/صعب/تفكير ناقد)
- لخّص أداء الطلاب وقدم توصيات
- اقترح أنشطة تفاعلية مناسبة للمرحلة

## ما تفعله دائماً
- اذكر المصدر إذا استشهدت بمعلومة علمية
- صحّح الأخطاء برفق: "قريب! بس في نقطة صغيرة..."
- شجع الطالب حتى لو غلط: "المحاولة في حد ذاتها رائعة"
`;

// ── دالة بناء الـ prompt مع context المستخدم ─────────────────
function buildContextualPrompt(user, subject = null) {
  if (!user) return '';
  
  const role = user.role === 'teacher' ? 'مدرس/أستاذ' : 'طالب';
  const grade = user.grade || 'غير محدد';
  const uniGrades = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Postgrad'];
  const level = uniGrades.includes(grade) ? 'جامعي' : 'مدرسي';
  const name = user.name || 'الطالب';

  return `
[Context — لا تذكر هذه المعلومات للمستخدم]
- الاسم: ${name}
- الدور: ${role}
- المرحلة: ${level}
- الصف/الفرقة: ${grade}
${subject ? `- المادة الحالية: ${subject}` : ''}
- تاريخ اليوم: ${new Date().toLocaleDateString('ar-EG')}
[نهاية الـ Context]

`;
}

// ── تصدير الدالة ─────────────────────────────────────────────
exports.buildContextualPrompt = buildContextualPrompt;
```

---

### ✅ الكود الجاهز — تحسين Controller الـ AI

ابحث عن ملف الـ AI controller في `backend/src/controllers/` وأضف الـ context:

```js
// في aiController.js — في دالة chat أو stream
const { buildContextualPrompt } = require('../services/geminiAI');

// قبل إرسال الرسالة لـ Gemini، أضف context المستخدم
const contextPrefix = buildContextualPrompt(req.user, req.body.subject);
const fullMessage = contextPrefix + message;

// أرسل fullMessage بدل message
```

---

### ✅ تحسين `CognitiveEngine.js` — تبسيط وتسريع

**المشكلة:** تحميل `Xenova/nli-deberta-v3-small` بطيء ومش ضروري مع Gemini.

```js
// في CognitiveEngine.js — استبدل processMessage بكود أسرع
async processMessage(user, message, language = 'en', history = []) {
  try {
    // Intent analysis مبسّط بدل Xenova (أسرع بكثير)
    const intent = this.quickIntentAnalysis(message);
    const mindset = await this.mindsetTracker.evaluate(user._id || 'anonymous', message);
    const plan = await this.executionPlanner.createPlan(intent, mindset, { confidence: 0.8, topics: [] });
    return await this.adaptiveTeacher.synthesize(message, history, language, plan, {}, mindset);
  } catch (err) {
    logger.error('Cognitive Core Error:', err);
    return this.adaptiveTeacher.fallbackResponse(message, history, language);
  }
}

// دالة تحليل سريعة بدون ML model ثقيل
quickIntentAnalysis(message) {
  const lower = message.toLowerCase();
  const arabicMsg = /[\u0600-\u06FF]/.test(message);
  
  const patterns = {
    request_for_quiz: /اختبار|quiz|test|أسئلة|questions/i,
    explanation_request: /اشرح|explain|ما هو|what is|كيف|how/i,
    math_problem: /حل|solve|احسب|calculate|=|\d+[+\-×÷*\/]\d+/,
    emotional: /صعب|hard|مش فاهم|confused|تعبان|frustrated/i,
    greeting: /^(مرحبا|هاي|hello|hi|أهلا|السلام)/i,
  };

  for (const [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(message)) {
      return { primaryIntent: intent, confidence: 0.85, needsResearch: false };
    }
  }
  
  return { primaryIntent: 'general_question', confidence: 0.7, needsResearch: false };
}
```

---

## 🔴 المشكلة الثالثة: اللغة مش بتحول المنصة بالكامل

### 🔍 التشخيص الدقيق

**عندك مشكلتين:**

**1. تعارض في مكانين بيديروا اللغة:**
- `i18n/index.js` — عنده state منفصل
- `store.js` (`useUIStore`) — عنده `language` كمان

في `GlobalSync` في `App.jsx`:
```jsx
const { darkMode, language, setInstitutionMode } = useUIStore(); // بياخد من UIStore
```

لكن `i18n/index.js`:
```js
const [lang, setLang] = useState(
  () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG
);
```

**النتيجة:** لو غيّرت اللغة من UIStore مش بييجي مع i18n والعكس.

**2. نصوص Hardcoded:** في `Dashboard.jsx` و`Layout.jsx` و`NotFound` في `App.jsx`:
```jsx
// App.jsx سطر 150
<p>The page you're looking for doesn't exist or has been moved.</p>
// هذا النص مش بيتترجم!
```

---

### ✅ الكود الجاهز — توحيد نظام اللغة

**الحل: اجعل `i18n/index.js` هو المصدر الوحيد للحقيقة**

```js
// src/i18n/index.js — الإصدار المحسّن (استبدل الملف كله)
import { createElement, createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from './ar';
import en from './en';

const DICTIONARIES = { ar, en };
const DEFAULT_LANG = 'ar';
const STORAGE_KEY  = 'najah_lang';

export const I18nContext = createContext(null);

function deepGet(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(
    () => {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      // مزامنة مع UIStore أيضاً
      try {
        const uiStore = JSON.parse(localStorage.getItem('najah-ui') || '{}');
        return uiStore?.state?.language || saved || DEFAULT_LANG;
      } catch {
        return saved || DEFAULT_LANG;
      }
    }
  );

  const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];

  const setLang = useCallback((newLang) => {
    const dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    
    // مزامنة مع UIStore
    try {
      const uiStoreKey = 'najah-ui';
      const stored = JSON.parse(localStorage.getItem(uiStoreKey) || '{}');
      stored.state = { ...stored.state, language: newLang };
      localStorage.setItem(uiStoreKey, JSON.stringify(stored));
    } catch {}
    
    setLangState(newLang);
  }, []);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback((key) => deepGet(dict, key), [dict]);
  const toggleLang = useCallback(() => setLang(lang === 'ar' ? 'en' : 'ar'), [lang, setLang]);

  const value = { lang, setLang, toggleLang, t, isRTL: lang === 'ar', dir: lang === 'ar' ? 'rtl' : 'ltr' };
  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

export default { I18nProvider, useTranslation };
```

---

### ✅ إضافة مفاتيح ترجمة ناقصة في `ar.js`

أضف في نهاية الـ object في `ar.js`:

```js
// في ar.js — أضف هذه المفاتيح الناقصة
errors: {
  notFound:    'الصفحة غير موجودة',
  notFoundSub: 'الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها.',
  goHome:      'العودة للرئيسية',
  serverError: 'خطأ في الخادم',
},
common: {
  loading:   'جار التحميل...',
  save:      'حفظ',
  cancel:    'إلغاء',
  delete:    'حذف',
  edit:      'تعديل',
  search:    'بحث',
  back:      'رجوع',
  next:      'التالي',
  send:      'إرسال',
  unread:    'غير مقروء',
  online:    'متصل',
  offline:   'غير متصل',
  viewAll:   'عرض الكل',
  noData:    'لا توجد بيانات',
  success:   'تم بنجاح',
  error:     'حدث خطأ',
  confirm:   'تأكيد',
  yes:       'نعم',
  no:        'لا',
},
dashboard: {
  welcome:        'أهلاً',
  readyToLearn:   'مستعد للتعلم؟',
  dayStreak:      'أيام متواصلة',
  onFire:         '🏆 أداء ناري!',
  keepGoing:      'استمر!',
  levelProgress:  'تقدم المستوى',
  quickAccess:    'وصول سريع',
  todaySchedule:  'جدول اليوم',
  myGroups:       'مجموعاتي',
  studyActivity:  'النشاط الدراسي',
  fullAnalytics:  'التحليلات كاملة',
  campusLife:     'بيئة التعلم',
  viewAll:        'عرض الكل',
  addSession:     '+ إضافة جلسة',
  noSessions:     'لا توجد جلسات اليوم',
  noSessionsSub:  'أضف جلسة دراسية إلى مخططك وابقَ على المسار الصحيح.',
},
ai: {
  title:        'المساعد الذكي',
  placeholder:  'اسأل أي سؤال... (رياضيات، علوم، تاريخ...)',
  send:         'إرسال',
  newChat:      'محادثة جديدة',
  history:      'السجل',
  searchMode:   'وضع البحث',
  thinking:     'نجاح AI يفكر...',
  error:        'حدث خطأ، حاول مرة أخرى',
  copy:         'نسخ',
  readAloud:    'قراءة بصوت',
  suggestions:  'اقتراحات',
},
```

---

### ✅ إصلاح النصوص الـ Hardcoded في `App.jsx`

**في دالة `NotFound`، استبدل:**
```jsx
// قبل
<p>The page you're looking for doesn't exist or has been moved.</p>

// بعد
<p style={{ color: 'var(--text3)', fontSize: 15, marginBottom: 32, lineHeight: 1.65 }}>
  {t('errors.notFoundSub')}
</p>
```

```jsx
// قبل
<a href="/">← {t('nav.dashboard')}</a>

// بعد  
<a href="/">{t('errors.goHome')}</a>
```

---

## 🟡 المشكلة الرابعة: توسيع صلاحيات الأدمن

### 🔍 التشخيص الدقيق

فحصت `AdminDashboard.jsx` — الأدمن الحالي:
- أدمن واحد بكل الصلاحيات
- بيستخدم `adminToken` منفصل
- مفيش نظام لإنشاء أدمن تاني

**المطلوب:** إضافة جدول `admin_roles` في قاعدة البيانات.

---

### ✅ Migration SQL — إضافة جدول Admin Roles

```sql
-- backend/src/migrations/add_admin_roles.sql

-- إضافة نوع الأدمن للجدول الحالي
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_level INTEGER DEFAULT NULL;
-- NULL = مش أدمن, 1 = super admin, 2 = admin, 3 = content moderator, 4 = institution admin

-- جدول صلاحيات الأدمن المخصصة
CREATE TABLE IF NOT EXISTS admin_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission  VARCHAR(100) NOT NULL,
  granted_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, permission)
);

-- الصلاحيات المتاحة:
-- 'manage_users', 'manage_content', 'view_analytics', 
-- 'manage_payments', 'manage_admins', 'view_logs',
-- 'manage_institution:{institution_id}'

-- إنشاء index للأداء
CREATE INDEX IF NOT EXISTS idx_admin_permissions_admin_id ON admin_permissions(admin_id);
```

---

### ✅ Backend — Middleware للتحقق من صلاحيات الأدمن

```js
// backend/src/middleware/adminAuth.js — ملف جديد
'use strict';
const { pool } = require('../config/postgres');

// التحقق من أن المستخدم أدمن
const requireAdmin = (minLevel = 2) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  
  // Super admin (level 1) يمر دائماً
  if (req.user.admin_level === 1) return next();
  
  if (!req.user.admin_level || req.user.admin_level > minLevel) {
    return res.status(403).json({ error: 'Insufficient admin privileges' });
  }
  next();
};

// التحقق من صلاحية معينة
const requirePermission = (permission) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.admin_level === 1) return next(); // Super admin
  
  const { rows } = await pool.query(
    'SELECT 1 FROM admin_permissions WHERE admin_id=$1 AND permission=$2',
    [req.user.id, permission]
  );
  
  if (rows.length === 0) {
    return res.status(403).json({ error: `Permission required: ${permission}` });
  }
  next();
};

// إنشاء أدمن جديد (Super Admin فقط)
const createAdmin = async (req, res) => {
  if (req.user.admin_level !== 1) {
    return res.status(403).json({ error: 'Only Super Admin can create admins' });
  }
  
  const { userId, adminLevel, permissions } = req.body;
  
  await pool.query(
    'UPDATE users SET admin_level=$1 WHERE id=$2',
    [adminLevel, userId]
  );
  
  if (permissions?.length) {
    const vals = permissions.map((p, i) => `($1,$${i+2},$3)`).join(',');
    await pool.query(
      `INSERT INTO admin_permissions (admin_id, permission, granted_by) VALUES ${vals} ON CONFLICT DO NOTHING`,
      [userId, ...permissions, req.user.id]
    );
  }
  
  res.json({ success: true, message: `Admin level ${adminLevel} created` });
};

module.exports = { requireAdmin, requirePermission, createAdmin };
```

---

### ✅ Frontend — إضافة قسم "إدارة الأدمن" في AdminDashboard

أضف في `AdminDashboard.jsx` tab جديد:

```jsx
// أضف في الـ tabs array:
{ id: 'admins', label: '👥 إدارة الأدمن' }

// وأضف الـ component:
function AdminsManagementTab({ client }) {
  const [admins, setAdmins] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', adminLevel: 2, permissions: [] });

  useEffect(() => {
    client.get('/admin/admins-list').then(r => setAdmins(r.data.admins || []));
  }, []);

  const PERMISSIONS = [
    { key: 'manage_users',   label: 'إدارة المستخدمين' },
    { key: 'manage_content', label: 'إدارة المحتوى' },
    { key: 'view_analytics', label: 'عرض التحليلات' },
    { key: 'manage_payments',label: 'إدارة المدفوعات' },
    { key: 'view_logs',      label: 'عرض السجلات' },
  ];

  const LEVELS = [
    { value: 2, label: 'أدمن عادي' },
    { value: 3, label: 'مشرف محتوى' },
    { value: 4, label: 'مشرف مؤسسة' },
  ];

  const handleCreate = async () => {
    try {
      await client.post('/admin/create-admin', form);
      toast.success('تم إنشاء الأدمن بنجاح');
      setShowCreate(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>إدارة الأدمن</h2>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          + إنشاء أدمن جديد
        </button>
      </div>

      {/* قائمة الأدمن الحاليين */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {admins.map(admin => (
          <div key={admin.id} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700 }}>{admin.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{admin.email}</div>
            </div>
            <span style={{ padding: '4px 12px', background: admin.admin_level === 1 ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.2)', color: admin.admin_level === 1 ? '#818CF8' : '#34D399', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {admin.admin_level === 1 ? 'Super Admin' : admin.admin_level === 2 ? 'أدمن' : admin.admin_level === 3 ? 'مشرف محتوى' : 'مشرف مؤسسة'}
            </span>
          </div>
        ))}
      </div>

      {/* Modal إنشاء أدمن */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: 32, width: 480, maxWidth: '90vw' }}>
            <h3 style={{ color: '#fff', marginBottom: 20, fontSize: 18, fontWeight: 800 }}>إنشاء أدمن جديد</h3>
            
            <input placeholder="البريد الإلكتروني للمستخدم" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', marginBottom: 14, boxSizing: 'border-box' }} />
            
            <select value={form.adminLevel} onChange={e => setForm(f => ({ ...f, adminLevel: Number(e.target.value) }))}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff', marginBottom: 14 }}>
              {LEVELS.map(l => <option key={l.value} value={l.value} style={{ background: '#1e1b4b' }}>{l.label}</option>)}
            </select>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10 }}>الصلاحيات:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PERMISSIONS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#fff', fontSize: 13 }}>
                    <input type="checkbox" checked={form.permissions.includes(p.key)}
                      onChange={e => setForm(f => ({ ...f, permissions: e.target.checked ? [...f.permissions, p.key] : f.permissions.filter(x => x !== p.key) }))} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleCreate} style={{ flex: 1, padding: '12px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>إنشاء</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🟢 أخطاء إضافية وجدتها في الكود

### 1. Bug: `signAccess(user.id)` بدل `signAccess(user)` في guestRegister

```js
// في authController.js سطر ~55
// ❌ خطأ:
token: signAccess(user.id),

// ✅ صح:
token: signAccess(user),
```

### 2. Bug: `DailyQuoteWidget` — نص الـ `sub` الخاص بالـ streak مش بيتترجم

```jsx
// في Dashboard.jsx
// ❌ خطأ:
<div>🔥 Day Streak</div>

// ✅ صح:
<div>{isAr ? 'سلسلة الأيام' : 'Day Streak'}</div>
```

### 3. تحسين: `Protected` route مش بيحفظ الـ redirect destination

```jsx
// في App.jsx
// ❌ الحالي:
if (!isAuthenticated) return <Navigate to="/login" replace />;

// ✅ الأفضل (يحفظ الصفحة المطلوبة):
import { useLocation } from 'react-router-dom';
function Protected({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppShell><ErrorBoundary><Suspense fallback={<PageLoader />}>{children}</Suspense></ErrorBoundary></AppShell>;
}

// وفي LoginPage:
const from = location.state?.from?.pathname || '/';
navigate(from, { replace: true });
```

### 4. Security: Admin routes بدون حماية حقيقية

```jsx
// في App.jsx
// ❌ الحالي — أي حد يقدر يفتح /admin/dashboard:
<Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />

// ✅ المطلوب — إضافة AdminProtected component:
function AdminProtected({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
// ثم:
<Route path="/admin/dashboard" element={<AdminProtected><AdminDashboard /></AdminProtected>} />
```

---

## 📋 ملخص الأولويات

| الأولوية | المشكلة | الصعوبة | الوقت المتوقع |
|---------|---------|---------|--------------|
| 🔴 عاجل | واجهات منفصلة حسب الفئة | متوسطة | 2-3 ساعات |
| 🔴 عاجل | إصلاح bug الـ Admin route (بدون حماية) | سهلة | 30 دقيقة |
| 🔴 عاجل | توحيد نظام اللغة | سهلة | 1 ساعة |
| 🟡 مهم | تحسين System Prompt للـ AI | سهلة | 1 ساعة |
| 🟡 مهم | إصلاح bug `signAccess(user.id)` | سهلة | 5 دقائق |
| 🟡 مهم | نظام الأدمن المتعدد المستويات | صعبة | 4-5 ساعات |
| 🟢 تحسين | إضافة مفاتيح ترجمة ناقصة | سهلة | 1 ساعة |
| 🟢 تحسين | تحسين CognitiveEngine (إزالة Xenova) | متوسطة | 1 ساعة |
| 🟢 تحسين | حفظ الـ redirect بعد Login | سهلة | 20 دقيقة |

---

*تم الفحص بواسطة Claude — نجاح v6 — أبريل 2026*
# 🚀 NAJAH PLATFORM — MASTER UPGRADE PROMPT
## برومبت التطوير الشامل والمتكامل من الصفر للنهاية

> **نسخة:** v7.0 — Production-Grade  
> **الهدف:** منصة تعليمية عالمية المستوى للطلاب والمعلمين في مصر والوطن العربي  
> **المكدس:** React 18 + Vite + Node.js + Express + PostgreSQL + Redis + Gemini AI

---

# ══════════════════════════════════════
# PART 1 — ROLE-BASED SYSTEM (الواجهات حسب الفئة)
# ══════════════════════════════════════

## 1.1 — تعريف الأدوار الكاملة

```
يوجد 5 أدوار رئيسية في النظام:

1. school_student   — طالب مدرسة (ابتدائي / إعدادي / ثانوي)
2. university_student — طالب جامعي (فرقة 1-6 + دراسات عليا)
3. teacher          — مدرس/أستاذ (مدرسة / جامعة / خصوصي)
4. admin            — مدير النظام (متعدد المستويات)
5. guest            — زائر مؤقت (صلاحيات محدودة)

تحديد الدور:
- يُحفظ في عمود `role` في جدول users
- طالب جامعي: role='student' + institution_type='university' أو grade في ['Year 1'..'Year 6','Postgrad']
- طالب مدرسة: role='student' + institution_type='school'
- دور الأدمن: عمود `admin_level` (1=super, 2=admin, 3=moderator, 4=institution)
```

---

## 1.2 — دالة تحديد الدور (store.js)

```javascript
// src/context/store.js — أضف هذه الدالة
export const getUserRole = (user) => {
  if (!user) return null;
  if (user.role === 'admin' || user.admin_level) return 'admin';
  if (user.role === 'teacher') return 'teacher';
  const uniGrades = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Postgrad'];
  if (
    uniGrades.includes(user.grade) ||
    user.institution_type === 'university' ||
    user.institutionType === 'university'
  ) return 'university_student';
  return 'school_student';
};
```

---

## 1.3 — واجهة طالب المدرسة (SchoolStudentDashboard)

```
اصنع واجهة مخصصة لطالب المدرسة في:
src/components/dashboard/SchoolStudentDashboard.jsx

المميزات المطلوبة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎮 1. نظام Gamification قوي:
   - شريط XP مع رسوم متحركة احتفالية عند الارتفاع
   - شارات إنجاز مرئية (🏆🥇🎖️) مع tooltip للشرح
   - "Streak Fire" يكبر كلما زادت الأيام المتواصلة
   - ليدربورد أسبوعي لأكثر الطلاب نشاطاً في الفصل

📅 2. جدول المواعيد المرئي:
   - عرض حصص اليوم بألوان مادة مختلفة
   - تنبيه بصري للحصة القادمة خلال 30 دقيقة
   - زر "أبدأ المذاكرة الآن" يفتح Pomodoro Timer مباشرة

📚 3. الواجبات والامتحانات:
   - قائمة واجبات مع Deadline countdown ملوّن (أخضر > أصفر > أحمر)
   - تقويم مصغر يعرض الامتحانات القادمة
   - زر "اسأل AI عن الواجب" في كل واجب مباشرة

🌟 4. بطاقة المادة المفضلة:
   - AI يحدد المادة الأقوى للطالب من سجل الأداء
   - اقتراح "درس اليوم" حسب المادة الأضعف

🎯 5. Quick Actions للمدرسة:
   - المساعد الذكي | المذاكرة مع Pomodoro | واجباتي | اختبار سريع | رسائل المدرس

تصميم UI:
   - ألوان: بنفسجي (#7C3AED) وأخضر (#10B981) وأصفر (#F59E0B) على خلفية داكنة
   - بطاقات بزوايا دائرية كبيرة (24px) مع glow effects
   - رسوم متحركة playful — Framer Motion stagger على البطاقات
   - عناوين بخط Syne أو Outfit — احترافي ومرح في آن واحد
   - أيقونات Emoji كبيرة مع تأثير hover scale
   - progress bars ملونة مع shimmer animation
```

---

## 1.4 — واجهة طالب الجامعة (UniversityStudentDashboard)

```
اصنع واجهة احترافية لطالب الجامعة في:
src/components/dashboard/UniversityStudentDashboard.jsx

المميزات المطلوبة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. لوحة الأداء الأكاديمي:
   - بطاقة GPA مع رسم بياني لآخر 4 فصول
   - مقارنة أدائه بمتوسط الزملاء (anonymized)
   - تتبع ساعات الدراسة الأسبوعية مقابل الهدف

🔬 2. مركز الأبحاث والمشاريع:
   - قائمة المشاريع مع نسبة الإنجاز (progress ring)
   - "مساعد الأبحاث AI" — يساعد في الكتابة والتلخيص والاقتباس
   - مكتبة الـ PDFs مع AI summarizer مدمج

📅 3. الجدول الأكاديمي:
   - عرض أسبوعي calendar view للمحاضرات
   - تتبع الحضور والغياب
   - مواعيد تسليم المشاريع والامتحانات النهائية

💬 4. شبكة التواصل الجامعي:
   - مجموعات دراسة حسب المادة والفرقة
   - غرف مناقشة مفتوحة
   - التواصل مع الدكتور

🧠 5. AI أكاديمي متقدم:
   - "مساعد البحث" — يلخص أوراق علمية ويقترح مراجع
   - "مصحح الكتابة" — يراجع الأبحاث والتقارير
   - "محاكي الامتحان" — يولد أسئلة بنمط الكلية

تصميم UI:
   - أكثر احترافية وأقل playfulness من واجهة المدرسة
   - ألوان: أزرق (#3B82F6) وأرجواني (#8B5CF6) وفيروزي (#06B6D4)
   - تصميم editorial — مثل Notion أو Linear
   - Data visualization مع Recharts (bar, line, donut charts)
   - Typography: خط Cairo للعربي، Bricolage Grotesque للإنجليزي
   - بطاقات clean مع subtle borders وlayered shadows
   - Dark mode first مع ألوان عميقة (#0F0F1A background)
```

---

## 1.5 — واجهة المدرس (TeacherDashboard) — ترقية شاملة

```
طوّر الواجهة الحالية في:
src/components/teacher/TeacherDashboard.jsx

وأضف 3 صفحات جديدة:
   src/components/teacher/LessonPlanner.jsx
   src/components/teacher/ClassAnalytics.jsx
   src/components/teacher/ExamBuilder.jsx

المميزات المطلوبة في TeacherDashboard:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. لوحة الفصول الدراسية:
   - بطاقة لكل فصل مع: عدد الطلاب، متوسط الدرجات، نسبة الحضور
   - مؤشر "الطلاب المحتاجون للانتباه" (أداء أقل من 60%)
   - مقارنة بين الفصول المختلفة

🧠 2. مساعد AI للمدرس (Teacher AI Assistant):
   - "اشرح لي درس [عنوان الدرس] بطريقة مناسبة للصف الثالث الإعدادي"
   - "ولّد 10 أسئلة امتحان بمستويات سهل/متوسط/صعب/تفكير ناقد"
   - "لخّص أداء طلاب الفصل الأول في الرياضيات هذا الشهر"
   - "اقترح أنشطة تفاعلية لدرس [عنوان] مناسبة لـ 30 طالب"
   - "أعدّ خطة درس كاملة مع أهداف تعليمية ونشاط وتقييم"

📝 3. LessonPlanner.jsx (صفحة منفصلة):
   - Wizard ذكي لإعداد خطة الدرس:
     Step 1: اختر المادة، الصف، الموضوع
     Step 2: AI يولّد الأهداف التعليمية تلقائياً (Bloom's Taxonomy)
     Step 3: اختر أسلوب التدريس (شرح، نشاط، نقاش، عملي)
     Step 4: AI يولّد الأنشطة والتمارين
     Step 5: معاينة وتصدير PDF أو مشاركة مع الطلاب
   - حفظ خطط الدروس في مكتبة شخصية
   - Template library (50+ قالب جاهز)

📈 4. ClassAnalytics.jsx (صفحة منفصلة):
   - رسم بياني لتوزيع الدرجات (Bell curve)
   - تتبع تقدم كل طالب عبر الزمن
   - Heatmap للحضور والغياب
   - تقرير AI أسبوعي تلقائي: "أبرز الإنجازات والتحديات هذا الأسبوع"
   - تصدير تقارير PDF/Excel

🏗️ 5. ExamBuilder.jsx (صفحة منفصلة):
   - Drag & drop لإنشاء الامتحان
   - أنواع الأسئلة: MCQ, True/False, Short Answer, Essay, Fill-blank, Math equation
   - AI Question Generator: اكتب الموضوع → يولّد 20 سؤال متنوع
   - ضبط الدرجات والوقت والصعوبة لكل سؤال
   - معاينة الامتحان كما سيراه الطالب
   - نشر الامتحان للفصل مع ضبط وقت الفتح والإغلاق
   - تصحيح تلقائي للأسئلة الموضوعية + مساعدة AI للمقالية

تصميم UI للمدرس:
   - Professional dark theme: #0D1117 background
   - ألوان: تيل (#0EA5E9) وإيميرالد (#10B981) وعنبري (#F59E0B)
   - خط JetBrains Mono للأرقام والبيانات، Tajawal للعربي
   - Data-heavy layout مثل Vercel Dashboard أو GitHub Analytics
   - Sidebar عريض مع labels واضحة
   - Badge notifications على كل section
   - Status indicators ملونة (أخضر/أصفر/أحمر) لأداء الطلاب
```

---

## 1.6 — تعديل App.jsx للـ Routing الجديد

```javascript
// src/App.jsx — أضف هذه الـ imports والـ routes

// Imports الجديدة:
const SchoolStudentDashboard  = lazy(() => import('./components/dashboard/SchoolStudentDashboard'));
const UniversityDashboard     = lazy(() => import('./components/dashboard/UniversityStudentDashboard'));
const LessonPlanner           = lazy(() => import('./components/teacher/LessonPlanner'));
const ClassAnalytics          = lazy(() => import('./components/teacher/ClassAnalytics'));
const ExamBuilder             = lazy(() => import('./components/teacher/ExamBuilder'));

// Routes الجديدة في Protected section:
<Route path="/lesson-planner"   element={<Protected><LessonPlanner /></Protected>} />
<Route path="/class-analytics"  element={<Protected><ClassAnalytics /></Protected>} />
<Route path="/exam-builder"     element={<Protected><ExamBuilder /></Protected>} />
<Route path="/exam-builder/:id" element={<Protected><ExamBuilder /></Protected>} />

// Dashboard route يبقى كما هو — الـ Dashboard component نفسه يعمل الـ routing الداخلي
```

---

## 1.7 — تعديل Layout.jsx — Navigation لكل دور

```javascript
// src/components/shared/Layout.jsx

// أضف UNIVERSITY_SECTIONS_DEF بعد TEACHER_SECTIONS_DEF:
const UNIVERSITY_SECTIONS_DEF = [
  {
    labelKey: 'Overview',
    items: [
      { key:'dashboard',    path:'/',             Icon: Icons.dashboard,    tKey:'nav.dashboard' },
      { key:'ai',           path:'/ai',           Icon: Icons.ai,           tKey:'nav.ai' },
      { key:'analytics',    path:'/analytics',    Icon: Icons.analytics,    tKey:'nav.analytics' },
    ],
  },
  {
    labelKey: 'Academic',
    items: [
      { key:'planner',      path:'/planner',      Icon: Icons.planner,      tKey:'nav.planner' },
      { key:'files',        path:'/files',        Icon: Icons.files,        tKey:'nav.files' },
      { key:'groups',       path:'/groups',       Icon: Icons.groups,       tKey:'nav.groups' },
      { key:'notes',        path:'/notes',        Icon: Icons.notes,        tKey:'nav.notes' },
      { key:'exam',         path:'/exam',         Icon: Icons.exam,         tKey:'nav.exam' },
      { key:'tools',        path:'/tools',        Icon: Icons.tools,        tKey:'nav.tools' },
    ],
  },
  {
    labelKey: 'Community',
    items: [
      { key:'messages',     path:'/chat',         Icon: Icons.messages,     tKey:'nav.messages', badge: true },
      { key:'achievements', path:'/achievements', Icon: Icons.achievements, tKey:'nav.achievements' },
      { key:'notifications',path:'/notifications',Icon: Icons.notifications,tKey:'nav.notifications', badge: true },
      { key:'payment',      path:'/payment',      Icon: Icons.payment,      tKey:'nav.payment' },
      { key:'help',         path:'/help',         Icon: Icons.help,         tKey:'nav.help' },
    ],
  },
];

// أضف لـ TEACHER_SECTIONS_DEF هذه الـ items الجديدة تحت "Class Tools":
{ key:'lesson-planner',  path:'/lesson-planner',  Icon: Icons.notes,     tKey:'nav.lessonPlanner' },
{ key:'class-analytics', path:'/class-analytics', Icon: Icons.analytics, tKey:'nav.classAnalytics' },
{ key:'exam-builder',    path:'/exam-builder',    Icon: Icons.exam,      tKey:'nav.examBuilder' },

// عدّل اختيار الـ sections:
import { getUserRole } from '../../context/store';
const userRole = getUserRole(user);
const sections =
  userRole === 'teacher'           ? TEACHER_SECTIONS_DEF :
  userRole === 'university_student'? UNIVERSITY_SECTIONS_DEF :
                                     NAV_SECTIONS_DEF;
```

---

# ══════════════════════════════════════
# PART 2 — AI SYSTEM UPGRADE (نظام AI شامل)
# ══════════════════════════════════════

## 2.1 — System Prompt الاحترافي الكامل

```javascript
// backend/src/services/geminiAI.js — استبدل SYSTEM_PROMPT كله

const SYSTEM_PROMPT = `
أنت **نجاح AI** (Najah AI) — مساعد تعليمي ذكي ومتخصص تم بناؤه خصيصاً للطلاب والمعلمين في مصر والوطن العربي.

═══════════════════════════════════════
الهوية والشخصية
═══════════════════════════════════════

اسمك: نجاح AI
طبيعتك: أستاذ مصري ذكي، دافئ، صبور، ومتحمس للتعليم
لغتك الأساسية: العربية الفصحى المبسطة مع لمسات من العامية المصرية اللطيفة
أسلوبك: مثل أفضل أستاذ مصري — يشرح ببساطة، يضرب أمثلة من الواقع، ويحتفل بكل إنجاز صغير

ردودك العاطفية:
- عند الصواب: "ممتاز! ده كلام! 🎉" أو "Excellent! You got it perfectly!"
- عند الخطأ: "قريب جداً! بس في نقطة صغيرة..." (أبداً ما تقول "غلط")
- عند الارتباك: "لا تقلق خالص، خليني أشرح بطريقة مختلفة خالص"
- عند الإحباط: "أنا أفهم إن الموضوع ده صعب، بس أنت قادر عليه وأنا هنا معاك"

═══════════════════════════════════════
قواعد اللغة المطلقة
═══════════════════════════════════════

1. إذا كتب الطالب بالعربية (أي شكل: فصحى أو عامية) → أجب بالعربية الكاملة
2. إذا كتب بالإنجليزية → أجب بالإنجليزية الكاملة
3. إذا خلط اللغتين → اتبع اللغة السائدة في سؤاله
4. الأرقام والمعادلات والصيغ الرياضية: استخدم دائماً Arabic-Indic (٠١٢٣) للعربي والغربي (0123) للإنجليزي
5. الوحدات العلمية تبقى بالإنجليزي دائماً (kg, m, s, Hz, mol)

═══════════════════════════════════════
أسلوب التدريس الاحترافي
═══════════════════════════════════════

القاعدة الذهبية: لا تعطِ الإجابة مباشرة — علّم الطالب كيف يصل إليها

1. للأسئلة المفاهيمية:
   أ. ابدأ بـ"الصورة الكبيرة" (Big Picture) في جملة واحدة
   ب. اشرح بمثال من الحياة اليومية المصرية تحديداً
   ج. اعطِ الشرح التقني بعد الفهم العام
   د. اختم بسؤال تحقق: "هل وضح ليك؟ جرب تطبق على المثال ده..."

2. للمسائل الرياضية والعلمية:
   أ. اقرأ المسألة وحدد المعطيات والمطلوب
   ب. اختر القانون أو الأسلوب المناسب واشرح لماذا
   ج. حل خطوة بخطوة مع شرح كل خطوة
   د. تحقق من الإجابة (هل المنطقي؟ هل الوحدات صح؟)
   هـ. قدم مسألة مشابهة للتدريب

3. للواجبات المنزلية:
   - لا تعطِ الإجابة الكاملة أبداً
   - بدلاً: "الخطوة الأولى تبدأ بـ... جرب تكمل من هنا"
   - أو: "القانون اللي محتاجه هو... طبقه على البيانات دي"
   - أو: "الفكرة الأساسية هي... كيف تطبقها هنا؟"

4. للمحتوى النظري (تاريخ، أدب، جغرافيا):
   - استخدم "قصص" وسرد درامي مشوق
   - اربط الأحداث ببعض بـ"السبب والنتيجة"
   - قارن بالأحداث المعاصرة إن أمكن

5. للمدرسين:
   - كن أكثر رسمية وتقنية
   - استخدم مصطلحات تربوية (Bloom's Taxonomy, Differentiated Instruction)
   - قدم خيارات متعددة لا حلاً واحداً
   - اشرح الـ "لماذا" وراء كل اقتراح

═══════════════════════════════════════
المناهج المغطاة بشكل كامل
═══════════════════════════════════════

[المدرسة — المنهج المصري]
• الرياضيات: حساب، كسور، جبر، هندسة إقليدية، إحصاء، تفاضل وتكامل
• الفيزياء: ميكانيكا، كهرباء، موجات، ضوء، حرارة، فيزياء حديثة
• الكيمياء: جداول دورية، روابط كيميائية، معادلات، عضوية، تحليل كمي ونوعي
• الأحياء: خلية، وراثة، تطور، جهاز عصبي، هضم، تكاثر، بيئة
• الجيولوجيا: صخور، زلازل، براكين، خرائط، مناخ
• اللغة العربية: نحو، صرف، بلاغة، أدب، تعبير، قراءة، إملاء
• اللغة الإنجليزية: grammar, vocabulary, writing, reading comprehension, literature
• الدراسات الاجتماعية: تاريخ مصر والعالم، جغرافيا، تربية وطنية، اقتصاد
• الدين: فقه، تلاوة، تفسير، حديث، سيرة نبوية

[الجامعة — كل التخصصات]
• الهندسة: رياضيات هندسية، ميكانيكا، كهرباء، مواد، مشاريع
• الطب والصيدلة: تشريح، فسيولوجيا، كيمياء حيوية، أدوية، أمراض
• علوم حاسب: برمجة، خوارزميات، قواعد بيانات، شبكات، ذكاء اصطناعي
• الاقتصاد والأعمال: محاسبة، تسويق، إدارة، إحصاء، مالية
• الآداب والتربية: فلسفة، علم نفس، اجتماع، تربية، لغويات
• القانون: مدني، تجاري، جنائي، دولي، إجراءات

═══════════════════════════════════════
التنسيق والـ Markdown
═══════════════════════════════════════

استخدم تنسيقاً غنياً دائماً:
• **Bold** للمصطلحات والنقاط المهمة
• _Italic_ للتأكيد الخفيف
• ## و### للعناوين في الشروحات الطويلة
• قوائم مرقمة للخطوات المتسلسلة
• قوائم نقطية للخصائص والمميزات
• \`code\` للمعادلات القصيرة
• \`\`\`language\`\`\` لكود البرمجة
• جداول markdown للمقارنات
• --- للفصل بين الأقسام

للمعادلات الرياضية: استخدم LaTeX notation محاط بـ $..$ للـ inline وبـ $$...$$ للمعادلات المستقلة

مثال:
المعادلة العامة للحركة: $$v = v_0 + at$$

═══════════════════════════════════════
السلوكيات الخاصة
═══════════════════════════════════════

عند طلب اختبار/كويز:
- اسأل: "كم سؤال تريد؟ وأي مستوى صعوبة؟"
- ولّد أسئلة متنوعة (MCQ, True/False, Short answer)
- بعد الإجابة: صحح مع شرح كل إجابة
- في النهاية: "نتيجتك: X/Y — بارك الله فيك! الأسئلة اللي وقع فيها تحتاج مراجعة في..."

عند رفع صورة:
- حلل محتوى الصورة التعليمي بدقة
- إذا كانت مسألة: "المسألة دي بتطلب..."
- إذا كانت معادلة: اشرحها خطوة بخطوة
- إذا كانت رسم/مخطط: وصّف ثم اشرح

عند السؤال عن مستقبل المهني:
- شجّع وأعطِ خارطة طريق واقعية
- اذكر الجامعات والكليات المناسبة في مصر
- اذكر فرص العمل في السوق المصري والعربي

ما يجب تجنبه دائماً:
- لا تقل "لا أعرف" — قل "دعني أساعدك بأفضل ما أعرف..."
- لا تعطِ إجابات الامتحانات/الاختبارات مباشرة
- لا تكتب محتوى مسيء أو خارج إطار التعليم
- لا تتظاهر بأنك إنسان حقيقي إذا سُئلت مباشرة
- لا تتناول سياسة أو دين بطريقة استفزازية
`;
```

---

## 2.2 — دالة buildContextualPrompt المحسّنة

```javascript
// backend/src/services/geminiAI.js

function buildContextualPrompt(user, extras = {}) {
  if (!user) return '';
  
  const uniGrades = ['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6','Postgrad'];
  const level = uniGrades.includes(user.grade) || user.institution_type === 'university'
    ? 'جامعي' : 'مدرسي';
  
  const roleAr = user.role === 'teacher' ? 'مدرس/أستاذ' : `طالب ${level}`;
  
  return `
[CONTEXT — DO NOT MENTION TO USER]
المستخدم: ${user.name || 'مجهول'}
الدور: ${roleAr}
الصف/الفرقة: ${user.grade || 'غير محدد'}
المؤسسة: ${user.school || user.institution || 'غير محددة'}
اللغة المفضلة: ${user.language || 'ar'}
نقاط XP: ${user.xp_points || 0}
المستوى: ${user.level || 1}
${extras.subject ? `المادة الحالية: ${extras.subject}` : ''}
${extras.topic ? `الموضوع: ${extras.topic}` : ''}
${extras.mode ? `وضع AI: ${extras.mode}` : ''}
التاريخ والوقت: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}
[END CONTEXT]

`;
}

// ── تعديل إعدادات النموذج ──────────────────────────────────
// في model و modelStream، عدّل generationConfig:
generationConfig: {
  temperature:     0.72,   // أدق للتعليم
  topK:            50,
  topP:            0.93,
  maxOutputTokens: 4096,   // أكبر للشروحات المفصّلة
  candidateCount:  1,
},
```

---

## 2.3 — ترقية AIAssistant.jsx — مميزات جديدة

```
طوّر src/components/ai/AIAssistant.jsx بإضافة:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 1. AI Mode Selector (أوضاع مختلفة):
   - 🤖 Chat — محادثة عامة
   - 📖 Explain — شرح مفصل لأي مفهوم
   - 📝 Homework — مساعدة في الواجبات (بدون إجابة مباشرة)
   - 🧪 Quiz Me — توليد اختبار تفاعلي
   - 📊 Study Plan — خطة مذاكرة مخصصة
   - 🔍 Web Search — بحث في الإنترنت
   - 📷 Image Solve — رفع صورة مسألة وحلها
   - ✍️ Essay Helper — مساعدة في كتابة المقالات (للجامعة)

   كل وضع له System Prompt مخصص يُرسل تلقائياً

📚 2. Subject Selector:
   - قائمة منسدلة بالمواد حسب الصف الدراسي للمستخدم
   - AI يعرف في أي مادة يتحدث ويخصص شرحه

💬 3. Smart Suggestions:
   - بعد كل رد، AI يقترح 3 أسئلة متابعة ذكية
   - مثل: ["اشرح لي المثال بشكل أبسط", "ما الفرق بين X وY؟", "ولّد أسئلة تدريبية"]

🔊 4. Text-to-Speech محسّن:
   - صوت عربي أفضل باستخدام Web Speech API
   - زر play/pause في كل bubble
   - تغيير سرعة الكلام (0.8x / 1x / 1.2x)

💾 5. Conversation Memory:
   - حفظ المحادثات وتسميتها تلقائياً
   - استعادة محادثة سابقة
   - ربط المحادثات بمواد دراسية

⌨️ 6. Rich Input:
   - رفع صورة لحل المسائل
   - رفع PDF لتلخيصه
   - Voice to Text (استخدام Web Speech Recognition)
   - Keyboard shortcuts: Enter للإرسال، Shift+Enter للسطر الجديد

📊 7. Response Quality Indicators:
   - مؤشر المصدر: هل الإجابة من Gemini أم من الـ Internal Engine
   - تقييم الإجابة (👍👎) مع إرسال Feedback للـ backend
   - زر "اشرح بطريقة مختلفة" إذا مش مفهوم

تصميم AI Interface:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Chat bubbles: User bubble يمين (gradient بنفسجي)، AI bubble يسار (surface داكن)
   - Avatar للـ AI: Logo نجاح مع glow effect
   - Typing animation: 3 نقاط ترتد بـ stagger timing
   - Streaming: حروف تظهر تدريجياً مع cursor يومض
   - Mode selector: Horizontal scroll pills مع icons
   - Quick prompts: Chip buttons تختفي بعد الاستخدام
   - Input area: Auto-resize textarea مع icons للمرفقات
   - تصميم sticky header مع AI status badge
```

---

## 2.4 — AI Features للمدرس (Teacher AI Endpoints)

```javascript
// backend/src/routes/ai.js — أضف هذه الـ routes الجديدة

ar.post('/lesson-plan',        aiLimiter, c.generateLessonPlan);
ar.post('/exam-questions',     aiLimiter, c.generateExamQuestions);
ar.post('/grade-essay',        aiLimiter, c.gradeEssay);
ar.post('/class-report',       aiLimiter, c.generateClassReport);
ar.post('/activity-suggest',   aiLimiter, c.suggestActivity);
ar.post('/feedback-student',   aiLimiter, c.generateStudentFeedback);
ar.post('/simplify',           aiLimiter, c.simplifyContent);

// backend/src/controllers/aiController.js — الـ functions:

async function generateLessonPlan(req, res) {
  const { subject, grade, topic, duration, style } = req.body;
  const prompt = `
أنت خبير تربوي متخصص. أعدّ خطة درس كاملة ومهنية بتنسيق Markdown:

المادة: ${subject}
الصف: ${grade}
الموضوع: ${topic}
المدة: ${duration || 45} دقيقة
أسلوب التدريس المفضل: ${style || 'مزيج من الشرح والنشاط'}

اتبع هذا الهيكل بالضبط:
## بيانات الدرس
## الأهداف التعليمية (حسب Bloom's Taxonomy — 3-5 أهداف)
## المتطلبات القبلية
## الوسائل والأدوات
## خطوات الدرس
  ### التمهيد (5 دقائق)
  ### العرض والشرح (20 دقيقة)
  ### التطبيق والنشاط (15 دقيقة)
  ### التقييم والختام (5 دقائق)
## الواجب المنزلي
## ملاحظات للمعلم
`;
  // أرسل للـ Gemini وارجع الـ response
}

async function generateExamQuestions(req, res) {
  const { subject, grade, topic, count = 10, levels } = req.body;
  const prompt = `
ولّد ${count} سؤال امتحاني في:
المادة: ${subject} | الصف: ${grade} | الموضوع: ${topic}

التوزيع المطلوب:
- ${levels?.easy || '30%'} سهلة (تذكر ومعرفة)
- ${levels?.medium || '40%'} متوسطة (فهم وتطبيق)
- ${levels?.hard || '20%'} صعبة (تحليل وتركيب)
- ${levels?.critical || '10%'} تفكير ناقد وإبداعي

لكل سؤال:
1. نص السؤال
2. نوعه (MCQ/True-False/Short/Essay)
3. الإجابة النموذجية
4. مستوى الصعوبة
5. الدرجة المقترحة

اكتب كـ JSON array صالح.
`;
}
```

---

## 2.5 — تحسين CognitiveEngine — إزالة Xenova واستبداله بـ Smart Rule Engine

```javascript
// backend/src/ai/core/IntentAnalyzer.js — استبدل الملف كله

'use strict';
const logger = require('../../utils/logger');

class IntentAnalyzer {
  constructor() {
    this.isReady = true; // No heavy model needed
  }

  async init() {
    logger.info('✅ Smart Intent Analyzer ready (rule-based, instant).');
  }

  async analyze(message) {
    const lower = message.toLowerCase().trim();
    const isArabic = /[\u0600-\u06FF]/.test(message);

    // Pattern matching — fast and accurate
    const patterns = [
      {
        intent: 'request_for_quiz',
        patterns: [/اختبار|quiz|test|أسئلة تدريبية|questions|اختبرني|امتحنني|trivia/i],
        needsResearch: false,
      },
      {
        intent: 'explanation_request',
        patterns: [/اشرح|explain|ما هو|what is|ما معنى|كيف يعمل|how does|لماذا|why/i],
        needsResearch: false,
      },
      {
        intent: 'math_problem',
        patterns: [/احسب|حل|solve|calculate|=\s*\?|find\s+x|جد|برهن|prove|\d+[\+\-\×\÷\*\/\^]\d+/i],
        needsResearch: false,
      },
      {
        intent: 'homework_help',
        patterns: [/واجب|homework|assignment|مسألة|problem|سؤال رقم|question \d/i],
        needsResearch: false,
      },
      {
        intent: 'study_plan',
        patterns: [/خطة|plan|جدول|schedule|مذاكرة|study|كيف أذاكر|how to study/i],
        needsResearch: false,
      },
      {
        intent: 'research_request',
        patterns: [/ابحث|search|أخبار|news|اكتشف|latest|حديث|recent|2024|2025|2026/i],
        needsResearch: true,
      },
      {
        intent: 'emotional_support',
        patterns: [/تعبان|مش فاهم|confused|صعب|hard|محبط|frustrated|مش قادر|can't|مش عارف/i],
        needsResearch: false,
      },
      {
        intent: 'lesson_plan',  // للمدرس
        patterns: [/خطة درس|lesson plan|درس عن|محاضرة عن/i],
        needsResearch: false,
      },
      {
        intent: 'greeting',
        patterns: [/^(مرحب|هاي|hello|hi|أهلاً|السلام عليكم|صباح|مساء|hey|good morning)/i],
        needsResearch: false,
      },
    ];

    for (const p of patterns) {
      if (p.patterns.some(r => r.test(message))) {
        return {
          primaryIntent: p.intent,
          confidence: 0.9,
          needsResearch: p.needsResearch,
          isArabic,
        };
      }
    }

    // Fallback — check if it has a question mark
    const isQuestion = /\?|؟/.test(message);
    return {
      primaryIntent: isQuestion ? 'general_question' : 'general_statement',
      confidence: 0.6,
      needsResearch: false,
      isArabic,
    };
  }
}

module.exports = IntentAnalyzer;
```

---

# ══════════════════════════════════════
# PART 3 — UI/UX UPGRADE (تطوير شامل للتصميم)
# ══════════════════════════════════════

## 3.1 — Design System المتكامل

```css
/* src/styles/global.css — أضف هذه المتغيرات */

:root {
  /* ── Typography ── */
  --font-head:    'Syne', 'Cairo', sans-serif;
  --font-body:    'Plus Jakarta Sans', 'Tajawal', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
  --font-ar:      'Tajawal', 'Cairo', sans-serif;

  /* ── Spacing Scale ── */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;
  --space-3xl:  64px;

  /* ── Border Radius Scale ── */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  18px;
  --radius-xl:  24px;
  --radius-2xl: 32px;
  --radius-full: 9999px;

  /* ── Animation ── */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:   150ms;
  --duration-normal: 300ms;
  --duration-slow:   500ms;

  /* ── Shadows ── */
  --shadow-xs:   0 1px 3px rgba(0,0,0,0.12);
  --shadow-sm:   0 2px 8px rgba(0,0,0,0.15);
  --shadow-md:   0 4px 16px rgba(0,0,0,0.2);
  --shadow-lg:   0 8px 32px rgba(0,0,0,0.25);
  --shadow-xl:   0 16px 48px rgba(0,0,0,0.3);
  --shadow-glow: 0 0 24px rgba(99,102,241,0.25);
  --shadow-glow-green: 0 0 24px rgba(16,185,129,0.2);

  /* ── Z-index Scale ── */
  --z-base:    1;
  --z-float:   10;
  --z-sticky:  100;
  --z-overlay: 200;
  --z-modal:   300;
  --z-toast:   400;
  --z-tooltip: 500;
}

/* Dark Theme (default) */
[data-theme="dark"], :root {
  --ink:        #0A0A14;
  --ink2:       #0F0F1E;
  --surface:    #141428;
  --surface2:   #1A1A30;
  --surface3:   #202040;
  --border:     rgba(255,255,255,0.08);
  --border2:    rgba(255,255,255,0.12);
  --text:       #F1F5F9;
  --text2:      #94A3B8;
  --text3:      #64748B;
  --text4:      #475569;
  --primary:        #6366F1;
  --primary-dark:   #4F46E5;
  --primary-light:  #818CF8;
  --accent:         #8B5CF6;
  --success:        #10B981;
  --warning:        #F59E0B;
  --danger:         #EF4444;
  --info:           #06B6D4;
  --glass:          rgba(255,255,255,0.04);
  --glass-blur:     blur(20px) saturate(1.5);
}

/* Light Theme */
[data-theme="light"] {
  --ink:        #F8FAFC;
  --ink2:       #F1F5F9;
  --surface:    #FFFFFF;
  --surface2:   #F8FAFC;
  --surface3:   #F1F5F9;
  --border:     rgba(0,0,0,0.07);
  --border2:    rgba(0,0,0,0.12);
  --text:       #0F172A;
  --text2:      #475569;
  --text3:      #94A3B8;
  --text4:      #CBD5E1;
  --glass:      rgba(255,255,255,0.6);
}

/* ── RTL-specific tweaks ── */
[dir="rtl"] {
  --font-body: 'Tajawal', 'Cairo', sans-serif;
  --font-head: 'Cairo', 'Syne', sans-serif;
}

/* ── Scrollbar ── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text4); }

/* ── Selection ── */
::selection { background: rgba(99,102,241,0.25); color: var(--text); }

/* ── Utility classes ── */
.glass-card {
  background: var(--glass);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
}

.gradient-text {
  background: linear-gradient(135deg, #818CF8, #A78BFA, #C084FC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glow-primary {
  box-shadow: var(--shadow-glow);
}

/* ── Loading Skeleton ── */
.skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Page Transitions ── */
.page-enter { animation: page-in 0.35s var(--ease-spring); }
@keyframes page-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Card hover effect ── */
.card-hover {
  transition: transform var(--duration-normal) var(--ease-spring),
              box-shadow var(--duration-normal) var(--ease-smooth);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

---

## 3.2 — Shared Components الجديدة

```
اصنع هذه الـ components في src/components/shared/:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SkeletonLoader.jsx:
   - Skeleton loading لكل نوع من البطاقات
   - CardSkeleton, StatSkeleton, ListSkeleton, TableSkeleton
   - استخدام CSS animation (shimmer effect)
   - يُستخدم في كل مكان بدل Spinner الحالي

2. EmptyState.jsx (ترقية):
   - Icon مخصص لكل حالة (لا مجموعات، لا ملفات، لا رسائل...)
   - CTA button
   - رسوم متحركة: icon يتحرك بـ float animation

3. ConfirmModal.jsx:
   - Modal احترافي للتأكيد قبل الحذف
   - Destructive action بلون أحمر
   - non-destructive بلون primary
   - Keyboard: Enter للتأكيد، Escape للإلغاء

4. Tooltip.jsx:
   - Tooltip خفيف على كل زر بـ title
   - يظهر بعد 500ms hover
   - يدعم RTL تلقائياً

5. Badge.jsx:
   - Variant: success, warning, danger, info, default
   - Size: sm, md, lg
   - مع/بدون icon
   - Dot indicator

6. ProgressRing.jsx:
   - دائرة SVG تُظهر نسبة مئوية
   - Animated fill
   - لون قابل للتخصيص
   - رقم في المنتصف

7. DataTable.jsx:
   - جدول بيانات احترافي
   - Sorting على كل column
   - Search/filter
   - Pagination
   - Row selection
   - Export CSV
   - RTL aware

8. Toast.jsx (ترقية react-hot-toast):
   - Custom style لكل نوع (success/error/warning/info)
   - Icon مخصص
   - Progress bar تحت الـ toast
   - يدعم العربي والـ RTL
```

---

## 3.3 — تحسين Landing Page

```
طوّر src/components/landing/LandingPage.jsx:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hero Section:
   - Animated headline مع Text Scramble effect
   - Particle background (نجوم/جزيئات تتحرك بالـ Mouse Parallax)
   - CTA buttons: "ابدأ مجاناً" و "شاهد الفيديو"
   - Stats counter: X+ طالب، Y+ معلم، Z+ درس
   - Scroll indicator (arrow يتحرك لأسفل)

Features Section:
   - بطاقات ميزات مع icons ثلاثية الأبعاد
   - Hover: البطاقة تتكيف كـ 3D tilt effect
   - Animated line تربط البطاقات ببعض

Role Sections (3 sections منفصلة):
   - "للطالب المدرسي" مع preview dashboard
   - "للطالب الجامعي" مع مميزاته
   - "للمدرس والأستاذ" مع مميزاته

Testimonials Carousel:
   - شهادات حقيقية لطلاب ومدرسين
   - Auto-play مع pause on hover

FAQ Accordion:
   - أكثر الأسئلة شيوعاً
   - Smooth expand/collapse

Final CTA:
   - Full-width gradient section
   - "ابدأ رحلة نجاحك اليوم"
   - Email input + زر تسجيل
```

---

## 3.4 — Mobile Experience (PWA)

```
حسّن التجربة على الموبايل:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Bottom Navigation Bar:
   - 5 tabs رئيسية: Home, AI, Groups, Chat, Profile
   - Active tab مع animated indicator
   - Haptic feedback (Vibration API)
   - Safe area insets لـ iPhone

2. Swipe Gestures:
   - Swipe right لفتح Sidebar
   - Swipe down لتحديث الصفحة (Pull-to-refresh)
   - Swipe left/right بين المحادثات

3. PWA Manifest:
   - Splash screen مخصص
   - App icon بكل الأحجام
   - تشغيل standalone (بدون browser UI)
   - Push notifications

4. Responsive Breakpoints:
   - Mobile: < 640px — تصميم مخصص
   - Tablet: 640-1024px — grid مختلف
   - Desktop: > 1024px — full experience
```

---

# ══════════════════════════════════════
# PART 4 — ADMIN SYSTEM (نظام الأدمن المتكامل)
# ══════════════════════════════════════

## 4.1 — Multi-Level Admin Structure

```sql
-- Migration: multi_admin.sql

-- إضافة مستوى الأدمن
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_level   SMALLINT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_notes   TEXT DEFAULT NULL;

-- جدول صلاحيات الأدمن
CREATE TABLE IF NOT EXISTS admin_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission   VARCHAR(100) NOT NULL,
  resource_id  UUID DEFAULT NULL,   -- للصلاحيات المقيدة بموارد معينة
  granted_by   UUID REFERENCES users(id),
  expires_at   TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(admin_id, permission, resource_id)
);

-- سجل نشاطات الأدمن
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES users(id),
  action       VARCHAR(200) NOT NULL,
  target_type  VARCHAR(50),
  target_id    UUID,
  details      JSONB DEFAULT '{}',
  ip_address   INET,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_log_admin_id   ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created_at ON admin_activity_log(created_at DESC);

-- الصلاحيات المتاحة:
-- LEVEL 1 (Super Admin): كل شيء
-- LEVEL 2 (Admin): manage_users, view_analytics, manage_content, view_logs
-- LEVEL 3 (Content Moderator): manage_content فقط
-- LEVEL 4 (Institution Admin): manage_institution:{id} فقط
```

---

## 4.2 — Admin Dashboard المتكامل (ترقية شاملة)

```
طوّر src/components/admin/AdminDashboard.jsx بإضافة:

Tabs الحالية (مُرقّاة):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 📊 Overview — لوحة الإحصائيات اللحظية
2. 👥 Users — إدارة المستخدمين
3. 📚 Content — إدارة المحتوى
4. 💰 Revenue — المالية والاشتراكات
5. 🤖 AI Monitor — مراقبة الـ AI
6. ⚙️ Settings — إعدادات المنصة

Tabs الجديدة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. 🛡️ Admins — إدارة مستويات الأدمن
8. 📋 Activity Log — سجل كل العمليات
9. 🏫 Institutions — إدارة المدارس والجامعات
10. 📢 Announcements — إشعارات لكل المستخدمين
11. 🎫 Support Tickets — التذاكر والشكاوى

مميزات كل Tab:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Overview Tab:
   - Real-time counters (WebSocket) لعدد المتصلين الآن
   - Graphs: تسجيلات جديدة / رسائل AI / مدفوعات (آخر 30 يوم)
   - Top 5 أكثر الطلاب نشاطاً
   - Top 5 أكثر المدرسين استخداماً للمنصة
   - نسبة استخدام AI models
   - Server health indicators (CPU, RAM, DB connections)

2. Users Tab:
   - جدول بيانات كامل مع فلترة: role, date, status
   - بحث فوري (debounced search)
   - أكشن على كل مستخدم: View, Edit, Suspend, Delete, Impersonate (للـ debugging)
   - Bulk actions: تعطيل/حذف/إرسال email لمجموعة
   - Export CSV/Excel

7. Admins Tab (جديد):
   - قائمة بكل الأدمن ومستوياتهم
   - إنشاء أدمن جديد بـ Modal:
     • اختر مستخدم موجود أو أنشئ حساب جديد
     • اختر المستوى (2-4)
     • اختر الصلاحيات بـ checkboxes
     • حدد تاريخ انتهاء الصلاحيات (اختياري)
   - تعديل صلاحيات أدمن موجود
   - سحب الصلاحيات فوراً

8. Activity Log Tab (جديد):
   - Timeline لكل عمليات الأدمن
   - فلترة: by admin, by action type, by date range
   - كل entry يعرض: من؟ ماذا؟ على من؟ متى؟ من أي IP؟
   - Export

9. Announcements Tab (جديد):
   - Rich text editor لكتابة الإشعار
   - Target audience: All / Students / Teachers / Specific Grade
   - Scheduling (نشر في وقت معين)
   - قناة التوصيل: In-app notification + Email + SMS (اختياري)
   - سجل الإشعارات السابقة مع نسبة القراءة
```

---

## 4.3 — Admin Security

```javascript
// backend/src/middleware/adminAuth.js

'use strict';
const { pool } = require('../config/postgres');
const { cacheGet } = require('../config/redis');
const logger = require('../utils/logger');

// تحقق من أن المستخدم لديه صلاحية معينة
const can = (permission) => async (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Super Admin — كل الصلاحيات
  if (user.admin_level === 1) return next();

  // تحقق من الصلاحية المحددة
  const { rows } = await pool.query(`
    SELECT 1 FROM admin_permissions
    WHERE admin_id = $1
      AND permission = $2
      AND (expires_at IS NULL OR expires_at > NOW())
  `, [user.id, permission]);

  if (rows.length === 0) {
    logger.warn(`Admin permission denied: user=${user.id} permission=${permission}`);
    return res.status(403).json({ error: `Permission required: ${permission}` });
  }

  next();
};

// سجّل نشاط الأدمن تلقائياً
const logAction = (action, targetType = null) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400) {
      try {
        await pool.query(`
          INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          req.user?.id,
          action,
          targetType,
          req.params?.id || req.body?.userId || null,
          JSON.stringify({ body: req.body, params: req.params }),
          req.ip,
        ]);
      } catch (e) {
        logger.warn('Activity log failed:', e.message);
      }
    }
    originalJson(data);
  };
  next();
};

module.exports = { can, logAction };

// ── Routes مع الحماية: ──
// router.post('/users/:id/suspend', can('manage_users'), logAction('suspend_user', 'user'), c.suspendUser);
// router.post('/create-admin',      requireLevel(1),     logAction('create_admin', 'admin'), c.createAdmin);
```

---

# ══════════════════════════════════════
# PART 5 — i18n COMPLETE FIX (إصلاح شامل للغة)
# ══════════════════════════════════════

## 5.1 — إصلاح التعارض بين UIStore و i18n

```javascript
// src/i18n/index.js — الإصدار النهائي الكامل

import { createElement, createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from './ar';
import en from './en';

const DICTIONARIES = { ar, en };
const DEFAULT_LANG = 'ar';
const STORAGE_KEY  = 'najah_lang';
const UI_STORE_KEY = 'najah-ui';

export const I18nContext = createContext(null);

function deepGet(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

function getSavedLang() {
  try {
    const direct = localStorage.getItem(STORAGE_KEY);
    const uiStore = JSON.parse(localStorage.getItem(UI_STORE_KEY) || '{}');
    return uiStore?.state?.language || direct || DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function syncToUIStore(lang) {
  try {
    const stored = JSON.parse(localStorage.getItem(UI_STORE_KEY) || '{"state":{}}');
    stored.state = { ...stored.state, language: lang };
    localStorage.setItem(UI_STORE_KEY, JSON.stringify(stored));
  } catch {}
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);
  const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];

  const setLang = useCallback((newLang) => {
    if (!DICTIONARIES[newLang]) return;
    const dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('data-lang', newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    syncToUIStore(newLang);
    setLangState(newLang);
  }, []);

  useEffect(() => {
    // Apply on mount
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const t = useCallback((key, vars = {}) => {
    let text = deepGet(dict, key);
    // Variable interpolation: t('greeting', { name: 'أحمد' }) → "مرحباً أحمد"
    if (typeof text === 'string' && Object.keys(vars).length) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return text;
  }, [dict]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  const value = {
    lang,
    setLang,
    toggleLang,
    t,
    isRTL: lang === 'ar',
    dir:   lang === 'ar' ? 'rtl' : 'ltr',
  };

  return createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

export default { I18nProvider, useTranslation };
```

---

## 5.2 — مفاتيح الترجمة الناقصة (ar.js)

```javascript
// src/i18n/ar.js — أضف في نهاية الـ object

errors: {
  notFound:        'الصفحة غير موجودة',
  notFoundSub:     'الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها.',
  goHome:          '← العودة للرئيسية',
  serverError:     'خطأ في الخادم، حاول مرة أخرى',
  networkError:    'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت',
  unauthorized:    'غير مصرح لك بالوصول',
  sessionExpired:  'انتهت جلستك، يرجى تسجيل الدخول مجدداً',
},

common: {
  loading:    'جار التحميل...',
  save:       'حفظ',
  cancel:     'إلغاء',
  delete:     'حذف',
  edit:       'تعديل',
  view:       'عرض',
  search:     'بحث...',
  filter:     'تصفية',
  sort:       'ترتيب',
  back:       'رجوع',
  next:       'التالي',
  previous:   'السابق',
  send:       'إرسال',
  submit:     'تقديم',
  confirm:    'تأكيد',
  yes:        'نعم',
  no:         'لا',
  or:         'أو',
  and:        'و',
  unread:     'غير مقروء',
  online:     'متصل',
  offline:    'غير متصل',
  viewAll:    'عرض الكل',
  showMore:   'عرض المزيد',
  showLess:   'عرض أقل',
  noData:     'لا توجد بيانات',
  noResults:  'لا توجد نتائج',
  success:    'تم بنجاح! 🎉',
  error:      'حدث خطأ ما',
  warning:    'تنبيه',
  info:       'معلومة',
  required:   'هذا الحقل مطلوب',
  optional:   'اختياري',
  new:        'جديد',
  updated:    'محدّث',
  deleted:    'محذوف',
  active:     'نشط',
  inactive:   'غير نشط',
  pending:    'في الانتظار',
  approved:   'موافق عليه',
  rejected:   'مرفوض',
  today:      'اليوم',
  yesterday:  'أمس',
  thisWeek:   'هذا الأسبوع',
  thisMonth:  'هذا الشهر',
},

dashboard: {
  welcome:         'مرحباً',
  readyToLearn:    'مستعد للتعلم اليوم؟',
  dayStreak:       'يوم متواصل',
  daysStreak:      'أيام متواصلة',
  onFire:          '🏆 أداء ناري!',
  keepGoing:       'استمر في هذا الزخم!',
  levelProgress:   'تقدم المستوى',
  quickAccess:     'وصول سريع',
  todaySchedule:   'جدول اليوم',
  myGroups:        'مجموعاتي',
  studyActivity:   'النشاط الدراسي',
  fullAnalytics:   'التحليلات كاملة →',
  campusLife:      'بيئة التعلم',
  addSession:      '+ إضافة جلسة',
  noSessions:      'لا توجد جلسات اليوم',
  noSessionsSub:   'أضف جلسة دراسية وابقَ على المسار الصحيح.',
  dailyInspiration:'إلهام اليوم',
  studentsOnline:  'طالب متصل الآن',
  sessionsDone:    'جلسات مكتملة',
  quizzesTaken:    'اختبارات منجزة',
  totalXP:         'مجموع XP',
},

ai: {
  title:           'المساعد الذكي',
  subtitle:        'مدعوم بـ Gemini 2.0',
  placeholder:     'اسأل أي سؤال... رياضيات، علوم، تاريخ، أي شيء!',
  send:            'إرسال',
  newChat:         'محادثة جديدة',
  chatHistory:     'سجل المحادثات',
  searchMode:      'وضع البحث',
  thinking:        'نجاح AI يفكر...',
  error:           'حدث خطأ، يرجى المحاولة مجدداً',
  copy:            'نسخ',
  copied:          'تم النسخ!',
  readAloud:       'قراءة بصوت',
  stop:            'إيقاف',
  regenerate:      'إعادة توليد',
  explain:         'اشرح بطريقة مختلفة',
  modeChat:        'محادثة',
  modeExplain:     'شرح مفصّل',
  modeHomework:    'مساعدة الواجب',
  modeQuiz:        'اختبرني',
  modeStudyPlan:   'خطة مذاكرة',
  modeSearch:      'بحث الإنترنت',
  modeImage:       'حل من صورة',
  uploadImage:     'رفع صورة مسألة',
  uploadPdf:       'رفع PDF للتلخيص',
  voiceInput:      'الإدخال الصوتي',
  subject:         'اختر المادة',
  noSubject:       'بدون مادة محددة',
  suggestedQuestions: 'أسئلة مقترحة',
  tokenUsage:      'الاستخدام',
  poweredBy:       'مدعوم بـ',
},

teacher: {
  dashboard:       'لوحة المدرس',
  myClasses:       'فصولي',
  lessonPlanner:   'مخطط الدروس',
  classAnalytics:  'تحليلات الفصل',
  examBuilder:     'بناء الامتحانات',
  students:        'الطلاب',
  attendance:      'الحضور والغياب',
  grades:          'الدرجات',
  newLesson:       'درس جديد',
  newExam:         'امتحان جديد',
  generateWithAI:  'توليد بالذكاء الاصطناعي',
  publishToClass:  'نشر للفصل',
  totalStudents:   'إجمالي الطلاب',
  avgPerformance:  'متوسط الأداء',
  attendanceRate:  'نسبة الحضور',
  needsAttention:  'يحتاجون انتباهاً',
  weeklyReport:    'التقرير الأسبوعي',
  exportReport:    'تصدير التقرير',
},

nav: {
  // ... existing keys ...
  lessonPlanner:   'مخطط الدروس',
  classAnalytics:  'تحليلات الفصل',
  examBuilder:     'بناء الامتحانات',
  researchAI:      'مساعد الأبحاث',
  studyGroups:     'مجموعات الدراسة',
  library:         'المكتبة',
},
```

---

# ══════════════════════════════════════
# PART 6 — NEW FEATURES (مميزات جديدة)
# ══════════════════════════════════════

## 6.1 — نظام الإشعارات المحسّن

```
طوّر الإشعارات لتشمل:

1. Push Notifications:
   - تسجيل Service Worker للـ Push
   - إشعار عند: رسالة جديدة، واجب جديد، نتيجة اختبار، تصنيف جديد
   - إشعار تذكير بالمذاكرة (cron job كل يوم 8 مساءً)

2. In-App Notification Center (ترقية الـ Drawer الحالي):
   - تصنيف الإشعارات: 📚 دراسي | 💬 رسائل | 🏆 إنجازات | ⚙️ نظام
   - إجراءات سريعة من الإشعار نفسه (رد، عرض، تجاهل)
   - تجميع الإشعارات المشابهة ("3 رسائل جديدة من مجموعة الرياضيات")

3. Email Digests:
   - ملخص أسبوعي بالأداء والنشاط
   - تذكير بواجبات مقتربة المواعيد
   - تهنئة بالإنجازات
```

## 6.2 — نظام الشارات والإنجازات المتقدم

```
طوّر src/components/achievements/AchievementsPage.jsx:

شارات جديدة:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 دراسي: "المذاكر الأول" (100 ساعة)، "بطل الرياضيات"، "عاشق القراءة"
🔥 نشاط: "أسبوع ناري" (7 أيام streak)، "شهر متواصل" (30 يوم)، "لا تسقط أبداً"
🏆 تقدم: "أول اختبار"، "درجة مثالية"، "المتفوق" (top 10%)
👥 اجتماعي: "روح الفريق" (10 مساعدات)، "المشجع" (50 رد)
🤖 AI: "صديق الذكاء الاصطناعي" (100 محادثة)، "المستكشف" (كل الأوضاع)

تصميم الشارات:
   - SVG شارات مخصصة احترافية (مش emoji فقط)
   - Locked state: رمادي مع ظل
   - Unlocked: لامع مع celebratory animation
   - Hover: يعرض تفاصيل كيفية الحصول عليها
   - Pop-up احتفالي عند الحصول على شارة جديدة (confetti)
```

## 6.3 — Focus Timer المتقدم (ترقية Pomodoro)

```
طوّر src/components/focus/FocusPage.jsx:

1. أوضاع متعددة:
   - Pomodoro (25-5)
   - Deep Work (90-20)
   - Study Sprint (45-15)
   - Custom

2. مصاحبة بالأصوات:
   - White Noise, Rain, Cafe, Forest, Ocean (Web Audio API)
   - موسيقى Lo-Fi مدمجة (من Pixabay API)
   - تحكم في الصوت

3. تتبع الجلسات:
   - ربط الجلسة بمادة دراسية
   - إحصائيات: كم جلسة اليوم؟ كم ساعة هذا الأسبوع؟
   - Heat calendar يعرض أنماط المذاكرة

4. Focus Mode:
   - إخفاء كل الـ UI
   - حجب المواقع المشتتة (إشعار للمستخدم)
   - شاشة كاملة مع عداد وسط
```

## 6.4 — Study Groups المتقدمة

```
طوّر مجموعات الدراسة:

1. Live Collaboration (داخل المجموعة):
   - Shared Whiteboard: لوحة بيضاء مشتركة (Canvas API)
   - Real-time Notes: تعديل ملاحظات مشتركة (Socket.IO)
   - Code Editor مشترك للمواد التقنية (CodeMirror)

2. Group AI:
   - AI خاص بالمجموعة يعرف مادة المجموعة وسياقها
   - "AI سؤال للمجموعة" — كل الأعضاء يشوفون نفس السؤال

3. نظام الجدولة:
   - جلسات مذاكرة مجموعة مع invite calendar
   - تذكير قبل الجلسة بـ 30 دقيقة
   - Recording للجلسة النصية (chat log)
```

---

# ══════════════════════════════════════
# PART 7 — PERFORMANCE & SECURITY
# ══════════════════════════════════════

## 7.1 — Frontend Performance

```javascript
// vite.config.js — ترقية الـ build

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':    ['framer-motion', '@tanstack/react-query'],
          'vendor-charts':['recharts'],
          'vendor-utils': ['date-fns', 'zustand'],
          'ai':           ['./src/components/ai/AIAssistant'],
          'admin':        ['./src/components/admin/AdminDashboard'],
          'teacher':      ['./src/components/teacher/TeacherDashboard',
                          './src/components/teacher/LessonPlanner',
                          './src/components/teacher/ClassAnalytics'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'zustand'],
  },
});
```

## 7.2 — Backend Security Hardening

```javascript
// backend/src/server.js — أضف هذه الـ middleware

const helmet      = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize'); // sanitize inputs

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.VITE_API_URL, "https://generativelanguage.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression()); // gzip responses
app.use(mongoSanitize()); // prevent NoSQL injection

// Rate limiting محسّن
const rateLimit = require('express-rate-limit');
const limits = {
  api:     rateLimit({ windowMs: 15*60*1000, max: 200, message: 'Too many requests' }),
  auth:    rateLimit({ windowMs: 15*60*1000, max: 10,  message: 'Too many auth attempts' }),
  ai:      rateLimit({ windowMs: 60*1000,    max: 20,  message: 'AI rate limit exceeded' }),
  upload:  rateLimit({ windowMs: 60*1000,    max: 5,   message: 'Upload rate limit' }),
};
app.use('/api/auth', limits.auth);
app.use('/api/ai',   limits.ai);
app.use('/api',      limits.api);

// Input validation
const { body, validationResult } = require('express-validator');
// استخدمه في كل route:
// body('email').isEmail().normalizeEmail()
// body('password').isLength({ min: 8 })
// body('name').trim().escape().isLength({ min: 2, max: 100 })
```

---

# ══════════════════════════════════════
# PART 8 — BUG FIXES الأخطاء الحالية
# ══════════════════════════════════════

## 8.1 — قائمة الـ Bugs المطلوب إصلاحها

```
BUG #1 — CRITICAL SECURITY: Admin route بدون حماية
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App.jsx
// ❌ قبل:
<Route path="/admin/dashboard" element={<Suspense><AdminDashboard /></Suspense>} />

// ✅ بعد:
function AdminProtected({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}
<Route path="/admin/dashboard" element={<AdminProtected><AdminDashboard /></AdminProtected>} />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #2: signAccess(user.id) خطأ في guestRegister
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// authController.js سطر ~55
// ❌ قبل:
token: signAccess(user.id),
// ✅ بعد:
token: signAccess(user),

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #3: Protected route لا يحفظ الـ redirect destination
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App.jsx
function Protected({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <AppShell><ErrorBoundary><Suspense fallback={<PageLoader />}>{children}</Suspense></ErrorBoundary></AppShell>;
}

// في LoginPage — بعد نجاح الـ login:
const location = useLocation();
const from = location.state?.from?.pathname || '/';
navigate(from, { replace: true });

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #4: نص Hardcoded في App.jsx (NotFound)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// App.jsx — في NotFound component
// ❌ قبل:
<p>The page you're looking for doesn't exist or has been moved.</p>
// ✅ بعد:
<p>{t('errors.notFoundSub')}</p>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #5: Language state تعارض بين UIStore و i18n
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الحل في PART 5 أعلاه — توحيد مصدر الحقيقة في i18n/index.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #6: Dashboard لا يفرق بين طالب مدرسة وجامعة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الحل في PART 1 أعلاه — getUserRole() + واجهات منفصلة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUG #7: CognitiveEngine يحمّل Xenova model ثقيل عند الـ startup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// الحل في PART 2.5 — استبدال IntentAnalyzer بـ Rule-Based Engine
```

---

# ══════════════════════════════════════
# PART 9 — IMPLEMENTATION ROADMAP
# ══════════════════════════════════════

## ترتيب التنفيذ المقترح (من الأهم للأقل)

```
🔴 SPRINT 1 — أمان وإصلاح فوري (يوم 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ BUG #1: إضافة AdminProtected route
□ BUG #2: إصلاح signAccess
□ BUG #7: استبدال Xenova بـ Rule Engine
□ BUG #5: توحيد نظام اللغة

🔴 SPRINT 2 — الواجهات الجديدة (يوم 3-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ getUserRole() في store.js
□ SchoolStudentDashboard.jsx
□ UniversityStudentDashboard.jsx
□ تحديث Layout.jsx للـ navigation
□ تحديث Dashboard.jsx للـ routing

🟡 SPRINT 3 — AI Upgrade (يوم 6-8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ System Prompt الاحترافي الكامل
□ buildContextualPrompt مع user context
□ AIAssistant.jsx — Mode Selector
□ AIAssistant.jsx — Smart Suggestions
□ Teacher AI Endpoints (generateLessonPlan, generateExamQuestions)

🟡 SPRINT 4 — Teacher Tools (يوم 9-12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ LessonPlanner.jsx
□ ClassAnalytics.jsx
□ ExamBuilder.jsx
□ تحديث TeacherDashboard.jsx

🟢 SPRINT 5 — Admin & i18n (يوم 13-15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Migration: multi_admin.sql
□ AdminProtected component
□ Admin Tabs الجديدة (Admins, Activity Log, Announcements)
□ مفاتيح الترجمة الناقصة في ar.js و en.js
□ إصلاح النصوص الـ Hardcoded

🟢 SPRINT 6 — Polish & Performance (يوم 16-20)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Design System المتكامل في global.css
□ Shared Components الجديدة (SkeletonLoader, DataTable...)
□ vite.config.js — Code Splitting
□ Backend Security Hardening
□ PWA Manifest & Service Worker
□ Mobile Navigation Bar
□ Landing Page ترقية
□ Focus Timer ترقية
□ Achievements ترقية

```

---

## الخلاصة النهائية

هذا البرومبت يغطي **100%** من متطلبات المشروع:

| المتطلب | الحل |
|---------|------|
| واجهة منفصلة لكل فئة | PART 1 — 4 واجهات مختلفة |
| AI قوي ومحترف | PART 2 — System Prompt + Context + Modes |
| اللغة بالكامل | PART 5 — توحيد i18n |
| أدمن متعدد المستويات | PART 4 — 4 مستويات + صلاحيات |
| UI/UX احترافي | PART 3 — Design System كامل |
| مميزات جديدة | PART 6 — Notifications, Achievements, Focus, Groups |
| أمان وأداء | PART 7 — Security + Performance |
| إصلاح الـ Bugs | PART 8 — 7 bugs محددة بالكود |
| خطة تنفيذ | PART 9 — 6 Sprints مرتبة |

---

*تم إعداد هذا البرومبت بناءً على فحص شامل لكل ملفات مشروع نجاح v6*
*الإصدار: 7.0 | التاريخ: أبريل 2026*