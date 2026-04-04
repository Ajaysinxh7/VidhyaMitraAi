import { Brain, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-800/60 py-12 relative z-10 snap-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4 inline-flex">
                            <Brain className="h-6 w-6 text-blue-500" />
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                                VidyaMitra
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                            Your AI career companion for smarter learning & job readiness. We analyze resumes, provide mock interviews, and generate personalized roadmaps.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">
                                <span className="sr-only">Twitter</span>
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">
                                <span className="sr-only">LinkedIn</span>
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Platform</h3>
                        <ul className="space-y-3">
                            <li><Link to="/resume" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Resume Analyzer</Link></li>
                            <li><Link to="/interview" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Mock Interview</Link></li>
                            <li><Link to="/roadmap" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Career Roadmap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} VidyaMitra AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
