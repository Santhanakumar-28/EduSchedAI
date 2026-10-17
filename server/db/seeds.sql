-- ====================================================================
-- EduSchedAI / Faculty Management System — PostgreSQL Normalized Seed Data
-- Credentials Password for demo users: EduSched@123
-- Bcrypt Hash ($2a$10$X8u76mH.D5b9L.pQk99YkeQeGk2B/47k1HqZk5yNq4E0/b43z9M.C or fallback)
-- ====================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, code, name, building, status) VALUES
('dept_cse_01', 'CSE', 'Computer Science & Engineering', 'Turing Block', 'Active'),
('dept_ece_01', 'ECE', 'Electronics & Communication Engineering', 'Babbage Block', 'Active'),
('dept_mech_01', 'MECH', 'Mechanical Engineering', 'Watt Block', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 2. USERS (Admin, HOD, Faculty, Coordinators, Students)
-- Default bcrypt hashed password for 'EduSched@123': $2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO
INSERT INTO users (id, name, email, username, password_hash, role, cadre, employee_code, roll_no, department_id, is_class_coordinator, target_hours, status) VALUES
-- Admin / HR
('user_admin_1', 'Dean / Admin Officer', 'admin@admin.college.edu', 'college_admin', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Admin', 'Staff', 'ADM001', NULL, NULL, FALSE, 0, 'Active'),

-- HOD of CSE
('user_hod_1', 'Dr. Rajesh Kumar', 'hod.cse@hod.college.edu', 'hod_rajesh', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'HOD', 'Professor', 'HOD_CSE_01', NULL, 'dept_cse_01', FALSE, 12, 'Active'),

-- Class Coordinator (Section A): Dr. Sunita Rao
('user_fac_2', 'Dr. Sunita Rao', 'sunita.rao@faculty.college.edu', 'sunita_rao', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Faculty', 'Professor', 'FAC_CSE_02', NULL, 'dept_cse_01', TRUE, 14, 'Active'),

-- Class Coordinator (Section B): Dr. Amitav Ghosh
('user_fac_3', 'Dr. Amitav Ghosh', 'amitav.ghosh@faculty.college.edu', 'amitav_ghosh', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Faculty', 'AssociateProf', 'FAC_CSE_03', NULL, 'dept_cse_01', TRUE, 16, 'Active'),

-- Regular Faculty: Dr. Priya Sharma
('user_fac_4', 'Dr. Priya Sharma', 'priya.sharma@faculty.college.edu', 'priya_sharma', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Faculty', 'AssistantProf', 'FAC_CSE_04', NULL, 'dept_cse_01', FALSE, 18, 'Active'),

-- Regular Faculty: Dr. Manish Verma
('user_fac_5', 'Dr. Manish Verma', 'manish.verma@faculty.college.edu', 'manish_verma', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Faculty', 'AssistantProf', 'FAC_CSE_05', NULL, 'dept_cse_01', FALSE, 18, 'Active'),

-- Regular Faculty: Prof. Vikram Malhotra
('user_fac_6', 'Prof. Vikram Malhotra', 'vikram.m@faculty.college.edu', 'vikram_m', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Faculty', 'AssociateProf', 'FAC_CSE_06', NULL, 'dept_cse_01', FALSE, 16, 'Active'),

-- Student 1 (Section A)
('user_std_1', 'Aarav Patel', '2026cse001@student.college.edu', 'aarav_csea', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Student', NULL, NULL, '2026CSE001', 'dept_cse_01', FALSE, 0, 'Active'),

-- Student 2 (Section A)
('user_std_2', 'Diya Sharma', '2026cse002@student.college.edu', 'diya_csea', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Student', NULL, NULL, '2026CSE002', 'dept_cse_01', FALSE, 0, 'Active'),

-- Student 3 (Section B)
('user_std_3', 'Rohan Mehra', '2026cse101@student.college.edu', 'rohan_cseb', '$2a$10$wN1QZJomJslpA6o86fF4..B4XqF41s3mK7nC6sN.tK.Z8y4o5r4qO', 'Student', NULL, NULL, '2026CSE101', 'dept_cse_01', FALSE, 0, 'Active')
ON CONFLICT (id) DO NOTHING;

-- Link HOD to Department
UPDATE departments SET hod_user_id = 'user_hod_1' WHERE id = 'dept_cse_01';

-- 3. CLASSES (Batches)
INSERT INTO classes (id, code, name, department_id, academic_year, semester, student_count) VALUES
('batch_1', 'CSE-4A', 'CSE Section A', 'dept_cse_01', '2026-2027', 4, 60),
('batch_2', 'CSE-4B', 'CSE Section B', 'dept_cse_01', '2026-2027', 4, 60)
ON CONFLICT (id) DO NOTHING;

-- 4. SUBJECTS
INSERT INTO subjects (id, code, name, department_id, credits, weekly_hours, is_lab) VALUES
('subj_1', 'CS401', 'Design and Analysis of Algorithms', 'dept_cse_01', 4, 4, FALSE),
('subj_2', 'CS402', 'Database Management Systems', 'dept_cse_01', 4, 4, FALSE),
('subj_3', 'CS403', 'Operating Systems', 'dept_cse_01', 4, 4, FALSE),
('subj_4', 'CS404', 'Computer Networks', 'dept_cse_01', 3, 3, FALSE),
('subj_5', 'CS405', 'Software Engineering', 'dept_cse_01', 3, 3, FALSE),
('subj_6', 'CS491', 'DBMS & Algorithms Lab', 'dept_cse_01', 2, 4, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. STUDENT ENROLLMENTS
INSERT INTO student_enrollments (id, student_id, class_id, status) VALUES
('enr_1', 'user_std_1', 'batch_1', 'Active'),
('enr_2', 'user_std_2', 'batch_1', 'Active'),
('enr_3', 'user_std_3', 'batch_2', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 6. COORDINATOR ASSIGNMENTS
INSERT INTO coordinator_assignments (id, faculty_id, class_id, assigned_by_hod_id, academic_year, is_active) VALUES
('coord_1', 'user_fac_2', 'batch_1', 'user_hod_1', '2026-2027', TRUE),
('coord_2', 'user_fac_3', 'batch_2', 'user_hod_1', '2026-2027', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. TIMETABLE SLOTS
INSERT INTO timetable_slots (id, class_id, subject_id, faculty_id, room_number, day_of_week, period_number, session_type, academic_year, is_active) VALUES
('slot_1', 'batch_1', 'subj_1', 'user_hod_1', 'CR-101', 'Monday', 1, 'Theory', '2026-2027', TRUE),
('slot_2', 'batch_1', 'subj_2', 'user_fac_2', 'CR-101', 'Monday', 2, 'Theory', '2026-2027', TRUE),
('slot_3', 'batch_1', 'subj_3', 'user_fac_4', 'CR-101', 'Monday', 3, 'Theory', '2026-2027', TRUE),
('slot_4', 'batch_1', 'subj_4', 'user_fac_6', 'CR-101', 'Monday', 5, 'Theory', '2026-2027', TRUE),
('slot_5', 'batch_1', 'subj_6', 'user_fac_5', 'Lab-1', 'Monday', 6, 'Lab', '2026-2027', TRUE),
('slot_6', 'batch_1', 'subj_6', 'user_fac_5', 'Lab-1', 'Monday', 7, 'Lab', '2026-2027', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. ATTENDANCE SESSIONS & RECORDS
INSERT INTO attendance_sessions (id, class_id, subject_id, session_date, day_of_week, period_number, scheduled_faculty_id, marked_by_faculty_id, is_substitution, total_students, present_count, absent_count, on_duty_count) VALUES
('att_sess_1', 'batch_1', 'subj_1', '2026-10-12', 'Monday', 1, 'user_hod_1', 'user_hod_1', FALSE, 2, 2, 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO attendance_records (id, session_id, student_id, status, remarks) VALUES
('att_rec_1', 'att_sess_1', 'user_std_1', 'Present', 'Attended lecture'),
('att_rec_2', 'att_sess_1', 'user_std_2', 'Present', 'Attended lecture')
ON CONFLICT (id) DO NOTHING;

-- 9. AUDIT LOGS
INSERT INTO audit_logs (id, user_id, user_email, user_role, action, entity, entity_id, ip_address, details) VALUES
('audit_1', 'user_admin_1', 'admin@admin.college.edu', 'Admin', 'SYSTEM_INITIALIZATION', 'System', 'col_sys_1', '127.0.0.1', '{"status": "PostgreSQL schema and seeds successfully initialized."}')
ON CONFLICT (id) DO NOTHING;
