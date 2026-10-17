import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  CalendarDays, 
  Coffee, 
  Mail, 
  CheckCircle2,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Search,
  X
} from 'lucide-react';
import { Button } from './ui/button';

export default function StudentPortalView({ currentUser, dataset, schedule, onNavigateTab }) {
  const batchId = currentUser?.batchId || 'batch_1';
  const batch = dataset?.batches?.find((b) => String(b._id) === String(batchId)) || {
    name: 'CSE Section A',
    code: 'CSE-A-2026'
  };

  const days = dataset?.config?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periodsCount = dataset?.config?.periodsPerDay || 7;
  const lunchPeriod = dataset?.config?.lunchBreakPeriod || 4;

  const subjMap = new Map(dataset?.subjects?.map((s) => [String(s._id), s]));
  const facMap = new Map(dataset?.faculty?.map((f) => [String(f._id), f]));
  const roomMap = new Map(dataset?.rooms?.map((r) => [String(r._id), r]));

  // Filter schedule for this student's batch
  const batchSchedule = schedule.filter((s) => String(s.batchId) === String(batchId));

  // Student Search & Secondary Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  const isFilterActive = searchQuery.trim() !== '' || sessionTypeFilter !== 'all' || dayFilter !== 'all';

  const isSlotMatched = (slot) => {
    if (!slot) return false;
    const subject = subjMap.get(String(slot.subjectId));
    const teacher = facMap.get(String(slot.facultyId));
    const room = roomMap.get(String(slot.roomId));
    const isLab = slot.type === 'Lab' || subject?.isLab;

    if (sessionTypeFilter === 'theory' && isLab) return false;
    if (sessionTypeFilter === 'lab' && !isLab) return false;
    if (dayFilter !== 'all' && slot.day !== dayFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = subject?.code?.toLowerCase().includes(q);
      const nameMatch = subject?.name?.toLowerCase().includes(q);
      const teacherMatch = teacher?.name?.toLowerCase().includes(q);
      const roomMatch = room?.roomNumber?.toLowerCase().includes(q);
      const typeMatch = (isLab ? 'lab practical' : 'theory lecture').includes(q);
      if (!codeMatch && !nameMatch && !teacherMatch && !roomMatch && !typeMatch) {
        return false;
      }
    }
    return true;
  };

  const matchingSlotsCount = batchSchedule.filter(isSlotMatched).length;

  const coordinator = dataset?.faculty?.find(
    (f) => f.isClassCoordinator && String(f.coordinatedBatchId) === String(batchId)
  ) || currentUser?.classCoordinator || {
    name: 'Dr. Sunita Rao',
    cadre: 'Professor',
    email: 'dr.sunita@eduschedai.edu'
  };

  const periodTimeMap = {
    1: '09:00 - 09:50',
    2: '09:50 - 10:40',
    3: '10:40 - 11:30',
    4: '11:30 - 12:20',
    5: '12:20 - 01:10',
    6: '01:10 - 02:00',
    7: '02:00 - 02:50'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Student Profile & Class Coordinator Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Profile Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Academic Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2">
              Welcome, {currentUser?.name}!
            </h1>
            <p className="text-xs text-blue-100 font-medium">
              Department of Computer Science & Engineering • Semester 4
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-white/20 flex flex-wrap gap-6 text-xs relative z-10">
            <div>
              <span className="text-blue-200 text-[10px] uppercase font-bold block">Roll Number</span>
              <span className="font-mono font-bold text-sm">{currentUser?.rollNo || '2026CSE001'}</span>
            </div>
            <div>
              <span className="text-blue-200 text-[10px] uppercase font-bold block">Enrolled Section</span>
              <span className="font-bold text-sm">{batch.name}</span>
            </div>
            <div>
              <span className="text-blue-200 text-[10px] uppercase font-bold block">Weekly Classes</span>
              <span className="font-bold text-sm">{batchSchedule.length} Periods</span>
            </div>
          </div>
        </div>

        {/* Assigned Class Coordinator Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Your Class Coordinator</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{coordinator.name}</h3>
            <p className="text-xs text-slate-500">{coordinator.cadre} • CSE Department</p>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
              Your Class Coordinator is responsible for section student enrollment, issuing login credentials, attendance oversight, and timetable queries.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-blue-600 font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>{coordinator.email}</span>
          </div>
        </div>

      </div>

      {/* Attendance & Notice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Attendance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Status</h4>
                  <div className="text-lg font-black text-slate-900 font-mono">88.5% <span className="text-xs font-bold text-emerald-600">(42/48 Attended)</span></div>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UGC 75% Eligible</span>
              </span>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Current Standing</span>
                <span>Minimum Threshold: 75%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '88.5%' }}></div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500" style={{ left: '75%' }} title="75% UGC Minimum"></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Zero condonation risk detected</span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('attendance')}
                className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Full Attendance Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Notice Bulletin */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notice Bulletin</h4>
                  <div className="text-sm font-bold text-slate-900 line-clamp-1">Continuous Assessment Test-2 Schedule</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Exam
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              All students must review the published slot timetable for CAT-2. Zero clashes reported across core and elective modules.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Broadcasted by CSE Department HOD</span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('notices')}
                className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>View All Notices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Student Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Timetable: {batch.name}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            Current Semester
          </span>
        </div>

        {/* Search Toolbar */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course code, subject, instructor, room..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setSessionTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  sessionTypeFilter === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSessionTypeFilter('theory')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  sessionTypeFilter === 'theory'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theory
              </button>
              <button
                onClick={() => setSessionTypeFilter('lab')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  sessionTypeFilter === 'lab'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Labs
              </button>
            </div>

            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">All Days</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {isFilterActive && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSessionTypeFilter('all');
                  setDayFilter('all');
                }}
                className="h-8 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center transition-colors"
              >
                <X className="w-3 h-3 mr-1" /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px] text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 font-semibold text-slate-500">
                <th className="p-3.5 w-28 border-r border-slate-100">Day / Time</th>
                {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                  const isLunch = p === lunchPeriod;
                  return (
                    <th
                      key={p}
                      className={`p-3 text-center border-r border-slate-100 ${
                        isLunch ? 'bg-amber-50/70 text-amber-900 w-28' : 'w-44'
                      }`}
                    >
                      <div className="font-bold">{isLunch ? '🥪 LUNCH' : `Period ${p}`}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {periodTimeMap[p] || `P${p}`}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((day) => (
                <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-100 bg-slate-50/60 align-middle">
                    <div className="text-sm">{day}</div>
                  </td>
                  {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                    if (p === lunchPeriod) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-r border-slate-100 bg-amber-50/40 text-center align-middle"
                        >
                          <div className="py-4 flex flex-col items-center justify-center text-amber-800">
                            <Coffee className="w-4 h-4 mb-1 text-amber-600 opacity-80" />
                            <span className="text-[10px] font-bold uppercase">Break</span>
                          </div>
                        </td>
                      );
                    }

                    const match = batchSchedule.find((s) => s.day === day && s.period === p);

                    if (!match) {
                      return (
                        <td key={p} className="p-2 border-r border-slate-100 align-middle bg-slate-50/20">
                          <div className="h-20 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[11px]">
                            Free Period
                          </div>
                        </td>
                      );
                    }

                    const subject = subjMap.get(String(match.subjectId));
                    const teacher = facMap.get(String(match.facultyId));
                    const room = roomMap.get(String(match.roomId));
                    const isLab = match.type === 'Lab';
                    const matchedByFilter = isSlotMatched(match);
                    const isDimmed = isFilterActive && !matchedByFilter;
                    const isHighlighted = isFilterActive && matchedByFilter;

                    return (
                      <td key={p} className="p-2 border-r border-slate-100 align-middle">
                        <div
                          className={`h-20 p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                            isDimmed ? 'opacity-20 filter grayscale contrast-75 scale-[0.97]' : ''
                          } ${
                            isHighlighted ? 'ring-2 ring-blue-600 shadow-md scale-[1.03] bg-blue-50/70' : ''
                          } ${
                            isLab
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{subject?.code}</span>
                              <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {room?.roomNumber}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-700 line-clamp-1 mt-0.5">
                              {subject?.name}
                            </p>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium line-clamp-1">
                            {teacher?.name}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
