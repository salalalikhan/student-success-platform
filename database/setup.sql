-- Student Profile Database Setup Script
-- Run this script to set up the production database

-- Create database user for security (instead of using root)
CREATE USER IF NOT EXISTS 'student_profile_user'@'localhost' IDENTIFIED BY 'student_profiles_secure_password_2025';
CREATE USER IF NOT EXISTS 'student_profile_user'@'%' IDENTIFIED BY 'student_profiles_secure_password_2025';

-- Grant necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles.* TO 'student_profile_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles.* TO 'student_profile_user'@'%';

-- Create database
CREATE DATABASE IF NOT EXISTS student_profiles 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE student_profiles;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS resume_discrepancies;
DROP TABLE IF EXISTS survey_responses;
DROP TABLE IF EXISTS survey_templates;
DROP TABLE IF EXISTS surveys;
DROP TABLE IF EXISTS uploaded_files;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- Create tables (from schema.sql but with production optimizations)

-- Users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') DEFAULT 'student',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Students table for profile management
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    year_grade VARCHAR(50),
    major_focus VARCHAR(255),
    short_term_goals TEXT,
    long_term_goals TEXT,
    interests TEXT,
    extracurricular TEXT,
    profile_completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_name (name),
    INDEX idx_major_focus (major_focus),
    INDEX idx_year_grade (year_grade),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Skills inventory with proficiency levels
CREATE TABLE student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    verified BOOLEAN DEFAULT FALSE,
    source ENUM('manual', 'survey', 'resume') DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_skill_name (skill_name),
    INDEX idx_proficiency (proficiency_level),
    UNIQUE KEY unique_student_skill (student_id, skill_name),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Resume uploads with version history
CREATE TABLE uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    file_data LONGBLOB NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    version INT DEFAULT 1,
    is_current BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    INDEX idx_student_id (student_id),
    INDEX idx_file_hash (file_hash),
    INDEX idx_current (is_current),
    INDEX idx_processing_status (processing_status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Dynamic surveys
CREATE TABLE surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON NOT NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP NULL,
    estimated_duration INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_by (created_by),
    INDEX idx_active (is_active),
    INDEX idx_template (is_template),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Survey responses
CREATE TABLE survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    student_id INT NOT NULL,
    responses JSON NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_survey_id (survey_id),
    INDEX idx_student_id (student_id),
    INDEX idx_completion (completion_percentage),
    UNIQUE KEY unique_survey_student (survey_id, student_id),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Survey templates
CREATE TABLE survey_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type ENUM('beginning_term', 'mid_term', 'project_preferences', 'skills_assessment', 'custom') NOT NULL,
    questions JSON NOT NULL,
    created_by INT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_by (created_by),
    INDEX idx_template_type (template_type),
    INDEX idx_public (is_public),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Resume discrepancies tracking
CREATE TABLE resume_discrepancies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    file_id INT NOT NULL,
    discrepancies JSON NOT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_file_id (file_id),
    INDEX idx_reviewed (reviewed),
    INDEX idx_severity (severity),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    details JSON NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert production sample data
INSERT INTO users (email, password, role, first_name, last_name) VALUES 
('admin@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeswkcO7TofKJKbP2', 'teacher', 'Dr. Sarah', 'Johnson'),
('prof.smith@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeswkcO7TofKJKbP2', 'teacher', 'Prof. Mike', 'Smith'),
('john.doe@student.university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeswkcO7TofKJKbP2', 'student', 'John', 'Doe'),
('jane.smith@student.university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeswkcO7TofKJKbP2', 'student', 'Jane', 'Smith'),
('mike.johnson@student.university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeswkcO7TofKJKbP2', 'student', 'Mike', 'Johnson')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO students (user_id, name, email, year_grade, major_focus, short_term_goals, long_term_goals, interests, extracurricular, profile_completion_percentage) VALUES 
(3, 'John Doe', 'john.doe@student.university.edu', 'Junior', 'Computer Science', 'Complete web development course and build a portfolio project', 'Become a full-stack developer at a tech startup', 'Web development, AI, Machine Learning, Mobile app development', 'Programming club president, Hackathon participant, Open source contributor', 85.00),
(4, 'Jane Smith', 'jane.smith@student.university.edu', 'Senior', 'Data Science', 'Complete capstone project on predictive analytics', 'Data scientist at a leading tech company focusing on ML research', 'Data analysis, Statistics, Python programming, Machine learning algorithms', 'Data science society vice-president, Research assistant, Statistics tutor', 92.50),
(5, 'Mike Johnson', 'mike.johnson@student.university.edu', 'Sophomore', 'Software Engineering', 'Learn React, Node.js and build three full-stack applications', 'Software architect specializing in scalable distributed systems', 'Full-stack development, DevOps, Cloud computing, System design', 'Programming competitions, Open source maintainer, Tech blog writer', 78.00)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO student_skills (student_id, skill_name, proficiency_level, verified, source) VALUES 
(1, 'JavaScript', 'intermediate', TRUE, 'manual'),
(1, 'React', 'beginner', FALSE, 'manual'),
(1, 'Node.js', 'beginner', FALSE, 'manual'),
(1, 'HTML/CSS', 'advanced', TRUE, 'manual'),
(1, 'Git', 'intermediate', TRUE, 'manual'),
(2, 'Python', 'advanced', TRUE, 'manual'),
(2, 'SQL', 'intermediate', TRUE, 'manual'),
(2, 'Machine Learning', 'intermediate', FALSE, 'manual'),
(2, 'R', 'intermediate', TRUE, 'manual'),
(2, 'Pandas', 'advanced', TRUE, 'manual'),
(2, 'TensorFlow', 'beginner', FALSE, 'manual'),
(3, 'Java', 'intermediate', TRUE, 'manual'),
(3, 'Docker', 'beginner', FALSE, 'manual'),
(3, 'Git', 'advanced', TRUE, 'manual'),
(3, 'Spring Boot', 'beginner', FALSE, 'manual'),
(3, 'AWS', 'beginner', FALSE, 'manual')
ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level);

INSERT INTO survey_templates (name, template_type, questions, created_by, is_public) VALUES 
('Beginning of Term Assessment', 'beginning_term', JSON_ARRAY(
    JSON_OBJECT('id', 'goals', 'text', 'What are your main academic goals for this term?', 'type', 'textarea', 'required', true),
    JSON_OBJECT('id', 'interests', 'text', 'What subjects or technologies interest you most?', 'type', 'textarea', 'required', true),
    JSON_OBJECT('id', 'skills', 'text', 'List your current technical skills and proficiency levels', 'type', 'textarea', 'required', true),
    JSON_OBJECT('id', 'career_goals', 'text', 'Describe your long-term career aspirations', 'type', 'textarea', 'required', false),
    JSON_OBJECT('id', 'learning_style', 'text', 'How do you prefer to learn new concepts?', 'type', 'radio', 'options', JSON_ARRAY('Visual', 'Auditory', 'Hands-on', 'Reading'), 'required', true)
), 1, TRUE),
('Skills Assessment', 'skills_assessment', JSON_ARRAY(
    JSON_OBJECT('id', 'programming_languages', 'text', 'Rate your proficiency in programming languages', 'type', 'multiple_rating', 'options', JSON_ARRAY('JavaScript', 'Python', 'Java', 'C++', 'SQL'), 'scale', JSON_ARRAY('Beginner', 'Intermediate', 'Advanced'), 'required', true),
    JSON_OBJECT('id', 'frameworks', 'text', 'Which frameworks have you used?', 'type', 'checkbox', 'options', JSON_ARRAY('React', 'Angular', 'Vue.js', 'Express.js', 'Django', 'Spring Boot'), 'required', false),
    JSON_OBJECT('id', 'tools', 'text', 'Development tools experience', 'type', 'checkbox', 'options', JSON_ARRAY('Git', 'Docker', 'Jenkins', 'AWS', 'Azure', 'Google Cloud'), 'required', false)
), 1, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Create indexes for performance
CREATE INDEX idx_students_profile_completion ON students(profile_completion_percentage DESC);
CREATE INDEX idx_survey_responses_completion ON survey_responses(completion_percentage DESC);
CREATE INDEX idx_activity_logs_recent ON activity_logs(created_at DESC);

-- Grant flush privileges
FLUSH PRIVILEGES;

-- Display setup completion message
SELECT 'Database setup completed successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_students FROM students;
SELECT COUNT(*) AS total_skills FROM student_skills;
SELECT COUNT(*) AS total_templates FROM survey_templates;