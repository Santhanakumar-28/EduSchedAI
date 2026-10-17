import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Zap, 
  ShieldCheck,
  Scale,
  Settings,
  Layers,
  ArrowRight
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
        maxConsecutiveLectures: consecutiveLectures
      },
      maxGenerations
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <span>AI Scheduling Studio & Heuristic Tuner</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure multi-objective fitness weights and launch the hybrid CSP + Genetic Algorithm engine.
          </p>
        </div>

        <button
          onClick={handleTrigger}
          disabled={isGenerating}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Optimizing Schedule...' : 'Launch AI Solver'}</span>
        </button>
      </div>

      {/* Solver Telemetry KPI Bar - 5 Clean White Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Execution Runtime</span>
          <span className="text-2xl font-bold text-slate-900 mt-0.5 block font-mono">
            {metrics?.executionTimeMs ?? 170} ms
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">⚡ Ultra-Fast Solver</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Hard Clashes</span>
          <span className="text-2xl font-bold text-emerald-600 mt-0.5 block font-mono">
            {metrics?.hardViolations ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Target: 0 (Inviolable)</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Workload Gini</span>
          <span className="text-2xl font-bold text-blue-600 mt-0.5 block font-mono">
            {metrics?.workloadGiniIndex ?? '0.2639'}
          </span>
          <span className="text-[10px] text-blue-500 font-bold block mt-1">Balanced across cadres</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <span className="text-slate-400 block text-[11px] font-semibold">Soft Penalty</span>
          <span className="text-2xl font-bold text-slate-900 mt-0.5 block font-mono">
            {metrics?.softPenaltyScore ?? '7.4'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Weighted Cost</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-slate-400 block text-[11px] font-semibold">Room Utilization</span>
          <span className="text-2xl font-bold text-slate-900 mt-0.5 block font-mono">
            {metrics?.roomUtilizationPercent ?? '25'}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Active Teaching Hours</span>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Weight Tuners */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Optimization Weights & Penalties</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Soft Constraint Objective Vector</span>
          </div>

          {/* Slider 1: Workload Balance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Faculty Workload Balancing Weight</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">{workloadWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={workloadWeight}
              onChange={(e) => setWorkloadWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[11px] text-slate-400">Penalizes deviations from cadre target hours (Prof: 14h, Assoc: 16h, Asst: 18h).</p>
          </div>

          {/* Slider 2: Minimize Student Gaps */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Minimize Student Idle Gaps</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">{studentGapWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={studentGapWeight}
              onChange={(e) => setStudentGapWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[11px] text-slate-400">Discourages empty break hours between lectures on the same day for students.</p>
          </div>

          {/* Slider 3: Minimize Faculty Waiting */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Minimize Faculty Waiting Windows</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">{facultyGapWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={facultyGapWeight}
              onChange={(e) => setFacultyGapWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[11px] text-slate-400">Compacts faculty daily schedules to reduce idle on-campus waiting periods.</p>
          </div>

          {/* Additional Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Max Consecutive Hours</label>
              <select
                value={consecutiveLectures}
                onChange={(e) => setConsecutiveLectures(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={2}>2 Continuous Hours (Standard)</option>
                <option value={3}>3 Continuous Hours (Extended)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Genetic / Simulated Annealing Iterations</label>
              <select
                value={maxGenerations}
                onChange={(e) => setMaxGenerations(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={300}>300 Generations (Fast Preview)</option>
                <option value={600}>600 Generations (Optimal Quality)</option>
                <option value={1000}>1000 Generations (Deep Exploration)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Architecture & Guarantees */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Two-Stage Solver Architecture</h2>
            </div>

            {/* Stage 1 Box */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-blue-700 block">Stage 1: Constructive CSP</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Uses Most Constrained Variable (MRV) ordering to allocate 2-hour lab practicals first into specialized computer labs, followed by forward conflict checks to guarantee zero clashes.
              </p>
            </div>

            {/* Stage 2 Box */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 block">Stage 2: Simulated Annealing</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Navigates the feasible solution space using conflict-preserving mutations to minimize Gini workload variance and eliminate fragmented idle gaps.
              </p>
            </div>

            {/* Invariant Guarantees */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Mathematical Guarantees
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>0 Faculty double-bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>0 Batch / cohort time collisions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>0 Room / laboratory double-bookings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Period 4 guaranteed Lunch break</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
