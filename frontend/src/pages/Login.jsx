import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, ChevronRight, LogIn, ArrowRight } from 'lucide-react';
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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-[#14B8A6]/30"
             style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' }}>
            
            {/* Soft Glowing Light Effects */}
            <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none opacity-60 animate-pulse duration-5000"
                 style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35), transparent 70%)' }}></div>
            <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none opacity-60 animate-pulse duration-7000"
                 style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)' }}></div>
            
            {/* Subtle Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"></div>

            <div className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in duration-1000">
                {/* Brand Identity */}
                <div className="text-center mb-12 flex flex-col items-center">
                    <div className="w-20 h-20 mb-8 transition-all hover:scale-110 hover:-rotate-6 duration-700 cursor-pointer drop-shadow-[0_20px_40px_rgba(20,184,166,0.3)] group">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-[24px] border-2 border-white/80 shadow-2xl" />
                    </div>
                    <h1 className="text-5xl font-black text-[#1E293B] tracking-tighter italic leading-none">MashMagic</h1>
                    <p className="text-[#64748B] font-black mt-3 uppercase tracking-[0.5em] text-[10px] opacity-80 flex items-center gap-4">
                        <span className="w-8 h-[1px] bg-[#CBD5E1]"></span>
                        Enterprise Gateway
                        <span className="w-8 h-[1px] bg-[#CBD5E1]"></span>
                    </p>
                </div>

                {/* Login Card (Premium Glassmorphism) */}
                <div className="bg-white/92 backdrop-blur-[24px] rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden transform transition-all hover:translate-y-[-4px] hover:shadow-[0_50px_120px_rgba(0,0,0,0.12)]">
                    
                    {/* Role Selection Tabs */}
                    <div className="p-1.5 bg-[#F1F5F9]/50 m-6 rounded-[22px] flex gap-1 border border-[#E2E8F0]/30">
                        {[
                            { id: 'admin', label: 'Admin' },
                            { id: 'mentor_dept', label: 'Mentor Dept' },
                            { id: 'academic_dept', label: 'Academic Dept' }
                        ].map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => handleDepartmentChange(dept.id)}
                                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all rounded-[18px] relative
                                    ${activeDepartment === dept.id 
                                        ? 'bg-white text-[#0F766E] shadow-xl shadow-slate-200/50' 
                                        : 'text-[#94A3B8] hover:text-[#475569]'}
                                `}
                            >
                                {dept.label}
                                {activeDepartment === dept.id && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#F59E0B] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="px-12 pb-14 pt-4 relative z-10 min-h-[500px]">

                        {/* Optional Level 2 Role Toggle */}
                        <div className="flex justify-center mb-12">
                            {activeDepartment === 'mentor_dept' && (
                                <div className="bg-[#F8FAFC] p-1.5 rounded-[20px] flex gap-1.5 border border-[#F1F5F9]">
                                    {[
                                        { id: 'mentor_head', label: 'Head' },
                                        { id: 'mentor', label: 'Mentor' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-8 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-md ring-1 ring-[#F1F5F9]' : 'text-[#94A3B8] hover:text-[#64748B]'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeDepartment === 'academic_dept' && (
                                <div className="bg-[#F8FAFC] p-1.5 rounded-[20px] flex gap-1.5 border border-[#F1F5F9]">
                                    {[
                                        { id: 'academic_head', label: 'Academic Head' },
                                        { id: 'faculty', label: 'Faculty' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-8 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-md ring-1 ring-[#F1F5F9]' : 'text-[#94A3B8] hover:text-[#64748B]'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Animated Content Area */}
                        {isRegistering ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="mb-10 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-[#1E293B] tracking-tighter italic uppercase">Join Node</h2>
                                        <p className="text-[#94A3B8] text-[9px] font-black uppercase tracking-[0.3em] mt-1">Initializing Personnel Profile</p>
                                    </div>
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="w-12 h-12 flex items-center justify-center rounded-[18px] bg-slate-50 text-slate-400 hover:text-[#14B8A6] hover:bg-[#14B8A6]/5 transition-all border border-transparent hover:border-[#14B8A6]/10"
                                    >
                                        <ArrowRight className="rotate-180" size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <RegistrationForm
                                    preSelectedRole={subRole}
                                    onSuccess={handleRegistrationSuccess}
                                />
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.3em] hover:text-[#14B8A6] transition-colors group"
                                    >
                                        Return to Secure Login <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="mb-12 text-center">
                                    <h2 className="text-4xl font-black text-[#1E293B] tracking-tighter italic uppercase leading-tight">
                                        Secure Access
                                    </h2>
                                    <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.4em] mt-3 flex items-center justify-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.8)]"></div>
                                        Authorized Credentials Required
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-7 max-w-[400px] mx-auto">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.25em] ml-1 opacity-70">
                                            {canSignup ? 'System Identity (Email)' : 'Identification'}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#14B8A6] transition-colors">
                                                <Mail size={20} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="identifier"
                                                type="text"
                                                required
                                                className="w-full p-5 pl-14 bg-[#F1F5F9]/50 border-2 border-transparent rounded-[20px] text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B] focus:ring-8 focus:ring-[#F59E0B]/5 transition-all"
                                                placeholder={canSignup ? "node.admin@mashmagicedu.com" : "Email or Phone Number"}
                                                value={formData.identifier}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.25em] ml-1 opacity-70">Passcode Protocol</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#14B8A6] transition-colors">
                                                <Lock size={20} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full p-5 pl-14 bg-[#F1F5F9]/50 border-2 border-transparent rounded-[20px] text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B] focus:ring-8 focus:ring-[#F59E0B]/5 transition-all"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white p-5 rounded-[20px] font-black text-[13px] uppercase tracking-[0.3em] overflow-hidden relative group active:scale-95 transition-all shadow-[0_20px_40px_rgba(20,184,166,0.25)] hover:shadow-[0_25px_50px_rgba(20,184,166,0.35)] disabled:opacity-50 italic"
                                        >
                                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                                            <div className="relative z-10 flex items-center justify-center gap-4">
                                                {isSubmitting ? (
                                                    <Loader2 size={22} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Authenticate Profile</span>
                                                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-2" strokeWidth={3} />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Action Footnote */}
                                    {canSignup && (
                                        <div className="mt-10 text-center">
                                            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                                New Node? 
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRegistering(true)}
                                                    className="text-[#14B8A6] hover:text-[#0F172A] transition-all font-black underline underline-offset-8 decoration-2 decoration-[#F59E0B]/40 hover:decoration-[#F59E0B]"
                                                >
                                                    INITIALIZE {subRole === 'admin' ? 'ACCOUNT' : 'HEAD PROFILE'}
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Security Badge */}
                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#94A3B8] opacity-60">
                        MashMagic Secure Layer v4.2.0 • SHA-512 Encrypted
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

