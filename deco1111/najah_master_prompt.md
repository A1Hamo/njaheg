# 🎓 NAJAH PLATFORM — MASTER DEVELOPMENT PROMPT
## برومت شامل لتطوير وتحسين منصة نجاح

---

> **كيفية الاستخدام:** انسخ أي قسم من دول وابعته للـ AI مباشرةً.  
> كل قسم مستقل ومكتوب بالتفصيل الكافي للتنفيذ.

---

## ═══════════════════════════════════════
## الجزء الأول: الإصلاحات الأمنية العاجلة
## ═══════════════════════════════════════

```
أنا بشتغل على منصة تعليمية مصرية اسمها "نجاح" مبنية على:
- Backend: Node.js + Express
- Databases: PostgreSQL + MongoDB + Redis
- Frontend: React 18 + Vite + Zustand
- Payments: Paymob (كارت + فوري + محفظة)

المنصة فيها المشاكل الأمنية دي محتاج تصلحها:

───────────────────────────────────────
المشكلة 1: Paymob Webhook بدون HMAC Validation
───────────────────────────────────────
في ملف backend/src/routes/payment.js عندي:

router.post('/webhook', async (req, res) => {
  res.status(200).send('Webhook Received');
  try {
    const payload = req.body;
    // Validate HMAC (Important for genuine security)
    // const hmac = req.query.hmac; 
    // Security check omitted here for brevity, but MUST be implemented in prod.
    const isSuccess = payload.obj?.success;
    ...
  }
});

المطلوب:
1. اكتب middleware اسمه validatePaymobHMAC يعمل التالي:
   - يجيب HMAC من req.query.hmac
   - يجمع كل fields الـ payload بالترتيب اللي Paymob بيطلبه
   - يعمل HMAC-SHA512 بـ process.env.PAYMOB_HMAC_SECRET
   - يقارن النتيجة بالـ hmac اللي جاي
   - لو مش متطابقين يرجع 401 ويعمل log للمحاولة
2. طبق الـ middleware ده على route /webhook
3. أضف PAYMOB_HMAC_SECRET لـ .env.example مع comment يشرح إزاي تجيبه من Paymob dashboard

───────────────────────────────────────
المشكلة 2: CORS مفتوح على كل حاجة
───────────────────────────────────────
في server.js دلوقتي بيعمل callback(null, true) لكل request. المطلوب:
1. حول الـ CORS origin list لـ environment variable: ALLOWED_ORIGINS (comma-separated)
2. في development: اسمح لـ localhost على أي port
3. في production: استخدم فقط القيم في ALLOWED_ORIGINS
4. أضف logging لأي origin يتقفش بيبعت request مش مسموح

───────────────────────────────────────
المشكلة 3: إزالة sharp من frontend
───────────────────────────────────────
في frontend/package.json عندي sharp في dependencies وده خطأ لأنه Node.js library.
المطلوب:
1. اشرح ليه ده مشكلة
2. امسح sharp من frontend/package.json
3. لو محتاج image optimization في الفرونت اعمل utility function بـ Canvas API native browser بدلاً منه
4. في الـ backend اخلي sharp شغال صح للـ server-side image processing

───────────────────────────────────────
المشكلة 4: تأمين simulate-success endpoint
───────────────────────────────────────
في payment.js عندي /simulate-success بيعمل:
- يغير transaction status لـ success
- يعمل enrollment في group

المطلوب:
1. أضف middleware يتأكد إن NODE_ENV !== 'production' وإلا يرجع 404
2. أضف rate limit شديد على الـ endpoint ده (3 requests/hour/user)
3. أضف audit log لكل استخدام

اكتب الكود الكامل لكل إصلاح مع التعديلات المطلوبة في كل ملف.
```

---

## ═══════════════════════════════════════
## الجزء الثاني: إعادة هيكلة Backend (Service Layer)
## ═══════════════════════════════════════

```
عندي backend مبني على Node.js/Express. المشكلة إن معظم الـ DB queries مكتوبة مباشرة في ملفات الـ routes وده بيخلي الكود صعب الـ maintenance.

مثال على المشكلة — من backend/src/routes/groups.js (334 سطر):
- فيه SQL queries مباشرة في الـ route handlers
- فيه MongoDB queries كمان في نفس الملف
- مفيش service layer

المطلوب إنك تعمل refactoring كامل لـ groups route:

الهيكل المطلوب:
backend/src/
├── services/
│   └── groupService.js       ← كل business logic هنا
├── repositories/
│   └── groupRepository.js    ← كل DB queries هنا  
├── controllers/
│   └── groupController.js    ← يستدعي service بس
└── routes/
    └── groups.js             ← route definitions فقط

تعليمات التنفيذ:
1. groupRepository.js:
   - دالة createGroup(data) → SQL INSERT
   - دالة findGroupById(id) → SQL SELECT مع JOIN
   - دالة addStudentToGroup(groupId, studentData) → MongoDB
   - دالة getGroupStudents(groupId) → MongoDB populate
   - كل دالة تتعامل مع error وترميه للـ service
   - استخدم pool من config/postgres والـ Group model من MongoDB

2. groupService.js:
   - يستخدم groupRepository
   - يتعامل مع business logic: هل الطالب already enrolled؟ هل الـ group at capacity؟
   - يبعت notifications للـ socket عند enrollment
   - يتعامل مع الـ payment verification قبل enrollment
   - يرجع structured response

3. groupController.js:
   - يستدعي service فقط
   - يتعامل مع HTTP response format
   - يعمل input validation

4. groups.js (routes):
   - يحتوي فقط على route definitions
   - أقل من 50 سطر

اكتب الكود الكامل للملفات الأربعة.
```

---

## ═══════════════════════════════════════
## الجزء الثالث: واجهات مخصصة لكل دور (Role-Based UI)
## ═══════════════════════════════════════

```
منصة تعليمية React 18 + React Router v6 + Zustand.

المشكلة الحالية:
- كل المستخدمين بيدخلوا على نفس Dashboard.jsx
- الـ roles المتاحة: student, teacher, school_admin, university_admin, admin
- الطالب العادي (مدرسة/سنتر) يشوف نفس واجهة الطالب الجامعي
- المدرس مش عنده واجهة تفيده في إدارة مجموعاته وطلابه

المطلوب: اعمل نظام Role-Based UI متكامل:

───────────────────────────────────────
1. تحديث App.jsx
───────────────────────────────────────
اعمل Protected route ذكي:
- بدل ما يوجه كل الناس لـ Dashboard واحدة
- يتحقق من role في Zustand store
- يروح للـ dashboard المناسب:
  * student (school/center) → /dashboard/student
  * student (university) → /dashboard/university  
  * teacher → /dashboard/teacher
  * school_admin / university_admin → /dashboard/admin
  * admin → /dashboard/super-admin

الـ Zustand store بيحتوي: { user: { id, name, email, role, grade, institution_type } }

───────────────────────────────────────
2. StudentDashboard.jsx (للطالب مدرسة/سنتر)
───────────────────────────────────────
اعمل Dashboard مخصص يحتوي على:
- Quick Stats: درجاتي هذا الأسبوع، Streak أيام، XP هذا الشهر، الحصة القادمة
- جدول الحصص الأسبوعي (7 أيام)
- Quick actions: افتح شات الدعم، حل اختبار، راجع ملفاتي
- الواجبات القادمة (deadline-sorted)
- Leaderboard مجموعتي (top 5 فقط)
- الإشعارات الجديدة

الألوان: استخدم color scheme بنفسجي/أزرق (متغيرات CSS الموجودة)
الـ layout: sidebar مصغر + main content (بدون الـ features الـ advanced زي analytics)

───────────────────────────────────────
3. TeacherDashboard.jsx (للمدرس)
───────────────────────────────────────
Dashboard مخصص يحتوي على:
- Overview: عدد طلابي، مجموعاتي، واجبات لم تُصحح بعد، الحصة القادمة
- جدول الحصص القادمة (أسبوع)
- Quick actions: إنشاء اختبار جديد، رفع ملف، إنشاء واجب، بدء حصة مباشرة
- طلاب يحتاجون اهتمام (غياب كثير أو درجات منخفضة)
- آخر نشاط في مجموعاتي
- إشعارات الواجبات المسلمة التي تحتاج تصحيح

───────────────────────────────────────
4. تحديث Layout.jsx (Sidebar)
───────────────────────────────────────
الـ Sidebar الحالي بيظهر نفس Links لكل الناس. المطلوب:
- اعمل navItems array منفصل لكل role
- student: الرئيسية، مجموعاتي، ملفاتي، اختباراتي، نقاطي، الدردشة
- teacher: الرئيسية، مجموعاتي، طلابي، المناهج، الاختبارات، التقارير، الدردشة
- admin: كل حاجة + إدارة المستخدمين والإعدادات

اكتب الكود الكامل لكل ملف.
استخدم نفس design system الموجود (CSS variables، نفس components من UI.jsx).
```

---

## ═══════════════════════════════════════
## الجزء الرابع: نظام الحصص المباشرة (Live Sessions)
## ═══════════════════════════════════════

```
منصة تعليمية Node.js + React 18 + Socket.IO. محتاج أضيف نظام حصص مباشرة (Live Sessions) بدون WebRTC من الصفر لأن WebRTC معقد — هستخدم Daily.co أو Whereby API بدلاً منه.

المطلوب بناء:

───────────────────────────────────────
Backend: backend/src/routes/sessions.js
───────────────────────────────────────
POST /api/sessions/create
- يأخذ: { groupId, title, scheduledAt, durationMinutes }
- يتحقق من إن المستخدم teacher في الـ group ده
- يعمل room في Daily.co API (أو يرجع meeting link)
- يحفظ في PostgreSQL: id, group_id, teacher_id, title, room_url, scheduled_at, status
- يبعت notification لكل طلاب الـ group عبر Socket.IO
- يرجع { sessionId, roomUrl, joinUrl }

GET /api/sessions/group/:groupId
- يجيب كل الحصص للـ group (coming + past)
- يشمل: status (scheduled/live/ended), attendees count

POST /api/sessions/:id/start
- يغير status لـ 'live'
- يبعت push notification للطلاب

POST /api/sessions/:id/end
- يغير status لـ 'ended'  
- يحفظ duration الفعلية
- يعمل trigger لتسجيل الحضور

POST /api/sessions/:id/attendance
- يسجل حضور طالب
- يحفظ join_time و leave_time

───────────────────────────────────────
Frontend: components/sessions/
───────────────────────────────────────
SessionCard.jsx:
- بطاقة لعرض الحصة (عنوان، وقت، مدة، عدد طلاب)
- زرار "انضم الآن" يفتح roomUrl في iframe أو new tab
- badge للـ status (قادمة/مباشرة الآن/انتهت)

SessionCreator.jsx (للمدرس):
- Form لإنشاء حصة جديدة
- تحديد المجموعة، العنوان، التاريخ والوقت، المدة
- Preview للحصة قبل الإنشاء

LiveSessionPage.jsx:
- Embed الـ Daily.co/Whereby iframe
- Sidebar: قائمة الطلاب الحاضرين (real-time بـ Socket.IO)
- Chat جانبي مخصص للحصة
- زرار رفع ملف أثناء الحصة
- زرار إنهاء الحصة (للمدرس فقط)

───────────────────────────────────────
Socket.IO Events الجديدة في config/socket.js
───────────────────────────────────────
- session:started → يبعت لكل طلاب الـ group
- session:student_joined → يبعت للمدرس
- session:student_left → يبعت للمدرس
- session:ended → يبعت لكل المتصلين

اكتب الكود الكامل لكل ملف.
استخدم DAILY_API_KEY من environment variables.
```

---

## ═══════════════════════════════════════
## الجزء الخامس: الاستفادة من Public APIs
## ═══════════════════════════════════════

```
عندي منصة تعليمية مصرية (Node.js + React 18). محتاج أدمج مجموعة من الـ Public APIs الموجودة في https://github.com/public-apis/public-apis لتحسين تجربة الطالب.

───────────────────────────────────────
API 1: Open Library API (مكتبة كتب مجانية)
───────────────────────────────────────
Backend endpoint: GET /api/tools/books/search?q=query&subject=science
- يبعت request لـ https://openlibrary.org/search.json?q=...&subject=...
- يعمل cache بـ Redis لمدة 24 ساعة (مش محتاج يبعت كل مرة)
- يرجع: title, author, cover_url, year, description, open_library_url

Frontend component: BookLibrary.jsx
- Search bar بالعربي والإنجليزي
- Grid من الكتب مع cover image
- فلتر بالمادة الدراسية

───────────────────────────────────────
API 2: Wikipedia API (تلخيص مفاهيم)
───────────────────────────────────────
Backend endpoint: POST /api/ai/explain-concept
- يأخذ { term, language: 'ar'|'en' }
- يجيب أول paragraph من Wikipedia بالـ language المطلوبة
  Arabic: https://ar.wikipedia.org/api/rest_v1/page/summary/{term}
  English: https://en.wikipedia.org/api/rest_v1/page/summary/{term}
- يمرر النص للـ AI model عشان يعمله تبسيط بمستوى الطالب
- يرجع: النص المبسط + مصدره + Wikipedia URL

Frontend: زرار "اشرح لي" يظهر في كل page في المنصة
- Floating button أسفل يمين
- يفتح modal فيه search
- يعرض الشرح المبسط

───────────────────────────────────────
API 3: QuoteGarden API (اقتباسات تحفيزية)
───────────────────────────────────────
Backend endpoint: GET /api/tools/quote-of-day
- يجيب اقتباس عشوائي من quotes category = education أو success
- يعمل cache بـ Redis لمدة 24 ساعة (نفس الاقتباس طول اليوم)
- يترجم الاقتباس للعربية عبر AI

Frontend: يظهر في Dashboard كل يوم في الأعلى

───────────────────────────────────────
API 4: Random Word / Dictionary API (تعلم اللغة)
───────────────────────────────────────
Backend endpoint: GET /api/tools/word-of-day
- يجيب كلمة إنجليزية جديدة بـ definition و example sentence
- يترجمها للعربية

Frontend component: WordOfDay.jsx (widget صغير في Dashboard)

اكتب:
1. الكود الكامل للـ backend endpoints مع Redis caching
2. الكود الكامل للـ frontend components
3. error handling لو الـ external API فشل (fallback to cached/default data)
استخدم axios للـ HTTP requests.
```

---

## ═══════════════════════════════════════
## الجزء السادس: دمج browser-use / video-use
## ═══════════════════════════════════════

```
عندي منصة تعليمية وعايز أستفيد من https://github.com/browser-use/video-use
ده مشروع بيقدر يفهم محتوى الفيديوهات ويتفاعل معاها.

المطلوب:
───────────────────────────────────────
فكرة 1: Video Summary + Timestamps
───────────────────────────────────────
عايز عمل feature: الطالب يرفع رابط YouTube فيديو تعليمي والمنصة:
1. تجيب الـ transcript بـ youtube-transcript library (موجودة بالفعل في المشروع)
2. تبعت الـ transcript للـ AI وتطلب:
   - ملخص عام في 5 نقاط
   - مواضيع رئيسية مع Timestamps
   - 5 أسئلة اختبار من المحتوى
   - المصطلحات الصعبة مع شرحها

Backend endpoint: POST /api/ai/video-analyze
- يأخذ { youtubeUrl, language: 'ar'|'en' }
- يجيب الـ transcript (موجود بالفعل في youtubeSummarize function)
- يضيف إليه: timestamps chapters, quiz questions, glossary
- يحفظ النتيجة في MongoDB مع الـ userId والـ url (عشان ما يتعملش مرتين)

Frontend: VideoAnalyzer.jsx
- Input لرابط YouTube
- Progress indicator (Loading → Transcript → Analysis → Done)
- عرض النتائج في tabs: ملخص / أسئلة / مصطلحات / Timestamps

───────────────────────────────────────
فكرة 2: OCR للواجبات المصورة
───────────────────────────────────────
الطالب يصور واجبه (ورقة مكتوبة) والـ AI يصححه:

Backend endpoint: POST /api/ai/correct-homework
- يأخذ صورة base64 + { subject, gradeLevel }
- يبعتها للـ AI Vision model مع prompt:
  "أنت معلم مصري متخصص في [subject] للصف [gradeLevel]. 
   صحح هذا الواجب وأعطِ:
   1. الدرجة من 10
   2. الأخطاء بالتفصيل مع شرح الصح
   3. نصيحة للتحسين"
- يرجع: { score, errors[], feedback, correctedVersion }

Frontend: HomeworkCorrector.jsx
- Drag & drop لرفع صورة الواجب
- اختيار المادة والصف
- عرض نتيجة التصحيح بتنسيق واضح

اكتب الكود الكامل للـ endpoints والـ components.
```

---

## ═══════════════════════════════════════
## الجزء السابع: دمج MSE AI API
## ═══════════════════════════════════════

```
عندي منصة تعليمية وعايز أدمج https://github.com/MohamedElsayed-debug/mse_ai_api
بحيث أستخدم الـ AI APIs المصرية المتاحة فيه كـ alternative أو complement لـ OpenAI.

المطلوب:
1. افتح الـ repo وافهم إيه الـ endpoints المتاحة والـ models
2. اعمل service جديد في backend/src/services/mseAIService.js:
   - نفس interface بتاع geminiAI.js الموجود
   - يدعم: chat, summarize, quiz generation
   - يتعامل مع errors وfallback

3. في aiController.js الحالي:
   - أضف logic للـ AI provider selection:
     * لو user في Egypt وعنده MSE API key → استخدم MSE
     * لو مفيش → fallback لـ Gemini
     * لو مفيش → fallback لـ OpenAI
   - اعمل GET /api/ai/providers endpoint يرجع الـ available providers

4. في Frontend:
   - في Settings page أضف قسم "مزود الذكاء الاصطناعي"
   - يعرض الـ providers المتاحة
   - يخلي المستخدم يختار المفضل

اكتب الكود الكامل بافتراض إن MSE API endpoint هو:
POST https://api.mse-ai.com/v1/chat/completions (أو الـ endpoint الفعلي من الـ repo)
مع مراعاة:
- نفس structure بتاع OpenAI لتسهيل الـ integration
- Rate limiting منفصل للـ MSE provider
- Logging لكل provider usage
```

---

## ═══════════════════════════════════════
## الجزء الثامن: Parent Dashboard + Monitoring
## ═══════════════════════════════════════

```
منصة تعليمية Node.js + React 18. محتاج أضيف role جديد: "parent" (ولي الأمر).

───────────────────────────────────────
Database Changes (PostgreSQL)
───────────────────────────────────────
أضف الجداول دي:

parent_student_links:
  id UUID PK
  parent_id UUID → users(id)
  student_id UUID → users(id)  
  relationship VARCHAR(20) -- father, mother, guardian
  verified BOOLEAN DEFAULT false
  linked_at TIMESTAMPTZ

parent_notifications_prefs:
  parent_id UUID PK
  notify_on_absence BOOLEAN DEFAULT true
  notify_on_grade BOOLEAN DEFAULT true
  notify_on_achievement BOOLEAN DEFAULT true
  min_grade_to_notify INTEGER DEFAULT 60

اعمل migration SQL لإضافة الجداول دي.

───────────────────────────────────────
Backend Endpoints: routes/parents.js
───────────────────────────────────────
POST /api/parents/link-student
- ولي الأمر يدخل كود الطالب أو email
- يبعت request للطالب يوافق على الربط
- بعد موافقة الطالب يبقى الربط verified

GET /api/parents/my-students
- يجيب كل الطلاب المرتبطين بولي الأمر

GET /api/parents/student/:studentId/overview
- ملخص شامل للطالب:
  * حضور هذا الشهر (نسبة مئوية)
  * متوسط الدرجات في كل مادة
  * آخر 5 نتائج اختبارات
  * XP Points هذا الأسبوع
  * الواجبات المتأخرة

GET /api/parents/student/:studentId/grades
- كل الدرجات مصنفة بالمادة

GET /api/parents/student/:studentId/attendance
- سجل الحضور والغياب (calendar view data)

───────────────────────────────────────
Frontend: components/parent/
───────────────────────────────────────
ParentDashboard.jsx:
- لو عنده أكتر من طالب: tabs أو cards للتبديل بينهم
- StudentOverviewCard: صورة + اسم + إحصائيات سريعة
- AttendanceCalendar: calendar بألوان (أخضر حاضر، أحمر غياب، رمادي إجازة)
- GradeChart: Line chart للدرجات عبر الوقت لكل مادة
- RecentActivity: آخر اختبارات وواجبات

اكتب الكود الكامل.
```

---

## ═══════════════════════════════════════
## الجزء التاسع: PWA + Offline Mode
## ═══════════════════════════════════════

```
منصة تعليمية React 18 + Vite. الـ vite.config.js عنده vite-plugin-pwa مثبت.
محتاج أفعّل PWA وOffline mode بشكل صحيح.

───────────────────────────────────────
1. تحديث vite.config.js
───────────────────────────────────────
اكتب الـ VitePWA config الكاملة:
- name: 'نجاح - منصة تعليمية'
- short_name: 'نجاح'
- theme_color: '#6366F1'
- icons: استخدم الموجود في public/
- strategy: 'injectManifest' (عشان عندنا control أكثر)

Cache strategies:
- Static assets (JS/CSS): CacheFirst, 30 days
- API responses لـ /api/subjects و/api/curriculum: StaleWhileRevalidate, 1 day
- Images: CacheFirst, 7 days
- /api/ai/* و /api/chat/*: NetworkOnly (مش نقدر نكشها)

───────────────────────────────────────
2. Service Worker: src/sw.js
───────────────────────────────────────
اكتب service worker يعمل:
- Pre-cache للـ app shell (index.html + main chunks)
- Offline fallback page: لو الـ network فشل وما فيش cache → اعرض offline.html
- Background sync: لو الطالب حاول يسلّم واجب وكان offline → احفظه وابعته لما الـ network يرجع

───────────────────────────────────────
3. Frontend: hooks/useOfflineSync.js
───────────────────────────────────────
Custom hook يعمل:
- يراقب navigator.onLine
- يحفظ الـ pending actions في IndexedDB
- لما الـ network يرجع يعمل sync تلقائي
- يعرض toast للمستخدم: "أنت offline - التغييرات ستُحفظ عند الاتصال"

───────────────────────────────────────
4. public/offline.html
───────────────────────────────────────
صفحة offline جميلة:
- رسالة ودية بالعربي
- زرار "حاول مرة أخرى"
- عرض آخر محتوى تم تحميله (من Cache API)

اكتب الكود الكامل لكل ملف.
```

---

## ═══════════════════════════════════════
## الجزء العاشر: Testing Suite
## ═══════════════════════════════════════

```
منصة تعليمية Node.js + Express. عندي Jest و Supertest مثبتين بس مفيش tests.
محتاج تكتب test suite شامل.

───────────────────────────────────────
backend/tests/auth.test.js
───────────────────────────────────────
اكتب integration tests لـ:
1. POST /api/auth/register
   - تسجيل ناجح بـ بيانات صحيحة
   - تسجيل بـ email موجود (يجب أن يرجع 409)
   - تسجيل بـ password ضعيف (يجب أن يرجع 400)

2. POST /api/auth/login
   - login ناجح → يرجع token
   - login بـ password غلط → 401
   - login بـ email غير موجود → 401

3. GET /api/auth/me
   - بـ token صحيح → يرجع بيانات المستخدم
   - بدون token → 401
   - بـ token منتهي → 401

───────────────────────────────────────
backend/tests/payment.test.js
───────────────────────────────────────
اكتب tests لـ:
1. POST /api/payment/initiate
   - بدون auth → 401
   - بـ amount = 0 → 400
   - بـ gateway غير معروف → 400

2. POST /api/payment/webhook
   - بدون HMAC → 401
   - بـ HMAC غلط → 401
   - بـ HMAC صح + isSuccess=true → يغير status لـ success
   - بـ HMAC صح + isSuccess=false → يغير status لـ failed

───────────────────────────────────────
backend/tests/ai.test.js
───────────────────────────────────────
اكتب tests مع mocking للـ AI API:
1. POST /api/ai/chat → يرجع response
2. POST /api/ai/quiz → يرجع array من 5 أسئلة
3. Rate limiting: 11 requests في دقيقة → الـ 11 ترجع 429

───────────────────────────────────────
setup & mocks
───────────────────────────────────────
اكتب:
- jest.config.js مع المتغيرات الصحيحة
- tests/setup.js للـ test database
- tests/mocks/openai.js لـ mock الـ OpenAI API
- tests/mocks/redis.js لـ mock الـ Redis

اكتب الكود الكامل مع تعليمات تشغيل الـ tests.
```

---

## ═══════════════════════════════════════
## الجزء الحادي عشر: Marketing — إعلان البيع
## ═══════════════════════════════════════

```
عايز تكتب لي نسختين من إعلان بيع منصة تعليمية احترافية على Facebook و LinkedIn.

المعلومات:
المنصة اسمها "نجاح" — منصة تعليمية مصرية متكاملة.

المميزات الأساسية:
- لوحات تحكم لكل دور (مدير، مدرس، طالب، ولي أمر)
- حصص مباشرة أونلاين (بـ video، chat، سبورة، مشاركة شاشة، رفع ملفات)
- إدارة الفيديوهات والملفات التعليمية + مكتبة متكاملة
- دفتر درجات + تقارير وإحصائيات + إدارة الحضور
- اختبارات واوراق عمل + بنك أسئلة
- ذكاء اصطناعي: توليد أسئلة، تصحيح واجبات، شرح مفاهيم، مساعد ذكي
- نظام نقاط وشارات ومكافآت (Gamification)
- إدارة الاشتراكات والمدفوعات (Paymob: كارت، فوري، محفظة)
- تصميم Light/Dark احترافي عربي بالكامل
- Website Builder لبناء صفحات عرض المنصة

طريقتين للبيع:
1. اشتراك شهري/سنوي على سيرفراتنا (SaaS) — بدأ من XXX جنيه/شهر
2. سورس كود كامل مع White Label (غير الاسم واللوجو والألوان)

المناسب لـ: أكاديميات، سناتر، معلمين أصحاب براند شخصي، منصات كورسات

المطلوب:
1. Post فيسبوك (عربي): جذاب، بيتكلم مع أصحاب السناتر والأكاديميات
   - يبدأ بـ hook قوي
   - يعدد المميزات بشكل منظم
   - CTA واضح
   - يستخدم emojis بشكل معتدل ومناسب
   - طول: 300-400 كلمة

2. Post LinkedIn (عربي + إنجليزي): أكثر احترافية
   - يتكلم مع أصحاب القرار (CEOs, Directors)
   - يركز على ROI والـ business value
   - يذكر التقنيات المستخدمة
   - طول: 200-250 كلمة لكل لغة

3. WhatsApp message template للـ follow-up:
   - رسالة قصيرة (100 كلمة max)
   - لما حد يسأل عن التفاصيل

اكتبهم بشكل احترافي جاهز للنشر.
```

---

## ═══════════════════════════════════════
## الجزء الثاني عشر: Website Builder Feature
## ═══════════════════════════════════════

```
منصة تعليمية React 18. محتاج أبني Website Builder بسيط يخلي كل مدرس/أكاديمية تبني صفحة عرض خاصة بيها.

المطلوب:

───────────────────────────────────────
1. Backend: routes/website-builder.js
───────────────────────────────────────
POST /api/website/save
- يأخذ { sections: [], theme: {}, subdomain: 'ahmed' }
- يتحقق من إن الـ subdomain مش مأخوذ
- يحفظ في MongoDB: WebsitePage model

GET /api/website/:subdomain
- يجيب بيانات الصفحة

PATCH /api/website/:subdomain/publish
- ينشر الصفحة (published: true)

───────────────────────────────────────
2. Website Builder Sections (drag & drop)
───────────────────────────────────────
اعمل component builder فيه الـ sections دي:
- HeroSection: عنوان + وصف + زرار + صورة خلفية
- AboutSection: صورة المدرس + نبذة
- CoursesSection: قائمة الكورسات/المجموعات المتاحة من API
- TestimonialsSection: آراء الطلاب
- ContactSection: فورم تواصل
- PricingSection: جدول الأسعار

───────────────────────────────────────
3. Frontend: components/website-builder/
───────────────────────────────────────
WebsiteBuilder.jsx:
- Sidebar: قائمة الـ sections المتاحة (drag من هنا)
- Canvas: المنطقة اللي بتبنيها (drop هنا)
- Properties Panel: لما تضغط على section تعدل محتواه
- Preview Mode: شوف النتيجة
- زرار Publish

Section Renderer:
- يأخذ section type + data
- يعمل render احترافي للـ section
- كل section قابل للتعديل inline

Theme Customizer:
- اختيار لون أساسي
- اختيار font
- Light/Dark

اكتب الكود الكامل لـ WebsiteBuilder.jsx والـ SectionRenderer.jsx مع 3 sections جاهزة (Hero, About, Courses).
```

---

## ═══════════════════════════════════════
## الجزء الثالث عشر: Performance Optimizations
## ═══════════════════════════════════════

```
منصة تعليمية Node.js + Express + Redis + PostgreSQL + React 18.
محتاج أضيف optimizations عشان المنصة تتحمل 1000+ مستخدم concurrent.

───────────────────────────────────────
Backend Optimizations
───────────────────────────────────────
1. Redis Caching Layer:
اعمل cacheMiddleware.js:
- يأخذ: (keyPattern, ttl)
- لو الـ key موجود في Redis يرجعه فوراً
- لو مش موجود ينفذ الـ handler ويحفظ النتيجة
- استخدمه على: GET /api/subjects, GET /api/curriculum, GET /api/achievements

مثال:
router.get('/subjects', cacheMiddleware('subjects:all', 3600), getAllSubjects)

2. Database Query Optimization:
راجع الـ queries دي وحسّنها:
- في auth.js: SELECT * من users في كل request → SELECT فقط الحقول المطلوبة
- في achievements.js: N+1 query problem → اعمل JOIN واحد بدل حلقة
- أضف EXPLAIN ANALYZE hints لأهم الـ queries

3. Response Compression:
تأكد إن compression middleware شغال على كل الـ responses
أضف Brotli بدل gzip بس لو Node version يدعمه

───────────────────────────────────────
Frontend Optimizations
───────────────────────────────────────
1. Bundle Analysis:
اكتب vite.config.js updates:
- Manual chunks: vendor, react, ai-components, charts
- esbuild minification options
- Tree shaking improvements

2. Image Optimization:
اعمل OptimizedImage.jsx component:
- يستخدم loading="lazy" + decoding="async"
- يحسب srcset تلقائياً
- يعرض skeleton أثناء التحميل
- يستخدم WebP مع JPEG fallback

3. Virtual Scrolling:
لقوائم الطلاب والملفات الكبيرة:
اعمل VirtualList.jsx component بدون library خارجية:
- يعرض فقط الـ items اللي في الـ viewport
- مناسب لـ 1000+ item
- يدعم variable height items

اكتب الكود الكامل مع benchmarks notes.
```

---

## ═══════════════════════════════════════
## ملاحظات للمطور
## ═══════════════════════════════════════

### ترتيب التنفيذ المقترح:

| الأولوية | المهمة | الوقت المقدر |
|----------|--------|--------------|
| 🔴 فوري | الجزء الأول: إصلاحات أمنية | يوم واحد |
| 🔴 فوري | الجزء الثالث: Role-Based UI | يومين |
| 🟡 قريب | الجزء الثاني: Service Layer | 3 أيام |
| 🟡 قريب | الجزء العاشر: Testing | يومين |
| 🟢 تالي | الجزء الرابع: Live Sessions | أسبوع |
| 🟢 تالي | الجزء الخامس: Public APIs | يومين |
| 🟢 تالي | الجزء الثامن: Parent Dashboard | 3 أيام |
| 🔵 مستقبل | الجزء التاسع: PWA | يومين |
| 🔵 مستقبل | الجزء الثاني عشر: Website Builder | أسبوع |
| 🔵 مستقبل | الجزء الثالث عشر: Performance | يومين |

### Environment Variables المطلوبة للإضافات الجديدة:
```env
# Security
PAYMOB_HMAC_SECRET=          # من Paymob Dashboard
ALLOWED_ORIGINS=             # comma-separated production URLs

# Live Sessions
DAILY_API_KEY=               # من daily.co
DAILY_API_BASE=https://api.daily.co/v1

# AI Providers  
MSE_AI_API_KEY=              # من mse_ai_api
MSE_AI_BASE_URL=

# Push Notifications
VAPID_PUBLIC_KEY=            # للـ PWA push
VAPID_PRIVATE_KEY=
```

### Repos المطلوب دراستها:
- **public-apis**: https://github.com/public-apis/public-apis
  → ابحث عن: Education, Books, Science sections
- **video-use**: https://github.com/browser-use/video-use
  → استخدم لـ: Video content understanding, OCR features
- **mse_ai_api**: https://github.com/MohamedElsayed-debug/mse_ai_api
  → استخدم كـ: Alternative AI provider للسوق المصري
