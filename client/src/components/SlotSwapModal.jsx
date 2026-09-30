import React, { useState } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export default function SlotSwapModal({ 
  selectedSlot, 
  onClose, 
  dataset, 
  schedule, 
  onSwapSuccess 
}) {
  const [targetDay, setTargetDay] = useState(selectedSlot?.day || 'Monday');
  const [targetPeriod, setTargetPeriod] = useState(
    selectedSlot?.period === 1 ? 2 : 1
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [clashDetails, setClashDetails] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!selectedSlot) return null;

  const days = dataset?.config?.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = dataset?.config?.periodsPerDay || 7;
  const lunchP = dataset?.config?.lunchBreakPeriod || 4;

  const subject = dataset?.subjects?.find((s) => String(s._id) === String(selectedSlot.subjectId));
  const teacher = dataset?.faculty?.find((f) => String(f._id) === String(selectedSlot.facultyId));
  const room = dataset?.rooms?.find((r) => String(r._id) === String(selectedSlot.roomId));
  const batch = dataset?.batches?.find((b) => String(b._id) === String(selectedSlot.batchId));

  // Find if another session already exists at the target slot for this batch
  const existingTargetSlot = schedule.find(
    (s) => String(s.batchId) === String(selectedSlot.batchId) && s.day === targetDay && s.period === Number(targetPeriod)
  );

  const existingTargetSubject = existingTargetSlot
    ? dataset?.subjects?.find((s) => String(s._id) === String(existingTargetSlot.subjectId))
    : null;

  const handleExecuteSwap = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    setClashDetails([]);

    // Check lunch collision
    if (Number(targetPeriod) === lunchP) {
      setIsVerifying(false);
      setErrorMessage('Cannot move class into designated Lunch Period (Period 4).');
      return;
    }

    try {
      // Find slot index in schedule array
      const slotIndexA = schedule.findIndex(
        (s) => String(s.batchId) === String(selectedSlot.batchId) &&
               s.day === selectedSlot.day &&
               s.period === selectedSlot.period
      );

      let slotIndexB = undefined;
      if (existingTargetSlot) {
        slotIndexB = schedule.findIndex(
          (s) => String(s.batchId) === String(existingTargetSlot.batchId) &&
                 s.day === existingTargetSlot.day &&
                 s.period === existingTargetSlot.period
        );
      }

      const response = await fetch('/api/timetable/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotIndexA,
          slotIndexB,
          targetDay,
          targetPeriod: Number(targetPeriod)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Slot reassignment verified with 0 clashes!');
        setTimeout(() => {
          onSwapSuccess(data.data);
          onClose();
        }, 1000);
      } else {
        setErrorMessage(data.message || 'Hard Constraint Clash Detected!');
        setClashDetails(data.violations || []);
      }
    } catch (err) {
      setErrorMessage('Network error communicating with scheduling server: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Reassign or Swap Slot</h3>
              <p className="text-[11px] text-slate-500">Live conflict detection and timetable mutation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Active Slot Overview */}
          <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100/80">
            <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider mb-1">Selected Source Session</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-indigo-950">{subject?.code} - {subject?.name}</span>
                <p className="text-slate-600 mt-0.5">Instructor: <span className="font-semibold text-slate-900">{teacher?.name}</span> • Batch: <span className="font-semibold">{batch?.name}</span></p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-indigo-700 shadow-2xs">
                {selectedSlot.day}, P{selectedSlot.period}
              </span>
            </div>
          </div>

          {/* Target Placement Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Day</label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Period</label>
              <select
                value={targetPeriod}
                onChange={(e) => setTargetPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: periods }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p} disabled={p === lunchP}>
                    Period {p} {p === lunchP ? '(Lunch Break - Reserved)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Preview Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600 flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              {existingTargetSlot ? (
                <p>
                  Target slot currently hosts <span className="font-bold text-slate-900">{existingTargetSubject?.code} ({existingTargetSubject?.name})</span>. This action will <strong>swap both sessions</strong>.
                </p>
              ) : (
                <p>
                  Target slot is currently <strong>free</strong>. This action will move this class to the open slot.
                </p>
              )}
            </div>
          </div>

          {/* Validation Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1 animate-in fade-in">
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              {clashDetails.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 mt-1">
                  {clashDetails.map((violation, i) => (
                    <li key={i}>{violation}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs">{successMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteSwap}
            disabled={isVerifying}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-sm transition-all text-xs disabled:opacity-50 flex items-center"
          >
            {isVerifying ? 'Checking Clashes...' : 'Verify & Apply Swap'}
          </button>
        </div>

      </div>
    </div>
  );
}
