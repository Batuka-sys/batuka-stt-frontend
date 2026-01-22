"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

interface MicButtonProps {
  onMovedToLeft?: () => void;
}

export default function MicButton({ onMovedToLeft }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [hasMovedToLeft, setHasMovedToLeft] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    analyserRef.current = analyser;
    dataRef.current = dataArray;

    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);

      // RMS (volume)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      setLevel(rms); // 0 → ~0.3

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
  };

  const stopRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLevel(0);
  };

  const handleClick = async () => {
    // 1️⃣ Анхны даралт → зүүн тийш шилжинэ + эхлүүлнэ
    if (!hasMovedToLeft) {
      setHasMovedToLeft(true);
      onMovedToLeft?.();

      await startRecording();
      setIsRecording(true);

      // slide дууссаны дараа pulse эхлүүлэх
      setTimeout(() => {
        setShouldPulse(true);
      }, 500);

      return;
    }

    // 2️⃣ ба түүнээс хойшхи даралтууд → pulse toggle
    if (shouldPulse) {
      // унтраах
      setShouldPulse(false);
      stopRecording();
      setIsRecording(false);
    } else {
      // дахин асаах
      await startRecording();
      setIsRecording(true);
      setShouldPulse(true);
    }
  };

  // scale: яриа чанга → том, сул → жижиг
  const scale = 1 + level * 10;

  return (
    // Wrapper — БАЙРЛАЛ (удаан хөдөлнө)
    <div
      className={`
        fixed top-1/2 -translate-y-1/2
        transition-transform duration-500 ease-in-out
        ${hasMovedToLeft ? "translate-x-[-500px]" : "translate-x-0"}
      `}
    >
      {/* Button — PULSE + SCALE */}
      <button
        onClick={handleClick}
        style={{ transform: `scale(${scale})` }}
        className={`
          relative inline-flex items-center justify-center
          w-24 h-24 rounded-full
          transition-transform duration-75
          ${shouldPulse ? "animate-pulse" : ""}
          ${
            isRecording
              ? "bg-blue-400/45"
              : "bg-blue-500/25 hover:bg-blue-600/25"
          }
        `}
      >
        <Mic
          className={`h-10 w-10 ${
            isRecording ? "text-white-700" : "text-white"
          }`}
        />
      </button>
    </div>
  );
}
