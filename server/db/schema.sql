-- ====================================================================
-- EduSchedAI / Faculty Management System — PostgreSQL Normalized Schema
-- Standard: PostgreSQL 14+ compatible
-- Normalized 3NF / BCNF relational architecture
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    building VARCHAR(100) NOT NULL,
    hod_user_id VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS TABLE (Unified institutional identities with server RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Admin', 'HOD', 'Faculty', 'Student')),
    cadre VARCHAR(50) NULL CHECK (cadre IN ('Professor', 'AssociateProf', 'AssistantProf', 'Lecturer', 'Staff', NULL)),
    employee_code VARCHAR(50) UNIQUE NULL,
    roll_no VARCHAR(50) UNIQUE NULL,
    department_id VARCHAR(50) NULL REFERENCES departments(id) ON DELETE SET NULL,
    is_class_coordinator BOOLEAN NOT NULL DEFAULT FALSE,
    target_hours INT NOT NULL DEFAULT 16,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key for Department HOD
ALTER TABLE departments
    DROP CONSTRAINT IF EXISTS fk_department_hod;
ALTER TABLE departments
    ADD CONSTRAINT fk_department_hod FOREIGN KEY (hod_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. CLASSES TABLE (Batches / Cohorts / Sections)
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    student_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    credits INT NOT NULL DEFAULT 3,
    weekly_hours INT NOT NULL DEFAULT 4,
    is_lab BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. STUDENT ENROLLMENTS TABLE (Students assigned to classes)
CREATE TABLE IF NOT EXISTS student_enrollments (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Dropped')),
    CONSTRAINT uq_student_class_enrollment UNIQUE (student_id, class_id)
);

-- 7. COORDINATOR ASSIGNMENTS TABLE (Faculty designated as Class Coordinators)
CREATE TABLE IF NOT EXISTS coordinator_assignments (
    id VARCHAR(50) PRIMARY KEY,
    faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_by_hod_id VARCHAR(50) NOT NULL REFERENCES users(id),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_active_coordinator UNIQUE (class_id, is_active)
);

-- 8. FACULTY SUBJECT ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS faculty_subject_assignments (
    id VARCHAR(50) PRIMARY KEY,
    faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_subject_class UNIQUE (faculty_id, subject_id, class_id)
);

-- 9. TIMETABLE SLOTS TABLE (Active clash-free master schedule)
CREATE TABLE IF NOT EXISTS timetable_slots (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    room_number VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 10),
    session_type VARCHAR(20) NOT NULL DEFAULT 'Theory' CHECK (session_type IN ('Theory', 'Lab', 'Tutorial', 'Break')),
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_slot_schedule UNIQUE (class_id, day_of_week, period_number)
);

-- 10. LEAVE REQUESTS TABLE (Multi-tier leave pipeline)
CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    applicant_user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('Faculty', 'Student', 'HOD')),
    department_id VARCHAR(50) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NULL REFERENCES classes(id) ON DELETE SET NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    affected_day VARCHAR(20) NULL,
    affected_period INT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Clarification Requested')),
    reviewed_by_user_id VARCHAR(50) NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by_role VARCHAR(30) NULL,
    review_comment TEXT NULL,
    acting_hod_user_id VARCHAR(50) NULL REFERENCES users(id) ON DELETE SET NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMPTZ NULL
);

-- 11. SUBSTITUTE ALLOCATIONS TABLE (Faculty period coverage)
CREATE TABLE IF NOT EXISTS substitute_allocations (
    id VARCHAR(50) PRIMARY KEY,
    leave_request_id VARCHAR(50) NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    original_faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    substitute_faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    slot_date DATE NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    period_number INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    allocated_by_hod_id VARCHAR(50) NOT NULL REFERENCES users(id),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_substitute_faculty_period UNIQUE (substitute_faculty_id, slot_date, period_number)
);

-- 12. ATTENDANCE SESSIONS TABLE (Class period attendance header)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id VARCHAR(50) NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    period_number INT NOT NULL,
    scheduled_faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    marked_by_faculty_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_substitution BOOLEAN NOT NULL DEFAULT FALSE,
    substitute_allocation_id VARCHAR(50) NULL REFERENCES substitute_allocations(id) ON DELETE SET NULL,
    total_students INT NOT NULL DEFAULT 0,
    present_count INT NOT NULL DEFAULT 0,
    absent_count INT NOT NULL DEFAULT 0,
    on_duty_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_date_period_session UNIQUE (class_id, session_date, period_number)
);

-- 13. ATTENDANCE RECORDS TABLE (Individual student attendance entries)
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'On-Duty')),
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_student_record UNIQUE (session_id, student_id)
);

-- 14. NOTIFICATIONS TABLE (Targeted alerts for users)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Leave', 'Substitution', 'Attendance', 'Notice', 'System')),
    related_entity_id VARCHAR(50) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. AUDIT LOGS TABLE (Comprehensive security & governance audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NULL REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(150) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL,
    ip_address VARCHAR(50) NULL,
    details JSONB NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_dept ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_slots(class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_faculty ON timetable_slots(faculty_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_sessions(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance_sessions(marked_by_faculty_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_applicant ON leave_requests(applicant_user_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_dept ON leave_requests(department_id, status);
CREATE INDEX IF NOT EXISTS idx_substitute_date ON substitute_allocations(slot_date, substitute_faculty_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
