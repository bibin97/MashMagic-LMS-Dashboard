import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarClock, CheckCircle, XCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/Mentor/StatusBadge';
import PostponeModal from '../../components/Mentor/PostponeModal';
import { useNavigate } from 'react-router-dom';

const Timetable = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showPostpone, setShowPostpone] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const res = await api.get('/mentor/timetable');
            setSessions(res.data.data);
        } catch (error) {
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, payload = null) => {
        try {
            await api.put(`/mentor/timetable/${id}/${action}`, payload);
            toast.success(`Session ${action === 'complete' ? 'Completed' : action}`);
            if (action === 'postpone') setShowPostpone(false);
            fetchTimetable();
        } catch (error) {
            toast.error("Action rejected by core system");
        }
    };

    const isLoggable = (session) => {
        return session.status === 'Completed' && new Date(session.date) <= new Date();
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Academic Scheduling</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Timetable & Session Registry</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="text-center p-20 text-slate-400 font-bold animate-pulse">Fetching Real-time Scheduler Data...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-100/30 transition-all duration-500 relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Identity</span>
                                    <span className="text-base font-black text-slate-900">#{session.session_number} Deployment</span>
                                </div>
                                <StatusBadge status={session.status} />
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal Window</p>
                                        <p className="text-xs font-black text-slate-700">{new Date(session.date).toLocaleDateString()} | {session.start_time} - {session.end_time}</p>
                                        {session.status === 'Postponed' && session.new_date && (
                                            <p className="text-[10px] text-amber-600 font-bold animate-pulse mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">➜ POSTPONED TO: {new Date(session.new_date).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chapter / Technical Topic</p>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 italic">
                                        {session.chapter_topic || 'Deployment Plan Pending'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                                {session.status === 'Scheduled' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(session.id, 'complete')}
                                            className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Resolve
                                        </button>
                                        <button
                                            onClick={() => { setSelectedSession(session); setShowPostpone(true); }}
                                            className="flex-1 bg-amber-500 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CalendarClock size={14} /> Postpone
                                        </button>
                                        <button
                                            onClick={() => handleAction(session.id, 'cancel')}
                                            className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </>
                                )}

                                {isLoggable(session) && (
                                    <button
                                        onClick={() => navigate('/mentor/student-log', {
                                            state: {
                                                student: {
                                                    id: session.student_id,
                                                    name: session.student_name,
                                                    course: session.course, // if available
                                                    grade: session.grade    // if available
                                                }
                                            }
                                        })}
                                        className="w-full bg-slate-900 text-white px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <MessageSquare size={14} className="group-hover:rotate-12 transition-transform" /> Initialize Interaction Log
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                            <Clock size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No sessions detected in the current calendar cycle.</p>
                        </div>
                    )}
                </div>
            )}

            {showPostpone && (
                <PostponeModal
                    session={selectedSession}
                    onClose={() => setShowPostpone(false)}
                    onConfirm={(id, date) => handleAction(id, 'postpone', { new_date: date })}
                />
            )}
        </div>
    );
};

export default Timetable;
