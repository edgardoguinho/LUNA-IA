import React from 'react';
import { Heart } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full justify-start my-2 px-2 animate-fadeIn">
      <div className="flex items-end gap-2 max-w-[80%]">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[1.5px] shrink-0 mb-1 shadow-md shadow-pink-500/20">
          <div className="w-full h-full bg-[#150a26] rounded-[10px] flex items-center justify-center text-xs">
            🌙
          </div>
        </div>

        {/* Bubble */}
        <div className="rounded-2xl rounded-bl-xs px-4 py-2.5 bg-[#180c2a]/90 border border-pink-500/30 text-purple-200 shadow-lg backdrop-blur-sm flex items-center gap-2.5">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400/40 animate-pulse" />
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce" />
          </div>
          <span className="text-xs text-purple-300/80 italic ml-1">Luna está digitando...</span>
        </div>
      </div>
    </div>
  );
};
