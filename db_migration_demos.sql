-- Copy and run this in your MySQL database / phpMyAdmin

-- 1. Add is_successful to aoe_demo_schedules
ALTER TABLE aoe_demo_schedules ADD COLUMN is_successful BOOLEAN DEFAULT 0;

-- 2. Create faculty_performance_index table
CREATE TABLE IF NOT EXISTS faculty_performance_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    demo_conversion_rate DECIMAL(5,2) DEFAULT 0,
    attendance_punctuality DECIMAL(5,2) DEFAULT 0,
    parent_feedback DECIMAL(5,2) DEFAULT 0,
    student_exam_improvement DECIMAL(5,2) DEFAULT 0,
    academic_head_rating DECIMAL(5,2) DEFAULT 0,
    total_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_faculty_month (faculty_id, month_year)
);
