# Phase 2: Module Specifications & REST API Contract
**Project:** Intelligent Timetable and Faculty Workload Management System (EduSchedAI)  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Document Version:** 1.0.0  

---

## 1. Core Module Specifications

EduSchedAI is architected into 7 modular, decoupled subsystems with well-defined interface contracts.

```
                            EduSchedAI Module Ecosystem
 ┌──────────────────────────────────────┬──────────────────────────────────────┐
 │ Module Name                          │ Core Responsibilities                │
 ├──────────────────────────────────────┼──────────────────────────────────────┤
 │ 1. Auth & Access Control Module      │ User registration, JWT tokens, RBAC. │
 │ 2. Academic Master Data Module       │ CRUD for Depts, Faculty, Rooms, Labs,│
 │                                      │ Courses, and Student Batches.        │
 │ 3. Constraint Management Engine      │ Hard/soft rules, working days, slots,│
 │                                      │ faculty blackout periods.            │
 │ 4. Intelligent Scheduling Engine     │ Stage-1 CSP + Stage-2 GA optimizer.  │
 │ 5. Workload Balancer & Analytics     │ Credit tracking, Gini index, charts. │
 │ 6. Dynamic Rescheduling & Leaves     │ Leave logging & candidate ranking.   │
 │ 7. Export & Document Dispatch        │ PDFKit & SheetJS (XLSX) streaming.   │
 └──────────────────────────────────────┴──────────────────────────────────────┘
```

---

### Module 1: Auth & Access Control Module
- **Purpose:** Manages authentication, password encryption, session lifecycle, and role permissions.
- **Key Functions / Classes:**
  - `registerUser(name, email, password, role, departmentId)`
  - `loginUser(email, password)`
  - `verifyJwtToken(token)`
  - `authorizeRoles(...allowedRoles)`

### Module 2: Academic Master Data Module
- **Purpose:** Handles domain entity persistence, relationships, and validation.
- **Key Entities:**
  - `Department`: Department code, name, HOD reference.
  - `Faculty`: Name, email, cadre (Prof, AssocProf, AsstProf), max weekly hours, department.
  - `Room`: Room number, building, capacity, type (`LectureHall`, `ComputerLab`, `ElectronicsLab`, `SeminarHall`).
  - `Subject`: Subject code, name, type (`Theory`, `Lab`), weekly hours, lab duration, preferred room type.
  - `Batch`: Batch code (e.g., `CSE-A-2026`), semester, strength, department.

### Module 3: Constraint Management Engine
- **Purpose:** Encapsulates rules and operational boundaries for timetable compilation.
- **Key Functions:**
  - `validateAcademicConstraints(config)`
  - `getFacultyAvailabilityMask(facultyId)`
  - `checkSlotClash(slotCandidate, existingSchedule)`

### Module 4: Intelligent Scheduling Core
- **Purpose:** Executes the two-stage hybrid CSP + Genetic heuristic solver.
- **Key Functions / Classes:**
  - `class ScheduleSolver(departmentData, constraints)`
  - `solveStage1CSP()`: Forward checking + Arc Consistency AC-3 for clash-free seed generation.
  - `optimizeStage2Genetic(populationSize, maxGenerations)`: Multi-objective fitness optimization.
  - `calculateScheduleFitness(chromosome)`: Returns penalty score and violation count.

### Module 5: Workload Balancer & Analytics Engine
- **Purpose:** Quantifies, audits, and visualizes teaching workload equity.
- **Key Metrics Computed:**
  - Total assigned hours vs Target hours per faculty member.
  - Departmental Workload Standard Deviation: $\sigma_W$.
  - Gini Index of Workload Inequality: $G \in [0, 1]$.
  - Room Utilization Rate (%): $\frac{\text{Occupied Slots}}{\text{Total Available Slots}} \times 100$.

### Module 6: Dynamic Rescheduling & Leave Substitution
- **Purpose:** Handles real-time schedule adaptations when faculty are on leave.
- **Key Functions:**
  - `submitLeaveRequest(facultyId, date, slotIndices, reason)`
  - `findEligibleSubstitutes(departmentId, date, slotIndex, subjectId)`: Filters non-busy faculty, ranks them by lower cumulative weekly workload, and returns sorted candidate list.
  - `approveAndSwapSubstitute(leaveId, substituteFacultyId)`: Atomic schedule mutation.

### Module 7: Export & Reporting Engine
- **Purpose:** Converts schedule documents into formatted printable artifacts.
- **Key Functions:**
  - `generateTimetablePDF(scheduleId, filterType, filterId)`: Streams styled PDF grid using PDFKit.
  - `exportTimetableToExcel(scheduleId)`: Streams multi-sheet XLSX file using SheetJS.

---

## 2. RESTful API Contract Specification

All endpoints communicate using JSON payloads and adhere to standard HTTP status codes.

### 2.1 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public / Admin | Register a new user account. |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT Bearer token. |
| `GET` | `/api/auth/profile` | Authenticated | Retrieve current user profile and role details. |

```json
// POST /api/auth/login - Request
{
  "email": "hod.cse@institution.edu",
  "password": "SecurePassword123!"
}

// Response: 200 OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Dr. Rajesh Kumar",
    "email": "hod.cse@institution.edu",
    "role": "HOD",
    "department": "Computer Science & Engineering"
  }
}
```

---

### 2.2 Academic Master Data Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | Authenticated | List all academic departments. |
| `POST` | `/api/departments` | Super Admin | Create new department. |
| `GET` | `/api/faculty?departmentId={id}` | Authenticated | List faculty members in department. |
| `POST` | `/api/faculty` | Admin / HOD | Create new faculty profile with target hours. |
| `PUT` | `/api/faculty/:id` | Admin / HOD | Update faculty details or availability. |
| `GET` | `/api/rooms?departmentId={id}` | Authenticated | List lecture halls and laboratories. |
| `POST` | `/api/rooms` | Admin / HOD | Create a room/lab with capacity & equipment. |
| `GET` | `/api/subjects?departmentId={id}`| Authenticated | List department curriculum subjects. |
| `POST` | `/api/subjects` | Admin / HOD | Add subject (Theory/Lab, credits, room type).|
| `GET` | `/api/batches?departmentId={id}` | Authenticated | List student sections/batches. |
| `POST` | `/api/batches` | Admin / HOD | Create student batch with strength. |

```json
// POST /api/subjects - Request
{
  "code": "CS401",
  "name": "Database Management Systems",
  "departmentId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "type": "Theory",
  "weeklyLectures": 4,
  "preferredRoomType": "LectureHall",
  "assignedFaculty": ["64f1a2b3c4d5e6f7a8b9c0d2"]
}
```

---

### 2.3 Intelligent Timetable Generation Endpoints (`/api/timetable`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/timetable/generate` | Admin / HOD | Trigger asynchronous clash-free generation engine. |
| `GET` | `/api/timetable/:id` | Authenticated | Fetch full master timetable by ID with metrics. |
| `GET` | `/api/timetable?departmentId={id}&semester={sem}` | Authenticated | Query active approved timetables. |
| `PUT` | `/api/timetable/:id/slots/swap` | Admin / HOD | Swap/move slots with real-time clash verification. |
| `POST` | `/api/timetable/:id/publish` | Admin / HOD | Set timetable status to active/published. |

```json
// POST /api/timetable/generate - Request
{
  "departmentId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "semester": 4,
  "academicYear": "2026-2027",
  "config": {
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "periodsPerDay": 7,
    "lunchBreakPeriod": 4,
    "maxGenerations": 1000,
    "workloadBalanceWeight": 80
  }
}

// Response: 200 OK
{
  "success": true,
  "timetableId": "64f1a2b3c4d5e6f7a8b9c0e5",
  "status": "Generated",
  "metrics": {
    "executionTimeMs": 1420,
    "hardViolations": 0,
    "softPenaltyScore": 12,
    "workloadGiniIndex": 0.042,
    "roomUtilizationPercent": 78.5
  },
  "schedule": [
    {
      "day": "Monday",
      "period": 1,
      "batchId": "64f1a2b3c4d5e6f7a8b9c0b1",
      "subjectId": "CS401",
      "facultyId": "64f1a2b3c4d5e6f7a8b9c0d2",
      "roomId": "LH-101",
      "type": "Theory"
    }
  ]
}
```

---

### 2.4 Workload Analytics Endpoints (`/api/workload`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/workload/department/:id` | Admin / HOD | Retrieve aggregated department workload metrics. |
| `GET` | `/api/workload/faculty/:id` | Authenticated | Retrieve individual faculty workload breakdown. |

```json
// GET /api/workload/department/64f1a2b3c4d5e6f7a8b9c0d1 - Response: 200 OK
{
  "success": true,
  "department": "Computer Science & Engineering",
  "giniIndex": 0.042,
  "averageHours": 15.6,
  "standardDeviation": 0.82,
  "facultyStats": [
    {
      "facultyId": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Dr. Sunita Rao",
      "cadre": "Professor",
      "targetHours": 14,
      "assignedHours": 14,
      "variance": 0.0,
      "subjectsAssigned": ["CS401", "CS602"]
    }
  ]
}
```

---

### 2.5 Dynamic Leave & Substitution Endpoints (`/api/leaves`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leaves/apply` | Faculty | Apply for leave specifying date and period slots. |
| `GET` | `/api/leaves/pending` | Admin / HOD | List pending leave requests with substitute suggestions. |
| `POST` | `/api/leaves/approve-substitute`| Admin / HOD | Approve leave and reassign session to substitute. |

---

### 2.6 Export Endpoints (`/api/export`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/export/timetable/:id/pdf` | Authenticated | Stream formatted PDF grid timetable document. |
| `GET` | `/api/export/timetable/:id/xlsx` | Authenticated | Stream multi-tab Excel workbook with schedule & workloads. |
