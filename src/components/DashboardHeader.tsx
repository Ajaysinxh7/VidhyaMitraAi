import { Link } from 'react-router-dom';
import { Brain, Menu, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
                        <Brain className="h-8 w-8 text-blue-500" />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hidden sm:block">
                            VidyaMitra
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-sm font-medium text-slate-200">{user?.name || 'User'}</span>
                        <span className="text-xs text-slate-500">{user?.role || 'Student'}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <UserIcon className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors ml-1"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
