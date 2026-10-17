import React from "react";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Cpu, 
  Scale, 
  UserMinus, 
  FolderTree, 
  Sparkles,
  Download,
  CheckCircle2,
  Megaphone,
  UserPlus,
  GraduationCap
} from "lucide-react";

import { cn } from "../lib/utils";
import { buttonVariants } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Dock, DockIcon } from "./magicui/dock";

export default function DockNavigation({
  activeTab,
  setActiveTab,
  currentUser,
  onGenerateClick,
  onExportClick,
  isGenerating
}) {
  const role = currentUser?.role || 'HOD';
  const isHOD = role === 'HOD';

  let dockItems = [];
  if (role === 'HOD') {
    dockItems = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'timetable', label: 'Master Timetable', icon: CalendarDays },
      { id: 'faculty_mgmt', label: 'Manage Faculty', icon: UserPlus },
      { id: 'ai_studio', label: 'AI Studio', icon: Cpu },
      { id: 'workload', label: 'Workload', icon: Scale },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
      { id: 'notices', label: 'Notices', icon: Megaphone },
    ];
  } else if (role === 'Faculty') {
    dockItems = [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'timetable', label: 'My Schedule', icon: CalendarDays },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
      { id: 'leaves', label: 'Leave', icon: UserMinus },
      { id: 'notices', label: 'Notices', icon: Megaphone },
    ];
    if (currentUser?.isClassCoordinator) {
      dockItems.push({ id: 'class_students', label: 'Class Students', icon: GraduationCap });
    }
  } else if (role === 'Student') {
    dockItems = [
      { id: 'student_portal', label: 'My Schedule', icon: CalendarDays },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
      { id: 'notices', label: 'Notices', icon: Megaphone },
      { id: 'directory', label: 'Directory', icon: FolderTree },
    ];
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-full px-4">
      <TooltipProvider>
        <Dock direction="middle">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <DockIcon key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "size-10 rounded-xl transition-all",
                        isActive 
                          ? "bg-slate-900 text-amber-300 shadow-md ring-2 ring-indigo-500/50 dark:bg-white dark:text-slate-900" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300"
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            );
          })}

          <Separator orientation="vertical" className="h-6 my-auto mx-1" />

          {isHOD && (
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onGenerateClick}
                    disabled={isGenerating}
                    className={cn(
                      buttonVariants({ variant: "gradient", size: "icon" }),
                      "size-10 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    )}
                  >
                    <Sparkles className={`size-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isGenerating ? 'Synthesizing...' : 'Run AI Timetable Solver'}</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          )}

          <DockIcon>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onExportClick}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "size-10 rounded-xl transition-all text-slate-700 dark:text-slate-200"
                  )}
                >
                  <Download className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Schedule CSV</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>

        </Dock>
      </TooltipProvider>
    </div>
  );
}
