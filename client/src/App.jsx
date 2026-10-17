import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import DepartmentsView from './components/DepartmentsView';
import SubjectsView from './components/SubjectsView';
import ReportsView from './components/ReportsView';
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
import AdminDashboardView from './components/AdminDashboardView';

export default function App() {
  // Authentication State - Defaults to null so Login Page opens by default
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('edusched_user');
    const token = localStorage.getItem('edusched_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
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
      if (currentUser.role === 'Admin') {
        setActiveTab('admin_dashboard');
      } else if (currentUser.role === 'Student') {
        setActiveTab('student_portal');
      } else if (currentUser.role === 'Faculty' && !currentUser.isClassCoordinator) {
        setActiveTab('timetable');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.role, currentUser?.isClassCoordinator]);

  // Load Data from Backend API
  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('edusched_token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const [datasetRes, timetableRes] = await Promise.all([
        fetch('/api/dataset', { headers: authHeaders }),
        fetch('/api/timetable/current', { headers: authHeaders })
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

  // Authenticated stakeholder persona switching
  const handleSwitchUser = async (personaKey) => {
    let emailToLogin = 'sk@hod.srm.in';
    if (personaKey === 'Coordinator_A') emailToLogin = 'dr.sunita@eduschedai.edu';
    else if (personaKey === 'Coordinator_B') emailToLogin = 'amitav.ghosh@eduschedai.edu';
    else if (personaKey === 'Faculty') emailToLogin = 'vikram.m@eduschedai.edu';
    else if (personaKey === 'Student') emailToLogin = '2026cse001@student.srm.in';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: emailToLogin, password: 'EduSched@123' })
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('edusched_user', JSON.stringify(data.user));
        localStorage.setItem('edusched_token', data.token);
        setCurrentUser(data.user);
        loadData();
      }
    } catch (e) {
      console.error('Failed to switch persona:', e);
    }
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
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 flex font-sans">
      
      {/* 1. Left Sidebar matching screenshot */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* 2. Main Right Section */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar matching screenshot */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onGenerateClick={() => handleRunAIGeneration()}
          onExportClick={handleExportCSV}
          metrics={metrics}
          isGenerating={isGenerating}
          onSwitchUser={handleSwitchUser}
        />

        {/* Content Canvas */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-3">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading Faculty Management System...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* TAB 0: ADMIN COMMAND CENTER & GOVERNANCE */}
                {activeTab.startsWith('admin_') && (
                  <AdminDashboardView
                    initialTab={
                      activeTab === 'admin_dashboard'
                        ? 'overview'
                        : activeTab.replace('admin_', '')
                    }
                    onNavigateTab={setActiveTab}
                  />
                )}

                {/* TAB 1: EXECUTIVE DASHBOARD matching screenshot */}
                {activeTab === 'dashboard' && (
                  <ProfessionalDashboard
                    currentUser={currentUser}
                    dataset={dataset}
                    schedule={schedule}
                    metrics={metrics}
                    workloadDetails={workloadDetails}
                    onNavigateTab={setActiveTab}
                    onRunAIGeneration={handleRunAIGeneration}
                    isGenerating={isGenerating}
                  />
                )}

                {/* TAB 2: FACULTY MANAGEMENT */}
                {activeTab === 'faculty_mgmt' && (
                  <FacultyManagementView 
                    dataset={dataset} 
                    onFacultyAdded={loadData}
                  />
                )}

                {/* TAB 3: DEPARTMENTS VIEW */}
                {activeTab === 'departments' && (
                  <DepartmentsView 
                    onNavigateTab={setActiveTab}
                  />
                )}

                {/* TAB 4: SUBJECTS & COURSES */}
                {activeTab === 'subjects' && (
                  <SubjectsView 
                    dataset={dataset} 
                    onNavigateTab={setActiveTab}
                  />
                )}

                {/* TAB 5: MASTER / TEACHING TIMETABLE */}
                {activeTab === 'timetable' && currentUser?.role !== 'Admin' && (
                  <TimetableGrid
                    schedule={schedule}
                    dataset={dataset}
                    onSlotSwapClick={handleSlotSwapClick}
                    activeRole={currentUser.role}
                    currentUser={currentUser}
                  />
                )}

                {/* TAB 6: FACULTY WORKLOAD BALANCER */}
                {activeTab === 'workload' && (
                  <WorkloadDashboard
                    workloadDetails={workloadDetails}
                    metrics={metrics}
                  />
                )}

                {/* TAB 7: REPORTS & EXPORTS */}
                {activeTab === 'reports' && (
                  <ReportsView
                    metrics={metrics}
                    schedule={schedule}
                    onExportClick={handleExportCSV}
                  />
                )}

                {/* TAB 8: SETTINGS / AI SCHEDULING STUDIO */}
                {(activeTab === 'settings' || activeTab === 'ai_studio') && (
                  <AIStudioView
                    onRunAIGeneration={handleRunAIGeneration}
                    isGenerating={isGenerating}
                    metrics={metrics}
                  />
                )}

                {/* TAB 9: ATTENDANCE TRACKING & ROSTER */}
                {activeTab === 'attendance' && (
                  <AttendanceView 
                    currentUser={currentUser} 
                    dataset={dataset} 
                  />
                )}

                {/* TAB 10: DYNAMIC LEAVE & SUBSTITUTION */}
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

                {/* TAB 11: CAMPUS NOTICES & BROADCASTS */}
                {activeTab === 'notices' && (
                  <NoticesView 
                    currentUser={currentUser} 
                  />
                )}

                {/* TAB 12: CLASS COORDINATOR STUDENTS MANAGEMENT */}
                {activeTab === 'class_students' && (
                  <ClassStudentsView
                    currentUser={currentUser}
                    dataset={dataset}
                  />
                )}

                {/* TAB 13: STUDENT PORTAL VIEW */}
                {activeTab === 'student_portal' && (
                  <StudentPortalView
                    currentUser={currentUser}
                    dataset={dataset}
                    schedule={schedule}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {/* TAB 14: ACADEMIC RESOURCE DIRECTORY */}
                {activeTab === 'directory' && (
                  <DirectoryView 
                    dataset={dataset} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
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
