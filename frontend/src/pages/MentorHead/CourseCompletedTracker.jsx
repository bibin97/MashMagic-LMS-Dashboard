import React, {  useState, useEffect , useDeferredValue } from 'react';
import axios from 'axios';
import { GraduationCap, CheckCircle2, RotateCcw, Search, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const CourseCompletedTracker = () => {
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
	const deferredSearchTerm = useDeferredValue(searchTerm);
 const [filter, setFilter] = useState('all');

 useEffect(() => {
 fetchStudents();
 }, []);

 const fetchStudents = async () => {
 try {
 const token = sessionStorage.getItem('token');
 const res = await axios.get('/api/mentor-head/students-all', {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.data.success) {
 setStudents((res.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
 }
 } catch (error) {
 toast.error("Failed to load students list");
 } finally {
 setLoading(false);
 }
 };
 </td>
 <td className="p-4">
 <p className="text-xs font-bold text-slate-700">{student.course || 'N/A'}</p>
 <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest mt-0.5">{student.grade || 'N/A'}</p>
 </td>
 <td className="p-4">
 <p className="text-xs font-bold text-slate-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#008080]"></span> {student.mentor_name || 'Unassigned Mentor'}</p>
 <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {student.faculty_name || 'Unassigned Faculty'}</p>
 </td>
 <td className="p-4">
 {isCompleted ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
 <CheckCircle2 size={12} />
 Completed
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
 <RotateCcw size={12} />
 Ongoing
 </span>
 )}
 </td>
 <td className="p-4 text-right">
 <button
 onClick={() => toggleStatus(student.id, isCompleted)}
 className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm hover:scale-105 active:scale-95 uppercase tracking-widest ${isCompleted
 ? 'bg-white border border-rose-200 text-rose-500 hover:bg-rose-50'
 : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300'
 }`}
 >
 {isCompleted ? (
 <>
 <RotateCcw size={14} />
 Undo Completion
 </>
 ) : (
 <>
 <CheckCircle2 size={14} />
 Mark Completed
 </>
 )}
 </button>
 </td>
 </tr>
 );
 }) : (
 <tr>
 <td colSpan="5" className="p-8 text-center text-slate-600 font-bold">
 No students found matching your criteria.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
};

export default CourseCompletedTracker;
