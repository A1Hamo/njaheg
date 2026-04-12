// src/hooks/useTextToSpeech.js
import { useState, useRef, useCallback, useEffect } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [voices,     setVoices]     = useState([]);
  const utterRef = useRef(null);

  // Load available voices
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() || []);
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text, lang = 'en') => {
    if (!window.speechSynthesis || !text?.trim()) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    utter.rate = 0.92;
    utter.pitch = 1;
    utter.volume = 1;

    // Pick best available voice for the language
    const preferred = voices.find(v =>
      lang === 'ar'
        ? v.lang.startsWith('ar')
        : (v.lang.startsWith('en') && v.name.includes('Google'))
    ) || voices.find(v =>
      lang === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en')
    );
    if (preferred) utter.voice = preferred;

    utter.onstart  = () => { setIsSpeaking(true);  setIsPaused(false); };
    utter.onend    = () => { setIsSpeaking(false); setIsPaused(false); };
    utter.onerror  = () => { setIsSpeaking(false); setIsPaused(false); };
    utter.onpause  = () => setIsPaused(true);
    utter.onresume = () => setIsPaused(false);

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [voices]);

  const pause  = useCallback(() => { window.speechSynthesis?.pause();  setIsPaused(true);  }, []);
  const resume = useCallback(() => { window.speechSynthesis?.resume(); setIsPaused(false); }, []);
  const stop   = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); setIsPaused(false); }, []);

  const toggle = useCallback((text, lang) => {
    if (isSpeaking && !isPaused) pause();
    else if (isPaused) resume();
    else speak(text, lang);
  }, [isSpeaking, isPaused, pause, resume, speak]);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { isSpeaking, isPaused, isSupported, voices, speak, pause, resume, stop, toggle };
}
