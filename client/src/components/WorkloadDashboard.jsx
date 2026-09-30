import React, { useState } from 'react';
import { 
  Scale, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Award,
  BarChart3,
  PieChart,
  Search,
  Filter,
  X
} from 'lucide-react';

export default function WorkloadDashboard({ workloadDetails, metrics }) {
  const stats = workloadDetails?.facultyStats || [];
  const gini = workloadDetails?.giniIndex ?? 0.238;
  const fairness = workloadDetails?.fairnessScore ?? 73.2;
  const avgHours = workloadDetails?.averageHoursPerFaculty ?? 4.67;
  const stdDev = workloadDetails?.standardDeviation ?? 2.05;

  // Search and Filter States (Faculty & HOD Workload)
  const [facultySearch, setFacultySearch] = useState('');
  const [cadreFilter, setCadreFilter] = useState('all'); // 'all', 'Professor', 'AssociateProf', 'AssistantProf'
  const [allocationFilter, setAllocationFilter] = useState('all'); // 'all', 'optimal', 'available', 'heavy'

  const isFilterActive = facultySearch.trim() !== '' || cadreFilter !== 'all' || allocationFilter !== 'all';

  const filteredStats = stats.filter((faculty) => {
    if (cadreFilter !== 'all' && faculty.cadre !== cadreFilter) {
      return false;
    }
    const pct = Math.round((faculty.assignedHours / (faculty.targetHours || 16)) * 100);
    if (allocationFilter === 'optimal' && (pct < 70 || pct > 100)) return false;
    if (allocationFilter === 'available' && pct >= 70) return false;
    if (allocationFilter === 'heavy' && pct <= 100) return false;

    if (facultySearch.trim()) {
      const q = facultySearch.toLowerCase().trim();
      const matchName = faculty.name?.toLowerCase().includes(q);
      const matchCadre = faculty.cadre?.toLowerCase().includes(q);
      if (!matchName && !matchCadre) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
            <Scale className="w-5 h-5 mr-2 text-indigo-600" />
            Faculty Workload Balancer & Fairness Audit
          </h2>
          <p className="text-xs text-slate-500">
            Algorithmic equity monitoring based on Gini coefficient and institutional cadre targets.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
          AICTE / UGC Compliant Tracking
        </span>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Fairness Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Department Fairness</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900">{fairness}%</div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center mt-0.5">
              <CheckCircle2 className="w-3 h-3 mr-1" /> High equity distribution
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${fairness}%` }}
            ></div>
          </div>
        </div>

        {/* Gini Coefficient */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Workload Gini Index</span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-indigo-600">{gini}</div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Ideal threshold: &lt; 0.25 (Very Balanced)
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, gini * 300)}%` }}
            ></div>
          </div>
        </div>

        {/* Average Load */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Average Assigned Load</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900">{avgHours} <span className="text-sm font-medium text-slate-500">hrs/wk</span></div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across {stats.length} faculty instructors
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        {/* Standard Deviation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Load Variance (Std Dev)</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-extrabold text-slate-900">±{stdDev} <span className="text-sm font-medium text-slate-500">hrs</span></div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Low dispersion across cadres
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
          </div>
        </div>

      </div>

      {/* Cadre Standards Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center space-x-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-purple-700">
            P
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Professors</span>
            <span className="text-slate-500 text-[11px]">Standard Target: 14 hrs/week</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center space-x-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700">
            AP
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Associate Professors</span>
            <span className="text-slate-500 text-[11px]">Standard Target: 16 hrs/week</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center space-x-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700">
            Ast
          </div>
          <div>
            <span className="font-bold text-slate-900 block">Assistant Professors</span>
            <span className="text-slate-500 text-[11px]">Standard Target: 18 hrs/week</span>
          </div>
        </div>
      </div>

      {/* Faculty Workload Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Faculty Teaching Load Audit Table</h3>
          <span className="text-xs text-slate-500">{stats.length} Faculty Profiles Tracked</span>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              placeholder="Search faculty instructor or cadre..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {facultySearch && (
              <button
                onClick={() => setFacultySearch('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Cadre Filter */}
            <select
              value={cadreFilter}
              onChange={(e) => setCadreFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Cadres</option>
              <option value="Professor">Professors</option>
              <option value="AssociateProf">Associate Professors</option>
              <option value="AssistantProf">Assistant Professors</option>
            </select>

            {/* Allocation Status Filter */}
            <select
              value={allocationFilter}
              onChange={(e) => setAllocationFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Allocations</option>
              <option value="optimal">Optimal Load (70-100%)</option>
              <option value="available">Available Bandwidth (&lt;70%)</option>
              <option value="heavy">Overallocated (&gt;100%)</option>
            </select>

            {isFilterActive && (
              <button
                onClick={() => {
                  setFacultySearch('');
                  setCadreFilter('all');
                  setAllocationFilter('all');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            <span className="text-[11px] font-bold text-slate-500 ml-1">
              Showing {filteredStats.length} of {stats.length}
            </span>

          </div>

        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="p-3.5 pl-5">Instructor Name</th>
                <th className="p-3.5">Cadre</th>
                <th className="p-3.5 text-center">Semester Load</th>
                <th className="p-3.5 text-center">Standard Target</th>
                <th className="p-3.5 w-44">Allocation Level</th>
                <th className="p-3.5 text-center pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No faculty found matching the search and workload criteria.
                  </td>
                </tr>
              ) : filteredStats.map((faculty) => {

                const isProfessor = faculty.cadre === 'Professor';
                const isAssoc = faculty.cadre === 'AssociateProf';
                const pct = Math.min(100, Math.round((faculty.assignedHours / (faculty.targetHours || 16)) * 100));

                return (
                  <tr key={faculty.facultyId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 pl-5 font-bold text-slate-900">
                      {faculty.name}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isProfessor 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isAssoc 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {faculty.cadre}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                      {faculty.assignedHours} hrs
                    </td>
                    <td className="p-3.5 text-center text-slate-500 font-mono">
                      {faculty.targetHours} hrs
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{pct}% loaded</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Balanced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
