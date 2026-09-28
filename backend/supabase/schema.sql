-- Supabase Schema for AttendX Hybrid Stack

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    face_embedding JSONB NOT NULL, -- 128-float array stored as JSON
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code TEXT UNIQUE NOT NULL, -- Static join code
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subject Enrollment Join Table
CREATE TABLE IF NOT EXISTS subject_students (
    subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (subject_id, student_id)
);

-- 5. Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_present BOOLEAN NOT NULL DEFAULT TRUE,
    method TEXT NOT NULL CHECK (method IN ('face', 'qr')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_subject_code ON subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_student ON attendance_logs(subject_id, student_id);
