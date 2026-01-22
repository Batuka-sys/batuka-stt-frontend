"use client";

import { useState } from "react";
import { div } from "motion/react-client";
import MicButton from "../mic/page";
import { Chat } from "../chat_tab/page";

export function Main() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="w-full h-full relative">
      <main className="min-h-screen flex items-center justify-center ">
        <MicButton onMovedToLeft={() => setShowChat(true)} />
      </main>

      {/* Chat slides in from the right */}
      <div
        className={`
          fixed top-0 right-0 h-full
          transition-transform duration-500 ease-in-out
          ${showChat ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <Chat />
      </div>
    </div>
  );
}
