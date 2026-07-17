import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Users, CheckCircle, XCircle, Search, RefreshCw, GraduationCap, Phone, MessageSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';

const MentorDailyRotation = () => {
    const [mentors, setMentors] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState('');
    
    const [completed, setCompleted] = useState([]);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'completed' or 'pending'
    const navigate = useNavigate();

    // Fetch mentors
    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get('/api/mentor-head/dropdowns', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success && res.data.data.mentors) {
                    setMentors(res.data.data.mentors);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchMentors();
    }, []);

    const fetchRotation = async (mentorId) => {
        if (!mentorId) {
            setCompleted([]);
            setPending([]);
            return;
        }
        
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`/api/mentor-head/mentor-daily-rotation/${mentorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCompleted(res.data.data.completed);
                setPending(res.data.data.pending);
            }
        } catch (err) {
            toast.error("Failed to load mentor rotation data");
        } finally {
            setLoading(false);
        }
    };

    const handleMentorChange = (e) => {
        const mId = e.target.value;
        setSelectedMentor(mId);
        fetchRotation(mId);
    };

    const handleRefresh = () => {
        if (selectedMentor) {
            fetchRotation(selectedMentor);
        }
    };

    const columns = [
        {
            accessor: 'name', label: 'STUDENT', render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {row.name ? row.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-800">{row.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{row.registration_number || 'N/A'}</div>
                    </div>
                </div>
            )
        },
        { accessor: 'course', label: 'COURSE' },
        {
            accessor: 'phone_number', label: 'CONTACT', render: (row) => (
                <div className="flex items-center gap-1 text-slate-600">
                    <Phone size={14} /> {row.phone_number || 'N/A'}
                </div>
            )
        },
        {
            accessor: 'action', label: 'ACTION', render: (row) => (
                <button
                    onClick={() => navigate(`/mentor-head/students/${row.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#008080] text-white rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-[#006666] transition-colors"
                >
                    <MessageSquare size={14} /> Chat
                </button>
            )
        }
    ];

    const completedColumns = [
        ...columns.slice(0, 3), // STUDENT, COURSE, CONTACT
        {
            accessor: 'interaction_type', label: 'INTERACTION', render: (row) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#008080] bg-[#008080]/10 px-2 py-0.5 rounded-full w-max mb-1">
                        {row.interaction_type || 'Unknown'}
                    </span>
                    <span className="text-sm text-slate-600 line-clamp-2" title={row.interaction_notes}>
                        {row.interaction_notes || 'No notes provided'}
                    </span>
                </div>
            )
        },
        columns[3] // ACTION
    ];

    return (
        <div className="p-4 md:p-8 animate-fade-in w-full max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Users className="text-[#008080]" />
                        Mentor Daily Rotation
                    </h1>
                    <p className="text-slate-500 mt-1">Track which students a mentor interacted with today.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <select
                            value={selectedMentor}
                            onChange={handleMentorChange}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080]"
                        >
                            <option value="">-- Select a Mentor --</option>
                            {mentors.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <Search size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        disabled={loading || !selectedMentor}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {!selectedMentor ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">No Mentor Selected</h3>
                    <p className="text-slate-500 mt-2">Please select a mentor from the dropdown to view their daily rotation.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'pending' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <XCircle size={18} />
                            Not Completed ({pending.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'completed' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <CheckCircle size={18} />
                            Completed Today ({completed.length})
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-0">
                        {activeTab === 'pending' && (
                            <DataTable
                                columns={columns}
                                data={pending}
                                loading={loading}
                                emptyMessage="All students have been contacted today! 🎉"
                            />
                        )}
                        {activeTab === 'completed' && (
                            <DataTable
                                columns={completedColumns}
                                data={completed}
                                loading={loading}
                                emptyMessage="No students contacted today yet."
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorDailyRotation;
