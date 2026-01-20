"use client";
import Mic from "@/components/mic/page";

export default function Page() {
  return (
    <div className="text-center text-white">
      <h2 className="text-4xl font-bold mb-4">Welcome to My STT App</h2>
      <p>All Tailwind styles and stars animation should work now!</p>
      <div>
        <Mic />
      </div>
    </div>
  );
}
