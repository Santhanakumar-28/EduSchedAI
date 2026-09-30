import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Award,
  AlertTriangle,
  Save,
  Check,
  Filter,
  Search,
  X
} from 'lucide-react';

export default function AttendanceView({ currentUser, dataset }) {
  const isStudent = currentUser?.role === 'Student';
  const isHOD = currentUser?.role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;

  // Active sub-tab for Faculty/HOD: 'mark' or 'summary'
  const [activeSubTab, setActiveSubTab] = useState(isStudent ? 'student_view' : 'mark');
  
  // Student Course Search & Eligibility Filter
  const [courseSearch, setCourseSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all'); // 'all', 'eligible', 'shortage'

  // Faculty Roster Search & Status Filter
  const [rosterSearch, setRosterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Present', 'Absent', 'Late'

  // Selection states for marking attendance
  const [selectedBatchId, setSelectedBatchId] = useState(
    currentUser?.coordinatedBatchId || dataset?.batches?.[0]?._id || 'batch_1'
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    dataset?.subjects?.[0]?._id || 'subj_1'
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Student roster for selected batch
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [studentPersonalStats, setStudentPersonalStats] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Load batch roster
  const loadBatchRoster = async (batchId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/attendance/batch/${batchId}`);
      const json = await res.json();
      if (json.success) {
        setBatchStudents(json.data.students || []);
        // Initialize default status to 'Present' for all students
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

  // Load overall attendance summary
  const loadSummary = async () => {
    try {
      const url = isStudent 
        ? `/api/attendance/summary?studentId=${currentUser.id}` 
        : `/api/attendance/summary`;
      const res = await fetch(url);
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

  useEffect(() => {
    if (!isStudent) {
      loadBatchRoster(selectedBatchId);
      loadSummary();
    } else {
      loadSummary();
    }
  }, [selectedBatchId, isStudent]);

  // Handle status toggle for a student
  const handleStatusChange = (studentId, status) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Mark all as present
  const handleMarkAllPresent = () => {
    const updated = {};
    batchStudents.forEach(s => {
      updated[s.studentId] = 'Present';
    });
    setStudentStatuses(updated);
  };

  // Submit attendance session
  const handleSubmitAttendance = async () => {
    try {
      setIsLoading(true);
      const records = batchStudents.map(s => ({
        studentId: s.studentId,
        rollNo: s.rollNo,
        name: s.name,
        status: studentStatuses[s.studentId] || 'Present'
      }));

      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          subjectId: selectedSubjectId,
          date: selectedDate,
          period: selectedPeriod,
          markedByFacultyId: currentUser?.facultyId || 'fac_1',
          records
        })
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccessMsg(json.message);
        loadBatchRoster(selectedBatchId);
        loadSummary();
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        alert(json.message || 'Error saving attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-display flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
              Academic Attendance Management
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              UGC Minimum 75% Rule Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isStudent 
              ? 'Real-time record of your session attendance, exam eligibility thresholds, and course statistics.' 
              : 'Record student attendance by lecture slot, monitor section absenteeism, and maintain audit records.'}
          </p>
        </div>

        {/* Sub-tab Navigation for Faculty/HOD */}
        {!isStudent && (
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('mark')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeSubTab === 'mark'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📝 Mark Attendance
            </button>
            <button
              onClick={() => setActiveSubTab('summary')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeSubTab === 'summary'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Section Trends & History
            </button>
          </div>
        )}
      </div>

      {/* STUDENT VIEW: Personal Attendance Overview & Breakdown */}
      {isStudent && (
        <div className="space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Overall Attendance */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Attendance</span>
              <div className="my-2 flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900 font-display">
                  {studentPersonalStats?.percentage ?? 88}%
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  (studentPersonalStats?.percentage ?? 88) >= 75
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {(studentPersonalStats?.percentage ?? 88) >= 75 ? 'Eligible for Exams' : 'Attendance Shortage'}
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

            {/* Classes Attended */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sessions Attended</span>
              <div className="my-2">
                <span className="text-4xl font-black text-indigo-700 font-display">
                  {studentPersonalStats?.attended ?? 17}
                </span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">
                  / {studentPersonalStats?.totalSessions ?? 20} Lectures
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Verified by Department RFID/Faculty Roster</p>
            </div>

            {/* Threshold Benchmark */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Requirement</span>
              <div className="my-2">
                <span className="text-4xl font-black text-slate-900 font-display">75%</span>
                <span className="text-xs text-amber-700 font-bold ml-1.5">Minimum Bar</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Students below 75% require HOD condonation</p>
            </div>

          </div>

          {/* Subject-Wise Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Course-Wise Attendance Breakdown</h2>
              <p className="text-xs text-slate-500">Continuous tracking across all theoretical courses and laboratory practicals.</p>
            </div>

            {/* Course Search & Filter Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course code or title..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {courseSearch && (
                  <button
                    onClick={() => setCourseSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => setCourseFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      courseFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Courses
                  </button>
                  <button
                    onClick={() => setCourseFilter('eligible')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      courseFilter === 'eligible'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Eligible (≥75%)
                  </button>
                  <button
                    onClick={() => setCourseFilter('shortage')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      courseFilter === 'shortage'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Shortage (&lt;75%)
                  </button>
                </div>

                {(courseSearch || courseFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setCourseSearch('');
                      setCourseFilter('all');
                    }}
                    className="px-2 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3.5 pl-5">Course Code</th>
                    <th className="p-3.5">Subject Title</th>
                    <th className="p-3.5 text-center">Attended / Total</th>
                    <th className="p-3.5 text-center">Percentage</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((studentPersonalStats?.subjectBreakdown || []).filter((sub) => {
                    if (courseFilter === 'eligible' && sub.percentage < 75) return false;
                    if (courseFilter === 'shortage' && sub.percentage >= 75) return false;
                    if (courseSearch.trim()) {
                      const q = courseSearch.toLowerCase().trim();
                      const codeMatch = sub.subjectCode?.toLowerCase().includes(q);
                      const nameMatch = sub.subjectName?.toLowerCase().includes(q);
                      if (!codeMatch && !nameMatch) return false;
                    }
                    return true;
                  })).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        No courses found matching criteria.
                      </td>
                    </tr>
                  ) : (studentPersonalStats?.subjectBreakdown || []).filter((sub) => {
                    if (courseFilter === 'eligible' && sub.percentage < 75) return false;
                    if (courseFilter === 'shortage' && sub.percentage >= 75) return false;
                    if (courseSearch.trim()) {
                      const q = courseSearch.toLowerCase().trim();
                      const codeMatch = sub.subjectCode?.toLowerCase().includes(q);
                      const nameMatch = sub.subjectName?.toLowerCase().includes(q);
                      if (!codeMatch && !nameMatch) return false;
                    }
                    return true;
                  }).map((sub, idx) => (

                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-indigo-700">{sub.subjectCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{sub.subjectName}</td>
                      <td className="p-3.5 text-center font-semibold text-slate-700">
                        {sub.attended} / {sub.total}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-extrabold text-sm text-slate-900">{sub.percentage}%</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          sub.percentage >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
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
          
          {/* Session Selector Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Class & Lecture Slot</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Batch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Batch / Section</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {(dataset?.batches || []).map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {(dataset?.subjects || []).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Period Slot Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period Slot</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 5, 6, 7].map(p => (
                    <option key={p} value={p}>
                      Period {p} {p === 1 ? '(09:00 - 09:50)' : p === 2 ? '(09:50 - 10:40)' : p === 3 ? '(10:40 - 11:30)' : p === 5 ? '(12:20 - 01:10)' : p === 6 ? '(01:10 - 02:00)' : '(02:00 - 02:50)'}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Instructor: <strong className="text-slate-900">{currentUser.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/60 transition-all"
              >
                ✓ Mark All Present
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Student Roster Marking Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Attendance Sheet ({batchStudents.length} Students)</h3>
                <p className="text-xs text-slate-500">Toggle student status between Present, Absent, and Late for this lecture session.</p>
              </div>
              <button
                onClick={handleSubmitAttendance}
                disabled={isLoading || batchStudents.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950/20 flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Saving...' : 'Submit Attendance'}</span>
              </button>
            </div>

            {/* Faculty Roster Search & Filter Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search student name or roll number..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
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
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({batchStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Present')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      statusFilter === 'Present'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present ({batchStudents.filter(s => (studentStatuses[s.studentId] || 'Present') === 'Present').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Late')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      statusFilter === 'Late'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Late ({batchStudents.filter(s => studentStatuses[s.studentId] === 'Late').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Absent')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      statusFilter === 'Absent'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent ({batchStudents.filter(s => studentStatuses[s.studentId] === 'Absent').length})
                  </button>
                </div>

                {(rosterSearch || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setRosterSearch('');
                      setStatusFilter('all');
                    }}
                    className="px-2 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {batchStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No students enrolled in this section yet. The Class Coordinator can add students from the Manage Students panel.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="p-3.5 pl-5 w-16">#</th>
                      <th className="p-3.5 w-32">Roll Number</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5 text-center">Historical %</th>
                      <th className="p-3.5 text-center w-72">Status for This Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((batchStudents.filter((std) => {
                      const curStatus = studentStatuses[std.studentId] || 'Present';
                      if (statusFilter !== 'all' && curStatus !== statusFilter) return false;
                      if (rosterSearch.trim()) {
                        const q = rosterSearch.toLowerCase().trim();
                        const matchName = std.name?.toLowerCase().includes(q);
                        const matchRoll = std.rollNo?.toLowerCase().includes(q);
                        if (!matchName && !matchRoll) return false;
                      }
                      return true;
                    }))).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          No students match the search and status filter.
                        </td>
                      </tr>
                    ) : (batchStudents.filter((std) => {
                      const curStatus = studentStatuses[std.studentId] || 'Present';
                      if (statusFilter !== 'all' && curStatus !== statusFilter) return false;
                      if (rosterSearch.trim()) {
                        const q = rosterSearch.toLowerCase().trim();
                        const matchName = std.name?.toLowerCase().includes(q);
                        const matchRoll = std.rollNo?.toLowerCase().includes(q);
                        if (!matchName && !matchRoll) return false;
                      }
                      return true;
                    })).map((std, idx) => {

                      const curStatus = studentStatuses[std.studentId] || 'Present';
                      return (
                        <tr key={std.studentId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 pl-5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-mono font-bold text-indigo-700">{std.rollNo}</td>
                          <td className="p-3.5 font-bold text-slate-900">{std.name}</td>
                          <td className="p-3.5 text-center">
                            <span className="font-extrabold text-slate-900">{std.percentage}%</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'Present')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  curStatus === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'Late')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  curStatus === 'Late'
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(std.studentId, 'Absent')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
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

      {/* FACULTY / HOD VIEW: Historical Summary */}
      {!isStudent && activeSubTab === 'summary' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Attendance</span>
              <div className="my-2 text-4xl font-black text-slate-900 font-display">
                {attendanceSummary?.averageDepartmentAttendance ?? 88}%
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">Across all active lectures and computer laboratories</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sessions Recorded</span>
              <div className="my-2 text-4xl font-black text-indigo-700 font-display">
                {attendanceSummary?.totalSessionsMarked ?? 3}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Logged in current academic term</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
              <p className="text-xs text-slate-500">Historical sessions recorded by course instructors.</p>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {(attendanceSummary?.sessions || []).map(sess => (
                <div key={sess.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{sess.subjectName} ({sess.subjectCode})</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        Period {sess.period}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Marked by {sess.markedByFacultyName} • {sess.date} ({sess.day})
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700">
                    <span className="text-emerald-700 font-bold">
                      {sess.records.filter(r => r.status === 'Present' || r.status === 'Late').length} Present
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-700 font-bold">
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
