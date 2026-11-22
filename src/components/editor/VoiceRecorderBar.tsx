import React, { useEffect, useRef, useState } from 'react';
import { Square, X, Mic } from 'lucide-react';

interface VoiceRecorderBarProps {
  onSave: (audioDataUrl: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({ onSave, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Microphone recording is not supported in this browser.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              onSave(reader.result, Math.max(1, secondsRef.current));
            }
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        setRecording(true);
        timerRef.current = window.setInterval(() => {
          secondsRef.current += 1;
          setSeconds(secondsRef.current);
        }, 1000);
      } catch {
        setError('Microphone access was denied. Enable mic permissions to record.');
      }
    }

    start();

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStopAndSave = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAbort = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="mb-3 p-3.5 rounded-2xl bg-[#161D24] text-[#F1F5F9] border border-[#26313E] flex items-center justify-between gap-3 shadow-lg">
      {error ? (
        <>
          <p className="text-xs font-medium text-red-300 flex-1">{error}</p>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-[#1D2630] hover:bg-[#26313E] cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-[#94A3B8]">
                {recording ? 'Recording voice memo...' : 'Starting microphone...'}
              </p>
              <p className="font-mono text-sm font-bold tabular-nums">
                {mins}:{secs}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAbort}
              className="px-3 py-2 rounded-xl bg-[#1D2630] text-xs font-semibold hover:bg-[#26313E] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!recording}
              onClick={handleStopAndSave}
              className="px-3.5 py-2 rounded-xl bg-[#6EE7B7] text-[#0B1410] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Save
            </button>
          </div>
        </>
      )}
    </div>
  );
};
