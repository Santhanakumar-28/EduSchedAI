/**
 * EduSchedAI - Master Scheduling Orchestrator
 * Connects Stage 1 CSP solver with Stage 2 Genetic/Local search optimizer.
 */

const CSPSolver = require('./cspSolver');
const GeneticOptimizer = require('./geneticOptimizer');
const { validateHardConstraints, evaluateSoftPenalties } = require('./validator');
const { calculateWorkloadMetrics, calculateRoomUtilization } = require('./workloadBalancer');

/**
 * Generate an intelligent, clash-free, workload-balanced timetable
 * @param {Object} context - Academic dataset { batches, faculty, rooms, subjects, config }
 * @returns {Object} { success, schedule, metrics, errors }
 */
function generateTimetable(context) {
  const startTime = Date.now();

  const config = context.config || {
    activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 7,
    lunchBreakPeriod: 4,
    maxConsecutiveLectures: 2,
    maxGenerations: 600
  };
  context.config = config;

  console.log('🚀 [EduSchedAI Engine] Starting Stage 1: Constructive CSP Solver...');
  const cspSolver = new CSPSolver(context);
  const cspResult = cspSolver.solve();

  if (!cspResult.success) {
    return {
      success: false,
      error: 'CSP Solver could not find a clash-free baseline schedule. The problem may be over-constrained.',
      placedCount: cspResult.totalPlaced,
      requiredCount: cspResult.totalEvents
    };
  }

  console.log(`✅ [EduSchedAI Engine] Stage 1 Success: Placed ${cspResult.totalPlaced} slots with zero hard clashes.`);

  console.log('🧬 [EduSchedAI Engine] Starting Stage 2: Quality & Workload Optimizer...');
  const optimizer = new GeneticOptimizer(cspResult.schedule, context);
  const optResult = optimizer.optimize();

  const finalSchedule = optResult.optimizedSchedule;
  const executionTimeMs = Date.now() - startTime;

  // Final Independent Validation
  const validation = validateHardConstraints(finalSchedule, context);
  const softPenalties = evaluateSoftPenalties(finalSchedule, context);
  const workloadMetrics = calculateWorkloadMetrics(finalSchedule, context.faculty);
  const roomUtilization = calculateRoomUtilization(finalSchedule, context.rooms, config);

  console.log(`🎯 [EduSchedAI Engine] Timetable Generated in ${executionTimeMs}ms!`);
  console.log(`   - Hard Violations: ${validation.hardViolations.length}`);
  console.log(`   - Soft Penalty Score: ${softPenalties.totalPenaltyScore}`);
  console.log(`   - Workload Gini Index: ${workloadMetrics.giniIndex}`);
  console.log(`   - Fairness Score: ${workloadMetrics.fairnessScore}%`);
  console.log(`   - Room Utilization: ${roomUtilization.utilizationPercent}%`);

  return {
    success: validation.isValid,
    schedule: finalSchedule,
    metrics: {
      executionTimeMs,
      hardViolations: validation.hardViolations.length,
      softPenaltyScore: softPenalties.totalPenaltyScore,
      workloadGiniIndex: workloadMetrics.giniIndex,
      workloadFairnessScore: workloadMetrics.fairnessScore,
      roomUtilizationPercent: roomUtilization.utilizationPercent,
      totalSlotsScheduled: finalSchedule.length,
      initialFitness: optResult.initialFitness,
      optimizedFitness: optResult.finalFitness
    },
    workloadDetails: workloadMetrics,
    softPenaltiesBreakdown: softPenalties,
    validationDetails: validation
  };
}

module.exports = {
  generateTimetable
};
