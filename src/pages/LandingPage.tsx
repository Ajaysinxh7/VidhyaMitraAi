import { motion } from 'framer-motion';
import { ArrowRight, Brain, FileText, MessageSquare, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function LandingPage() {
    const features = [
        {
            icon: <FileText className="h-6 w-6 text-blue-400" />,
            title: 'Resume Analysis',
            description: 'Upload your resume and get instant feedback on skill gaps, ATS compatibility, and improvement areas tailored to your target role.',
            color: 'from-blue-500/20 to-blue-400/5',
            borderColor: 'border-blue-500/20'
        },
        {
            icon: <MessageSquare className="h-6 w-6 text-emerald-400" />,
            title: 'Mock Interviews',
            description: 'Practice with an AI agent that simulates real interview scenarios, providing grades on confidence, clarity, and accuracy.',
            color: 'from-emerald-500/20 to-emerald-400/5',
            borderColor: 'border-emerald-500/20'
        },
        {
            icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
            title: 'Career Roadmaps',
            description: 'Receive a personalized, step-by-step roadmap to achieve your career goals based on your current skills and target.',
            color: 'from-purple-500/20 to-purple-400/5',
            borderColor: 'border-purple-500/20'
        },
        {
            icon: <Brain className="h-6 w-6 text-pink-400" />,
            title: 'Skill Gap Insights',
            description: 'Visualize your current skills against industry requirements with interactive radar charts and targeted course recommendations.',
            color: 'from-pink-500/20 to-pink-400/5',
            borderColor: 'border-pink-500/20'
        }
    ];


    return (
        <div className="relative h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-proximity scroll-smooth bg-slate-950 text-slate-50 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
                <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[100px]" />
            </div>

            {/* HERO SECTION */}
            <section className="snap-start min-h-[calc(100vh-4rem)] flex items-center justify-center text-center px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                        Your AI Career Companion for
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Smarter Learning & Job Readiness
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                        Upload your resume, practice interviews with advanced AI, and get personalized roadmaps to accelerate your tech career.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link
                            to="/resume"
                            className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold text-lg hover:bg-blue-500 transition-all flex items-center gap-3 justify-center shadow-lg shadow-blue-500/20 hover:-translate-y-1"
                        >
                            Analyze Resume <ArrowRight className="h-5 w-5" />
                        </Link>

                        <Link
                            to="/interview"
                            className="px-8 py-4 rounded-full bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-semibold text-lg transition-all flex items-center gap-3 justify-center hover:-translate-y-1"
                        >
                            <MessageSquare className="h-5 w-5 text-emerald-400" />
                            Start Mock Interview
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* FEATURES SECTION */}
            <section className="snap-start min-h-[calc(100vh-4rem)] flex items-center bg-slate-900/20 border-y border-slate-800/50">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 pb-2 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                            Everything you need to succeed
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Our AI tools identify your weaknesses and transform them into strengths.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`group p-8 rounded-3xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border ${feature.borderColor} hover:border-slate-500 hover:-translate-y-2 transition-all duration-150 hover:shadow-2xl relative overflow-hidden`}
                            >
                                {/* Glowing background loop on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />

                                <div className="relative z-10">
                                    <div className="h-12 w-12 rounded-xl bg-slate-950/80 border border-slate-700/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-150 shadow-lg">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors duration-150">{feature.title}</h3>
                                    <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-150">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER SECTION */}
            <Footer />
        </div>
    );
}