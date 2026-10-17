const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eduschedai_jwt_super_secret_key_2026';
const HOD_REGISTRATION_AUTH_KEY = process.env.HOD_REGISTRATION_AUTH_KEY || 'SRM_HOD_2026';

/**
 * Generate a signed JWT for an authenticated user
 */
function generateToken(user) {
  const payload = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cadre: user.cadre || null,
    departmentId: user.role === 'Admin' ? null : (user.departmentId || 'dept_cse_01'),
    facultyId: user.facultyId || null,
    isClassCoordinator: !!user.isClassCoordinator,
    coordinatedBatchId: user.coordinatedBatchId || null,
    batchId: user.batchId || null,
    rollNo: user.rollNo || null
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Institutional Email Pattern Validation
 * Supported conventions:
 *   - HOD: e.g., sk@hod.srm.in, hod@eduschedai.edu, hod.cse@srm.in
 *   - Faculty: e.g., dr.sunita@eduschedai.edu, sunita@faculty.srm.in
 *   - Student: e.g., 2026cse001@student.srm.in, student.csea@eduschedai.edu, aarav@student.srm.in
 */
function validateInstitutionalEmail(email, expectedRole = null) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, detectedRole: null, error: 'Email is required' };
  }

  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, detectedRole: null, error: 'Invalid email format' };
  }

  const [localPart, domainPart] = clean.split('@');

  let detectedRole = null;

  // 1. Admin / HR check: admin domain/subdomain or admin in local part
  if (
    domainPart === 'admin.college.edu' ||
    domainPart.includes('admin.') ||
    domainPart.startsWith('admin.') ||
    localPart.startsWith('admin') ||
    localPart.includes('.admin') ||
    localPart === 'admin' ||
    localPart === 'dean'
  ) {
    detectedRole = 'Admin';
  }
  // 2. HOD check: hod domain / subdomain OR hod in local part
  else if (
    domainPart === 'hod.college.edu' ||
    domainPart.includes('hod.') ||
    domainPart.startsWith('hod.') ||
    domainPart.endsWith('.hod.srm.in') ||
    domainPart === 'hod.srm.in' ||
    localPart.startsWith('hod') ||
    localPart.includes('.hod') ||
    localPart === 'hod'
  ) {
    detectedRole = 'HOD';
  }
  // 3. Faculty check: faculty domain/subdomain or institutional edu
  else if (
    domainPart === 'faculty.college.edu' ||
    domainPart.includes('faculty.') ||
    domainPart === 'faculty.srm.in' ||
    localPart.startsWith('dr.') ||
    localPart.startsWith('prof.') ||
    (clean.includes('eduschedai.edu') && !clean.includes('student'))
  ) {
    detectedRole = 'Faculty';
  }
  // 4. Student check: student domain/subdomain or roll number / student in local part
  else if (
    domainPart === 'student.college.edu' ||
    domainPart.includes('student.') ||
    domainPart === 'student.srm.in' ||
    localPart.startsWith('student.') ||
    /^[0-9]{4}[a-z]+[0-9]+$/i.test(localPart) || // e.g. 2026cse001
    clean.includes('student')
  ) {
    detectedRole = 'Student';
  } else {
    // Default institutional fallback if using official domains
    if (domainPart.endsWith('college.edu') || domainPart.endsWith('srm.in') || domainPart.endsWith('eduschedai.edu')) {
      detectedRole = 'Faculty'; // General institutional domain default
    } else {
      return {
        isValid: false,
        detectedRole: null,
        error: `Email domain '${domainPart}' does not match institutional formats (@admin.college.edu, @hod.college.edu, @faculty.college.edu, @student.college.edu).`
      };
    }
  }

  // If an expected role is supplied, verify consistency
  if (expectedRole && detectedRole) {
    const normExpected = expectedRole.toLowerCase();
    const normDetected = detectedRole.toLowerCase();

    // Faculty role can also be Class Coordinator
    const isFacultyCoord = (normExpected.includes('coordinator') || normExpected.includes('faculty')) && normDetected === 'faculty';

    if (normExpected !== normDetected && !isFacultyCoord) {
      return {
        isValid: false,
        detectedRole,
        error: `Email format '${clean}' is designated for '${detectedRole}' but requested for role '${expectedRole}'.`
      };
    }
  }

  return { isValid: true, detectedRole, cleanEmail: clean };
}

/**
 * In-Memory Rate Limiter for Authentication & Sensitive Endpoints
 */
const rateLimitMap = new Map();

function createRateLimiter(options = { windowMs: 60000, maxRequests: 20 }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const key = `${ip}_${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + options.windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.windowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(key, record);

    if (record.count > options.maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication requests. Please wait a minute before retrying.'
      });
    }

    next();
  };
}

/**
 * Middleware: Verify JWT and attach req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token = null;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Legacy pseudo-token fallback for seamless transition during active sessions
    if (token.startsWith('jwt_token_edusched_')) {
      const parts = token.split('_');
      const userId = parts.slice(3, -1).join('_');
      // If server users store is available via req.app
      const usersStore = req.app.get('usersStore') || [];
      const found = usersStore.find(u => String(u.id) === String(userId) || String(u._id) === String(userId));
      if (found) {
        req.user = {
          id: found.id || found._id,
          name: found.name,
          email: found.email,
          role: found.role,
          cadre: found.cadre || null,
          departmentId: found.role === 'Admin' ? null : (found.departmentId || 'dept_cse_01'),
          facultyId: found.facultyId || null,
          isClassCoordinator: !!found.isClassCoordinator,
          coordinatedBatchId: found.coordinatedBatchId || null,
          batchId: found.batchId || null,
          rollNo: found.rollNo || null
        };
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.'
    });
  }
}

/**
 * Optional Authentication: Attaches req.user if a valid token is provided, but does not block if not
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!authHeader) return next();

  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    // ignore
  }
  next();
}

/**
 * Middleware: Require one of the specified roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    // Admin has superuser privileges
    if (userRole === 'Admin') {
      return next();
    }

    const matches = allowedRoles.some(r => r.toLowerCase() === userRole.toLowerCase());
    if (!matches) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${userRole}' is not authorized to access this resource. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}

/**
 * Middleware: Require Department Scope
 * Prevents an HOD or Faculty from viewing or modifying records belonging to another department
 */
function requireDepartmentScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admin can access all departments
  if (req.user.role === 'Admin') return next();

  const userDept = req.user.departmentId || 'dept_cse_01';
  const targetDept = req.params.departmentId || req.query.departmentId || req.body.departmentId;

  if (targetDept && String(targetDept) !== String(userDept)) {
    return res.status(403).json({
      success: false,
      message: `Access denied: You do not have permission to access records for department '${targetDept}'.`
    });
  }

  next();
}

/**
 * Middleware: Require Class Coordinator Scope
 * Enforces that only the designated Class Coordinator for the specific batch/section (or HOD/Admin) can manage students
 */
function requireCoordinatorScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // HOD and Admin have full department-level authority
  if (req.user.role === 'HOD' || req.user.role === 'Admin') {
    return next();
  }

  // Faculty must be designated coordinator
  if (req.user.role === 'Faculty') {
    if (!req.user.isClassCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only designated Class Coordinators can perform this operation.'
      });
    }

    const targetBatchId = req.params.batchId || req.query.batchId || req.body.batchId;
    if (targetBatchId && String(req.user.coordinatedBatchId) !== String(targetBatchId)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You are only authorized to manage your assigned section (Batch ID: ${req.user.coordinatedBatchId}).`
      });
    }

    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Students are not authorized for this action.'
  });
}

module.exports = {
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
};
