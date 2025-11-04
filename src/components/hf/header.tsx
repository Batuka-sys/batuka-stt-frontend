"use client";

import React from "react";
import { Wifi, WifiOff, Settings } from "lucide-react";

interface HeaderProps {
  backendConnected: boolean;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  return (
    <header className="bg-black/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 h-16 ">
      <div className="w-full flex justify-between items-center h-16 sm:px-4">
        {/* Logo and title section */}
        <div className=" flex  items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <div className="w-3 h-3 bg-white rounded-sm opacity-90"></div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Speech-to-Text
            </h1>
          </div>
        </div>

        {/* Status and settings section */}
        <div className="flex items-center space-x-3">
          {/* Connection status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            {backendConnected ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/60"></div>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300 font-medium">
                  Connected
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full shadow-sm shadow-red-400/60"></div>
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-300 font-medium">
                  Offline
                </span>
              </>
            )}
          </div>

          {/* Settings icon */}
          <div className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10">
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
