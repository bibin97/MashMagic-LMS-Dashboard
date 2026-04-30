import React, { useState, useEffect } from 'react';
import axios from '../../services/api';
import { 
  ClipboardList, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  X,
  FileText,
  Activity,
  Smile,
  Zap,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const FacultyDailyUpdate = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [step, setStep] = useState(0); // 0: Select Student, 1: Fill Form
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    class_duration: '',
    topic_taught: '',
    homework_given: 'No',
    homework_details: '',
    attention_level: 'Medium',
    participation_level: 'Moderate',
    understanding_level: 'Average',
    issue_flag: 'No',
    issue_type: '',
    faculty_files: []
  });

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      const res = await axios.get('/faculty/students');
      // Include all students assigned to this faculty
      setStudents(res.data.data);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadData = new FormData();
    files.forEach(file => uploadData.append('files', file));

    try {
      // Reusing the upload endpoint from mentor-logs or creating a new one
      const res = await axios.post('/mentor-logs/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        faculty_files: [...prev.faculty_files, ...res.data.urls]
      }));
      toast.success("Files uploaded successfully");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url) => {
    setFormData(prev => ({
      ...prev,
      faculty_files: prev.faculty_files.filter(f => f !== url)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.topic_taught || !formData.class_duration) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/faculty-tracking/class-update', {
        ...formData,
        student_id: selectedStudent.id
      });
      toast.success("Daily Class Update Submitted Successfully");
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setSelectedStudent(null);
    setFormData({
      subject: '',
      date: new Date().toISOString().split('T')[0],
      class_duration: '',
      topic_taught: '',
      homework_given: 'No',
      homework_details: '',
      attention_level: 'Medium',
      participation_level: 'Moderate',
      understanding_level: 'Average',
      issue_flag: 'No',
      issue_type: '',
      faculty_files: []
    });
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Activity className="animate-spin text-[#008080]" /></div>;

  if (step === 0) {
    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[32px] border border-white/60 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">Daily Class Protocol</h2>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#008080] animate-pulse"></div>
              MANDATORY UPDATE FOR ALL STUDENTS
            </p>
          </div>
          <div className="w-16 h-16 bg-[#008080] text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-[#008080]/30">
            <ClipboardList size={32} strokeWidth={2.5} />
          </div>
        </div>

        {students.length === 0 ? (
          <div className="bg-white p-20 rounded-[32px] text-center border border-slate-100 shadow-xl">
             <Users size={48} className="mx-auto text-slate-200 mb-6" />
             <h3 className="text-xl font-black text-slate-900 uppercase">No Students Assigned</h3>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">You have no active students assigned to your roster.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {students.map(student => (
              <div 
                key={student.id}
                onClick={() => { setSelectedStudent(student); setStep(1); }}
                className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-[16px] flex items-center justify-center text-slate-600 group-hover:text-[#008080] group-hover:bg-[#008080]/10 transition-all">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight">{student.name}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{student.enrollment_type || 'General Student'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                   <span className="text-[10px] font-black text-[#008080] uppercase tracking-widest">Start Daily Log</span>
                   <CheckCircle2 size={16} className="text-[#008080]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
           <button onClick={resetForm} className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-all">
             <X size={20} />
           </button>
           <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1">{selectedStudent.name}</h3>
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Daily Class Update • {new Date().toLocaleDateString()}</p>
           </div>
        </div>
        <div className="bg-[#008080]/10 px-5 py-3 rounded-[16px] border border-[#008080]/20 flex items-center gap-3">
           <Zap size={18} className="text-[#008080] fill-[#008080]" />
           <span className="text-[10px] font-black text-[#008080] uppercase tracking-widest">Active Session</span>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[32px] border border-white shadow-xl shadow-slate-200/50 space-y-12">
        
        {/* Section 1: Class Details */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">01</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Class Details</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Subject</label>
                <input 
                  type="text"
                  placeholder="e.g. Mathematics"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Class Duration</label>
                <input 
                  type="text"
                  placeholder="e.g. 1 Hour"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                  value={formData.class_duration}
                  onChange={e => setFormData({...formData, class_duration: e.target.value})}
                />
              </div>
           </div>
        </div>

        {/* Section 2: Academic Update */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">02</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Academic Update</h3>
           </div>
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Topic Taught</label>
                <textarea 
                  rows={2}
                  placeholder="Describe the main topics covered in this session..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 resize-none"
                  value={formData.topic_taught}
                  onChange={e => setFormData({...formData, topic_taught: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Homework Given?</label>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(v => (
                        <button 
                          key={v}
                          onClick={() => setFormData({...formData, homework_given: v})}
                          className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${formData.homework_given === v ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                 </div>
                 {formData.homework_given === 'Yes' && (
                    <div className="md:col-span-2 space-y-2 animate-in slide-in-from-left-4 duration-300">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Homework Details</label>
                      <input 
                        type="text"
                        placeholder="e.g. Exercise 2.4, Questions 1 to 10"
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                        value={formData.homework_details}
                        onChange={e => setFormData({...formData, homework_details: e.target.value})}
                      />
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Section 3: Class Observation */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">03</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Observation</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Attention Level</label>
                 <select 
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                   value={formData.attention_level}
                   onChange={e => setFormData({...formData, attention_level: e.target.value})}
                 >
                   <option>High</option>
                   <option>Medium</option>
                   <option>Low</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Participation</label>
                 <select 
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                   value={formData.participation_level}
                   onChange={e => setFormData({...formData, participation_level: e.target.value})}
                 >
                   <option>Active</option>
                   <option>Moderate</option>
                   <option>Passive</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Understanding</label>
                 <select 
                   className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10"
                   value={formData.understanding_level}
                   onChange={e => setFormData({...formData, understanding_level: e.target.value})}
                 >
                   <option>Good</option>
                   <option>Average</option>
                   <option>Poor</option>
                 </select>
              </div>
           </div>
        </div>

        {/* Section 4: Issue Flag */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">04</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Issue Reporting</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 text-rose-500">Flag an Issue?</label>
                 <div className="flex gap-2">
                    {['Yes', 'No'].map(v => (
                      <button 
                        key={v}
                        onClick={() => setFormData({...formData, issue_flag: v})}
                        className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${formData.issue_flag === v ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                      >
                        {v}
                      </button>
                    ))}
                 </div>
              </div>
              {formData.issue_flag === 'Yes' && (
                <div className="md:col-span-2 space-y-2 animate-in slide-in-from-left-4 duration-300">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Issue Type</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-rose-500/10"
                     value={formData.issue_type}
                     onChange={e => setFormData({...formData, issue_type: e.target.value})}
                   >
                     <option value="">Select issue category...</option>
                     <option>Concept difficulty</option>
                     <option>Not attentive</option>
                     <option>Homework not done</option>
                     <option>Slow learning</option>
                     <option>Behaviour issue</option>
                   </select>
                </div>
              )}
           </div>
        </div>

        {/* Section 5: Files */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-xs font-black">05</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Proof / Attachments</h3>
           </div>
           <div className="space-y-6">
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] p-10 text-center group hover:bg-[#008080]/5 hover:border-[#008080]/30 transition-all relative">
                <input 
                  type="file" 
                  multiple 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-3">
                   <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-[#008080] shadow-sm transition-all">
                      {uploading ? <Activity className="animate-spin" /> : <Upload size={28} />}
                   </div>
                   <div>
                     <p className="font-black text-slate-900 uppercase tracking-tight">Upload Class Evidence</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Images, PDFs or Audio (Mandatory if issue flagged)</p>
                   </div>
                </div>
              </div>

              {formData.faculty_files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.faculty_files.map((file, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative group">
                       <button 
                         onClick={() => removeFile(file)}
                         className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                       >
                         <X size={12} />
                       </button>
                       {file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                         <img src={file} className="w-full h-20 object-cover rounded-xl" alt="" />
                       ) : (
                         <div className="w-full h-20 bg-slate-50 rounded-xl flex items-center justify-center text-[#008080]">
                            <FileText size={24} />
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="flex gap-6">
         <button 
           onClick={resetForm}
           className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
         >
            Cancel Session
         </button>
         <button 
           onClick={handleSubmit}
           disabled={submitting}
           className="flex-[2] py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
         >
            {submitting ? "INITIALIZING UPLOAD..." : "SUBMIT CLASS UPDATE"} <CheckCircle2 size={18} />
         </button>
      </div>
    </div>
  );
};

export default FacultyDailyUpdate;
