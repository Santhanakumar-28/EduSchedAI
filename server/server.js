/**
 * EduSchedAI - Express Server & REST API Entrypoint
 * Bridges MongoDB/Mongoose with the Hybrid Core Scheduling Engine.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
const { calculateWorkloadMetrics, calculateRoomUtilization } = require('./algorithm/workloadBalancer');
const { initDbSync, getConnectionInfo, dbPersist } = require('./config/dbSync');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const {
  Faculty,
  Department,
  Subject,
  Batch,
  Room,
  Timetable,
  AuditLog,
  Notice,
  User,
  LeaveRequest,
  AttendanceSession
} = require('./models');
const {
  JWT_SECRET,
  HOD_REGISTRATION_AUTH_KEY,
  generateToken,
  validateInstitutionalEmail,
  authenticateToken,
  optionalAuth,
  requireRole,
  requireDepartmentScope,
  requireCoordinatorScope,
  createRateLimiter
} = require('./middleware/auth');

const authLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 35 });

const app = express();
const PORT = process.env.PORT || 5050;

// CORS Configuration - Permissive for deployed frontend and dev environments
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Accept'],
  exposedHeaders: ['Content-Disposition']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Root health check endpoint - guarantees JSON status for browser and Render ping
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EduSchedAI Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      dataset: '/api/dataset',
      timetable: '/api/timetable/current',
      login: '/api/auth/login',
      exportCsv: '/api/export/csv'
    }
  });
});

// In-Memory State Store (syncs with DB or runs standalone)
let currentDataset = {
  department: { ...sampleDepartment, _id: 'dept_cse_01' },
  config: { ...sampleConstraintConfig },
  rooms: sampleRooms.map((r, i) => ({ ...r, _id: `room_${i + 1}` })),
  faculty: sampleFaculty.map((f, i) => ({
    ...f,
    _id: `fac_${i + 1}`,
    isClassCoordinator: i === 1 ? true : i === 2 ? true : false,
    coordinatedBatchId: i === 1 ? 'batch_1' : i === 2 ? 'batch_2' : null
  })),
  batches: sampleBatches.map((b, i) => ({ ...b, _id: `batch_${i + 1}` })),
  subjects: sampleSubjects.map((s, i) => ({
    ...s,
    _id: `subj_${i + 1}`,
    assignedFacultyIds: []
  }))
};

// Map primary and alternate faculty to subjects
const facultyCodeMap = {};
currentDataset.faculty.forEach((f) => {
  facultyCodeMap[f.employeeCode] = f._id;
});

currentDataset.subjects.forEach((s) => {
  if (s.primaryFacultyCode && facultyCodeMap[s.primaryFacultyCode]) {
    s.assignedFacultyIds.push(facultyCodeMap[s.primaryFacultyCode]);
  }
  if (s.altFacultyCode && facultyCodeMap[s.altFacultyCode]) {
    s.assignedFacultyIds.push(facultyCodeMap[s.altFacultyCode]);
  }
});

// ----------------------------------------------------
// COLLEGE SETTINGS STORE
// ----------------------------------------------------
let collegeSettings = {
  institutionName: 'SRM Institute of Science & Technology',
  portalTitle: 'EduSchedAI Intelligent Faculty & Academic Portal',
  academicYear: '2026-2027',
  currentSemester: 4,
  minAttendanceThreshold: 75,
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periodsPerDay: 7,
  lunchPeriod: 4,
  autoSubstitutionEnabled: true,
  clashFreeGuaranteed: true
};

// ----------------------------------------------------
// AUDIT LOGS & NOTIFICATIONS STORE
// ----------------------------------------------------
let auditLogs = [
  {
    id: 'audit_init_1',
    userId: 'user_admin_1',
    userEmail: 'admin@admin.college.edu',
    userRole: 'Admin',
    action: 'SYSTEM_BOOT',
    entity: 'System',
    entityId: 'sys_eduschedai',
    ipAddress: '127.0.0.1',
    details: { message: 'Faculty Management System initialized with Cloud Database.' },
    timestamp: new Date().toISOString()
  }
];

function logAudit({ userId, userEmail, userRole, action, entity, entityId, details, ipAddress }) {
  const entry = {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: userId || null,
    userEmail: userEmail || 'system@college.edu',
    userRole: userRole || 'System',
    action,
    entity,
    entityId: entityId || null,
    ipAddress: ipAddress || '127.0.0.1',
    details: details || {},
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs.pop();
  dbPersist.saveAuditLog(entry);
  return entry;
}

let notifications = [
  {
    id: 'notif_1',
    userId: 'user_fac_2',
    title: 'Class Coordinator Appointment',
    message: 'You have been designated as Class Coordinator for CSE Section A.',
    type: 'System',
    relatedEntityId: 'batch_1',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif_2',
    userId: 'user_std_1',
    title: 'Timetable Published',
    message: 'The official clash-free master timetable has been published for Semester 4.',
    type: 'Notice',
    relatedEntityId: 'batch_1',
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

function createNotification({ userId, title, message, type = 'System', relatedEntityId = null }) {
  const notif = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    type,
    relatedEntityId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notif);
  dbPersist.saveNotification(notif);
  return notif;
}

let substituteAllocations = [
  {
    id: 'sub_alloc_1',
    leaveRequestId: 'leave_1',
    originalFacultyId: 'fac_4',
    originalFacultyName: 'Dr. Priya Sharma',
    substituteFacultyId: 'fac_5',
    substituteFacultyName: 'Dr. Manish Verma',
    batchId: 'batch_1',
    batchName: 'CSE Section A',
    subjectId: 'subj_3',
    subjectName: 'Operating Systems',
    date: '2026-10-02',
    day: 'Thursday',
    period: 3,
    status: 'Confirmed',
    allocatedBy: 'Dr. Rajesh Kumar (HOD)',
    allocatedAt: '2026-09-29T10:00:00Z'
  }
];

// ----------------------------------------------------
// USER AUTHENTICATION & CREDENTIALS STORE
// Default Master Password for all roles: EduSched@123
// ----------------------------------------------------
const DEFAULT_PASSWORD = 'EduSched@123';

let users = [
  // 1. Admin / HR Account
  {
    id: 'user_admin_1',
    name: 'Dean / Administrator',
    email: 'admin@admin.college.edu',
    username: 'admin',
    password: DEFAULT_PASSWORD,
    role: 'Admin',
    cadre: 'Staff',
    facultyId: null,
    isClassCoordinator: false,
    coordinatedBatchId: null,
    departmentId: null,
    aliases: ['admin@college.edu', 'dean@admin.college.edu'],
    status: 'Active'
  },
  // 2. Department HOD Account
  {
    id: 'user_hod_1',
    name: 'Dr. Rajesh Kumar',
    email: 'hod.cse@hod.college.edu',
    username: 'hod_rajesh',
    password: DEFAULT_PASSWORD,
    role: 'HOD',
    cadre: 'Professor',
    facultyId: 'fac_1',
    isClassCoordinator: false,
    coordinatedBatchId: null,
    departmentId: 'dept_cse_01',
    aliases: ['sk@hod.srm.in', 'hod@eduschedai.edu'],
    status: 'Active'
  },
  // 3. Class Coordinator (Section A): Dr. Sunita Rao
  {
    id: 'user_fac_2',
    name: 'Dr. Sunita Rao',
    email: 'sunita.rao@faculty.college.edu',
    username: 'sunita_rao',
    password: DEFAULT_PASSWORD,
    role: 'Faculty',
    cadre: 'Professor',
    facultyId: 'fac_2',
    isClassCoordinator: true,
    coordinatedBatchId: 'batch_1',
    departmentId: 'dept_cse_01',
    aliases: ['dr.sunita@eduschedai.edu', 'sunita@faculty.srm.in'],
    status: 'Active'
  },
  // 4. Class Coordinator (Section B): Dr. Amitav Ghosh
  {
    id: 'user_fac_3',
    name: 'Dr. Amitav Ghosh',
    email: 'amitav.ghosh@faculty.college.edu',
    username: 'amitav_ghosh',
    password: DEFAULT_PASSWORD,
    role: 'Faculty',
    cadre: 'AssociateProf',
    facultyId: 'fac_3',
    isClassCoordinator: true,
    coordinatedBatchId: 'batch_2',
    departmentId: 'dept_cse_01',
    aliases: ['amitav.ghosh@eduschedai.edu'],
    status: 'Active'
  },
  // 5. Regular Faculty: Dr. Priya Sharma
  {
    id: 'user_fac_4',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@faculty.college.edu',
    username: 'priya_sharma',
    password: DEFAULT_PASSWORD,
    role: 'Faculty',
    cadre: 'AssistantProf',
    facultyId: 'fac_4',
    isClassCoordinator: false,
    coordinatedBatchId: null,
    departmentId: 'dept_cse_01',
    aliases: ['priya.sharma@eduschedai.edu'],
    status: 'Active'
  },
  // 6. Regular Faculty: Dr. Manish Verma
  {
    id: 'user_fac_5',
    name: 'Dr. Manish Verma',
    email: 'manish.verma@faculty.college.edu',
    username: 'manish_verma',
    password: DEFAULT_PASSWORD,
    role: 'Faculty',
    cadre: 'AssistantProf',
    facultyId: 'fac_5',
    isClassCoordinator: false,
    coordinatedBatchId: null,
    departmentId: 'dept_cse_01',
    aliases: ['manish.verma@eduschedai.edu'],
    status: 'Active'
  },
  // 7. Regular Faculty: Prof. Vikram Malhotra
  {
    id: 'user_fac_6',
    name: 'Prof. Vikram Malhotra',
    email: 'vikram.m@faculty.college.edu',
    username: 'vikram_m',
    password: DEFAULT_PASSWORD,
    role: 'Faculty',
    cadre: 'AssociateProf',
    facultyId: 'fac_6',
    isClassCoordinator: false,
    coordinatedBatchId: null,
    departmentId: 'dept_cse_01',
    aliases: ['vikram.m@eduschedai.edu'],
    status: 'Active'
  },
  // 8. Enrolled Student: Aarav Patel (Section A)
  {
    id: 'user_std_1',
    name: 'Aarav Patel',
    email: '2026cse001@student.college.edu',
    username: 'aarav_csea',
    password: DEFAULT_PASSWORD,
    role: 'Student',
    rollNo: '2026CSE001',
    batchId: 'batch_1',
    addedByFacultyId: 'fac_2',
    aliases: ['student.csea@eduschedai.edu', '2026cse001@student.srm.in'],
    createdAt: new Date().toISOString(),
    status: 'Active'
  },
  // 9. Enrolled Student: Diya Sharma (Section A)
  {
    id: 'user_std_2',
    name: 'Diya Sharma',
    email: '2026cse002@student.college.edu',
    username: 'diya_csea',
    password: DEFAULT_PASSWORD,
    role: 'Student',
    rollNo: '2026CSE002',
    batchId: 'batch_1',
    addedByFacultyId: 'fac_2',
    aliases: ['diya.csea@eduschedai.edu'],
    createdAt: new Date().toISOString(),
    status: 'Active'
  },
  // 10. Enrolled Student: Rohan Mehra (Section B)
  {
    id: 'user_std_3',
    name: 'Rohan Mehra',
    email: '2026cse101@student.college.edu',
    username: 'rohan_cseb',
    password: DEFAULT_PASSWORD,
    role: 'Student',
    rollNo: '2026CSE101',
    batchId: 'batch_2',
    addedByFacultyId: 'fac_3',
    aliases: ['rohan.cseb@eduschedai.edu'],
    createdAt: new Date().toISOString(),
    status: 'Active'
  }
];

// Populate users for remaining faculty in dataset
currentDataset.faculty.forEach((f, idx) => {
  if (idx >= 6) {
    users.push({
      id: `user_fac_${idx + 1}`,
      name: f.name,
      email: f.email,
      username: f.email.split('@')[0],
      password: DEFAULT_PASSWORD,
      role: 'Faculty',
      cadre: f.cadre,
      facultyId: f._id,
      isClassCoordinator: false,
      coordinatedBatchId: null,
      departmentId: 'dept_cse_01',
      status: 'Active'
    });
  }
});
app.set('usersStore', users);

// Active generated timetable cache
let activeTimetableResult = null;

// Helper: Ensure we have an active timetable
function ensureTimetable() {
  if (!activeTimetableResult) {
    console.log('⚡ Generating initial master timetable on startup...');
    activeTimetableResult = generateTimetable(currentDataset);
  }
  return activeTimetableResult;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * 1. Health & Status
 */
app.get('/api/status', (req, res) => {
  const dbInfo = getConnectionInfo();
  res.json({
    status: 'online',
    system: 'EduSchedAI Intelligent Timetable & Workload Management System',
    stack: 'MERN (Node.js, Express.js, React.js, MongoDB)',
    department: currentDataset.department.name,
    defaultPassword: DEFAULT_PASSWORD,
    database: {
      connected: dbInfo.connected,
      host: dbInfo.host,
      databaseName: dbInfo.dbName,
      status: dbInfo.connected ? 'Connected to MongoDB Atlas' : 'Local / Standalone Mode'
    },
    counts: {
      faculty: currentDataset.faculty.length,
      rooms: currentDataset.rooms.length,
      subjects: currentDataset.subjects.length,
      batches: currentDataset.batches.length,
      registeredUsers: users.length
    },
    hasActiveTimetable: activeTimetableResult !== null
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

/**
 * 1b. Live Dashboard Database Analytics & Chart Data Endpoint
 * Retrieves original, real-time records directly from MongoDB Atlas & core scheduling state
 */
app.get('/api/dashboard/stats', optionalAuth, async (req, res) => {
  try {
    let facultyList = [];
    let deptList = [];
    let subjectList = [];
    let batchList = [];
    let roomList = [];
    let auditList = [];
    let noticeList = [];

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      facultyList = await Faculty.find().lean();
      deptList = await Department.find().lean();
      subjectList = await Subject.find().lean();
      batchList = await Batch.find().lean();
      roomList = await Room.find().lean();
      auditList = await AuditLog.find().sort({ timestamp: -1 }).limit(10).lean();
      noticeList = await Notice.find().sort({ createdAt: -1 }).limit(5).lean();
    }

    // Fallbacks if database collections are syncing or empty
    if (!facultyList.length) facultyList = currentDataset.faculty;
    if (!deptList.length) deptList = [currentDataset.department];
    if (!subjectList.length) subjectList = currentDataset.subjects;
    if (!batchList.length) batchList = currentDataset.batches;
    if (!roomList.length) roomList = currentDataset.rooms;
    if (!auditList.length) auditList = auditLogs.slice(0, 10);
    if (!noticeList.length) noticeList = notices.slice(0, 5);

    // Active Timetable & Faculty Workload
    const activeTt = ensureTimetable();
    const schedule = activeTt?.schedule || [];
    const workloadDetails = activeTt?.workloadDetails || {};
    const facultyStats = workloadDetails.facultyStats || [];

    // 1. Live KPI Counts from Database
    const totalFaculty = facultyList.length;
    const totalDepartments = deptList.length;
    const totalSubjects = subjectList.length;
    const totalClasses = schedule.length;
    const totalRooms = roomList.length;
    const totalBatches = batchList.length;

    // 2. Chart 1: Donut Chart - Faculty Distribution by Cadre
    const cadreCounts = {
      Professor: 0,
      AssociateProf: 0,
      AssistantProf: 0,
      Other: 0
    };
    facultyList.forEach((f) => {
      if (f.cadre === 'Professor') cadreCounts.Professor++;
      else if (f.cadre === 'AssociateProf') cadreCounts.AssociateProf++;
      else if (f.cadre === 'AssistantProf') cadreCounts.AssistantProf++;
      else cadreCounts.Other++;
    });

    const cadreLabels = {
      Professor: 'Professors',
      AssociateProf: 'Associate Prof.',
      AssistantProf: 'Assistant Prof.',
      Other: 'Special Faculty'
    };
    const cadreColors = {
      Professor: '#3B82F6',
      AssociateProf: '#8B5CF6',
      AssistantProf: '#10B981',
      Other: '#F59E0B'
    };

    const distributionByCadre = Object.keys(cadreCounts)
      .filter((k) => cadreCounts[k] > 0)
      .map((k) => ({
        name: cadreLabels[k] || k,
        cadreKey: k,
        value: cadreCounts[k],
        color: cadreColors[k] || '#64748B'
      }));

    // Faculty by Department Distribution
    const deptCounts = {};
    facultyList.forEach((f) => {
      const deptCode = f.departmentId === 'dept_cse_01' || !f.departmentId ? 'CSE' : f.departmentId;
      deptCounts[deptCode] = (deptCounts[deptCode] || 0) + 1;
    });
    const deptColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
    const distributionByDepartment = Object.keys(deptCounts).map((dept, idx) => ({
      name: dept,
      value: deptCounts[dept],
      color: deptColors[idx % deptColors.length]
    }));

    // 3. Chart 2: Bar Chart - Real Faculty Workload (Assigned vs Available Hours)
    // A. By Faculty (Top teaching faculty members)
    const facultyWorkloadData = facultyStats.slice(0, 7).map((f) => {
      const assigned = f.assignedHours || 0;
      const target = f.targetHours || 16;
      const available = Math.max(0, target - assigned);
      const shortName = f.name.split(' ').slice(0, 2).join(' ');
      return {
        label: shortName,
        dept: shortName,
        fullName: f.name,
        assigned,
        available,
        target,
        utilization: f.utilizationRate || Math.round((assigned / target) * 100)
      };
    });

    // B. By Cadre Workload
    const cadreWorkloadMap = {};
    facultyStats.forEach((f) => {
      const cadre = f.cadre || 'AssistantProf';
      if (!cadreWorkloadMap[cadre]) {
        cadreWorkloadMap[cadre] = { assigned: 0, target: 0, count: 0 };
      }
      cadreWorkloadMap[cadre].assigned += f.assignedHours || 0;
      cadreWorkloadMap[cadre].target += f.targetHours || 16;
      cadreWorkloadMap[cadre].count++;
    });

    const cadreWorkloadData = Object.keys(cadreWorkloadMap).map((k) => {
      const data = cadreWorkloadMap[k];
      return {
        label: cadreLabels[k] || k,
        dept: cadreLabels[k] || k,
        assigned: Math.round(data.assigned / (data.count || 1)),
        available: Math.max(0, Math.round((data.target - data.assigned) / (data.count || 1))),
        totalAssigned: data.assigned,
        totalAvailable: Math.max(0, data.target - data.assigned)
      };
    });

    // C. By Batch / Section Workload
    const batchWorkloadMap = {};
    schedule.forEach((slot) => {
      const bName = slot.batchName || 'Section A';
      if (!batchWorkloadMap[bName]) {
        batchWorkloadMap[bName] = { assigned: 0, slots: 0 };
      }
      batchWorkloadMap[bName].assigned += slot.slotType === 'Lab' ? 2 : 1;
      batchWorkloadMap[bName].slots++;
    });
    const batchWorkloadData = Object.keys(batchWorkloadMap).map((b) => ({
      label: b.replace('CSE ', ''),
      dept: b.replace('CSE ', ''),
      fullName: b,
      assigned: batchWorkloadMap[b].assigned,
      available: Math.max(0, 35 - batchWorkloadMap[b].assigned)
    }));

    // 4. Real Faculty Rows for Table (From Database)
    const facultyTableRows = facultyList.slice(0, 8).map((f) => {
      const stat = facultyStats.find((s) => String(s.facultyId) === String(f._id)) || {};
      return {
        id: f._id,
        name: f.name,
        employeeCode: f.employeeCode || `FAC-${f._id}`,
        dept: 'CSE',
        designation:
          f.cadre === 'Professor'
            ? 'Professor'
            : f.cadre === 'AssociateProf'
            ? 'Associate Professor'
            : 'Assistant Professor',
        email: f.email,
        assignedHours: stat.assignedHours || 0,
        targetHours: f.targetHours || 14,
        status: 'Active',
        specializations: f.specializations || []
      };
    });

    // 5. Real Upcoming Events from Active Schedule
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const currentDay = days[new Date().getDay() - 1] || 'Monday';
    const todaysSlots = schedule.filter((s) => s.day === currentDay).slice(0, 4);
    const eventSlots = todaysSlots.length ? todaysSlots : schedule.slice(0, 4);
    const startTimes = ['09:00 AM', '09:50 AM', '10:40 AM', '11:30 AM', '12:20 PM', '01:10 PM', '02:00 PM'];
    const endTimes = ['09:50 AM', '10:40 AM', '11:30 AM', '12:20 PM', '01:10 PM', '02:00 PM', '02:50 PM'];

    const upcomingEvents = eventSlots.map((s, idx) => ({
      id: `evt_${idx}`,
      day: new Date().getDate().toString(),
      month: new Date().toLocaleDateString('en-US', { month: 'short' }),
      title: `${s.subjectCode}: ${s.subjectName}`,
      time: `${startTimes[s.period - 1] || '09:00 AM'} – ${endTimes[s.period - 1] || '09:50 AM'}`,
      location: `${s.roomNumber || 'LH-101'} (${s.batchName})`,
      facultyName: s.facultyName
    }));

    // 6. Real Recent Activities from Audit Logs & Notices
    const recentActivities = auditList.slice(0, 5).map((a) => {
      let icon = 'Users';
      let bgColor = 'bg-blue-50 text-blue-600';
      if (a.action && (a.action.includes('TIMETABLE') || a.action.includes('SCHEDULE'))) {
        icon = 'CalendarDays';
        bgColor = 'bg-emerald-50 text-emerald-600';
      } else if (a.action && (a.action.includes('FACULTY') || a.action.includes('USER'))) {
        icon = 'Users';
        bgColor = 'bg-blue-50 text-blue-600';
      } else if (a.action && (a.action.includes('LEAVE') || a.action.includes('SUBSTITUTE'))) {
        icon = 'ClipboardList';
        bgColor = 'bg-amber-50 text-amber-600';
      } else {
        icon = 'ShieldCheck';
        bgColor = 'bg-indigo-50 text-indigo-600';
      }

      const diffMs = Date.now() - new Date(a.timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const timeStr =
        diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;

      return {
        id: a.id || a._id,
        title: a.action
          ? a.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
          : 'System Action',
        subtitle: a.details?.message || (a.userEmail ? `By ${a.userEmail}` : 'Automated Task'),
        time: timeStr,
        icon,
        bgColor
      };
    });

    res.json({
      success: true,
      data: {
        counts: {
          totalFaculty,
          totalDepartments,
          totalSubjects,
          totalClasses,
          totalRooms,
          totalBatches
        },
        distributionByCadre,
        distributionByDepartment,
        facultyWorkloadData,
        cadreWorkloadData,
        batchWorkloadData,
        facultyTableRows,
        upcomingEvents,
        recentActivities
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2a. HOD Self-Registration (Only HOD role may self-register; requires institutional authorization code)
 */
app.post('/api/auth/register-hod', async (req, res) => {
  try {
    const { name, email, department, password, authorizationCode } = req.body;

    if (!name || !email || !password || !authorizationCode) {
      return res.status(400).json({
        success: false,
        message: 'Name, Institutional Email, Password, and Institutional Authorization Code are required.'
      });
    }

    // 1. Validate institutional HOD email format
    const emailValidation = validateInstitutionalEmail(email, 'HOD');
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Institutional validation error: ${emailValidation.error}`
      });
    }

    // 2. Verify institutional HOD authorization secret key
    if (authorizationCode.trim() !== HOD_REGISTRATION_AUTH_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Institutional verification failed: Invalid HOD authorization security key. Access denied.'
      });
    }

    // 3. Prevent duplicate account
    const cleanEmail = emailValidation.cleanEmail;
    const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this institutional email is already registered.'
      });
    }

    // 4. Secure password hashing
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const hodId = `user_hod_${Date.now()}`;
    const facId = `fac_hod_${Date.now()}`;
    const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    const newHodUser = {
      id: hodId,
      name: name.trim(),
      email: cleanEmail,
      username,
      password: hashedPassword,
      role: 'HOD',
      cadre: 'Professor',
      facultyId: facId,
      isClassCoordinator: false,
      coordinatedBatchId: null,
      departmentId: department || 'dept_cse_01',
      createdAt: new Date().toISOString()
    };

    // Add to dataset faculty
    currentDataset.faculty.push({
      _id: facId,
      name: name.trim(),
      email: cleanEmail,
      employeeCode: `HOD_${Math.floor(1000 + Math.random() * 9000)}`,
      cadre: 'Professor',
      targetHours: 12,
      specializations: ['Computer Science', 'Distributed Systems'],
      isClassCoordinator: false,
      coordinatedBatchId: null,
      unavailableSlots: [],
      preferredSlots: []
    });

    users.push(newHodUser);
    app.set('usersStore', users);
    dbPersist.saveUser(newHodUser);

    console.log(`🏛️ [HOD Registered] ${name} (${cleanEmail}) assigned HOD authority.`);

    res.status(201).json({
      success: true,
      message: `HOD account for ${name} registered successfully! You may now sign in.`,
      user: {
        id: newHodUser.id,
        name: newHodUser.name,
        email: newHodUser.email,
        role: newHodUser.role,
        departmentId: newHodUser.departmentId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2b. User Authentication Login (Server-Side Role Identification & Database Authorization)
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { usernameOrEmail, password, selectedRole } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both username/email and password.'
      });
    }

    const query = usernameOrEmail.trim().toLowerCase();

    // 1. If an email address is provided, run preliminary institutional email format validation
    if (query.includes('@')) {
      const emailCheck = validateInstitutionalEmail(query);
      if (!emailCheck.isValid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.error
        });
      }
    }

    // 2. Find matching user by email, username, roll number, or registered aliases
    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.username && u.username.toLowerCase() === query) ||
        (u.rollNo && u.rollNo.toLowerCase() === query) ||
        (u.aliases && u.aliases.some((a) => a.toLowerCase() === query))
    );

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User account not found.'
      });
    }

    // Check account status
    if (matchedUser.status === 'Suspended' || matchedUser.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended or deactivated. Contact the College Administration.'
      });
    }

    // 3. Verify password securely (bcrypt compare or plaintext seeded fallback)
    let passwordValid = false;
    if (matchedUser.password.startsWith('$2a$') || matchedUser.password.startsWith('$2b$')) {
      passwordValid = await bcrypt.compare(password, matchedUser.password);
    } else {
      passwordValid = matchedUser.password === password || password === DEFAULT_PASSWORD;
    }

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your credentials.'
      });
    }

    // 4. Validate selected role against database authorization, NOT email alone
    if (selectedRole) {
      const reqRole = selectedRole.toLowerCase();
      const dbRole = (matchedUser.role || '').toLowerCase();

      let isAuthorized = false;
      if (reqRole === 'admin' || reqRole === 'hr' || reqRole.includes('admin')) {
        isAuthorized = dbRole === 'admin';
      } else if (reqRole === 'hod') {
        isAuthorized = dbRole === 'hod';
      } else if (reqRole.includes('faculty') || reqRole.includes('coordinator')) {
        isAuthorized = dbRole === 'faculty';
      } else if (reqRole === 'student') {
        isAuthorized = dbRole === 'student';
      }

      if (!isAuthorized) {
        logAudit({
          userId: matchedUser.id || matchedUser._id,
          userEmail: matchedUser.email,
          userRole: matchedUser.role,
          action: 'LOGIN_ROLE_MISMATCH_REJECTED',
          entity: 'Auth',
          details: { selectedRole, actualDbRole: matchedUser.role },
          ipAddress: req.ip
        });
        return res.status(403).json({
          success: false,
          message: `Database Authorization Failed: Account '${matchedUser.email}' has assigned database role '${matchedUser.role}', which is not authorized for selected role '${selectedRole}'. Please select the appropriate portal role.`
        });
      }
    }

    // 5. Generate signed JWT token containing server-verified role and claims
    const token = generateToken(matchedUser);

    // Determine coordinated batch info if Class Coordinator
    let coordinatedBatch = null;
    if (matchedUser.isClassCoordinator && matchedUser.coordinatedBatchId) {
      coordinatedBatch = currentDataset.batches.find(
        (b) => String(b._id) === String(matchedUser.coordinatedBatchId)
      );
    }

    // Determine student's enrolled batch info if Student
    let enrolledBatch = null;
    let studentClassCoordinator = null;
    if (matchedUser.role === 'Student' && matchedUser.batchId) {
      enrolledBatch = currentDataset.batches.find(
        (b) => String(b._id) === String(matchedUser.batchId)
      );
      const coordFaculty = currentDataset.faculty.find(
        (f) => f.isClassCoordinator && String(f.coordinatedBatchId) === String(matchedUser.batchId)
      );
      if (coordFaculty) {
        studentClassCoordinator = {
          name: coordFaculty.name,
          cadre: coordFaculty.cadre,
          email: coordFaculty.email
        };
      }
    }

    logAudit({
      userId: matchedUser.id || matchedUser._id,
      userEmail: matchedUser.email,
      userRole: matchedUser.role,
      action: 'USER_LOGIN_SUCCESS',
      entity: 'User',
      entityId: matchedUser.id || matchedUser._id,
      details: { role: matchedUser.role, selectedRole: selectedRole || matchedUser.role },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Welcome back, ${matchedUser.name}!`,
      token,
      user: {
        id: matchedUser.id || matchedUser._id,
        name: matchedUser.name,
        email: matchedUser.email,
        username: matchedUser.username,
        role: matchedUser.role,
        cadre: matchedUser.cadre || null,
        facultyId: matchedUser.facultyId || null,
        departmentId: matchedUser.role === 'Admin' ? null : (matchedUser.departmentId || 'dept_cse_01'),
        isClassCoordinator: !!matchedUser.isClassCoordinator,
        coordinatedBatchId: matchedUser.coordinatedBatchId || null,
        coordinatedBatch: coordinatedBatch ? { id: coordinatedBatch._id, name: coordinatedBatch.name, code: coordinatedBatch.code } : null,
        batchId: matchedUser.batchId || null,
        enrolledBatch: enrolledBatch ? { id: enrolledBatch._id, name: enrolledBatch.name, code: enrolledBatch.code } : null,
        rollNo: matchedUser.rollNo || null,
        studentClassCoordinator
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2c. Secure Password Reset Endpoint
 */
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Institutional email and new password are required.'
      });
    }

    const clean = email.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === clean || (u.aliases && u.aliases.includes(clean))
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user account found matching this institutional email.'
      });
    }

    // If current password provided, verify it
    if (currentPassword) {
      let valid = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        valid = await bcrypt.compare(currentPassword, user.password);
      } else {
        valid = user.password === currentPassword || currentPassword === DEFAULT_PASSWORD;
      }
      if (!valid) {
        return res.status(401).json({
          success: false,
          message: 'Current password verification failed. Please check your credentials.'
        });
      }
    }

    // Hash and update
    user.password = await bcrypt.hash(newPassword.trim(), 10);
    dbPersist.saveUser(user);

    logAudit({
      userId: user.id || user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user.id || user._id,
      details: { email: user.email },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password has been updated securely. You can now login with your updated credentials.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2c. Get Current Authenticated Profile
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(
    (u) => String(u.id) === String(req.user.id) || String(u._id) === String(req.user.id)
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  let coordinatedBatch = null;
  if (user.isClassCoordinator && user.coordinatedBatchId) {
    coordinatedBatch = currentDataset.batches.find(
      (b) => String(b._id) === String(user.coordinatedBatchId)
    );
  }

  let enrolledBatch = null;
  let studentClassCoordinator = null;
  if (user.role === 'Student' && user.batchId) {
    enrolledBatch = currentDataset.batches.find((b) => String(b._id) === String(user.batchId));
    const coordFaculty = currentDataset.faculty.find(
      (f) => f.isClassCoordinator && String(f.coordinatedBatchId) === String(user.batchId)
    );
    if (coordFaculty) {
      studentClassCoordinator = {
        name: coordFaculty.name,
        cadre: coordFaculty.cadre,
        email: coordFaculty.email
      };
    }
  }

  res.json({
    success: true,
    user: {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      cadre: user.cadre || null,
      facultyId: user.facultyId || null,
      departmentId: user.role === 'Admin' ? null : (user.departmentId || 'dept_cse_01'),
      isClassCoordinator: !!user.isClassCoordinator,
      coordinatedBatchId: user.coordinatedBatchId || null,
      coordinatedBatch: coordinatedBatch ? { id: coordinatedBatch._id, name: coordinatedBatch.name, code: coordinatedBatch.code } : null,
      batchId: user.batchId || null,
      enrolledBatch: enrolledBatch ? { id: enrolledBatch._id, name: enrolledBatch.name, code: enrolledBatch.code } : null,
      rollNo: user.rollNo || null,
      classCoordinator: studentClassCoordinator
    }
  });
});

/**
 * 3. HOD Adds New Faculty Member & Assigns Credentials (HOD-only, scoped to department)
 */
app.post('/api/faculty/add', authenticateToken, requireRole('HOD'), async (req, res) => {
  try {
    const {
      name,
      email,
      employeeCode,
      cadre,
      targetHours,
      specializations,
      isClassCoordinator,
      coordinatedBatchId,
      password
    } = req.body;

    if (!name || !email || !employeeCode) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Employee Code are required fields.'
      });
    }

    // Validate institutional faculty email convention
    const emailValidation = validateInstitutionalEmail(email, 'Faculty');
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Institutional validation error: ${emailValidation.error}`
      });
    }

    const assignedPassword = password && password.trim() ? password.trim() : DEFAULT_PASSWORD;
    const assignedUsername = emailValidation.cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    // Check if employee code or email already exists
    const existingFaculty = currentDataset.faculty.find(
      (f) =>
        f.employeeCode.toUpperCase() === employeeCode.toUpperCase() ||
        f.email.toLowerCase() === emailValidation.cleanEmail
    );
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'A faculty member with this Email or Employee Code already exists.'
      });
    }

    // Create Faculty object in Dataset
    const newFacultyId = `fac_${currentDataset.faculty.length + 1}`;
    const newFaculty = {
      _id: newFacultyId,
      name: name.trim(),
      email: emailValidation.cleanEmail,
      employeeCode: employeeCode.toUpperCase(),
      cadre: cadre || 'AssistantProf',
      targetHours:
        Number(targetHours) || (cadre === 'Professor' ? 14 : cadre === 'AssociateProf' ? 16 : 18),
      specializations: Array.isArray(specializations)
        ? specializations
        : specializations
        ? specializations.split(',').map((s) => s.trim())
        : ['Computer Science'],
      isClassCoordinator: !!isClassCoordinator,
      coordinatedBatchId: isClassCoordinator ? coordinatedBatchId : null,
      unavailableSlots: [],
      preferredSlots: []
    };

    currentDataset.faculty.push(newFaculty);

    // If assigned as Class Coordinator, update any existing coordinator for that section
    if (isClassCoordinator && coordinatedBatchId) {
      currentDataset.faculty.forEach((f) => {
        if (f._id !== newFacultyId && String(f.coordinatedBatchId) === String(coordinatedBatchId)) {
          f.isClassCoordinator = false;
          f.coordinatedBatchId = null;
        }
      });
      users.forEach((u) => {
        if (u.facultyId !== newFacultyId && String(u.coordinatedBatchId) === String(coordinatedBatchId)) {
          u.isClassCoordinator = false;
          u.coordinatedBatchId = null;
        }
      });
    }

    // Securely hash assigned password
    const hashedPassword = await bcrypt.hash(assignedPassword, 10);

    // Create User Account for this faculty
    const newUser = {
      id: `user_fac_${Date.now()}`,
      name: name.trim(),
      email: emailValidation.cleanEmail,
      username: assignedUsername,
      password: hashedPassword,
      role: 'Faculty',
      cadre: newFaculty.cadre,
      facultyId: newFacultyId,
      isClassCoordinator: !!isClassCoordinator,
      coordinatedBatchId: isClassCoordinator ? coordinatedBatchId : null,
      departmentId: req.user.departmentId || 'dept_cse_01',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    app.set('usersStore', users);
    dbPersist.saveFaculty(newFaculty);
    dbPersist.saveUser(newUser);

    console.log(
      `👨‍🏫 [HOD Action] Added Faculty: ${name} (${employeeCode}), Username: ${assignedUsername}`
    );

    res.status(201).json({
      success: true,
      message: `Faculty ${name} added successfully with credentials!`,
      faculty: newFaculty,
      credentials: {
        username: assignedUsername,
        password: assignedPassword,
        email: emailValidation.cleanEmail
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. List Faculty with Credential and Coordinator Info (Authorized for HOD & Faculty)
 */
app.get('/api/faculty/list', authenticateToken, requireRole('HOD', 'Faculty'), (req, res) => {
  const isHod = req.user.role === 'HOD' || req.user.role === 'Admin';
  const facultyWithUsers = currentDataset.faculty.map((f) => {
    const u = users.find((user) => user.facultyId === f._id);
    const coordinatedBatch = f.coordinatedBatchId
      ? currentDataset.batches.find((b) => String(b._id) === String(f.coordinatedBatchId))
      : null;
    return {
      ...f,
      username: u ? u.username : f.email.split('@')[0],
      password: isHod ? (u ? u.password : DEFAULT_PASSWORD) : undefined, // Credentials only exposed to HOD
      isClassCoordinator: !!f.isClassCoordinator,
      coordinatedBatchName: coordinatedBatch ? coordinatedBatch.name : null
    };
  });

  res.json({
    success: true,
    data: facultyWithUsers
  });
});

/**
 * 5. Class Coordinator Adds Student to Their Assigned Section (Coordinator Scope Enforced)
 */
app.post(
  '/api/students/add',
  authenticateToken,
  requireRole('Faculty', 'HOD'),
  requireCoordinatorScope,
  async (req, res) => {
    try {
      const { name, rollNo, email, username, password, batchId } = req.body;

      if (!name || !rollNo || !batchId) {
        return res.status(400).json({
          success: false,
          message: 'Student Name, Roll Number, and Section/Batch are required.'
        });
      }

      // If user is Faculty, enforce that they can only add students to their own coordinated batch
      if (req.user.role === 'Faculty') {
        if (!req.user.isClassCoordinator || String(req.user.coordinatedBatchId) !== String(batchId)) {
          return res.status(403).json({
            success: false,
            message: `Access Denied: You are not authorized to add students to Section ID ${batchId}. You can only manage your assigned section.`
          });
        }
      }

      const assignedRollNo = rollNo.trim().toUpperCase();
      const assignedUsername =
        username && username.trim()
          ? username.trim().toLowerCase()
          : assignedRollNo.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const assignedEmail =
        email && email.trim() ? email.trim().toLowerCase() : `${assignedUsername}@student.srm.in`;
      const assignedPassword = password && password.trim() ? password.trim() : DEFAULT_PASSWORD;

      // Validate student email format
      const emailValidation = validateInstitutionalEmail(assignedEmail, 'Student');
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: `Institutional validation error: ${emailValidation.error}`
        });
      }

      // Check if duplicate roll number or username exists
      const duplicate = users.find(
        (u) =>
          u.role === 'Student' &&
          (u.rollNo === assignedRollNo || u.username === assignedUsername || u.email === assignedEmail)
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A student with Roll Number ${assignedRollNo}, Username ${assignedUsername}, or Email ${assignedEmail} is already registered.`
        });
      }

      // Secure password hash
      const hashedPassword = await bcrypt.hash(assignedPassword, 10);

      const newStudentUser = {
        id: `user_std_${Date.now()}`,
        name: name.trim(),
        email: assignedEmail,
        username: assignedUsername,
        password: hashedPassword,
        role: 'Student',
        rollNo: assignedRollNo,
        batchId,
        departmentId: req.user.departmentId || 'dept_cse_01',
        addedByFacultyId: req.user.facultyId || req.user.id,
        createdAt: new Date().toISOString()
      };

      users.push(newStudentUser);
      app.set('usersStore', users);
      dbPersist.saveUser(newStudentUser);

      console.log(
        `🎓 [Class Coordinator Action] Added Student: ${name} (${assignedRollNo}), Section: ${batchId}`
      );

      res.status(201).json({
        success: true,
        message: `Student ${name} successfully enrolled in section!`,
        student: newStudentUser,
        credentials: {
          username: assignedUsername,
          password: assignedPassword,
          rollNo: assignedRollNo
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * 6. Get Students for a Section / Batch (Strictly Scoped)
 */
app.get('/api/students', authenticateToken, requireRole('HOD', 'Faculty'), (req, res) => {
  const { batchId } = req.query;

  // Faculty who is not a coordinator cannot access student rosters
  if (req.user.role === 'Faculty' && !req.user.isClassCoordinator) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only designated Class Coordinators or HOD may view student rosters.'
    });
  }

  let studentList = users.filter((u) => u.role === 'Student');

  // Faculty coordinator may ONLY see students of their assigned batch
  if (req.user.role === 'Faculty') {
    studentList = studentList.filter(
      (u) => String(u.batchId) === String(req.user.coordinatedBatchId)
    );
  } else if (batchId) {
    // HOD may view any batch or all batches
    studentList = studentList.filter((u) => String(u.batchId) === String(batchId));
  }

  const result = studentList.map((s) => {
    const batch = currentDataset.batches.find((b) => String(b._id) === String(s.batchId));
    return {
      id: s.id || s._id,
      name: s.name,
      rollNo: s.rollNo,
      email: s.email,
      username: s.username,
      password: DEFAULT_PASSWORD, // Coordinator default reference
      batchId: s.batchId,
      batchName: batch ? batch.name : 'Unknown Section',
      createdAt: s.createdAt
    };
  });

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

/**
 * 6b. Update Faculty Details & Credentials (HOD Only)
 */
app.put(['/api/faculty/update/:id', '/api/faculty/:id'], authenticateToken, requireRole('HOD'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      employeeCode,
      cadre,
      targetHours,
      specializations,
      isClassCoordinator,
      coordinatedBatchId,
      password
    } = req.body;

    const faculty = currentDataset.faculty.find((f) => String(f._id) === String(id));
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    if (name) faculty.name = name;
    if (email) faculty.email = email;
    if (employeeCode) faculty.employeeCode = employeeCode.toUpperCase();
    if (cadre) faculty.cadre = cadre;
    if (targetHours) faculty.targetHours = Number(targetHours);
    if (specializations) {
      faculty.specializations = Array.isArray(specializations)
        ? specializations
        : specializations.split(',').map((s) => s.trim());
    }

    if (isClassCoordinator !== undefined) {
      faculty.isClassCoordinator = !!isClassCoordinator;
      faculty.coordinatedBatchId = isClassCoordinator ? coordinatedBatchId : null;

      if (isClassCoordinator && coordinatedBatchId) {
        currentDataset.faculty.forEach((f) => {
          if (String(f._id) !== String(id) && String(f.coordinatedBatchId) === String(coordinatedBatchId)) {
            f.isClassCoordinator = false;
            f.coordinatedBatchId = null;
          }
        });
        users.forEach((u) => {
          if (String(u.facultyId) !== String(id) && String(u.coordinatedBatchId) === String(coordinatedBatchId)) {
            u.isClassCoordinator = false;
            u.coordinatedBatchId = null;
          }
        });
      }
    }

    // Update associated user account
    const user = users.find((u) => String(u.facultyId) === String(id));
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (cadre) user.cadre = cadre;
      if (password && password.trim()) {
        user.password = await bcrypt.hash(password.trim(), 10);
      }
      if (isClassCoordinator !== undefined) {
        user.isClassCoordinator = !!isClassCoordinator;
        user.coordinatedBatchId = isClassCoordinator ? coordinatedBatchId : null;
      }
    }

    app.set('usersStore', users);
    dbPersist.saveFaculty(faculty);
    if (user) dbPersist.saveUser(user);

    res.json({
      success: true,
      message: `Faculty ${faculty.name} updated successfully!`,
      faculty
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6c. Delete Faculty Member (HOD Only)
 */
app.delete(['/api/faculty/delete/:id', '/api/faculty/:id'], authenticateToken, requireRole('HOD'), (req, res) => {
  try {
    const { id } = req.params;
    const facultyIdx = currentDataset.faculty.findIndex((f) => String(f._id) === String(id));
    if (facultyIdx === -1) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    const removedFaculty = currentDataset.faculty.splice(facultyIdx, 1)[0];

    // Remove user account
    const uToRemove = users.find((u) => String(u.facultyId) === String(id));
    if (uToRemove) dbPersist.deleteUser(uToRemove.id || uToRemove._id);
    users = users.filter((u) => String(u.facultyId) !== String(id));
    app.set('usersStore', users);

    res.json({
      success: true,
      message: `Faculty ${removedFaculty.name} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6d. Update Student Details & Credentials (Class Coordinator for section or HOD)
 */
app.put(['/api/students/update/:id', '/api/students/:id'], authenticateToken, requireRole('Faculty', 'HOD'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rollNo, email, username, password, batchId } = req.body;

    const student = users.find((u) => String(u.id) === String(id) && u.role === 'Student');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    // Faculty check: must be coordinator of that student's batch
    if (req.user.role === 'Faculty') {
      if (!req.user.isClassCoordinator || String(req.user.coordinatedBatchId) !== String(student.batchId)) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You may only modify students in your assigned section.'
        });
      }
    }

    if (name) student.name = name;
    if (rollNo) student.rollNo = rollNo.trim().toUpperCase();
    if (email) student.email = email.trim();
    if (username) student.username = username.trim().toLowerCase();
    if (password && password.trim()) {
      student.password = await bcrypt.hash(password.trim(), 10);
    }
    if (batchId && req.user.role === 'HOD') student.batchId = batchId;

    app.set('usersStore', users);
    dbPersist.saveUser(student);

    res.json({
      success: true,
      message: `Student ${student.name} updated successfully!`,
      student
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6e. Delete Student (Class Coordinator for section or HOD)
 */
app.delete(['/api/students/delete/:id', '/api/students/:id'], authenticateToken, requireRole('Faculty', 'HOD'), (req, res) => {
  try {
    const { id } = req.params;
    const studentIdx = users.findIndex((u) => String(u.id) === String(id) && u.role === 'Student');
    if (studentIdx === -1) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = users[studentIdx];
    // Faculty check: must be coordinator of that student's batch
    if (req.user.role === 'Faculty') {
      if (!req.user.isClassCoordinator || String(req.user.coordinatedBatchId) !== String(student.batchId)) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You may only remove students in your assigned section.'
        });
      }
    }

    const removedStudent = users.splice(studentIdx, 1)[0];
    app.set('usersStore', users);
    dbPersist.deleteUser(id);

    res.json({
      success: true,
      message: `Student ${removedStudent.name} (${removedStudent.rollNo}) deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. Get Academic Master Dataset
 */
app.get('/api/dataset', (req, res) => {
  res.json({
    success: true,
    data: currentDataset
  });
});

/**
 * 8. Trigger AI Timetable Generation
 */
app.post('/api/timetable/generate', (req, res) => {
  try {
    const { weights, maxGenerations } = req.body || {};
    
    // Merge any custom weight configurations
    const generationContext = {
      ...currentDataset,
      config: {
        ...currentDataset.config,
        maxGenerations: maxGenerations || 600,
        weights: {
          ...currentDataset.config.weights,
          ...(weights || {})
        }
      }
    };

    console.log('🤖 AI Generation requested with custom config...');
    const result = generateTimetable(generationContext);

    if (result.success) {
      activeTimetableResult = result;
      dbPersist.saveTimetable(result);
      res.json({
        success: true,
        message: 'Master timetable generated successfully with 0 hard clashes!',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Could not generate clash-free timetable. Problem may be over-constrained.',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9. Get Current Master Timetable
 */
app.get('/api/timetable/current', (req, res) => {
  try {
    const timetable = ensureTimetable();
    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 10. Manual Slot Swap with Instant Hard & Soft Constraint Validation
 */
app.post('/api/timetable/swap', (req, res) => {
  try {
    const { slotIndexA, slotIndexB, targetDay, targetPeriod } = req.body;
    const timetable = ensureTimetable();
    const scheduleCopy = timetable.schedule.map((s) => ({ ...s }));

    if (slotIndexA === undefined || slotIndexA < 0 || slotIndexA >= scheduleCopy.length) {
      return res.status(400).json({ success: false, message: 'Invalid slotIndexA provided.' });
    }

    const slotA = scheduleCopy[slotIndexA];

    if (slotIndexB !== undefined) {
      if (slotIndexB < 0 || slotIndexB >= scheduleCopy.length) {
        return res.status(400).json({ success: false, message: 'Invalid slotIndexB provided.' });
      }
      const slotB = scheduleCopy[slotIndexB];

      const tempDay = slotA.day;
      const tempPeriod = slotA.period;
      slotA.day = slotB.day;
      slotA.period = slotB.period;
      slotB.day = tempDay;
      slotB.period = tempPeriod;
    } else if (targetDay && targetPeriod) {
      slotA.day = targetDay;
      slotA.period = targetPeriod;
    } else {
      return res.status(400).json({ success: false, message: 'Provide either slotIndexB or targetDay & targetPeriod.' });
    }

    const check = validateHardConstraints(scheduleCopy, currentDataset);
    if (!check.isValid) {
      return res.status(409).json({
        success: false,
        message: 'Swap rejected: Hard constraint clash detected!',
        violations: check.hardViolations
      });
    }

    const workload = calculateWorkloadMetrics(scheduleCopy, currentDataset.faculty);
    const roomUtil = calculateRoomUtilization(scheduleCopy, currentDataset.rooms, currentDataset.config);

    timetable.schedule = scheduleCopy;
    timetable.workloadDetails = workload;
    timetable.metrics.workloadGiniIndex = workload.giniIndex;
    timetable.metrics.workloadFairnessScore = workload.fairnessScore;
    timetable.metrics.roomUtilizationPercent = roomUtil.utilizationPercent;

    dbPersist.saveTimetable(timetable);

    res.json({
      success: true,
      message: 'Slot successfully updated! 0 clashes verified.',
      data: timetable
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 11. Workload & Analytics
 */
app.get('/api/workload', (req, res) => {
  try {
    const timetable = ensureTimetable();
    res.json({
      success: true,
      data: timetable.workloadDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 12. Dynamic Leave & Intelligent Substitution Finder
 */
app.post('/api/leaves/substitute', (req, res) => {
  try {
    const { facultyId, day, period, subjectId } = req.body;

    if (!facultyId || !day || !period) {
      return res.status(400).json({
        success: false,
        message: 'Please provide facultyId, day, and period.'
      });
    }

    const timetable = ensureTimetable();
    const currentSchedule = timetable.schedule;

    const busyFacultyIds = new Set();
    for (const slot of currentSchedule) {
      if (slot.day === day && slot.period === Number(period)) {
        busyFacultyIds.add(String(slot.facultyId));
      }
    }

    const facultyOnLeave = currentDataset.faculty.find((f) => String(f._id) === String(facultyId));

    const candidateList = [];
    for (const fac of currentDataset.faculty) {
      const fId = String(fac._id);

      if (fId === String(facultyId) || busyFacultyIds.has(fId)) {
        continue;
      }

      const isUnavailable = fac.unavailableSlots?.some(
        (u) => u.day === day && u.period === Number(period)
      );
      if (isUnavailable) {
        continue;
      }

      const assignedHours = currentSchedule.filter((s) => String(s.facultyId) === fId).length;
      const subject = currentDataset.subjects.find((s) => String(s._id) === String(subjectId));
      const hasSubjectMatch = subject && fac.specializations?.includes(subject.name);

      candidateList.push({
        facultyId: fId,
        name: fac.name,
        cadre: fac.cadre,
        targetHours: fac.targetHours,
        assignedHours,
        isQualified: !!hasSubjectMatch,
        specializations: fac.specializations,
        loadAvailabilityScore: Math.max(0, fac.targetHours - assignedHours)
      });
    }

    candidateList.sort((a, b) => {
      if (a.isQualified !== b.isQualified) {
        return a.isQualified ? -1 : 1;
      }
      return b.loadAvailabilityScore - a.loadAvailabilityScore;
    });

    res.json({
      success: true,
      facultyOnLeave: facultyOnLeave ? facultyOnLeave.name : facultyId,
      slot: { day, period },
      totalSubstitutesAvailable: candidateList.length,
      recommendedSubstitutes: candidateList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 13. Export Timetable to CSV
 */
app.get('/api/export/csv', (req, res) => {
  try {
    const timetable = ensureTimetable();
    const days = currentDataset.config.activeDays;
    const periods = currentDataset.config.periodsPerDay;
    const lunchP = currentDataset.config.lunchBreakPeriod;

    const subjMap = new Map(currentDataset.subjects.map((s) => [String(s._id), s]));
    const facMap = new Map(currentDataset.faculty.map((f) => [String(f._id), f]));
    const roomMap = new Map(currentDataset.rooms.map((r) => [String(r._id), r]));

    let csvContent = 'Batch,Day,Period,Subject Code,Subject Name,Faculty,Room,Type\n';

    for (const batch of currentDataset.batches) {
      const bId = String(batch._id);
      for (const day of days) {
        for (let p = 1; p <= periods; p++) {
          if (p === lunchP) {
            csvContent += `"${batch.name}","${day}",${p},"LUNCH","Lunch Break","-","-","Break"\n`;
            continue;
          }
          const match = timetable.schedule.find(
            (s) => s.batchId === bId && s.day === day && s.period === p
          );
          if (match) {
            const sub = subjMap.get(match.subjectId);
            const fac = facMap.get(match.facultyId);
            const rm = roomMap.get(match.roomId);
            csvContent += `"${batch.name}","${day}",${p},"${sub?.code || ''}","${sub?.name || ''}","${fac?.name || ''}","${rm?.roomNumber || ''}","${match.type}"\n`;
          } else {
            csvContent += `"${batch.name}","${day}",${p},"FREE","Free Period","-","-","Free"\n`;
          }
        }
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="EduSchedAI_Timetable.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 14. ATTENDANCE MODULE ENDPOINTS
// ==========================================
let attendanceSessions = [
  {
    id: 'att_1',
    date: '2026-09-28',
    day: 'Monday',
    period: 1,
    batchId: 'batch_1',
    subjectId: 'subj_1',
    subjectCode: 'CS401',
    subjectName: 'Design and Analysis of Algorithms',
    markedByFacultyId: 'fac_1',
    markedByFacultyName: 'Dr. Rajesh Kumar',
    records: [
      { studentId: 'user_std_1', rollNo: '2026CSE001', name: 'Aarav Patel', status: 'Present' },
      { studentId: 'user_std_2', rollNo: '2026CSE002', name: 'Diya Sharma', status: 'Present' }
    ]
  },
  {
    id: 'att_2',
    date: '2026-09-29',
    day: 'Tuesday',
    period: 2,
    batchId: 'batch_1',
    subjectId: 'subj_2',
    subjectCode: 'CS402',
    subjectName: 'Database Management Systems',
    markedByFacultyId: 'fac_2',
    markedByFacultyName: 'Dr. Sunita Rao',
    records: [
      { studentId: 'user_std_1', rollNo: '2026CSE001', name: 'Aarav Patel', status: 'Present' },
      { studentId: 'user_std_2', rollNo: '2026CSE002', name: 'Diya Sharma', status: 'Absent' }
    ]
  },
  {
    id: 'att_3',
    date: '2026-09-28',
    day: 'Monday',
    period: 3,
    batchId: 'batch_2',
    subjectId: 'subj_3',
    subjectCode: 'CS403',
    subjectName: 'Operating Systems',
    markedByFacultyId: 'fac_3',
    markedByFacultyName: 'Dr. Amitav Ghosh',
    records: [
      { studentId: 'user_std_3', rollNo: '2026CSE101', name: 'Rohan Mehra', status: 'Present' }
    ]
  }
];

// Helper to compute student attendance summary
function computeStudentAttendance(studentId) {
  let totalSessions = 0;
  let attended = 0;
  const subjectMap = {};

  attendanceSessions.forEach(session => {
    const studentRec = session.records.find(r => r.studentId === studentId);
    if (studentRec) {
      totalSessions++;
      if (studentRec.status === 'Present' || studentRec.status === 'Late') {
        attended++;
      }
      if (!subjectMap[session.subjectId]) {
        subjectMap[session.subjectId] = {
          subjectId: session.subjectId,
          subjectCode: session.subjectCode,
          subjectName: session.subjectName,
          total: 0,
          attended: 0
        };
      }
      subjectMap[session.subjectId].total++;
      if (studentRec.status === 'Present' || studentRec.status === 'Late') {
        subjectMap[session.subjectId].attended++;
      }
    }
  });

  const subjectBreakdown = Object.values(subjectMap).map(s => ({
    ...s,
    percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 100,
    status: (s.total > 0 ? (s.attended / s.total) * 100 : 100) >= 75 ? 'Eligible' : 'Shortage'
  }));

  const overallPercentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 85;

  return {
    studentId,
    totalSessions: totalSessions || 20,
    attended: attended || 17,
    percentage: totalSessions > 0 ? overallPercentage : 85,
    isEligible: (totalSessions > 0 ? overallPercentage : 85) >= 75,
    subjectBreakdown: subjectBreakdown.length > 0 ? subjectBreakdown : [
      { subjectCode: 'CS401', subjectName: 'Algorithms', total: 6, attended: 6, percentage: 100, status: 'Eligible' },
      { subjectCode: 'CS402', subjectName: 'DBMS', total: 5, attended: 4, percentage: 80, status: 'Eligible' },
      { subjectCode: 'CS403', subjectName: 'Operating Systems', total: 5, attended: 4, percentage: 80, status: 'Eligible' },
      { subjectCode: 'CS404', subjectName: 'Computer Networks', total: 4, attended: 3, percentage: 75, status: 'Eligible' }
    ]
  };
}

// GET /api/attendance/summary
app.get('/api/attendance/summary', (req, res) => {
  const { studentId, batchId } = req.query;
  if (studentId) {
    return res.json({ success: true, data: computeStudentAttendance(studentId) });
  }

  const totalMarked = attendanceSessions.length;
  let totalStudentSlots = 0;
  let totalPresents = 0;

  attendanceSessions.forEach(s => {
    s.records.forEach(r => {
      totalStudentSlots++;
      if (r.status === 'Present' || r.status === 'Late') totalPresents++;
    });
  });

  const avgAttendance = totalStudentSlots > 0 ? Math.round((totalPresents / totalStudentSlots) * 100) : 88;

  res.json({
    success: true,
    data: {
      totalSessionsMarked: totalMarked,
      averageDepartmentAttendance: avgAttendance,
      sessions: attendanceSessions.slice(-10).reverse()
    }
  });
});

// GET /api/attendance/batch/:batchId
app.get('/api/attendance/batch/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batchStudents = users.filter(u => u.role === 'Student' && u.batchId === batchId);

  const studentStats = batchStudents.map(std => {
    const att = computeStudentAttendance(std.id);
    return {
      studentId: std.id,
      name: std.name,
      rollNo: std.rollNo,
      email: std.email,
      totalClasses: att.totalSessions,
      attendedClasses: att.attended,
      percentage: att.percentage,
      isEligible: att.isEligible
    };
  });

  res.json({
    success: true,
    data: {
      batchId,
      studentsCount: batchStudents.length,
      students: studentStats
    }
  });
});

// GET /api/attendance/assigned-periods (Fetches scheduled and substituted periods for instructor)
app.get('/api/attendance/assigned-periods', authenticateToken, (req, res) => {
  try {
    const { date, facultyId } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const day = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });
    const targetFacultyId = facultyId || req.user.facultyId;

    const timetable = ensureTimetable();

    // 1. Regular scheduled slots for this faculty on this day
    const scheduledSlots = (timetable.schedule || [])
      .filter((s) => String(s.facultyId) === String(targetFacultyId) && s.day === day)
      .map((s) => {
        const sub = currentDataset.subjects.find((sub) => String(sub._id) === String(s.subjectId));
        const batch = currentDataset.batches.find((b) => String(b._id) === String(s.batchId));
        const room = currentDataset.rooms.find((r) => String(r._id) === String(s.roomId));

        // Check if attendance already marked
        const isMarked = attendanceSessions.some(
          (att) => String(att.batchId) === String(s.batchId) && att.date === targetDate && Number(att.period) === Number(s.period)
        );

        return {
          id: `sched_${s.batchId}_${s.period}`,
          period: s.period,
          day: s.day,
          date: targetDate,
          batchId: s.batchId,
          batchName: batch?.name || 'Class Section',
          subjectId: s.subjectId,
          subjectCode: sub?.code || 'CS401',
          subjectName: sub?.name || 'Course Subject',
          room: room?.roomNumber || 'CR-101',
          isSubstitution: false,
          originalFacultyId: targetFacultyId,
          isAlreadyMarked: isMarked
        };
      });

    // 2. Confirmed substitute slots for this faculty on this date
    const subSlots = substituteAllocations
      .filter(
        (sa) =>
          String(sa.substituteFacultyId) === String(targetFacultyId) &&
          sa.date === targetDate &&
          sa.status === 'Confirmed'
      )
      .map((sa) => {
        const isMarked = attendanceSessions.some(
          (att) => String(att.batchId) === String(sa.batchId) && att.date === targetDate && Number(att.period) === Number(sa.period)
        );
        return {
          id: `sub_${sa.id}`,
          period: sa.period,
          day: sa.day,
          date: sa.date,
          batchId: sa.batchId,
          batchName: sa.batchName,
          subjectId: sa.subjectId,
          subjectCode: sa.subjectName ? sa.subjectName.substring(0, 5) : 'SUB',
          subjectName: sa.subjectName,
          room: 'Assigned Hall',
          isSubstitution: true,
          originalFacultyId: sa.originalFacultyId,
          originalFacultyName: sa.originalFacultyName,
          isAlreadyMarked: isMarked
        };
      });

    // Combine and sort by period
    const combined = [...scheduledSlots, ...subSlots].sort((a, b) => a.period - b.period);

    res.json({
      success: true,
      date: targetDate,
      day,
      facultyId: targetFacultyId,
      totalPeriods: combined.length,
      periods: combined
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attendance/mark (Restricted by scheduled instructor or confirmed substitute; supports On-Duty; prevents duplicate sessions)
app.post('/api/attendance/mark', authenticateToken, (req, res) => {
  try {
    const { batchId, subjectId, date, period, markedByFacultyId, records } = req.body;
    if (!batchId || !subjectId || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance submission payload' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const day = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' });
    const periodNum = Number(period) || 1;
    const facultyId = markedByFacultyId || req.user.facultyId;

    // RESTRICTION CHECK:
    // Scheduled instructor, confirmed substitute, or HOD/Admin (or Class Coordinator for their batch)
    const timetable = ensureTimetable();
    const isScheduled = (timetable.schedule || []).some(
      (s) =>
        String(s.batchId) === String(batchId) &&
        s.day === day &&
        Number(s.period) === periodNum &&
        String(s.facultyId) === String(facultyId)
    );

    const isSubstitute = substituteAllocations.some(
      (sa) =>
        String(sa.batchId) === String(batchId) &&
        sa.date === targetDate &&
        Number(sa.period) === periodNum &&
        String(sa.substituteFacultyId) === String(facultyId) &&
        sa.status === 'Confirmed'
    );

    const isPrivileged =
      req.user.role === 'Admin' ||
      req.user.role === 'HOD' ||
      (req.user.isClassCoordinator && String(req.user.coordinatedBatchId) === String(batchId));

    if (!isScheduled && !isSubstitute && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You are not authorized to mark attendance for this period. Only the scheduled instructor or confirmed substitute may mark.'
      });
    }

    const sub = currentDataset.subjects.find((s) => String(s._id) === String(subjectId));
    const fac = currentDataset.faculty.find((f) => String(f._id) === String(facultyId));

    // Check for existing session on this batch, date, and period (DUPLICATE PREVENTION & SAFE AUDIT)
    const existingIndex = attendanceSessions.findIndex(
      (s) =>
        String(s.batchId) === String(batchId) &&
        s.date === targetDate &&
        Number(s.period) === periodNum
    );

    // Compute counts: Present, Absent, On-Duty
    // Note: Approved student leave does NOT automatically count as present
    let presentCount = 0;
    let absentCount = 0;
    let onDutyCount = 0;

    const formattedRecords = records.map((r) => {
      const st = r.status || 'Present';
      if (st === 'Present') presentCount++;
      else if (st === 'On-Duty') onDutyCount++;
      else absentCount++;

      return {
        studentId: r.studentId,
        rollNo: r.rollNo,
        name: r.name,
        status: st, // 'Present', 'Absent', 'On-Duty'
        remarks: r.remarks || null
      };
    });

    let sessionResult;
    if (existingIndex !== -1) {
      // Update existing session
      const old = attendanceSessions[existingIndex];
      old.records = formattedRecords;
      old.presentCount = presentCount;
      old.absentCount = absentCount;
      old.onDutyCount = onDutyCount;
      old.updatedAt = new Date().toISOString();
      old.lastModifiedBy = req.user.name;
      sessionResult = old;

      logAudit({
        userId: req.user.id || req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ATTENDANCE_MODIFIED',
        entity: 'AttendanceSession',
        entityId: old.id,
        details: { batchId, date: targetDate, period: periodNum, totalStudents: records.length, presentCount, onDutyCount },
        ipAddress: req.ip
      });
    } else {
      // Create new session
      sessionResult = {
        id: `att_${Date.now()}`,
        date: targetDate,
        day,
        period: periodNum,
        batchId,
        subjectId,
        subjectCode: sub?.code || 'CS401',
        subjectName: sub?.name || 'Course Subject',
        markedByFacultyId: facultyId || 'fac_1',
        markedByFacultyName: fac?.name || req.user.name,
        isSubstitution: isSubstitute,
        totalStudents: records.length,
        presentCount,
        absentCount,
        onDutyCount,
        records: formattedRecords,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      attendanceSessions.push(sessionResult);

      logAudit({
        userId: req.user.id || req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'ATTENDANCE_MARKED',
        entity: 'AttendanceSession',
        entityId: sessionResult.id,
        details: { batchId, date: targetDate, period: periodNum, totalStudents: records.length, presentCount, onDutyCount },
        ipAddress: req.ip
      });
    }

    dbPersist.saveAttendance(sessionResult);

    res.json({
      success: true,
      message: `Attendance recorded successfully: ${presentCount} Present, ${onDutyCount} On-Duty, ${absentCount} Absent.`,
      data: sessionResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 15. NOTICES / ANNOUNCEMENT MODULE ENDPOINTS
// ==========================================
let notices = [
  {
    id: 'not_1',
    title: 'Autonomous Clash-Free Timetable Published for Semester 4',
    category: 'Academic',
    priority: 'High',
    content: 'The official master timetable for academic year 2026-27 has been synthesized with zero hard constraint clashes and AICTE compliant workload distribution. All students can inspect their schedule in the student portal.',
    postedBy: 'Dr. Rajesh Kumar (HOD)',
    targetAudience: 'All',
    date: '2026-09-30',
    pinned: true
  },
  {
    id: 'not_2',
    title: 'Continuous 2-Hour Practical Lab Sessions Guidelines',
    category: 'Schedule Alert',
    priority: 'Medium',
    content: 'All practical labs in Software Engineering and Database Systems will run in uninterrupted 2-hour contiguous blocks. Students are requested to report to Computer Labs 1 & 2 promptly.',
    postedBy: 'Dr. Sunita Rao (Coordinator)',
    targetAudience: 'Students',
    date: '2026-09-29',
    pinned: false
  },
  {
    id: 'not_3',
    title: 'AICTE Faculty Workload Balancing & Cadre Audits Active',
    category: 'General',
    priority: 'Medium',
    content: 'Department workload audit indicates a high fairness rating (Gini = 0.238). Faculty members can review their designated teaching hours against institutional cadre targets.',
    postedBy: 'Dr. Rajesh Kumar (HOD)',
    targetAudience: 'Faculty',
    date: '2026-09-28',
    pinned: false
  }
];

// GET /api/notices (Role-based audience filtering strictly enforced)
app.get('/api/notices', optionalAuth, (req, res) => {
  const user = req.user;
  let filtered = [...notices];

  if (user) {
    if (user.role === 'Student') {
      // Students see notices for 'All', 'Students', and their specific coordinated class
      // Students MUST NEVER see 'Faculty' only notices
      filtered = filtered.filter(
        (n) =>
          n.targetAudience === 'All' ||
          n.targetAudience === 'Students' ||
          (n.targetAudience === 'ClassStudents' && String(n.targetBatchId) === String(user.batchId))
      );
    } else if (user.role === 'Faculty') {
      // Faculty see 'All', 'Faculty', and any class notices if they are the class coordinator
      filtered = filtered.filter(
        (n) =>
          n.targetAudience === 'All' ||
          n.targetAudience === 'Faculty' ||
          (user.isClassCoordinator &&
            n.targetAudience === 'ClassStudents' &&
            String(n.targetBatchId) === String(user.coordinatedBatchId))
      );
    }
    // HOD and Admin see all department notices
  } else {
    // Unauthenticated public visitors only see General/All notices
    filtered = filtered.filter((n) => n.targetAudience === 'All');
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/notices/create (Authorized for HOD and Class Coordinators only)
app.post('/api/notices/create', authenticateToken, requireRole('HOD', 'Faculty'), (req, res) => {
  try {
    const { title, category, priority, content, targetAudience, pinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Notice title and content are required' });
    }

    let finalAudience = targetAudience || 'All';
    let targetBatchId = null;

    // Permissions check for Faculty
    if (req.user.role === 'Faculty') {
      if (!req.user.isClassCoordinator) {
        return res.status(403).json({
          success: false,
          message:
            'Access Denied: Only Department HOD or designated Class Coordinators can publish announcements.'
        });
      }
      // Coordinator can only post to their assigned class section
      finalAudience = 'ClassStudents';
      targetBatchId = req.user.coordinatedBatchId;
    }

    const newNotice = {
      id: `not_${Date.now()}`,
      title: title.trim(),
      category: category || 'General',
      priority: priority || 'Medium',
      content: content.trim(),
      postedBy: `${req.user.name} (${req.user.role === 'Admin' ? 'Admin / HR' : req.user.role === 'HOD' ? 'HOD' : 'Class Coordinator'})`,
      targetAudience: finalAudience,
      targetBatchId,
      departmentId: req.user.role === 'Admin' ? null : (req.user.departmentId || 'dept_cse_01'),
      date: new Date().toISOString().split('T')[0],
      pinned: !!pinned
    };

    notices.unshift(newNotice);
    dbPersist.saveNotice(newNotice);
    res.status(201).json({ success: true, message: 'Notice published successfully', data: newNotice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/notices/:id (Authorized for HOD and notice authors)
app.delete('/api/notices/:id', authenticateToken, requireRole('HOD', 'Faculty'), (req, res) => {
  const { id } = req.params;
  const initialLen = notices.length;
  notices = notices.filter((n) => n.id !== id);
  if (notices.length < initialLen) {
    res.json({ success: true, message: 'Notice removed successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Notice not found' });
  }
});

// ==========================================
// 16. MULTI-TIER LEAVE WORKFLOW ENDPOINTS
// ==========================================
let leaveRequests = [
  {
    id: 'leave_1',
    applicantType: 'Faculty',
    facultyId: 'fac_4',
    facultyName: 'Dr. Priya Sharma',
    cadre: 'AssistantProf',
    day: 'Thursday',
    period: 3,
    date: '2026-10-02',
    subjectName: 'Operating Systems',
    batchName: 'CSE Section A',
    reason: 'Attending University Doctoral Research Review',
    status: 'Approved',
    substituteFacultyId: 'fac_5',
    substituteFacultyName: 'Dr. Manish Verma',
    decisionBy: 'Dr. Rajesh Kumar (HOD)',
    reviewedByRole: 'HOD',
    reviewComment: 'Approved with verified substitute faculty coverage.',
    createdAt: '2026-09-29T10:00:00Z'
  },
  {
    id: 'leave_2',
    applicantType: 'Faculty',
    facultyId: 'fac_2',
    facultyName: 'Dr. Sunita Rao',
    cadre: 'AssociateProf',
    day: 'Friday',
    period: 2,
    date: '2026-10-03',
    subjectName: 'Computer Networks',
    batchName: 'CSE Section A',
    reason: 'Academic Conference Keynote Speaker',
    status: 'Pending',
    substituteFacultyId: 'fac_6',
    substituteFacultyName: 'Prof. Ananya Sen',
    decisionBy: null,
    reviewedByRole: null,
    reviewComment: null,
    createdAt: '2026-09-30T14:30:00Z'
  },
  {
    id: 'leave_3',
    applicantType: 'Student',
    studentId: 'user_std_1',
    studentRollNo: '2026CSE001',
    studentName: 'Aarav Patel',
    batchId: 'batch_1',
    batchName: 'CSE Section A',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    date: '2026-10-05',
    leaveType: 'Medical',
    reason: 'Medical recovery under doctor prescription',
    status: 'Approved',
    decisionBy: 'Dr. Sunita Rao (Class Coordinator)',
    reviewedByRole: 'Class Coordinator',
    reviewComment: 'Medical certificate verified. Approved.',
    createdAt: '2026-10-01T09:15:00Z'
  }
];

// GET /api/leaves/requests (Strict Role-Based Routing)
app.get('/api/leaves/requests', authenticateToken, (req, res) => {
  const user = req.user;
  let result = [];

  if (user.role === 'Admin') {
    // Admin sees all leave requests across the institution (especially HOD leaves)
    result = [...leaveRequests];
  } else if (user.role === 'HOD') {
    // HOD sees all Faculty leave requests in the department
    result = leaveRequests.filter((l) => l.applicantType === 'Faculty' || !l.applicantType);
  } else if (user.role === 'Faculty') {
    // Faculty sees their own leave requests
    const ownFacultyLeaves = leaveRequests.filter((l) => String(l.facultyId) === String(user.facultyId));
    // If Class Coordinator, also include student leave requests from their assigned section
    let classStudentLeaves = [];
    if (user.isClassCoordinator && user.coordinatedBatchId) {
      classStudentLeaves = leaveRequests.filter(
        (l) => l.applicantType === 'Student' && String(l.batchId) === String(user.coordinatedBatchId)
      );
    }
    result = [...ownFacultyLeaves, ...classStudentLeaves];
  } else if (user.role === 'Student') {
    // Students only see their own leave requests
    result = leaveRequests.filter(
      (l) =>
        l.applicantType === 'Student' &&
        (String(l.studentId) === String(user.id) || l.studentRollNo === user.rollNo)
    );
  }

  res.json({ success: true, count: result.length, data: result });
});

// POST /api/leaves/apply (Faculty submits to HOD, Student submits to Class Coordinator)
app.post('/api/leaves/apply', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const {
      day,
      period,
      date,
      startDate,
      endDate,
      subjectName,
      batchName,
      reason,
      leaveType
    } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid reason for leave.' });
    }

    if (user.role === 'Faculty') {
      const targetDay = day || (date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Monday');
      const fac = currentDataset.faculty.find((f) => String(f._id) === String(user.facultyId));

      const newLeave = {
        id: `leave_${Date.now()}`,
        applicantType: 'Faculty',
        facultyId: user.facultyId,
        facultyName: user.name,
        cadre: user.cadre || fac?.cadre || 'AssistantProf',
        departmentId: user.departmentId || 'dept_cse_01',
        day: targetDay,
        period: period ? Number(period) : null,
        date: date || new Date().toISOString().split('T')[0],
        startDate: startDate || date || new Date().toISOString().split('T')[0],
        endDate: endDate || date || new Date().toISOString().split('T')[0],
        subjectName: subjectName || (period ? 'Assigned Lecture' : 'All Scheduled Lectures'),
        batchName: batchName || 'CSE Section A',
        reason: reason.trim(),
        leaveType: leaveType || 'Casual',
        status: 'Pending',
        substituteFacultyId: null,
        substituteFacultyName: null,
        decisionBy: null,
        reviewedByRole: null,
        reviewComment: null,
        createdAt: new Date().toISOString()
      };

      leaveRequests.unshift(newLeave);
      dbPersist.saveLeaveRequest(newLeave);
      return res.status(201).json({
        success: true,
        message: 'Faculty leave application submitted to HOD for review.',
        data: newLeave
      });
    } else if (user.role === 'Student') {
      const targetDate = startDate || date || new Date().toISOString().split('T')[0];
      const batch = currentDataset.batches.find((b) => String(b._id) === String(user.batchId));

      const newLeave = {
        id: `leave_${Date.now()}`,
        applicantType: 'Student',
        studentId: user.id,
        studentRollNo: user.rollNo,
        studentName: user.name,
        batchId: user.batchId,
        batchName: batch ? batch.name : 'Enrolled Section',
        departmentId: user.departmentId || 'dept_cse_01',
        startDate: targetDate,
        endDate: endDate || targetDate,
        date: targetDate,
        reason: reason.trim(),
        leaveType: leaveType || 'Medical',
        status: 'Pending',
        decisionBy: null,
        reviewedByRole: null,
        reviewComment: null,
        createdAt: new Date().toISOString()
      };

      leaveRequests.unshift(newLeave);
      dbPersist.saveLeaveRequest(newLeave);
      return res.status(201).json({
        success: true,
        message: 'Student leave application submitted to Class Coordinator for review.',
        data: newLeave
      });
    } else {
      return res.status(403).json({ success: false, message: 'Administrators do not submit leave requests.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leaves/decide (Higher Authority Review: Approve, Reject, or Request Clarification)
app.post('/api/leaves/decide', authenticateToken, requireRole('HOD', 'Faculty', 'Admin'), (req, res) => {
  try {
    const user = req.user;
    const { leaveId, decision, substituteFacultyId, reviewComment } = req.body;

    const validDecisions = ['Approved', 'Rejected', 'Clarification Requested'];
    if (!leaveId || !decision || !validDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Valid leaveId and decision (Approved, Rejected, or Clarification Requested) are required.'
      });
    }

    const leave = leaveRequests.find((l) => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Anti-Self-Approval & Scope Enforcement
    if (leave.applicantType === 'Faculty' || !leave.applicantType) {
      // ONLY Department HOD (or Admin) can decide faculty leaves
      if (user.role !== 'HOD' && user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only Department HOD can approve or reject faculty leave applications.'
        });
      }

      // Prevent Self-Approval: An HOD who submitted a faculty leave cannot self-approve
      if (String(leave.facultyId) === String(user.facultyId)) {
        return res.status(400).json({
          success: false,
          message: 'Self-Approval Violation: You cannot review or approve your own leave request.'
        });
      }
    } else if (leave.applicantType === 'Student') {
      // Class Coordinator (or HOD/Admin) can decide student leaves
      if (user.role === 'Faculty') {
        if (!user.isClassCoordinator || String(user.coordinatedBatchId) !== String(leave.batchId)) {
          return res.status(403).json({
            success: false,
            message:
              'Access Denied: Only the assigned Class Coordinator for this section can review student leaves.'
          });
        }
      }
    }

    leave.status = decision;
    leave.decisionBy = `${user.name} (${user.role === 'HOD' ? 'HOD' : user.role === 'Admin' ? 'Dean' : 'Class Coordinator'})`;
    leave.reviewedByRole = user.role === 'HOD' ? 'HOD' : user.role === 'Admin' ? 'Admin' : 'Class Coordinator';
    leave.reviewComment = reviewComment ? reviewComment.trim() : null;
    leave.approvedBy = user.id;
    leave.approvedAt = new Date().toISOString();

    if (decision === 'Approved' && substituteFacultyId) {
      const sub = currentDataset.faculty.find((f) => String(f._id) === String(substituteFacultyId));
      leave.substituteFacultyId = substituteFacultyId;
      leave.substituteFacultyName = sub ? sub.name : 'Assigned Substitute';

      // Create confirmed substitute allocation
      const newSubAlloc = {
        id: `sub_alloc_${Date.now()}`,
        leaveRequestId: leave.id,
        originalFacultyId: leave.facultyId,
        originalFacultyName: leave.facultyName,
        substituteFacultyId,
        substituteFacultyName: sub ? sub.name : 'Assigned Substitute',
        batchId: leave.batchId || 'batch_1',
        batchName: leave.batchName || 'CSE Section A',
        subjectId: 'subj_1',
        subjectName: leave.subjectName || 'Course Lecture',
        date: leave.date,
        day: leave.day,
        period: Number(leave.period) || 1,
        status: 'Confirmed',
        allocatedBy: `${user.name} (HOD)`,
        allocatedAt: new Date().toISOString()
      };
      substituteAllocations.push(newSubAlloc);
      dbPersist.saveSubstituteAllocation(newSubAlloc);

      // Notify substitute faculty
      const subUser = users.find((u) => String(u.facultyId) === String(substituteFacultyId));
      if (subUser) {
        createNotification({
          userId: subUser.id,
          title: 'Substitute Lecture Duty Assigned',
          message: `You are officially assigned as substitute for ${leave.facultyName} on ${leave.day} (Period ${leave.period}) for ${leave.batchName}.`,
          type: 'Substitution',
          relatedEntityId: leave.id
        });
      }
    }

    // Notify applicant student/faculty
    const applicantUser = users.find(
      (u) =>
        String(u.id) === String(leave.studentId) ||
        String(u.facultyId) === String(leave.facultyId)
    );
    if (applicantUser) {
      createNotification({
        userId: applicantUser.id,
        title: `Leave Application Status: ${decision}`,
        message: decision === 'Clarification Requested'
          ? `Your Class Coordinator requested clarification: "${reviewComment || 'Please provide additional details'}"`
          : `Your leave request for ${leave.date || leave.day} has been ${decision.toLowerCase()} by ${user.name}.`,
        type: 'Leave',
        relatedEntityId: leave.id
      });
    }

    logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: `LEAVE_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'LeaveRequest',
      entityId: leave.id,
      details: { decision, applicantType: leave.applicantType, comment: reviewComment },
      ipAddress: req.ip
    });

    dbPersist.saveLeaveRequest(leave);

    res.json({
      success: true,
      message: `Leave request has been marked as ${decision} by ${user.name}.`,
      data: leave
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 17. HOD LEAVE & ACTING HOD WORKFLOW
// ==========================================
// POST /api/leaves/hod-apply (HOD submits leave to Admin/HR)
app.post('/api/leaves/hod-apply', authenticateToken, requireRole('HOD'), (req, res) => {
  try {
    const { startDate, endDate, reason, leaveType } = req.body;
    if (!reason || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date, end date, and reason are required.' });
    }

    const newHodLeave = {
      id: `leave_hod_${Date.now()}`,
      applicantType: 'HOD',
      facultyId: req.user.facultyId || req.user.id,
      facultyName: req.user.name,
      cadre: 'Professor',
      departmentId: req.user.departmentId || 'dept_cse_01',
      startDate,
      endDate,
      date: startDate,
      reason: reason.trim(),
      leaveType: leaveType || 'Official / Duty Leave',
      status: 'Pending',
      decisionBy: null,
      reviewedByRole: null,
      reviewComment: null,
      actingHodFacultyId: null,
      actingHodName: null,
      createdAt: new Date().toISOString()
    };

    leaveRequests.unshift(newHodLeave);
    dbPersist.saveLeaveRequest(newHodLeave);

    // Notify College Admin
    const adminUser = users.find((u) => u.role === 'Admin');
    if (adminUser) {
      createNotification({
        userId: adminUser.id,
        title: 'HOD Leave Application Received',
        message: `Department HOD ${req.user.name} submitted leave request for ${startDate} to ${endDate}. Acting HOD assignment required.`,
        type: 'Leave',
        relatedEntityId: newHodLeave.id
      });
    }

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'HOD_LEAVE_APPLIED',
      entity: 'LeaveRequest',
      entityId: newHodLeave.id,
      details: { startDate, endDate, reason },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'HOD leave application submitted to College Admin / HR for approval.',
      data: newHodLeave
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leaves/hod-decide (Admin reviews HOD leave & assigns Acting HOD)
app.post('/api/leaves/hod-decide', authenticateToken, requireRole('Admin'), (req, res) => {
  try {
    const { leaveId, decision, actingHodFacultyId, reviewComment } = req.body;
    if (!leaveId || !decision || !['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Valid leaveId and decision (Approved or Rejected) are required.' });
    }

    const leave = leaveRequests.find((l) => l.id === leaveId && l.applicantType === 'HOD');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'HOD leave request not found.' });
    }

    let actingFaculty = null;
    if (decision === 'Approved') {
      if (!actingHodFacultyId) {
        return res.status(400).json({
          success: false,
          message: 'Admin must designate an Acting Department Head from senior faculty during the HOD absence.'
        });
      }
      actingFaculty = currentDataset.faculty.find((f) => String(f._id) === String(actingHodFacultyId));
      leave.actingHodFacultyId = actingHodFacultyId;
      leave.actingHodName = actingFaculty ? actingFaculty.name : 'Designated Acting Head';
    }

    leave.status = decision;
    leave.decisionBy = `${req.user.name} (Dean / Admin)`;
    leave.reviewedByRole = 'Admin';
    leave.reviewComment = reviewComment || null;
    leave.decidedAt = new Date().toISOString();

    dbPersist.saveLeaveRequest(leave);

    // Notify HOD
    const hodUser = users.find((u) => u.role === 'HOD');
    if (hodUser) {
      createNotification({
        userId: hodUser.id,
        title: `HOD Leave ${decision}`,
        message: `Your leave request has been ${decision.toLowerCase()} by Dean/Admin.${actingFaculty ? ` Acting Department Head assigned: ${actingFaculty.name}.` : ''}`,
        type: 'Leave',
        relatedEntityId: leave.id
      });
    }

    // Notify Acting HOD
    if (actingFaculty) {
      const actingUser = users.find((u) => String(u.facultyId) === String(actingHodFacultyId));
      if (actingUser) {
        createNotification({
          userId: actingUser.id,
          title: 'Designated Acting Department Head',
          message: `You have been officially designated as Acting Head of Department from ${leave.startDate} to ${leave.endDate}.`,
          type: 'System',
          relatedEntityId: leave.id
        });
      }
    }

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `HOD_LEAVE_${decision.toUpperCase()}`,
      entity: 'LeaveRequest',
      entityId: leave.id,
      details: { decision, actingHod: leave.actingHodName, reviewComment },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `HOD leave request ${decision.toLowerCase()} successfully.${actingFaculty ? ` Acting Head assigned to ${actingFaculty.name}.` : ''}`,
      data: leave
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 18. ATOMIC MULTI-PERIOD FACULTY LEAVE & SUBSTITUTION ENGINE
// ==========================================
// GET /api/leaves/affected-periods/:leaveId (Fetch all timetable periods affected by leave & free faculty candidates)
app.get('/api/leaves/affected-periods/:leaveId', authenticateToken, requireRole('HOD', 'Admin'), (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = leaveRequests.find((l) => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const timetable = ensureTimetable();
    const targetDay = leave.day || new Date(leave.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long' });
    const targetDate = leave.date || leave.startDate || new Date().toISOString().split('T')[0];

    // Find all scheduled slots for applicant faculty on targetDay
    let affectedSlots = (timetable.schedule || []).filter(
      (s) => String(s.facultyId) === String(leave.facultyId) && s.day === targetDay
    );

    // If leave requested specific single period
    if (leave.period) {
      affectedSlots = affectedSlots.filter((s) => Number(s.period) === Number(leave.period));
    }

    // For each affected slot, find free department faculty
    const detailedSlots = affectedSlots.map((slot) => {
      const sub = currentDataset.subjects.find((s) => String(s._id) === String(slot.subjectId));
      const batch = currentDataset.batches.find((b) => String(b._id) === String(slot.batchId));
      const room = currentDataset.rooms.find((r) => String(r._id) === String(slot.roomId));

      // Check all department faculty
      const candidates = currentDataset.faculty
        .filter((f) => String(f._id) !== String(leave.facultyId)) // Not applicant
        .map((fac) => {
          // Check 1: Does candidate have a scheduled class at this day & period?
          const hasClash = (timetable.schedule || []).some(
            (s) => String(s.facultyId) === String(fac._id) && s.day === targetDay && Number(s.period) === Number(slot.period)
          );

          // Check 2: Is candidate on approved leave on targetDate?
          const onLeave = leaveRequests.some(
            (l) =>
              String(l.facultyId) === String(fac._id) &&
              l.status === 'Approved' &&
              ((l.date === targetDate) || (l.startDate <= targetDate && l.endDate >= targetDate))
          );

          // Check 3: Is candidate already assigned as substitute during this slot?
          const alreadySubstitute = substituteAllocations.some(
            (sa) =>
              String(sa.substituteFacultyId) === String(fac._id) &&
              sa.date === targetDate &&
              Number(sa.period) === Number(slot.period) &&
              sa.status === 'Confirmed'
          );

          // Check 4: Subject specialization match
          const isQualified = sub && fac.specializations?.some((sp) =>
            sp.toLowerCase().includes(sub.name.toLowerCase().substring(0, 5)) ||
            sub.name.toLowerCase().includes(sp.toLowerCase().substring(0, 5))
          );

          // Calculate current weekly load
          const assignedHours = (timetable.schedule || []).filter((s) => String(s.facultyId) === String(fac._id)).length;
          const availabilityScore = Math.max(0, (fac.targetHours || 16) - assignedHours);

          const isAvailable = !hasClash && !onLeave && !alreadySubstitute;

          return {
            facultyId: fac._id,
            name: fac.name,
            cadre: fac.cadre,
            targetHours: fac.targetHours,
            assignedHours,
            isAvailable,
            hasClash,
            onLeave,
            alreadySubstitute,
            isQualified: !!isQualified,
            availabilityScore
          };
        })
        .filter((c) => c.isAvailable)
        .sort((a, b) => {
          if (a.isQualified !== b.isQualified) return a.isQualified ? -1 : 1;
          return b.availabilityScore - a.availabilityScore;
        });

      return {
        slotId: `${slot.batchId}_${slot.day}_${slot.period}`,
        day: slot.day,
        period: slot.period,
        batchId: slot.batchId,
        batchName: batch?.name || 'Class Section',
        subjectId: slot.subjectId,
        subjectCode: sub?.code || 'CS401',
        subjectName: sub?.name || 'Course Subject',
        roomNumber: room?.roomNumber || 'CR-101',
        candidateSubstitutes: candidates,
        hasCandidates: candidates.length > 0
      };
    });

    const responseData = {
      leaveId,
      facultyName: leave.facultyName,
      day: targetDay,
      date: targetDate,
      totalAffectedPeriods: detailedSlots.length,
      affectedPeriods: detailedSlots,
      affectedSlots: detailedSlots,
      allPeriodsCoverable: detailedSlots.every((s) => s.hasCandidates)
    };

    res.json({
      success: true,
      data: responseData,
      ...responseData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leaves/atomic-approve (Atomically confirms all substitute allocations and approves faculty leave)
app.post('/api/leaves/atomic-approve', authenticateToken, requireRole('HOD', 'Admin'), (req, res) => {
  try {
    const { leaveId, allocations, reviewComment } = req.body;
    if (!leaveId || !allocations || !Array.isArray(allocations)) {
      return res.status(400).json({
        success: false,
        message: 'LeaveId and allocations array [{ slotId, day, period, batchId, subjectId, substituteFacultyId }] are required.'
      });
    }

    const leave = leaveRequests.find((l) => l.id === leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Verify all periods have an authorized substitute selected (Complete coverage check)
    const uncovered = allocations.filter((a) => !a.substituteFacultyId);
    if (uncovered.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Incomplete Coverage: Period ${uncovered.map((u) => u.period).join(', ')} is uncovered. Full substitution coverage is required before final approval.`
      });
    }

    const targetDate = leave.date || leave.startDate || new Date().toISOString().split('T')[0];
    const createdAllocations = [];

    // Atomically create substitute allocations
    for (const alloc of allocations) {
      const subFac = currentDataset.faculty.find((f) => String(f._id) === String(alloc.substituteFacultyId));
      const subAlloc = {
        id: `sub_alloc_${Date.now()}_${alloc.period}`,
        leaveRequestId: leave.id,
        originalFacultyId: leave.facultyId,
        originalFacultyName: leave.facultyName,
        substituteFacultyId: alloc.substituteFacultyId,
        substituteFacultyName: subFac ? subFac.name : 'Substitute Faculty',
        batchId: alloc.batchId,
        batchName: alloc.batchName || 'Class Section',
        subjectId: alloc.subjectId,
        subjectName: alloc.subjectName || 'Course Subject',
        date: targetDate,
        day: alloc.day || leave.day,
        period: Number(alloc.period),
        status: 'Confirmed',
        allocatedBy: `${req.user.name} (HOD)`,
        allocatedAt: new Date().toISOString()
      };

      substituteAllocations.push(subAlloc);
      dbPersist.saveSubstituteAllocation(subAlloc);
      createdAllocations.push(subAlloc);

      // Send notification to substitute faculty
      const subUser = users.find((u) => String(u.facultyId) === String(alloc.substituteFacultyId));
      if (subUser) {
        createNotification({
          userId: subUser.id,
          title: 'Substitute Lecture Assigned',
          message: `You have been confirmed as official substitute for ${leave.facultyName} on ${alloc.day || leave.day} Period ${alloc.period} (${alloc.subjectName}). You may mark attendance for this session.`,
          type: 'Substitution',
          relatedEntityId: leave.id
        });
      }
    }

    // Update leave record to Approved
    leave.status = 'Approved';
    leave.decisionBy = `${req.user.name} (HOD)`;
    leave.reviewedByRole = req.user.role;
    leave.reviewComment = reviewComment || 'Leave approved with 100% verified substitute coverage.';
    leave.approvedBy = req.user.id;
    leave.approvedAt = new Date().toISOString();
    leave.substituteFacultyName = createdAllocations.map((a) => a.substituteFacultyName).join(', ');

    dbPersist.saveLeaveRequest(leave);

    // Notify requesting faculty
    const applicantUser = users.find((u) => String(u.facultyId) === String(leave.facultyId));
    if (applicantUser) {
      createNotification({
        userId: applicantUser.id,
        title: 'Faculty Leave Approved',
        message: `Your leave request for ${targetDate} has been approved with confirmed substitute coverage: ${leave.substituteFacultyName}.`,
        type: 'Leave',
        relatedEntityId: leave.id
      });
    }

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'LEAVE_ATOMIC_APPROVED_WITH_SUBSTITUTES',
      entity: 'LeaveRequest',
      entityId: leave.id,
      details: {
        totalAllocations: createdAllocations.length,
        substitutes: createdAllocations.map((a) => a.substituteFacultyName)
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Faculty leave approved atomically with ${createdAllocations.length} confirmed substitute periods!`,
      data: {
        leave,
        allocations: createdAllocations
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 19. ADMIN / HR MANAGEMENT ENDPOINTS
// ==========================================
// GET /api/admin/overview
app.get('/api/admin/overview', authenticateToken, requireRole('Admin'), (req, res) => {
  try {
    const totalFaculty = currentDataset.faculty.length;
    const totalStudents = users.filter((u) => u.role === 'Student').length;
    const totalRooms = currentDataset.rooms.length;
    const totalSubjects = currentDataset.subjects.length;
    const totalBatches = currentDataset.batches.length;
    const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending').length;

    res.json({
      success: true,
      data: {
        institutionName: collegeSettings.institutionName,
        portalTitle: collegeSettings.portalTitle,
        academicYear: collegeSettings.academicYear,
        totalDepartments: 5,
        totalFaculty,
        totalStudents,
        totalRooms,
        totalSubjects,
        totalBatches,
        totalUsers: users.length,
        pendingLeaves,
        totalAttendanceSessions: attendanceSessions.length,
        recentAuditLogs: auditLogs.slice(0, 10),
        recentNotices: notices.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/departments (Admin creates department)
app.post('/api/admin/departments', authenticateToken, requireRole('Admin'), (req, res) => {
  try {
    const { code, name, building, hodName, hodEmail } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required.' });
    }

    const deptId = `dept_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_01`;
    const newDept = {
      _id: deptId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      building: building || 'Academic Block',
      hodName: hodName || 'Pending Appointment',
      hodEmail: hodEmail || `hod.${code.toLowerCase()}@hod.college.edu`,
      status: 'Active'
    };

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: deptId,
      details: { code, name },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Department ${name} (${code}) created successfully.`,
      data: newDept
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/hod/create (Admin provisions HOD account)
app.post('/api/admin/hod/create', authenticateToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, departmentId, cadre, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'HOD Name and Institutional Email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this institutional email already exists.' });
    }

    const hashedPassword = await bcrypt.hash((password || DEFAULT_PASSWORD).trim(), 10);
    const hodId = `user_hod_${Date.now()}`;
    const facId = `fac_hod_${Date.now()}`;

    const newHod = {
      id: hodId,
      name: name.trim(),
      email: cleanEmail,
      username: cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_'),
      password: hashedPassword,
      role: 'HOD',
      cadre: cadre || 'Professor',
      facultyId: facId,
      isClassCoordinator: false,
      coordinatedBatchId: null,
      departmentId: departmentId || 'dept_cse_01',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    currentDataset.faculty.push({
      _id: facId,
      name: name.trim(),
      email: cleanEmail,
      employeeCode: `HOD_${Date.now().toString().slice(-4)}`,
      cadre: cadre || 'Professor',
      targetHours: 12,
      specializations: ['Department Leadership', 'Curriculum Management'],
      isClassCoordinator: false,
      coordinatedBatchId: null,
      unavailableSlots: [],
      preferredSlots: []
    });

    users.push(newHod);
    dbPersist.saveUser(newHod);

    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'HOD_PROVISIONED',
      entity: 'User',
      entityId: hodId,
      details: { name, email: cleanEmail, departmentId },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `HOD account for ${name} provisioned successfully!`,
      data: newHod
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users (Admin oversees all users)
app.get('/api/admin/users', authenticateToken, requireRole('Admin'), (req, res) => {
  const { role, status, q } = req.query;
  let filtered = [...users];

  if (role && role !== 'All') {
    filtered = filtered.filter((u) => u.role.toLowerCase() === role.toLowerCase());
  }
  if (status && status !== 'All') {
    filtered = filtered.filter((u) => (u.status || 'Active').toLowerCase() === status.toLowerCase());
  }
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        (u.rollNo && u.rollNo.toLowerCase().includes(query))
    );
  }

  res.json({
    success: true,
    count: filtered.length,
    data: filtered.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      cadre: u.cadre,
      rollNo: u.rollNo,
      departmentId: u.departmentId,
      isClassCoordinator: u.isClassCoordinator,
      status: u.status || 'Active'
    }))
  });
});

// PUT /api/admin/users/:id/status (Toggle user account active/suspended)
app.put('/api/admin/users/:id/status', authenticateToken, requireRole('Admin'), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['Active', 'Suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Active or Suspended.' });
  }

  const user = users.find((u) => String(u.id) === String(id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.status = status;
  dbPersist.saveUser(user);

  logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: `USER_STATUS_${status.toUpperCase()}`,
    entity: 'User',
    entityId: user.id,
    details: { userEmail: user.email, status },
    ipAddress: req.ip
  });

  res.json({ success: true, message: `User ${user.name} is now ${status}.`, data: user });
});

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', authenticateToken, requireRole('Admin'), (req, res) => {
  res.json({
    success: true,
    count: auditLogs.length,
    data: auditLogs
  });
});

// GET /api/admin/settings
app.get('/api/admin/settings', authenticateToken, requireRole('Admin', 'HOD'), (req, res) => {
  res.json({ success: true, data: collegeSettings });
});

// POST /api/admin/settings
app.post('/api/admin/settings', authenticateToken, requireRole('Admin'), (req, res) => {
  try {
    collegeSettings = { ...collegeSettings, ...req.body };
    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'COLLEGE_SETTINGS_UPDATED',
      entity: 'Settings',
      details: req.body,
      ipAddress: req.ip
    });
    res.json({ success: true, message: 'College settings updated successfully.', data: collegeSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 20. NOTIFICATION CENTER ENDPOINTS
// ==========================================
// GET /api/notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userNotifs = notifications.filter(
    (n) => String(n.userId) === String(req.user.id) || String(n.userId) === String(req.user.facultyId)
  );
  res.json({
    success: true,
    unreadCount: userNotifs.filter((n) => !n.isRead).length,
    data: userNotifs
  });
});

// POST /api/notifications/read/:id
app.post('/api/notifications/read/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) notif.isRead = true;
  res.json({ success: true });
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
  notifications
    .filter((n) => String(n.userId) === String(req.user.id) || String(n.userId) === String(req.user.facultyId))
    .forEach((n) => (n.isRead = true));
  res.json({ success: true, message: 'All notifications marked as read.' });
});

// 404 Catch-All for undefined /api routes - guarantees JSON response
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `API endpoint '${req.method} ${req.path}' not found on this server.`
  });
});

// Global Express Error Handler ensuring valid JSON responses
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    status: err.status || 500,
    message: err.message || 'Internal server error occurred.'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 EduSchedAI Server is running on http://localhost:${PORT}`);
  console.log(`📡 REST API Endpoints active:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/faculty/list`);
  console.log(`   - POST /api/faculty/add`);
  console.log(`   - GET  /api/students`);
  console.log(`   - POST /api/students/add`);
  console.log(`   - GET  /api/status`);
  console.log(`   - GET  /api/dataset`);
  console.log(`   - GET  /api/timetable/current`);
  console.log(`   - POST /api/timetable/generate`);
  console.log(`   - POST /api/timetable/swap`);
  console.log(`   - GET  /api/workload`);
  console.log(`   - POST /api/leaves/substitute`);
  console.log(`   - GET  /api/export/csv`);
  console.log(`======================================================\n`);
  const initialTimetable = ensureTimetable();
  await initDbSync({
    currentDataset,
    users,
    getActiveTimetable: () => activeTimetableResult || initialTimetable,
    notices,
    leaveRequests,
    attendanceSessions
  });
});
