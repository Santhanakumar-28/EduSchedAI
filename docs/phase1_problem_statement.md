# Phase 1: Problem Statement & Mathematical Formulation
**Project:** Intelligent Timetable and Faculty Workload Management System (EduSchedAI)  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Document Version:** 1.0.0  

---

## 1. Executive Summary & Problem Context

Educational institutions (universities, colleges, and polytechnics) face severe operational and administrative bottlenecks during semester preparation. Timetable creation and faculty workload distribution involve orchestrating hundreds of course modules, laboratory practicals, student batches, faculty specializations, and physical infrastructure across finite weekly time slots.

Manual approaches consume hundreds of administrative hours, produce frequent room and faculty clashes, cause extreme faculty workload disparities (leading to burnout and faculty attrition), and lack resilience against dynamic real-world disruptions (such as faculty sick leave, sudden batch splits, or classroom unavailability).

---

## 2. Mathematical Formulation of the Scheduling Problem

The Timetable and Faculty Workload Problem is formalized as a multi-constrained combinatorial mapping:

### 2.1 Set Definitions

Let the institutional scheduling domain be defined by the tuple $\mathcal{U} = (\mathcal{F}, \mathcal{S}, \mathcal{B}, \mathcal{R}, \mathcal{D}, \mathcal{T})$ where:
- $\mathcal{F} = \{f_1, f_2, \dots, f_m\}$ is the set of $m$ **Faculty members / Instructors**.
- $\mathcal{S} = \{s_1, s_2, \dots, s_k\}$ is the set of $k$ **Subjects / Courses** (with attributes: type $\in \{\text{Theory}, \text{Lab}, \text{Tutorial}\}$, weekly lecture count $L(s)$, lab block duration $D(s)$).
- $\mathcal{B} = \{b_1, b_2, \dots, b_n\}$ is the set of $n$ **Student Batches / Sections** (with student strength $N(b)$).
- $\mathcal{R} = \{r_1, r_2, \dots, f_p\}$ is the set of $p$ **Rooms / Classrooms / Laboratories** (with capacity $C(r)$ and room type $T(r) \in \{\text{LectureHall}, \text{ComputerLab}, \text{HardwareLab}, \text{SeminarHall}\}$).
- $\mathcal{D} = \{\text{Monday}, \text{Tuesday}, \dots, \text{Saturday}\}$ is the set of active teaching days in a week.
- $\mathcal{T} = \{t_1, t_2, \dots, t_q\}$ is the set of $q$ daily time slots (periods) per day.

The complete discrete time-space grid is defined as:
\[
\mathcal{P} = \mathcal{D} \times \mathcal{T} \quad \text{where } |\mathcal{P}| = |\mathcal{D}| \times |\mathcal{T}|
\]

### 2.2 Decision Variable

Let $X_{f, s, b, r, d, t} \in \{0, 1\}$ be the binary decision variable defined as:
\[
X_{f, s, b, r, d, t} = 
\begin{cases} 
1 & \text{if faculty } f \text{ teaches subject } s \text{ to batch } b \text{ in room } r \text{ on day } d \text{ at slot } t \\
0 & \text{otherwise}
\end{cases}
\]

---

## 3. Constraint Taxonomy

Constraints in **EduSchedAI** are strictly categorized into **Hard Constraints** (mandatory physical invariants) and **Soft Constraints** (pedagogical and workload optimization preferences).

```
                            EduSchedAI Constraint Model
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
 ╔══════════════════════════════════╗              ╔══════════════════════════════════╗
 ║         HARD CONSTRAINTS         ║              ║         SOFT CONSTRAINTS         ║
 ║      (Zero Tolerance: H(X)=0)    ║              ║      (Penalty Minimization)      ║
 ╠══════════════════════════════════╣              ╠══════════════════════════════════╣
 ║ H1: No Faculty Double-Booking    ║              ║ S1: Faculty Workload Balancing   ║
 ║ H2: No Batch Double-Booking      ║              ║ S2: Minimize Student Idle Gaps   ║
 ║ H3: No Room Double-Booking       ║              ║ S3: Minimize Faculty Idle Gaps   ║
 ║ H4: Room Capacity Feasibility    ║              ║ S4: Honor Faculty Slot Prefs     ║
 ║ H5: Room Type / Lab Suitability  ║              ║ S5: Max Consecutive Hours Limit  ║
 ║ H6: Contiguous Multi-Period Labs ║              ║ S6: Even Weekly Distribution     ║
 ║ H7: Exact Weekly Subject Credits ║              ║ S7: Optimal Time for Heavy Subs  ║
 ║ H8: Faculty Availability/Leave   ║              ╚══════════════════════════════════╝
 ╚══════════════════════════════════╝
```

### 3.1 Hard Constraints (Inviolable Physics)

1. **H1 (No Faculty Clash):** A faculty member $f$ can be assigned to at most one session in any given time slot $(d, t)$:
   \[
   \forall f \in \mathcal{F}, \forall d \in \mathcal{D}, \forall t \in \mathcal{T}: \quad \sum_{s \in \mathcal{S}} \sum_{b \in \mathcal{B}} \sum_{r \in \mathcal{R}} X_{f, s, b, r, d, t} \le 1
   \]

2. **H2 (No Student Batch Clash):** A student batch $b$ can attend at most one class in any given time slot $(d, t)$:
   \[
   \forall b \in \mathcal{B}, \forall d \in \mathcal{D}, \forall t \in \mathcal{T}: \quad \sum_{f \in \mathcal{F}} \sum_{s \in \mathcal{S}} \sum_{r \in \mathcal{R}} X_{f, s, b, r, d, t} \le 1
   \]

3. **H3 (No Room Collision):** A room or laboratory $r$ can host at most one class session at any given time slot $(d, t)$:
   \[
   \forall r \in \mathcal{R}, \forall d \in \mathcal{D}, \forall t \in \mathcal{T}: \quad \sum_{f \in \mathcal{F}} \sum_{s \in \mathcal{S}} \sum_{b \in \mathcal{B}} X_{f, s, b, r, d, t} \le 1
   \]

4. **H4 (Room Capacity Compliance):** The capacity of room $r$ must be greater than or equal to the student strength of batch $b$:
   \[
   X_{f, s, b, r, d, t} = 1 \implies C(r) \ge N(b)
   \]

5. **H5 (Laboratory Resource Compatibility):** A practical/lab course requiring specific laboratory equipment must only be assigned to a room $r$ where $T(r) = \text{RequiredLabType}(s)$.

6. **H6 (Contiguous Laboratory Blocks):** If subject $s$ has a multi-hour laboratory requirement ($D(s) = k$ hours), the $k$ slots must be allocated consecutively on the same day in the same room by the same instructor without interruption.

7. **H7 (Exact Weekly Subject Quota Satisfaction):** The total weekly hours assigned to subject $s$ for batch $b$ must exactly match the prescribed syllabus curriculum $L(s)$:
   \[
   \forall s \in \mathcal{S}, \forall b \in \mathcal{B}: \quad \sum_{f \in \mathcal{F}} \sum_{r \in \mathcal{R}} \sum_{d \in \mathcal{D}} \sum_{t \in \mathcal{T}} X_{f, s, b, r, d, t} = L(s)
   \]

8. **H8 (Faculty Pre-declared Unavailability / Approved Leave):** If faculty $f$ is marked unavailable on day $d$ at slot $t$, no session may be scheduled for $f$:
   \[
   (d, t) \in \text{Unavailable}(f) \implies \sum_{s \in \mathcal{S}} \sum_{b \in \mathcal{B}} \sum_{r \in \mathcal{R}} X_{f, s, b, r, d, t} = 0
   \]

---

### 3.2 Soft Constraints (Optimization Objectives)

1. **S1 (Faculty Workload Fairness & Variance Minimization):** Distribute weekly teaching loads across faculty members proportionally according to their designated designation/target load (e.g., Professors: 14 hrs, Associate Profs: 16 hrs, Assistant Profs: 18 hrs).
2. **S2 (Minimizing Student Idle Windows):** Avoid non-contiguous breaks (e.g., free slots between period 2 and period 4) in the student batch timetable.
3. **S3 (Minimizing Faculty Idle Windows):** Prevent long fragmented gaps between teaching periods on any single day for faculty members.
4. **S4 (Faculty Preferred Slot Alignment):** Favor assigning faculty members to their preferred time windows (e.g., morning research hours or afternoon slots).
5. **S5 (Maximum Consecutive Teaching Hours Cap):** Restrict consecutive lectures for any faculty member to a maximum of $\le 2$ or 3 continuous hours to avoid vocal strain and cognitive fatigue.
6. **S6 (Even Subject Spread):** Distribute multi-hour theoretical subjects evenly across different days rather than cramming multiple sessions into a single day.
7. **S7 (Optimal Scheduling for Difficult Core Subjects):** Place high-complexity subjects (Mathematics, Algorithms, Mechanics) in morning prime hours ($t \in [1, 3]$) rather than post-lunch hours.

---

## 4. Faculty Workload Mathematical Modeling

### 4.1 Faculty Workload Definition
For each faculty member $f_i \in \mathcal{F}$, their actual assigned weekly teaching load $W(f_i)$ in hours is:
\[
W(f_i) = \sum_{s \in \mathcal{S}} \sum_{b \in \mathcal{B}} \sum_{r \in \mathcal{R}} \sum_{d \in \mathcal{D}} \sum_{t \in \mathcal{T}} X_{f_i, s, b, r, d, t} \times \text{Weight}(s)
\]
*(where $\text{Weight}(s)$ accounts for theory credit vs lab credit multipliers, e.g., 1 hr theory = 1.0 workload unit, 2 hr lab = 1.0 or 1.5 workload units).*

### 4.2 Workload Balance Metric: Variance & Gini Coefficient
To prevent workload skew across $m$ faculty members with target workloads $W_{\text{target}}(f_i)$:
1. **Workload Variance ($\sigma_W^2$):**
   \[
   \sigma_W^2 = \frac{1}{m} \sum_{i=1}^{m} \left( \frac{W(f_i) - W_{\text{target}}(f_i)}{W_{\text{target}}(f_i)} \right)^2
   \]
2. **Gini Coefficient of Workload Inequality ($G$):**
   \[
   G = \frac{\sum_{i=1}^m \sum_{j=1}^m |W(f_i) - W(f_j)|}{2 m \sum_{i=1}^m W(f_i)}
   \]
   An ideal balanced department achieves $G \to 0$ and $\sigma_W^2 \to 0$.

---

## 5. Multi-Objective Global Optimization Fitness Function

The global objective of the scheduling engine is to find a configuration $X^*$ that minimizes the total cost function $Z(X)$:

\[
\min_{X} Z(X) = \lambda_H \cdot \sum_{k=1}^{8} \text{Penalty}(H_k(X)) + \sum_{j=1}^{7} w_j \cdot \text{Penalty}(S_j(X)) + \gamma \cdot \sigma_W^2(X)
\]

Where:
- $\lambda_H \gg 10^6$ is an overwhelming penalty multiplier ensuring that **no solution with a hard constraint violation is deemed acceptable**.
- $w_j \in [1, 100]$ are user-tunable administrative weights for soft constraints.
- $\gamma$ is the workload balancing penalty factor.

---

## 6. Real-World Operational Gaps Solved by EduSchedAI

| Operational Bottleneck | Manual Method | **EduSchedAI Solution** |
| :--- | :--- | :--- |
| **Preparation Turnaround** | 10 to 20 working days | **< 30 seconds automated generation** |
| **Conflict Rate** | 15–25% initial overlaps requiring manual patches | **0% hard constraint violations guaranteed** |
| **Faculty Load Disparity** | Often > 40% variance across instructors | **< 5% variance via algorithmic load balancing** |
| **Faculty Leave Substitution** | Scrambled phone calls and emergency free periods | **Automated recommendation of eligible substitute faculty** |
| **Audit & Accreditation Compliance** | Manual spreadsheet compilation for AICTE/UGC/NBA | **Instant automated workload and room utilization reports** |
| **Distribution & Sharing** | Printed paper notices & static PDFs | **Dynamic role-based web portal with export to XLSX & PDF** |
