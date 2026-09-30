/**
 * EduSchedAI - Stage 2: Genetic Algorithm & Local Search Optimizer
 * Iteratively refines soft constraints and faculty workload balance while preserving 100% hard feasibility.
 */

const { validateHardConstraints, evaluateSoftPenalties } = require('./validator');
const { calculateWorkloadMetrics } = require('./workloadBalancer');

class GeneticOptimizer {
  constructor(initialSchedule, context) {
    this.initialSchedule = initialSchedule;
    this.context = context;
    this.config = context.config;
    this.maxGenerations = this.config.maxGenerations || 600;
  }

  /**
   * Compute multi-objective fitness score
   * Lower score = better schedule
   */
  calculateFitness(schedule) {
    const penaltyResult = evaluateSoftPenalties(schedule, this.context);
    const workloadResult = calculateWorkloadMetrics(schedule, this.context.faculty);

    // Objective: Minimize soft penalties + Gini Index * 100 + Workload Variance * 10
    const fitnessScore =
      penaltyResult.totalPenaltyScore +
      workloadResult.giniIndex * 150 +
      workloadResult.variance * 8;

    return {
      fitnessScore,
      softPenalties: penaltyResult,
      workload: workloadResult
    };
  }

  /**
   * Clone a schedule deeply
   */
  cloneSchedule(schedule) {
    return schedule.map((slot) => ({ ...slot }));
  }

  /**
   * Check if a candidate schedule preserves all hard constraints
   */
  isFeasible(schedule) {
    const check = validateHardConstraints(schedule, this.context);
    return check.isValid;
  }

  /**
   * Optimize the schedule using Simulated Annealing / Local Search
   */
  optimize() {
    let currentSchedule = this.cloneSchedule(this.initialSchedule);
    let currentEval = this.calculateFitness(currentSchedule);

    let bestSchedule = this.cloneSchedule(currentSchedule);
    let bestFitness = currentEval.fitnessScore;

    let temperature = 100.0;
    const coolingRate = 0.992;

    const batches = this.context.batches;
    const days = this.context.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = this.context.periodsPerDay || 7;
    const lunch = this.context.lunchBreakPeriod || 4;

    for (let gen = 0; gen < this.maxGenerations; gen++) {
      // Create mutation: pick a random batch and attempt to swap two theory slots
      const candidateSchedule = this.cloneSchedule(currentSchedule);

      // Select random batch
      const randomBatch = batches[Math.floor(Math.random() * batches.length)];
      const bIdStr = String(randomBatch._id || randomBatch.id || randomBatch.code);

      // Filter slots for this batch that are theory (labs should remain contiguous)
      const batchTheoryIndices = [];
      for (let i = 0; i < candidateSchedule.length; i++) {
        if (String(candidateSchedule[i].batchId) === bIdStr && candidateSchedule[i].type === 'Theory') {
          batchTheoryIndices.push(i);
        }
      }

      if (batchTheoryIndices.length >= 2) {
        // Pick two distinct slots to swap
        const idx1 = batchTheoryIndices[Math.floor(Math.random() * batchTheoryIndices.length)];
        let idx2 = batchTheoryIndices[Math.floor(Math.random() * batchTheoryIndices.length)];
        while (idx1 === idx2) {
          idx2 = batchTheoryIndices[Math.floor(Math.random() * batchTheoryIndices.length)];
        }

        const slotA = candidateSchedule[idx1];
        const slotB = candidateSchedule[idx2];

        // Swap day and period
        const tempDay = slotA.day;
        const tempPeriod = slotA.period;

        slotA.day = slotB.day;
        slotA.period = slotB.period;

        slotB.day = tempDay;
        slotB.period = tempPeriod;

        // Verify that the swap didn't introduce hard clashes
        if (this.isFeasible(candidateSchedule)) {
          const newEval = this.calculateFitness(candidateSchedule);
          const delta = newEval.fitnessScore - currentEval.fitnessScore;

          // Accept if improved, or with probability e^(-delta / temp)
          if (delta < 0 || Math.exp(-delta / temperature) > Math.random()) {
            currentSchedule = candidateSchedule;
            currentEval = newEval;

            if (newEval.fitnessScore < bestFitness) {
              bestSchedule = this.cloneSchedule(candidateSchedule);
              bestFitness = newEval.fitnessScore;
            }
          }
        }
      }

      temperature *= coolingRate;
    }

    const finalEval = this.calculateFitness(bestSchedule);

    return {
      optimizedSchedule: bestSchedule,
      initialFitness: this.calculateFitness(this.initialSchedule).fitnessScore,
      finalFitness: bestFitness,
      softPenalties: finalEval.softPenalties,
      workload: finalEval.workload,
      generationsRun: this.maxGenerations
    };
  }
}

module.exports = GeneticOptimizer;
