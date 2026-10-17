/**
 * Automated Verification Test Suite for Faculty Management System
 * Tests all 15 workflow audit requirements against the live server.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5050';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 FACULTY MANAGEMENT SYSTEM - ACCEPTANCE TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} -> ${detail}`);
      failed++;
    }
  }

  // 1. Health & Server Status
  try {
    const res = await request({ path: '/api/health' });
    assert(res.status === 200 && res.data.status === 'ok', '1. System Health API Online');
  } catch (err) {
    assert(false, '1. System Health API Online', err.message);
  }

  // 2. Authentication - Reject invalid / non-institutional email
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'attacker@random-spam.xyz', password: 'password123' }
    );
    assert(
      res.status === 400 && res.data.message.includes('does not match'),
      '2. Login rejects non-institutional email pattern'
    );
  } catch (err) {
    assert(false, '2. Login rejects non-institutional email pattern', err.message);
  }

  // 3. Authentication - Role spoofing prevention (backend role derivation)
  try {
    // Attempt to log in as student while supplying role: 'HOD' in payload
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'student.csea@eduschedai.edu', password: 'EduSched@123', role: 'HOD' }
    );
    assert(
      res.status === 200 && res.data.user.role === 'Student',
      '3. Backend ignores frontend role and enforces DB role (Student stays Student)'
    );
  } catch (err) {
    assert(false, '3. Backend ignores frontend role and enforces DB role', err.message);
  }

  // 4. Authentication - HOD Login returns signed JWT
  let hodToken = null;
  let hodUser = null;
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'hod@eduschedai.edu', password: 'EduSched@123' }
    );
    hodToken = res.data.token;
    hodUser = res.data.user;
    assert(
      res.status === 200 && hodUser.role === 'HOD' && hodToken && hodToken.startsWith('ey'),
      '4. HOD Login successfully returns valid signed JWT token'
    );
  } catch (err) {
    assert(false, '4. HOD Login successfully returns valid signed JWT token', err.message);
  }

  // 5. Authentication - Faculty Class Coordinator Login
  let coordToken = null;
  let coordUser = null;
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'dr.sunita@eduschedai.edu', password: 'EduSched@123' }
    );
    coordToken = res.data.token;
    coordUser = res.data.user;
    assert(
      res.status === 200 &&
        coordUser.role === 'Faculty' &&
        coordUser.isClassCoordinator === true &&
        coordUser.coordinatedBatchId === 'batch_1',
      '5. Class Coordinator Login returns faculty profile with coordinated batch scope'
    );
  } catch (err) {
    assert(false, '5. Class Coordinator Login', err.message);
  }

  // 6. Authentication - Regular Faculty Login (Non-Coordinator)
  let regularFacultyToken = null;
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'vikram.m@eduschedai.edu', password: 'EduSched@123' }
    );
    regularFacultyToken = res.data.token;
    assert(
      res.status === 200 && res.data.user.isClassCoordinator === false,
      '6. Regular Faculty Login verifies non-coordinator status'
    );
  } catch (err) {
    assert(false, '6. Regular Faculty Login', err.message);
  }

  // 7. Authentication - Student Login
  let studentToken = null;
  let studentUser = null;
  try {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { usernameOrEmail: 'student.csea@eduschedai.edu', password: 'EduSched@123' }
    );
    studentToken = res.data.token;
    studentUser = res.data.user;
    assert(
      res.status === 200 && studentUser.role === 'Student' && studentUser.batchId === 'batch_1',
      '7. Student Login returns personal student profile and enrolled batch'
    );
  } catch (err) {
    assert(false, '7. Student Login', err.message);
  }

  // 8. HOD Self-Registration - Rejection of unauthorized registration
  try {
    const res = await request(
      { path: '/api/auth/register-hod', method: 'POST' },
      {
        name: 'Imposter Head',
        email: 'fake@hod.srm.in',
        department: 'dept_cse_01',
        password: 'password123',
        authorizationCode: 'WRONG_CODE_999'
      }
    );
    assert(
      res.status === 403 && res.data.message.includes('Institutional verification failed'),
      '8. Unauthorized HOD registration rejected without valid authorization key'
    );
  } catch (err) {
    assert(false, '8. Unauthorized HOD registration rejected', err.message);
  }

  // 9. HOD Self-Registration - Rejection of non-HOD email pattern
  try {
    const res = await request(
      { path: '/api/auth/register-hod', method: 'POST' },
      {
        name: 'Regular Person',
        email: 'regular@gmail.com',
        department: 'dept_cse_01',
        password: 'password123',
        authorizationCode: 'SRM_HOD_2026'
      }
    );
    assert(
      res.status === 400 && res.data.message.includes('Institutional validation error'),
      '9. HOD registration rejected if email does not match HOD pattern (*@hod.srm.in)'
    );
  } catch (err) {
    assert(false, '9. HOD registration rejected for non-HOD email', err.message);
  }

  // 10. HOD Self-Registration - Authorized Registration Success
  const testHodEmail = `prof.kumar_${Date.now()}@hod.srm.in`;
  try {
    const res = await request(
      { path: '/api/auth/register-hod', method: 'POST' },
      {
        name: 'Dr. Kumar Test HOD',
        email: testHodEmail,
        department: 'dept_cse_01',
        password: 'SecureHOD@2026',
        authorizationCode: 'SRM_HOD_2026'
      }
    );
    assert(
      res.status === 201 && res.data.success === true,
      '10. Authorized HOD self-registration succeeds with institutional authorization code'
    );
  } catch (err) {
    assert(false, '10. Authorized HOD registration', err.message);
  }

  // 11. HOD Self-Registration - Duplicate Prevention
  try {
    const res = await request(
      { path: '/api/auth/register-hod', method: 'POST' },
      {
        name: 'Duplicate HOD',
        email: testHodEmail,
        department: 'dept_cse_01',
        password: 'SecureHOD@2026',
        authorizationCode: 'SRM_HOD_2026'
      }
    );
    assert(
      res.status === 400 && res.data.message.includes('already registered'),
      '11. Duplicate HOD registration prevented for same institutional email'
    );
  } catch (err) {
    assert(false, '11. Duplicate HOD registration prevented', err.message);
  }

  // 12. Faculty Account Creation - Direct API Protection
  try {
    // Unauthenticated request
    const unauthRes = await request(
      { path: '/api/faculty/add', method: 'POST' },
      { name: 'Dr. Test', email: 'test@faculty.srm.in', employeeCode: 'FAC_TEST_99' }
    );
    // Student trying to create faculty
    const studentRes = await request(
      { path: '/api/faculty/add', method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
      { name: 'Dr. Test', email: 'test@faculty.srm.in', employeeCode: 'FAC_TEST_99' }
    );
    assert(
      unauthRes.status === 401 && studentRes.status === 403,
      '12. Direct API rejects unauthenticated and non-HOD attempts to create faculty'
    );
  } catch (err) {
    assert(false, '12. Direct API rejects unauthorized faculty creation', err.message);
  }

  // 13. HOD Creates Faculty Member
  const testFacCode = `FAC_CSE_${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const res = await request(
      { path: '/api/faculty/add', method: 'POST', headers: { Authorization: `Bearer ${hodToken}` } },
      {
        name: 'Dr. Ananya Ray',
        email: `ananya.${testFacCode.toLowerCase()}@faculty.srm.in`,
        employeeCode: testFacCode,
        cadre: 'AssociateProf',
        targetHours: 16,
        specializations: ['Cloud Computing', 'Networks'],
        password: 'EduSched@123'
      }
    );
    assert(
      res.status === 201 && res.data.success === true && res.data.credentials.username,
      '13. HOD successfully adds faculty member with auto-generated credentials'
    );
  } catch (err) {
    assert(false, '13. HOD adds faculty member', err.message);
  }

  // 14. Student Account Creation - Only Coordinator for Assigned Section Can Add
  const testRoll = `2026CSE${Math.floor(200 + Math.random() * 700)}`;
  try {
    // Regular faculty tries to add student -> rejected (403)
    const regRes = await request(
      { path: '/api/students/add', method: 'POST', headers: { Authorization: `Bearer ${regularFacultyToken}` } },
      { name: 'New Student', rollNo: testRoll, batchId: 'batch_1' }
    );
    // Coordinator for batch_1 tries to add student to batch_2 -> rejected (403)
    const wrongBatchRes = await request(
      { path: '/api/students/add', method: 'POST', headers: { Authorization: `Bearer ${coordToken}` } },
      { name: 'New Student', rollNo: testRoll, batchId: 'batch_2' }
    );
    // Coordinator for batch_1 adds student to batch_1 -> approved (201)
    const successRes = await request(
      { path: '/api/students/add', method: 'POST', headers: { Authorization: `Bearer ${coordToken}` } },
      { name: 'Kavya Nair', rollNo: testRoll, batchId: 'batch_1', password: 'EduSched@123' }
    );
    assert(
      regRes.status === 403 && wrongBatchRes.status === 403 && successRes.status === 201,
      '14. Student enrollment strictly restricted to assigned Class Coordinator'
    );
  } catch (err) {
    assert(false, '14. Student enrollment scope', err.message);
  }

  // 15. Student Roster Scope - Regular faculty cannot access; Coordinator scoped to assigned class
  try {
    const regRes = await request(
      { path: '/api/students', headers: { Authorization: `Bearer ${regularFacultyToken}` } }
    );
    const coordRes = await request(
      { path: '/api/students', headers: { Authorization: `Bearer ${coordToken}` } }
    );
    const allInBatch1 = coordRes.data.data.every((s) => s.batchId === 'batch_1');
    assert(
      regRes.status === 403 && coordRes.status === 200 && allInBatch1,
      '15. Student roster access enforced: regular faculty blocked (403), coordinator sees only their class'
    );
  } catch (err) {
    assert(false, '15. Student roster scope', err.message);
  }

  // 16. Multi-Tier Leave Request - Faculty submits to HOD; Anti-self-approval enforced
  try {
    // Faculty applies for leave
    const applyRes = await request(
      { path: '/api/leaves/apply', method: 'POST', headers: { Authorization: `Bearer ${coordToken}` } },
      {
        day: 'Monday',
        period: 2,
        date: '2026-10-12',
        subjectName: 'Distributed Systems',
        reason: 'Attending University Syndicate Committee'
      }
    );
    const newLeaveId = applyRes.data.data.id;

    // Faculty tries to self-approve their own leave -> rejected (403 or 400)
    const selfApproveRes = await request(
      { path: '/api/leaves/decide', method: 'POST', headers: { Authorization: `Bearer ${coordToken}` } },
      { leaveId: newLeaveId, decision: 'Approved' }
    );

    // HOD approves faculty leave -> success (200)
    const hodApproveRes = await request(
      { path: '/api/leaves/decide', method: 'POST', headers: { Authorization: `Bearer ${hodToken}` } },
      {
        leaveId: newLeaveId,
        decision: 'Approved',
        substituteFacultyId: 'fac_5',
        reviewComment: 'Approved with substitute coverage verified.'
      }
    );

    assert(
      applyRes.status === 201 &&
        (selfApproveRes.status === 403 || selfApproveRes.status === 400) &&
        hodApproveRes.status === 200 &&
        hodApproveRes.data.data.status === 'Approved',
      '16. Faculty leave submitted to HOD with anti-self-approval rule enforced'
    );
  } catch (err) {
    assert(false, '16. Faculty leave workflow', err.message);
  }

  // 17. Multi-Tier Leave Request - Student submits to Class Coordinator
  try {
    const studentApplyRes = await request(
      { path: '/api/leaves/apply', method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
      {
        startDate: '2026-10-14',
        endDate: '2026-10-15',
        leaveType: 'Medical',
        reason: 'Recovering from viral fever under medical observation'
      }
    );
    const stdLeaveId = studentApplyRes.data.data.id;

    // Coordinator reviews and approves student leave
    const coordReviewRes = await request(
      { path: '/api/leaves/decide', method: 'POST', headers: { Authorization: `Bearer ${coordToken}` } },
      {
        leaveId: stdLeaveId,
        decision: 'Approved',
        reviewComment: 'Medical certificate accepted. Approved.'
      }
    );

    assert(
      studentApplyRes.status === 201 &&
        coordReviewRes.status === 200 &&
        coordReviewRes.data.data.status === 'Approved' &&
        coordReviewRes.data.data.reviewedByRole === 'Class Coordinator',
      '17. Student leave routed to and approved by designated Class Coordinator'
    );
  } catch (err) {
    assert(false, '17. Student leave workflow', err.message);
  }

  // 18. Notice Board - Role-based audience filtering strictly enforced
  try {
    // 1. HOD posts a Faculty-Only notice
    const createRes = await request(
      { path: '/api/notices/create', method: 'POST', headers: { Authorization: `Bearer ${hodToken}` } },
      {
        title: 'Confidential Faculty Cadre Promotion Meeting',
        category: 'General',
        priority: 'High',
        targetAudience: 'Faculty',
        content: 'Agenda: UGC 7th pay scale promotion review.'
      }
    );
    const confidentialNoticeId = createRes.data.data.id;

    // 2. Student fetches notices -> Must NOT contain the confidential faculty notice
    const studentNoticesRes = await request(
      { path: '/api/notices', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const hasConfidentialNotice = studentNoticesRes.data.data.some(
      (n) => n.id === confidentialNoticeId || n.targetAudience === 'Faculty'
    );

    // 3. Student tries to publish a notice -> rejected (403)
    const studentPostRes = await request(
      { path: '/api/notices/create', method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } },
      { title: 'Student Post', content: 'Unauthorized broadcast' }
    );

    assert(
      createRes.status === 201 && !hasConfidentialNotice && studentPostRes.status === 403,
      '18. Notice board filters out Faculty-only notices from students and blocks student posting'
    );
  } catch (err) {
    assert(false, '18. Notice board role-based filtering', err.message);
  }

  // 19. Core Timetable & Workload Algorithm Preservation
  try {
    const timetableRes = await request({ path: '/api/timetable/current' });
    const workloadRes = await request({ path: '/api/workload' });
    const hardViolations = timetableRes.data.data?.metrics?.hardViolations;
    const scheduleCount = timetableRes.data.data?.schedule?.length;
    const hasGini = workloadRes.data.data?.giniIndex !== undefined;

    assert(
      timetableRes.status === 200 &&
        scheduleCount === 60 &&
        hardViolations === 0 &&
        hasGini,
      '19. Core CSP Timetable Engine preserved (60 slots, 0 hard clashes, valid Gini index)'
    );
  } catch (err) {
    assert(false, '19. Core Timetable Algorithm Preservation', err.message);
  }

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
