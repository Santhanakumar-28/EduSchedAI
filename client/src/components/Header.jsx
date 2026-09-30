import React from 'react';
import LiveDateTime from './LiveDateTime';
import { 
  Sparkles, 
  Download, 
  CheckCircle2, 
  ShieldCheck,
  User,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Cpu,
  Scale,
  UserMinus,
  FolderTree,
  Building2,
  Clock,
  Layers,
  Megaphone
} from 'lucide-react';

export default function Header({ 
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onGenerateClick, 
  onExportClick,
  metrics,
  isGenerating
}) {
  const role = currentUser?.role || 'HOD';
  const isHOD = role === 'HOD';
  const isCoordinator = currentUser?.isClassCoordinator;

  // Build navigation items dynamically according to logged-in user permissions
  let navItems = [];
  if (role === 'HOD') {
    navItems = [
      { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
      { id: 'timetable', label: 'Master Timetable', icon: CalendarDays, badge: 'Live Grid' },
      { id: 'faculty_mgmt', label: 'Faculty Management', icon: UserPlus, badge: 'HOD' },
      { id: 'ai_studio', label: 'AI Scheduling Studio', icon: Cpu, badge: 'CSP' },
      { id: 'workload', label: 'Workload Balancer', icon: Scale, badge: 'Gini 0.23' },
      { id: 'attendance', label: 'Attendance Roster', icon: CheckCircle2 },
      { id: 'leaves', label: 'Leave & Substitution', icon: UserMinus },
      { id: 'notices', label: 'Notice Board', icon: Megaphone, badge: 'New' },
      { id: 'directory', label: 'Academic Resources', icon: FolderTree },
    ];
  } else if (role === 'Faculty') {
    navItems = [
      { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
      { id: 'timetable', label: 'My Teaching Schedule', icon: CalendarDays, badge: 'Personal' },
    ];

    if (isCoordinator) {
      navItems.push({
        id: 'class_students',
        label: `Manage Students (${currentUser?.coordinatedBatch?.name || 'Section A'})`,
        icon: GraduationCap,
        badge: 'Coordinator'
      });
    }

    navItems.push(
      { id: 'attendance', label: 'Mark Attendance', icon: CheckCircle2 },
      { id: 'leaves', label: 'Leave & Substitution', icon: UserMinus },
      { id: 'workload', label: 'My Teaching Load', icon: Scale },
      { id: 'notices', label: 'Notice Board', icon: Megaphone, badge: 'New' },
      { id: 'directory', label: 'Academic Resources', icon: FolderTree }
    );
  } else if (role === 'Student') {
    navItems = [
      { id: 'student_portal', label: 'My Batch Schedule', icon: CalendarDays, badge: 'Enrolled' },
      { id: 'attendance', label: 'My Attendance', icon: CheckCircle2, badge: '75% Rule' },
      { id: 'notices', label: 'Notice Board', icon: Megaphone, badge: 'New' },
      { id: 'directory', label: 'Course Directory', icon: FolderTree },
    ];
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ROW 1: Masthead Brand & Global Utilities (Uniform h-16 & h-9 buttons) */}
        <div className="flex items-center justify-between h-16 border-b border-slate-100/90 gap-4">
          
          {/* Left: Brand & University Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 ring-2 ring-indigo-500/20 shrink-0">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight font-display text-slate-900 leading-none">
                  EduSched<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600">AI</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> 100% Clash-Free
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden md:block mt-1 leading-none">
                Apex Institute of Technology • Department of Computer Science & Engineering
              </p>
            </div>
          </div>

          {/* Right: Perfectly Aligned Cluster with exact matching h-9 height */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            
            {/* Live Real-Time Date & Clock Pill */}
            <LiveDateTime />

            {/* Logged-In User Profile Pill (Single Line, Never Wraps) */}
            {currentUser && (
              <div 
                className="flex items-center space-x-2 bg-slate-50/90 px-3 rounded-full border border-slate-200 text-xs shadow-2xs whitespace-nowrap shrink-0 h-9"
                title={`Signed in as ${currentUser.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-indigo-800 text-white font-bold flex items-center justify-center text-[11px] shrink-0 shadow-xs">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <span className="font-bold text-slate-900 text-xs truncate max-w-[130px] hidden sm:inline">
                  {currentUser.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200/60 shrink-0">
                  {isHOD ? '👑 HOD' : isCoordinator ? '🌟 Coord' : currentUser.role}
                </span>
              </div>
            )}

            {/* AI Generate Button (HOD only) */}
            {isHOD && (
              <button
                onClick={onGenerateClick}
                disabled={isGenerating}
                className="h-9 px-3.5 inline-flex items-center border border-transparent text-xs font-bold rounded-xl text-white bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 shadow-sm shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 mr-1.5 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Solving...' : 'Run AI'}
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={onExportClick}
              className="h-9 px-3 inline-flex items-center border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 shadow-2xs hover:shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
              title="Export Master Schedule to CSV"
            >
              <Download className="w-3.5 h-3.5 sm:mr-1.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="h-9 px-3 inline-flex items-center border border-rose-200 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50/70 hover:bg-rose-100 transition-all shadow-2xs hover:shadow-xs active:scale-95 whitespace-nowrap shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5 text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>

        </div>

        {/* ROW 2: Horizontal Navigation Tabs & Real-Time Telemetry Bar */}
        <div className="flex items-center justify-between py-2 overflow-x-auto scrollbar-none gap-4">
          
          {/* Left: Navigation Tab Pills */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 h-8 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Telemetry & Term Status (Single Clean Line, Never Wraps) */}
          <div className="flex items-center space-x-2 shrink-0">
            {isHOD && (
              <div className="hidden lg:flex items-center space-x-2 text-[11px] shrink-0">
                <div className="h-7 px-2.5 rounded-full bg-slate-50 border border-slate-200 flex items-center space-x-1.5 text-slate-600 shadow-2xs whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-semibold text-slate-500">Violations:</span>
                  <span className="font-mono font-bold text-slate-900">{metrics?.hardViolations ?? 0}</span>
                </div>

                <div className="h-7 px-2.5 rounded-full bg-slate-50 border border-slate-200 flex items-center space-x-1.5 text-slate-600 shadow-2xs whitespace-nowrap">
                  <span className="font-semibold text-slate-500">Gini:</span>
                  <span className="font-mono font-bold text-indigo-700">{metrics?.workloadGiniIndex ?? '0.238'}</span>
                </div>

                <div className="h-7 px-2.5 rounded-full bg-slate-50 border border-slate-200 flex items-center space-x-1.5 text-slate-600 shadow-2xs whitespace-nowrap">
                  <span className="font-semibold text-slate-500">Solver:</span>
                  <span className="font-mono font-bold text-slate-900">{metrics?.executionTimeMs ?? '203'}ms</span>
                </div>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium shrink-0 pl-2 border-l border-slate-200 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Sem 4 (2026-27)</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
