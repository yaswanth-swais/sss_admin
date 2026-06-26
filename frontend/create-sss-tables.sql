-- Standard Audit Fields (for all tables)
-- created_datetime, created_user_id, created_ip_address, modified_datetime, modified_user_id, modified_ip_address, record_status, version_no

-- 1. SCHOOL MASTER TABLE
CREATE TABLE IF NOT EXISTS school_master (
    school_id BIGSERIAL PRIMARY KEY,
    school_name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    contact_person VARCHAR(150),
    mobile_no VARCHAR(20),
    email_id VARCHAR(150),
    created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user_id VARCHAR(50),
    created_ip_address VARCHAR(50),
    modified_datetime TIMESTAMP,
    modified_user_id VARCHAR(50),
    modified_ip_address VARCHAR(50),
    record_status VARCHAR(20) DEFAULT 'Active',
    version_no INTEGER DEFAULT 1
);

-- 2. CLASS MASTER TABLE
CREATE TABLE IF NOT EXISTS class_master (
    class_id BIGSERIAL PRIMARY KEY,
    school_id BIGINT REFERENCES school_master(school_id),
    class_name VARCHAR(50) NOT NULL,
    section_name VARCHAR(20),
    academic_year VARCHAR(20),
    class_teacher_id BIGINT,
    created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user_id VARCHAR(50),
    created_ip_address VARCHAR(50),
    modified_datetime TIMESTAMP,
    modified_user_id VARCHAR(50),
    modified_ip_address VARCHAR(50),
    record_status VARCHAR(20) DEFAULT 'Active',
    version_no INTEGER DEFAULT 1
);

-- 3. STUDENT MASTER TABLE
CREATE TABLE IF NOT EXISTS student_master (
    student_id BIGSERIAL PRIMARY KEY,
    admission_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    class_id BIGINT REFERENCES class_master(class_id),
    section VARCHAR(20),
    roll_no VARCHAR(20),
    parent_name VARCHAR(150) NOT NULL,
    mobile_no VARCHAR(20),
    email_id VARCHAR(150),
    created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user_id VARCHAR(50),
    created_ip_address VARCHAR(50),
    modified_datetime TIMESTAMP,
    modified_user_id VARCHAR(50),
    modified_ip_address VARCHAR(50),
    record_status VARCHAR(20) DEFAULT 'Active',
    version_no INTEGER DEFAULT 1
);

-- 4. TEACHER MASTER TABLE
CREATE TABLE IF NOT EXISTS teacher_master (
    teacher_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    subject_name VARCHAR(150),
    class_id BIGINT REFERENCES class_master(class_id),
    section VARCHAR(20),
    role VARCHAR(50) DEFAULT 'teacher',
    email_id VARCHAR(150),
    mobile_no VARCHAR(20),
    created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user_id VARCHAR(50),
    created_ip_address VARCHAR(50),
    modified_datetime TIMESTAMP,
    modified_user_id VARCHAR(50),
    modified_ip_address VARCHAR(50),
    record_status VARCHAR(20) DEFAULT 'Active',
    version_no INTEGER DEFAULT 1
);

-- 5. NOTICE BOARD TABLE
CREATE TABLE IF NOT EXISTS notice_board (
    notice_id BIGSERIAL PRIMARY KEY,
    notice_title VARCHAR(200) NOT NULL,
    notice_text TEXT NOT NULL,
    notice_date DATE DEFAULT CURRENT_DATE,
    applicable_to VARCHAR(50),
    posted_by BIGINT,
    created_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_user_id VARCHAR(50),
    created_ip_address VARCHAR(50),
    modified_datetime TIMESTAMP,
    modified_user_id VARCHAR(50),
    modified_ip_address VARCHAR(50),
    record_status VARCHAR(20) DEFAULT 'Active',
    version_no INTEGER DEFAULT 1
);

-- Insert default school record for SSS
INSERT INTO school_master (school_name, city, state, contact_person, email_id, record_status)
SELECT 'SSS School', 'Hyderabad', 'Telangana', 'Headmaster', 'sss@ssschool.com', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM school_master LIMIT 1);

-- Insert sample classes
INSERT INTO class_master (school_id, class_name, section_name, academic_year, record_status)
SELECT 1, '10', 'A', '2026-27', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM class_master WHERE class_name='10' AND section_name='A');

INSERT INTO class_master (school_id, class_name, section_name, academic_year, record_status)
SELECT 1, '9', 'B', '2026-27', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM class_master WHERE class_name='9' AND section_name='B');

-- Insert sample students
INSERT INTO student_master (admission_no, full_name, class_id, parent_name, mobile_no, email_id, record_status)
SELECT 'S101', 'Ravi Kumar', 1, 'Ramesh Kumar', '9876543210', 'ravi@gmail.com', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM student_master WHERE admission_no='S101');

INSERT INTO student_master (admission_no, full_name, class_id, parent_name, mobile_no, email_id, record_status)
SELECT 'S102', 'Priya Sharma', 2, 'Srinivas', '9123456780', 'priya@gmail.com', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM student_master WHERE admission_no='S102');

-- Insert sample teachers
INSERT INTO teacher_master (full_name, subject_name, role, email_id, mobile_no, record_status)
SELECT 'Mr. Ramesh', 'Mathematics', 'teacher', 'ramesh@ssschool.com', '9000011111', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM teacher_master WHERE full_name='Mr. Ramesh');

INSERT INTO teacher_master (full_name, subject_name, role, email_id, mobile_no, record_status)
SELECT 'Mrs. Lakshmi', 'English', 'teacher', 'lakshmi@ssschool.com', '9000022222', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM teacher_master WHERE full_name='Mrs. Lakshmi');

-- Insert sample notice
INSERT INTO notice_board (notice_title, notice_text, applicable_to, record_status)
SELECT 'Exam Schedule Update', 'Mid-term exams will start from Monday', 'students', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM notice_board LIMIT 1);

