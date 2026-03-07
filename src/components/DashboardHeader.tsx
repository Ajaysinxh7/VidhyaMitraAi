import { Link, useLocation } from 'react-router-dom';
import { Brain, Menu, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

// Apple-style overshoot easing for a satisfying "landing"
const dropEase = [0.34, 1.56, 0.64, 1] as const;

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const dropItemVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, ease: dropEase },
    },
};

export default function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, signOut } = useAuth();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-30 bg-[#030712]/60 backdrop-blur-xl border-b border-white/[0.04] h-16">
            <motion.div
                key={location.pathname}
                className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex items-center gap-4">
                    <motion.div variants={dropItemVariants}>
                        <button
                            onClick={onMenuClick}
                            className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 focus:outline-none transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </motion.div>

                    <motion.div variants={dropItemVariants}>
                        {/* Mobile Logo Only - Desktop shows in Sidebar */}
                        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105 group md:hidden">
                            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                VidyaMitra
                            </span>
                        </Link>
                    </motion.div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <motion.div variants={dropItemVariants} className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-semibold text-slate-200">{user?.user_metadata?.name || 'User'}</span>
                        <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">{user?.user_metadata?.role || 'Student'}</span>
                    </motion.div>
                    <motion.div variants={dropItemVariants}>
                        <button className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center hover:border-indigo-500/50 hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] transition-all duration-300 group overflow-hidden relative">
                            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <UserIcon className="h-4.5 w-4.5 text-slate-400 group-hover:text-indigo-400 relative z-10 transition-colors" />
                        </button>
                    </motion.div>
                    <motion.div variants={dropItemVariants}>
                        <button
                            onClick={signOut}
                            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 ml-1 group relative overflow-hidden"
                            title="Logout"
                        >
                            <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <LogOut className="h-4.5 w-4.5 relative z-10" />
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </header>
    );
}
