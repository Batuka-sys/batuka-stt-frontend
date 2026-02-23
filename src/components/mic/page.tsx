"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

interface MicButtonProps {
  onMovedToLeft?: () => void;
  onToggleRecording?: () => void;
  isRecording?: boolean;
  level?: number;
}

export default function MicButton({
  onMovedToLeft,
  onToggleRecording,
  isRecording = false,
  level = 0,
}: MicButtonProps) {
  const [hasMovedToLeft, setHasMovedToLeft] = useState(false);

  const handleClick = () => {
    if (!hasMovedToLeft) {
      setHasMovedToLeft(true);
      onMovedToLeft?.();
      return;
    }
    onToggleRecording?.();
  };

  return (
    <div
      className={`
        fixed top-1/2 -translate-y-1/2 z-30
        transition-transform duration-500 ease-in-out
        ${hasMovedToLeft ? "translate-x-[-550px]" : "translate-x-0"}
      `}
    >
      <button
        onClick={handleClick}
        style={{
          transform: isRecording ? `scale(${1 + level * 2})` : undefined,
        }}
        className={`
          relative inline-flex items-center justify-center
          w-24 h-24 rounded-full
          transition-transform duration-75
          ${!isRecording ? "hover:scale-105" : ""}
          ${
            isRecording
              ? "bg-gradient-to-br from-purple-500/25 to-pink-500/35"
              : "bg-gradient-to-br from-violet-500/15 to-purple-600/25 hover:from-violet-600/15 hover:to-purple-700/15"
          }
        `}
      >
        {isRecording && (
          <>
            <div
              className="absolute -inset-2 rounded-full border-2 border-slate-400 animate-ping pointer-events-none"
              style={{ opacity: Math.max(0.25, level * 3) }}
            />
            <div
              className="absolute -inset-1 rounded-full border border-slate-300 pointer-events-none"
              style={{
                transform: `scale(${1 + level * 0.5})`,
                opacity: Math.max(0.15, level * 2),
              }}
            />
          </>
        )}

        <Mic className="relative h-10 w-10 text-white" />
      </button>
    </div>
  );
}
