import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { User, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'new'
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/mentor/students');
            setStudents(res.data.data);
        } catch (error) {
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleConnection = async (studentId, currentStatus, e) => {
        e.stopPropagation(); // prevent navigation
        try {
            await api.put(`/mentor/students/${studentId}/connection`, {
                connected_today: !currentStatus
            });
            // update UI locally
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, connected_today: !currentStatus ? 1 : 0 } : s));
            toast.success(!currentStatus ? 'Marked as connected today!' : 'Connection marked as incomplete.');
        } catch (error) {
            toast.error("Failed to update connection status");
        }
    };

    const handleCompleteOnboarding = async (studentId, e) => {
        e.stopPropagation();
        if (!window.confirm("Mark onboarding interaction as completed for this student?")) return;
        try {
            await api.put(`/mentor/students/${studentId}/onboard`);
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, onboarding_status: 'completed' } : s));
            toast.success("Onboarding completed. Student moved to active list.");
        } catch (error) {
            toast.error("Failed to complete onboarding");
        }
    };

    const filteredStudents = students.filter(s => {
        // Assume 'pending' means new, anything else means active / completed
        const isNew = s.onboarding_status === 'pending';
        if (viewMode === 'new' && !isNew) return false;
        if (viewMode === 'active' && isNew) return false;

        return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.subject.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student or subject..."
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all font-semibold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Active Students
                    </button>
                    <button
                        onClick={() => setViewMode('new')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'new' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        New (Onboarding)
                        {students.filter(s => s.onboarding_status === 'pending').length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px]">
                                {students.filter(s => s.onboarding_status === 'pending').length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20 text-slate-400 font-bold animate-pulse">Scanning Student Database...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => navigate(`/mentor/students/${student.id}`)}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 group cursor-pointer hover:-translate-y-2 transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <User size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                        {student.name}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                                            {student.grade}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-100">
                                            {student.subject}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Hours</p>
                                        <p className="text-sm font-bold text-slate-700">{student.hour} Hrs</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Payment</p>
                                        <p className="text-sm font-bold text-blue-600">{student.next_installment_date ? new Date(student.next_installment_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div
                                className="mt-6 pt-6 border-t border-slate-50 flex flex-col gap-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {viewMode === 'active' ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Connected Today</span>
                                        <button
                                            onClick={(e) => handleToggleConnection(student.id, student.connected_today, e)}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all ${student.connected_today ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                                        >
                                            <CheckCircle2 size={16} className={student.connected_today ? 'text-emerald-500' : 'text-slate-300'} />
                                            {student.connected_today ? 'YES' : 'NO'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">Action Required</span>
                                        <button
                                            onClick={(e) => handleCompleteOnboarding(student.id, e)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-200"
                                        >
                                            <CheckCircle2 size={16} />
                                            Complete Onboarding
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center font-bold">Have you interacted and communicated with this student?</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredStudents.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No students matched your search criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyStudents;
