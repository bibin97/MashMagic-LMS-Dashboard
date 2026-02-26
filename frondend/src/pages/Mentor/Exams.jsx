import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    GraduationCap, AlertCircle, Calendar, Clock, ArrowRight,
    CheckCircle2, Timer, XCircle, FileText, Target
} from 'lucide-react';

const Exams = () => {
    const [pendingExams, setPendingExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        type: 'Complete', // 'Complete' or 'Postpone'
        score: '',
        postponed_date: '',
        reason: ''
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/mentor/exams/pending');
            setPendingExams(res.data.data);
        } catch (error) {
            toast.error("Failed to load exam milestones");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSubmit = (exam) => {
        setSelectedExam(exam);
        setFormData({
            type: 'Complete',
            score: '',
            postponed_date: '',
            reason: ''
        });
        setIsSubmitModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mentor/exams/submit', {
                student_id: selectedExam.student_id,
                milestone: selectedExam.milestone,
                ...formData
            });
            toast.success(formData.type === 'Complete' ? "Exam score recorded" : "Exam postponed");
            setIsSubmitModalOpen(false);
            fetchExams();
        } catch (error) {
            toast.error(error.response?.data?.message || "Submission failed");
        }
    };

    return (
        <div className="space-y-8 pb-20 max-w-[1200px] mx-auto">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-indigo-500 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3 group hover:rotate-0 transition-all duration-500">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Academic Milestones</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Exam Alerts & Assessment Tracking to monitor student performance • PHASE 2026</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                        <AlertCircle className="text-indigo-500" size={18} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {pendingExams.length} Actions Required
                        </span>
                    </div>
                </div>
            </div>

            {/* List Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Milestone Data...</p>
                </div>
            ) : pendingExams.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 italic tracking-tight">No Pending Assessments</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-loose max-w-sm mx-auto">
                        All students are currently in compliance with their exam schedules. Keep up the high performance!
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingExams.map((exam, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500">
                                <span className="text-[7px] font-black uppercase tracking-tighter opacity-60">Session</span>
                                <span className="text-2xl font-black tracking-tighter italic">{exam.milestone}</span>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 mb-2 italic tracking-tight">{exam.student_name}</h3>
                                <div className="flex flex-wrap gap-5">
                                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-50">
                                        <Timer size={14} className="text-indigo-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">Phase {exam.milestone} Trigger</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-50">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest italic">Progress: {exam.session_count} Sessions</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${exam.status.includes('Postponed')
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                    }`}>
                                    {exam.status}
                                </div>

                                <button
                                    onClick={() => handleOpenSubmit(exam)}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 italic"
                                >
                                    Record Result <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Assessment Submission Modal */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-500 border border-white/20">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-indigo-500 text-white relative h-32">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black tracking-tight italic uppercase">Assessment Protocol</h2>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mt-1 flex items-center gap-2">
                                    <Users size={12} /> Milestone #{selectedExam?.milestone} • {selectedExam?.student_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="relative z-10 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all border border-white/10 active:scale-90"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-10">
                            {/* Toggle Selector */}
                            <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Complete' })}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'Complete'
                                        ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200/50'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <Target size={14} /> Submit Score
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'Postpone' })}
                                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center justify-center gap-2 ${formData.type === 'Postpone'
                                        ? 'bg-white text-amber-600 shadow-xl shadow-slate-200/50'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <Calendar size={14} /> Handle Later
                                </button>
                            </div>

                            {/* Content Area */}
                            {formData.type === 'Complete' ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Exam Performance Insight *</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                                <Target size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                autoFocus
                                                placeholder="e.g. 92% | Tier A++"
                                                className="w-full p-5 pl-14 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:bg-white focus:ring-8 ring-indigo-500/5 transition-all outline-none italic placeholder:font-bold placeholder:opacity-30"
                                                value={formData.score}
                                                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1">Note: This score will be synced with Academic Head reports.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Rescheduled Date *</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full p-5 pl-14 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:bg-white focus:ring-8 ring-amber-500/5 transition-all outline-none"
                                                    value={formData.postponed_date}
                                                    onChange={(e) => setFormData({ ...formData, postponed_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Reason for Protocol Shift *</label>
                                            <div className="relative group">
                                                <FileText className="absolute left-5 top-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                                                <textarea
                                                    required
                                                    rows="3"
                                                    placeholder="Briefly explain the postponement factor..."
                                                    className="w-full p-5 pl-14 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:bg-white focus:ring-8 ring-amber-500/5 transition-all outline-none italic placeholder:font-bold placeholder:opacity-30"
                                                    value={formData.reason}
                                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className={`w-full py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 italic flex items-center justify-center gap-4 ${formData.type === 'Complete'
                                    ? 'bg-indigo-600 text-white shadow-indigo-200/50 hover:bg-indigo-700'
                                    : 'bg-amber-600 text-white shadow-amber-200/50 hover:bg-amber-700'
                                    }`}
                            >
                                <GraduationCap size={18} />
                                {formData.type === 'Complete' ? 'Authorize Completion' : 'Authorize Protocol Shift'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exams;
