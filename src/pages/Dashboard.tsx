import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
    FileText,
    Search,
    CheckCircle,
    Award,
    Map,
    HelpCircle,
    MessageSquare,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Zap,
    Target,
    Activity,
    Brain,
    Bot
} from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
};

export default function Dashboard() {
    const { user } = useAuth();
    const firstName = user?.user_metadata?.name ? user.user_metadata.name.split(' ')[0] : 'User';

    const insights = [
        { label: "Resume Score", value: "85%", icon: FileText, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-500/20" },
        { label: "Quiz Accuracy", value: "92%", icon: Target, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/20" },
        { label: "Roadmap Progress", value: "40%", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-500/20" },
        { label: "Interview Readiness", value: "Strong", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-500/20" },
    ];

    const modules = [
        {
            title: "Resume Building",
            description: "Create a professional, ATS-friendly resume tailored to top-tier companies.",
            icon: FileText,
            link: "/resume-builder",
            colors: {
                from: "from-blue-500",
                to: "to-indigo-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_var(--color-primary-light)]",
                bgHover: "hover:bg-blue-500/5",
                borderHover: "hover:border-blue-500/30"
            }
        },
        {
            title: "Resume Analyzing",
            description: "Get targeted AI feedback, keyword optimization, and an impact score.",
            icon: Search,
            link: "/resume",
            colors: {
                from: "from-emerald-400",
                to: "to-teal-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)]",
                bgHover: "hover:bg-emerald-500/5",
                borderHover: "hover:border-emerald-500/30"
            }
        },
        {
            title: "Evaluating Skills",
            description: "Benchmark your abilities against industry standards and gap analysis.",
            icon: CheckCircle,
            link: "/evaluating",
            colors: {
                from: "from-purple-500",
                to: "to-pink-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]",
                bgHover: "hover:bg-purple-500/5",
                borderHover: "hover:border-purple-500/30"
            }
        },
        {
            title: "Eligibility Check",
            description: "Instantly verify if you meet the criteria for specific tech roles.",
            icon: Award,
            link: "/eligibility",
            colors: {
                from: "from-amber-400",
                to: "to-orange-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]",
                bgHover: "hover:bg-amber-500/5",
                borderHover: "hover:border-amber-500/30"
            }
        },
        {
            title: "Career Roadmap",
            description: "Your personalized step-by-step path from learning to getting hired.",
            icon: Map,
            link: "/roadmap",
            colors: {
                from: "from-cyan-400",
                to: "to-blue-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]",
                bgHover: "hover:bg-cyan-500/5",
                borderHover: "hover:border-cyan-500/30"
            }
        },
        {
            title: "Knowledge Quiz",
            description: "Sharpen your CS fundamentals with adaptive, timed quizzes.",
            icon: HelpCircle,
            link: "/quiz",
            colors: {
                from: "from-rose-400",
                to: "to-red-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(251,113,133,0.3)]",
                bgHover: "hover:bg-rose-500/5",
                borderHover: "hover:border-rose-500/30"
            }
        },
        {
            title: "Mock Interview",
            description: "Practice behavioral and technical rounds with an AI interviewer.",
            icon: MessageSquare,
            link: "/interview",
            colors: {
                from: "from-violet-500",
                to: "to-fuchsia-500",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]",
                bgHover: "hover:bg-violet-500/5",
                borderHover: "hover:border-violet-500/30"
            }
        },
        {
            title: "Progress Tracking",
            description: "Monitor milestones, streaks, and overall platform performance.",
            icon: TrendingUp,
            link: "/progress",
            colors: {
                from: "from-indigo-400",
                to: "to-cyan-400",
                glow: "group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]",
                bgHover: "hover:bg-indigo-500/5",
                borderHover: "hover:border-indigo-500/30"
            }
        }
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full relative pb-20"
        >
            {/* AI Assistant Floating Button */}
            <div className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 float transform-gpu">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 group focus:outline-none"
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none will-change-opacity" />
                    <Bot className="h-6 w-6 relative z-10" />
                </motion.button>
            </div>

            {/* Hero Section */}
            <motion.div variants={itemVariants} className="mb-10 relative">
                <div className="glass-strong rounded-3xl p-8 relative overflow-hidden border border-white/[0.05]">
                    {/* Background decorative glows */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[60px] lg:blur-[80px] -translate-y-1/2 translate-x-1/2 transform-gpu pointer-events-none" style={{ willChange: 'transform' }} />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[40px] lg:blur-[60px] translate-y-1/2 -translate-x-1/4 transform-gpu pointer-events-none" style={{ willChange: 'transform' }} />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        <div className="lg:col-span-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                <span>AI Assistant Active</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                                Welcome back, <span className="gradient-text">{firstName}</span>
                            </h1>

                            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                                Your career trajectory looks promising. I review your recent mock interview and you've improved your system design skills by 15%. What should we focus on today?
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Link to="/interview" className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2">
                                    Continue Practice
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link to="/roadmap" className="px-5 py-2.5 rounded-xl glass font-semibold hover:bg-white/5 transition-colors border-white/10 text-white">
                                    View Roadmap
                                </Link>
                            </div>
                        </div>

                        {/* AI Insights Widget */}
                        <div className="lg:col-span-1 glass rounded-2xl p-6 border border-white/10 relative hover-glow">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-indigo-400" />
                                    Latest Insights
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {insights.map((insight, idx) => {
                                    const Icon = insight.icon;
                                    return (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/[0.03] hover:border-white/[0.08] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${insight.bg} ${insight.border} border`}>
                                                    <Icon className={`h-4 w-4 ${insight.color}`} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-300">{insight.label}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${insight.color}`}>{insight.value}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modules Grid */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h2 className="text-xl font-bold text-white tracking-tight">Career Tools</h2>
                    <span className="text-sm text-slate-400 font-medium">8 Modules</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {modules.map((mod, index) => {
                        const Icon = mod.icon;
                        return (
                            <Link
                                key={index}
                                to={mod.link}
                                className={`group relative flex flex-col p-6 rounded-2xl glass transition-all duration-300 ${mod.colors.bgHover} ${mod.colors.borderHover} hover:-translate-y-1 ${mod.colors.glow}`}
                            >
                                {/* Shimmer effect on hover */}
                                <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                    <div className="w-full h-full shimmer delay-100" />
                                </div>

                                <div className="mb-5 relative inline-flex">
                                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${mod.colors.from} ${mod.colors.to} blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-300`} />
                                    <div className={`relative p-3 rounded-xl bg-gradient-to-br ${mod.colors.from} ${mod.colors.to} shadow-inner`}>
                                        <Icon className="h-6 w-6 text-white transform group-hover:scale-110 transition-transform duration-300" style={{ animation: 'icon-bounce 2s infinite ease-in-out' }} />
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all duration-300">
                                    {mod.title}
                                </h3>

                                <p className="text-sm text-slate-400 mb-8 flex-1 group-hover:text-slate-300 transition-colors leading-relaxed">
                                    {mod.description}
                                </p>

                                <div className="flex items-center text-sm font-medium text-slate-400 group-hover:text-white mt-auto overflow-hidden">
                                    <span className="relative transform transition-transform duration-300 group-hover:translate-x-1">Get Started</span>
                                    <ArrowRight className="ml-2 h-4 w-4 transform -translate-x-4 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </motion.div>
        </motion.div>
    );
}
