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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-transparent relative z-10 font-[Poppins]">
            
            {/* Top Brand Identity - Pixel Perfect to Reference */}
            <div className="text-center mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-12 duration-1000">
                <div className="w-24 h-24 mb-6 group transition-transform hover:scale-110 duration-700 pointer-events-auto bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex items-center justify-center p-4 border border-white">
                    <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-2xl" />
                </div>
                <h1 className="text-[52px] font-black text-slate-950 tracking-[-0.06em] italic-header leading-none mb-3 select-none">MashMagic Hub</h1>
                <p className="text-slate-400 font-extrabold uppercase tracking-[0.5em] text-[10px] select-none">Unified Personnel Gateway</p>
            </div>

            {/* Login Card - Ultra Rounded 'Soap Bar' Aesthetic */}
            <div className="w-full max-w-[540px] glass rounded-[80px] overflow-hidden animate-in fade-in zoom-in duration-1000 relative">
                
                {/* Integrated Dept Shelf */}
                <div className="grid grid-cols-3 bg-slate-100/30 border-b border-white/50">
                    {[
                        { id: 'admin', label: 'Admin Panel' },
                        { id: 'mentor_dept', label: 'Mentor Dept' },
                        { id: 'academic_dept', label: 'Academic Dept' }
                    ].map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => handleDepartmentChange(dept.id)}
                            className={`py-6 text-[10px] font-black uppercase tracking-widest transition-all relative
                                ${activeDepartment === dept.id 
                                    ? 'bg-white text-slate-950 shadow-[0_-1px_0_rgba(0,0,0,0.02)]' 
                                    : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {dept.label}
                            {activeDepartment === dept.id && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-yellow-400 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.5)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-16 pb-20">
                    {isRegistering ? (
                        <div className="animate-in fade-in slide-in-from-right-10 duration-700">
                            <div className="px-6 md:px-10 pb-12 pt-4 relative z-10 min-h-[480px]">
                                <h1 className="text-4xl italic-header text-slate-950 leading-none mb-3">Register Node</h1>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Enrollment Protocol</p>
                            </div>
                            <RegistrationForm
                                preSelectedRole={subRole}
                                onSuccess={handleRegistrationSuccess}
                            />
                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setIsRegistering(false)}
                                    className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-[#14B8A6] transition-colors pb-1 border-b-2 border-transparent hover:border-[#14B8A6]/20"
                                >
                                    ← Return to Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                            {/* Card Heading */}
                            <div className="text-center mb-12">
                                <h2 className="text-[40px] italic-header text-slate-950 leading-none mb-3">
                                    {subRole.replace('_', ' ')} Access
                                </h2>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    Identity Verified Credential
                                </p>
                            </div>

                            {/* Sub-role Toggle - Refined Matching Reference */}
                            {(activeDepartment === 'mentor_dept' || activeDepartment === 'academic_dept') && (
                                <div className="flex justify-center mb-10">
                                    <div className="bg-slate-100/40 p-2 rounded-[32px] flex gap-2 border border-white/40 shadow-inner">
                                        {activeDepartment === 'mentor_dept' ? (
                                            [{ id: 'mentor_head', label: 'Head' }, { id: 'mentor', label: 'Mentor' }].map(role => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => handleSubRoleChange(role.id)}
                                                    className={`px-10 py-3 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all
                                                        ${subRole === role.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                                                    `}
                                                >
                                                    {role.label}
                                                </button>
                                            ))
                                        ) : (
                                            [{ id: 'academic_head', label: 'A.Head' }, { id: 'faculty', label: 'Faculty' }].map(role => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => handleSubRoleChange(role.id)}
                                                    className={`px-10 py-3 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all
                                                        ${subRole === role.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                                                    `}
                                                >
                                                    {role.label}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</h3>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#14B8A6] transition-colors">
                                            <Mail size={22} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            name="identifier"
                                            type="text"
                                            required
                                            className="w-full p-6 pl-16 bg-slate-50/40 border-2 border-transparent rounded-[32px] text-[16px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#14B8A6]/10 focus:ring-[12px] focus:ring-[#14B8A6]/5 transition-all font-sans"
                                            placeholder={canSignup ? "node.admin@mashmagicedu.com" : "Email or Phone Number"}
                                            value={formData.identifier}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Passcode</h3>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#14B8A6] transition-colors">
                                            <Lock size={22} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full p-6 pl-16 bg-slate-50/40 border-2 border-transparent rounded-[32px] text-[16px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#14B8A6]/10 focus:ring-[12px] focus:ring-[#14B8A6]/5 transition-all font-sans"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white p-6 rounded-[32px] italic-header text-[15px] tracking-[0.4em] shadow-[0_20px_50px_rgba(20,184,166,0.25)] hover:shadow-[0_25px_60px_rgba(20,184,166,0.35)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>LOGIN</span>
                                                <ChevronRight size={22} strokeWidth={4} />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {canSignup && (
                                    <div className="text-center mt-10">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                            New {subRole.replace('_', ' ')}?{" "}
                                            <button
                                                type="button"
                                                onClick={() => setIsRegistering(true)}
                                                className="text-yellow-500 font-extrabold hover:text-yellow-600 transition-colors underline underline-offset-4 decoration-2 decoration-yellow-500/20"
                                            >
                                                Create Account
                                            </button>
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Text */}
            <div className="mt-16 opacity-30 select-none">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-900">
                    MashMagic Secured Authorization v1.0
                </p>
            </div>
        </div>
    );
};

export default Login;
