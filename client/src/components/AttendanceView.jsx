import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Users, 
  Save, 
  Check, 
  Search, 
  X,
  Calendar,
  Clock,
  BookOpen,
  Filter,
  BarChart3,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '../api';

export default function AttendanceView({ currentUser, dataset }) {
  const isStudent = currentUser?.role === 'Student';
  const isHOD = currentUser?.role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;

  const [activeSubTab, setActiveSubTab] = useState(isStudent ? 'student_view' : 'mark');
  
  // Selection states for marking attendance
  const [selectedBatchId, setSelectedBatchId] = useState(
    currentUser?.coordinatedBatchId || dataset?.batches?.[0]?._id || 'batch_1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    dataset?.subjects?.[0]?._id || 'subj_1'
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [isSubstitutePeriod, setIsSubstitutePeriod] = useState(false);

  // Assigned periods for faculty / substitute on selectedDate
  const [assignedPeriods, setAssignedPeriods] = useState([]);
  const [approvedLeavesMap, setApprovedLeavesMap] = useState({});

  // Roster search & filter
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Roster state
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [studentPersonalStats, setStudentPersonalStats] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadBatchRoster = async (batchId) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/attendance/batch/${batchId}`);
      const json = await res.json();
      if (json.success) {
        setBatchStudents(json.data.students || []);
        const initial = {};
        (json.data.students || []).forEach(s => {
          initial[s.studentId] = 'Present';
        });
        setStudentStatuses(initial);
      }
    } catch (err) {
      console.error('Failed to load batch roster:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const url = isStudent 
        ? `/api/attendance/summary?studentId=${currentUser.id}` 
        : `/api/attendance/summary`;
      const res = await apiFetch(url);
      const json = await res.json();
      if (json.success) {
        if (isStudent) {
          setStudentPersonalStats(json.data);
        } else {
          setAttendanceSummary(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance summary:', err);
    }
  };

  const loadAssignedPeriods = async () => {
    try {
      const facId = currentUser?.facultyId || currentUser?.id;
      const res = await apiFetch(`/api/attendance/assigned-periods?date=${selectedDate}&facultyId=${facId}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        const pList = json.periods || [];
        setAssignedPeriods(pList);
        if (pList.length > 0) {
          const match = pList.find(p => p.period === selectedPeriod && String(p.batchId) === String(selectedBatchId));
          if (!match) {
            const first = pList[0];
            setSelectedPeriod(first.period);
            setSelectedBatchId(first.batchId);
            setSelectedSubjectId(first.subjectId);
            setIsSubstitutePeriod(!!first.isSubstitution);
          } else {
            setIsSubstitutePeriod(!!match.isSubstitution);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load assigned periods:', err);
    }
  };

  const loadApprovedLeaves = async () => {
    try {
      const res = await apiFetch('/api/leaves/requests', { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        const map = {};
        (json.data || []).forEach(l => {
          if (l.applicantType === 'Student' && l.status === 'Approved') {
            const lDate = l.date || l.startDate;
            if (lDate === selectedDate || (l.startDate <= selectedDate && selectedDate <= l.endDate)) {
              map[l.studentId] = l;
            }
          }
        });
        setApprovedLeavesMap(map);
      }
    } catch (err) {
      console.error('Failed to load approved leaves:', err);
    }
  };

  useEffect(() => {
    if (!isStudent) {
      loadBatchRoster(selectedBatchId);
      loadSummary();
      loadAssignedPeriods();
      loadApprovedLeaves();
    } else {
      loadSummary();
    }
  }, [selectedBatchId, selectedDate, isStudent]);

  const handleSelectPeriodCard = (p) => {
    setSelectedPeriod(p.period);
    setSelectedBatchId(p.batchId);
    setSelectedSubjectId(p.subjectId);
    setIsSubstitutePeriod(!!p.isSubstitution);
  };

  const handleStatusChange = (studentId, status) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = 'Present';
    });
    setStudentStatuses(updated);
  };

  const handleSubmitAttendance = async () => {
    try {
      setIsLoading(true);
      const records = batchStudents.map(s => ({
        studentId: s.studentId,
        rollNo: s.rollNo,
        name: s.name,
        status: studentStatuses[s.studentId] || 'Present'
      }));

      const res = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          batchId: selectedBatchId,
          subjectId: selectedSubjectId,
          date: selectedDate,
          period: selectedPeriod,
          markedByFacultyId: currentUser?.facultyId || currentUser?.id || 'fac_1',
          isSubstitution: isSubstitutePeriod,
          records
        })
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccessMsg(json.message);
        loadBatchRoster(selectedBatchId);
        loadSummary();
        loadAssignedPeriods();
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        alert(json.message || 'Error saving attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting attendance: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBatchStudents = batchStudents.filter(std => {
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      const matchName = std.name?.toLowerCase().includes(q);
      const matchRoll = std.rollNo?.toLowerCase().includes(q);
      if (!matchName && !matchRoll) return false;
    }
    if (statusFilter !== 'all') {
      const curStatus = studentStatuses[std.studentId] || 'Present';
      if (curStatus !== statusFilter) return false;
    }
    return true;
  });

  const presentCount = batchStudents.filter(s => (studentStatuses[s.studentId] || 'Present') === 'Present').length;
  const onDutyCount = batchStudents.filter(s => studentStatuses[s.studentId] === 'On-Duty').length;
  const absentCount = batchStudents.filter(s => studentStatuses[s.studentId] === 'Absent').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span>Academic Attendance Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isStudent 
              ? 'Real-time record of your session attendance, exam eligibility thresholds, and course statistics.' 
              : 'Record student attendance by lecture slot, monitor section absenteeism, and maintain audit records.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            UGC Minimum 75% Rule Active
          </span>

          {!isStudent && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs shrink-0">
              <button
                onClick={() => setActiveSubTab('mark')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeSubTab === 'mark'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                📝 Mark Attendance
              </button>
              <button
                onClick={() => setActiveSubTab('summary')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeSubTab === 'summary'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                📊 Trends & History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STUDENT VIEW */}
      {isStudent && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
              <div className="my-3 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono">
                  {studentPersonalStats?.percentage ?? 88}%
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  (studentPersonalStats?.percentage ?? 88) >= 75
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {(studentPersonalStats?.percentage ?? 88) >= 75 ? '✓ Eligible for Exams' : '⚠ Shortage'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (studentPersonalStats?.percentage ?? 88) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${studentPersonalStats?.percentage ?? 88}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions Attended</span>
              <div className="my-3">
                <span className="text-4xl font-extrabold text-blue-600 font-mono">
                  {studentPersonalStats?.attended ?? 17}
                </span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">
                  / {studentPersonalStats?.totalSessions ?? 20} Lectures
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Verified by Department Lecture Roster</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Requirement</span>
              <div className="my-3">
                <span className="text-4xl font-extrabold text-slate-900 font-mono">75%</span>
                <span className="text-xs text-amber-600 font-bold ml-1.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Minimum Bar
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Students below 75% require HOD condonation</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Course-Wise Attendance Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Continuous tracking across all theoretical courses and laboratory practicals.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="p-3.5 pl-5">Course Code</th>
                    <th className="p-3.5">Subject Title</th>
                    <th className="p-3.5 text-center">Attended / Total</th>
                    <th className="p-3.5 text-center">Percentage</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(studentPersonalStats?.subjectBreakdown || []).map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-blue-600">{sub.subjectCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{sub.subjectName}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-700">
                        {sub.attended} / {sub.total}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-extrabold text-sm text-slate-900">{sub.percentage}%</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.percentage >= 75
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {sub.percentage >= 75 ? '✓ Exam Eligible' : '⚠ Shortage'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY / HOD VIEW: Mark Attendance Form */}
      {!isStudent && activeSubTab === 'mark' && (
        <div className="space-y-6">
          
          {/* Section 1: Today's Assigned Teaching Periods & Substitutions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Today's Teaching Schedule & Confirmed Substitutions
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Instructor: <strong className="text-slate-900">{currentUser?.name}</strong> • Select an assigned period to record attendance:
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Session Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />
              </div>
            </div>

            {assignedPeriods.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500 font-medium">
                No scheduled periods found for this date under your faculty profile. You may select parameters manually below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {assignedPeriods.map((p) => {
                  const isSelected = selectedPeriod === p.period && String(selectedBatchId) === String(p.batchId);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPeriodCard(p)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Period {p.period}
                        </span>
                        {p.isSubstitution ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            ★ Substitute
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {p.room || 'CR-101'}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">{p.subjectName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                        <span>{p.batchName}</span>
                        {p.isAlreadyMarked ? (
                          <span className="text-[10px] font-bold text-emerald-600">✓ Marked</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Pending</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Lecture Slot Parameters Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Slot Parameters {isSubstitutePeriod && <span className="text-purple-600 ml-1 font-bold">(Official Substitution Active)</span>}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Batch / Section</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                >
                  {(dataset?.batches || []).map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course / Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                >
                  {(dataset?.subjects || []).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Period Slot</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
                >
                  {[1, 2, 3, 5, 6, 7].map(p => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Session Stats Bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <div className="flex items-center space-x-3 text-xs">
                <span className="font-semibold text-slate-600">Total Enrolled: <strong className="text-slate-900">{batchStudents.length}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-emerald-600">Present: <strong>{presentCount}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-indigo-600">On-Duty: <strong>{onDutyCount}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-rose-600">Absent: <strong>{absentCount}</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  ✓ Mark All Present
                </button>
              </div>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Student Roster Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Attendance Sheet ({batchStudents.length} Students)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle student status between Present, Late, and Absent for this lecture session.</p>
              </div>
              <button
                onClick={handleSubmitAttendance}
                disabled={isLoading || batchStudents.length === 0}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all shrink-0 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Saving...' : 'Submit Attendance'}</span>
              </button>
            </div>

            {/* Table Toolbar */}
            <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Filter student name or roll number..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
                {rosterSearch && (
                  <button
                    onClick={() => setRosterSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 text-xs">
                  {['all', 'Present', 'On-Duty', 'Absent'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        statusFilter === st
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'all' ? 'All' : st}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Showing {filteredBatchStudents.length} of {batchStudents.length}
                </span>
              </div>
            </div>

            {/* Approved Leave Policy Banner */}
            <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/50 flex items-center justify-between text-[11px] text-amber-900 font-medium">
              <span>💡 <strong>Academic Rule:</strong> Approved student leave applications do not automatically grant present status. Mark as 'Absent' or 'On-Duty' per departmental guidelines.</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">UGC Bar: 75%</span>
            </div>

            {batchStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No students enrolled in this section yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3.5 pl-5 w-16">#</th>
                      <th className="p-3.5 w-36">Roll Number</th>
                      <th className="p-3.5">Student Details</th>
                      <th className="p-3.5 text-center">Historical %</th>
                      <th className="p-3.5 text-center w-72">Status for This Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBatchStudents.map((std, idx) => {
                      const curStatus = studentStatuses[std.studentId] || 'Present';
                      const approvedLeave = approvedLeavesMap[std.studentId];
                      return (
                        <tr key={std.studentId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 pl-5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-mono font-bold text-blue-600">{std.rollNo}</td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900">{std.name}</span>
                              {approvedLeave && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  🏖 Approved Leave ({approvedLeave.leaveType || 'General'})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">{std.email}</div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-extrabold text-slate-900">{std.percentage}%</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'Present')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  curStatus === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'On-Duty')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  curStatus === 'On-Duty'
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                On-Duty
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'Absent')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  curStatus === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY VIEW */}
      {!isStudent && activeSubTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Attendance</span>
              <div className="my-2 text-4xl font-extrabold text-slate-900 font-mono">
                {attendanceSummary?.averageDepartmentAttendance ?? 88}%
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">Across all active lectures and computer laboratories</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions Recorded</span>
              <div className="my-2 text-4xl font-extrabold text-blue-600 font-mono">
                {attendanceSummary?.totalSessionsMarked ?? 3}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Logged in current academic term</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
              <p className="text-xs text-slate-500 mt-0.5">Historical sessions recorded by course instructors.</p>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {(attendanceSummary?.sessions || []).map(sess => (
                <div key={sess.id} className="p-4 hover:bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{sess.subjectName} ({sess.subjectCode})</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-100">
                        Period {sess.period}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Marked by {sess.markedByFacultyName} • {sess.date} ({sess.day})
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                      {sess.records.filter(r => r.status === 'Present' || r.status === 'Late').length} Present
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold border border-rose-100">
                      {sess.records.filter(r => r.status === 'Absent').length} Absent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
