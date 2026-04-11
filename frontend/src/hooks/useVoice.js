import { useState, useRef, useCallback } from 'react';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const timerInterval = useRef(null);
  const chunks = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerInterval.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      return true;
    } catch (err) {
      console.error('Mic access denied:', err);
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        
        // Stop all tracks to release mic
        mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
        
        setIsRecording(false);
        clearInterval(timerInterval.current);
        resolve(file);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    clearInterval(timerInterval.current);
    chunks.current = [];
  }, []);

  return { isRecording, recordingTime, startRecording, stopRecording, cancelRecording };
}
