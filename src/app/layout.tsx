import React from "react";
import Header from "@/components/hf/header";
import Footer from "@/components/hf/footer";
import StarsBackground from "@/components/background/page";
import "./globals.css";

export const metadata = {
  title: "My Speech-to-Text App",
  description: "Real-time speech transcription",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const backendConnected = true;

  return (
    <html lang="en">
      <body>
        <Header backendConnected={backendConnected} />
        <StarsBackground numParticles={150}>
          <main className="flex-1 h-full w-full sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer backendConnected={backendConnected} />
        </StarsBackground>
      </body>
    </html>
  );
}
