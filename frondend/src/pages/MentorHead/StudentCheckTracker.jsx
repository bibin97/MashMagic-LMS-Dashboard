import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentCheckTracker = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentChecks();
    }, []);

    const fetchStudentChecks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/mentor-head/daily-student-checks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (error) {
            toast.error("Failed to load student checks");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCheck = async (studentId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/mentor-head/students/${studentId}/check`,
                {},
                { headers: { Authorization: `Bearer ${token}` } });

            setStudents(prev => prev.map(s => {
                if (s.student_id === studentId) {
                    return {
                        ...s,
                        total_check_count: s.total_check_count + 1
                    };
                }
                return s;
            }));
            toast.success('Marked student as checked');
        } catch (error) {
            toast.error("Failed to add check");
        }
    };

    const totalStudents = students.length;

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Loading tracker...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <Target className="text-indigo-600" />
                        Student Check Tracker
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily monitoring by Mentor Head</p>
                </div>

            </header>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Mentor</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Interaction Date</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Interaction Count</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Check Count</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const checkCount = student.total_check_count || 0;

                                let rowClass = "border-b border-slate-50 transition-colors group bg-white hover:bg-slate-50/50";
                                let badge = null;

                                if (checkCount === 1) {
                                    rowClass = "border-b border-emerald-100 transition-colors group bg-emerald-50 hover:bg-emerald-100/50 text-emerald-900";
                                } else if (checkCount >= 2) {
                                    rowClass = "border-b border-rose-100 transition-colors group bg-rose-50 hover:bg-rose-100/50 text-rose-900";
                                    badge = (
                                        <span className="inline-flex items-center justify-center w-6 h-6 ml-2 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-sm">
                                            {checkCount}
                                        </span>
                                    );
                                }

                                return (
                                    <tr key={student.student_id} className={rowClass}>
                                        <td className="p-4 text-sm font-bold flex items-center gap-2">
                                            {student.student_name}
                                            {student.onboarding_status === 'pending' && (
                                                <span className="px-2 py-0.5 bg-rose-50 rounded-md text-[8px] font-black text-rose-600 shadow-sm border border-rose-100 uppercase tracking-widest">
                                                    New
                                                </span>
                                            )}
                                            {badge}
                                        </td>
                                        <td className="p-4 text-xs font-bold">
                                            {student.mentor_name || 'Unassigned'}
                                        </td>
                                        <td className="p-4 text-xs font-bold opacity-80">
                                            {student.last_interaction_date ? new Date(student.last_interaction_date).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4 text-sm font-black opacity-80">
                                            {student.total_interaction_count || 0}
                                        </td>
                                        <td className="p-4 text-sm font-black opacity-80">
                                            {checkCount}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleAddCheck(student.student_id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black mx-auto transition-all bg-white border border-slate-200 text-slate-600 shadow-sm hover:scale-105 active:scale-95 uppercase tracking-widest"
                                            >
                                                <CheckCircle2 size={14} className={checkCount > 0 ? 'text-emerald-500' : 'text-slate-400'} />
                                                Checked
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentCheckTracker;
