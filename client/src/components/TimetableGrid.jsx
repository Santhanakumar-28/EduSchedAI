import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DoorOpen, 
  GraduationCap, 
  ArrowLeftRight, 
  Clock, 
  Coffee, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  Info, 
  X 
} from 'lucide-react';
import { Button } from './ui/button';

export default function TimetableGrid({ 
  schedule, 
  dataset, 
  onSlotSwapClick, 
  activeRole, 
  currentUser 
}) {
  const role = currentUser?.role || activeRole || 'HOD';
  const isFaculty = role === 'Faculty';
  const isStudent = role === 'Student';
  const isHOD = role === 'HOD';

  // For faculty, default to their personal schedule
  const [filterType, setFilterType] = useState(
    isFaculty ? 'faculty' : isStudent ? 'batch' : 'batch'
  );

  const [selectedFilterId, setSelectedFilterId] = useState(() => {
    if (isFaculty && currentUser?.facultyId) {
      return currentUser.facultyId;
    }
    if (isStudent && currentUser?.batchId) {
      return currentUser.batchId;
    }
    return dataset?.batches?.[0]?._id || 'batch_1';
  });

  // Ensure faculty is locked to their own ID when viewing faculty filter
  useEffect(() => {
    if (isFaculty) {
      if (filterType === 'faculty') {
        setSelectedFilterId(currentUser?.facultyId || 'fac_2');
      } else if (filterType === 'batch') {
        setSelectedFilterId(currentUser?.coordinatedBatchId || dataset?.batches?.[0]?._id || 'batch_1');
      }
    } else if (isStudent) {
      setFilterType('batch');
      setSelectedFilterId(currentUser?.batchId || 'batch_1');
    }
  }, [filterType, currentUser?.facultyId, currentUser?.batchId, isFaculty, isStudent]);

  // Search & Secondary Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all'); // 'all', 'theory', 'lab'
  const [dayFilter, setDayFilter] = useState('all'); // 'all', 'Monday', 'Tuesday', ...

  const days = dataset?.config?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periodsCount = dataset?.config?.periodsPerDay || 7;
  const lunchPeriod = dataset?.config?.lunchBreakPeriod || 4;

  const subjMap = new Map(dataset?.subjects?.map((s) => [String(s._id), s]));
  const facMap = new Map(dataset?.faculty?.map((f) => [String(f._id), f]));
  const roomMap = new Map(dataset?.rooms?.map((r) => [String(r._id), r]));
  const batchMap = new Map(dataset?.batches?.map((b) => [String(b._id), b]));

  // Filter slots according to active selection
  const filteredSchedule = schedule.filter((slot) => {
    if (filterType === 'batch') {
      return String(slot.batchId) === String(selectedFilterId);
    } else if (filterType === 'faculty') {
      return String(slot.facultyId) === String(selectedFilterId);
    } else if (filterType === 'room') {
      return String(slot.roomId) === String(selectedFilterId);
    }
    return true;
  });

  const isFilterActive = searchQuery.trim() !== '' || sessionTypeFilter !== 'all' || dayFilter !== 'all';

  const isSlotMatched = (slot) => {
    if (!slot) return false;
    const subject = subjMap.get(String(slot.subjectId));
    const facultyMember = facMap.get(String(slot.facultyId));
    const room = roomMap.get(String(slot.roomId));
    const isLab = slot.type === 'Lab' || subject?.isLab;

    if (sessionTypeFilter === 'theory' && isLab) return false;
    if (sessionTypeFilter === 'lab' && !isLab) return false;
    if (dayFilter !== 'all' && slot.day !== dayFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = subject?.code?.toLowerCase().includes(q);
      const nameMatch = subject?.name?.toLowerCase().includes(q);
      const facMatch = facultyMember?.name?.toLowerCase().includes(q);
      const roomMatch = room?.roomNumber?.toLowerCase().includes(q);
      const typeMatch = (isLab ? 'lab practical' : 'theory lecture').includes(q);
      if (!codeMatch && !nameMatch && !facMatch && !roomMatch && !typeMatch) {
        return false;
      }
    }
    return true;
  };

  const matchingSlotsCount = filteredSchedule.filter(isSlotMatched).length;

  const periodTimeMap = {
    1: '09:00 - 09:50',
    2: '09:50 - 10:40',
    3: '10:40 - 11:30',
    4: '11:30 - 12:20',
    5: '12:20 - 01:10',
    6: '01:10 - 02:00',
    7: '02:00 - 02:50'
  };

  const loggedInFacultyObj = isFaculty && currentUser?.facultyId 
    ? facMap.get(String(currentUser.facultyId)) 
    : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Control & Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filter Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> View by:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
            
            {isFaculty && (
              <button
                onClick={() => {
                  setFilterType('faculty');
                  setSelectedFilterId(currentUser?.facultyId || 'fac_2');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'faculty' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👩‍🏫 My Teaching Schedule
              </button>
            )}

            {isHOD && (
              <button
                onClick={() => {
                  setFilterType('faculty');
                  setSelectedFilterId(dataset?.faculty?.[0]?._id || 'fac_1');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'faculty' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👩‍🏫 Faculty Member
              </button>
            )}

            {(!isStudent) && (
              <button
                onClick={() => {
                  setFilterType('batch');
                  setSelectedFilterId(
                    isFaculty && currentUser?.coordinatedBatchId 
                      ? currentUser.coordinatedBatchId 
                      : dataset?.batches?.[0]?._id || 'batch_1'
                  );
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'batch' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎓 Student Class Schedule
              </button>
            )}

            {isHOD && (
              <button
                onClick={() => {
                  setFilterType('room');
                  setSelectedFilterId(dataset?.rooms?.[0]?._id || 'room_1');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'room' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏛️ Classroom / Lab
              </button>
            )}

            {isStudent && (
              <div className="px-3 py-1.5 font-bold text-blue-600 bg-white rounded-lg shadow-xs">
                🎓 My Enrolled Section ({currentUser?.enrolledBatch?.name || 'CSE Section A'})
              </div>
            )}

          </div>
        </div>

        {/* Dynamic Selector Dropdown */}
        <div className="flex items-center space-x-3">
          {isFaculty && filterType === 'faculty' && (
            <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-blue-950">
                {loggedInFacultyObj?.name || currentUser.name}
              </span>
              <span className="text-slate-500 font-medium">
                ({loggedInFacultyObj?.cadre || 'Faculty'}) • Target: {loggedInFacultyObj?.targetHours || 16}h
              </span>
            </div>
          )}

          {isFaculty && filterType === 'batch' && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Select Class Section:
              </label>
              <select
                value={selectedFilterId}
                onChange={(e) => setSelectedFilterId(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                {dataset?.batches?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code}) {currentUser?.coordinatedBatchId === b._id ? '★ Your Section' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isHOD && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Select {filterType === 'batch' ? 'Section' : filterType === 'faculty' ? 'Instructor' : 'Venue'}:
              </label>
              <select
                value={selectedFilterId}
                onChange={(e) => setSelectedFilterId(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              >
                {filterType === 'batch' &&
                  dataset?.batches?.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code}) - {b.studentStrength} Students
                    </option>
                  ))}
                {filterType === 'faculty' &&
                  dataset?.faculty?.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.cadre}) - Target: {f.targetHours}h
                    </option>
                  ))}
                {filterType === 'room' &&
                  dataset?.rooms?.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roomNumber} ({r.roomType}) - Cap: {r.capacity}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* Search & Dynamic Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject code (e.g. CS401), title, faculty, or room..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters for Session Type & Day */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setSessionTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sessionTypeFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSessionTypeFilter('theory')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sessionTypeFilter === 'theory'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📖 Theory
            </button>
            <button
              onClick={() => setSessionTypeFilter('lab')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                sessionTypeFilter === 'lab'
                  ? 'bg-white text-emerald-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔬 2-Hr Labs
            </button>
          </div>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">📅 All Days</option>
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
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </button>
          )}
        </div>

      </div>

      {/* Filter Result Notification Strip */}
      {isFilterActive && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>
              Filter Active: <strong>{matchingSlotsCount}</strong> sessions highlighted
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium">Non-matching slots dimmed</span>
        </div>
      )}

      {/* Legend & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs px-1 text-slate-500 gap-2 font-medium">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-50 border border-blue-300"></span>
            <span>Theory Lecture (1 hr)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300"></span>
            <span>Practical Lab (2 hrs contiguous)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-50 border border-amber-300"></span>
            <span>Lunch Period</span>
          </div>
        </div>
        
        {isHOD && (
          <div className="text-[11px] text-slate-500 italic flex items-center">
            <Info className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Click any class card to swap or reassign slot with real-time clash verification.
          </div>
        )}
      </div>

      {/* Master Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[1100px]">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-800 text-white text-xs font-semibold">
                <th className="p-4 w-32 border-r border-slate-700 text-center font-bold uppercase tracking-wider text-[11px] text-slate-200">
                  Day / Period
                </th>
                {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                  const isLunch = p === lunchPeriod;
                  return (
                    <th
                      key={p}
                      className={`p-3.5 text-center border-r border-slate-700 ${
                        isLunch 
                          ? 'bg-amber-600/90 text-white w-28' 
                          : 'w-48'
                      }`}
                    >
                      <div className="font-extrabold text-xs tracking-tight flex items-center justify-center space-x-1">
                        {isLunch ? (
                          <>
                            <Coffee className="w-3.5 h-3.5 text-amber-200" />
                            <span>LUNCH</span>
                          </>
                        ) : (
                          <span>Period {p}</span>
                        )}
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${isLunch ? 'text-amber-100' : 'text-slate-300'}`}>
                        {periodTimeMap[p] || `P${p}`}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-xs">
              {days.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Day Label Column */}
                  <td className="p-4 font-bold text-slate-800 border-r border-slate-200 bg-slate-50/80 align-middle text-center">
                    <div className="text-sm font-bold">{day}</div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-600 border border-slate-200 mt-1 shadow-2xs">
                      {filteredSchedule.filter((s) => s.day === day).length} {filterType === 'faculty' ? 'Classes' : 'Lectures'}
                    </div>
                  </td>

                  {/* Slot Columns */}
                  {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => {
                    if (p === lunchPeriod) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-r border-slate-200 bg-amber-50/40 text-center align-middle"
                        >
                          <div className="py-6 flex flex-col items-center justify-center text-amber-900">
                            <Coffee className="w-4 h-4 mb-1 text-amber-600 opacity-90" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Break</span>
                            <span className="text-[9px] font-mono text-amber-700">11:30 - 12:20</span>
                          </div>
                        </td>
                      );
                    }

                    const match = filteredSchedule.find((s) => s.day === day && s.period === p);

                    if (!match) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-r border-slate-200 align-middle bg-slate-50/30"
                        >
                          <div className="h-28 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <span className="text-[11px] font-medium">
                              {filterType === 'faculty' ? 'Research / Office Hour' : 'Unscheduled'}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    const subject = subjMap.get(String(match.subjectId));
                    const teacher = facMap.get(String(match.facultyId));
                    const room = roomMap.get(String(match.roomId));
                    const batch = batchMap.get(String(match.batchId));
                    const isLab = match.type === 'Lab';
                    const matchedByFilter = isSlotMatched(match);
                    const isDimmed = isFilterActive && !matchedByFilter;
                    const isHighlighted = isFilterActive && matchedByFilter;

                    return (
                      <td key={p} className="p-2 border-r border-slate-200 align-middle">
                        <div
                          onClick={() => isHOD && onSlotSwapClick && onSlotSwapClick(match)}
                          className={`h-28 p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                            isHOD ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
                          } ${
                            isDimmed ? 'opacity-25 filter grayscale contrast-75 scale-[0.97]' : ''
                          } ${
                            isHighlighted ? 'ring-2 ring-blue-600 shadow-md scale-[1.02] bg-blue-50/40' : ''
                          } ${
                            isLab
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs hover:border-blue-400'
                          }`}
                        >
                          <div>
                            {/* Card Top */}
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs tracking-tight text-slate-900 flex items-center">
                                {subject?.code || 'SUBJ'}
                                {isLab && (
                                  <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200">
                                    LAB
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                {room?.roomNumber || 'RM'}
                              </span>
                            </div>

                            {/* Subject Title */}
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-1" title={subject?.name}>
                              {subject?.name || 'Subject Title'}
                            </p>
                          </div>

                          {/* Card Bottom */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                            {filterType === 'faculty' ? (
                              <span className="font-extrabold text-blue-600">{batch?.name}</span>
                            ) : (
                              <span className="line-clamp-1 font-semibold text-slate-600 flex items-center" title={teacher?.name}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                                {teacher?.name?.replace('Prof. ', '')?.replace('Dr. ', '') || 'Faculty'}
                              </span>
                            )}

                            {isHOD && (
                              <button
                                title="Swap or Reassign Slot"
                                className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                            )}
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
