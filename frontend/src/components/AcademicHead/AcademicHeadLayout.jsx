import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { 
 LayoutDashboard, 
 Activity, 
 UserPlus, 
 GraduationCap, 
 Users, 
 Briefcase, 
 ShieldAlert 
} from 'lucide-react';

const AcademicHeadLayout = () => {
 const location = useLocation();
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [isCollapsed, setIsCollapsed] = useState(false);

 const navItems = [
 { path: '/academic-head/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
 { path: '/academic-head/actions', icon: <Activity size={18} />, label: 'Actions Center' },
 { path: '/academic-head/registrations', icon: <UserPlus size={18} />, label: 'Registrations' },
 { path: '/academic-head/students', icon: <GraduationCap size={18} />, label: 'Students' },
 { path: '/academic-head/mentors', icon: <Users size={18} />, label: 'Mentors' },
 { path: '/academic-head/faculties', icon: <Briefcase size={18} />, label: 'Faculties' },
 { path: '/academic-head/live-monitoring', icon: <Activity size={18} />, label: 'Live Monitoring' },
 { path: '/academic-head/tasks', icon: <Briefcase size={18} />, label: 'Workforce Tasks' },
 { path: '/academic-head/checking', icon: <ShieldAlert size={18} />, label: 'Institutional Audit' },
 ];

 return (
 <div className="flex min-h-screen relative overflow-hidden" 
 style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
 {/* Mobile Overlay */}
 {isSidebarOpen && (
 <div 
 className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}
 
 <Sidebar 
 isOpen={isSidebarOpen} 
 setIsOpen={setIsSidebarOpen} 
 isCollapsed={isCollapsed} 
 setIsCollapsed={setIsCollapsed} 
 navItems={navItems}
 title="Academic Head"
 />
 
  <div className={`flex-1 flex flex-col min-w-0 w-full h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'md:ml-[88px]' : 'md:ml-72'}`}>
    <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
    <main className="p-4 md:p-10 overflow-x-hidden w-full max-w-full">
      <AnimatePresence mode="wait">
 <motion.div
 key={location.pathname}
 initial={{ opacity: 0, y: 15, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -15, scale: 0.98 }}
 transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
 className="w-full h-full"
 >
 <Outlet />
 </motion.div>
 </AnimatePresence>
 </main>
 </div>
 </div>
 );
};

export default AcademicHeadLayout;
