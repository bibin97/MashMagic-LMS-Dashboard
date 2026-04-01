import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import RegistrationForm from '../components/RegistrationForm';

const Login = () => {
    // Top-level tabs: 'admin', 'mentor_dept', 'academic_dept'
    const [activeDepartment, setActiveDepartment] = useState('admin');

    // Sub-roles within departments
    const [subRole, setSubRole] = useState('admin');

    // Registration toggle
    const [isRegistering, setIsRegistering] = useState(false);

    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Default sub-roles when switching departments
    const handleDepartmentChange = (dept) => {
        setActiveDepartment(dept);
        setIsRegistering(false);
        setFormData({ identifier: '', password: '' });

        // Set default sub-role based on department
        if (dept === 'mentor_dept') setSubRole('mentor_head');
        else if (dept === 'academic_dept') setSubRole('academic_head');
        else setSubRole('admin');
    };

    const handleSubRoleChange = (role) => {
        setSubRole(role);
        setIsRegistering(false);
        setFormData({ identifier: '', password: '' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegistrationSuccess = () => {
        setIsRegistering(false);
        toast.success("Account created successfully! Please login.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const user = await login(formData.identifier, formData.password, activeDepartment);
            const role = user.role?.toLowerCase().trim();

            toast.success(`Welcome back, ${user.name}!`);

            // Explicit redirection based on role
            if (role === 'super_admin' || role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'mentor_head') {
                navigate('/mentor-head/dashboard');
            } else if (role === 'mentor') {
                navigate('/mentor/dashboard');
            } else if (role === 'faculty') {
                navigate('/faculty/dashboard');
            } else if (role === 'academic_head') {
                navigate('/academic-head/dashboard');
            } else if (role === 'student' || role === 'user') {
                navigate('/student/dashboard');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Login failed.";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to determine if current subRole allows signup
    const canSignup = ['admin', 'mentor_head', 'academic_head'].includes(subRole);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none"
             style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' }}>
            
            {/* Soft Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[140px] pointer-events-none"
                 style={{ background: 'rgba(20,184,166,0.12)' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[140px] pointer-events-none"
                 style={{ background: 'rgba(245,158,11,0.12)' }}></div>
            
            {/* Subtle Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"></div>

            <div className="w-full max-w-[500px] relative z-10 animate-in fade-in zoom-in duration-700 flex flex-col items-center">
                
                {/* Brand Identity */}
                <div className="text-center mb-10 flex flex-col items-center w-full px-4">
                    <div className="w-20 h-20 mb-6 drop-shadow-2xl transition-transform hover:scale-110 duration-700 cursor-pointer bg-white rounded-3xl p-4 border border-white shadow-xl shadow-slate-200">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <h1 className="text-[40px] sm:text-5xl font-black text-[#0F172A] tracking-tighter italic leading-none">MashMagic Hub</h1>
                    <p className="text-[#64748B] font-extrabold mt-3 uppercase tracking-[0.4em] text-[9px] sm:text-[10px]">Unified Personnel Gateway</p>
                </div>

                {/* Login Card (Glassmorphism) */}
                <div className="w-full bg-white/90 backdrop-blur-2xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white relative overflow-hidden">
                    
                    {/* Dept Tabs Section - Truly Responsive */}
                    <div className="p-1 sm:p-1.5 bg-[#F1F5F9]/80 m-4 sm:m-6 rounded-[22px] flex gap-1 border border-slate-200/50">
                        {[
                            { id: 'admin', label: 'Admin' },
                            { id: 'mentor_dept', label: 'Mentor' },
                            { id: 'academic_dept', label: 'Academic' }
                        ].map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => handleDepartmentChange(dept.id)}
                                className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all rounded-[16px] relative flex flex-col items-center justify-center
                                    ${activeDepartment === dept.id 
                                        ? 'bg-white text-[#0F766E] shadow-sm' 
                                        : 'text-[#64748B] hover:text-[#0F172A]'}
                                `}
                            >
                                <span className="relative z-10">{dept.label}</span>
                                {activeDepartment === dept.id && (
                                    <div className="absolute bottom-1 w-6 h-[2.5px] bg-[#F59E0B] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="px-5 sm:px-12 pb-12 pt-2 relative min-h-[440px] flex flex-col">

                        {/* Role Selectors */}
                        <div className="flex justify-center mb-10 w-full overflow-x-auto no-scrollbar px-2">
                            {(activeDepartment === 'mentor_dept' || activeDepartment === 'academic_dept') && (
                                <div className="bg-[#F1F5F9]/50 p-1 rounded-xl flex gap-1 border border-slate-200/30 shrink-0">
                                    {activeDepartment === 'mentor_dept' ? (
                                        [{ id: 'mentor_head', label: 'Mentor Head' }, { id: 'mentor', label: 'Mentor' }].map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => handleSubRoleChange(role.id)}
                                                className={`px-5 sm:px-8 py-2.5 rounded-[10px] text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                                    ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}
                                                `}
                                            >
                                                {role.label}
                                            </button>
                                        ))
                                    ) : (
                                        [{ id: 'academic_head', label: 'A. Head' }, { id: 'faculty', label: 'Faculty' }].map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => handleSubRoleChange(role.id)}
                                                className={`px-5 sm:px-8 py-2.5 rounded-[10px] text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap
                                                    ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}
                                                `}
                                            >
                                                {role.label}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {isRegistering ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex-1">
                                <div className="mb-8 flex items-center justify-between px-2">
                                    <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tighter italic uppercase">Identity Setup</h2>
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-[#0F766E] transition-all"
                                    >
                                        <LogIn size={18} />
                                    </button>
                                </div>
                                <div className="w-full">
                                    <RegistrationForm
                                        preSelectedRole={subRole}
                                        onSuccess={handleRegistrationSuccess}
                                    />
                                </div>
                                <div className="mt-8 text-center pb-4">
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:text-[#0F766E] transition-colors border-b border-slate-200 hover:border-[#0F766E]"
                                    >
                                        Back to Vault Login
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col justify-center">
                                <div className="mb-10 text-center">
                                    <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tighter italic uppercase leading-tight">
                                        Vault Access
                                    </h2>
                                    <p className="text-[#64748B] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] mt-3 flex items-center justify-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse"></div>
                                        Verified Identity Portal
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-[360px] mx-auto">
                                    <div className="space-y-2.5">
                                        <label className="text-[9px] sm:text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Credential Name</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors">
                                                <Mail size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="identifier"
                                                type="text"
                                                required
                                                className="w-full p-4 pl-12 bg-[#F1F5F9]/60 border-2 border-transparent rounded-[18px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B]/30 focus:ring-4 focus:ring-[#F59E0B]/5 transition-all text-center sm:text-left"
                                                placeholder={canSignup ? "node.access@mashmagic.com" : "Email or Phone"}
                                                value={formData.identifier}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[9px] sm:text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Access Passcode</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors">
                                                <Lock size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full p-4 pl-12 bg-[#F1F5F9]/60 border-2 border-transparent rounded-[18px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B]/30 focus:ring-4 focus:ring-[#F59E0B]/5 transition-all font-sans text-center sm:text-left"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#F59E0B] text-black py-4.5 rounded-[18px] font-black text-[11px] sm:text-[12px] uppercase tracking-[0.3em] hover:bg-[#FBBF24] transition-all shadow-[0_12px_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-3 group mt-4 active:scale-[0.97] disabled:opacity-50 italic h-[60px]"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Authorize Gateway</span>
                                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" strokeWidth={3} />
                                            </>
                                        )}
                                    </button>

                                    {canSignup && (
                                        <div className="mt-8 text-center">
                                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest leading-loose">
                                                Unregistered {subRole.replace('_', ' ')}? {' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRegistering(true)}
                                                    className="text-[#0F766E] hover:text-[#0F172A] transition-colors font-black border-b-2 border-[#0F766E]/20 hover:border-[#0F766E] pb-0.5"
                                                >
                                                    CREATE PROFILE
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center opacity-30">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#64748B]">
                        MashMagic Secured Authorization v4.2
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

