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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans"
             style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)' }}>
            
            {/* Soft Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
                 style={{ background: 'rgba(20,184,166,0.12)' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
                 style={{ background: 'rgba(245,158,11,0.12)' }}></div>
            
            {/* Subtle Geometric Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"></div>

            <div className="w-full max-w-[540px] relative z-10 animate-in fade-in zoom-in duration-700">
                {/* Brand Identity */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-24 h-24 mb-6 transition-transform hover:scale-110 duration-700 cursor-pointer drop-shadow-2xl">
                        <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-3xl" />
                    </div>
                    <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter italic">MashMagic Hub</h1>
                    <p className="text-[#64748B] font-bold mt-2 uppercase tracking-[0.4em] text-[10px]">Unified Personnel Gateway</p>
                </div>

                {/* Login Card (Glassmorphism) */}
                <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/50 overflow-hidden transform transition-transform hover:scale-[1.005]">
                    
                    {/* Level 1: Premium Department Tabs */}
                    <div className="p-2 bg-[#F1F5F9] m-4 rounded-[20px] flex gap-1">
                        {[
                            { id: 'admin', label: 'Admin' },
                            { id: 'mentor_dept', label: 'Mentor Dept' },
                            { id: 'academic_dept', label: 'Academic Dept' }
                        ].map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => handleDepartmentChange(dept.id)}
                                className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-[14px] relative group
                                    ${activeDepartment === dept.id 
                                        ? 'bg-white text-[#0F766E] shadow-sm' 
                                        : 'text-[#64748B] hover:text-[#0F172A]'}
                                `}
                            >
                                {dept.label}
                                {activeDepartment === dept.id && (
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F59E0B] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="px-10 pb-12 pt-4 relative z-10 min-h-[480px]">

                        {/* Level 2: Sub-Role Toggle */}
                        <div className="flex justify-center mb-10">
                            {activeDepartment === 'mentor_dept' && (
                                <div className="bg-[#F1F5F9] p-1 rounded-xl flex gap-1 border border-slate-200/50">
                                    {[
                                        { id: 'mentor_head', label: 'Mentor Head' },
                                        { id: 'mentor', label: 'Mentor' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-6 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-sm ring-1 ring-slate-100' : 'text-[#64748B] hover:text-[#0F172A]'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeDepartment === 'academic_dept' && (
                                <div className="bg-[#F1F5F9] p-1 rounded-xl flex gap-1 border border-slate-200/50">
                                    {[
                                        { id: 'academic_head', label: 'Academic Head' },
                                        { id: 'faculty', label: 'Faculty' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-6 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-[#0F766E] shadow-sm ring-1 ring-slate-100' : 'text-[#64748B] hover:text-[#0F172A]'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Login/Register Content */}
                        {isRegistering ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-8 flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter italic uppercase">Create {subRole.replace('_', ' ')} Profile</h2>
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-[#0F766E] transition-all hover:rotate-90 active:scale-90"
                                    >
                                        <LogIn size={18} />
                                    </button>
                                </div>
                                <RegistrationForm
                                    preSelectedRole={subRole}
                                    onSuccess={handleRegistrationSuccess}
                                />
                                <div className="mt-8 text-center">
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:text-[#0F766E] transition-colors border-b border-slate-200 hover:border-[#0F766E] leading-loose"
                                    >
                                        Return to Login Interface
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10 text-center">
                                    <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter italic uppercase">
                                        {subRole.replace('_', ' ')} Access
                                    </h2>
                                    <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center justify-center gap-2">
                                        <ShieldCheck size={14} className="text-[#F59E0B]" />
                                        Provide Authorized Credentials
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[380px] mx-auto">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">
                                            {canSignup ? 'Email Address' : 'Identification'}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors">
                                                <Mail size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="identifier"
                                                type="text"
                                                required
                                                className="w-full p-4.5 pl-12 bg-[#F1F5F9] border-2 border-transparent rounded-[16px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 transition-all font-sans"
                                                placeholder={canSignup ? "head@mashmagicedu.com" : "Email or Phone Number"}
                                                value={formData.identifier}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Passcode</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F59E0B] transition-colors">
                                                <Lock size={18} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full p-4.5 pl-12 bg-[#F1F5F9] border-2 border-transparent rounded-[16px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#F59E0B] focus:ring-4 focus:ring-[#F59E0B]/10 transition-all font-sans"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#F59E0B] text-black p-5 rounded-[16px] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-[#FBBF24] transition-all shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3 group mt-4 active:scale-[0.98] disabled:opacity-50 italic"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Authorize Login</span>
                                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1.5" strokeWidth={3} />
                                            </>
                                        )}
                                    </button>

                                    {/* Signup Option for Heads Only */}
                                    {canSignup && (
                                        <div className="mt-6 text-center">
                                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest">
                                                New to {subRole.replace('_', ' ')}? {' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRegistering(true)}
                                                    className="text-[#0F766E] hover:text-[#0F172A] transition-colors font-black underline underline-offset-8 decoration-2 decoration-[#F59E0B]/30"
                                                >
                                                    CREATE {subRole === 'admin' ? 'ACCOUNT' : 'HEAD PROFILE'}
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#64748B]">
                        MashMagic Secured Access v4.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

