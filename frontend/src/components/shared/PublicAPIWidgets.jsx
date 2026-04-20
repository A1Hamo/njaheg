// src/components/shared/PublicAPIWidgets.jsx
// Uses FREE public APIs — no API keys required:
//   • Open-Meteo (weather): https://open-meteo.com — free, no key, CORS-enabled
//   • Quotable.io (quotes): https://api.quotable.io — free, no key
//   • Free Dictionary API: https://api.dictionaryapi.dev — free, no key
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Weather condition code → emoji ─────────────────────── */
const weatherIcon = (code) => {
  if (code === 0)        return '☀️';
  if (code <= 2)         return '⛅';
  if (code === 3)        return '☁️';
  if (code <= 49)        return '🌫️';
  if (code <= 69)        return '🌧️';
  if (code <= 79)        return '❄️';
  if (code <= 99)        return '⛈️';
  return '🌤️';
};
const weatherDesc = (code) => {
  if (code === 0)       return 'Clear Sky';
  if (code <= 2)        return 'Partly Cloudy';
  if (code === 3)       return 'Overcast';
  if (code <= 49)       return 'Foggy';
  if (code <= 69)       return 'Rainy';
  if (code <= 79)       return 'Snowy';
  if (code <= 99)       return 'Thunderstorm';
  return 'Cloudy';
};

/* ══════════════════════════════════════════════════════════
   WeatherWidget — uses Open-Meteo (completely free, no key)
   Location: Cairo, Egypt (lat=30.06, lon=31.25)
   ══════════════════════════════════════════════════════════ */
export function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    // Cairo, Egypt coordinates
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.06&longitude=31.25&current_weather=true&hourly=temperature_2m,relative_humidity_2m&timezone=Africa%2FCairo&forecast_days=1';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        const cw = d.current_weather;
        setWeather({
          temp:  Math.round(cw.temperature),
          code:  cw.weathercode,
          wind:  Math.round(cw.windspeed),
          // Get current hour humidity from hourly data
          humidity: d.hourly?.relative_humidity_2m?.[new Date().getHours()] ?? '--',
        });
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 16,
        backdropFilter: 'blur(12px)',
        cursor: 'default',
      }}
    >
      <div style={{ fontSize: 42, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' }}>
        {loading ? '⏳' : weatherIcon(weather?.code)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Cairo, Egypt
        </div>
        {loading ? (
          <div style={{ height: 32, width: 100, borderRadius: 8, background: 'var(--surface3)', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {weather.temp}°C
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, fontWeight: 600 }}>
              {weatherDesc(weather.code)} · 💨 {weather.wind} km/h · 💧 {weather.humidity}%
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   DailyQuoteWidget — uses Quotable.io (free, no key)
   ══════════════════════════════════════════════════════════ */
export function DailyQuoteWidget() {
  const [quote,   setQuote]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [idx,     setIdx]     = useState(0);

  const fetchQuote = () => {
    setLoading(true);
    // Tag: education/motivational — free CORS-enabled API
    fetch('https://api.quotable.io/quotes/random?tags=education|motivational|wisdom&limit=1')
      .then(r => r.json())
      .then(d => {
        if (d?.length > 0) setQuote(d[0]);
        setLoading(false);
      })
      .catch(() => {
        // Fallback quotes if API is down
        const fallbacks = [
          { content: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
          { content: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
          { content: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
        ];
        setQuote(fallbacks[idx % fallbacks.length]);
        setLoading(false);
      });
  };

  useEffect(() => { fetchQuote(); }, [idx]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.05))',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: 20, padding: '20px 22px',
        backdropFilter: 'blur(12px)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Decorative quote mark */}
      <div style={{
        position: 'absolute', top: 10, right: 18,
        fontSize: 72, color: 'rgba(245,158,11,0.08)',
        fontFamily: 'Georgia, serif', lineHeight: 1, userSelect: 'none',
        fontWeight: 900,
      }}>"</div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        ✨ Daily Motivation
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[1,2].map(i => (
              <div key={i} style={{ height: 14, borderRadius: 6, background: 'var(--surface3)', marginBottom: 8, width: i === 1 ? '90%' : '65%', animation: 'pulse 1.5s infinite' }} />
            ))}
          </motion.div>
        ) : (
          <motion.div key={quote?.content} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 12, fontWeight: 500 }}>
              "{quote?.content}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>
                — {quote?.author}
              </div>
              <button
                onClick={() => setIdx(p => p + 1)}
                style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                  color: 'var(--warning)', cursor: 'pointer',
                }}
              >
                New Quote ↻
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   WordOfTheDay — uses Free Dictionary API (no key)
   ══════════════════════════════════════════════════════════ */
const STUDY_WORDS = [
  'perseverance','diligence','curriculum','pedagogy','cognition',
  'synthesis','analysis','hypothesis','inference','metacognition',
  'epistemology','mnemonic','taxonomy','heuristic','didactic',
];

export function WordOfDayWidget() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [wordIdx, setWordIdx] = useState(() => new Date().getDate() % STUDY_WORDS.length);

  const word = STUDY_WORDS[wordIdx];

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d[0]) {
          const entry = d[0];
          const meaning = entry.meanings?.[0];
          setData({
            word: entry.word,
            phonetic: entry.phonetic || '',
            partOfSpeech: meaning?.partOfSpeech || '',
            definition: meaning?.definitions?.[0]?.definition || '',
            example:    meaning?.definitions?.[0]?.example || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [word]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 20, padding: '20px 22px',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        📖 Word of the Day
      </div>

      {loading ? (
        <div style={{ height: 60, borderRadius: 8, background: 'var(--surface3)', animation: 'pulse 1.5s infinite' }} />
      ) : data ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {data.word}
            </div>
            {data.phonetic && (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{data.phonetic}</div>
            )}
            {data.partOfSpeech && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {data.partOfSpeech}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: data.example ? 8 : 0 }}>
            {data.definition}
          </p>
          {data.example && (
            <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.55 }}>
              e.g. "{data.example}"
            </p>
          )}
          <button
            onClick={() => setWordIdx(p => (p + 1) % STUDY_WORDS.length)}
            style={{
              marginTop: 12, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              color: 'var(--success)', cursor: 'pointer',
            }}
          >
            Next Word ↻
          </button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Could not load word definition.</div>
      )}
    </motion.div>
  );
}
