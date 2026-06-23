import React from 'react';

interface SculptorProps {
  onMoodSelect: (mood: string) => void;
  activeMood: string;
}

export const PromptSculptor: React.FC<SculptorProps> = ({ onMoodSelect, activeMood }) => {
  const moods = [
    { label: 'Minimalist', color: 'bg-stone-100' },
    { label: 'Opulent', color: 'bg-amber-600' },
    { label: 'Cinematic', color: 'bg-emerald-950' },
    { label: 'Ethereal', color: 'bg-sky-100' }
  ];

  return (
    <div className="flex gap-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-lux-in">
      {moods.map((m) => (
        <button
          key={m.label}
          onClick={() => onMoodSelect(m.label)}
          className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl transition-all ${activeMood === m.label ? 'ring-2 ring-gold' : 'hover:bg-gray-50'}`}
        >
          <div className={`w-12 h-12 rounded-full ${m.color} shadow-inner`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
        </button>
      ))}
    </div>
  );
};
