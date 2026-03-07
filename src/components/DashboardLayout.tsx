import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Page transition variants
    const pageVariants = {
        initial: { opacity: 0, y: 8 },
        enter: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.2, ease: "easeOut" as const }
        },
        exit: {
            opacity: 0,
            y: -8,
            transition: { duration: 0.1, ease: "easeIn" as const }
        }
    };

    return (
        <div className="flex h-screen bg-[#030712] overflow-hidden font-sans text-slate-50 relative selection:bg-indigo-500/30">
            {/* Global Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Purple/Indigo Top Right Glow */}
                <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[60px] lg:blur-[80px] transform-gpu" />
                {/* Cyan Bottom Left Glow */}
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[60px] lg:blur-[80px] transform-gpu" />
            </div>

            {/* Sidebar Component */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full h-full relative z-10">
                {/* Header */}
                <DashboardHeader onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Main scrollable area */}
                <main className="flex-1 overflow-y-auto w-full custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            className="w-full min-h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                            variants={pageVariants}
                            initial="initial"
                            animate="enter"
                            exit="exit"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
