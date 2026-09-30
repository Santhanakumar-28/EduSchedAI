require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const {
  User,
  Department,
  Faculty,
  Room,
  Subject,
  Batch,
  ConstraintConfig,
  Timetable,
  LeaveRequest
} = require('../models');
const {
  sampleDepartment,
  sampleConstraintConfig,
  sampleRooms,
  sampleFaculty,
  sampleBatches,
  sampleSubjects
} = require('./sampleData');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eduschedai';
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    console.log('🧹 Purging existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Faculty.deleteMany({}),
      Room.deleteMany({}),
      Subject.deleteMany({}),
      Batch.deleteMany({}),
      ConstraintConfig.deleteMany({}),
      Timetable.deleteMany({}),
      LeaveRequest.deleteMany({})
    ]);
    console.log('✅ Collections cleared.');

    // 1. Seed Department
    console.log('🏢 Seeding Department...');
    const createdDept = await Department.create(sampleDepartment);
    const deptId = createdDept._id;

    // 2. Seed Constraint Config
    console.log('⚙️ Seeding Constraint Configuration...');
    await ConstraintConfig.create({
      ...sampleConstraintConfig,
      departmentId: deptId
    });

    // 3. Seed Rooms
    console.log('🏛️ Seeding Rooms & Laboratories...');
    const roomsToInsert = sampleRooms.map((r) => ({ ...r, departmentId: deptId }));
    const createdRooms = await Room.insertMany(roomsToInsert);
    console.log(`   Inserted ${createdRooms.length} Rooms & Labs.`);

    // 4. Seed Faculty
    console.log('👨‍🏫 Seeding Faculty Members...');
    const facultyToInsert = sampleFaculty.map((f) => ({ ...f, departmentId: deptId }));
    const createdFaculty = await Faculty.insertMany(facultyToInsert);
    console.log(`   Inserted ${createdFaculty.length} Faculty Members.`);

    // Create Faculty Map for fast code lookup
    const facultyCodeMap = {};
    createdFaculty.forEach((f) => {
      facultyCodeMap[f.employeeCode] = f._id;
    });

    // Update HOD Reference in Department
    if (facultyCodeMap['FAC-CSE-001']) {
      await Department.findByIdAndUpdate(deptId, { hodRef: facultyCodeMap['FAC-CSE-001'] });
    }

    // 5. Seed Batches
    console.log('🎓 Seeding Student Batches...');
    const batchesToInsert = sampleBatches.map((b) => ({ ...b, departmentId: deptId }));
    const createdBatches = await Batch.insertMany(batchesToInsert);
    console.log(`   Inserted ${createdBatches.length} Batches.`);

    // 6. Seed Subjects with Faculty Links
    console.log('📚 Seeding Subjects / Courses...');
    const subjectsToInsert = sampleSubjects.map((s) => {
      const assignedFaculty = [];
      if (s.primaryFacultyCode && facultyCodeMap[s.primaryFacultyCode]) {
        assignedFaculty.push(facultyCodeMap[s.primaryFacultyCode]);
      }
      if (s.altFacultyCode && facultyCodeMap[s.altFacultyCode]) {
        assignedFaculty.push(facultyCodeMap[s.altFacultyCode]);
      }
      return {
        code: s.code,
        name: s.name,
        departmentId: deptId,
        semester: s.semester,
        type: s.type,
        credits: s.credits,
        weeklyLectures: s.weeklyLectures,
        labDurationHours: s.labDurationHours,
        preferredRoomType: s.preferredRoomType,
        assignedFacultyIds: assignedFaculty
      };
    });
    const createdSubjects = await Subject.insertMany(subjectsToInsert);
    console.log(`   Inserted ${createdSubjects.length} Subjects.`);

    // 7. Seed System Users
    console.log('👥 Seeding System Users (RBAC)...');
    const usersToCreate = [
      {
        name: 'System Administrator',
        email: 'admin@eduschedai.edu',
        password: 'AdminPass123!',
        role: 'Admin',
        departmentId: deptId
      },
      {
        name: 'Dr. Rajesh Kumar (HOD)',
        email: 'hod.cse@eduschedai.edu',
        password: 'HodPass123!',
        role: 'HOD',
        departmentId: deptId,
        facultyRef: facultyCodeMap['FAC-CSE-001']
      },
      {
        name: 'Dr. Sunita Rao (Faculty)',
        email: 'dr.sunita@eduschedai.edu',
        password: 'FacultyPass123!',
        role: 'Faculty',
        departmentId: deptId,
        facultyRef: facultyCodeMap['FAC-CSE-002']
      },
      {
        name: 'Student Representative (CSE-A)',
        email: 'student.csea@eduschedai.edu',
        password: 'StudentPass123!',
        role: 'Student',
        departmentId: deptId
      }
    ];

    for (const u of usersToCreate) {
      await User.create(u); // Triggers pre-save bcrypt password hashing
    }
    console.log(`   Inserted ${usersToCreate.length} System Users with encrypted passwords.`);

    console.log('\n======================================================');
    console.log('🎉 EDU-SCHED-AI DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`🏛️ Department: ${createdDept.name} (${createdDept.code})`);
    console.log(`👨‍🏫 Faculty:    ${createdFaculty.length} members`);
    console.log(`🏫 Rooms/Labs:  ${createdRooms.length} venues`);
    console.log(`📚 Subjects:    ${createdSubjects.length} courses`);
    console.log(`🎓 Batches:     ${createdBatches.length} cohorts`);
    console.log(`👥 Users:       ${usersToCreate.length} accounts`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
