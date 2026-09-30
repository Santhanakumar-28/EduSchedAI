import React, { useState } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  CalendarDays, 
  Clock, 
  Coffee, 
  DoorOpen, 
  BookOpen, 
  Mail, 
  Award,
  Sparkles,
  CheckCircle2,
  Megaphone,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  X
} from 'lucide-react';

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
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all'); // 'all', 'theory', 'lab'
  const [dayFilter, setDayFilter] = useState('all'); // 'all', 'Monday', ...

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

  // Find coordinator
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
    4: '11:30 - 12:20', // Lunch
    5: '12:20 - 01:10',
    6: '01:10 - 02:00',
    7: '02:00 - 02:50'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Student Profile & Class Coordinator Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Profile Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Academic Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2">
              Welcome, {currentUser?.name}!
            </h1>
            <p className="text-xs text-indigo-100">
              Department of Computer Science & Engineering • Semester 4
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-white/20 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-indigo-200 text-[10px] uppercase font-bold block">Roll Number</span>
              <span className="font-mono font-bold text-sm">{currentUser?.rollNo || '2026CSE001'}</span>
            </div>
            <div>
              <span className="text-indigo-200 text-[10px] uppercase font-bold block">Enrolled Section</span>
              <span className="font-bold text-sm">{batch.name}</span>
            </div>
            <div>
              <span className="text-indigo-200 text-[10px] uppercase font-bold block">Weekly Classes</span>
              <span className="font-bold text-sm">{batchSchedule.length} Periods</span>
            </div>
          </div>
        </div>

        {/* Assigned Class Coordinator Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Your Class Coordinator</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{coordinator.name}</h3>
            <p className="text-xs text-slate-500">{coordinator.cadre} • CSE Department</p>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Your Class Coordinator is responsible for section student enrollment, issuing login credentials, attendance oversight, and timetable queries.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-indigo-600 font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>{coordinator.email}</span>
          </div>
        </div>

      </div>

      {/* Quick Summary Strip: Attendance Compliance & Department Bulletins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Attendance & Exam Eligibility */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance Status</h4>
                  <div className="text-lg font-black text-slate-900">88.5% <span className="text-xs font-bold text-emerald-600">(42/48 Attended)</span></div>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UGC 75% Eligible</span>
              </span>
            </div>

            {/* Progress bar */}
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
            <span className="text-xs text-slate-500">Zero condonation risk detected</span>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('attendance')}
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>Full Attendance Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Campus Broadcast Bulletin */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Notice Bulletin</h4>
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
                className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>View All Notices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Student Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Timetable: {batch.name}
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            Current Semester
          </span>
        </div>

        {/* Student Search & Quick Filter Toolbar */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course code, subject, instructor, room..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
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

          {/* Type & Day Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setSessionTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sessionTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSessionTypeFilter('theory')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sessionTypeFilter === 'theory'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Theory
              </button>
              <button
                onClick={() => setSessionTypeFilter('lab')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
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
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500"
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
                className="px-2 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Reset ({matchingSlotsCount})</span>
              </button>
            )}
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px] text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                <th className="p-3.5 w-28 border-r border-slate-200">Day / Time</th>
                {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                  const isLunch = p === lunchPeriod;
                  return (
                    <th
                      key={p}
                      className={`p-3 text-center border-r border-slate-200 ${
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
                  <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/60 align-middle">
                    <div className="text-sm">{day}</div>
                  </td>
                  {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                    if (p === lunchPeriod) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-r border-slate-200 bg-amber-50/40 text-center align-middle"
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
                        <td key={p} className="p-2 border-r border-slate-200 align-middle bg-slate-50/20">
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
                      <td key={p} className="p-2 border-r border-slate-200 align-middle">
                        <div
                          className={`h-20 p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                            isDimmed ? 'opacity-20 filter grayscale contrast-75 scale-[0.97]' : ''
                          } ${
                            isHighlighted ? 'ring-2 ring-indigo-600 shadow-md scale-[1.03] bg-indigo-50/70' : ''
                          } ${
                            isLab
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{subject?.code}</span>
                              <span className="text-[10px] font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
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
