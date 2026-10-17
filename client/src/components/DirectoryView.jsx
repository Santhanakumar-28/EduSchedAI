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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';

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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            Academic Resource Directory
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Physical classrooms, laboratory facilities, course curricula, and enrolled student cohorts.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/80 text-xs self-start sm:self-auto backdrop-blur-md">
          <button
            onClick={() => setSubTab('rooms')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              subTab === 'rooms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            🏛️ Venues ({rooms.length})
          </button>
          <button
            onClick={() => setSubTab('subjects')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              subTab === 'subjects' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            📚 Courses ({subjects.length})
          </button>
          <button
            onClick={() => setSubTab('batches')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              subTab === 'batches' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            🎓 Batches ({batches.length})
          </button>
        </div>
      </div>

      {/* Search & Resource Filter Toolbar */}
      <Card className="glass-panel border-slate-800 bg-slate-900/80 backdrop-blur-md p-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
              className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-400 focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
            {resourceSearch && (
              <button
                onClick={() => setResourceSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            {subTab === 'rooms' && (
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="text-xs font-semibold bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500"
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
                className="text-xs font-semibold bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Course Types</option>
                <option value="Theory">Theory Only</option>
                <option value="Lab">Practical Labs Only</option>
              </select>
            )}

            {isDirectoryFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResourceSearch('');
                  setRoomTypeFilter('all');
                  setSubjectTypeFilter('all');
                }}
                className="h-8 px-2.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/30"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}

            <span className="text-[11px] font-bold text-slate-300">
              {subTab === 'rooms' 
                ? `${filteredRooms.length} of ${rooms.length} Venues`
                : subTab === 'subjects'
                  ? `${filteredSubjects.length} of ${subjects.length} Courses`
                  : `${filteredBatches.length} of ${batches.length} Batches`}
            </span>
          </div>

        </div>
      </Card>

      {/* Venues View */}
      {subTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.length === 0 ? (
            <Card className="col-span-full glass-panel p-8 text-center text-slate-300 text-xs">
              No venues found matching "{resourceSearch}".
            </Card>
          ) : filteredRooms.map((room) => {
            const isLab = room.roomType.includes('Lab');
            return (
              <Card
                key={room._id}
                className="glass-panel border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 transition-all hover:shadow-lg"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLab ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}>
                        {isLab ? <Server className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="font-extrabold text-base text-white">{room.roomNumber}</span>
                        <p className="text-[11px] text-slate-300">{room.building}, Floor {room.floor}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      Cap: {room.capacity}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      isLab ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {room.roomType}
                    </span>
                    {room.equipmentTags?.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950/80 text-slate-300 border border-slate-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Courses View */}
      {subTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.length === 0 ? (
            <Card className="col-span-full glass-panel p-8 text-center text-slate-300 text-xs">
              No courses found matching "{resourceSearch}".
            </Card>
          ) : filteredSubjects.map((sub) => {
            const isLab = sub.type === 'Lab';
            return (
              <Card
                key={sub._id}
                className="glass-panel border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 transition-all hover:shadow-lg"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-white">{sub.code}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isLab ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {sub.type} {isLab ? `(${sub.labDurationHours || 2}-hr Lab Block)` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-semibold mt-1">{sub.name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold text-xs">
                      {sub.weeklyLectures} hrs/wk
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex justify-between">
                    <span>Target Venue: <strong className="text-white">{sub.preferredRoomType}</strong></span>
                    <span>Credits: <strong className="text-white">{sub.credits}</strong></span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Batches View */}
      {subTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBatches.length === 0 ? (
            <Card className="col-span-full glass-panel p-8 text-center text-slate-300 text-xs">
              No batches found matching "{resourceSearch}".
            </Card>
          ) : filteredBatches.map((batch) => (
            <Card
              key={batch._id}
              className="glass-panel border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 transition-all hover:shadow-lg"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-base text-white">{batch.name}</span>
                      <p className="text-xs text-slate-300">{batch.code} • Semester {batch.semester}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold text-xs">
                    {batch.studentStrength} Students
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}


