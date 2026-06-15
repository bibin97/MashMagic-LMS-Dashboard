-- =========================================================================
-- PHASE 1: ROLLBACK SCRIPT
-- WARNING: This will drop the soft delete columns and audit tables!
-- Use ONLY if Phase 1 migration fails or needs to be reverted.
-- =========================================================================

-- 1. Drop Audit Logs and Versions Tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS timetable_versions;

-- 2. Remove Composite Unique Constraints
ALTER TABLE timetable DROP INDEX unique_timetable_session;
ALTER TABLE faculty_schedules DROP INDEX unique_faculty_time;

-- 3. Remove Soft Delete Columns from Core Tables
DELIMITER //

CREATE PROCEDURE RemoveSoftDeleteColumns(IN tableName VARCHAR(255))
BEGIN
    SET @sql = CONCAT('ALTER TABLE ', tableName, ' DROP COLUMN is_deleted;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('ALTER TABLE ', tableName, ' DROP COLUMN deleted_at;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @sql = CONCAT('ALTER TABLE ', tableName, ' DROP COLUMN deleted_by;');
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
END //

DELIMITER ;

CALL RemoveSoftDeleteColumns('users');
CALL RemoveSoftDeleteColumns('students');
CALL RemoveSoftDeleteColumns('faculties');
CALL RemoveSoftDeleteColumns('timetable');
CALL RemoveSoftDeleteColumns('faculty_schedules');
CALL RemoveSoftDeleteColumns('student_exams');
CALL RemoveSoftDeleteColumns('tasks');
CALL RemoveSoftDeleteColumns('session_attendance');
CALL RemoveSoftDeleteColumns('student_interaction_logs');
CALL RemoveSoftDeleteColumns('faculty_interaction_logs');
CALL RemoveSoftDeleteColumns('admin_notifications');
CALL RemoveSoftDeleteColumns('faculty_documents');
CALL RemoveSoftDeleteColumns('fee_structures');
CALL RemoveSoftDeleteColumns('fee_installments');
CALL RemoveSoftDeleteColumns('academic_documents');
CALL RemoveSoftDeleteColumns('faculty_sessions');

DROP PROCEDURE IF EXISTS RemoveSoftDeleteColumns;
