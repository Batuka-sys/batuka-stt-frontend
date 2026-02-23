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
      className={`mt-auto bg-black/10 min-h-16 backdrop-blur-xl border-t border-white/10 relative z-10 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 space-y-2 sm:space-y-0"></div>
      </div>
    </footer>
  );
};

export default Footer;
