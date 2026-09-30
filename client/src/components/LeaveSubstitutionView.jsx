import React, { useState, useEffect } from 'react';
import { 
  UserMinus, 
  Search, 
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  Award, 
  Clock, 
  BookOpen,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  FileText,
  Check,
  X,
  Plus,
  Filter
} from 'lucide-react';

export default function LeaveSubstitutionView({ currentUser, dataset, schedule, onAssignSubstitute }) {
  const isHOD = currentUser?.role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;
  const canApprove = isHOD || isCoordinator;

  const faculty = dataset?.faculty || [];
  const subjects = dataset?.subjects || [];
  const days = dataset?.config?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'apply', 'matcher'
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Leave Search & Filters (All Roles)
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All'); // 'All', 'Pending', 'Approved', 'Rejected'
  const [leaveDayFilter, setLeaveDayFilter] = useState('All'); // 'All', 'Monday', ...

  const isLeaveFilterActive = leaveSearch.trim() !== '' || leaveStatusFilter !== 'All' || leaveDayFilter !== 'All';

  const filteredLeaveRequests = leaveRequests.filter((leave) => {
    if (leaveStatusFilter !== 'All' && leave.status !== leaveStatusFilter) {
      return false;
    }
    if (leaveDayFilter !== 'All' && leave.day !== leaveDayFilter) {
      return false;
    }
    if (leaveSearch.trim()) {
      const q = leaveSearch.toLowerCase().trim();
      const matchFaculty = leave.facultyName?.toLowerCase().includes(q);
      const matchSubject = leave.subjectName?.toLowerCase().includes(q);
      const matchReason = leave.reason?.toLowerCase().includes(q);
      const matchSub = leave.assignedSubstituteName?.toLowerCase().includes(q);
      if (!matchFaculty && !matchSubject && !matchReason && !matchSub) {
        return false;
      }
    }
    return true;
  });

  // Form state for applying leave
  const [applyDay, setApplyDay] = useState('Monday');
  const [applyPeriod, setApplyPeriod] = useState(1);
  const [applyDate, setApplyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [applySubject, setApplySubject] = useState(subjects[0]?.name || 'Operating Systems');
  const [applyReason, setApplyReason] = useState('');

  // Matcher state (manual simulation)
  const [simFacultyId, setSimFacultyId] = useState(faculty[0]?._id || '');
  const [simDay, setSimDay] = useState('Monday');
  const [simPeriod, setSimPeriod] = useState(1);
  const [simSubjectId, setSimSubjectId] = useState(subjects[0]?._id || '');
  const [substitutionResults, setSubstitutionResults] = useState(null);

  const loadLeaveRequests = async () => {
    try {
      const res = await fetch('/api/leaves/requests');
      const json = await res.json();
      if (json.success) {
        setLeaveRequests(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  // Handle Apply for Leave
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyReason.trim()) {
      alert('Please specify a reason for your leave.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: currentUser?.facultyId || 'fac_2',
          facultyName: currentUser.name,
          day: applyDay,
          period: Number(applyPeriod),
          date: applyDate,
          subjectName: applySubject,
          batchName: 'CSE Section A',
          reason: applyReason
        })
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage('Leave application submitted successfully for HOD/Coordinator approval.');
        setApplyReason('');
        loadLeaveRequests();
        setActiveTab('requests');
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.message || 'Error submitting leave');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting leave');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Approve or Reject
  const handleDecision = async (leaveId, decision, substituteFacultyId = null) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/leaves/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId,
          decision,
          substituteFacultyId,
          decisionBy: `${currentUser.name} (${currentUser.role})`
        })
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Leave request has been marked as ${decision}.`);
        loadLeaveRequests();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.message || 'Error updating leave');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run candidate substitute scanner
  const handleFindSubstitutes = async () => {
    setIsLoading(true);
    setSubstitutionResults(null);

    try {
      const response = await fetch('/api/leaves/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facultyId: simFacultyId,
          day: simDay,
          period: Number(simPeriod),
          subjectId: simSubjectId
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubstitutionResults(data);
      }
    } catch (err) {
      console.error(err);
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
              <UserMinus className="w-5 h-5 mr-2 text-indigo-600" />
              Faculty Leave & Dynamic Substitution
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Zero-Clash Candidate Scanner
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage faculty absence applications, evaluate algorithmic replacement suggestions, and approve substitutions without schedule conflicts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'requests'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Leave Queue & History ({leaveRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'apply'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✍️ Apply for Leave
          </button>
          <button
            onClick={() => setActiveTab('matcher')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'matcher'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧠 AI Substitute Matcher
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: LEAVE QUEUE & HISTORY */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faculty Leave Applications & Substitute Allocations</h3>
              <p className="text-xs text-slate-500">Track pending absence requests, approved substitutions, and coordinator review decisions.</p>
            </div>
          </div>

          {/* Leave Search & Filter Toolbar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                placeholder="Search applicant faculty, subject, reason..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {leaveSearch && (
                <button
                  onClick={() => setLeaveSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeaveStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      leaveStatusFilter === st
                        ? st === 'Pending' 
                          ? 'bg-amber-600 text-white' 
                          : st === 'Approved'
                            ? 'bg-emerald-600 text-white'
                            : st === 'Rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <select
                value={leaveDayFilter}
                onChange={(e) => setLeaveDayFilter(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Days</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {isLeaveFilterActive && (
                <button
                  onClick={() => {
                    setLeaveSearch('');
                    setLeaveStatusFilter('All');
                    setLeaveDayFilter('All');
                  }}
                  className="px-2 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}

              <span className="text-[11px] font-bold text-slate-500 ml-1">
                {filteredLeaveRequests.length} of {leaveRequests.length}
              </span>
            </div>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No leave applications recorded in current term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="p-3.5 pl-5">Applicant Faculty</th>
                    <th className="p-3.5">Slot / Date</th>
                    <th className="p-3.5">Course & Batch</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Assigned Substitute</th>
                    <th className="p-3.5 text-center">Status</th>
                    {canApprove && <th className="p-3.5 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={canApprove ? 7 : 6} className="p-8 text-center text-slate-400">
                        No leave requests found matching the search and status filter.
                      </td>
                    </tr>
                  ) : filteredLeaveRequests.map(leave => (

                    <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-slate-900">{leave.facultyName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{leave.cadre}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <div>{leave.date} ({leave.day})</div>
                        <div className="text-indigo-700 font-bold font-mono">Period {leave.period}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div>{leave.subjectName}</div>
                        <div className="text-[10px] text-slate-500">{leave.batchName}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs">{leave.reason}</td>
                      <td className="p-3.5">
                        {leave.substituteFacultyName ? (
                          <div className="font-bold text-emerald-800 flex items-center">
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            {leave.substituteFacultyName}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : leave.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="p-3.5 text-center">
                          {leave.status === 'Pending' ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleDecision(leave.id, 'Approved', 'fac_6')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs"
                                title="Approve & Assign Qualified Substitute"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecision(leave.id, 'Rejected')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px]"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Decision by {leave.decisionBy || 'Admin'}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLY FOR LEAVE FORM */}
      {activeTab === 'apply' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
              Submit Faculty Leave Application
            </h3>
            <p className="text-xs text-slate-500">
              The AI Engine will automatically find non-busy, subject-qualified substitute instructors for your slot.
            </p>
          </div>

          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Applicant Instructor</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser.name} ({currentUser.role})</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Date</label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={(e) => setApplyDate(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={applyDay}
                  onChange={(e) => setApplyDay(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Period Slot</label>
                <select
                  value={applyPeriod}
                  onChange={(e) => setApplyPeriod(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {[1, 2, 3, 5, 6, 7].map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Course</label>
                <input
                  type="text"
                  required
                  value={applySubject}
                  onChange={(e) => setApplySubject(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Absence</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Attending International Conference on Machine Learning / Medical Leave..."
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                className="w-full text-xs font-normal rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-950/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AI SUBSTITUTE MATCHER */}
      {activeTab === 'matcher' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulate Unavailability & Scan Replacements</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty on Leave</label>
                <select
                  value={simFacultyId}
                  onChange={(e) => setSimFacultyId(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {faculty.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.cadre})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Day</label>
                <select
                  value={simDay}
                  onChange={(e) => setSimDay(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Period Slot</label>
                <select
                  value={simPeriod}
                  onChange={(e) => setSimPeriod(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {[1, 2, 3, 5, 6, 7].map(p => (
                    <option key={p} value={p}>Period {p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={simSubjectId}
                  onChange={(e) => setSimSubjectId(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900"
                >
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleFindSubstitutes}
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {isLoading ? 'Scanning Candidates...' : 'Run Candidate Scanner'}
            </button>
          </div>

          {substitutionResults && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Recommended Substitutes for {substitutionResults.facultyOnLeave}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Filtered {substitutionResults.totalSubstitutesAvailable} instructors with zero schedule clashes at {simDay}, Period {simPeriod}.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {(substitutionResults.recommendedSubstitutes || []).map((sub, idx) => (
                  <div key={sub.facultyId} className="p-4 hover:bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        {sub.isQualified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            ✓ Domain Match
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">{sub.cadre}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Current Weekly Load: <strong>{sub.assignedHours}h</strong> / Target: {sub.targetHours}h • Availability Margin: {sub.loadAvailabilityScore}h
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Substitute assigned: ${sub.name} for ${substitutionResults.facultyOnLeave}`)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Assign Candidate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
