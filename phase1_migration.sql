-- Phase 1 Migration: Add Soft Delete Columns to Critical Tables
-- Replace DELETE with Soft Delete mechanism

SET FOREIGN_KEY_CHECKS=0;

-- 1. admin_notifications
ALTER TABLE `admin_notifications` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `admin_notifications` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `admin_notifications` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 2. ah_student_rotation
ALTER TABLE `ah_student_rotation` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `ah_student_rotation` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `ah_student_rotation` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 3. student_interaction_logs
ALTER TABLE `student_interaction_logs` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_interaction_logs` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_interaction_logs` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 4. faculty_interaction_logs
ALTER TABLE `faculty_interaction_logs` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_interaction_logs` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_interaction_logs` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 5. student_verification
ALTER TABLE `student_verification` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_verification` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_verification` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 6. daily_hours_log
ALTER TABLE `daily_hours_log` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `daily_hours_log` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `daily_hours_log` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 7. student_marks
ALTER TABLE `student_marks` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_marks` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_marks` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 8. student_exams
ALTER TABLE `student_exams` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_exams` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_exams` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 9. session_attendance
ALTER TABLE `session_attendance` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `session_attendance` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `session_attendance` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 10. student_reports
ALTER TABLE `student_reports` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_reports` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_reports` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 11. live_class_feedbacks
ALTER TABLE `live_class_feedbacks` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `live_class_feedbacks` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `live_class_feedbacks` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 12. timetable
ALTER TABLE `timetable` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `timetable` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `timetable` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 13. student_daily_updates
ALTER TABLE `student_daily_updates` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `student_daily_updates` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `student_daily_updates` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 14. faculty_class_updates
ALTER TABLE `faculty_class_updates` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_class_updates` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_class_updates` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 15. users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 16. faculty_timetable
ALTER TABLE `faculty_timetable` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_timetable` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_timetable` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 17. academic_documents
ALTER TABLE `academic_documents` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `academic_documents` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `academic_documents` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 18. faculty_schedules
ALTER TABLE `faculty_schedules` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_schedules` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_schedules` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 19. aoe_demo_schedules
ALTER TABLE `aoe_demo_schedules` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `aoe_demo_schedules` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `aoe_demo_schedules` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 20. faculty_documents
ALTER TABLE `faculty_documents` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_documents` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_documents` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 21. fee_installments
ALTER TABLE `fee_installments` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `fee_installments` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `fee_installments` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 22. faculty_sessions
ALTER TABLE `faculty_sessions` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculty_sessions` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculty_sessions` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 23. tasks
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 24. students (just in case it's used elsewhere)
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 25. mentors (just in case it's used elsewhere)
ALTER TABLE `mentors` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `mentors` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `mentors` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

-- 26. faculties (just in case it's used elsewhere)
ALTER TABLE `faculties` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `faculties` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME DEFAULT NULL;
ALTER TABLE `faculties` ADD COLUMN IF NOT EXISTS `deleted_by` INT DEFAULT NULL;

SET FOREIGN_KEY_CHECKS=1;
