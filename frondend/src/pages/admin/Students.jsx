import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { sortStudentsByOption } from '../../components/StudentListFilterDropdown';

const Students = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [sortBy, setSortBy] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        grade: '',
        subject: '',
        timetable: '',
        nextInstallment: '',
        status: ''
    });
    const [dailyHours, setDailyHours] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/students');
            const realStudents = response.data.data;

            setStudents(realStudents);
            setFilteredStudents(realStudents);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch students");
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        const filtered = students.filter(s =>
            s.name?.toLowerCase().includes(query.toLowerCase()) ||
            s.email?.toLowerCase().includes(query.toLowerCase()) ||
            s.mentor?.toLowerCase().includes(query.toLowerCase()) ||
            s.subject?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const handleView = async (student) => {
        setSelectedStudent(student);
        setDailyHours([]);
        setIsModalOpen(true);
        try {
            const res = await api.get(`/admin/daily-hours/${student.id}`);
            if (res.data.success) {
                setDailyHours(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch daily hours");
        }
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setEditFormData({
            name: student.name,
            grade: student.grade,
            subject: student.subject,
            timetable: student.timetable,
            nextInstallment: student.nextInstallment ? student.nextInstallment.split('T')[0] : '',
            status: student.status
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/admin/students/${selectedStudent.id}`, editFormData);
            if (res.data.success) {
                toast.success("Student updated successfully");
                setIsEditModalOpen(false);
                fetchStudents();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update student");
        }
    };

    const handleApprove = async (student) => {
        try {
            await api.put(`/admin/approve/${student.id}`, { role: 'student' });
            toast.success(`${student.name} approved successfully`);
            fetchStudents(); // Refresh list
        } catch (error) {
            toast.error("Failed to approve student");
        }
    };

    const handleBlock = async (student) => {
        if (!window.confirm(`Are you sure you want to block ${student.name}?`)) return;
        try {
            await api.put(`/admin/block/${student.id}`, { role: 'student' });
            toast.success(`${student.name} blocked successfully`);
            fetchStudents(); // Refresh list
        } catch (error) {
            toast.error("Failed to block student");
        }
    };

    const handleDelete = async (student) => {
        if (!window.confirm(`PERMANENT ACTION: Delete ${student.name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/delete/${student.id}?role=student`);
            toast.success(`${student.name} deleted successfully`);
            fetchStudents(); // Refresh list
        } catch (error) {
            toast.error("Failed to delete student");
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Grade', accessor: 'grade' },
        { header: 'Mentor', accessor: 'mentor' },
        { header: 'Faculty', accessor: 'faculty' },
        {
            header: 'Status', accessor: 'status', render: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Student Enrollment</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Monitoring academic progress and enrollment details</p>
            </div>

            <DataTable
                columns={columns}
                data={useMemo(() => sortStudentsByOption(filteredStudents, sortBy), [filteredStudents, sortBy])}
                loading={loading}
                onSearch={handleSearch}
                onView={handleView}
                onApprove={isSuperAdmin ? handleApprove : undefined}
                onBlock={isSuperAdmin ? handleBlock : undefined}
                onDelete={isSuperAdmin ? handleDelete : undefined}
                onEdit={isSuperAdmin ? handleEdit : undefined}
                searchPlaceholder="Search students by name or email..."
                filterValue={sortBy}
                onFilterChange={setSortBy}
            />

            {/* Edit Student Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Student Information"
                size="lg"
            >
                <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Full Name</label>
                        <input
                            type="text"
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Grade</label>
                        <input
                            type="text"
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            value={editFormData.grade}
                            onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Subject</label>
                        <input
                            type="text"
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            value={editFormData.subject}
                            onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Next Installment</label>
                        <input
                            type="date"
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            value={editFormData.nextInstallment}
                            onChange={(e) => setEditFormData({ ...editFormData, nextInstallment: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Status</label>
                        <select
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                            value={editFormData.status}
                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Timetable Summary</label>
                        <textarea
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all min-h-[100px]"
                            value={editFormData.timetable}
                            onChange={(e) => setEditFormData({ ...editFormData, timetable: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 pt-4">
                        <button type="button" className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                        <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Update Student Data</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Student Academic Profile"
                size="lg"
            >
                {selectedStudent && (
                    <div className="flex flex-col gap-10">
                        <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-200">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h3>
                                <p className="text-slate-500 font-medium">{selectedStudent.email || 'No email provided'}</p>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${selectedStudent.status === 'active' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}>
                                        {selectedStudent.status.toUpperCase()} ACCOUNT
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <InfoGroup label="Current Grade" value={selectedStudent.grade} />
                            <InfoGroup label="Subject Focus" value={selectedStudent.subject} />
                            <InfoGroup label="Academic Mentor" value={selectedStudent.mentor} />
                            <InfoGroup label="Lead Faculty" value={selectedStudent.faculty} />
                            <InfoGroup label="Learning Timetable" value={selectedStudent.timetable} />
                            <InfoGroup label="Next Payment Due" value={selectedStudent.nextInstallment} highlight />
                        </div>

                        <div className="mt-2 border-t border-slate-100 pt-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Daily Logged Hours (Mentor)</h4>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                {dailyHours.length > 0 ? dailyHours.map((log) => (
                                    <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</span>
                                        <span className="text-sm font-black text-blue-600">{log.hours} Hrs</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 font-medium italic">No hours logged yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsModalOpen(false)}>Close</button>
                            <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">Edit Academic Info</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const InfoGroup = ({ label, value, highlight }) => (
    <div className="flex flex-col gap-1.5 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">{label}</label>
        <p className={`text-base font-semibold ${highlight ? 'text-blue-600' : 'text-slate-700'}`}>{value}</p>
    </div>
);

export default Students;
