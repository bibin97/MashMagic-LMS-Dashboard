import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import Select from 'react-select';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ExportSingleStudentData = ({ buttonLabel = 'Export Full Data', customClass = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen && studentsList.length === 0) {
      fetchStudentsList();
    }
  }, [isOpen]);

  const fetchStudentsList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students?export=true');
      if (res.data.success) {
        setStudentsList(res.data.data.map(s => ({
          value: s.id,
          label: `${s.name} ${s.registration_number ? `(${s.registration_number})` : ''} - ${s.phone_number || s.contact || ''}`
        })));
      } else {
        const fallback = await api.get('/aoe/dropdown-data');
        if (fallback.data.success && fallback.data.data.students) {
           setStudentsList(fallback.data.data.students.map(s => ({ value: s.id, label: s.name })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch students list", err);
      try {
        const fallback = await api.get('/aoe/dropdown-data');
        if (fallback.data.success && fallback.data.data.students) {
           setStudentsList(fallback.data.data.students.map(s => ({ value: s.id, label: s.name })));
        }
      } catch (err2) {
        toast.error("Failed to load students for export");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student first.");
      return;
    }
    
    setExporting(true);
    const toastId = toast.loading('Fetching student profile and timetable...');
    
    try {
      let student = null;
      try {
        const res = await api.get(`/admin/students/${selectedStudent.value}`);
        student = res.data.data;
      } catch (e) {
        const res = await api.get(`/aoe/students/${selectedStudent.value}`);
        student = res.data.data;
      }

      let fees = null;
      try {
        const feesRes = await api.get(`/admin/fees/student`);
        if (feesRes.data.success) {
          fees = feesRes.data.data.find(f => f.entity_id === parseInt(selectedStudent.value));
        }
      } catch (e) {}

      try {
        const facRes = await api.get(`/admin/students/${selectedStudent.value}/faculty-history`);
        if (facRes.data.success) {
           student.facultyLogs = facRes.data.data;
        }
      } catch (e) {}

      toast.dismiss(toastId);

      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const profileData = [
        { Field: "Student Name", Value: student.name },
        { Field: "Registration Number", Value: student.registration_number || 'N/A' },
        { Field: "Grade", Value: student.grade || 'N/A' },
        { Field: "Course", Value: student.course || 'N/A' },
        { Field: "Syllabus", Value: student.syllabus || 'N/A' },
        { Field: "Contact", Value: student.phone_number || student.contact || 'N/A' },
        { Field: "School Name", Value: student.school_name || 'N/A' },
        { Field: "Country", Value: student.country || 'N/A' },
        { Field: "Admission Date", Value: student.admission_date ? new Date(student.admission_date).toLocaleDateString('en-GB') : 'N/A' },
        { Field: "Mentor", Value: student.mentor_name || student.mentor || 'N/A' },
        { Field: "Assigned Faculty", Value: student.faculty_name || student.faculty || 'N/A' },
        { Field: "Status", Value: student.status || 'N/A' },
        { Field: "Total Paid", Value: `₹${fees ? fees.total_paid_amount : (student.total_paid || 0)}` },
        { Field: "Balance", Value: `₹${fees ? Math.max(0, fees.total_fee - fees.total_paid_amount) : Math.max(0, (student.total_fees || 0) - (student.total_paid || 0))}` }
      ];
      const wsProfile = XLSX.utils.json_to_sheet(profileData);
      wsProfile['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsProfile, "Profile Info");

      if (student.timetable && student.timetable.length > 0) {
        const classData = student.timetable.map(t => ({
          'Session No': t.session_number,
          'Date': new Date(t.date).toLocaleDateString('en-GB'),
          'Time': `${t.start_time} - ${t.end_time}`,
          'Chapter / Topic': t.chapter_topic || t.chapter || 'N/A',
          'Faculty': t.faculty_name || 'N/A',
          'Status': t.status
        }));
        const wsClasses = XLSX.utils.json_to_sheet(classData);
        wsClasses['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsClasses, "Class Details");
      }

      XLSX.writeFile(wb, `${student.name.replace(/\s+/g, '_')}_Full_Data.xlsx`);
      toast.success("Student data exported!");
      setIsOpen(false);
      
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      padding: '4px',
      backgroundColor: '#f8fafc',
      borderColor: state.isFocused ? '#008080' : '#f1f5f9',
      borderRadius: '0.75rem',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(0,128,128,0.2)' : 'none',
      '&:hover': { borderColor: '#008080' },
      fontWeight: '700',
      fontSize: '0.875rem'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#008080' : state.isFocused ? '#f0fdfa' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      fontWeight: '700',
      fontSize: '0.875rem',
      cursor: 'pointer'
    })
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={customClass || "h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 w-full lg:w-auto hover:-translate-y-1 group"}
      >
        <Download size={16} className="group-hover:scale-110 transition-transform" />
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-[90%] max-w-md relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Download className="text-[#008080]" size={20} /> Export Student Data
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                Search and select a student to export their full profile and class details.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block">
                  Search Student
                </label>
                <Select
                  options={studentsList}
                  styles={customSelectStyles}
                  value={selectedStudent}
                  onChange={setSelectedStudent}
                  placeholder={loading ? "Loading students..." : "Search by name or ID..."}
                  isClearable
                  isSearchable
                  isLoading={loading}
                />
              </div>

              <button
                onClick={handleExport}
                disabled={!selectedStudent || exporting}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${!selectedStudent || exporting ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#008080] text-white hover:bg-[#006666] hover:-translate-y-1 shadow-[#008080]/30'}`}
              >
                {exporting ? 'Exporting...' : 'Export Full Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportSingleStudentData;
