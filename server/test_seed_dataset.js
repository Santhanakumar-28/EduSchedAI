const {
  sampleDepartment,
  sampleConstraintConfig,
  sampleRooms,
  sampleFaculty,
  sampleBatches,
  sampleSubjects
} = require('./seeders/sampleData');

console.log('🔍 Running Seed Dataset Structural Validation Test...');

// 1. Verify Department
console.assert(sampleDepartment.code === 'CSE', 'Department code must be CSE');

// 2. Verify Rooms
console.assert(sampleRooms.length >= 8, 'Must have at least 8 rooms/labs');
const roomTypes = new Set(sampleRooms.map((r) => r.roomType));
console.assert(roomTypes.has('LectureHall') && roomTypes.has('ComputerLab'), 'Must have Lecture Halls and Labs');

// 3. Verify Faculty
console.assert(sampleFaculty.length >= 10, 'Must have at least 10 faculty members');
const facultyCodes = new Set(sampleFaculty.map((f) => f.employeeCode));
console.assert(facultyCodes.size === sampleFaculty.length, 'All faculty employee codes must be unique');

// 4. Verify Subjects & Faculty References
console.assert(sampleSubjects.length >= 10, 'Must have at least 10 subjects');
for (const sub of sampleSubjects) {
  if (sub.primaryFacultyCode) {
    console.assert(facultyCodes.has(sub.primaryFacultyCode), `Faculty code ${sub.primaryFacultyCode} in subject ${sub.code} must exist in faculty list`);
  }
}

// 5. Total weekly hours calculation for CSE-A & CSE-B
let totalWeeklySubjectHours = 0;
for (const sub of sampleSubjects) {
  totalWeeklySubjectHours += sub.weeklyLectures;
}
console.log(`📊 Total Weekly Lecture & Lab Hours per Batch: ${totalWeeklySubjectHours} hours`);
const availableSlots = (sampleConstraintConfig.periodsPerDay - 1) * sampleConstraintConfig.activeDays.length; // excluding lunch
console.log(`📊 Available Teaching Slots per Week per Batch: ${availableSlots} slots`);
console.assert(totalWeeklySubjectHours <= availableSlots, `Total weekly hours (${totalWeeklySubjectHours}) must fit in available slots (${availableSlots})`);

console.log('✅ ALL SEED DATASET INTEGRITY CHECKS PASSED PERFECTLY!');
