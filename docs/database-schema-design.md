# Database Schema Design Document

## Overview
This document describes the database schema for the Student Profile & Goal Tracking System, implemented using MariaDB with raw SQL queries following the simplified tech stack approach.

## Schema Design Principles
- **Normalization**: 3NF compliance to minimize data redundancy
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Performance**: Strategic indexing on frequently queried columns
- **Flexibility**: JSON columns for dynamic data structures
- **Scalability**: Prepared for future growth and feature additions

## Table Structure

### 1. users
**Purpose**: Authentication and role management
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
**Key Features**:
- Bcrypt hashed passwords for security
- Role-based access control
- Unique email constraint
- Audit timestamps

### 2. students
**Purpose**: Core student profile information
```sql
CREATE TABLE students (
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
```
**Key Features**:
- Flexible text fields for goals and interests
- JSON column for legacy skills data
- Performance indexes on searchable fields

### 3. student_skills
**Purpose**: Normalized skills inventory with proficiency tracking
```sql
CREATE TABLE student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_skill_name (skill_name),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```
**Key Features**:
- Normalized skill storage
- Proficiency level tracking
- Cascade deletion for data integrity

### 4. surveys
**Purpose**: Dynamic survey management
```sql
CREATE TABLE surveys (
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
```
**Key Features**:
- Flexible question structure via JSON
- Active/inactive survey management
- Teacher ownership tracking

### 5. survey_responses
**Purpose**: Student survey response storage
```sql
CREATE TABLE survey_responses (
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
```
**Key Features**:
- Flexible response structure via JSON
- Unique constraint prevents duplicate responses
- Referential integrity with cascading deletes

### 6. survey_templates
**Purpose**: Reusable survey templates
```sql
CREATE TABLE survey_templates (
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
```
**Key Features**:
- Predefined template categories
- Template sharing and reuse
- Flexible question structure

### 7. uploaded_files
**Purpose**: Resume and file storage with version control
```sql
CREATE TABLE uploaded_files (
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
```
**Key Features**:
- BLOB storage for file security
- Version history tracking
- File integrity verification via hash
- Size and type validation

### 8. resume_discrepancies
**Purpose**: Tracking differences between resume and profile data
```sql
CREATE TABLE resume_discrepancies (
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
```
**Key Features**:
- Automated discrepancy detection
- Review workflow tracking
- Flexible discrepancy data structure

## Relationships

### One-to-Many Relationships
- **users** → **surveys** (1:N) - Teachers can create multiple surveys
- **users** → **survey_templates** (1:N) - Teachers can create multiple templates
- **students** → **student_skills** (1:N) - Students can have multiple skills
- **students** → **uploaded_files** (1:N) - Students can upload multiple file versions
- **surveys** → **survey_responses** (1:N) - Surveys can have multiple responses

### One-to-One Relationships
- **students** → **resume_discrepancies** (1:1) - Each student has one discrepancy record

### Many-to-Many Relationships
- **students** ↔ **surveys** (M:N) - Students can respond to multiple surveys, surveys can have multiple student responses (via survey_responses table)

## Performance Considerations

### Indexing Strategy
- **Primary Keys**: Auto-increment integers for optimal performance
- **Foreign Keys**: Indexed automatically for join performance
- **Search Fields**: Indexed on frequently searched columns (email, name, skill_name)
- **Filter Fields**: Indexed on commonly filtered columns (is_active, reviewed, template_type)

### Query Optimization
- Use of GROUP_CONCAT for aggregating skills in search queries
- Prepared statements for SQL injection prevention
- Connection pooling for concurrent user support
- Appropriate use of JSON columns for flexible data structures

## Security Features

### Data Protection
- **Password Security**: Bcrypt hashing with salt rounds
- **SQL Injection Prevention**: Parameterized queries throughout
- **Access Control**: Role-based permissions at application level
- **Data Isolation**: Foreign key constraints ensure data integrity

### File Security
- **BLOB Storage**: Files stored in database, not filesystem
- **File Validation**: Type and size restrictions enforced
- **Hash Verification**: SHA-256 hashes for file integrity
- **Version Control**: Multiple file versions tracked

## Scalability Considerations

### Current Design
- Connection pooling (5 connections) for concurrent access
- Efficient indexing for common query patterns
- JSON columns for flexible data structures
- Normalized design reduces storage requirements

### Future Improvements
- Read replicas for improved query performance
- Partitioning for large datasets
- Caching layer for frequently accessed data
- Archive strategy for historical data

## Data Migration Strategy

### Initial Setup
1. Create database and user accounts
2. Execute schema.sql to create tables
3. Insert sample data for testing
4. Verify foreign key constraints

### Version Control
- Schema changes tracked in migration files
- Version numbers in database for compatibility
- Rollback procedures for failed migrations
- Testing procedures for schema changes

## Backup and Recovery

### Backup Strategy
- Regular full database backups
- Binary log replication for point-in-time recovery
- File system backups for complete disaster recovery
- Testing of backup restoration procedures

### Recovery Procedures
- Point-in-time recovery for data corruption
- Full system restore for hardware failures
- Data validation after recovery operations
- Documentation of recovery procedures

## Compliance and Privacy

### Data Privacy
- Personal information stored securely
- Access logging for audit trails
- Data retention policies defined
- GDPR compliance considerations

### Educational Technology Standards
- FERPA compliance for student data
- Institutional data policy adherence
- Secure data transmission requirements
- Access control based on educational roles

## Conclusion

This schema design provides a robust foundation for the Student Profile & Goal Tracking System while maintaining simplicity and performance. The normalized structure ensures data integrity while the strategic use of JSON columns provides flexibility for future requirements. The design balances current needs with future scalability requirements.