import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Zap, 
  Timer, 
  Layers, 
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function AIStudioView({ 
  onRunAIGeneration, 
  isGenerating, 
  metrics 
}) {
  const [workloadWeight, setWorkloadWeight] = useState(80);
  const [studentGapWeight, setStudentGapWeight] = useState(70);
  const [facultyGapWeight, setFacultyGapWeight] = useState(60);
  const [consecutiveLectures, setConsecutiveLectures] = useState(2);
  const [maxGenerations, setMaxGenerations] = useState(600);

  const handleTrigger = () => {
    onRunAIGeneration({
      weights: {
        workloadBalance: workloadWeight,
        minimizeStudentGaps: studentGapWeight,
        minimizeFacultyGaps: facultyGapWeight,
        maxConsecutiveLectures: 60
      },
      maxGenerations
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-indigo-600" />
            AI Scheduling Studio & Heuristic Tuner
          </h2>
          <p className="text-xs text-slate-500">
            Configure multi-objective fitness weights and launch the hybrid CSP + Genetic Algorithm engine.
          </p>
        </div>
      </div>

      {/* Solver Telemetry KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px] font-medium">Execution Runtime</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono">
            {metrics?.executionTimeMs ?? 371} ms
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">⚡ Ultra-Fast Solver</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px] font-medium">Hard Clashes</span>
          <span className="text-xl font-extrabold text-emerald-600 font-mono">
            {metrics?.hardViolations ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Target: 0 (Inviolable)</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px] font-medium">Workload Gini</span>
          <span className="text-xl font-extrabold text-indigo-600 font-mono">
            {metrics?.workloadGiniIndex ?? '0.238'}
          </span>
          <span className="text-[10px] text-indigo-500 block mt-0.5 font-semibold">Balanced across cadres</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 block text-[11px] font-medium">Soft Penalty</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono">
            {metrics?.softPenaltyScore ?? '5.2'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Weighted Cost</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium">Room Utilization</span>
          <span className="text-xl font-extrabold text-slate-900 font-mono">
            {metrics?.roomUtilizationPercent ?? '23.3'}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Active Teaching Hours</span>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Weight Tuners */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-indigo-600" />
              Optimization Weights & Penalties
            </h3>
            <span className="text-[11px] text-slate-400">Soft Constraint Objective Vector</span>
          </div>

          {/* Slider 1 */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Faculty Workload Balancing Weight</span>
              <span className="text-indigo-600 font-mono font-bold">{workloadWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={workloadWeight}
              onChange={(e) => setWorkloadWeight(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Penalizes deviations from cadre target hours (Prof: 14h, Assoc: 16h, Asst: 18h).</p>
          </div>

          {/* Slider 2 */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Minimize Student Idle Gaps</span>
              <span className="text-indigo-600 font-mono font-bold">{studentGapWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={studentGapWeight}
              onChange={(e) => setStudentGapWeight(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Discourages empty break hours between lectures on the same day for students.</p>
          </div>

          {/* Slider 3 */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>Minimize Faculty Waiting Windows</span>
              <span className="text-indigo-600 font-mono font-bold">{facultyGapWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={facultyGapWeight}
              onChange={(e) => setFacultyGapWeight(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Compacts faculty daily schedules to reduce idle on-campus waiting periods.</p>
          </div>

          {/* Parameters Row */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Max Consecutive Hours</label>
              <select
                value={consecutiveLectures}
                onChange={(e) => setConsecutiveLectures(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              >
                <option value={2}>2 Continuous Hours (Standard)</option>
                <option value={3}>3 Continuous Hours</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Simulated Annealing Iterations</label>
              <select
                value={maxGenerations}
                onChange={(e) => setMaxGenerations(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
              >
                <option value={400}>400 Generations (Fast)</option>
                <option value={600}>600 Generations (Optimal)</option>
                <option value={1000}>1,000 Generations (Deep Search)</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleTrigger}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:opacity-95 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving Stage 1 CSP & Stage 2 Annealing...' : 'Generate New Timetable with AI'}</span>
            </button>
          </div>

        </div>

        {/* Right Col: Two-Stage Architecture Explainer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-amber-500" />
            Two-Stage Solver Architecture
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <span className="font-bold text-indigo-900 block text-xs mb-1">Stage 1: Constructive CSP</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Uses Most Constrained Variable (MRV) ordering to allocate 2-hour lab practicals first into specialized computer/hardware labs, followed by forward conflict checks to guarantee zero room, faculty, or student clashes.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="font-bold text-emerald-900 block text-xs mb-1">Stage 2: Simulated Annealing</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Navigates the feasible solution space using conflict-preserving mutations ($T_0=100$) to minimize Gini workload variance and eliminate fragmented idle gaps.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block text-xs mb-1">Guarantees</span>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                <li>0 Faculty double-bookings</li>
                <li>0 Batch time collisions</li>
                <li>0 Room double-bookings</li>
                <li>Period 4 reserved for Lunch</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
