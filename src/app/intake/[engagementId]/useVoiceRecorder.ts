"use client";

import { useEffect, useRef, useState } from "react";

// Chrome records WebM, Safari MP4, Firefox Ogg — all transcribe fine via
// Gemini, so the recording is uploaded as-is with a matching extension.
const MIME_TO_EXT: [string, string][] = [
  ["audio/webm", "webm"],
  ["audio/mp4", "m4a"],
  ["audio/ogg", "ogg"],
];

// Low bitrate is plenty for speech and keeps 5 minutes well under the 4 MB upload cap.
const BITS_PER_SECOND = 32_000;
export const MAX_RECORDING_SECONDS = 5 * 60;

const LEVEL_SAMPLE_MS = 60;
export const LIVE_BARS = 48;
const PEAK_BARS = 40;

export interface Recording {
  durationSec: number;
  /** PEAK_BARS loudness values in 0–1, for drawing the voice note's waveform. */
  peaks: number[];
}

function downsample(levels: number[], bars: number): number[] {
  if (levels.length === 0) return Array(bars).fill(0);
  return Array.from({ length: bars }, (_, i) => {
    const from = Math.floor((i * levels.length) / bars);
    const to = Math.max(from + 1, Math.floor(((i + 1) * levels.length) / bars));
    return Math.max(...levels.slice(from, to));
  });
}

export function useVoiceRecorder(
  onRecorded: (file: File, recording: Recording) => void,
  onError: (message: string) => void
) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  // Most recent loudness samples (0–1), oldest first, for the live waveform.
  const [levels, setLevels] = useState<number[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const discardRef = useRef(false);
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => {
    if (seconds >= MAX_RECORDING_SECONDS) stop();
  }, [seconds]);

  // Release the microphone if the component unmounts mid-recording, without uploading.
  useEffect(
    () => () => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      recorder.onstop = null;
      recorder.stream.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close();
    },
    []
  );

  async function start() {
    const mimeType =
      typeof MediaRecorder === "undefined"
        ? undefined
        : MIME_TO_EXT.map(([m]) => m).find((m) => MediaRecorder.isTypeSupported(m));
    if (!navigator.mediaDevices?.getUserMedia || !mimeType) {
      onError("Voice recording isn't supported in this browser. You can upload an audio file instead.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError("We couldn't access your microphone. Check your browser's permission settings.");
      return;
    }

    // Loudness metering for the waveform, separate from the recording itself.
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = audioCtx;
    const buf = new Uint8Array(analyser.fftSize);
    const allLevels: number[] = [];
    const meter = setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += ((buf[i] - 128) / 128) ** 2;
      // Speech RMS rarely exceeds ~0.25, so scale it up to fill the bar height.
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
      allLevels.push(level);
      setLevels((prev) => [...prev.slice(-(LIVE_BARS - 1)), level]);
    }, LEVEL_SAMPLE_MS);

    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: BITS_PER_SECOND });
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      clearInterval(meter);
      void audioCtx.close();
      stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      audioCtxRef.current = null;
      setRecording(false);
      setLevels([]);
      if (discardRef.current) return;
      const ext = MIME_TO_EXT.find(([m]) => mimeType === m)![1];
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) return;
      onRecordedRef.current(new File([blob], `voice-note.${ext}`, { type: mimeType }), {
        durationSec: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        peaks: downsample(allLevels, PEAK_BARS),
      });
    };

    discardRef.current = false;
    recorderRef.current = recorder;
    recorder.start();
    setSeconds(0);
    setLevels([]);
    setRecording(true);
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  /** Stops recording and throws the audio away. */
  function cancel() {
    discardRef.current = true;
    stop();
  }

  return { recording, seconds, levels, start, stop, cancel };
}

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
