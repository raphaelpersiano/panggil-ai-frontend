"use client";

import { Bot, Construction } from "lucide-react";

export default function AgentPage() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[calc(100vh-0px)]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-5">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Agent</h1>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Construction className="w-4 h-4" />
          <span>Segera Hadir</span>
        </div>
        <p className="text-gray-400 text-sm mt-2">Halaman ini sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
