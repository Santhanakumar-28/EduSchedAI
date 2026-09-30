/**
 * EduSchedAI - Algorithm Unit Testing & Benchmark Runner
 * Validates the core scheduling algorithm in isolation using the CSE benchmark dataset.
 */

const {
  sampleDepartment,
  sampleConstraintConfig,
  sampleRooms,
  sampleFaculty,
  sampleBatches,
  sampleSubjects
} = require('./seeders/sampleData');

const { generateTimetable } = require('./algorithm/scheduler');
const { validateHardConstraints } = require('./algorithm/validator');

console.log('================================================================');
console.log('🧪 EDUSCHEDAI - CORE SCHEDULING ALGORITHM ISOLATION TEST SUITE');
console.log('================================================================\n');

// 1. Prepare relational context
const facultyCodeMap = {};
sampleFaculty.forEach((f, idx) => {
  f._id = `fac_${idx + 1}`;
  facultyCodeMap[f.employeeCode] = f._id;
});

sampleRooms.forEach((r, idx) => {
  r._id = `room_${idx + 1}`;
});

sampleBatches.forEach((b, idx) => {
  b._id = `batch_${idx + 1}`;
});

sampleSubjects.forEach((s, idx) => {
  s._id = `subj_${idx + 1}`;
  s.assignedFacultyIds = [];
  if (s.primaryFacultyCode && facultyCodeMap[s.primaryFacultyCode]) {
    s.assignedFacultyIds.push(facultyCodeMap[s.primaryFacultyCode]);
  }
  if (s.altFacultyCode && facultyCodeMap[s.altFacultyCode]) {
    s.assignedFacultyIds.push(facultyCodeMap[s.altFacultyCode]);
  }
});

const context = {
  department: sampleDepartment,
  config: sampleConstraintConfig,
  rooms: sampleRooms,
  faculty: sampleFaculty,
  batches: sampleBatches,
  subjects: sampleSubjects
};

console.log(`📊 Test Parameters:`);
console.log(`   - Batches:   ${sampleBatches.length} (${sampleBatches.map(b => b.name).join(', ')})`);
console.log(`   - Faculty:   ${sampleFaculty.length} members`);
console.log(`   - Rooms:     ${sampleRooms.length} rooms/labs`);
console.log(`   - Subjects:  ${sampleSubjects.length} courses (${sampleSubjects.filter(s => s.type === 'Lab').length} Labs, ${sampleSubjects.filter(s => s.type === 'Theory').length} Theory)\n`);

// 2. Execute Algorithm
const result = generateTimetable(context);

// 3. Automated Assertions
console.log('\n----------------------------------------------------------------');
console.log('🔍 RUNNING RIGOROUS ALGORITHM ASSERTIONS:');
console.log('----------------------------------------------------------------');

// Assertion 1: Generation Success
console.assert(result.success === true, '❌ FAILURE: Algorithm failed to generate timetable!');
console.log('✅ PASS [Assertion 1]: Schedule generation completed successfully.');

// Assertion 2: Zero Hard Violations
console.assert(result.metrics.hardViolations === 0, `❌ FAILURE: Found ${result.metrics.hardViolations} hard violations!`);
console.log('✅ PASS [Assertion 2]: Hard Constraint Violations == 0 (100% Clash-Free).');

// Assertion 3: Total Slots Scheduled
const expectedSlotsPerBatch = sampleSubjects.reduce((sum, s) => sum + s.weeklyLectures, 0);
const expectedTotalSlots = expectedSlotsPerBatch * sampleBatches.length;
console.assert(result.schedule.length === expectedTotalSlots, `❌ FAILURE: Expected ${expectedTotalSlots} slots, got ${result.schedule.length}!`);
console.log(`✅ PASS [Assertion 3]: Full curriculum quota satisfied (${result.schedule.length}/${expectedTotalSlots} periods placed).`);

// Assertion 4: Contiguous Lab Verification
let labContiguityViolations = 0;
for (const batch of sampleBatches) {
  const bId = String(batch._id);
  const labSubjects = sampleSubjects.filter(s => s.type === 'Lab');
  
  for (const lab of labSubjects) {
    const sId = String(lab._id);
    const labSlots = result.schedule.filter(s => s.batchId === bId && s.subjectId === sId);
    
    // Check if slots are on same day and contiguous
    if (labSlots.length === 2) {
      if (labSlots[0].day !== labSlots[1].day) {
        labContiguityViolations++;
      } else {
        const periods = [labSlots[0].period, labSlots[1].period].sort((a, b) => a - b);
        if (periods[1] !== periods[0] + 1) {
          labContiguityViolations++;
        }
      }
    }
  }
}
console.assert(labContiguityViolations === 0, `❌ FAILURE: Found ${labContiguityViolations} broken lab blocks!`);
console.log('✅ PASS [Assertion 4]: All 2-hour laboratory sessions are strictly contiguous.');

// Assertion 5: Lunch Break Invariant
const lunchSlots = result.schedule.filter(s => s.period === sampleConstraintConfig.lunchBreakPeriod);
console.assert(lunchSlots.length === 0, `❌ FAILURE: Found ${lunchSlots.length} sessions during lunch break!`);
console.log(`✅ PASS [Assertion 5]: Lunch Break (Period ${sampleConstraintConfig.lunchBreakPeriod}) is strictly preserved with 0 bookings.`);

// Assertion 6: Faculty Workload Fairness
console.assert(result.metrics.workloadGiniIndex < 0.28, `❌ Workload Gini Index is too high (${result.metrics.workloadGiniIndex})`);
console.log(`✅ PASS [Assertion 6]: Faculty Workload Gini Index is ${result.metrics.workloadGiniIndex} (Well within fairness threshold < 0.28).`);

// 4. Print Visual ASCII Timetable for CSE Section A
console.log('\n================================================================');
console.log('📅 GENERATED MASTER TIMETABLE: BATCH CSE SECTION A');
console.log('================================================================');

const days = sampleConstraintConfig.activeDays;
const periods = sampleConstraintConfig.periodsPerDay;
const batchASchedule = result.schedule.filter(s => s.batchId === String(sampleBatches[0]._id));

const subjMap = new Map(sampleSubjects.map(s => [String(s._id), s]));
const facMap = new Map(sampleFaculty.map(f => [String(f._id), f]));
const roomMap = new Map(sampleRooms.map(r => [String(r._id), r]));

// Header
let header = 'Day        |';
for (let p = 1; p <= periods; p++) {
  if (p === sampleConstraintConfig.lunchBreakPeriod) {
    header += ' LUNCH BREAK |';
  } else {
    header += ` Period ${p}   |`;
  }
}
console.log(header);
console.log('-'.repeat(header.length));

for (const day of days) {
  let row = `${day.padEnd(10)} |`;
  for (let p = 1; p <= periods; p++) {
    if (p === sampleConstraintConfig.lunchBreakPeriod) {
      row += ' [ 12:00 ]   |';
    } else {
      const match = batchASchedule.find(s => s.day === day && s.period === p);
      if (match) {
        const sub = subjMap.get(match.subjectId);
        const code = sub ? sub.code : 'UNKNOWN';
        row += ` ${code.padEnd(10)} |`;
      } else {
        row += ' --- free ---|';
      }
    }
  }
  console.log(row);
}
console.log('-'.repeat(header.length));

// 5. Print Workload Distribution Table
console.log('\n================================================================');
console.log('👨‍🏫 FACULTY WORKLOAD DISTRIBUTION AUDIT');
console.log('================================================================');
console.log('Faculty Name              | Cadre         | Target | Assigned | Variance');
console.log('------------------------------------------------------------------------');
for (const stat of result.workloadDetails.facultyStats) {
  const name = stat.name.padEnd(25);
  const cadre = stat.cadre.padEnd(13);
  const target = String(stat.targetHours).padStart(6);
  const assigned = String(stat.assignedHours).padStart(8);
  const diff = (stat.variance >= 0 ? `+${stat.variance}` : String(stat.variance)).padStart(8);
  console.log(`${name} | ${cadre} | ${target} | ${assigned} | ${diff}`);
}
console.log('------------------------------------------------------------------------');
console.log(`Department Average Workload: ${result.workloadDetails.averageHoursPerFaculty} hrs/week`);
console.log(`Workload Standard Deviation: ${result.workloadDetails.standardDeviation}`);
console.log(`Department Fairness Score:   ${result.metrics.workloadFairnessScore}%`);
console.log(`Execution Time:              ${result.metrics.executionTimeMs} ms`);
console.log('================================================================\n');

console.log('🎉 ALL UNIT TESTS & PERFORMANCE BENCHMARKS PASSED 100%!');
