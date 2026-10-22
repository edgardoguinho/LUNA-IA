import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (text: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  const prompts = [
    { label: 'Como você está? 🌸', text: 'Oi Luna! Como você está se sentindo hoje?' },
    { label: 'Criar uma imagem 🎨', text: 'Luna, crie uma imagem de um entardecer calmo à beira-mar com iluminação suave e ondas tranquilas.' },
    { label: 'Pesquisar notícias 📰', text: 'Luna, pesquise as principais notícias de tecnologia e ciência de hoje.' },
    { label: 'Ideia criativa ✨', text: 'Luna, me dê uma ideia inspiradora e prática para um novo projeto digital.' },
    { label: 'Um conselho sábio 💡', text: 'Luna, me dá um conselho para manter o foco e a produtividade hoje?' },
    { label: 'Curiosidade do dia 🌙', text: 'Luna, me conte uma curiosidade fascinante sobre o universo ou a mente humana.' },
  ];

  return (
    <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2 px-3 sm:px-4">
      {prompts.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onSelectPrompt(p.text)}
          disabled={disabled}
          className="shrink-0 px-3 py-1.5 rounded-full bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/70 hover:border-neutral-600 text-neutral-300 hover:text-white text-xs font-medium transition cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shadow-2xs"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
