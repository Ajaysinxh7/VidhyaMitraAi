import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-50 selection:bg-blue-500/30">
            {/* Sidebar Component */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full h-full relative">

                {/* Header */}
                <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main scrollable area */}
                <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    <div className="w-full h-full max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
