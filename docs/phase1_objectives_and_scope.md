# Phase 1: Finalized Objectives & Scope Specification
**Project:** Intelligent Timetable and Faculty Workload Management System (EduSchedAI)  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Document Version:** 1.0.0  

---

## 1. Project Vision

To build a high-performance, intelligent, cloud-ready web application using the **MERN stack (MongoDB, Express.js, React.js, Node.js)** that automates the generation of clash-free educational timetables, optimally balances faculty workloads, supports dynamic schedule reconfigurations, and provides institutional analytics for higher education administrators, faculty, and students.

---

## 2. Project Objectives (SMART Framework)

```
                            EduSchedAI SMART Objectives
 ┌──────────────────────┬─────────────────────────────────────────────────────────────┐
 │ Specific             │ Automate multi-department course timetabling and faculty    │
 │                      │ workload balancing with zero hard constraint clashes.       │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Measurable           │ • 100% clash-free schedules (H=0).                          │
 │                      │ • Workload variance across faculty reduced by > 80%.        │
 │                      │ • Timetable generation time < 30 seconds for 500+ slots.    │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Achievable           │ Achieved using a two-stage Hybrid CSP & Heuristic Optimizer │
 │                      │ executed asynchronously within Node.js.                     │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Relevant             │ Directly solves institutional administrative overhead,      │
 │                      │ faculty burnout, and regulatory compliance (UGC/AICTE).     │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Time-bound           │ Structured execution across an 8-phase project lifecycle.   │
 └──────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 2.1 Primary Objectives
1. **Zero-Clash Automated Timetabling:** Develop a constraint satisfaction engine in Node.js that mathematically guarantees zero room overlaps, zero instructor double-bookings, and zero student section collisions.
2. **Equitable Faculty Workload Allocation:** Implement automated workload calculations and optimization algorithms that balance weekly teaching credit hours across faculty cadres according to institutional policy.
3. **Interactive & Responsive MERN Interface:** Build an intuitive React frontend with interactive weekly calendar grids, batch filters, drag-and-drop slot adjustments, and instant clash detection feedback.

### 2.2 Secondary Objectives
1. **Dynamic Leave & Substitution Manager:** Provide intelligent recommendations for substitute faculty when an instructor applies for emergency leave, minimizing class cancellations.
2. **Comprehensive Export & Reporting:** Enable single-click exports of generated timetables and workload distribution sheets into PDF, Excel (XLSX), and JSON formats.
3. **Role-Based Access Control (RBAC):** Secure the application with JWT authentication, segregating administrative privilege (Admin/HOD) from faculty and student viewing rights.

---

## 3. Project Scope

```
                                  EduSchedAI Scope Boundary
        ┌────────────────────────────────────┬────────────────────────────────────┐
        │              IN-SCOPE              │            OUT-OF-SCOPE            │
        ├────────────────────────────────────┼────────────────────────────────────┤
        │ • Multi-Department & Multi-Batch   │ • Hardware biometric attendance    │
        │ • Theory, Lab, & Tutorial sessions │ • Cross-city GPS bus tracking      │
        │ • Faculty availability & leave mgmt│ • Fee processing & payroll payouts │
        │ • Hybrid heuristic solver engine   │ • Automated exam proctoring AI     │
        │ • Workload balancing & analytics   │                                    │
        │ • Interactive React calendar views │ (Clean API integration hooks       │
        │ • PDF/Excel export modules         │  provided for future ERP syncing)  │
        │ • MongoDB BSON schema storage      │                                    │
        └────────────────────────────────────┴────────────────────────────────────┘
```

### 3.1 In-Scope Capabilities
- **Academic Hierarchy Management:** Institutions, Departments, Academic Semesters, Sections/Batches.
- **Resource Profiling:**
  - **Faculty:** Teaching qualifications, Cadre (Professor, Associate, Assistant), max weekly hours, unavailable slots, preferred slots.
  - **Courses/Subjects:** Theory vs Lab vs Tutorial, weekly hours, required room type, equipment dependencies.
  - **Rooms/Laboratories:** Capacity, specialized lab types, building/floor identifiers.
- **Core Engine:**
  - Constraint satisfaction and greedy heuristic generator in Node.js.
  - Multi-objective fitness score evaluation.
  - Faculty workload variance minimization.
- **Dynamic Administrative Overrides:** Drag-and-drop calendar UI with instant validation against hard constraints.
- **Reporting & Compliance:** Workload distribution reports, room utilization percentage metrics, student batch master timetables.

### 3.2 Out-of-Scope (Boundaries for MVP & v1.0)
- Physical biometric fingerprint/facial recognition turnstile integration.
- Institution financial payroll disbursement calculation (EduSchedAI provides the validated workload hours which can be exported to payroll).
- Real-time university bus route optimization.

---

## 4. Stakeholder & Persona Analysis

| Persona | Role | Primary Use Cases & Needs |
| :--- | :--- | :--- |
| **Institutional Admin / Dean** | Executive Oversight | View campus-wide room utilization, departmental workload parity, approve master semester schedules. |
| **Timetable Coordinator / HOD** | Operational Scheduler | Input departmental subjects, assign faculty, configure constraints, trigger algorithm, review/edit generated grids, handle leaves. |
| **Faculty Member** | Instructor | View personalized weekly teaching timetable, submit availability/preferred slots, request leave & view assigned substitutes. |
| **Student** | Learner | Access batch-specific weekly schedule, track lecture venues, view announced room changes/substitutions in real-time. |

---

## 5. Functional Requirements Specification (FRS)

### 5.1 Module 1: Academic Data & Resource Management
- **FR-1.1:** The system shall allow administrators to create, read, update, and delete (CRUD) Faculty profiles, including cadre, department, max workload, and subject proficiencies.
- **FR-1.2:** The system shall allow administrators to define Subjects with weekly lecture hours, lab durations, and room type prerequisites.
- **FR-1.3:** The system shall allow administrators to configure Classrooms and Laboratories with seating capacity and physical equipment tags.
- **FR-1.4:** The system shall allow defining Student Batches, Sections, and elective group mappings.

### 5.2 Module 2: Constraint & Workload Configuration
- **FR-2.1:** The system shall support setting hard operational constraints (working days, periods per day, lunch break periods).
- **FR-2.2:** The system shall allow faculty to submit blackout time slots (unavailability) and preferred teaching windows.
- **FR-2.3:** The system shall enforce institutional workload norms per faculty cadre (e.g., 14 hrs/week for Professors, 18 hrs/week for Assistant Professors).

### 5.3 Module 3: Intelligent Scheduling Engine
- **FR-3.1:** The system shall execute an automated scheduling algorithm to assign faculty, rooms, and time slots for all courses without hard clashes.
- **FR-3.2:** The system shall guarantee consecutive allocation for multi-period practical laboratory sessions.
- **FR-3.3:** The system shall compute and minimize the workload variance across faculty members in the department.
- **FR-3.4:** The system shall output generation metrics: execution time, hard constraint violations (target: 0), and soft constraint satisfaction percentage.

### 5.4 Module 4: Interactive Timetable UI & Manual Adjustment
- **FR-4.1:** The system shall display generated timetables in interactive grid views filterable by Batch, Faculty, and Classroom.
- **FR-4.2:** The system shall allow authorized coordinators to drag-and-drop or swap periods with real-time clash warning alerts.
- **FR-4.3:** The system shall support publishing and versioning of approved timetables.

### 5.5 Module 5: Dynamic Leave & Rescheduling Module
- **FR-5.1:** The system shall allow faculty to log leave requests for specific days/periods.
- **FR-5.2:** The system shall analyze faculty availability and recommend free, subject-qualified substitute instructors.

### 5.6 Module 6: Export, Reporting & Analytics
- **FR-6.1:** The system shall generate printable, formatted PDF timetables for any batch, faculty, or room.
- **FR-6.2:** The system shall export workload summary reports and schedule sheets to Excel (XLSX) format.
- **FR-6.3:** The system shall render visual dashboard analytics for room utilization and faculty workload distribution.

---

## 6. Non-Functional Requirements (NFR)

```
                            Non-Functional Requirement Pillars
 ┌──────────────────────┬─────────────────────────────────────────────────────────────┐
 │ Performance          │ • Timetable generation for a department in < 30 seconds.    │
 │                      │ • API response time for view/read requests < 200 ms.        │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Scalability          │ • Capable of managing 20+ departments, 500+ faculty, and    │
 │                      │   10,000+ students concurrently on MongoDB.                 │
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Security & Auth      │ • Password hashing using bcrypt with salt rounds >= 10.     │
 │                      │ • Stateless JWT token authentication with role-based guards.│
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Reliability          │ • 99.9% uptime with transactional integrity in MongoDB.     │
 │                      │ • Zero data corruption during manual drag-and-drop overrides│
 ├──────────────────────┼─────────────────────────────────────────────────────────────┤
 │ Usability            │ • Clean, responsive UI built in React & Tailwind CSS.       │
 │                      │ • Color-coded timetable cells for intuitive visual parsing. │
 └──────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 7. Technology Stack Matrix

| Tier | Technology | Rationale & Selection Criteria |
| :--- | :--- | :--- |
| **Frontend** | **React.js (v18+)** + **Tailwind CSS** + **Lucide Icons** | High-speed component rendering, reactive calendar grids, lightweight state management, modular UI. |
| **Backend API** | **Node.js** + **Express.js** | Non-blocking asynchronous I/O, rapid JSON REST API endpoints, efficient execution of JavaScript heuristic algorithms. |
| **Database** | **MongoDB** + **Mongoose ODM** | Native JSON/BSON document model perfectly matches nested timetable grids, constraint sets, and versioned schedule snapshots. |
| **Auth & Security** | **JSON Web Tokens (JWT)** + **bcryptjs** | Secure, stateless authentication with Role-Based Access Control (Admin, Coordinator, Faculty, Student). |
| **Export Engines** | **PDFKit / jsPDF** + **SheetJS (xlsx)** | Native client/server export generation for clean PDF tables and Excel worksheets. |
| **Scheduling Core** | **Custom Hybrid CSP + Genetic/Heuristic Solver (Node.js)** | Fully integrated within the backend without requiring heavy external non-JavaScript runtime dependencies. |
