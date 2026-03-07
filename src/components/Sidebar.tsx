import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Search,
    CheckCircle,
    Award,
    Map,
    HelpCircle,
    MessageSquare,
    TrendingUp,
    Brain,
    X,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavLink {
    name: string;
    path: string;
    icon: LucideIcon;
}

interface NavGroup {
    label: string;
    links: NavLink[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        links: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Progress', path: '/progress', icon: TrendingUp },
        ],
    },
    {
        label: 'Resume Tools',
        links: [
            { name: 'Resume Builder', path: '/resume-builder', icon: FileText },
            { name: 'Resume Analyzer', path: '/resume', icon: Search },
        ],
    },
    {
        label: 'Assessment',
        links: [
            { name: 'Evaluate Skills', path: '/evaluating', icon: CheckCircle },
            { name: 'Eligibility', path: '/eligibility', icon: Award },
            { name: 'Quiz', path: '/quiz', icon: HelpCircle },
        ],
    },
    {
        label: 'Career Prep',
        links: [
            { name: 'Roadmap', path: '/roadmap', icon: Map },
            { name: 'Mock Interview', path: '/interview', icon: MessageSquare },
        ],
    },
];

const sidebarVariants: Variants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        x: -280,
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

const groupVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.3, ease: 'easeOut' },
    }),
};

interface SidebarContentProps {
    setIsOpen: (val: boolean) => void;
    currentPath: string;
    isMobile?: boolean;
}

const SidebarContent = ({ setIsOpen, currentPath, isMobile }: SidebarContentProps) => {
    const isActive = (path: string) => currentPath === path;

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Background glow blobs - Removed for performance */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full pointer-events-none transform-gpu" />

            {/* Brand Header */}
            <div className="p-5 border-b border-white/[0.04]">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-lg group-hover:bg-indigo-500/30 transition-all duration-500" />
                        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold gradient-text tracking-tight">VidyaMitra</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">AI Career Coach</span>
                    </div>
                </Link>

                {/* Mobile close button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-5 right-4 md:hidden p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto relative z-10">
                {navGroups.map((group, groupIndex) => (
                    <motion.div
                        key={group.label}
                        custom={groupIndex}
                        variants={groupVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500/80">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.links.map((link) => {
                                const Icon = link.icon;
                                const active = isActive(link.path);
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 group/link focus:outline-none ${active
                                            ? 'text-white'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        {/* Active state background with glow */}
                                        {active && (
                                            <motion.div
                                                layoutId={`sidebar-active-${isMobile ? 'mobile' : 'desktop'}`}
                                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/[0.12] to-cyan-500/[0.06] border border-indigo-500/20"
                                                style={{
                                                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                                                }}
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        )}

                                        <div className={`relative z-10 p-1 rounded-lg transition-all duration-300 ${active
                                            ? 'text-indigo-400'
                                            : 'text-slate-500 group-hover/link:text-slate-400'
                                            }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>

                                        <span className="relative z-10 flex-1">{link.name}</span>

                                        {active && (
                                            <ChevronRight className="relative z-10 h-3.5 w-3.5 text-indigo-400/60" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </nav>

            {/* Bottom AI Promo Card */}
            <div className="p-3 mt-auto">
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 border border-indigo-500/10">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-300">AI Powered</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Your personalized career coach, powered by advanced AI.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
    const location = useLocation();

    return (
        <>
            {/* Desktop Sidebar - always visible */}
            <aside className="hidden md:block w-[260px] min-w-[260px] bg-[#060b18] shadow-xl border-r border-white/[0.04] relative">
                <SidebarContent setIsOpen={setIsOpen} currentPath={location.pathname} isMobile={false} />
            </aside>

            {/* Mobile Sidebar - animated overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.aside
                            variants={sidebarVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#060b18] border-r border-white/[0.04] shadow-2xl md:hidden transform-gpu"
                        >
                            <SidebarContent setIsOpen={setIsOpen} currentPath={location.pathname} isMobile={true} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
