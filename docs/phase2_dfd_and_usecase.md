# Phase 2: Data Flow Diagrams & Use-Case Modeling
**Project:** Intelligent Timetable and Faculty Workload Management System (EduSchedAI)  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Document Version:** 1.0.0  

---

## 1. UML Use-Case Model

The use-case model defines the interactions between the system and its primary human actors: **Super Admin**, **Department HOD / Timetable Coordinator**, **Faculty Member**, and **Student**.

```mermaid
graph LR
    subgraph Actors
        Admin(("👑 Super Admin"))
        HOD(("👨‍🏫 HOD / Coordinator"))
        Faculty(("👩‍💼 Faculty Member"))
        Student(("🎓 Student"))
    end

    subgraph EduSchedAI_System["EduSchedAI System Boundary"]
        UC1(["UC-1: Authenticate & Manage Roles"])
        UC2(["UC-2: Manage Academic Master Data\n(Depts, Batches, Rooms, Courses)"])
        UC3(["UC-3: Configure Constraints & Norms"])
        UC4(["UC-4: Submit Availability & Preferences"])
        UC5(["UC-5: Trigger Automated Timetable Generation"])
        UC6(["UC-6: Interactive Grid Editing & Slot Swap"])
        UC7(["UC-7: Validate Hard/Soft Clashes in Real-time"])
        UC8(["UC-8: View Workload Analytics & Gini Charts"])
        UC9(["UC-9: Apply for Leave"])
        UC10(["UC-10: Assign Automated Substitute Faculty"])
        UC11(["UC-11: View & Filter Timetables"])
        UC12(["UC-12: Export Timetable & Workload (PDF/XLSX)"])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC8
    Admin --> UC12

    HOD --> UC1
    HOD --> UC2
    HOD --> UC3
    HOD --> UC5
    HOD --> UC6
    HOD --> UC7
    HOD --> UC8
    HOD --> UC10
    HOD --> UC11
    HOD --> UC12

    Faculty --> UC1
    Faculty --> UC4
    Faculty --> UC9
    Faculty --> UC11
    Faculty --> UC12

    Student --> UC1
    Student --> UC11
    Student --> UC12

    UC5 -.->|<<include>>| UC7
    UC6 -.->|<<include>>| UC7
    UC9 -.->|<<extend>>| UC10
```

---

## 2. Data Flow Diagrams (DFD)

### 2.1 DFD Level 0: System Context Diagram

The Level 0 Context Diagram establishes the boundary between the EduSchedAI core system and external entities.

```mermaid
graph TD
    Admin_Entity["👑 Super Admin / Dean"]
    HOD_Entity["👨‍🏫 Timetable Coordinator / HOD"]
    Faculty_Entity["👩‍💼 Faculty Member"]
    Student_Entity["🎓 Student"]

    System(("0.0\nEduSchedAI\nSystem Engine"))

    Admin_Entity -->|Department policies, user roles, institutional norms| System
    System -->|Campus-wide utilization reports, workload compliance logs| Admin_Entity

    HOD_Entity -->|Curriculum, faculty assignments, room specs, constraint parameters| System
    HOD_Entity -->|Generation triggers, manual slot swap requests| System
    System -->|Generated master schedules, clash reports, substitution suggestions| HOD_Entity

    Faculty_Entity -->|Leave requests, blackout slots, preferred teaching times| System
    System -->|Personalized weekly schedule, substitution alerts| Faculty_Entity

    Student_Entity -->|Batch & semester selection queries| System
    System -->|Batch timetable, room announcements, teacher substitutions| Student_Entity
```

---

### 2.2 DFD Level 1: System Process Decomposition

The Level 1 DFD decomposes the system into 8 foundational data-processing modules.

```mermaid
graph TB
    subgraph External_Entities
        E_HOD["HOD / Coordinator"]
        E_Faculty["Faculty Member"]
        E_Student["Student"]
    end

    subgraph Processes["System Processes"]
        P1["1.0 Auth & Access Control"]
        P2["2.0 Academic Master Data Mgmt"]
        P3["3.0 Constraint & Preference Mgmt"]
        P4["4.0 Automated Scheduling Core"]
        P5["5.0 Interactive Grid & Manual Overrides"]
        P6["6.0 Workload Balancing & Analytics"]
        P7["7.0 Dynamic Leave & Substitution"]
        P8["8.0 Document Export & Reporting"]
    end

    subgraph Data_Stores[("MongoDB Data Stores")]
        D1[("D1: Users & Roles")]
        D2[("D2: Academic Master Store")]
        D3[("D3: Constraints & Preferences")]
        D4[("D4: Master Timetables")]
        D5[("D5: Workload & Audit Store")]
        D6[("D6: Leaves & Substitutions")]
    end

    %% Process 1
    E_HOD & E_Faculty & E_Student -->|Login Credentials| P1
    P1 <-->|Verify Tokens & Roles| D1
    P1 -->|Auth Session| E_HOD & E_Faculty & E_Student

    %% Process 2
    E_HOD -->|Depts, Rooms, Courses, Batches| P2
    P2 <-->|CRUD Operations| D2

    %% Process 3
    E_HOD -->|Global Hard/Soft Constraints| P3
    E_Faculty -->|Leave / Time Preferences| P3
    P3 <-->|Store / Retrieve Rules| D3

    %% Process 4
    E_HOD -->|Trigger Schedule Request| P4
    D2 & D3 -->|Fetch Academic Data & Rules| P4
    P4 -->|Store Clash-Free Master Schedule| D4
    P4 -->|Write Workload Metrics| D5
    P4 -->|Notify Completion| E_HOD

    %% Process 5
    E_HOD -->|Drag-and-Drop Slot Move| P5
    P5 <-->|Validate & Update Slot| D4
    P5 -->|Live Clash Feedback| E_HOD

    %% Process 6
    D4 & D5 -->|Query Workload Logs| P6
    P6 -->|Render Variance & Gini Metrics| E_HOD

    %% Process 7
    E_Faculty -->|Submit Leave Form| P7
    P7 <-->|Check Free Eligible Faculty| D4
    P7 <-->|Record Substitution| D6
    P7 -->|Substitution Suggestion| E_HOD
    P7 -->|Update Notification| E_Faculty

    %% Process 8
    E_HOD & E_Faculty & E_Student -->|Export Request| P8
    D4 & D5 -->|Retrieve Timetable Data| P8
    P8 -->|Stream PDF / Excel File| E_HOD & E_Faculty & E_Student
```

---

### 2.3 DFD Level 2: Core Scheduling Engine (Sub-process 4.0)

```mermaid
graph TD
    Trigger["Admin Schedule Trigger"] --> P4_1["4.1 Ingestion & Pre-sorting Engine\n(Sort items by constraint hardness: Labs > Multi-credit > Electives)"]
    P4_1 --> P4_2["4.2 Stage-1 Constructive CSP Solver\n(Assigns Lab Blocks & Theory Lectures with AC-3 / Forward Checking)"]
    P4_2 --> P4_3{"4.3 Clash Verification\nHard Violations H(X) == 0?"}
    
    P4_3 -- No (Deadlock) --> P4_4["4.4 Conflict-Directed Backtracker\n(Unassign conflicting slot and try next domain value)"]
    P4_4 --> P4_2

    P4_3 -- Yes (Feasible Grid) --> P4_5["4.5 Stage-2 Workload & Soft Penalty Optimizer\n(Genetic Algorithm / Simulated Annealing Local Search)"]
    P4_5 --> P4_6["4.6 Compute Workload Fairness & Gini Coefficient"]
    P4_6 --> P4_7["4.7 Persist Versioned Snapshot to MongoDB (D4)"]
    P4_7 --> Output["Return Master Timetable Payload"]
```

---

## 3. UML Sequence Diagrams

### 3.1 Automated Timetable Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as 👨‍🏫 Timetable Coordinator
    participant UI as 🖥️ React Client
    participant API as 🔒 Express API Gateway
    participant Engine as 🧠 Core Scheduling Engine
    participant DB as 💾 MongoDB Database

    Coordinator->>UI: Click "Generate Timetable" (Select Dept, Sem)
    UI->>API: POST /api/timetable/generate { departmentId, semester, academicYear }
    API->>API: Authenticate JWT & Validate HOD Role
    API->>DB: Query Batches, Faculty, Rooms, Courses & Constraints
    DB-->>API: Return Academic Configuration Dataset
    API->>Engine: Initialize Worker & Pass Dataset
    activate Engine
    Engine->>Engine: Stage 1: Constructive CSP (Place Labs & Theory clash-free)
    Engine->>Engine: Stage 2: Genetic Search (Minimize Workload Variance & Gaps)
    Engine->>Engine: Calculate Final Metrics (Fitness, Gini Index, Utilization %)
    Engine-->>API: Return Optimized Master Schedule Array
    deactivate Engine
    API->>DB: Save Master Timetable Document & Version Snapshot
    DB-->>API: Confirm Save (ID: tt_2026_cse_sem4)
    API-->>UI: 200 OK { schedule, metrics, clashCount: 0 }
    UI-->>Coordinator: Render Interactive Grid & Workload Charts
```

---

### 3.2 Dynamic Leave & Automated Substitution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Faculty as 👩‍💼 Faculty Member (Applicant)
    actor HOD as 👨‍🏫 HOD / Coordinator
    participant UI as 🖥️ React Client
    participant API as 🔒 Express API Gateway
    participant LeaveEngine as ⚡ Leave & Substitution Service
    participant DB as 💾 MongoDB Database

    Faculty->>UI: Submit Leave Application (Date: 2026-10-05, Periods: 2, 3)
    UI->>API: POST /api/leaves/apply { facultyId, date, slotIndices, reason }
    API->>DB: Save Leave Record (Status: 'Pending')
    API->>LeaveEngine: Find Eligible Substitutes(departmentId, date, slotIndices, subject)
    activate LeaveEngine
    LeaveEngine->>DB: Query Faculty Schedule on Date at Slot 2, 3
    DB-->>LeaveEngine: Return List of Free Faculty with Matching Specialization
    LeaveEngine->>LeaveEngine: Score Substitutes by Current Workload (Favor Lower Loaded)
    LeaveEngine-->>API: Ranked Candidate List: [Prof. Sharma (12h), Prof. Verma (14h)]
    deactivate LeaveEngine
    API->>DB: Update Leave with Recommended Substitutes
    API-->>UI: 201 Created (Leave submitted, candidates found)
    
    HOD->>UI: Open Leave Approval Portal
    UI->>API: GET /api/leaves/pending
    API-->>UI: Return Pending Leaves + Recommended Substitutes
    HOD->>UI: Select Substitute (Prof. Sharma) & Click "Approve & Swap"
    UI->>API: POST /api/leaves/approve-substitute { leaveId, substituteFacultyId }
    API->>DB: Update Schedule Slot & Set Leave Status: 'Approved'
    API-->>UI: 200 OK (Schedule Updated)
    UI-->>HOD: Display Updated Timetable & Send In-App Notifications
```

---

### 3.3 Drag-and-Drop Slot Move with Real-time Clash Validation

```mermaid
sequenceDiagram
    autonumber
    actor HOD as 👨‍🏫 Timetable Coordinator
    participant UI as 🖥️ React Client
    participant Validator as 🛡️ Client/Server Constraint Validator
    participant DB as 💾 MongoDB Database

    HOD->>UI: Drag "Operating Systems" from (Mon, Period 2) to (Wed, Period 4)
    UI->>Validator: Check Hard Constraints for Target Slot (Wed, Period 4)
    alt Clash Detected (e.g. Room Occupied or Faculty Teaching elsewhere)
        Validator-->>UI: ❌ Violation: Faculty Dr. Rao already booked in Room 102
        UI-->>HOD: Display Red Warning Modal & Revert Drag Animation
    else No Clash (Valid Move)
        Validator-->>UI: ✅ Valid Move (0 Clashes)
        UI->>DB: PUT /api/timetable/:id/slots/swap { sourceSlot, targetSlot }
        DB-->>UI: 200 OK (Slot updated)
        UI-->>HOD: Render Updated Grid & Recalculate Live Metrics
    end
```
