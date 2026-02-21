import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MessageSquare, CheckCircle, ArrowLeft, Target, AlertCircle, BarChart3, CloudLightning, FileText, Camera, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const FacultyInteractionLog = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const sessionFromState = location.state?.session;
    // If not from session, we might need manual input for student_id etc. 
    // But usually flows from student list or timetable.

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        student_id: sessionFromState?.student_id || '',
        session_id: sessionFromState?.id || '', // Optional
        date: new Date().toISOString().split('T')[0],
        session_number: sessionFromState?.session_number || '',
        chapter: '',
        session_type: 'Regular', // or Remedial, Doubt Clearing
        topics_covered: '',
        student_performance: 'Good',
        homework_given: '',
        homework_status: 'Pending',
        issues_reported: '',
        mentor_action: '',
        parent_update_needed: false,
        notes: '',
        screenshot_url: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/mentor/faculty-log', formData);
            toast.success("Faculty Interaction Log Saved Successfully");
            navigate('/mentor/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || "Logging failed");
        } finally {
            setLoading(false);
        }
    };

    // If no student_id (manual access), maybe redirect back or show error, 
    // but for now I'll assume it's accessed with context or allow manual Entry?
    // I'll show a warning if no student_id but allow edit if they know ID (unlikely).
    // Better to validat.
    if (!formData.student_id) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-slate-200">
                    <AlertCircle size={48} className="mx-auto text-rose-200 mb-6" />
                    <h2 className="text-xl font-black text-slate-800 mb-2">Missing Context</h2>
                    <p className="text-slate-400 font-bold mb-8 italic">Please select a student or session to log.</p>
                    <button onClick={() => navigate('/mentor/students')} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 italic transition-all active:scale-95">Select Student</button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 p-6 pb-20">
            <button onClick={() => navigate('/mentor/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-colors mb-4">
                <ArrowLeft size={16} /> Cancel Logging
            </button>

            <header className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600 rounded-full -mr-40 -mt-40 opacity-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-purple-200/50">
                            <Layers size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Faculty Interaction Log</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Date: {formData.date}</p>
                        </div>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-10 md:p-14 rounded-[4rem] shadow-xl shadow-slate-100 border border-slate-50 space-y-12">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><BookOpen size={12} /> Chapter</label>
                        <input
                            name="chapter"
                            type="text"
                            required
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                            placeholder="e.g. Calculus I"
                            value={formData.chapter}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={12} /> Session Type</label>
                        <select
                            name="session_type"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                            value={formData.session_type}
                            onChange={handleChange}
                        >
                            {['Regular', 'Remedial', 'Doubt Clearing', 'Assessment'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">Session Number</label>
                        <input
                            name="session_number"
                            type="number"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                            placeholder="e.g. 5"
                            value={formData.session_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12} /> Student Performance</label>
                        <select
                            name="student_performance"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                            value={formData.student_performance}
                            onChange={handleChange}
                        >
                            {['Excellent', 'Good', 'Average', 'Poor', 'Concerned'].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-emerald-600 pl-4 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" /> Homework & Tasks
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Homework Given</label>
                            <textarea
                                name="homework_given"
                                rows="2"
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-purple-50 transition-all font-semibold text-slate-700"
                                value={formData.homework_given}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Homework Status (Previous)</label>
                            <select
                                name="homework_status"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                                value={formData.homework_status}
                                onChange={handleChange}
                            >
                                {['Completed', 'Partial', 'Not Done', 'N/A'].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4 flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" /> Session Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topics Covered</label>
                            <textarea
                                name="topics_covered"
                                rows="3"
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all font-semibold text-slate-700"
                                value={formData.topics_covered}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issues Reported</label>
                            <textarea
                                name="issues_reported"
                                rows="3"
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all font-semibold text-slate-700"
                                value={formData.issues_reported}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mentor Action / Remedial Plan</label>
                            <textarea
                                name="mentor_action"
                                rows="3"
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all font-semibold text-slate-700"
                                value={formData.mentor_action}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">General Notes</label>
                            <textarea
                                name="notes"
                                rows="3"
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all font-semibold text-slate-700"
                                value={formData.notes}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                        <input
                            type="checkbox"
                            name="parent_update_needed"
                            className="w-6 h-6 rounded-lg border-2 border-slate-200 text-purple-600 focus:ring-0 transition-all cursor-pointer"
                            checked={formData.parent_update_needed}
                            onChange={handleChange}
                        />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Parent Update Needed?</span>
                    </label>

                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 mt-4"><Camera size={12} /> Screenshot URL</label>
                    <input
                        type="url"
                        name="screenshot_url"
                        placeholder="https://..."
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-purple-50 transition-all font-bold text-slate-700"
                        value={formData.screenshot_url}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 text-white p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-purple-200/50 hover:bg-purple-700 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-4 italic active:scale-[0.98]"
                >
                    {loading ? 'Transmitting...' : 'Save Faculty Log'}
                    {!loading && <CheckCircle size={24} className="rotate-3" />}
                </button>
            </form>
        </div>
    );
};

export default FacultyInteractionLog;
