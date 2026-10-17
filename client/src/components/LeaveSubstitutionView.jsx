import React, { useState, useEffect } from 'react';
import { 
  UserMinus, 
  Search, 
  CheckCircle2, 
  UserCheck,
  Calendar,
  X,
  Sparkles,
  Clock,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '../api';

export default function LeaveSubstitutionView({ currentUser, dataset, schedule, onAssignSubstitute }) {
  const isHOD = currentUser?.role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;
  const canApprove = isHOD || isCoordinator;

  const faculty = dataset?.faculty || [];
  const subjects = dataset?.subjects || [];
  const days = dataset?.config?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const [activeTab, setActiveTab] = useState('requests');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Leave Search & Filters
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');
  const [leaveDayFilter, setLeaveDayFilter] = useState('All');

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

  const isStudent = currentUser?.role === 'Student';

  // Form state for applying leave (Faculty)
  const [applyDay, setApplyDay] = useState('Monday');
  const [applyPeriod, setApplyPeriod] = useState(1);
  const [applyDate, setApplyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [applySubject, setApplySubject] = useState(subjects[0]?.name || 'Operating Systems');
  const [applyReason, setApplyReason] = useState('');

  // Form state for applying HOD Leave
  const [hodStartDate, setHodStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hodEndDate, setHodEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hodLeaveType, setHodLeaveType] = useState('Academic');
  const [hodReason, setHodReason] = useState('');

  // Form state for applying Student Leave
  const [studentStartDate, setStudentStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentEndDate, setStudentEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [studentLeaveType, setStudentLeaveType] = useState('Medical');
  const [studentReason, setStudentReason] = useState('');
  const [studentAttachmentNote, setStudentAttachmentNote] = useState('');

  // Atomic Multi-Slot Substitution Modal State
  const [showAtomicModal, setShowAtomicModal] = useState(false);
  const [selectedAtomicLeave, setSelectedAtomicLeave] = useState(null);
  const [atomicAffectedData, setAtomicAffectedData] = useState(null);
  const [atomicAllocations, setAtomicAllocations] = useState({});
  const [isAtomicLoading, setIsAtomicLoading] = useState(false);
  const [atomicError, setAtomicError] = useState(null);

  // Matcher state
  const [simFacultyId, setSimFacultyId] = useState(faculty[0]?._id || '');
  const [simDay, setSimDay] = useState('Monday');
  const [simPeriod, setSimPeriod] = useState(1);
  const [simSubjectId, setSimSubjectId] = useState(subjects[0]?._id || '');
  const [substitutionResults, setSubstitutionResults] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('edusched_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadLeaveRequests = async () => {
    try {
      const res = await apiFetch('/api/leaves/requests', {
        headers: getAuthHeaders()
      });
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

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyReason.trim()) {
      alert('Please specify a reason for your leave.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          facultyId: currentUser?.facultyId || 'fac_2',
          facultyName: currentUser?.name || 'Faculty Member',
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
        setStatusMessage('Leave application submitted successfully for review.');
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

  // Submit HOD Leave
  const handleApplyHodLeave = async (e) => {
    e.preventDefault();
    if (!hodReason.trim()) {
      alert('Please specify a reason for leave.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/hod-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          startDate: hodStartDate,
          endDate: hodEndDate,
          leaveType: hodLeaveType,
          reason: hodReason
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        setHodReason('');
        setActiveTab('requests');
        loadLeaveRequests();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        alert(json.message || 'Error submitting HOD leave');
      }
    } catch (err) {
      alert('Error submitting HOD leave: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Student Leave
  const handleApplyStudentLeave = async (e) => {
    e.preventDefault();
    if (!studentReason.trim()) {
      alert('Please provide a reason for leave.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          startDate: studentStartDate,
          endDate: studentEndDate,
          date: studentStartDate,
          leaveType: studentLeaveType,
          reason: `${studentReason}${studentAttachmentNote ? ` [Ref: ${studentAttachmentNote}]` : ''}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        setStudentReason('');
        setStudentAttachmentNote('');
        setActiveTab('requests');
        loadLeaveRequests();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        alert(json.message || 'Error submitting student leave');
      }
    } catch (err) {
      alert('Error submitting student leave: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Multi-Slot Atomic Substitution Review Modal for HOD
  const handleOpenAtomicModal = async (leave) => {
    try {
      setIsLoading(true);
      setSelectedAtomicLeave(leave);
      setAtomicError(null);
      const res = await apiFetch(`/api/leaves/affected-periods/${leave.id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        setAtomicAffectedData(json.data);
        const initMap = {};
        (json.data.affectedPeriods || []).forEach(p => {
          const best = (p.candidateSubstitutes || [])[0];
          initMap[`${p.day}_${p.period}_${p.batchId}`] = best?.facultyId || '';
        });
        setAtomicAllocations(initMap);
        setShowAtomicModal(true);
      } else {
        alert(json.message || 'Could not fetch affected periods');
      }
    } catch (err) {
      alert('Error fetching affected periods: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Atomic Approval
  const handleConfirmAtomicApproval = async () => {
    if (!atomicAffectedData || !selectedAtomicLeave) return;
    const periods = atomicAffectedData.affectedPeriods || [];
    const allocationsPayload = [];

    for (const p of periods) {
      const key = `${p.day}_${p.period}_${p.batchId}`;
      const subId = atomicAllocations[key];
      if (!subId) {
        setAtomicError(`Incomplete Coverage: Period ${p.period} (${p.batchName}) has no designated substitute.`);
        return;
      }
      allocationsPayload.push({
        period: p.period,
        day: p.day,
        date: p.date,
        batchId: p.batchId,
        subjectId: p.subjectId,
        substituteFacultyId: subId
      });
    }

    try {
      setIsAtomicLoading(true);
      setAtomicError(null);
      const res = await apiFetch('/api/leaves/atomic-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          leaveId: selectedAtomicLeave.id,
          allocations: allocationsPayload
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        setShowAtomicModal(false);
        setSelectedAtomicLeave(null);
        loadLeaveRequests();
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setAtomicError(json.message || 'Atomic approval failed');
      }
    } catch (err) {
      setAtomicError(err.message);
    } finally {
      setIsAtomicLoading(false);
    }
  };

  // Request Clarification for Class Coordinator
  const handleRequestClarification = async (leaveId) => {
    const note = prompt('Enter clarification request details for the student:');
    if (!note || !note.trim()) return;
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          leaveId,
          decision: 'Clarification Requested',
          reviewComment: note.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('Clarification request sent to student.');
        loadLeaveRequests();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(json.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (leaveId, decision, substituteFacultyId = null, reviewComment = '') => {
    try {
      setIsLoading(true);
      const res = await apiFetch('/api/leaves/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          leaveId,
          decision,
          substituteFacultyId,
          reviewComment,
          decisionBy: `${currentUser?.name} (${currentUser?.role})`
        })
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage(`Leave request marked as ${decision}.`);
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

  const handleFindSubstitutes = async () => {
    setIsLoading(true);
    setSubstitutionResults(null);

    try {
      const response = await apiFetch('/api/leaves/substitute', {
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserMinus className="w-5 h-5" />
            </div>
            <span>Faculty Leave & Dynamic Substitution</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage faculty absence applications, evaluate algorithmic replacement suggestions, and approve substitutions without schedule conflicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Zero-Clash Scanner Active
          </span>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs shrink-0">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'requests'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              📋 {isStudent ? 'My Leave Applications' : `Queue (${leaveRequests.length})`}
            </button>
            {isHOD && (
              <button
                onClick={() => setActiveTab('hod_apply')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'hod_apply'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                🏛 Apply HOD Leave
              </button>
            )}
            {isStudent ? (
              <button
                onClick={() => setActiveTab('apply_student')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'apply_student'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                ✍️ Submit Leave Request
              </button>
            ) : !isHOD ? (
              <button
                onClick={() => setActiveTab('apply')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'apply'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                ✍️ Apply Leave
              </button>
            ) : null}
            {!isStudent && (
              <button
                onClick={() => setActiveTab('matcher')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'matcher'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                🧠 AI Substitute Matcher
              </button>
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: QUEUE */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Faculty Leave Applications & Substitute Allocations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track pending absence requests, approved substitutions, and coordinator review decisions.</p>
          </div>

          {/* Filter Toolbar */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                placeholder="Search applicant faculty, subject, reason..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
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
              <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
                {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeaveStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      leaveStatusFilter === st
                        ? st === 'Pending' 
                          ? 'bg-amber-500 text-white font-bold shadow-2xs' 
                          : st === 'Approved'
                            ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                            : st === 'Rejected'
                              ? 'bg-rose-600 text-white font-bold shadow-2xs'
                              : 'bg-blue-600 text-white font-bold shadow-2xs'
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
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="h-8 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center transition-colors"
                >
                  <X className="w-3 h-3 mr-1" /> Reset
                </button>
              )}

              <span className="text-[11px] font-bold text-slate-400 ml-1">
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
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
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
                        <div className="font-bold text-slate-900">
                          {leave.applicantType === 'Student' ? leave.studentName : leave.facultyName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {leave.applicantType === 'Student'
                            ? `Student (${leave.studentRollNo || 'Roll'})`
                            : leave.cadre || 'Faculty'}
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <div>{leave.date || leave.startDate} {leave.day ? `(${leave.day})` : ''}</div>
                        {leave.period && (
                          <div className="text-blue-600 font-bold font-mono">Period {leave.period}</div>
                        )}
                        {leave.leaveType && (
                          <span className="text-[10px] text-slate-400 font-semibold">{leave.leaveType} Leave</span>
                        )}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div>{leave.subjectName || 'Enrolled Subjects'}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{leave.batchName || 'General'}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs">{leave.reason}</td>
                      <td className="p-3.5">
                        {leave.substituteFacultyName ? (
                          <div className="font-bold text-emerald-700 flex items-center">
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            {leave.substituteFacultyName}
                          </div>
                        ) : leave.applicantType === 'Student' ? (
                          <span className="text-slate-400 italic">N/A (Student)</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : leave.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : leave.status === 'Clarification Requested'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="p-3.5 text-center">
                          {leave.status === 'Pending' ? (
                            leave.applicantType === 'Faculty' && String(leave.facultyId) === String(currentUser?.facultyId) ? (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                                Self-Application (Pending HOD Review)
                              </span>
                            ) : leave.applicantType === 'Student' ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => handleDecision(leave.id, 'Approved')}
                                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRequestClarification(leave.id)}
                                  className="h-7 px-2.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-bold text-[11px] rounded-lg transition-colors"
                                  title="Request clarification or additional certificates from student"
                                >
                                  Clarify
                                </button>
                                <button
                                  onClick={() => handleDecision(leave.id, 'Rejected')}
                                  className="h-7 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1.5">
                                {isHOD ? (
                                  <button
                                    onClick={() => handleOpenAtomicModal(leave)}
                                    className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors flex items-center space-x-1"
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    <span>Assign Substitutes</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleDecision(leave.id, 'Approved', leave.substituteFacultyId || 'fac_6')}
                                    className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors"
                                  >
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDecision(leave.id, 'Rejected')}
                                  className="h-7 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-[11px] rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="text-[10px] text-slate-500">
                              <div>Decision by {leave.decisionBy || 'Authority'}</div>
                              {leave.reviewComment && (
                                <div className="text-[9px] text-slate-400 italic mt-0.5">"{leave.reviewComment}"</div>
                              )}
                            </div>
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

      {/* TAB 2: APPLY FOR LEAVE */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-xl mx-auto space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Submit Faculty Leave Application
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              The AI Engine will automatically find non-busy, subject-qualified substitute instructors for your slot.
            </p>
          </div>

          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant Instructor</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name} ({currentUser?.role})</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Date</label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={(e) => setApplyDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                <select
                  value={applyDay}
                  onChange={(e) => setApplyDay(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Absence</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Attending International Conference / Medical Leave..."
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2B: APPLY FOR HOD LEAVE */}
      {activeTab === 'hod_apply' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-xl mx-auto space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Submit HOD Leave Application to Admin / HR
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Department Head leaves require Administrator approval. Dean / Admin will assign an Acting Department Head during your absence.
            </p>
          </div>

          <form onSubmit={handleApplyHodLeave} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant Department Head</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name} (Department HOD)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={hodStartDate}
                  onChange={(e) => setHodStartDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={hodEndDate}
                  onChange={(e) => setHodEndDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
              <select
                value={hodLeaveType}
                onChange={(e) => setHodLeaveType(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Academic">Academic / Research Conference</option>
                <option value="Casual">Casual / Personal Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Official Duty">Official University Duty / Accreditation Visit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Reason</label>
              <textarea
                required
                rows={3}
                placeholder="Explain the purpose of absence and suggested handover details..."
                value={hodReason}
                onChange={(e) => setHodReason(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 text-[11px] leading-relaxed">
              <strong>College Policy:</strong> Admin will designate an Acting Department Head from senior Professors to maintain administrative approvals and timetable governance.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit to Administrator / Dean'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2C: APPLY FOR STUDENT LEAVE */}
      {activeTab === 'apply_student' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 max-w-xl mx-auto space-y-5 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Submit Student Leave Application
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your leave application will be reviewed directly by your designated Class Coordinator.
            </p>
          </div>

          <form onSubmit={handleApplyStudentLeave} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant Student</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name} ({currentUser?.rollNo || 'Roll No'})</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={studentStartDate}
                  onChange={(e) => setStudentStartDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={studentEndDate}
                  onChange={(e) => setStudentEndDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
              <select
                value={studentLeaveType}
                onChange={(e) => setStudentLeaveType(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Medical">Medical Leave / Illness</option>
                <option value="Academic OD">Academic On-Duty (Hackathon / Symposium / Project)</option>
                <option value="Personal">Personal / Family Obligation</option>
                <option value="Sports">Sports / Cultural Representation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason & Description</label>
              <textarea
                required
                rows={3}
                placeholder="State the reason clearly for your class coordinator's assessment..."
                value={studentReason}
                onChange={(e) => setStudentReason(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Optional Certificate Reference / Attachment ID</label>
              <input
                type="text"
                placeholder="e.g. Doctor Certificate #MED-2026-88 or Event Letter Reference"
                value={studentAttachmentNote}
                onChange={(e) => setStudentAttachmentNote(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Attendance Note:</strong> Approved student leaves do not automatically count as present. Class Coordinator may recommend attendance condonation based on institutional limits.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit to Class Coordinator'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MATCHER */}
      {activeTab === 'matcher' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulate Unavailability & Scan Replacements</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty on Leave</label>
                <select
                  value={simFacultyId}
                  onChange={(e) => setSimFacultyId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Scanning Candidates...' : 'Run Candidate Scanner'}</span>
            </button>
          </div>

          {substitutionResults && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Recommended Substitutes for {substitutionResults.facultyOnLeave}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filtered {substitutionResults.totalSubstitutesAvailable} instructors with zero schedule clashes at {simDay}, Period {simPeriod}.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {(substitutionResults.recommendedSubstitutes || []).map((sub) => (
                  <div key={sub.facultyId} className="p-4 hover:bg-slate-50/60 flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        {sub.isQualified && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Domain Match
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">{sub.cadre}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Current Weekly Load: <strong>{sub.assignedHours}h</strong> / Target: {sub.targetHours}h • Availability Margin: {sub.loadAvailabilityScore}h
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Substitute assigned: ${sub.name} for ${substitutionResults.facultyOnLeave}`)}
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-xs transition-colors"
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

      {/* MULTI-SLOT ATOMIC SUBSTITUTION MODAL FOR HOD */}
      {showAtomicModal && selectedAtomicLeave && atomicAffectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold mb-1 border border-blue-200">
                  <Sparkles className="w-3 h-3" />
                  <span>Atomic Multi-Period Substitution Governance</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Substitute Coverage for {selectedAtomicLeave.facultyName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Absence Date: <strong className="text-slate-800">{selectedAtomicLeave.date || selectedAtomicLeave.startDate}</strong> • Reason: <span className="italic">"{selectedAtomicLeave.reason}"</span>
                </p>
              </div>

              <button
                onClick={() => setShowAtomicModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {atomicError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{atomicError}</span>
              </div>
            )}

            {/* Affected Periods Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Affected Teaching Periods ({atomicAffectedData.affectedPeriods?.length || 0})
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  AI Rule: Zero overlaps, free period verification & workload balance
                </span>
              </div>

              {(!atomicAffectedData.affectedPeriods || atomicAffectedData.affectedPeriods.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No teaching periods scheduled on this leave date. Leave can be approved directly.
                </div>
              ) : (
                <div className="space-y-3">
                  {atomicAffectedData.affectedPeriods.map((periodSlot) => {
                    const key = `${periodSlot.day}_${periodSlot.period}_${periodSlot.batchId}`;
                    const selectedSub = atomicAllocations[key];

                    return (
                      <div
                        key={key}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-2xs">
                              Period {periodSlot.period}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">{periodSlot.subjectName}</span>
                              <span className="text-[11px] text-slate-500">{periodSlot.batchName} • Hall: {periodSlot.room || 'CR-101'}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-slate-400">
                              {periodSlot.day}, {periodSlot.date}
                            </span>
                          </div>
                        </div>

                        {/* Substitute Select Dropdown */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Assign Department Substitute:
                          </label>
                          <select
                            value={selectedSub || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAtomicAllocations(prev => ({ ...prev, [key]: val }));
                            }}
                            className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                          >
                            <option value="">-- Select Free Faculty Member --</option>
                            {(periodSlot.candidateSubstitutes || []).map(cand => (
                              <option key={cand.facultyId} value={cand.facultyId}>
                                {cand.name} ({cand.cadre}) — Load: {cand.assignedHours}h • Status: {cand.isFree ? 'Free (No Clash)' : 'Collision Warning'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Atomic Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">
                All allocations and timetable substitutions are saved <strong>atomically</strong> upon confirmation.
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAtomicModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAtomicApproval}
                  disabled={isAtomicLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAtomicLoading ? 'Finalizing Allocations...' : 'Atomically Confirm & Approve Leave'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
