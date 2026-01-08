
import React from 'react';

interface TimelineNavProps {
  currentAnchor: string;
  onNavigate: (direction: 'prev' | 'next') => void;
}

const TimelineNav: React.FC<TimelineNavProps> = ({ currentAnchor, onNavigate }) => {
  const date = new Date(currentAnchor);
  
  return (
    <div className="flex items-center justify-center gap-6 py-8">
      <button
        onClick={() => onNavigate('prev')}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Previous Week
      </button>

      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Arrival Timeline Anchor</span>
        <span className="text-lg font-bold text-indigo-900">
          {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <button
        onClick={() => onNavigate('next')}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
      >
        Next Week
        <i className="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  );
};

export default TimelineNav;
