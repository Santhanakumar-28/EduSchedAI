import React, { useState } from 'react';
import { 
  FolderTree, 
  DoorOpen, 
  BookOpen, 
  Users, 
  Sparkles,
  Server,
  Layers,
  Search,
  Filter,
  X
} from 'lucide-react';

export default function DirectoryView({ dataset }) {
  const [subTab, setSubTab] = useState('rooms'); // 'rooms', 'subjects', 'batches'
  const [resourceSearch, setResourceSearch] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all'); // 'all', 'Classroom', 'Lab'
  const [subjectTypeFilter, setSubjectTypeFilter] = useState('all'); // 'all', 'Theory', 'Lab'

  const rooms = dataset?.rooms || [];
  const subjects = dataset?.subjects || [];
  const batches = dataset?.batches || [];

  const isDirectoryFilterActive = resourceSearch.trim() !== '' || roomTypeFilter !== 'all' || subjectTypeFilter !== 'all';

  const filteredRooms = rooms.filter((r) => {
    if (roomTypeFilter === 'Classroom' && r.roomType.includes('Lab')) return false;
    if (roomTypeFilter === 'Lab' && !r.roomType.includes('Lab')) return false;
    if (resourceSearch.trim()) {
      const q = resourceSearch.toLowerCase().trim();
      const matchNum = r.roomNumber?.toLowerCase().includes(q);
      const matchBldg = r.building?.toLowerCase().includes(q);
      const matchType = r.roomType?.toLowerCase().includes(q);
      if (!matchNum && !matchBldg && !matchType) return false;
    }
    return true;
  });

  const filteredSubjects = subjects.filter((s) => {
    if (subjectTypeFilter !== 'all' && s.type !== subjectTypeFilter) return false;
    if (resourceSearch.trim()) {
      const q = resourceSearch.toLowerCase().trim();
      const matchCode = s.code?.toLowerCase().includes(q);
      const matchName = s.name?.toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
    return true;
  });

  const filteredBatches = batches.filter((b) => {
    if (resourceSearch.trim()) {
      const q = resourceSearch.toLowerCase().trim();
      const matchName = b.name?.toLowerCase().includes(q);
      const matchCode = b.code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
            <FolderTree className="w-5 h-5 mr-2 text-indigo-600" />
            Academic Resource Directory
          </h2>
          <p className="text-xs text-slate-500">
            Physical classrooms, specialized laboratory facilities, course curricula, and enrolled student cohorts.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setSubTab('rooms')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              subTab === 'rooms' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            🏛️ Venues ({rooms.length})
          </button>
          <button
            onClick={() => setSubTab('subjects')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              subTab === 'subjects' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            📚 Courses ({subjects.length})
          </button>
          <button
            onClick={() => setSubTab('batches')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              subTab === 'batches' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            🎓 Batches ({batches.length})
          </button>
        </div>
      </div>

      {/* Search & Resource Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            placeholder={
              subTab === 'rooms' 
                ? 'Search room number, building, equipment...'
                : subTab === 'subjects'
                  ? 'Search course code or subject title...'
                  : 'Search batch name or section code...'
            }
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {resourceSearch && (
            <button
              onClick={() => setResourceSearch('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          {subTab === 'rooms' && (
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Venue Types</option>
              <option value="Classroom">Lecture Halls Only</option>
              <option value="Lab">Computer Labs Only</option>
            </select>
          )}

          {subTab === 'subjects' && (
            <select
              value={subjectTypeFilter}
              onChange={(e) => setSubjectTypeFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Course Types</option>
              <option value="Theory">Theory Only</option>
              <option value="Lab">Practical Labs Only</option>
            </select>
          )}

          {isDirectoryFilterActive && (
            <button
              onClick={() => {
                setResourceSearch('');
                setRoomTypeFilter('all');
                setSubjectTypeFilter('all');
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="text-[11px] font-bold text-slate-500">
            {subTab === 'rooms' 
              ? `${filteredRooms.length} of ${rooms.length} Venues`
              : subTab === 'subjects'
                ? `${filteredSubjects.length} of ${subjects.length} Courses`
                : `${filteredBatches.length} of ${batches.length} Batches`}
          </span>
        </div>

      </div>

      {/* Venues View */}
      {subTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No venues found matching "{resourceSearch}".
            </div>
          ) : filteredRooms.map((room) => {
            const isLab = room.roomType.includes('Lab');
            return (
              <div
                key={room._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isLab ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {isLab ? <Server className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900">{room.roomNumber}</span>
                      <p className="text-[11px] text-slate-500">{room.building}, Floor {room.floor}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Cap: {room.capacity}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isLab ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {room.roomType}
                  </span>
                  {room.equipmentTags?.map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Courses View */}
      {subTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No courses found matching "{resourceSearch}".
            </div>
          ) : filteredSubjects.map((sub) => {
            const isLab = sub.type === 'Lab';
            return (
              <div
                key={sub._id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{sub.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isLab ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {sub.type} {isLab ? `(${sub.labDurationHours || 2}-hr Lab Block)` : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold mt-1">{sub.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
                    {sub.weeklyLectures} hrs/wk
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Target Venue: <strong>{sub.preferredRoomType}</strong></span>
                  <span>Credits: <strong>{sub.credits}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Batches View */}
      {subTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No batches found matching "{resourceSearch}".
            </div>
          ) : filteredBatches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900">{batch.name}</span>
                    <p className="text-xs text-slate-500">{batch.code} • Semester {batch.semester}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-slate-100 font-mono font-bold text-xs text-slate-800">
                  {batch.studentStrength} Students
                </span>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
