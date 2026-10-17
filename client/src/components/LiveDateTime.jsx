import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function LiveDateTime({ className = '' }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date: e.g. "Wed, Sep 30, 2026"
  const formattedDate = currentDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Short format for smaller screens: e.g. "Sep 30"
  const shortDate = currentDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  // Format time: e.g. "10:31:27 PM"
  const formattedTime = currentDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div 
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50/90 border border-slate-200 text-xs shadow-2xs whitespace-nowrap shrink-0 h-9 ${className}`}
      title="Current System Date & Time"
    >
      {/* Date */}
      <div className="flex items-center space-x-1.5 text-slate-700 font-medium whitespace-nowrap shrink-0">
        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="hidden sm:inline font-semibold whitespace-nowrap">{formattedDate}</span>
        <span className="sm:hidden font-semibold whitespace-nowrap">{shortDate}</span>
      </div>

      <span className="text-slate-300 select-none shrink-0">/</span>

      {/* Time with live pulse indicator */}
      <div className="flex items-center space-x-1.5 whitespace-nowrap shrink-0">
        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span className="font-mono font-bold text-slate-900 tracking-tight whitespace-nowrap">
          {formattedTime}
        </span>
        <span className="relative flex h-2 w-2 ml-0.5 shrink-0" title="Live Clock Active">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>
    </div>
  );
}
