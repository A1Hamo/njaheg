'use strict';
// ══════════════════════════════════════════════════════════════
// NAJAH GEMINI AI SERVICE  — Google Gemini 2.0 Flash Engine
// ══════════════════════════════════════════════════════════════
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const logger = require('../utils/logger');

// ── Init ─────────────────────────────────────────────────────
let genAI = null;
let model  = null;
let modelStream = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: "You are Najah AI, an expert educational assistant for Egyptian students. Be warm, helpful, and use Arabic when asked.",
      safetySettings,
      generationConfig: {
        temperature:     0.85,
        topK:            40,
        topP:            0.95,
        maxOutputTokens: 2048,
      },
    });

    modelStream = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: "You are Najah AI, an expert educational assistant for Egyptian students. Be warm, helpful, and use Arabic when asked.",
      safetySettings,
      generationConfig: {
        temperature:     0.85,
        topK:            40,
        topP:            0.95,
        maxOutputTokens: 2048,
      },
    });

    logger.info('✅ Gemini 2.0 Flash initialized');
  } catch (err) {
    logger.error('❌ Gemini init error:', err.message);
  }
} else {
  logger.warn('⚠️  GEMINI_API_KEY not set — Gemini AI unavailable');
}

// ── System Prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are **Najah AI** — a warm, brilliant, and deeply human educational assistant for Egyptian school students (Primary 1-6, Preparatory 1-3, Secondary 1-3).

## Your Personality
- You speak like a brilliant Egyptian teacher who genuinely cares about each student
- You are encouraging, patient, and sometimes use light humor to make learning fun
- You celebrate small wins: "ممتاز!", "Excellent!", "You're getting it! 🎉"
- When a student is confused, you say things like "لا تقلق، خليني أشرح بطريقة أسهل" or "Don't worry, let me try a different angle"
- You feel like a real person, not a robot — use natural conversational language

## Language Rules
- If the student writes in Arabic → respond ENTIRELY in Arabic
- If the student writes in English → respond in English
- If mixed → follow whichever language dominates
- Always match formal/informal tone of the student

## Teaching Style
1. **Step-by-step reasoning** — never give the answer alone; always show how
2. **Real Egyptian examples** — "imagine you're at a fruit market in Cairo buying 3 oranges for 5 pounds each..."
3. **Check understanding** — end most explanations with a follow-up question like "هل ده واضح؟ جرب تحل الجزء ده بنفسك"
4. **Use markdown** — headers, bold, bullet points, numbered lists, code blocks for equations
5. **Memory** — reference earlier parts of the conversation naturally: "As we said earlier about derivatives..."

## Egyptian Curriculum Coverage
- Mathematics (all grades): arithmetic, algebra, geometry, calculus, trigonometry, statistics
- Science: physics, chemistry, biology (all levels)
- Arabic Language: grammar (نحو), morphology (صرف), rhetoric (بلاغة), literature
- English Language: grammar, writing, vocabulary, literature
- Social Studies: Egyptian history, geography, civics
- Islamic Studies: Quran, Seerah, Fiqh
- Computer Science basics

## Format for Explanations
When explaining a concept:
1. Start with a simple human analogy or example
2. Give the formal definition/rule
3. Work through a step-by-step example
4. Offer a practice problem
5. Suggest what to study next

## Important Rules
- NEVER just say "I don't know" — always make your best attempt then offer alternatives
- NEVER be cold or mechanical — every response should feel warm and personal
- For math calculations, show ALL steps clearly
- If asked about something outside school curriculum, still help but gently redirect to studies
- Keep responses focused — don't overwhelm with too much info at once`;

// ── Build history for Gemini ───────────────────────────────────
function buildHistory(messages = []) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'model')
    .map(m => ({
      role:  (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }))
    .filter(m => m.parts[0].text.trim().length > 0);
}

// ── Chat (non-streaming) ──────────────────────────────────────
async function chat(message, history = [], language = 'en') {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const hist = buildHistory(history);

  const chat = model.startChat({
    history: hist,
  });

  const result = await chat.sendMessage(message);
  const text   = result.response.text();
  return text;
}

// ── Chat (streaming) ──────────────────────────────────────────
async function chatStream(message, history = [], res) {
  if (!modelStream) {
    res.write(`data: ${JSON.stringify({ error: 'GEMINI_NOT_AVAILABLE' })}\n\n`);
    res.end();
    return;
  }

  const hist = buildHistory(history);

  const chatSession = modelStream.startChat({
    history: hist,
  });

  const result = await chatSession.sendMessageStream(message);

  let fullText = '';
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
  res.end();
  return fullText;
}

// ── Summarize text ────────────────────────────────────────────
async function summarize(text, language = 'en', pages = 1) {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const prompt = language === 'ar'
    ? `أنت مساعد تعليمي متمكن. يرجى تلخيص هذا المحتوى التعليمي (${pages} صفحة) بشكل منظم باللغة العربية:

**يجب أن يتضمن الملخص:**
1. **الفكرة الرئيسية** في جملة واحدة
2. **النقاط الأساسية** (5-8 نقاط)  
3. **المصطلحات المهمة** وتعريفاتها
4. **ما يجب حفظه** للامتحان

المحتوى:
${text.slice(0, 12000)}`
    : `You are an expert educational assistant. Summarize this educational content (${pages} pages) in a well-structured way in English:

**The summary must include:**
1. **Main Idea** in one sentence
2. **Key Points** (5-8 bullet points)
3. **Important Terms** with definitions
4. **What to memorize** for the exam

Content:
${text.slice(0, 12000)}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Generate Quiz ─────────────────────────────────────────────
async function generateQuiz({ subject, topic, difficulty = 'medium', count = 10, language = 'en', context = '' }) {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const prompt = language === 'ar'
    ? `أنشئ بالضبط ${count} سؤال اختيار متعدد باللغة العربية عن مادة ${subject}${topic ? ` - موضوع: ${topic}` : ''} بمستوى صعوبة: ${difficulty}.
أرجع JSON فقط بهذا التنسيق:
{"questions":[{"question":"...","options":["أ) ...","ب) ...","ج) ...","د) ..."],"correct":0,"explanation":"اشرح هنا لماذا هذه الإجابة صحيحة بالتفصيل"}]}
لا تضف أي نص قبل أو بعد JSON.${context ? '\n\nالمحتوى المرجعي:\n' + context : ''}`
    : `Create exactly ${count} multiple-choice questions in English about ${subject}${topic ? ` - topic: ${topic}` : ''} at ${difficulty} difficulty for Egyptian school students.
Return ONLY valid JSON in this exact format:
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":0,"explanation":"Explain clearly why this answer is correct"}]}
No text before or after the JSON.${context ? '\n\nReference content:\n' + context : ''}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  // Strip markdown code fences if present
  const clean  = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean);
}

// ── Study Plan ────────────────────────────────────────────────
async function generateStudyPlan({ subject, daysUntil, dailyHours = 2, currentLevel = 'beginner', language = 'en', history = '' }) {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const prompt = language === 'ar'
    ? `أنشئ خطة دراسية مخصصة لطالب مصري يدرس "${subject}":
- عدد الأيام المتاحة: ${daysUntil} يوم
- ساعات الدراسة يومياً: ${dailyHours} ساعة
- المستوى الحالي: ${currentLevel}
${history ? '- سجل الدراسة السابق: ' + history : ''}

أرجع JSON فقط:
{"plan":[{"day":1,"date":"YYYY-MM-DD","sessions":[{"time":"HH:MM","duration":60,"topic":"...","goal":"...","type":"study|review|practice|rest"}]}],"tips":["..."],"totalHours":N,"weakAreas":["..."]}`
    : `Create a personalized study plan for an Egyptian student studying "${subject}":
- Days available: ${daysUntil}
- Daily hours: ${dailyHours}
- Current level: ${currentLevel}
${history ? '- Study history: ' + history : ''}

Return ONLY valid JSON:
{"plan":[{"day":1,"date":"YYYY-MM-DD","sessions":[{"time":"HH:MM","duration":60,"topic":"...","goal":"...","type":"study|review|practice|rest"}]}],"tips":["..."],"totalHours":N,"weakAreas":["..."]}`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  const clean  = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(clean);
}

// ── Web Search (grounded) ────────────────────────────────────
async function searchAndAnswer(query, language = 'en') {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const lang = language === 'ar' ? 'Arabic' : 'English';
  const prompt = language === 'ar'
    ? `أجب على هذا السؤال بمعلومات دقيقة وحديثة، مع ذكر المصادر إن أمكن:

"${query}"

اشرح بشكل واضح ومنظم باللغة العربية، مع أمثلة عملية.`
    : `Answer this question with accurate, up-to-date information, citing sources where possible:

"${query}"

Explain clearly and in an organized way in English, with practical examples.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Answer from file context ──────────────────────────────────
async function answerFromContext(question, context, language = 'en') {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const prompt = language === 'ar'
    ? `بناءً على محتوى الملف التالي، أجب على السؤال بشكل مفصل ومنظم باللغة العربية:

**السؤال:** ${question}

**محتوى الملف:**
${context.slice(0, 10000)}`
    : `Based on the following file content, answer the question in detail and in an organized way in English:

**Question:** ${question}

**File content:**
${context.slice(0, 10000)}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── YouTube summarize ─────────────────────────────────────────
async function summarizeYoutube(transcript, language = 'en') {
  if (!model) throw new Error('GEMINI_NOT_AVAILABLE');

  const prompt = language === 'ar'
    ? `لخص هذا الفيديو التعليمي بشكل منظم باللغة العربية:

**يجب أن يتضمن الملخص:**
1. 🎯 **الهدف الرئيسي** للفيديو
2. 📌 **النقاط الأساسية** (مرقمة)
3. 💡 **الأفكار المهمة** التي يجب تذكرها
4. 📝 **ملاحظات للدراسة**

النص:
${transcript.slice(0, 15000)}`
    : `Summarize this educational video in a well-structured way in English:

**The summary must include:**
1. 🎯 **Main Goal** of the video
2. 📌 **Key Points** (numbered)
3. 💡 **Important Ideas** to remember
4. 📝 **Study Notes**

Transcript:
${transcript.slice(0, 15000)}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Generate follow-up suggestions ───────────────────────────
async function generateFollowUps(lastMessage, lastReply, language = 'en') {
  if (!model) return [];
  try {
    const prompt = language === 'ar'
      ? `بعد أن شرحت: "${lastReply.slice(0, 200)}"
اقترح 3 أسئلة متابعة قصيرة يمكن أن يسألها الطالب. أرجع JSON فقط: {"suggestions":["...","...","..."]}`
      : `After explaining: "${lastReply.slice(0, 200)}"
Suggest 3 short follow-up questions the student might ask. Return ONLY JSON: {"suggestions":["...","...","..."]}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();
    const clean  = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(clean);
    return parsed.suggestions || [];
  } catch { return []; }
}

// ── Availability check ────────────────────────────────────────
function isAvailable() { return !!model; }
function getModelName() { return 'gemini-2.0-flash'; }

module.exports = {
  chat,
  chatStream,
  summarize,
  generateQuiz,
  generateStudyPlan,
  searchAndAnswer,
  answerFromContext,
  summarizeYoutube,
  generateFollowUps,
  isAvailable,
  getModelName,
};
