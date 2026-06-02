import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CalendarDays, ListTodo, Plus, Target, Presentation, 
  Video, RefreshCcw, Save, XCircle, Search, Clock, DollarSign, User, BookOpen 
} from 'lucide-react';

const AOEDemoSchedule = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [demoList, setDemoList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    student_type: 'new',
    subject: '',
    faculty_id: '',
    start_time: '',
    end_time: '',
    hour_rate: ''
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [evalData, setEvalData] = useState({
    prep_score: 0,
    comm_score: 0,
    concept_score: 0,
    engage_score: 0,
    parent_score: 0,
    remarks: ''
  });

  const totalScore = 
    (Number(evalData.prep_score) || 0) + 
    (Number(evalData.comm_score) || 0) + 
    (Number(evalData.concept_score) || 0) + 
    (Number(evalData.engage_score) || 0) + 
    (Number(evalData.parent_score) || 0);

  useEffect(() => {
    fetchFaculties();
    fetchDemos();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/academic-operation-executive/dropdowns');
      if (response.data.success && response.data.data.faculties) {
        setFaculties(response.data.data.faculties);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/academic-operation-executive/demo-schedules');
      if (response.data.success) {
        setDemoList(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch demo schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!formData.faculty_id) {
      toast.error('Please select a faculty');
      return;
    }
    
    try {
      await api.post('/academic-operation-executive/demo-schedules', formData);
      toast.success('Demo Schedule Created Successfully');
      setFormData({
        student_name: '',
        student_type: 'new',
        subject: '',
        faculty_id: '',
        start_time: '',
        end_time: '',
        hour_rate: ''
      });
      fetchDemos();
      setActiveTab('list');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
    }
  };

  const openEvaluationModal = (demo) => {
    setSelectedDemo(demo);
    setEvalData({
      prep_score: demo.prep_score || 0,
      comm_score: demo.comm_score || 0,
      concept_score: demo.concept_score || 0,
      engage_score: demo.engage_score || 0,
      parent_score: demo.parent_score || 0,
      remarks: demo.remarks || ''
    });
    setShowModal(true);
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/academic-operation-executive/demo-schedules/${selectedDemo.id}/evaluate`, evalData);
      toast.success('Evaluation submitted successfully');
      setShowModal(false);
      fetchDemos();
    } catch (error) {
      toast.error('Failed to submit evaluation');
    }
  };

  const filteredDemos = demoList.filter(d => 
    d.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-[#008080]">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#008080] rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group hover:rotate-0 transition-all duration-500">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Demo Management</h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Schedule and evaluate student demos</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-4 p-2 bg-slate-50/80 backdrop-blur-md rounded-[2rem] border border-slate-200 shadow-inner">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 min-w-[200px] py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'schedule'
              ? 'bg-white text-[#008080] shadow-md border-b-2 border-b-[#008080]'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Plus size={16} /> Schedule Demo
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 min-w-[200px] py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'list'
              ? 'bg-white text-[#008080] shadow-md border-b-2 border-b-[#008080]'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <ListTodo size={16} /> Demo List
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'schedule' ? (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
            <Target className="text-[#008080]" /> New Demo Schedule
          </h2>
          
          <form onSubmit={handleCreateSchedule} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12}/> Student Name *
                </label>
                <input
                  type="text" required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="Enter student name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Target size={12}/> Student Type *
                </label>
                <select
                  required
                  value={formData.student_type}
                  onChange={(e) => setFormData({ ...formData, student_type: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                >
                  <option value="new">New Student</option>
                  <option value="existing">Existing Student</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={12}/> Subject *
                </label>
                <input
                  type="text" required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="E.g., Mathematics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Presentation size={12}/> Faculty *
                </label>
                <select
                  required
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name} - {f.subject}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={12}/> Start Time *
                </label>
                <input
                  type="time" required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={12}/> End Time *
                </label>
                <input
                  type="time" required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <DollarSign size={12}/> Hourly Rate
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={formData.hour_rate}
                  onChange={(e) => setFormData({ ...formData, hour_rate: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                type="submit"
                className="px-10 py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#006666] transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Schedule
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <ListTodo className="text-[#008080]" /> Scheduled Demos
            </h2>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search student or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[300px] pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 focus:ring-4 ring-[#008080]/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredDemos.length === 0 ? (
            <div className="text-center p-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No demo schedules found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDemos.map(demo => (
                <div key={demo.id} className={`p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-lg ${demo.status === 'completed' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">
                        Demo #{demo.id}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">{demo.student_name}</h3>
                      <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest">{demo.student_type} Student</p>
                    </div>
                    {demo.status === 'completed' ? (
                      <div className="text-center">
                        <span className="block text-[20px] font-black text-emerald-600">{demo.total_score}/50</span>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Score</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black px-3 py-1 bg-amber-100 text-amber-600 rounded-full uppercase tracking-widest">Pending</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6 text-xs font-bold text-slate-600">
                    <p className="flex items-center gap-2"><BookOpen size={14} className="text-slate-400"/> {demo.subject}</p>
                    <p className="flex items-center gap-2"><Presentation size={14} className="text-slate-400"/> {demo.faculty_name}</p>
                    <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400"/> {demo.start_time} - {demo.end_time}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Video size={14}/> Live
                    </button>
                    <button 
                      onClick={() => openEvaluationModal(demo)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${demo.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                      <RefreshCcw size={14}/> {demo.status === 'completed' ? 'View/Edit' : 'Update'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Modal */}
      {showModal && selectedDemo && (
        <div className="fixed inset-0 bg-[#008080]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Evaluate Demo</h2>
                <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest mt-1">
                  {selectedDemo.student_name} • {selectedDemo.faculty_name}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleEvaluationSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
              
              <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 text-center mb-8">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Total Score</p>
                <h3 className="text-4xl font-black text-indigo-900">{totalScore} <span className="text-xl text-indigo-400">/ 50</span></h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Preparation', field: 'prep_score' },
                  { label: 'Communication', field: 'comm_score' },
                  { label: 'Concept Delivery', field: 'concept_score' },
                  { label: 'Student Engagement', field: 'engage_score' },
                  { label: 'Parent Response', field: 'parent_score' },
                ].map((item) => (
                  <div key={item.field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex justify-between">
                      <span>{item.label}</span>
                      <span className="text-[#008080]">out of 10</span>
                    </label>
                    <input
                      type="number" min="0" max="10" required
                      value={evalData[item.field]}
                      onChange={(e) => setEvalData({...evalData, [item.field]: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Remarks</label>
                <textarea
                  rows="3"
                  value={evalData.remarks}
                  onChange={(e) => setEvalData({...evalData, remarks: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="Add your remarks about the demo..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#006666] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AOEDemoSchedule;
