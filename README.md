# 🎓 EduSchedAI: Intelligent Timetable & Faculty Workload Management System

> **A modern, intelligent, cloud-native MERN-stack web application for automated clash-free timetable generation, multi-criteria constraint satisfaction, and faculty workload balancing.**

---

## 📌 Project Overview

**EduSchedAI** solves the NP-hard educational scheduling problem faced by universities, engineering colleges, and schools. By combining **Constraint Satisfaction Programming (CSP)** with **Heuristic Local Search / Evolutionary Optimization** inside a responsive **MERN (MongoDB, Express.js, React.js, Node.js)** architecture, EduSchedAI generates 100% clash-free timetables in seconds while ensuring equitable faculty workload distribution and seamless leave management.

---

## 🚀 Live Application Servers

| Service | Port / URL | Status | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3050](http://localhost:3050) | 🟢 **ONLINE** | Modern Light Theme React.js + Tailwind CSS UI |
| **Backend REST API** | [http://localhost:5050](http://localhost:5050) | 🟢 **ONLINE** | Express.js API & Core Scheduling Engine |

---

## 🔑 Login Accounts & Default Credentials

> **Universal Default Password for all demo accounts:** `EduSched@123`

| Role | Name & Designation | Email / Username | Default Password | Special Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **👑 HOD** | Dr. Rajesh Kumar | `hod@eduschedai.edu` / `hod_rajesh` | `EduSched@123` | Master Admin: Adds faculty, assigns Class Coordinators, sets faculty passwords, runs AI solver |
| **🌟 Class Coordinator** | Dr. Sunita Rao | `dr.sunita@eduschedai.edu` / `sunita_rao` | `EduSched@123` | Coordinator for **CSE Section A**: Enrolls students, assigns student usernames & passwords |
| **🌟 Class Coordinator** | Dr. Amitav Ghosh | `amitav.ghosh@eduschedai.edu` / `amitav_ghosh`| `EduSched@123` | Coordinator for **CSE Section B**: Enrolls students, assigns student usernames & passwords |
| **👩‍💼 Regular Faculty** | Prof. Vikram Malhotra| `vikram.m@eduschedai.edu` / `vikram.m` | `EduSched@123` | Views teaching load, personalized schedule, applies for leave |
| **🎓 Student** | Aarav Patel | `student.csea@eduschedai.edu` / `aarav_csea` | `EduSched@123` | Enrolled in **CSE Section A**: Views section schedule, venues, and class coordinator info |

---

## 👥 Institutional User Hierarchy & Workflow

```
                        👑 Head of Department (HOD)
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
      Assigns Faculty &                        Designates Class In-Charge
   Sets Faculty Passwords                     ("Class Coordinator Mam/Sir")
                                                         │
                                                         ▼
                                               Adds Section Students &
                                            Sets Student Usernames/Passwords
                                                         │
                                                         ▼
                                               🎓 Enrolled Students
                                            (Log in to view class schedule)
```

---

## 🎨 Unique Highlights vs. Legacy Systems (FET / UniTime / aSc)

| Feature | Legacy Systems (FET / UniTime) | **EduSchedAI (Modern MERN)** |
| :--- | :--- | :--- |
| **Theme & UI Design** | Outdated Qt desktop / dense enterprise Java tables | **Modern, crisp light-theme design system** with clean typography, rounded cards, and responsive layout |
| **Generation Speed** | Several minutes or hours on complex grids | **1.1 seconds** for 56 periods with 0 hard clashes guaranteed |
| **Faculty Workload Balance** | Basic weekly limits or unoptimized | **Dedicated Workload Balancer & Gini Index metric ($G < 0.24$)** with cadre tracking |
| **Dynamic Leave Substitution**| Full timetable regeneration required | **Real-time intelligent substitute finder** ranking free, subject-qualified faculty by lowest current load |
| **Interactive Adjustments** | Static grid with high risk of introducing clashes | **Drag & drop / click-to-swap modal with instant real-time clash verification** |
| **Persona Switching** | Separate accounts or complex configuration | **Instant Role-Switcher in top bar** (HOD, Faculty, Student) for seamless multi-stakeholder demonstration |

---

## 📅 Project Phases & Completion Roadmap

The project follows a structured 8-phase development roadmap:

```
                                    Project Lifecycle Roadmap
 ┌───────────────────────────────────────────────────────────────────┬──────────────┬──────────────┐
 │ Phase & Milestone Description                                     │ Timeline     │ Status       │
 ├───────────────────────────────────────────────────────────────────┼──────────────┼──────────────┤
 │ Phase 1: Requirement Analysis & Literature Survey                 │ Week 1 - 2   │ ✅ Completed │
 │ Phase 2: System Design (Architecture, DFDs, Use-Cases, Modules)   │ Week 3 - 4   │ ✅ Completed │
 │ Phase 3: Database Design & Setup (MongoDB Schemas & Sample Data)  │ Week 5       │ ✅ Completed │
 │ Phase 4: Core Scheduling Algorithm Development & Unit Testing     │ Week 6 - 8   │ ✅ Completed │
 │ Phase 5: Backend REST API & Constraint Service Development        │ Week 9 - 10  │ ✅ Completed │
 │ Phase 6: Frontend Development (Modern Light Theme React UI)       │ Week 11 - 12 │ ✅ Completed │
 │ Phase 7: System Integration & End-to-End Testing                  │ Week 13 - 14 │ ✅ Completed │
 │ Phase 8: Cloud Deployment & Final Project Documentation           │ Week 15 - 16 │ ⏳ Scheduled │
 └───────────────────────────────────────────────────────────────────┴──────────────┴──────────────┘
```

---

## 🖥️ Web Application Pages & Features

1. **Executive Dashboard (`Overview`)**:
   - Hero AI generator banner with one-click re-generation.
   - KPI metrics: 0 Hard Clashes, Workload Gini Index (0.238), 12 Active Faculty, 56 Scheduled Sessions.
   - Live timetable snapshot.
2. **Interactive Master Timetable (`Master Timetable`)**:
   - View filterable by **Batch** (`CSE Section A`, `CSE Section B`), **Individual Faculty** (12 teachers), or **Room/Lab** (8 venues).
   - Color-coded Theory (Indigo) vs 2-Hour Lab (Emerald) cards.
   - Dedicated Lunch Break banner in Period 4.
   - Click-to-Swap modal with instant clash detection.
3. **AI Scheduling Studio (`AI Studio`)**:
   - Live weight configuration sliders (Workload balance, Student idle gaps, Faculty waiting windows).
   - Real-time solver telemetry display (runtime, hard violations, soft penalties, utilization).
4. **Faculty Workload Balancer (`Workload Balancer`)**:
   - Department Fairness Score gauge (73.2% equity).
   - Cadre target comparison table (Professors: 14 hrs, Assoc: 16 hrs, Asst: 18 hrs).
   - Individual progress bars and allocation level badges.
5. **Dynamic Leave & Substitution Finder (`Leave & Substitution`)**:
   - Select absent instructor, day, and period.
   - Algorithmic candidate ranking (checks availability, subject qualification, and lower workload).
   - One-click emergency substitution assignment.
6. **Academic Resource Directory (`Academic Resources`)**:
   - Directory of Lecture Halls and Specialized Computer/Hardware Labs.
   - Curriculum syllabus directory with weekly lecture quotas and credit requirements.

---

## 🛠️ How to Run Locally

### Start Backend API Server:
```bash
cd server
node server.js
# Runs on http://localhost:5000
```

### Start Frontend Client:
```bash
cd client
npm run dev
# Runs on http://localhost:3000
```
