/**
 * EduSchedAI - Constraint Validator Module
 * Validates hard constraints H1-H8 and evaluates soft constraint penalties S1-S7.
 */

/**
 * Validate a schedule against all hard constraints
 * @param {Array} schedule - Array of scheduled slot objects
 * @param {Object} context - Academic dataset { batches, faculty, rooms, subjects, config }
 * @returns {Object} { isValid, hardViolations, stats }
 */
function validateHardConstraints(schedule, context) {
  const { batches, faculty, rooms, subjects, config } = context;
  const hardViolations = [];

  const facultyMap = new Map(faculty.map((f) => [String(f._id || f.id || f.employeeCode), f]));
  const batchMap = new Map(batches.map((b) => [String(b._id || b.id || b.code), b]));
  const roomMap = new Map(rooms.map((r) => [String(r._id || r.id || r.roomNumber), r]));
  const subjectMap = new Map(subjects.map((s) => [String(s._id || s.id || s.code), s]));

  const facultyTimeSlotOccupancy = new Map(); // key: "facultyId:day:period"
  const batchTimeSlotOccupancy = new Map();   // key: "batchId:day:period"
  const roomTimeSlotOccupancy = new Map();    // key: "roomId:day:period"

  const subjectAllocatedHours = new Map();    // key: "batchId:subjectId" -> count

  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i];
    const { day, period, batchId, subjectId, facultyId, roomId, isLabBlock } = slot;

    const fIdStr = String(facultyId);
    const bIdStr = String(batchId);
    const rIdStr = String(roomId);
    const sIdStr = String(subjectId);

    const fObj = facultyMap.get(fIdStr);
    const bObj = batchMap.get(bIdStr);
    const rObj = roomMap.get(rIdStr);
    const sObj = subjectMap.get(sIdStr);

    const timeKey = `${day}:${period}`;

    // H0: Lunch period reserved check
    if (config.lunchBreakPeriod && period === config.lunchBreakPeriod) {
      hardViolations.push(
        `[H0-Lunch] Session scheduled during designated lunch period (${day}, Period ${period}) for batch ${bObj?.name || bIdStr}`
      );
    }

    // H1: No Faculty double-booking
    const fKey = `${fIdStr}:${timeKey}`;
    if (facultyTimeSlotOccupancy.has(fKey)) {
      hardViolations.push(
        `[H1-FacultyClash] Faculty ${fObj?.name || fIdStr} is double-booked on ${day} at period ${period} (Batches: ${facultyTimeSlotOccupancy.get(fKey)} and ${bObj?.name || bIdStr})`
      );
    } else {
      facultyTimeSlotOccupancy.set(fKey, bObj?.name || bIdStr);
    }

    // H2: No Student Batch double-booking
    const bKey = `${bIdStr}:${timeKey}`;
    if (batchTimeSlotOccupancy.has(bKey)) {
      hardViolations.push(
        `[H2-BatchClash] Batch ${bObj?.name || bIdStr} has overlapping classes on ${day} at period ${period}`
      );
    } else {
      batchTimeSlotOccupancy.set(bKey, sObj?.name || sIdStr);
    }

    // H3: No Room double-booking
    const rKey = `${rIdStr}:${timeKey}`;
    if (roomTimeSlotOccupancy.has(rKey)) {
      hardViolations.push(
        `[H3-RoomClash] Room ${rObj?.roomNumber || rIdStr} is double-booked on ${day} at period ${period}`
      );
    } else {
      roomTimeSlotOccupancy.set(rKey, bObj?.name || bIdStr);
    }

    // H4: Room capacity vs batch strength
    if (rObj && bObj && rObj.capacity < bObj.studentStrength) {
      hardViolations.push(
        `[H4-Capacity] Room ${rObj.roomNumber} capacity (${rObj.capacity}) is less than batch ${bObj.name} strength (${bObj.studentStrength})`
      );
    }

    // H5: Room type suitability
    if (sObj && rObj) {
      if (sObj.type === 'Lab' && rObj.roomType !== sObj.preferredRoomType && rObj.roomType !== 'ComputerLab' && rObj.roomType !== 'HardwareLab') {
        hardViolations.push(
          `[H5-RoomType] Lab subject ${sObj.code} assigned to unsuitable room type ${rObj.roomType} (${rObj.roomNumber})`
        );
      }
    }

    // H8: Faculty unavailability
    if (fObj && fObj.unavailableSlots && fObj.unavailableSlots.length > 0) {
      const isUnavailable = fObj.unavailableSlots.some(
        (u) => u.day === day && u.period === period
      );
      if (isUnavailable) {
        hardViolations.push(
          `[H8-FacultyUnavailable] Faculty ${fObj.name} is scheduled on declared unavailable slot (${day}, Period ${period})`
        );
      }
    }

    // Track weekly hours per batch & subject
    const batchSubKey = `${bIdStr}:${sIdStr}`;
    subjectAllocatedHours.set(batchSubKey, (subjectAllocatedHours.get(batchSubKey) || 0) + 1);
  }

  // H7: Exact weekly curriculum hours satisfied
  for (const b of batches) {
    const bIdStr = String(b._id || b.id || b.code);
    for (const s of subjects) {
      const sIdStr = String(s._id || s.id || s.code);
      const allocated = subjectAllocatedHours.get(`${bIdStr}:${sIdStr}`) || 0;
      if (allocated !== s.weeklyLectures) {
        hardViolations.push(
          `[H7-CurriculumQuota] Batch ${b.name}: Subject ${s.code} requires ${s.weeklyLectures} hrs/week but has ${allocated} hrs allocated`
        );
      }
    }
  }

  return {
    isValid: hardViolations.length === 0,
    hardViolations,
    violationCount: hardViolations.length,
    totalSlots: schedule.length
  };
}

/**
 * Evaluate soft constraint penalties S1-S7
 * @param {Array} schedule - Array of scheduled slot objects
 * @param {Object} context - Academic dataset
 * @returns {Object} Soft penalties breakdown and total weighted score
 */
function evaluateSoftPenalties(schedule, context) {
  const { batches, faculty, subjects, config } = context;
  const weights = config.weights || {
    workloadBalance: 80,
    minimizeStudentGaps: 70,
    minimizeFacultyGaps: 60,
    honorFacultyPreferences: 50,
    evenSubjectSpread: 65,
    maxConsecutiveLectures: 60
  };

  let studentGapPenalty = 0;
  let facultyGapPenalty = 0;
  let facultyPrefPenalty = 0;
  let subjectSpreadPenalty = 0;
  let consecutiveHoursPenalty = 0;

  const days = config.activeDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const maxPeriod = config.periodsPerDay || 7;
  const lunchPeriod = config.lunchBreakPeriod || 4;

  // 1. Analyze Batch Daily Continuity (Minimize Student Gaps)
  for (const b of batches) {
    const bIdStr = String(b._id || b.id || b.code);
    for (const day of days) {
      const daySlots = schedule
        .filter((s) => String(s.batchId) === bIdStr && s.day === day)
        .map((s) => s.period)
        .sort((a, b) => a - b);

      if (daySlots.length > 1) {
        // Count internal empty periods (excluding lunch)
        const minP = daySlots[0];
        const maxP = daySlots[daySlots.length - 1];
        const slotSet = new Set(daySlots);

        for (let p = minP; p <= maxP; p++) {
          if (p === lunchPeriod) continue; // Lunch is an expected break
          if (!slotSet.has(p)) {
            studentGapPenalty += 1; // 1 idle gap found
          }
        }
      }
    }
  }

  // 2. Analyze Faculty Daily Continuity & Consecutive Hours
  const facultyMap = new Map(faculty.map((f) => [String(f._id || f.id || f.employeeCode), f]));

  for (const f of faculty) {
    const fIdStr = String(f._id || f.id || f.employeeCode);

    for (const day of days) {
      const daySlots = schedule
        .filter((s) => String(s.facultyId) === fIdStr && s.day === day)
        .map((s) => s.period)
        .sort((a, b) => a - b);

      if (daySlots.length > 1) {
        // Faculty Gaps
        const minP = daySlots[0];
        const maxP = daySlots[daySlots.length - 1];
        const slotSet = new Set(daySlots);

        for (let p = minP; p <= maxP; p++) {
          if (p === lunchPeriod) continue;
          if (!slotSet.has(p)) {
            facultyGapPenalty += 1;
          }
        }

        // Max Consecutive Hours Check (> config.maxConsecutiveLectures, e.g. > 2)
        let consecutiveCount = 1;
        for (let i = 1; i < daySlots.length; i++) {
          if (daySlots[i] === daySlots[i - 1] + 1 && daySlots[i] !== lunchPeriod) {
            consecutiveCount++;
            if (consecutiveCount > (config.maxConsecutiveLectures || 2)) {
              consecutiveHoursPenalty += (consecutiveCount - (config.maxConsecutiveLectures || 2));
            }
          } else {
            consecutiveCount = 1;
          }
        }
      }

      // Check Faculty Slot Preferences (S4)
      if (f.preferredSlots && f.preferredSlots.length > 0) {
        for (const pref of f.preferredSlots) {
          if (pref.day === day) {
            const isAssigned = daySlots.includes(pref.period);
            if (!isAssigned && pref.weight > 0) {
              facultyPrefPenalty += 0.5; // Preferred slot missed
            }
          }
        }
      }
    }
  }

  // 3. Subject Spread Check (Theory subjects shouldn't be crammed into 1 day)
  for (const b of batches) {
    const bIdStr = String(b._id || b.id || b.code);
    for (const s of subjects) {
      if (s.type === 'Theory') {
        const sIdStr = String(s._id || s.id || s.code);
        for (const day of days) {
          const countOnDay = schedule.filter(
            (slot) => String(slot.batchId) === bIdStr && String(slot.subjectId) === sIdStr && slot.day === day
          ).length;
          if (countOnDay > 1) {
            // More than 1 theory lecture of same subject on same day
            subjectSpreadPenalty += (countOnDay - 1);
          }
        }
      }
    }
  }

  const maxConsecutiveWeight = weights.maxConsecutiveLectures || 60;
  const studentGapWeight = weights.minimizeStudentGaps || 70;
  const facultyGapWeight = weights.minimizeFacultyGaps || 60;
  const facultyPrefWeight = weights.honorFacultyPreferences || 50;
  const subjectSpreadWeight = weights.evenSubjectSpread || 65;

  const totalScore =
    studentGapPenalty * (studentGapWeight / 100) +
    facultyGapPenalty * (facultyGapWeight / 100) +
    consecutiveHoursPenalty * (maxConsecutiveWeight / 100) +
    facultyPrefPenalty * (facultyPrefWeight / 100) +
    subjectSpreadPenalty * (subjectSpreadWeight / 100);

  return {
    studentGapPenalty,
    facultyGapPenalty,
    consecutiveHoursPenalty,
    facultyPrefPenalty,
    subjectSpreadPenalty,
    totalPenaltyScore: parseFloat(totalScore.toFixed(2))
  };
}

module.exports = {
  validateHardConstraints,
  evaluateSoftPenalties
};
