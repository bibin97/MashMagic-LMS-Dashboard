const db = require('../config/db');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private (super_admin)
const getTasks = async (req, res) => {
    try {
        let sql = `
            SELECT t.*, u.name as mentor_name, u.email as mentor_email 
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_to = u.id 
        `;
        let params = [];

        // Role-based filtering
        if (req.user.role === 'academic_head') {
            sql += ' WHERE t.assigned_by = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'mentor' || req.user.role === 'faculty' || req.user.role === 'mentor_head') {
            sql += ' WHERE t.assigned_to = ?';
            params.push(req.user.id);
        } else if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            // Other roles see nothing by default
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        sql += ' ORDER BY t.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error("GET_TASKS_ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (super_admin)
const createTask = async (req, res) => {
    const { title, description, mentor_id, deadline, priority } = req.body;
    try {
        const sql = 'INSERT INTO tasks (title, description, assigned_to, assigned_by, deadline, priority) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, description, mentor_id, req.user.id, deadline, priority]);

        res.status(201).json({
            success: true,
            message: "Task created and assigned successfully",
            taskId: result.insertId
        });
    } catch (error) {
        console.error("CREATE_TASK_ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (super_admin, mentor)
const updateTaskStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const [result] = await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        res.status(200).json({ success: true, message: "Task status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (super_admin)
const deleteTask = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        res.status(200).json({ success: true, message: "Task removed from system" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTaskStatus,
    deleteTask
};
