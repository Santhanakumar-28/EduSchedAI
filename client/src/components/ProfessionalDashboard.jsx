import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  BookOpen, 
  Calendar, 
  CalendarDays, 
  TrendingUp, 
  MoreHorizontal, 
  Zap, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { apiFetch } from '../api';

export default function ProfessionalDashboard({ 
  currentUser, 
  dataset, 
  schedule, 
  metrics,
  workloadDetails,
  onNavigateTab,
  onRunAIGeneration,
  isGenerating
}) {
  const [timeFilter, setTimeFilter] = useState('By Faculty');
  const [chartView, setChartView] = useState('Cadre');
  const [dbStats, setDbStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Display Name & Date
  const displayName = currentUser?.name || 'Santhana Kumar';

  // Format today's date like "Mon, 13 Oct 2025"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Fetch real database metrics and chart analytics from MongoDB Atlas
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardAnalytics = async () => {
      try {
        setIsLoadingStats(true);
        const token = localStorage.getItem('edusched_token');
        const res = await apiFetch('/api/dashboard/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success && isMounted) {
          setDbStats(json.data);
        }
      } catch (err) {
        console.error('Failed to load live database stats:', err);
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };
    fetchDashboardAnalytics();
    return () => {
      isMounted = false;
    };
  }, [dataset, schedule]);

  // Live KPI Metrics Data directly from Database
  const totalFacultyCount = dbStats?.counts?.totalFaculty ?? dataset?.faculty?.length ?? 13;
  const departmentsCount = dbStats?.counts?.totalDepartments ?? 1;
  const subjectsCount = dbStats?.counts?.totalSubjects ?? dataset?.subjects?.length ?? 10;
  const totalClassesCount = dbStats?.counts?.totalClasses ?? schedule?.length ?? 60;

  // Donut Chart: Faculty Distribution (By Cadre or By Department)
  const departmentPieData = useMemo(() => {
    if (chartView === 'Department' && dbStats?.distributionByDepartment?.length) {
      return dbStats.distributionByDepartment;
    }
    if (dbStats?.distributionByCadre?.length) {
      return dbStats.distributionByCadre;
    }

    // Reactive fallback from dataset.faculty
    const list = dataset?.faculty || [];
    const counts = { Professor: 0, AssociateProf: 0, AssistantProf: 0 };
    list.forEach((f) => {
      if (f.cadre === 'Professor') counts.Professor++;
      else if (f.cadre === 'AssociateProf') counts.AssociateProf++;
      else counts.AssistantProf++;
    });

    return [
      { name: 'Professors', value: counts.Professor || 2, color: '#3B82F6' },
      { name: 'Associate Prof.', value: counts.AssociateProf || 3, color: '#8B5CF6' },
      { name: 'Assistant Prof.', value: counts.AssistantProf || 8, color: '#10B981' }
    ].filter((d) => d.value > 0);
  }, [dbStats, chartView, dataset?.faculty]);

  // Bar Chart: Faculty Workload Overview (Assigned vs Available Hours from Database)
  const workloadBarData = useMemo(() => {
    if (timeFilter === 'By Cadre' && dbStats?.cadreWorkloadData?.length) {
      return dbStats.cadreWorkloadData;
    }
    if (timeFilter === 'By Section' && dbStats?.batchWorkloadData?.length) {
      return dbStats.batchWorkloadData;
    }
    if (dbStats?.facultyWorkloadData?.length) {
      return dbStats.facultyWorkloadData;
    }

    // Reactive fallback from active schedule and dataset.faculty
    const facultyList = dataset?.faculty || [];
    return facultyList.slice(0, 6).map((f) => {
      const assigned = schedule?.filter((s) => String(s.facultyId) === String(f._id)).length || 6;
      const target = f.targetHours || 16;
      const available = Math.max(0, target - assigned);
      const shortName = f.name.split(' ').slice(0, 2).join(' ');
      return {
        dept: shortName,
        assigned,
        available
      };
    });
  }, [dbStats, timeFilter, dataset?.faculty, schedule]);

  // Faculty Table Data directly from Database
  const facultyRows = useMemo(() => {
    if (dbStats?.facultyTableRows?.length) {
      return dbStats.facultyTableRows;
    }
    const facultyList = dataset?.faculty || [];
    return facultyList.slice(0, 8).map((f) => ({
      id: f._id,
      name: f.name,
      employeeCode: f.employeeCode || `FAC-${f._id}`,
      dept: 'CSE',
      designation:
        f.cadre === 'Professor'
          ? 'Professor'
          : f.cadre === 'AssociateProf'
          ? 'Associate Professor'
          : 'Assistant Professor',
      email: f.email,
      status: 'Active'
    }));
  }, [dbStats, dataset?.faculty]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Greeting Banner matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Good Morning, {displayName}!</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Here's an overview of your faculty management system.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Date pill button matching screenshot */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{formattedDate}</span>
          </div>

          {/* Quick AI Schedule Solver action for Admin / HOD */}
          {currentUser?.role === 'HOD' && (
            <button
              onClick={() => onRunAIGeneration?.()}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Optimizing...' : 'Generate AI Timetable'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Four KPI / Stat Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Faculty */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Total Faculty</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{totalFacultyCount}</span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                ↑ 8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">vs. last month</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Departments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Departments</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{departmentsCount}</span>
              <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                → 0%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">vs. last month</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Subjects */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Subjects</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{subjectsCount}</span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                ↑ 6%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">vs. last month</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Classes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">Total Classes</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{totalClassesCount}</span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                ↑ 12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">vs. last month</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Main Dashboard Content (Full Width) */}
      <div className="space-y-6">
          
          {/* Charts Row: Faculty by Department (Donut) & Faculty Workload Overview (Bar) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Faculty Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {chartView === 'Cadre' ? 'Faculty by Designation' : 'Faculty by Department'}
                </h2>
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80 text-[10px] font-bold">
                  <button
                    onClick={() => setChartView('Cadre')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      chartView === 'Cadre' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cadre
                  </button>
                  <button
                    onClick={() => setChartView('Department')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      chartView === 'Department' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Dept
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* Donut Chart with Center Text */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {departmentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          fontSize: '12px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Label directly from Database */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-extrabold text-slate-900 leading-none">{totalFacultyCount}</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-none">Total Faculty</span>
                  </div>
                </div>

                {/* Donut Legend on Right */}
                <div className="space-y-2.5 pl-2 flex-1">
                  {departmentPieData.map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: dept.color }} 
                        />
                        <span className="font-semibold text-slate-600">{dept.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 ml-4">{dept.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Faculty Workload Overview */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Faculty Workload Overview
                  </h2>
                  <p className="text-[10px] text-slate-400">Live timetable teaching hours</p>
                </div>
                
                {/* Time filter dropdown */}
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 font-medium focus:outline-none"
                  >
                    <option value="By Faculty">By Faculty</option>
                    <option value="By Cadre">By Cadre</option>
                    <option value="By Section">By Section</option>
                  </select>
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadBarData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <XAxis 
                      dataKey="dept" 
                      tick={{ fill: '#64748B', fontSize: 10 }} 
                      axisLine={{ stroke: '#E2E8F0' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748B', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={[0, 'auto']} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '11px' 
                      }} 
                    />
                    <Bar dataKey="assigned" name="Assigned Hours" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="available" name="Available Hours" fill="#A78BFA" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center space-x-5 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-slate-600 font-medium">Assigned Hours</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
                  <span className="text-slate-600 font-medium">Available Hours</span>
                </div>
              </div>
            </div>

          </div>

          {/* Lower: Faculty List Table matching screenshot */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Faculty List</h2>
              </div>

              <button 
                onClick={() => onNavigateTab?.('faculty_mgmt')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Designation</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {facultyRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                            {row.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{row.name}</span>
                            {row.employeeCode && (
                              <span className="text-[10px] text-slate-400 font-mono">{row.employeeCode}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{row.dept || 'CSE'}</td>
                      <td className="py-3 text-slate-600 font-medium">{row.designation}</td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">{row.email}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                          {row.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => onNavigateTab?.('faculty_mgmt')}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}
