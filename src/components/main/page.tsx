"use client";

import { useState, useRef } from "react";
import MicButton from "../mic/page";
import { Chat, type ChatHandle } from "../chat_tab/page";

export function Main() {
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const chatRef = useRef<ChatHandle>(null);

  const handleMicFirstClick = () => {
    setShowChat(true);
    setTimeout(() => {
      chatRef.current?.toggleRecord();
    }, 600);
  };

  const handleToggleRecording = () => {
    chatRef.current?.toggleRecord();
  };

  return (
    <div className="w-full h-full relative">
      <main className="min-h-screen flex items-center justify-center relative z-20">
        <MicButton
          onMovedToLeft={handleMicFirstClick}
          onToggleRecording={handleToggleRecording}
          isRecording={isRecording}
          level={level}
        />
      </main>

      {/* Chat slides in from the right */}
      <div
        className={`
          fixed top-0 right-0 h-full z-30
          transition-transform duration-500 ease-in-out
          ${showChat ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <Chat
          ref={chatRef}
          onRecordingChange={setIsRecording}
          onLevelChange={setLevel}
        />
      </div>
    </div>
  );
}
