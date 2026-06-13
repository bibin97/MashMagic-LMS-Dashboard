import React, {  useState, useEffect , useDeferredValue } from 'react';
import { 
  Target, Presentation, GraduationCap, TrendingUp, UserMinus, AlertTriangle, 
  Search, ShieldCheck, Activity, Users, BookOpen, Clock, AlertCircle, FileText, CheckCircle2, XCircle, Star, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ParentMeetings from '../AOE/ParentMeetings';

const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedHours = hours.toString().padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

const OperationsHub = ({ section }) => {
  const [activeTab, setActiveTab] = useState(section || 'academic_quality');
  const [searchTerm, setSearchTerm] = useState('');
	const deferredSearchTerm = useDeferredValue(searchTerm);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [courseCompletionTab, setCourseCompletionTab] = useState('mark');

  const [ratingModal, setRatingModal] = useState({
    show: false,
    session: null,
    remarks: '',
    ratings: {
      lighting: 0,
      audioQuality: 0,
      videoQuality: 0,
      internetStability: 0,
      screenSharing: 0,
      writingBoardVisibility: 0,
      virtualBackground: 0,
      devicePositioning: 0
    }
  });
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleRatingChange = (category, value) => {
    setRatingModal(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value
      }
    }));
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    const { session, ratings, remarks } = ratingModal;
    if (!session) return;
    
    // Check that all ratings are filled (must be > 0)
    const missing = Object.entries(ratings).filter(([_, val]) => val === 0);
    if (missing.length > 0) {
      toast.error("Please rate all criteria before submitting");
      return;
    }

    setSubmittingRating(true);
    try {
      // Calculate overall score out of 100
      const values = Object.values(ratings);
      const sum = values.reduce((a, b) => a + b, 0);
      const average = sum / values.length; // out of 5
      const score = Math.round(average * 20); // out of 100

      // Format remarks to include detailed ratings breakdown
      const ratingBreakdown = Object.entries(ratings)
        .map(([key, val]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `${label}: ${val}/5`;
        })
        .join(', ');
      
      const fullRemarks = `[Ratings: ${ratingBreakdown}] Remarks: ${remarks}`;

      const formData = new FormData();
      formData.append('faculty_id', session.faculty_id);
      formData.append('class_topic', session.topic || 'General Session');
      formData.append('score', score);
      formData.append('remarks', fullRemarks);
      if (ratingModal.proofFile) {
        formData.append('proof', ratingModal.proofFile);
      }

      const response = await api.post('/academic-head/faculty-quality', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success("Quality check submitted successfully!");
        setRatingModal({
          show: false,
          session: null,
          remarks: '',
          proofFile: null,
          ratings: {
            lighting: 0,
            audioQuality: 0,
            videoQuality: 0,
            internetStability: 0,
            screenSharing: 0,
            writingBoardVisibility: 0,
            virtualBackground: 0,
            devicePositioning: 0
          }
        });
        // Refresh data
        fetchData('academic_quality');
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      toast.error(error.response?.data?.message || "Failed to submit evaluation");
    } finally {
      setSubmittingRating(false);
    }
  };
  const [rotationModal, setRotationModal] = useState({ show: false, rotation: null, status: 'Called', notes: '', next_call_date: '' });
  const [submittingRotation, setSubmittingRotation] = useState(false);

  const handleRotationSubmit = async (e) => {
    e.preventDefault();
    if (!rotationModal.rotation) return;
    setSubmittingRotation(true);
    try {
      const response = await api.put(`/academic-head/student-rotation/${rotationModal.rotation.id}`, {
        status: rotationModal.status,
        notes: rotationModal.notes,
        next_call_date: rotationModal.next_call_date
      });
      if (response.data.success) {
        toast.success("Rotation updated successfully!");
        setRotationModal({ show: false, rotation: null, status: 'Called', notes: '', next_call_date: '' });
        fetchData('academic_quality');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update rotation");
    } finally {
      setSubmittingRotation(false);
    }
  };
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
    { id: 'course_completions', label: 'Course Completions', icon: <CheckCircle2 size={16} />, color: 'text-teal-500' },
  ];

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'academic_quality') {
        const qualityRes = await api.get('/academic-head/faculty-quality');
        const rotationRes = await api.get('/academic-head/student-rotation');
        setData(prev => ({ 
          ...prev, 
          academic_quality: qualityRes.data.data,
          student_rotation: rotationRes.data.data
        }));
      } else {
        let endpoint = '';
        if (tab === 'parent_meetings') endpoint = '/academic-head/parent-meetings';
        else if (tab === 'exam_scores') endpoint = '/academic-head/exam-scores';
        else if (tab === 'student_growth') endpoint = '/academic-head/student-growth';
        else if (tab === 'faculty_replacement') endpoint = '/academic-head/faculty-replacements';
        else if (tab === 'escalation') endpoint = '/academic-head/escalations';
        else if (tab === 'course_completions') endpoint = '/academic-head/course-completions';

        const response = await api.get(endpoint);
        setData(prev => ({ ...prev, [tab]: response.data.data }));
      }
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


  const renderLiveClassUpdates = () => {
    const evaluations = activeData.evaluations || [];
    const liveSessions = activeData.liveSessions || [];

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Include the Rotation Table directly inside Live Class Updates */}
      {renderStudentRotation()}

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Live Class Observations</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Join active sessions to monitor faculty quality</p>
        </div>
        <button onClick={() => handleAction("Join Random Class")} className="px-6 py-3 bg-[#008080] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#008080]/20 hover:-translate-y-1 transition-all">
          Join Random Live Class
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Currently Scheduled Sessions</h3>
        {liveSessions.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No live sessions scheduled for today.</p>}
        <div className="space-y-3">
          {liveSessions.map((session, i) => (
            <div key={session.id || i} className="bg-emerald-50/30 p-4 md:p-6 rounded-[2rem] border border-emerald-100/70 hover:shadow-lg hover:shadow-emerald-100/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[9px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-1.5">
                    {formatTime12Hour(session.start_time)} - {formatTime12Hour(session.end_time)}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase truncate">{session.student_name}</h3>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 md:gap-12 flex-1 justify-start md:justify-center">
                <div className="min-w-[120px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faculty</p>
                  <p className="text-xs font-bold text-slate-700 uppercase mt-0.5 truncate">{session.faculty_name || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject</p>
                  <span className="inline-block text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-2.5 py-1 rounded-lg mt-0.5">
                    {session.topic || 'General Session'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end shrink-0">
                {session.meeting_link ? (
                  <a href={session.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-black bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors shadow-sm group">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    <span className="uppercase tracking-widest text-[9px]">Live</span>
                  </a>
                ) : (
                  <span className="flex items-center gap-2 text-xs font-black bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-400">
                    <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                    <span className="uppercase tracking-widest text-[9px]">Offline</span>
                  </span>
                )}
                
                <button 
                  onClick={() => {
                    if (!session.faculty_id) {
                      toast.error("Cannot evaluate: Faculty not assigned to this session.");
                      return;
                    }
                    setRatingModal({ 
                      show: true, 
                      session, 
                      remarks: '', 
                      proofFile: null,
                      ratings: { 
                        lighting: 0, 
                        audioQuality: 0, 
                        videoQuality: 0, 
                        internetStability: 0, 
                        screenSharing: 0, 
                        writingBoardVisibility: 0, 
                        virtualBackground: 0, 
                        devicePositioning: 0 
                      } 
                    });
                  }}
                  className="text-[9px] font-black text-white bg-[#008080] px-4 py-2.5 rounded-xl hover:bg-[#006666] uppercase tracking-widest transition-all shadow-md shadow-[#008080]/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Updates
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Recent Quality Evaluations</h3>
        {evaluations.length === 0 && !loading && <p className="text-xs font-bold text-slate-400 p-4">No evaluations available.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map((item, i) => (
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

      {ratingModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <Star className="text-amber-500 fill-amber-500" size={24} /> Evaluation Updates
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Evaluating {ratingModal.session?.student_name}'s Session ({ratingModal.session?.faculty_name})
                </p>
              </div>
              <button 
                onClick={() => setRatingModal({ ...ratingModal, show: false })} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRatingSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'lighting', label: 'Lighting' },
                  { key: 'audioQuality', label: 'Audio Quality' },
                  { key: 'videoQuality', label: 'Video Quality' },
                  { key: 'internetStability', label: 'Internet Stability' },
                  { key: 'screenSharing', label: 'Screen Sharing' },
                  { key: 'writingBoardVisibility', label: 'Writing Board Visibility' },
                  { key: 'virtualBackground', label: 'Virtual Background' },
                  { key: 'devicePositioning', label: 'Device Positioning' }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider pl-1">{item.label}</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(item.key, star)}
                          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star 
                            className={`w-6 h-6 transition-colors ${
                              star <= ratingModal.ratings[item.key] 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-slate-200 hover:text-amber-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Remarks / Assessment</label>
                <textarea 
                  value={ratingModal.remarks}
                  onChange={(e) => setRatingModal({...ratingModal, remarks: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#008080]/10 outline-none transition-all"
                  rows="3"
                  placeholder="Enter final observation remarks..."
                  required
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Evaluation Proof (Optional)</label>
                <input 
                  type="file"
                  onChange={(e) => setRatingModal({...ratingModal, proofFile: e.target.files[0]})}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#008080]/10 file:text-[#008080] hover:file:bg-[#008080]/20 transition-all outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setRatingModal({ ...ratingModal, show: false })} 
                  className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingRating}
                  className="px-8 py-3 bg-[#008080] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#008080]/20 hover:bg-[#006666] transition-colors disabled:opacity-50"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderStudentRotation = () => {
    const rotationData = data['student_rotation'] || [];
    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Daily Student Subject Rotation</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Students to monitor today</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Round Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subject Count</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Phone</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rotationData.length === 0 && !loading && (
                <tr><td colSpan="7" className="py-6 text-center text-xs font-bold text-slate-400">No rotation data available for today.</td></tr>
              )}
              {rotationData.map((rotation) => {
                const subjectIndex = rotation.total_subjects > 0 ? ((rotation.round_number - 1) % rotation.total_subjects) + 1 : 0;
                return (
                <tr key={rotation.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-black text-slate-900 uppercase">{rotation.student_name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{rotation.subject_name || 'General'}</td>
                  <td className="px-6 py-4 text-xs font-black text-indigo-600">Round {rotation.round_number}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{subjectIndex}/{rotation.total_subjects}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{rotation.phone_number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${rotation.status === 'Called' ? 'bg-emerald-100 text-emerald-700' : rotation.status === 'Missed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {rotation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setRotationModal({ show: true, rotation, status: rotation.status, notes: rotation.notes || '', next_call_date: rotation.next_call_date ? new Date(rotation.next_call_date).toISOString().split('T')[0] : '' })}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {rotationModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <Activity className="text-indigo-500" /> Update Rotation Status
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Student: {rotationModal.rotation?.student_name}
                </p>
              </div>
              <button onClick={() => setRotationModal({ ...rotationModal, show: false })} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRotationSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Call Status</label>
                <select 
                  value={rotationModal.status}
                  onChange={(e) => setRotationModal({...rotationModal, status: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="Pending">Pending</option>
                  <option value="Called">Called</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Next Call Date</label>
                <input 
                  type="date"
                  value={rotationModal.next_call_date}
                  onChange={(e) => setRotationModal({...rotationModal, next_call_date: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Call Notes / Updates</label>
                <textarea 
                  value={rotationModal.notes}
                  onChange={(e) => setRotationModal({...rotationModal, notes: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  rows="3"
                  placeholder="Enter details from the call..."
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={() => setRotationModal({ ...rotationModal, show: false })} className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700">Cancel</button>
                <button type="submit" disabled={submittingRotation} className="px-8 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors disabled:opacity-50">
                  {submittingRotation ? 'Saving...' : 'Save Update'}
                </button>
              </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderParentsMeeting = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ParentMeetings isEmbedded={true} />
    </div>
  );

  const renderExamScores = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Institution-wide Exam Scores</h2>
        <div className="w-full overflow-x-auto">
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

  const [completionModal, setCompletionModal] = useState({ show: false, studentId: null, remarks: '', file: null });

  const handleCourseCompletionSubmit = async (e) => {
    e.preventDefault();
    if (!completionModal.file) return toast.error("Please upload a completion document");

    const formData = new FormData();
    formData.append('remarks', completionModal.remarks);
    formData.append('completion_file', completionModal.file);

    try {
      const response = await api.post(`/academic-head/course-completions/${completionModal.studentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success("Course marked as completed!");
        setCompletionModal({ show: false, studentId: null, remarks: '', file: null });
        fetchData('course_completions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark completion");
    }
  };

  const renderCourseCompletions = () => {
    const filteredData = activeData.filter(item => {
      if (courseCompletionTab === 'completed') return item.course_completed;
      if (courseCompletionTab === 'in_progress') return !item.course_completed;
      return true; // 'mark' tab shows all, or you could change logic if you only want to show in_progress here
    });

    const totalCount = activeData.length;
    const completedCount = activeData.filter(s => s.course_completed).length;
    const inProgressCount = totalCount - completedCount;

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex-1 text-center shadow-sm">
          <p className="text-3xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Total</p>
        </div>
        <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100 flex-1 text-center shadow-sm">
          <p className="text-3xl font-black text-teal-600">{completedCount}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-500 mt-1">Course Completed</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex-1 text-center shadow-sm">
          <p className="text-3xl font-black text-amber-600">{inProgressCount}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">In Progress</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
          <GraduationCap className="text-teal-500" /> Student Course Completions
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4">
          <button
            onClick={() => setCourseCompletionTab('mark')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${courseCompletionTab === 'mark' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Mark Completions
          </button>
          <button
            onClick={() => setCourseCompletionTab('completed')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${courseCompletionTab === 'completed' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Course Completed
          </button>
          <button
            onClick={() => setCourseCompletionTab('in_progress')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${courseCompletionTab === 'in_progress' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            In Progress
          </button>
        </div>

        <div className="w-full overflow-x-auto">
<table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Course / Subject</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mentor & Faculty</th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              {courseCompletionTab === 'mark' && <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 && !loading && <tr><td colSpan="5" className="py-4 text-xs font-bold text-slate-400">No students found.</td></tr>}
            {filteredData.map((item) => (
              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-4 text-xs font-black text-slate-900 uppercase">{item.name}</td>
                <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.course} / {item.subject}</td>
                <td className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.mentor_name || 'N/A'} <br/> {item.faculty_name || 'N/A'}</td>
                <td className="py-4">
                  {item.course_completed ? (
                    <span className="text-[9px] font-black bg-teal-100 text-teal-600 px-2 py-1 rounded-full uppercase tracking-widest flex items-center w-fit gap-1"><CheckCircle2 size={12}/> Completed</span>
                  ) : (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase tracking-widest flex items-center w-fit gap-1"><Activity size={12}/> In Progress</span>
                  )}
                </td>
                {courseCompletionTab === 'mark' && (
                <td className="py-4">
                  {!item.course_completed ? (
                    <button 
                      onClick={() => setCompletionModal({ show: true, studentId: item.id, remarks: '', file: null })}
                      className="px-4 py-2 bg-teal-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-colors"
                    >
                      Mark Complete
                    </button>
                  ) : (
                    item.completion_file && (
                      <a href={`http://localhost:5000${item.completion_file}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                        View File
                      </a>
                    )
                  )}
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
</div>
      </div>

      {completionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <CheckCircle2 className="text-teal-500" /> Complete Course
              </h2>
              <button onClick={() => setCompletionModal({ ...completionModal, show: false })} className="text-slate-400 hover:text-rose-500 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleCourseCompletionSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Remarks / Assessment</label>
                <textarea 
                  value={completionModal.remarks}
                  onChange={(e) => setCompletionModal({...completionModal, remarks: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                  rows="3"
                  placeholder="Enter final remarks..."
                  required
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Upload Certificate / File</label>
                <input 
                  type="file"
                  onChange={(e) => setCompletionModal({...completionModal, file: e.target.files[0]})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200 focus:outline-none"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={() => setCompletionModal({ ...completionModal, show: false })} className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-700">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-colors">Submit Completion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
  };

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
            {activeTab === 'academic_quality' && renderLiveClassUpdates()}
            {activeTab === 'faculty_rotation' && renderFacultyRotation()}
            {activeTab === 'parent_meetings' && renderParentsMeeting()}
            {activeTab === 'exam_scores' && renderExamScores()}
            {activeTab === 'student_growth' && renderStudentGrowth()}
            {activeTab === 'faculty_replacement' && renderFacultyReplacement()}
            {activeTab === 'escalation' && renderEscalation()}
            {activeTab === 'course_completions' && renderCourseCompletions()}
          </>
        )}
      </div>
    </div>
  );
};

export default OperationsHub;
