import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BookOpen, 
  CalendarDays, 
  TrendingUp, 
  FileText, 
  Settings,
  GraduationCap,
  Sparkles,
  ClipboardList,
  Megaphone,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const role = currentUser?.role || 'HOD';
  const isClassCoordinator = !!currentUser?.isClassCoordinator;

  // Build role-specific navigation items
  let navItems = [];
  let secondaryItems = [];

  if (role === 'Admin') {
    // 1. College Administrator / HR Navigation (Full Governance Scope)
    navItems = [
      { id: 'admin_dashboard', label: 'Admin Command Center', icon: LayoutDashboard },
      { id: 'admin_departments', label: 'Departments & HODs', icon: Building2 },
      { id: 'admin_users', label: 'User Directory & Status', icon: Users },
      { id: 'admin_hod_leaves', label: 'HOD Leave Approvals', icon: ClipboardList },
      { id: 'admin_audit', label: 'Security Audit Logs', icon: ShieldCheck },
      { id: 'admin_settings', label: 'College Settings', icon: Settings },
      { id: 'reports', label: 'Institutional Reports', icon: FileText }
    ];

    secondaryItems = [
      { id: 'attendance', label: 'College Attendance', icon: UserCheck },
      { id: 'notices', label: 'Notice Bulletin', icon: Megaphone }
    ];
  } else if (role === 'HOD') {
    // 2. Department HOD Navigation (Department Scoped)
    navItems = [
      { id: 'dashboard', label: 'Department Dashboard', icon: LayoutDashboard },
      { id: 'faculty_mgmt', label: 'Faculty Directory', icon: Users },
      { id: 'departments', label: 'Department Overview', icon: Building2 },
      { id: 'subjects', label: 'Subjects & Curriculum', icon: BookOpen },
      { id: 'timetable', label: 'Master Timetable', icon: CalendarDays },
      { id: 'workload', label: 'Workload Governance', icon: TrendingUp },
      { id: 'reports', label: 'Department Reports', icon: FileText }
    ];

    secondaryItems = [
      { id: 'attendance', label: 'Department Attendance', icon: UserCheck },
      { id: 'leaves', label: 'Faculty Leave Approvals', icon: ClipboardList },
      { id: 'notices', label: 'Notice Board', icon: Megaphone }
    ];
  } else if (role === 'Faculty') {
    // 2. Faculty Member Navigation (differentiated for Class Coordinator)
    navItems = [
      { id: 'timetable', label: 'My Teaching Schedule', icon: CalendarDays },
      { id: 'workload', label: 'My Workload & Hours', icon: TrendingUp },
    ];

    if (isClassCoordinator) {
      navItems.push({
        id: 'class_students',
        label: `My Section Students (${currentUser.coordinatedBatch?.name || 'Section'})`,
        icon: GraduationCap
      });
      secondaryItems = [
        { id: 'attendance', label: 'Class Attendance', icon: UserCheck },
        { id: 'leaves', label: 'Leave & Class Approvals', icon: ClipboardList },
        { id: 'notices', label: 'Notice Board', icon: Megaphone },
        { id: 'reports', label: 'Class Reports', icon: FileText }
      ];
    } else {
      secondaryItems = [
        { id: 'attendance', label: 'My Attendance', icon: UserCheck },
        { id: 'leaves', label: 'Apply for Leave', icon: ClipboardList },
        { id: 'notices', label: 'Notice Board', icon: Megaphone }
      ];
    }
  } else if (role === 'Student') {
    // 3. Student Portal Navigation (Strict Personal Access Only)
    navItems = [
      { id: 'student_portal', label: 'My Class Schedule', icon: CalendarDays },
    ];

    secondaryItems = [
      { id: 'attendance', label: 'Attendance Records', icon: UserCheck },
      { id: 'leaves', label: 'Submit Leave Request', icon: ClipboardList },
      { id: 'notices', label: 'Notice Board', icon: Megaphone }
    ];
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4 select-none">
      <div className="space-y-6">
        
        {/* Brand / Logo Header */}
        <div className="flex items-center space-x-3 px-2 pt-1 pb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-[15px] leading-tight tracking-tight">
              Faculty Management
            </h1>
            <p className="font-bold text-slate-900 text-[15px] leading-tight tracking-tight">
              System
            </p>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-[#EBF3FF] text-[#2563EB] font-bold shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Contextual Menu */}
        {secondaryItems.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="px-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Operations & Alerts
            </p>
            <nav className="space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3.5 px-3.5 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#EBF3FF] text-[#2563EB] font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Promo Card matching the screenshot */}
      <div className="pt-4">
        <div className="p-4 bg-gradient-to-br from-[#EEF5FF] to-[#E5EFFF] rounded-2xl border border-blue-100 text-center relative overflow-hidden shadow-xs">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto mb-2 bg-white/80 rounded-2xl flex items-center justify-center shadow-xs text-blue-600">
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="12" y="14" width="40" height="28" rx="3" className="fill-blue-50/80 stroke-blue-600" />
              <path d="M8 46h48a2 2 0 0 1 2 2v2H6v-2a2 2 0 0 1 2-2z" className="fill-blue-200 stroke-blue-600" />
              <circle cx="32" cy="24" r="5" className="fill-blue-300 stroke-blue-600" />
              <path d="M22 36c0-4 4-6 10-6s10 2 10 6" className="fill-blue-400 stroke-blue-600" />
            </svg>
          </div>

          <h3 className="font-bold text-slate-900 text-xs leading-snug">
            Better Management for a Brighter Future
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 font-normal">
            {role === 'Student' 
              ? 'View your class schedule, room locations, and track your attendance.'
              : role === 'Faculty'
              ? 'Manage teaching assignments, log attendance, and review schedules.'
              : 'Efficiently manage faculty, subjects, and schedules — all in one place.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
