import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Memoize toggle functions to prevent unnecessary re-renders of Sidebar and Header
    const handleMenuClick = useCallback(() => setIsSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

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
                <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(79, 70, 229, 0) 70%)' }} />
                {/* Cyan Bottom Left Glow */}
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(8, 145, 178, 0.12) 0%, rgba(8, 145, 178, 0) 70%)' }} />
            </div>

            {/* Sidebar Component */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={closeSidebar} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full h-full relative z-10">
                {/* Header */}
                <DashboardHeader onMenuClick={handleMenuClick} />

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

                {/* Global AI Assistant Floating Button */}
                <div className="absolute bottom-6 right-6 z-50 md:bottom-8 md:right-8 transform-gpu">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 group focus:outline-none"
                    >
                        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <Bot className="h-6 w-6 relative z-10" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
