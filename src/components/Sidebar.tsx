import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Search,
    CheckCircle,
    Award,
    Map,
    HelpCircle,
    MessageSquare,
    TrendingUp
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Resume Building', path: '/resume-builder', icon: FileText },
        { name: 'Resume Analyzing', path: '/resume', icon: Search },
        { name: 'Evaluating', path: '/evaluating', icon: CheckCircle },
        { name: 'Eligibility', path: '/eligibility', icon: Award },
        { name: 'Planning & Roadmap', path: '/roadmap', icon: Map },
        { name: 'Quiz', path: '/quiz', icon: HelpCircle },
        { name: 'Interview', path: '/interview', icon: MessageSquare },
        { name: 'Progress Tracking', path: '/progress', icon: TrendingUp },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="h-full flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between md:hidden">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Menu</span>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive(link.path)
                                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive(link.path) ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'}`} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
