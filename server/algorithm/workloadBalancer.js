/**
 * EduSchedAI - Faculty Workload Balancer & Analytics Module
 * Computes teaching load distributions, Gini coefficient, and fairness metrics.
 */

/**
 * Calculate workload distribution and fairness metrics
 * @param {Array} schedule - Array of scheduled slot objects
 * @param {Array} facultyList - Array of faculty objects
 * @returns {Object} Workload analytics and Gini coefficient
 */
function calculateWorkloadMetrics(schedule, facultyList) {
  if (!facultyList || facultyList.length === 0) {
    return { giniIndex: 0, standardDeviation: 0, variance: 0, facultyStats: [] };
  }

  // 1. Calculate assigned hours per faculty member
  const loadMap = new Map();
  for (const f of facultyList) {
    const fId = String(f._id || f.id || f.employeeCode);
    loadMap.set(fId, {
      facultyId: fId,
      name: f.name,
      cadre: f.cadre,
      targetHours: f.targetHours || 16,
      assignedHours: 0,
      assignedSlots: []
    });
  }

  for (const slot of schedule) {
    const fId = String(slot.facultyId);
    if (loadMap.has(fId)) {
      const entry = loadMap.get(fId);
      entry.assignedHours += (slot.slotDuration || 1);
      entry.assignedSlots.push({ day: slot.day, period: slot.period, subjectId: slot.subjectId });
    }
  }

  const facultyStats = Array.from(loadMap.values()).map((f) => {
    const variance = f.assignedHours - f.targetHours;
    const utilizationRate = f.targetHours > 0 ? parseFloat(((f.assignedHours / f.targetHours) * 100).toFixed(1)) : 0;
    return {
      facultyId: f.facultyId,
      name: f.name,
      cadre: f.cadre,
      targetHours: f.targetHours,
      assignedHours: f.assignedHours,
      variance,
      utilizationRate
    };
  });

  const hoursArray = facultyStats.map((f) => f.assignedHours);
  const n = hoursArray.length;
  const totalHours = hoursArray.reduce((acc, h) => acc + h, 0);
  const meanHours = n > 0 ? totalHours / n : 0;

  // 2. Standard Deviation and Variance
  const squaredDiffs = hoursArray.map((h) => Math.pow(h - meanHours, 2));
  const variance = n > 0 ? squaredDiffs.reduce((acc, d) => acc + d, 0) / n : 0;
  const standardDeviation = Math.sqrt(variance);

  // 3. Gini Coefficient calculation
  // G = (sum_i sum_j |x_i - x_j|) / (2 * n * sum_i x_i)
  let sumAbsoluteDifferences = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sumAbsoluteDifferences += Math.abs(hoursArray[i] - hoursArray[j]);
    }
  }

  const giniIndex = (totalHours > 0 && n > 0)
    ? parseFloat((sumAbsoluteDifferences / (2 * n * totalHours)).toFixed(4))
    : 0;

  // 4. Departmental Fairness Score (100% is perfectly balanced)
  // Incorporates Gini equity and coefficient of variation
  const coeffOfVariation = meanHours > 0 ? (standardDeviation / meanHours) : 0;
  const fairnessScore = Math.max(
    0,
    Math.min(100, parseFloat(((1 - giniIndex) * 85 + (1 - Math.min(1, coeffOfVariation)) * 15).toFixed(1)))
  );

  return {
    totalAssignedHours: totalHours,
    averageHoursPerFaculty: parseFloat(meanHours.toFixed(2)),
    standardDeviation: parseFloat(standardDeviation.toFixed(2)),
    variance: parseFloat(variance.toFixed(2)),
    giniIndex,
    fairnessScore,
    facultyStats
  };
}

/**
 * Calculate Room Utilization Rate
 * @param {Array} schedule 
 * @param {Array} rooms 
 * @param {Object} config 
 */
function calculateRoomUtilization(schedule, rooms, config) {
  const activeDays = config.activeDays?.length || 5;
  const teachingPeriodsPerDay = (config.periodsPerDay || 7) - 1; // Exclude lunch
  const totalCapacitySlots = rooms.length * activeDays * teachingPeriodsPerDay;

  const usedSlots = schedule.length;
  const utilizationPercent = totalCapacitySlots > 0
    ? parseFloat(((usedSlots / totalCapacitySlots) * 100).toFixed(2))
    : 0;

  return {
    totalCapacitySlots,
    usedSlots,
    utilizationPercent
  };
}

module.exports = {
  calculateWorkloadMetrics,
  calculateRoomUtilization
};
