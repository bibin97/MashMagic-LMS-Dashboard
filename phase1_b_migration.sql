-- Phase 1B Migration: Audit Trails & Versioning Tables

SET FOREIGN_KEY_CHECKS=0;

-- 1. Create audit_logs table to track all critical changes
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `table_name` VARCHAR(100) NOT NULL,
    `record_id` INT NOT NULL,
    `action_type` ENUM('INSERT', 'UPDATE', 'SOFT_DELETE', 'RESTORE') NOT NULL,
    `old_data` JSON,
    `new_data` JSON,
    `performed_by` INT, -- User ID who performed the action
    `role` VARCHAR(50), -- Role of the user
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create timetable_versions table to keep track of previous timetable states
CREATE TABLE IF NOT EXISTS `timetable_versions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `batch` VARCHAR(50) NOT NULL,
    `version_number` INT NOT NULL,
    `timetable_data` JSON NOT NULL, -- The full snapshot of the timetable for that batch
    `created_by` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `is_active` TINYINT(1) DEFAULT 0 -- Only one version per batch should be active
);

-- 3. Composite Unique Constraints to prevent duplicates
-- Duplicate Prevention for Faculty Schedules
-- We ignore errors if the constraint already exists
ALTER TABLE `faculty_schedules` 
    ADD UNIQUE KEY `unique_faculty_time` (`faculty_id`, `day_of_week`, `start_time`);

-- Duplicate Prevention for Student Marks
ALTER TABLE `student_marks` 
    ADD UNIQUE KEY `unique_student_mark` (`student_id`, `subject`, `term`);

-- 4. Orphan Detection / Foreign Key protections (Examples for critical relations)
-- Ensure mentor_id in students refers to a valid mentor (Requires cleanup of existing bad data first)
-- ALTER TABLE `students` ADD CONSTRAINT `fk_student_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `mentors`(`id`) ON DELETE RESTRICT;

SET FOREIGN_KEY_CHECKS=1;
