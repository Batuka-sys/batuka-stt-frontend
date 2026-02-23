"use client";

import React, { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, Settings } from "lucide-react";

interface HeaderProps {
  backendConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      if (current > lastScrollY.current && current > 80) {
        setShow(false); // доош → hide
      } else {
        setShow(true); // дээш → show
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        bg-black/10 backdrop-blur-xl border-b border-white/20
          h-16 w-full
        transition-transform duration-300 ease-in-out
        ${show ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      <div className="w-full flex justify-between items-center h-16 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <div className="w-3 h-3 bg-white rounded-sm opacity-90" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Personal AI Assistant
          </h1>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            {backendConnected ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300 font-medium">
                  Connected
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-300 font-medium">
                  Offline
                </span>
              </>
            )}
          </div>

          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
