import { Link, useLocation } from 'react-router-dom';
import { Brain, Menu, X, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Shared easing — Apple-style overshoot for a satisfying "landing"
const dropEase = [0.34, 1.56, 0.64, 1] as const;

// Parent orchestrator — staggers children automatically
const navContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

// Each child drops from above with slight opacity fade
const dropItemVariants = {
    hidden: {
        opacity: 0,
        y: -28,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: dropEase,
        },
    },
};

// Mobile menu slide-down
const mobileMenuVariants = {
    hidden: {
        opacity: 0,
        height: 0,
        transition: {
            duration: 0.25,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
            when: 'afterChildren' as const,
            staggerChildren: 0.03,
            staggerDirection: -1,
        },
    },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
            when: 'beforeChildren' as const,
            staggerChildren: 0.06,
            delayChildren: 0.05,
        },
    },
};

const mobileItemVariants = {
    hidden: { opacity: 0, y: -16, x: -8 },
    visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: { duration: 0.35, ease: dropEase },
    },
};

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { isAuthenticated, signOut } = useAuth();

    const navLinks = [
        { name: 'Home', path: '/' },
    ].filter(link => link.path !== location.pathname);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-xl">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    key={location.pathname}
                    className="flex items-center justify-between h-16"
                    variants={navContainerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Logo — drops first */}
                    <motion.div variants={dropItemVariants}>
                        <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
                            <Brain className="h-8 w-8 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                VidyaMitra
                            </span>
                        </Link>
                    </motion.div>

                    {/* Desktop Nav — each item drops in sequence */}
                    <div className="hidden md:flex items-center space-x-8">
                        <div className="flex space-x-6">
                            {navLinks.map((link) => (
                                <motion.div key={link.name} variants={dropItemVariants}>
                                    <Link
                                        to={link.path}
                                        className={`text-sm font-medium transition-colors hover:text-blue-400 ${isActive(link.path) ? 'text-blue-500' : 'text-slate-300'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <>
                                    <motion.div variants={dropItemVariants}>
                                        <Link
                                            to="/dashboard"
                                            className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4" />
                                            </div>
                                            <span>Dashboard</span>
                                        </Link>
                                    </motion.div>
                                    <motion.div variants={dropItemVariants}>
                                        <button
                                            onClick={signOut}
                                            className="text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            Log Out
                                        </button>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div variants={dropItemVariants}>
                                    <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5">
                                        Sign In
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <motion.div className="md:hidden flex items-center" variants={dropItemVariants}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Mobile Nav — animated dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {navLinks.map((link) => (
                                <motion.div key={link.name} variants={mobileItemVariants}>
                                    <Link
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)
                                            ? 'bg-slate-800 text-blue-500'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            {isAuthenticated ? (
                                <>
                                    <motion.div variants={mobileItemVariants}>
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                                        >
                                            Dashboard
                                        </Link>
                                    </motion.div>
                                    <motion.div variants={mobileItemVariants}>
                                        <button
                                            onClick={() => { signOut(); setIsMenuOpen(false); }}
                                            className="w-full text-left mt-2 px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-800"
                                        >
                                            Log Out
                                        </button>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div variants={mobileItemVariants}>
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center mt-2 px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700">
                                        Sign In
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
