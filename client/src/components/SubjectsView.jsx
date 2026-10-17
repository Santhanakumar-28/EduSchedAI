import React, { useState } from 'react';
import { BookOpen, Layers, Clock, Award, Users, Search } from 'lucide-react';

export default function SubjectsView({ dataset, onNavigateTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const subjects = dataset?.subjects || [
    { code: 'CS401', name: 'Database Management Systems', type: 'Theory', credits: 4, weeklyLectures: 4, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS402', name: 'Operating Systems & Concurrency', type: 'Theory', credits: 4, weeklyLectures: 4, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS403', name: 'Computer Networks & Security', type: 'Theory', credits: 3, weeklyLectures: 3, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS404', name: 'Design and Analysis of Algorithms', type: 'Theory', credits: 4, weeklyLectures: 4, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS405', name: 'Software Engineering Principles', type: 'Theory', credits: 3, weeklyLectures: 3, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS406', name: 'Artificial Intelligence & ML', type: 'Theory', credits: 3, weeklyLectures: 3, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS407', name: 'Theory of Computation', type: 'Theory', credits: 3, weeklyLectures: 3, labDurationHours: 1, preferredRoomType: 'LectureHall' },
    { code: 'CS491', name: 'Database Management Systems Lab', type: 'Lab', credits: 2, weeklyLectures: 2, labDurationHours: 2, preferredRoomType: 'ComputerLab' },
    { code: 'CS492', name: 'Operating Systems & Linux Lab', type: 'Lab', credits: 2, weeklyLectures: 2, labDurationHours: 2, preferredRoomType: 'ComputerLab' },
    { code: 'CS493', name: 'Algorithms Implementation Lab', type: 'Lab', credits: 2, weeklyLectures: 2, labDurationHours: 2, preferredRoomType: 'ComputerLab' }
  ];

  const filtered = subjects.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'All' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Curriculum Subjects & Courses</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Course structures, credit weighting, weekly lecture quotas, and specialized laboratory block constraints.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Theory">Theory Only</option>
            <option value="Lab">Practical Labs</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((sub) => (
          <div key={sub.code} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                {sub.code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                sub.type === 'Lab' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {sub.type === 'Lab' ? '🔬 2-Hour Lab Block' : '📖 Theory Lecture'}
              </span>
            </div>

            <h2 className="text-sm font-bold text-slate-900 mt-3 leading-snug">{sub.name}</h2>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50/70 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-medium">Credits</span>
                <span className="font-bold text-slate-900">{sub.credits}</span>
              </div>
              <div className="p-2 bg-slate-50/70 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-medium">Lectures/Wk</span>
                <span className="font-bold text-slate-900">{sub.weeklyLectures}</span>
              </div>
              <div className="p-2 bg-slate-50/70 rounded-xl">
                <span className="text-slate-400 text-[10px] block font-medium">Duration</span>
                <span className="font-bold text-slate-900">{sub.labDurationHours}h</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Venue: <strong className="text-slate-700">{sub.preferredRoomType}</strong></span>
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab?.('timetable')}>
                View Timetable →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
