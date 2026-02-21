import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User,
    Phone,
    MapPin,
    Calendar,
    ArrowLeft,
    ScrollText,
    GraduationCap,
    CheckCircle2,
    Clock,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const MentorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mentorData, setMentorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('student');

    useEffect(() => {
        const fetchMentorDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const [detailsRes, monitoringRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/mentor-head/mentor/${id}/details`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5000/api/mentor-head/mentors/${id}/monitoring`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (detailsRes.data.success && monitoringRes.data.success) {
                    setMentorData({
                        ...detailsRes.data.data,
                        monitoring: monitoringRes.data.data
                    });
                }
            } catch (error) {
                console.error('Error details:', error);
                toast.error("Failed to fetch mentor details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMentorDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!mentorData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h2 className="text-2xl font-black text-slate-900">Mentor Not Found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { profile, assignedStudents, logs, facultyLogs, monitoring } = mentorData;

    const totalStudents = monitoring?.assignedStudents?.length || 1;
    const connectedToday = monitoring?.todayConnectionCount || 0;
    const progressPercent = totalStudents > 0 ? (connectedToday / totalStudents) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold uppercase tracking-wider text-xs"
                >
                    <ArrowLeft size={16} />
                    Back to List
                </button>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                    Mentor Profile
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-indigo-200">
                        {profile.name.charAt(0)}
                    </div>

                    <div className="text-center md:text-left space-y-4 flex-1">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{profile.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                                <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{profile.status}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6">
                            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <Phone size={16} className="text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">{profile.phone_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <MapPin size={16} className="text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">{profile.place || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <Calendar size={16} className="text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto mt-6 md:mt-0 md:ml-auto md:min-w-[300px]">
                        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl flex items-center justify-center text-4xl shadow-xl"></div>
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Monthly Stats</span>
                                <span className="text-xl font-black text-indigo-400">{monitoring?.monthlyConnections || 0} Connections</span>
                            </div>
                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Today's Check Progress</span>
                                <span className="text-sm font-black text-white">{connectedToday} / {monitoring?.assignedStudents?.length || 0}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-slate-50 border border-slate-100 text-slate-900 p-4 rounded-3xl text-center flex-1 shadow-sm">
                                <div className="text-2xl font-black text-indigo-600">{logs.length}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Student Logs</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 text-slate-900 p-4 rounded-3xl text-center flex-1 shadow-sm">
                                <div className="text-2xl font-black text-purple-600">{facultyLogs ? facultyLogs.length : 0}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Faculty Logs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assigned Students */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
                            <GraduationCap className="text-indigo-600" size={24} />
                            Assigned Students
                        </h3>

                        {assignedStudents.length > 0 ? (
                            <div className="space-y-4">
                                {monitoring?.assignedStudents?.map((student) => (
                                    <div key={student.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{student.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{student.course || 'Course N/A'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2">
                                                    {student.onboarding_status === 'pending' && (
                                                        <span className="px-2 py-1 bg-rose-50 rounded-lg text-[10px] font-black text-rose-600 shadow-sm border border-rose-100 uppercase tracking-widest">
                                                            New
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-black text-indigo-600 shadow-sm border border-slate-100">
                                                        {student.grade}
                                                    </span>
                                                </div>
                                                {student.connected_today ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                        <CheckCircle2 size={12} /> Connected
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                                    <User size={20} />
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No students assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Interaction History */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <ScrollText className="text-indigo-600" size={24} />
                                Activity Logs
                            </h3>
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <button
                                    onClick={() => setActiveTab('student')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'student'
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Student
                                </button>
                                <button
                                    onClick={() => setActiveTab('faculty')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'faculty'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Faculty
                                </button>
                            </div>
                        </div>

                        {activeTab === 'student' ? (
                            logs.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                                    {logs.map((log) => (
                                        <div key={log.id} className="relative pl-10 group">
                                            <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-50 rounded-full border-4 border-white flex items-center justify-center text-indigo-600 shadow-sm z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <CheckCircle2 size={14} />
                                            </div>

                                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Student Interaction</span>
                                                        <h4 className="font-bold text-slate-900">{log.student_name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                                        <Clock size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                            {new Date(log.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {log.details && (
                                                    <p className="text-slate-600 text-sm font-medium leading-relaxed bg-white p-4 rounded-2xl border border-slate-100/50">
                                                        {log.details}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                                        <ScrollText size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">No Student Logs</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                                        No interaction logs found.
                                    </p>
                                </div>
                            )
                        ) : (
                            facultyLogs && facultyLogs.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                                    {facultyLogs.map((log) => (
                                        <div key={log.id} className="relative pl-10 group">
                                            <div className="absolute left-0 top-1 w-8 h-8 bg-purple-50 rounded-full border-4 border-white flex items-center justify-center text-purple-600 shadow-sm z-10 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                <CheckCircle2 size={14} />
                                            </div>

                                            <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block mb-1">Faculty Interaction</span>
                                                        <h4 className="font-bold text-slate-900 text-lg">{log.chapter || 'Session Update'}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-purple-400 bg-white px-3 py-1 rounded-full shadow-sm">
                                                        <Clock size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                            {new Date(log.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="bg-white p-3 rounded-xl border border-purple-50">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Session Type</span>
                                                        <span className="text-sm font-bold text-slate-700">{log.session_type || 'Regular'}</span>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-purple-50">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Performance</span>
                                                        <span className={`text-sm font-black ${log.student_performance === 'Excellent' ? 'text-emerald-500' :
                                                            log.student_performance === 'Good' ? 'text-blue-500' :
                                                                log.student_performance === 'Average' ? 'text-amber-500' :
                                                                    'text-rose-500'
                                                            }`}>{log.student_performance || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                {log.topics_covered && (
                                                    <div className="mb-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Topics Covered</span>
                                                        <p className="text-slate-600 text-sm font-medium leading-relaxed bg-white p-4 rounded-2xl border border-slate-100/50">
                                                            {log.topics_covered}
                                                        </p>
                                                    </div>
                                                )}

                                                {log.issues_reported && (
                                                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 mt-3">
                                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Issues Reported</span>
                                                        <p className="text-rose-700 text-sm font-bold">
                                                            {log.issues_reported}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                                        <ScrollText size={32} />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">No Faculty Logs</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
                                        No faculty interactions found.
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorDetails;
