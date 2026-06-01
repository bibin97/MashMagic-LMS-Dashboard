import React, { useState, useEffect } from 'react';
import { 
  Target, Presentation, GraduationCap, TrendingUp, UserMinus, AlertTriangle, 
  Search, ShieldCheck, Activity, Users, BookOpen, Clock, AlertCircle, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const OperationsHub = ({ section }) => {
  const [activeTab, setActiveTab] = useState(section || 'academic_quality');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(section);
  }, [section]);

  const tabs = [
    { id: 'academic_quality', label: 'Academic Quality', icon: <Target size={16} />, color: 'text-indigo-500' },
    { id: 'parent_meetings', label: 'Parents Meeting', icon: <Presentation size={16} />, color: 'text-emerald-500' },
    { id: 'exam_scores', label: 'Exam Scores', icon: <FileText size={16} />, color: 'text-blue-500' },
    { id: 'student_growth', label: 'Growth Monitor', icon: <TrendingUp size={16} />, color: 'text-violet-500' },
    { id: 'faculty_replacement', label: 'Faculty Replacement', icon: <UserMinus size={16} />, color: 'text-rose-500' },
    { id: 'escalation', label: 'Escalations', icon: <AlertTriangle size={16} />, color: 'text-amber-500' },
  ];

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      let endpoint = '';
      if (tab === 'academic_quality') endpoint = '/operations-executive/faculty-quality';
      else if (tab === 'parent_meetings') endpoint = '/operations-executive/parent-meetings';
      else if (tab === 'exam_scores') endpoint = '/operations-executive/exam-scores';
      else if (tab === 'student_growth') endpoint = '/operations-executive/student-growth';
      else if (tab === 'faculty_replacement') endpoint = '/operations-executive/faculty-replacements';
      else if (tab === 'escalation') endpoint = '/operations-executive/escalations';

      const response = await api.get(endpoint);
      setData(prev => ({ ...prev, [tab]: response.data.data }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to load ${tab.replace('_', ' ')} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const activeData = data[activeTab] || [];

  const handleAction = (message) => {
    toast("Action Registered: " + message, { icon: "✅" });
  };

  // Render Functions
  const renderAcademicQuality = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Live Class Observations</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Join active sessions to monitor faculty quality</p>
        </div>
        <button onClick={() => handleAction("Join Random Class")} className="px-6 py-3 bg-[#008080] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#008080]/20 hover:-translate-y-1 transition-all">
          Join Random Live Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeData.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No data available.</p>}
        {activeData.map((item, i) => (
          <div key={item.id || i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Activity size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase">{item.faculty_name}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{item.class_topic}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[9px] font-black text-[#008080] uppercase tracking-widest">Score: {item.score}/100</span>
              <button className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest underline underline-offset-4">View Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderParentsMeeting = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Scheduled Parent Meetings</h2>
        <div className="space-y-4">
          {activeData.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No meetings scheduled.</p>}
          {activeData.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Users size={16} /></div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">Parent of {item.student_name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status: {item.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200">{new Date(item.meeting_date).toLocaleDateString()}, {item.meeting_time}</span>
                <button className="px-4 py-2 bg-[#008080] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors">Join</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExamScores = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Institution-wide Exam Scores</h2>
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exam Name</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
            </tr>
          </thead>
          <tbody>
            {activeData.length === 0 && !loading && <tr><td colSpan="4" className="py-4 text-xs font-bold text-slate-400">No exam scores available.</td></tr>}
            {activeData.map((item, i) => (
              <tr key={item.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-4 text-xs font-black text-slate-900 uppercase">{item.student_name}</td>
                <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.subject || 'General'}</td>
                <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.exam_name || 'Unit Test'}</td>
                <td className="py-4 text-xs font-black text-[#008080]">{item.score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStudentGrowth = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-24 h-24 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mb-6">
          <TrendingUp size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Student Growth Analytics</h2>
        <p className="text-slate-500 font-medium max-w-md mt-2">Currently tracking {activeData.length} active students.</p>
        <button onClick={() => fetchData('student_growth')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all">
          Generate Latest Report
        </button>
      </div>
    </div>
  );

  const renderFacultyReplacement = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
          <UserMinus className="text-rose-500" /> Pending Replacement Decisions
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeData.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No replacements requested.</p>}
          {activeData.map((item, i) => (
            <div key={item.id || i} className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl">{item.status}</div>
              <h3 className="text-sm font-black text-slate-900 uppercase">{item.faculty_name}</h3>
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-600"><span className="text-rose-500">Reason:</span> {item.reason}</p>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => handleAction("Approve")} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Approve Replacement
                </button>
                <button onClick={() => handleAction("Reject")} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEscalation = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
          <AlertTriangle className="text-amber-500" /> Escalation Desk
        </h2>
        <div className="space-y-4">
          {activeData.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No escalations active.</p>}
          {activeData.map((item, i) => (
            <div key={item.id || i} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-amber-50/50 rounded-2xl border border-amber-100 gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{item.priority} Priority</span>
                    <span className="text-[10px] font-bold text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{item.issue_type}</h3>
                  <p className="text-[11px] font-medium text-slate-600 mt-1 max-w-2xl">{item.description}</p>
                </div>
              </div>
              <button onClick={() => handleAction("Resolve")} className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors whitespace-nowrap self-end md:self-center">
                Resolve Issue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-[#008080] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#008080] rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Operations Hub</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Centralized Control & Quality Assurance</p>
          </div>
        </div>
        <div className="flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <Search size={16} className="text-slate-400 ml-3" />
          <input 
            type="text" 
            placeholder="Search operations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest pl-3 pr-4 py-2 placeholder:text-slate-400 w-48"
          />
        </div>
      </div>

      {/* Render Active Section */}
      <div className="min-h-[500px]">
        {loading && <div className="text-center py-12"><div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
        {!loading && (
          <>
            {activeTab === 'academic_quality' && renderAcademicQuality()}
            {activeTab === 'parent_meetings' && renderParentsMeeting()}
            {activeTab === 'exam_scores' && renderExamScores()}
            {activeTab === 'student_growth' && renderStudentGrowth()}
            {activeTab === 'faculty_replacement' && renderFacultyReplacement()}
            {activeTab === 'escalation' && renderEscalation()}
          </>
        )}
      </div>
    </div>
  );
};

export default OperationsHub;
