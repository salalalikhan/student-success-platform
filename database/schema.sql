-- Student Profile Database Schema
-- MariaDB with raw SQL queries as per simplified tech stack

CREATE DATABASE IF NOT EXISTS student_profiles;
USE student_profiles;

-- Users table for authentication (teacher vs student roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table for profile management
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    year_grade VARCHAR(50),
    major_focus VARCHAR(255),
    short_term_goals TEXT,
    long_term_goals TEXT,
    skills JSON,
    interests TEXT,
    extracurricular TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_name (name)
);

-- Skills inventory with proficiency levels
CREATE TABLE IF NOT EXISTS student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_skill_name (skill_name),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Resume uploads with version history
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    file_data LONGBLOB NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    version INT DEFAULT 1,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_file_hash (file_hash),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Dynamic surveys
CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSON NOT NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_by (created_by),
    INDEX idx_active (is_active),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Survey responses
CREATE TABLE IF NOT EXISTS survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    student_id INT NOT NULL,
    responses JSON NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_survey_id (survey_id),
    INDEX idx_student_id (student_id),
    UNIQUE KEY unique_survey_student (survey_id, student_id),
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Survey templates
CREATE TABLE IF NOT EXISTS survey_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type ENUM('beginning_term', 'mid_term', 'project_preferences', 'custom') NOT NULL,
    questions JSON NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_by (created_by),
    INDEX idx_template_type (template_type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Resume discrepancies tracking
CREATE TABLE IF NOT EXISTS resume_discrepancies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    discrepancies JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reviewed BOOLEAN DEFAULT FALSE,
    INDEX idx_student_id (student_id),
    INDEX idx_reviewed (reviewed),
    UNIQUE KEY unique_student_discrepancy (student_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (email, password, role) VALUES 
('teacher@example.com', '$2b$10$8K1p/a0dUrOYfUcGhJFCCO.7VfcJZGDQ8rDQF7yNvOGdOjKgFtOKm', 'teacher'),
('student1@example.com', '$2b$10$8K1p/a0dUrOYfUcGhJFCCO.7VfcJZGDQ8rDQF7yNvOGdOjKgFtOKm', 'student'),
('student2@example.com', '$2b$10$8K1p/a0dUrOYfUcGhJFCCO.7VfcJZGDQ8rDQF7yNvOGdOjKgFtOKm', 'student')
ON DUPLICATE KEY UPDATE email = email;