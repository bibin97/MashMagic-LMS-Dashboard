-- =========================================================================
-- PHASE 1: DATABASE SAFETY MIGRATIONS
-- IMPORTANT: PLEASE BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!
-- =========================================================================

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'SOFT_DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    performed_by INT,
    ip_address VARCHAR(45),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Timetable Versions Table
CREATE TABLE IF NOT EXISTS timetable_versions (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    timetable_id INT NOT NULL,
    mentor_id INT,
    student_id INT NOT NULL,
    session_number INT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INT,
    chapter VARCHAR(255),
    session_type VARCHAR(50),
    status VARCHAR(50),
    notes TEXT,
    faculty_id INT,
    faculty_name VARCHAR(100),
    is_deleted TINYINT(1) DEFAULT 0,
    version_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version_created_by INT
);

-- 3. Add Soft Delete Columns to Core Tables
-- To prevent syntax errors if columns already exist, this should ideally be run one by one or via a stored procedure.
-- We use a stored procedure to safely add columns.

DELIMITER //

CREATE PROCEDURE AddSoftDeleteColumns(IN tableName VARCHAR(255))
BEGIN
    SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN IF NOT EXISTS deleted_by INT NULL;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
END //

DELIMITER ;

-- Apply to major tables
CALL AddSoftDeleteColumns('users');
CALL AddSoftDeleteColumns('students');
CALL AddSoftDeleteColumns('faculties');
CALL AddSoftDeleteColumns('timetable');
CALL AddSoftDeleteColumns('faculty_schedules');
CALL AddSoftDeleteColumns('student_exams');
CALL AddSoftDeleteColumns('tasks');
CALL AddSoftDeleteColumns('session_attendance');
CALL AddSoftDeleteColumns('student_interaction_logs');
CALL AddSoftDeleteColumns('faculty_interaction_logs');
CALL AddSoftDeleteColumns('admin_notifications');
CALL AddSoftDeleteColumns('faculty_documents');
CALL AddSoftDeleteColumns('fee_structures');
CALL AddSoftDeleteColumns('fee_installments');
CALL AddSoftDeleteColumns('academic_documents');
CALL AddSoftDeleteColumns('faculty_sessions');

DROP PROCEDURE IF EXISTS AddSoftDeleteColumns;

-- 4. Add Composite Unique Constraints for Duplicate Prevention
-- Timetable: A student cannot have another session at the EXACT same date, time, and chapter.
ALTER TABLE timetable 
ADD UNIQUE KEY unique_timetable_session (student_id, date, start_time, end_time, chapter(100));

-- Faculty Schedules: A faculty cannot teach two different subjects/students at the same time on the same day.
ALTER TABLE faculty_schedules
ADD UNIQUE KEY unique_faculty_time (faculty_id, day_of_week, start_time, end_time);

-- 5. Strict Foreign Key Rules (Example for Timetable)
-- Note: If you have existing orphan records, these ALTER TABLE statements might fail. 
-- Please ensure data integrity before enforcing.
-- ALTER TABLE timetable
-- ADD CONSTRAINT fk_timetable_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

