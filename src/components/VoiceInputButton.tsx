"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Web Speech API 类型声明
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = typeof window !== "undefined"
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) setSupported(false);
  }, []);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onTranscript(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      disabled={disabled}
      className="w-7 h-7 rounded-full border flex items-center justify-center transition-colors"
      style={{
        borderColor: listening ? "var(--color-secondary)" : "var(--color-border)",
        backgroundColor: listening ? "rgba(211,110,82,0.1)" : "white",
      }}
      title={listening ? "点击停止录音" : "语音输入"}
    >
      {listening
        ? <MicOff className="w-3.5 h-3.5" style={{ color: "var(--color-secondary)" }} />
        : <Mic className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
      }
    </motion.button>
  );
}
