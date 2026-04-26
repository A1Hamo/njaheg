# 🔍 تقرير التحسينات الإضافية — منصة نجاح
## اكتشفنا دي بعد مراجعة أعمق للكود

---

## ═══════════════════════════════════════
## أولاً: مشاكل مكتشفة جديدة (لم تُذكر سابقاً)
## ═══════════════════════════════════════

### 🔴 حرجة

---

**1. Token Exposure في Google OAuth Redirect**
```
backend/src/controllers/authController.js — googleCallback()
```
الكود بيعمل:
```js
res.redirect(`${clientUrl}/auth/callback?token=${token}&refresh=${refresh}`)
```
الـ tokens بتظهر في URL بشكل واضح → بيتسجل في:
- Browser history
- Server access logs
- Nginx logs
- أي proxy في الوسط

**الإصلاح المطلوب:**
```
بدلاً من URL params، استخدم short-lived code:
1. احفظ { token, refresh } في Redis بـ code عشوائي (uuid) — TTL = 60 ثانية
2. وجّه المستخدم لـ /auth/callback?code=XXXX
3. الـ Frontend يجيب الـ tokens بـ POST /api/auth/exchange-code
4. احذف الـ code من Redis فوراً
```

---

**2. SQL Injection Risk في notes.js**
```
backend/src/routes/notes.js — GET / 
```
الكود بيبني الـ query بـ string concatenation:
```js
let q='SELECT * FROM notes WHERE user_id=$1', i=2;
if (subject) { q+=` AND subject=$${i++}`; p.push(subject); }
if (search) { q+=` AND (title ILIKE $${i} OR content ILIKE $${i})`; p.push(`%${search}%`); i++; }
q+=` ORDER BY is_pinned DESC, updated_at DESC LIMIT $${i++} OFFSET $${i}`;
```
المشكلة: الـ OFFSET counter `$${i}` بيُستخدم بعد `i++` يعني بيحسب غلط — ممكن يعمل off-by-one في الـ parameters وده بيعمل SQL error أو يرجع data غلط.

**الإصلاح:**
```js
// استخدم query builder بسيط أو اثبّت الـ parameter indices
const offset = (Number(page)-1)*Number(limit);
const params = [req.user.id];
let conditions = ['user_id=$1'];
if (subject) { params.push(subject); conditions.push(`subject=$${params.length}`); }
if (search)  { params.push(`%${search}%`); conditions.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`); }
params.push(Number(limit), offset);
const q = `SELECT * FROM notes WHERE ${conditions.join(' AND ')} ORDER BY is_pinned DESC, updated_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`;
```

---

**3. XP Update بدون Transaction في board.js**
```
backend/src/routes/board.js — POST /:id/like
```
```js
await pool.query('INSERT INTO board_likes ...');
await pool.query('UPDATE board_posts SET likes_count=likes_count+1 ...');
await pool.query('UPDATE users SET xp_points=xp_points+5 ...');
```
لو الـ query الثانية أو الثالثة فشلت → inconsistent state (like مسجل بس count مش اتحدث).

**الإصلاح:**
```js
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO board_likes...');
  await client.query('UPDATE board_posts SET likes_count=likes_count+1...');
  await client.query('UPDATE users SET xp_points=xp_points+5...');
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```
نفس المشكلة موجودة في: achievements, files upload, study sessions

---

**4. Refresh Token بدون Rotation**
```
backend/src/controllers/authController.js — refreshToken()
```
```js
async function refreshToken(req, res) {
  const { refresh } = req.body;
  const decoded = verifyRefresh(refresh);
  res.json({ token: signAccess(decoded.id) }); // ← الـ refresh token نفسه مش بيتغير!
}
```
نفس الـ refresh token شغال إلى الأبد لو مش expired. لو اتسرق → الـ attacker يفضل يعمل tokens جديدة للأبد.

**الإصلاح:** كل مرة تعمل refresh، اعمل refresh token جديد وابعته مع الـ access token، واحذف القديم من الـ database.

---

**5. Audio External URL في store.js**
```js
const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
```
- External dependency في Zustand store
- لو الموقع ده وقع → الـ notifications فضيحة
- ممكن يتبلوك بـ CSP

**الإصلاح:** حوّل الصوت لـ local file في `public/sounds/ping.mp3` أو استخدم Web Audio API لتوليد tone بسيط بدون file خارجي.

---

### 🟡 مشاكل متوسطة

---

**6. Missing Database Indexes**
الـ queries الأكثر استخداماً بدون indexes:
```sql
-- بتتعمل في كل request تقريباً
SELECT * FROM notes WHERE user_id=$1  -- user_id مش مـ indexed
SELECT * FROM files WHERE user_id=$1  -- نفس المشكلة
SELECT * FROM study_sessions WHERE user_id=$1 AND status='completed'
SELECT * FROM board_posts JOIN users... -- likes_count للـ sorting بدون index
```

**الإضافة المطلوبة في postgres.js:**
```sql
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_status ON study_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_board_posts_likes ON board_posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
```

---

**7. Socket.IO بيعمل DB Query في كل Message**
```
backend/src/config/socket.js — send_message event
```
```js
await pool.query('UPDATE users SET xp_points=xp_points+5 WHERE id=$1', [socket.user.id]);
```
كل رسالة chat بتعمل DB write → مع 100 مستخدم بيتكلموا في نفس الوقت = 100 write/ثانية.

**الإصلاح:** اعمل XP batching:
```js
// اجمع الـ XP وابعتهم كل 5 دقائق بـ cron job
await cacheIncr(`xp_pending:${socket.user.id}`);
// Cron كل 5 دقائق:
// UPDATE users SET xp_points = xp_points + redis_val WHERE id = userId
```

---

**8. board.js بيجيب posts بدون pagination count**
```js
router.get('/', async (req, res) => {
  // بيرجع posts بس بدون total count
  res.json({ posts: rows });
});
```
الـ Frontend مش عارف كم page موجود → مش قادر يعمل proper pagination UI.

**الإصلاح:**
```js
const [postsResult, countResult] = await Promise.all([
  pool.query(q, p),
  pool.query(`SELECT COUNT(*) FROM board_posts WHERE ...`, countParams)
]);
res.json({ posts: postsResult.rows, total: parseInt(countResult.rows[0].count), page, limit });
```

---

**9. Analytics Route بدون caching**
```
backend/src/routes/analytics.js — GET /dashboard
```
بيعمل 5 parallel DB queries في كل مرة حد يفتح صفحة Analytics. لو 50 طالب فتحوا الصفحة في نفس الوقت = 250 query في ثانية.

**الإصلاح:**
```js
const cacheKey = `analytics:${uid}:${today}`;
const cached = await cacheGet(cacheKey);
if (cached) return res.json(cached);
// ... run queries ...
await cacheSet(cacheKey, result, 300); // 5 دقائق cache
```

---

**10. useUIStore: institutionMode vs user.role**
```
frontend/src/context/store.js
```
عندك:
- `useUIStore` → `institutionMode: 'school' | 'university'`
- `useAuthStore` → `user.role: 'student' | 'teacher' | 'admin'`

لكن مفيش sync مضمون بينهم — لو حد غيّر الـ role من الـ admin panel، الـ institutionMode في الـ frontend هيفضل القديم لحد ما يعمل logout وlogin.

**الإصلاح:** لما تجيب بيانات المستخدم (على كل `/auth/me` call) اعمل sync للـ institutionMode من `user.institution_type`:
```js
// في authController.getMe response أو في App.jsx useEffect
useEffect(() => {
  if (user?.institution_type) {
    setInstitutionMode(user.institution_type === 'university' ? 'university' : 'school');
  }
}, [user?.institution_type]);
```

---

## ═══════════════════════════════════════
## ثانياً: تحسينات UX/UI مهمة
## ═══════════════════════════════════════

---

**11. مفيش Skeleton Loading في Dashboard**
Dashboard بيعمل 4 queries بالـ TanStack Query. المستخدم بيشوف blank screen حتى كلهم يخلصوا.

**المطلوب:** Skeleton components لكل section بيتحمل:
```jsx
function StatCardSkeleton() {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 16, padding: 24, animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ height: 12, background: 'var(--border)', borderRadius: 6, width: '60%', marginBottom: 12 }} />
      <div style={{ height: 28, background: 'var(--border)', borderRadius: 6, width: '40%' }} />
    </div>
  );
}
```

---

**12. Chat Page بدون Message Status UI**
```
frontend/src/components/chat/PrivateChat.jsx
```
المشكلة: الـ store بيحفظ `status: 'sent' | 'read'` بس مفيش UI يعرضه.

**المطلوب:** أيقونات ✓ و ✓✓ (مثل WhatsApp):
- ✓ رمادي = sent
- ✓✓ رمادي = delivered
- ✓✓ أزرق = read

---

**13. Notes Editor بدون Auto-Save**
```
frontend/src/components/notes/NotesPage.jsx
```
لو المتصفح اتقفل أو الـ internet قطع وهو بيكتب → الـ note بيضيع.

**المطلوب:**
```jsx
// Auto-save كل 30 ثانية + عند تغيير الـ tab
useEffect(() => {
  const timer = setInterval(() => {
    if (isDirty) mutate(currentNote);
  }, 30000);
  
  const handleVisibility = () => {
    if (document.hidden && isDirty) mutate(currentNote);
  };
  document.addEventListener('visibilitychange', handleVisibility);
  
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}, [isDirty, currentNote]);
```

---

**14. Profile Page بدون Password Strength Indicator**
في Change Password form مفيش مؤشر قوة الكلمة المرورية — المستخدم مش عارف هل الـ password بتاعه قوي ولا لا.

**المطلوب:** 
```jsx
function PasswordStrength({ password }) {
  const checks = [
    { test: /.{8,}/, label: '8 أحرف على الأقل' },
    { test: /[A-Z]/, label: 'حرف كبير' },
    { test: /[0-9]/, label: 'رقم' },
    { test: /[^A-Za-z0-9]/, label: 'رمز خاص' },
  ];
  const passed = checks.filter(c => c.test.test(password)).length;
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#6366F1'];
  // عرض 4 bars بلون يتغير حسب القوة
}
```

---

## ═══════════════════════════════════════
## ثالثاً: Features ناقصة لكن Infrastructure موجودة
## ═══════════════════════════════════════

---

**15. Curriculum Route موجود لكن مفيش Data**
```
backend/src/routes/curriculum.js
```
الـ routes موجودة للـ grade_levels وsubjects وunits وlessons، لكن مفيش seed data للمناهج المصرية. الـ Frontend بيجيب empty arrays.

**المطلوب:** seed file بالمنهج المصري الأساسي:
```sql
-- seed المواد الأساسية للثانوية العامة
INSERT INTO grade_levels (name, level_order) VALUES
  ('الصف الأول الثانوي', 1),
  ('الصف الثاني الثانوي', 2),
  ('الصف الثالث الثانوي', 3);

INSERT INTO subjects (name, grade_id, color, icon) VALUES
  ('الرياضيات', 1, '#7C3AED', '📐'),
  ('الفيزياء', 1, '#8B5CF6', '⚡'),
  -- ... إلخ
```

---

**16. Achievement System: board_post achievement لا يتفعّل**
```
backend/src/services/achievementService.js
```
في `checkAchievements()`:
```js
} else if (event === 'quiz_generated' || event === 'quiz_submitted' || event === 'ai_chat') {
  const tbl = event === 'quiz_submitted' ? 'quiz_attempts' : null;
  if (tbl) { ... }
  // 'ai_chat' و 'quiz_generated' مش بيتعمل COUNT فعلي!
}
```
والأهم: `board_post` event مش عنده handling في الـ switch → achievement مش بيتمنح أبداً.

**الإصلاح:**
```js
} else if (event === 'board_post') {
  const { rows } = await pool.query('SELECT COUNT(*) FROM board_posts WHERE user_id=$1', [userId]);
  earned = parseInt(rows[0].count) >= need;
} else if (event === 'ai_chat') {
  const { rows } = await pool.query('SELECT COUNT(*) FROM ai_conversations WHERE user_id=$1', [userId]);
  earned = parseInt(rows[0].count) >= need;
}
```

---

**17. Groups: Assignment Grading بدون Notification**
```
backend/src/routes/groups.js — PATCH /assignments/:assignmentId/grade
```
لما المدرس يصحح الواجب مفيش notification للطالب إن درجته اتحطت.

**الإضافة:**
```js
// بعد حفظ الدرجة
await pushNotification(submission.student_id, {
  type: 'grade',
  title: '📊 تم تصحيح واجبك',
  body: `حصلت على ${grade} من ${assignment.max_grade} في واجب "${assignment.title}"`,
  metadata: { assignmentId, groupId }
});
await pool.query(
  `INSERT INTO notifications (user_id, type, title, body) VALUES ($1, 'grade', $2, $3)`,
  [submission.student_id, 'تم تصحيح واجبك', `درجتك: ${grade}/${assignment.max_grade}`]
);
```

---

**18. Planner: Sessions بدون Conflict Detection**
```
backend/src/routes/planner.js
```
ممكن الطالب يحجز حصتين في نفس التوقيت من غير أي تحذير.

**الإضافة:**
```js
// في POST / (create session)
const { rows: conflicts } = await pool.query(`
  SELECT id, subject FROM study_sessions 
  WHERE user_id=$1 
  AND status != 'cancelled'
  AND tsrange(start_time, start_time + (duration || ' minutes')::interval)
    && tsrange($2::timestamptz, $3::timestamptz)
`, [userId, startTime, endTime]);

if (conflicts.length > 0) {
  return res.status(409).json({ 
    error: 'تعارض في المواعيد', 
    conflicts: conflicts.map(c => c.subject)
  });
}
```

---

## ═══════════════════════════════════════
## رابعاً: تحسينات Backend Architecture
## ═══════════════════════════════════════

---

**19. مفيش Input Validation Middleware**
الـ routes بتأخذ input مباشرة بدون validation في معظم الأماكن. مثال:
```js
// board.js
const { title, description, file_id, subject, grade } = req.body;
if (!title || !file_id) return res.status(400).json({ error: 'title and file_id required' });
// مفيش تحقق من: طول العنوان، valid subject، valid grade، حقن HTML
```

**المطلوب:** middleware بـ Joi أو express-validator (موجودة في dependencies):
```js
// middleware/validate.js
const { body, validationResult } = require('express-validator');

const boardPostValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('العنوان بين 3 و 200 حرف'),
  body('subject').isIn(['mathematics','science','arabic','english','physics','chemistry']),
  body('file_id').isUUID(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];
```

---

**20. Email Templates بدون HTML Sanitization**
```
backend/src/services/emailService.js
```
لو الـ user ادخل HTML في اسمه → ممكن يعمل HTML injection في الـ email templates.

**الإصلاح:** استخدم `he` library أو `sanitize-html` قبل inject أي user data في templates:
```js
const he = require('he');
const safeData = Object.fromEntries(
  Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? he.escape(v) : v])
);
```

---

**21. cron Jobs: Weekly Summary بدون Pagination**
```
backend/src/jobs/cronJobs.js
```
لو عندك 10,000 طالب → الـ cron بيجيب كلهم في memory في نفس الوقت = memory spike.

**الإصلاح:** اعمل processing بـ batches:
```js
const BATCH_SIZE = 100;
let offset = 0;
while (true) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE is_active=true LIMIT $1 OFFSET $2',
    [BATCH_SIZE, offset]
  );
  if (rows.length === 0) break;
  
  await Promise.all(rows.map(u => sendWeeklySummary(u)));
  offset += BATCH_SIZE;
  await new Promise(r => setTimeout(r, 1000)); // استنى ثانية بين كل batch
}
```

---

## ═══════════════════════════════════════
## خامساً: Frontend Architecture
## ═══════════════════════════════════════

---

**22. API Client: Timeout قصير جداً للـ AI**
```
frontend/src/api/index.js
```
```js
const client = axios.create({ baseURL: API, timeout: 30000 });
```
الـ AI endpoints بتاخد أحياناً 30-60 ثانية (PDF summary, quiz generation). timeout = 30 ثانية هيعمل cancel للـ request قبل ما يخلص.

**الإصلاح:**
```js
// client أساسي بـ 30s
const client = axios.create({ baseURL: API, timeout: 30000 });

// client خاص للـ AI بـ 90s
export const aiClient = axios.create({ baseURL: API, timeout: 90000 });
// استخدمه في aiAPI فقط
```

---

**23. Zustand Store: Chat Messages في Memory للأبد**
```
frontend/src/context/store.js — useChatStore
```
```js
messages: {},          // { roomId: Message[] }
privateMessages: {},   // { userId: Message[] }
```
لو المستخدم فضل في الـ chat لساعات → الـ messages بتتراكم في memory بدون حد أقصى. ممكن تسبب memory leak في الـ browser.

**الإصلاح:** احتفظ فقط بآخر 100 رسالة:
```js
addMessage: (room, msg) => set(s => {
  const old = s.messages[room] || [];
  const updated = [...old, msg].slice(-100); // Keep only last 100
  return { messages: { ...s.messages, [room]: updated } };
}),
```

---

**24. StudyTools.jsx بتولود Spinner Component محلي**
```
frontend/src/components/tools/StudyTools.jsx
```
عندك:
```jsx
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%'...
```
نفس الـ Spinner معرّف في `UI.jsx` ومستورد في كل مكان — ده code duplication.

**الإصلاح:** امسح الـ local definition واستورد من UI.jsx:
```js
import { Spinner } from '../shared/UI';
```

---

**25. مفيش Global Error Logging للـ Frontend**
لو الطالب شاف error في الموبايل مش هتعرف إيه اللي حصل. مفيش error tracking.

**المطلوب:** أضف Sentry (أو أي error tracking):
```js
// main.jsx
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% sampling عشان مش تملأ الـ quota
});
```

---

## ═══════════════════════════════════════
## سادساً: DevOps & Production Readiness
## ═══════════════════════════════════════

---

**26. Docker Compose: مفيش Health Checks**
```
devops/docker-compose.yml
```
لو الـ backend اتعطل، nginx بيفضل بيوجه traffic ليه. مفيش health check يوقف ده.

**الإضافة:**
```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s

nginx:
  depends_on:
    backend:
      condition: service_healthy
```

---

**27. مفيش Database Backup Automation**
الـ `scripts/backup.sh` موجودة بس مش متفعّلة في docker-compose ولا في CI/CD.

**المطلوب في docker-compose.prod.yml:**
```yaml
backup:
  image: postgres:16-alpine
  environment:
    PGPASSWORD: ${DB_PASSWORD}
  volumes:
    - ./backups:/backups
  command: >
    sh -c "while true; do
      pg_dump -h postgres -U ${DB_USER} ${DB_NAME} | gzip > /backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
      find /backups -name '*.sql.gz' -mtime +30 -delete
      sleep 86400
    done"
  restart: unless-stopped
```

---

**28. Nginx: مفيش Rate Limiting على الـ WebSocket**
```
devops/nginx/conf.d/najah.conf
```
Rate limiting شغال على الـ HTTP requests، لكن الـ WebSocket connections مفيش limit عليها. ممكن حد يفتح 1000 connection في نفس الوقت.

**الإضافة:**
```nginx
# في nginx.conf
limit_conn_zone $binary_remote_addr zone=ws_conn:10m;

# في الـ location بتاع /socket.io/
location /socket.io/ {
  limit_conn ws_conn 10;  # max 10 WebSocket connections per IP
  proxy_pass http://backend;
  # ... باقي الإعدادات
}
```

---

## ═══════════════════════════════════════
## سابعاً: ملف .env.example ناقص
## ═══════════════════════════════════════

**29. متغيرات ناقصة من .env.example**

بعد مراجعة كل الكود، الـ variables دي مستخدمة لكن مش موثقة في .env.example:

```env
# ─── Security (جديد) ───────────────────
PAYMOB_HMAC_SECRET=         # مطلوب لـ Webhook validation
ALLOWED_ORIGINS=            # Comma-separated: https://yourdomain.com

# ─── Performance ────────────────────────
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes default
RATE_LIMIT_MAX=100           # requests per window
DB_SSL=false                 # true in production

# ─── Monitoring ─────────────────────────  
SENTRY_DSN=                  # Backend error tracking
VITE_SENTRY_DSN=             # Frontend error tracking

# ─── Features ───────────────────────────
ENABLE_GOOGLE_AUTH=true
ENABLE_PAYMOB=true
MAX_FILE_SIZE_MB=50

# ─── Twilio (موجودة بس مش موثقة) ────────
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# ─── Daily.co (للـ live sessions) ────────
DAILY_API_KEY=
```

---

## ═══════════════════════════════════════
## ملخص الأولويات الجديدة
## ═══════════════════════════════════════

| # | المشكلة | الخطورة | الوقت المقدر |
|---|---------|---------|--------------|
| 1 | Token في Google OAuth URL | 🔴 حرج | 2 ساعات |
| 2 | SQL Parameter off-by-one في notes.js | 🔴 حرج | 30 دقيقة |
| 3 | DB Transactions مفقودة (XP, likes) | 🔴 حرج | يوم |
| 4 | Refresh Token Rotation | 🔴 حرج | 3 ساعات |
| 5 | Missing DB Indexes | 🟡 مهم | ساعة |
| 6 | Analytics بدون caching | 🟡 مهم | ساعة |
| 7 | Achievement Board post مش بيتمنح | 🟡 مهم | 30 دقيقة |
| 8 | Assignment Grading notification | 🟡 مهم | ساعة |
| 9 | Planner Conflict Detection | 🟡 مهم | ساعة |
| 10 | Notes Auto-Save | 🟡 مهم | ساعتان |
| 11 | Input Validation Middleware | 🟡 مهم | يومان |
| 12 | XP Socket Batching | 🟢 تحسين | يوم |
| 13 | Chat Messages Memory Leak | 🟢 تحسين | 30 دقيقة |
| 14 | Skeleton Loading في Dashboard | 🟢 تحسين | يوم |
| 15 | Docker Health Checks | 🟢 تحسين | ساعة |
| 16 | Cron Batch Processing | 🟢 تحسين | ساعتان |
| 17 | Nginx WebSocket Rate Limit | 🟢 تحسين | ساعة |
| 18 | Sentry Error Tracking | 🟢 تحسين | ساعتان |

---

## برومبتات جاهزة للإصلاحات الجديدة

### برومبت: الإصلاحات الحرجة الجديدة
```
عندي backend Node.js/Express مبني على PostgreSQL وRedis.
محتاج أصلح 4 مشاكل حرجة:

1. Google OAuth Token Exposure:
في googleCallback بيعمل redirect بالـ tokens في الـ URL.
المطلوب: نظام code exchange — يحفظ الـ tokens في Redis بـ code عشوائي TTL=60s، يوجه المستخدم بالـ code فقط، والـ frontend يعمل POST /api/auth/exchange-code لجيب الـ tokens.

2. SQL Parameter Bug في notes.js:
الكود بيبني SQL dynamically بـ counter i++ وفيه off-by-one في الـ OFFSET parameter.
أعيد كتابة الـ GET / handler في notes.js بطريقة آمنة وصحيحة.

3. Missing DB Transactions:
في board.js الـ like action بيعمل 3 queries منفصلة. لو واحدة فشلت الـ data بتبقى inconsistent.
حوّل كل multi-step operations (like, xp_update, achievements) لـ DB transactions.

4. Refresh Token Rotation:
الـ refreshToken() بيرجع access token جديد بس مش بيغير الـ refresh token.
المطلوب: كل مرة تعمل refresh، اعمل refresh token جديد، احفظ القديم في Redis blacklist.

اكتب الكود الكامل لكل إصلاح.
```

### برومبت: Database Indexes + Analytics Caching
```
عندي PostgreSQL database لمنصة تعليمية والـ analytics page بتعمل 5 DB queries في كل زيارة.

المطلوب:
1. اعمل migration يضيف الـ indexes دي:
   - notes(user_id)
   - files(user_id)  
   - study_sessions(user_id, status)
   - board_posts(likes_count DESC)
   - quiz_attempts(user_id, created_at DESC)
   - notifications(user_id, is_read)

2. في analytics.js أضف Redis caching:
   - cache key: analytics:{userId}:{date}
   - TTL: 300 ثانية (5 دقائق)
   - لو الطالب عمل session جديدة → invalidate الـ cache بتاعه

3. في socket.js: بدل ما تعمل XP update في كل رسالة، استخدم Redis counter وcron job كل 5 دقائق.

اكتب الكود الكامل.
```

### برومبت: Achievement System Fix
```
عندي achievement system في Node.js. بعض الـ achievements مش بتتمنح بشكل صحيح.

المشاكل في backend/src/services/achievementService.js:
1. 'board_post' event مش عنده case في checkAchievements → achievement مش بيتمنح أبداً
2. 'ai_chat' event مش بيعمل COUNT فعلي من الـ database
3. 'quiz_generated' نفس المشكلة

أضف الـ cases الناقصة:
- board_post → SELECT COUNT(*) FROM board_posts WHERE user_id=$1
- ai_chat → SELECT COUNT(*) FROM ai_conversations WHERE user_id=$1  
- quiz_generated → SELECT COUNT(*) FROM quiz_attempts WHERE user_id=$1 AND type='generated'

كمان في groups.js: لما المدرس يصحح الواجب (PATCH /:groupId/assignments/:assignmentId/grade) ابعت notification للطالب عبر pushNotification وSQL INSERT في notifications table.

اكتب الكود الكامل للإصلاحات.
```
