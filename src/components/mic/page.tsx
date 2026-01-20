"use client";

import { useState } from "react";
import { Mic } from "lucide-react";

export default function MicButton() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <button
      onClick={() => setIsRecording((v) => !v)}
      className={`relative inline-flex items-center justify-center
                  h-14 w-14 rounded-full text-white shadow-lg
                  transition-colors
                  ${
                    isRecording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"
                  }`}
    >
      {/* Ripple (гадааш урсах тойрог) */}
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping delay-150" />
        </>
      )}

      {/* Icon */}
      <Mic className="relative z-10 h-6 w-6" />
    </button>
  );
}
