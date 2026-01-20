"use client";

import React from "react";

interface FooterProps {
  backendConnected: boolean;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  backendConnected,
  className = "",
}) => {
  return (
    <footer
      className={`mt-auto bg-black/10 min-h-16 backdrop-blur-xl border-t border-white/10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 space-y-2 sm:space-y-0">
          {/* Left side - App info */}
          {/* <div className="flex items-center space-x-4">
            <div className="hidden sm:block w-px h-3 bg-gray-600"></div>

            <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-sm shadow-blue-400/50"></div>
              <span className="text-blue-300 font-medium">
                🎵 Audio Playback Enabled
              </span>
            </div>
          </div> */}

          {/* Right side - Backend status */}
          {/* <div className="flex items-center space-x-3">
            <span className="text-gray-500">
              Backend:
              <span
                className={`ml-1 font-medium ${
                  backendConnected ? "text-green-400" : "text-amber-400"
                }`}
              >
                {backendConnected ? "Connected" : "Development Mode"}
              </span>
            </span>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
