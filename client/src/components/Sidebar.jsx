import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Cpu, 
  Scale, 
  UserMinus, 
  FolderTree, 
  Sparkles,
  Layers,
  BookOpen,
  UserPlus,
  GraduationCap,
  Users
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const role = currentUser?.role || 'HOD';
  const isClassCoordinator = !!currentUser?.isClassCoordinator;

  // Build navigation items dynamically according to logged-in user permissions
  let navItems = [];

  if (role === 'HOD') {
    navItems = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
      { id: 'timetable', label: 'Master Timetable', icon: CalendarDays, badge: 'Active' },
      { id: 'faculty_mgmt', label: 'Add / Manage Faculty', icon: UserPlus, badge: 'HOD Authority' },
      { id: 'ai_studio', label: 'AI Scheduling Studio', icon: Cpu, badge: 'CSP+GA' },
      { id: 'workload', label: 'Workload Balancer', icon: Scale, badge: 'Gini 0.23' },
      { id: 'leaves', label: 'Leave & Substitution', icon: UserMinus, badge: 'Smart' },
      { id: 'directory', label: 'Academic Resources', icon: FolderTree, badge: null },
    ];
  } else if (role === 'Faculty') {
    navItems = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
      { id: 'timetable', label: 'My Teaching Timetable', icon: CalendarDays, badge: 'Personal' },
    ];

    // If this faculty member is a Class Coordinator, give them the Class Students management tab!
    if (isClassCoordinator) {
      navItems.push({
        id: 'class_students',
        label: `Manage Class Students`,
        icon: GraduationCap,
        badge: 'Section In-Charge'
      });
    }

    navItems.push(
      { id: 'leaves', label: 'Leave & Substitution', icon: UserMinus, badge: null },
      { id: 'workload', label: 'My Teaching Load', icon: Scale, badge: null },
      { id: 'directory', label: 'Academic Resources', icon: FolderTree, badge: null }
    );
  } else if (role === 'Student') {
    navItems = [
      { id: 'student_portal', label: 'My Batch Schedule', icon: CalendarDays, badge: 'Enrolled' },
      { id: 'directory', label: 'Course Directory', icon: FolderTree, badge: null },
    ];
  }

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* Department / Status Banner */}
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 tracking-wide uppercase">Dept of CSE</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {role === 'Student' 
                  ? `${currentUser?.enrolledBatch?.name || 'CSE Section A'}` 
                  : isClassCoordinator 
                    ? `Coordinator: ${currentUser?.coordinatedBatch?.name || 'Section A'}`
                    : 'Semester 4 • 2026-27'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {role === 'HOD' ? 'Administrator Menu' : role === 'Faculty' ? 'Faculty Menu' : 'Student Menu'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-2xs pl-2.5'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight shrink-0 ml-1.5 ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/60' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200/80 space-y-2">
        <div className="p-3 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 rounded-xl border border-indigo-100/80 text-[11px] text-indigo-950 shadow-2xs">
          <div className="flex items-center space-x-1.5 font-bold mb-1 text-indigo-800">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>EduSchedAI Core v2.4</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[10px]">
            Role-Based Access: HOD adds faculty, Class Coordinator adds students.
          </p>
        </div>
        <p className="text-[10px] text-center text-slate-400 font-medium">UIET Academic Management System</p>
      </div>
    </aside>
  );
}
