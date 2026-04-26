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
