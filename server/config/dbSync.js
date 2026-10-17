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
  LeaveRequest,
  Notice,
  AttendanceSession,
  AuditLog,
  Notification,
  SubstituteAllocation
} = require('../models');

let isConnected = false;
let connectionInfo = {
  connected: false,
  host: null,
  dbName: null,
  error: null
};

/**
 * Initialize connection to MongoDB Atlas and perform initial data sync
 */
const initDbSync = async (initialState) => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ [MongoDB] No MONGO_URI provided in environment variables.');
    return { connected: false };
  }

  try {
    console.log('📡 [MongoDB Atlas] Connecting to cloud database...');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    isConnected = true;
    connectionInfo = {
      connected: true,
      host: conn.connection.host,
      dbName: conn.connection.name,
      error: null
    };

    console.log(`✅ [MongoDB Atlas] Connected successfully to: ${conn.connection.host} / Database: [${conn.connection.name}]`);

    // Run initial data synchronization
    await syncAllCollections(initialState);

    return connectionInfo;
  } catch (error) {
    console.error(`❌ [MongoDB Atlas] Connection Error: ${error.message}`);
    connectionInfo = {
      connected: false,
      host: null,
      dbName: null,
      error: error.message
    };
    return connectionInfo;
  }
};

/**
 * Sync all initial datasets to MongoDB Atlas collections
 */
const syncAllCollections = async ({ currentDataset, users, getActiveTimetable, notices, leaveRequests, attendanceSessions }) => {
  try {
    console.log('🔄 [MongoDB Atlas] Synchronizing collections with cloud server...');

    // 1. Department
    const deptCount = await Department.countDocuments();
    if (deptCount === 0 && currentDataset.department) {
      await Department.create(currentDataset.department);
      console.log('   ✓ Seeded Department collection');
    }

    // 2. ConstraintConfig
    const configCount = await ConstraintConfig.countDocuments();
    if (configCount === 0 && currentDataset.config) {
      await ConstraintConfig.create({
        ...currentDataset.config,
        departmentId: currentDataset.department._id
      });
      console.log('   ✓ Seeded ConstraintConfig collection');
    }

    // 3. Rooms
    const roomCount = await Room.countDocuments();
    if (roomCount === 0 && currentDataset.rooms?.length) {
      await Room.insertMany(currentDataset.rooms.map(r => ({
        ...r,
        departmentId: currentDataset.department._id
      })));
      console.log(`   ✓ Seeded ${currentDataset.rooms.length} Rooms & Labs`);
    }

    // 4. Batches
    const batchCount = await Batch.countDocuments();
    if (batchCount === 0 && currentDataset.batches?.length) {
      await Batch.insertMany(currentDataset.batches.map(b => ({
        ...b,
        departmentId: currentDataset.department._id
      })));
      console.log(`   ✓ Seeded ${currentDataset.batches.length} Batches`);
    }

    // 5. Faculty
    const facultyCount = await Faculty.countDocuments();
    if (facultyCount === 0 && currentDataset.faculty?.length) {
      await Faculty.insertMany(currentDataset.faculty.map(f => ({
        ...f,
        departmentId: currentDataset.department._id
      })));
      console.log(`   ✓ Seeded ${currentDataset.faculty.length} Faculty Members`);
    }

    // 6. Subjects
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0 && currentDataset.subjects?.length) {
      await Subject.insertMany(currentDataset.subjects.map(s => ({
        ...s,
        departmentId: currentDataset.department._id
      })));
      console.log(`   ✓ Seeded ${currentDataset.subjects.length} Subjects`);
    }

    // 7. Users - Ensure all seed users exist in DB
    if (users && users.length > 0) {
      let seededUsers = 0;
      for (const u of users) {
        const existing = await User.findOne({
          $or: [
            { _id: u.id },
            { email: u.email.toLowerCase() },
            { username: u.username?.toLowerCase() }
          ]
        });
        if (!existing) {
          await User.create({
            _id: u.id,
            ...u
          });
          seededUsers++;
        }
      }
      if (seededUsers > 0) {
        console.log(`   ✓ Seeded ${seededUsers} new Users into Atlas`);
      }
    }

    // 8. Timetable
    const timetableCount = await Timetable.countDocuments();
    const activeTimetable = getActiveTimetable ? getActiveTimetable() : null;
    if (timetableCount === 0 && activeTimetable?.schedule?.length) {
      await Timetable.create({
        _id: `tt_${Date.now()}`,
        title: 'Master Academic Timetable - Semester 4',
        departmentId: currentDataset.department._id,
        semester: 4,
        academicYear: '2026-2027',
        status: 'Generated',
        schedule: activeTimetable.schedule,
        metrics: activeTimetable.metrics || {}
      });
      console.log(`   ✓ Seeded Master Timetable (${activeTimetable.schedule.length} slots) into Atlas`);
    }

    // 9. Notices
    if (notices && notices.length > 0) {
      for (const n of notices) {
        await Notice.findByIdAndUpdate(
          n.id,
          { _id: n.id, ...n },
          { upsert: true, new: true }
        );
      }
      console.log(`   ✓ Synchronized ${notices.length} Notices into Atlas`);
    }

    // 10. Leave Requests
    if (leaveRequests && leaveRequests.length > 0) {
      for (const l of leaveRequests) {
        await LeaveRequest.findByIdAndUpdate(
          l.id,
          { _id: l.id, ...l },
          { upsert: true, new: true }
        );
      }
      console.log(`   ✓ Synchronized ${leaveRequests.length} Leave Requests into Atlas`);
    }

    // 11. Attendance Sessions
    if (attendanceSessions && attendanceSessions.length > 0) {
      for (const a of attendanceSessions) {
        await AttendanceSession.findByIdAndUpdate(
          a.id,
          { _id: a.id, ...a },
          { upsert: true, new: true }
        );
      }
      console.log(`   ✓ Synchronized ${attendanceSessions.length} Attendance Sessions into Atlas`);
    }

    console.log('🌟 [MongoDB Atlas] All collections are synchronized and live in the cloud database!\n');
  } catch (syncErr) {
    console.error('⚠️ [MongoDB Atlas] Sync error (non-fatal):', syncErr.message);
  }
};

// Persistence helper functions
const dbPersist = {
  async saveFaculty(facData) {
    if (!isConnected) return;
    try {
      await Faculty.findByIdAndUpdate(facData._id, facData, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: Faculty]', e.message);
    }
  },

  async saveUser(userData) {
    if (!isConnected) return;
    try {
      await User.findByIdAndUpdate(userData.id || userData._id, {
        _id: userData.id || userData._id,
        ...userData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: User]', e.message);
    }
  },

  async deleteUser(userId) {
    if (!isConnected) return;
    try {
      await User.deleteOne({ $or: [{ _id: userId }, { id: userId }] });
    } catch (e) {
      console.error('[DB Persist Error: Delete User]', e.message);
    }
  },

  async saveTimetable(ttData) {
    if (!isConnected) return;
    try {
      await Timetable.create({
        _id: `tt_${Date.now()}`,
        title: 'Master Academic Timetable - Semester 4',
        departmentId: 'dept_cse_01',
        semester: 4,
        academicYear: '2026-2027',
        status: 'Generated',
        schedule: ttData.schedule,
        metrics: ttData.metrics || {}
      });
    } catch (e) {
      console.error('[DB Persist Error: Timetable]', e.message);
    }
  },

  async saveNotice(noticeData) {
    if (!isConnected) return;
    try {
      await Notice.findByIdAndUpdate(noticeData.id, {
        _id: noticeData.id,
        ...noticeData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: Notice]', e.message);
    }
  },

  async saveLeaveRequest(leaveData) {
    if (!isConnected) return;
    try {
      await LeaveRequest.findByIdAndUpdate(leaveData.id || leaveData._id, {
        _id: leaveData.id || leaveData._id,
        ...leaveData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: LeaveRequest]', e.message);
    }
  },

  async saveAttendance(attData) {
    if (!isConnected) return;
    try {
      await AttendanceSession.findByIdAndUpdate(attData.id, {
        _id: attData.id,
        ...attData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: Attendance]', e.message);
    }
  },

  async saveAuditLog(logData) {
    if (!isConnected) return;
    try {
      await AuditLog.findByIdAndUpdate(logData.id, {
        _id: logData.id,
        ...logData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: AuditLog]', e.message);
    }
  },

  async saveNotification(notifData) {
    if (!isConnected) return;
    try {
      await Notification.findByIdAndUpdate(notifData.id, {
        _id: notifData.id,
        ...notifData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: Notification]', e.message);
    }
  },

  async saveSubstituteAllocation(subData) {
    if (!isConnected) return;
    try {
      await SubstituteAllocation.findByIdAndUpdate(subData.id, {
        _id: subData.id,
        ...subData
      }, { upsert: true });
    } catch (e) {
      console.error('[DB Persist Error: SubstituteAllocation]', e.message);
    }
  }
};

module.exports = {
  initDbSync,
  getConnectionInfo: () => connectionInfo,
  dbPersist
};
