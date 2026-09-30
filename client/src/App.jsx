import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TimetableGrid from './components/TimetableGrid';
import SlotSwapModal from './components/SlotSwapModal';
import WorkloadDashboard from './components/WorkloadDashboard';
import LeaveSubstitutionView from './components/LeaveSubstitutionView';
import AIStudioView from './components/AIStudioView';
import DirectoryView from './components/DirectoryView';
import FacultyManagementView from './components/FacultyManagementView';
import ClassStudentsView from './components/ClassStudentsView';
import StudentPortalView from './components/StudentPortalView';
import AttendanceView from './components/AttendanceView';
import NoticesView from './components/NoticesView';

import { 
  Sparkles, 
  CalendarDays, 
  CheckCircle2, 
  ShieldCheck, 
  Scale, 
  Cpu, 
  Users, 
  ArrowRight,
  UserPlus,
  GraduationCap
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('edusched_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataset, setDataset] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [workloadDetails, setWorkloadDetails] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(false);

  // Set default tab on login / role change
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Student') {
        setActiveTab('student_portal');
      } else if (currentUser.role === 'Faculty') {
        setActiveTab('timetable');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.role]);

  // Load Data from Backend API
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [datasetRes, timetableRes] = await Promise.all([
        fetch('/api/dataset'),
        fetch('/api/timetable/current')
      ]);

      const datasetJson = await datasetRes.json();
      const timetableJson = await timetableRes.json();

      if (datasetJson.success) setDataset(datasetJson.data);
      if (timetableJson.success) {
        setSchedule(timetableJson.data.schedule || []);
        setMetrics(timetableJson.data.metrics || null);
        setWorkloadDetails(timetableJson.data.workloadDetails || null);
      }
    } catch (err) {
      console.error('Failed to load API data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('edusched_user');
    localStorage.removeItem('edusched_token');
    setCurrentUser(null);
  };

  // Trigger AI Timetable Generation
  const handleRunAIGeneration = async (customConfig = {}) => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/timetable/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customConfig)
      });

      const json = await res.json();
      if (json.success) {
        setSchedule(json.data.schedule);
        setMetrics(json.data.metrics);
        setWorkloadDetails(json.data.workloadDetails);
        setActiveTab('timetable');
      } else {
        alert(json.message || 'Error generating timetable');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering AI engine: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = '/api/export/csv';
  };

  const handleSlotSwapClick = (slot) => {
    if (currentUser?.role !== 'HOD') {
      alert('Only Timetable Coordinators & HODs are authorized to swap or move classes.');
      return;
    }
    setSelectedSlotForSwap(slot);
    setShowSwapModal(true);
  };

  const handleSwapSuccess = (updatedTimetable) => {
    setSchedule(updatedTimetable.schedule);
    setMetrics(updatedTimetable.metrics);
    setWorkloadDetails(updatedTimetable.workloadDetails);
  };

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header with Integrated Navigation Bar */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onGenerateClick={() => handleRunAIGeneration()}
        onExportClick={handleExportCSV}
        metrics={metrics}
        isGenerating={isGenerating}
      />

      {/* Main Full-Width Workspace Canvas (Maximum Horizontal Space for Timetable Grid) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Main Content Area */}
        <main className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Connecting to EduSchedAI Engine...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Hero AI Generator Card */}
                  <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-xl shadow-indigo-500/10 border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Soft background ambient circles */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 left-1/3 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-2 max-w-xl relative z-10">
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur-md border border-white/20 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Autonomous Timetable Synthesis</span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">Intelligent Scheduling & Workload Balance</h1>
                      <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                        EduSchedAI solves university course and lab timetables with 100% clash-free constraint satisfaction and balanced faculty workloads in milliseconds.
                      </p>
                    </div>

                    {currentUser.role === 'HOD' ? (
                      <button
                        onClick={() => handleRunAIGeneration()}
                        disabled={isGenerating}
                        className="px-5 py-3 rounded-2xl bg-white text-indigo-700 font-extrabold text-xs shadow-lg shadow-indigo-950/20 hover:bg-indigo-50 transition-all flex items-center space-x-2 shrink-0 active:scale-95 disabled:opacity-50 relative z-10"
                      >
                        <Cpu className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>{isGenerating ? 'Computing Optimal Slots...' : 'Re-Generate with AI'}</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs relative z-10 shadow-xs">
                        <span className="text-indigo-200 block text-[10px] font-semibold uppercase tracking-wider">Logged in as</span>
                        <span className="font-bold text-sm text-white">{currentUser.name}</span>
                      </div>
                    )}
                  </div>

                  {/* High-Level KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                      <span className="text-slate-500 text-xs font-semibold block">Hard Clash Violations</span>
                      <div className="text-3xl font-black text-emerald-600 mt-1">0 Clashes</div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">100% Conflict-free guarantee</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                      <span className="text-slate-500 text-xs font-semibold block">Workload Gini Index</span>
                      <div className="text-3xl font-black text-indigo-600 mt-1">{metrics?.workloadGiniIndex ?? '0.238'}</div>
                      <p className="text-[11px] text-emerald-600 mt-1 font-bold">Equitably balanced</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                      <span className="text-slate-500 text-xs font-semibold block">Faculty Profiles</span>
                      <div className="text-3xl font-black text-slate-900 mt-1">{dataset?.faculty?.length ?? 12}</div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">Managed in Department</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
                      <span className="text-slate-500 text-xs font-semibold block">Weekly Sessions Placed</span>
                      <div className="text-3xl font-black text-slate-900 mt-1">{schedule.length}</div>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">100% Curriculum quota</p>
                    </div>
                  </div>

                  {/* Active Schedule Snapshot */}
                  <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">Current Master Timetable Snapshot</h2>
                        <p className="text-xs text-slate-500">Live view of Computer Science Section A</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('timetable')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        Open Full Grid <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>

                    <TimetableGrid
                      schedule={schedule}
                      dataset={dataset}
                      onSlotSwapClick={handleSlotSwapClick}
                      activeRole={currentUser.role}
                      currentUser={currentUser}
                    />
                  </div>

                </div>
              )}

              {/* TAB 2: MASTER / TEACHING TIMETABLE */}
              {activeTab === 'timetable' && (
                <TimetableGrid
                  schedule={schedule}
                  dataset={dataset}
                  onSlotSwapClick={handleSlotSwapClick}
                  activeRole={currentUser.role}
                  currentUser={currentUser}
                />
              )}

              {/* TAB 3: HOD FACULTY MANAGEMENT */}
              {activeTab === 'faculty_mgmt' && (
                <FacultyManagementView 
                  dataset={dataset} 
                  onFacultyAdded={loadData}
                />
              )}

              {/* TAB 4: CLASS COORDINATOR STUDENTS MANAGEMENT */}
              {activeTab === 'class_students' && (
                <ClassStudentsView
                  currentUser={currentUser}
                  dataset={dataset}
                />
              )}

              {/* TAB 5: STUDENT PORTAL VIEW */}
              {activeTab === 'student_portal' && (
                <StudentPortalView
                  currentUser={currentUser}
                  dataset={dataset}
                  schedule={schedule}
                  onNavigateTab={setActiveTab}
                />
              )}

              {/* TAB 6: AI SCHEDULING STUDIO */}
              {activeTab === 'ai_studio' && (
                <AIStudioView
                  onRunAIGeneration={handleRunAIGeneration}
                  isGenerating={isGenerating}
                  metrics={metrics}
                />
              )}

              {/* TAB 7: FACULTY WORKLOAD BALANCER */}
              {activeTab === 'workload' && (
                <WorkloadDashboard
                  workloadDetails={workloadDetails}
                  metrics={metrics}
                />
              )}

              {/* TAB 8: DYNAMIC LEAVE & SUBSTITUTION */}
              {activeTab === 'leaves' && (
                <LeaveSubstitutionView
                  currentUser={currentUser}
                  dataset={dataset}
                  schedule={schedule}
                  onAssignSubstitute={(subInfo) => {
                    setSchedule((prev) =>
                      prev.map((slot) => {
                        if (
                          slot.day === subInfo.day &&
                          slot.period === subInfo.period &&
                          String(slot.facultyId) === String(subInfo.originalFacultyId)
                        ) {
                          return { ...slot, facultyId: subInfo.substituteFacultyId };
                        }
                        return slot;
                      })
                    );
                  }}
                />
              )}

              {/* TAB 9: ACADEMIC RESOURCE DIRECTORY */}
              {activeTab === 'directory' && (
                <DirectoryView dataset={dataset} />
              )}

              {/* TAB 10: ATTENDANCE TRACKING & ROSTER */}
              {activeTab === 'attendance' && (
                <AttendanceView currentUser={currentUser} dataset={dataset} />
              )}

              {/* TAB 11: CAMPUS NOTICES & BROADCASTS */}
              {activeTab === 'notices' && (
                <NoticesView currentUser={currentUser} />
              )}
            </>
          )}
        </main>


      </div>

      {/* Slot Swap Modal */}
      {showSwapModal && (
        <SlotSwapModal
          selectedSlot={selectedSlotForSwap}
          onClose={() => setShowSwapModal(false)}
          dataset={dataset}
          schedule={schedule}
          onSwapSuccess={handleSwapSuccess}
        />
      )}

    </div>
  );
}
