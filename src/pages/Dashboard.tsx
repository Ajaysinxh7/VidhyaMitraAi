import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FileText,
    Search,
    CheckCircle,
    Award,
    Map,
    HelpCircle,
    MessageSquare,
    TrendingUp,
    ArrowRight
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();

    const modules = [
        {
            title: "Resume Building",
            description: "Create a professional resume tailored to your dream job.",
            icon: <FileText className="h-8 w-8 text-blue-400" />,
            link: "/resume-builder",
            bgClass: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/20"
        },
        {
            title: "Resume Analyzing",
            description: "Upload your resume and get AI-powered feedback & scoring.",
            icon: <Search className="h-8 w-8 text-emerald-400" />,
            link: "/resume",
            bgClass: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20"
        },
        {
            title: "Evaluating",
            description: "Evaluate your skills against industry standards.",
            icon: <CheckCircle className="h-8 w-8 text-purple-400" />,
            link: "/evaluating",
            bgClass: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20"
        },
        {
            title: "Eligibility Criteria",
            description: "Check if you meet the criteria for specific roles or exams.",
            icon: <Award className="h-8 w-8 text-yellow-400" />,
            link: "/eligibility",
            bgClass: "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/20"
        },
        {
            title: "Planning & Roadmap",
            description: "Get a personalized AI-generated roadmap to guide your career.",
            icon: <Map className="h-8 w-8 text-orange-400" />,
            link: "/roadmap",
            bgClass: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/20"
        },
        {
            title: "Quiz",
            description: "Test your knowledge with timed quizzes and track scores.",
            icon: <HelpCircle className="h-8 w-8 text-cyan-400" />,
            link: "/quiz",
            bgClass: "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/20"
        },
        {
            title: "Interview",
            description: "Practice with our AI interviewer to ace your next round.",
            icon: <MessageSquare className="h-8 w-8 text-rose-400" />,
            link: "/interview",
            bgClass: "bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/20"
        },
        {
            title: "Progress Tracking",
            description: "Monitor your overall performance and module completions.",
            icon: <TrendingUp className="h-8 w-8 text-indigo-400" />,
            link: "/progress",
            bgClass: "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20"
        }
    ];

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">{user?.name ? user.name.split(' ')[0] : 'User'}</span> 👋
                </h1>
                <p className="text-slate-400 text-lg">
                    Access all your AI-powered career tools below. What would you like to do today?
                </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {modules.map((mod, index) => (
                    <Link
                        key={index}
                        to={mod.link}
                        className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${mod.bgClass}`}
                    >
                        <div className="mb-4 inline-flex p-3 rounded-xl bg-slate-900/50 shadow-inner">
                            {mod.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                            {mod.title}
                        </h3>
                        <p className="text-sm text-slate-400 mb-6 flex-1 group-hover:text-slate-300 transition-colors">
                            {mod.description}
                        </p>

                        <div className="flex items-center text-sm font-medium text-slate-300 group-hover:text-white mt-auto">
                            <span>Get Started</span>
                            <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
