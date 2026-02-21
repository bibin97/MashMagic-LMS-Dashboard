import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleView = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
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
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-shadow-sm">Student Enrollment</h2>
                <p className="text-slate-500 text-sm font-medium">Monitoring academic progress and enrollment details</p>
            </div>

            <DataTable
                columns={columns}
                data={filteredStudents}
                loading={loading}
                onSearch={handleSearch}
                onView={handleView}
                onApprove={handleApprove}
                onBlock={handleBlock}
                onDelete={handleDelete}
                searchPlaceholder="Search students by name or email..."
            />

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
