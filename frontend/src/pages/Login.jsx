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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent relative z-10">
            
            {/* Top Brand Identity - Exact Match to Image */}
            <div className="text-center mb-10 flex flex-col items-center animate-in fade-in slide-in-from-top-10 duration-1000">
                <div className="w-20 h-20 mb-6 group transition-transform hover:scale-110 duration-700 pointer-events-auto">
                    <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-[24px] shadow-2xl" />
                </div>
                <h1 className="text-[44px] font-black text-slate-900 tracking-tighter italic leading-none mb-2 select-none">MashMagic Hub</h1>
                <p className="text-slate-400 font-extrabold uppercase tracking-[0.4em] text-[10px] select-none">Unified Personnel Gateway</p>
            </div>

            {/* Login Card - Ultra Premium Glassmorphism */}
            <div className="w-full max-w-[500px] glass rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in zoom-in duration-1000 relative">
                
                {/* Recessed Dept Tabs */}
                <div className="grid grid-cols-3 bg-slate-100/40 border-b border-white/40">
                    {[
                        { id: 'admin', label: 'Admin Panel' },
                        { id: 'mentor_dept', label: 'Mentor Dept' },
                        { id: 'academic_dept', label: 'Academic Dept' }
                    ].map((dept) => (
                        <button
                            key={dept.id}
                            onClick={() => handleDepartmentChange(dept.id)}
                            className={`py-5 text-[10px] font-black uppercase tracking-widest transition-all relative
                                ${activeDepartment === dept.id 
                                    ? 'bg-white text-slate-900' 
                                    : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {dept.label}
                            {activeDepartment === dept.id && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-12 pb-16">
                    {isRegistering ? (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-2">Register Node</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Enrollment Protocol</p>
                            </div>
                            <RegistrationForm
                                preSelectedRole={subRole}
                                onSuccess={handleRegistrationSuccess}
                            />
                            <div className="mt-10 text-center">
                                <button
                                    onClick={() => setIsRegistering(false)}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#14B8A6] transition-colors"
                                >
                                    ← Back to Secure Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {/* Card Heading */}
                            <div className="text-center mb-10">
                                <h2 className="text-[32px] font-black text-slate-900 tracking-tighter italic uppercase leading-none mb-2">
                                    {subRole.replace('_', ' ')} Access
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                                    Identity Verified Credential
                                </p>
                            </div>

                            {/* Sub-role Toggle for Departments */}
                            {(activeDepartment === 'mentor_dept' || activeDepartment === 'academic_dept') && (
                                <div className="flex justify-center mb-8">
                                    <div className="bg-slate-100/60 p-1.5 rounded-2xl flex gap-1.5 border border-white/50">
                                        {activeDepartment === 'mentor_dept' ? (
                                            [{ id: 'mentor_head', label: 'Head' }, { id: 'mentor', label: 'Mentor' }].map(role => (
                                                <button
                                                    key={role.id}
                                                    onClick={() => handleSubRoleChange(role.id)}
                                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                                        ${subRole === role.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
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
                                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                                        ${subRole === role.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                                                    `}
                                                >
                                                    {role.label}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</h3>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#14B8A6] transition-colors">
                                            <Mail size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            name="identifier"
                                            type="text"
                                            required
                                            className="w-full p-5 pl-14 bg-slate-50/50 border border-slate-100 rounded-[24px] text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-[#14B8A6]/5 transition-all font-inter"
                                            placeholder={canSignup ? "node.admin@mashmagicedu.com" : "Email or Phone Number"}
                                            value={formData.identifier}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Passcode</h3>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#14B8A6] transition-colors">
                                            <Lock size={18} strokeWidth={2.5} />
                                        </div>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="w-full p-5 pl-14 bg-slate-50/50 border border-slate-100 rounded-[24px] text-[15px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-8 focus:ring-[#14B8A6]/5 transition-all font-inter"
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
                                        className="w-full bg-[#14B8A6] hover:bg-[#0F766E] text-white p-5 rounded-[22px] font-black text-[13px] uppercase tracking-[0.3em] shadow-[0_15px_35px_rgba(20,184,166,0.2)] hover:shadow-[0_20px_45px_rgba(20,184,166,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 italic"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>LOGIN</span>
                                                <ChevronRight size={20} strokeWidth={3} />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {canSignup && (
                                    <div className="text-center mt-6">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            New {subRole.replace('_', ' ')}?{" "}
                                            <button
                                                type="button"
                                                onClick={() => setIsRegistering(true)}
                                                className="text-yellow-500 hover:text-yellow-600 transition-colors underline underline-offset-4 decoration-2 decoration-yellow-500/30"
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
            <div className="mt-12 opacity-30 select-none">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">
                    MashMagic Secured Authorization v1.0
                </p>
            </div>
        </div>
    );
};

export default Login;
