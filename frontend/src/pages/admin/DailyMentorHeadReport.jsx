import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Calendar,
    Target,
    Users,
    CheckCircle2,
    ShieldAlert,
    DownloadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const DailyMentorHeadReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReport();
    }, [filterDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/mentor-head-report?date=${filterDate}`);

            if (res.data.success) {
                setReportData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error("Failed to load Mentor Head Report");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Preparing report...',
                success: 'Report downloaded successfully!',
                error: 'Failed to download report',
            }
        );
    };

    const handleRowClick = (row) => {
        setSelectedReport(row);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                        <Target className="text-[#008080]" />
                        Daily Verification Report
                    </h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 text-slate-500">
                        Monitor daily student verifications and accountability across mentor heads
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-4 focus:ring-[#008080] transition-all hover:border-[#008080]"
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#008080]/30 hover:bg-[#008080] hover:-translate-y-0.5 transition-all"
                    >
                        <DownloadCloud size={18} />
                        Export
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-tl-xl rounded-bl-xl">Date</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentor Head Name</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Students</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Checked Today</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center rounded-tr-xl rounded-br-xl">Remaining</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold animate-pulse">
                                        Loading report data...
                                    </td>
                                </tr>
                            ) : reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                                        No Mentor Heads found for this date.
                                    </td>
                                </tr>
                            ) : (
                                reportData.map((row, idx) => (
                                    <tr 
                                        key={idx} 
                                        onClick={() => handleRowClick(row)}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4 text-xs font-bold text-slate-500">
                                            {new Date(row.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#008080]/10 text-[#008080] flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">
                                                    {row.mentorHeadName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{row.mentorHeadName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-sm font-black border border-slate-100">
                                                <Users size={14} className="text-slate-400" />
                                                {row.totalStudents}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-black border border-emerald-100">
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                {row.checkedToday}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm font-black border border-rose-100">
                                                <ShieldAlert size={14} className="text-rose-500" />
                                                {row.remaining}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Verification Details"
                size="lg"
            >
                {selectedReport && (
                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{selectedReport.mentorHeadName}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(selectedReport.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest">
                                    Checked: {selectedReport.checkedToday}
                                </span>
                                <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-widest">
                                    Remaining: {selectedReport.remaining}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Checked Students List */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Checked Students
                                </h4>
                                <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {selectedReport.checkedStudents?.length > 0 ? (
                                        <ul className="divide-y divide-emerald-50">
                                            {selectedReport.checkedStudents.map(student => (
                                                <li key={student.id} className="p-4 hover:bg-emerald-50/30 transition-colors flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-slate-700">{student.name}</span>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{student.registration_number || 'No Reg #'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-6 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                            No students checked
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remaining Students List */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldAlert size={14} /> Remaining Students
                                </h4>
                                <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {selectedReport.remainingStudents?.length > 0 ? (
                                        <ul className="divide-y divide-rose-50">
                                            {selectedReport.remainingStudents.map(student => (
                                                <li key={student.id} className="p-4 hover:bg-rose-50/30 transition-colors flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-slate-700">{student.name}</span>
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{student.registration_number || 'No Reg #'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-6 text-center text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                            All Complete
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DailyMentorHeadReport;
