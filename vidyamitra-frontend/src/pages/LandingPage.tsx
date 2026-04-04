import { ArrowRight, Brain, FileText, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import {
    ScrollContainer,
    ScrollSection,
    AnimatedElement,
    ParallaxLayer,
} from '../components/scroll';

export default function LandingPage() {
    const features = [
        {
            icon: <FileText className="h-6 w-6 text-blue-400" />,
            title: 'Resume Analysis',
            description:
                'Upload your resume and get instant feedback on skill gaps, ATS compatibility, and improvement areas tailored to your target role.',
            color: 'from-blue-500/20 to-blue-400/5',
            borderColor: 'border-blue-500/20',
            accent: 'bg-blue-500',
        },
        {
            icon: <MessageSquare className="h-6 w-6 text-emerald-400" />,
            title: 'Mock Interviews',
            description:
                'Practice with an AI agent that simulates real interview scenarios, providing grades on confidence, clarity, and accuracy.',
            color: 'from-emerald-500/20 to-emerald-400/5',
            borderColor: 'border-emerald-500/20',
            accent: 'bg-emerald-500',
        },
        {
            icon: <TrendingUp className="h-6 w-6 text-purple-400" />,
            title: 'Career Roadmaps',
            description:
                'Receive a personalized, step-by-step roadmap to achieve your career goals based on your current skills and target.',
            color: 'from-purple-500/20 to-purple-400/5',
            borderColor: 'border-purple-500/20',
            accent: 'bg-purple-500',
        },
        {
            icon: <Brain className="h-6 w-6 text-pink-400" />,
            title: 'Skill Gap Insights',
            description:
                'Visualize your current skills against industry requirements with interactive radar charts and targeted course recommendations.',
            color: 'from-pink-500/20 to-pink-400/5',
            borderColor: 'border-pink-500/20',
            accent: 'bg-pink-500',
        },
    ];



    return (
        <ScrollContainer
            showProgress
            className="bg-slate-950 text-slate-50 font-sans"
        >
            {/* ─── Ambient Background Blurs ─── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
                <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[100px]" />
            </div>

            {/* ═══════════════════════════════════════════════
                SECTION 1 — HERO
            ═══════════════════════════════════════════════ */}
            <ScrollSection
                id="hero"
                animation="zoom-in"
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 px-4"
            >
                {/* Floating parallax orbs */}
                <ParallaxLayer
                    speed={-0.2}
                    className="absolute top-20 left-[15%] pointer-events-none"
                    opacityRange={[0.4, 0.8]}
                >
                    <div className="w-3 h-3 rounded-full bg-blue-400/40 blur-[2px]" />
                </ParallaxLayer>
                <ParallaxLayer
                    speed={-0.35}
                    className="absolute top-32 right-[20%] pointer-events-none"
                    opacityRange={[0.3, 0.7]}
                >
                    <div className="w-2 h-2 rounded-full bg-purple-400/50 blur-[1px]" />
                </ParallaxLayer>
                <ParallaxLayer
                    speed={-0.15}
                    className="absolute bottom-28 left-[30%] pointer-events-none"
                    opacityRange={[0.5, 0.9]}
                >
                    <div className="w-4 h-4 rounded-full bg-emerald-400/30 blur-[3px]" />
                </ParallaxLayer>

                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <AnimatedElement delay={0.1} direction="down" distance={20}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm">
                            <Sparkles className="h-4 w-4" />
                            Powered by Advanced AI
                        </div>
                    </AnimatedElement>

                    {/* Heading */}
                    <AnimatedElement delay={0.25} distance={60}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                            Your AI Career Companion for
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                Smarter Learning & Job Readiness
                            </span>
                        </h1>
                    </AnimatedElement>

                    {/* Subtext */}
                    <AnimatedElement delay={0.4} distance={40}>
                        <p className="text-base md:text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Upload your resume, practice interviews with advanced AI, and get personalized roadmaps to accelerate your tech career.
                        </p>
                    </AnimatedElement>

                    {/* CTA Buttons */}
                    <AnimatedElement delay={0.55} distance={30}>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <Link
                                to="/resume"
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-3 justify-center shadow-lg shadow-blue-500/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
                            >
                                Analyze Resume <ArrowRight className="h-5 w-5" />
                            </Link>

                            <Link
                                to="/interview"
                                className="px-8 py-4 rounded-full bg-slate-900/80 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-white font-semibold text-lg transition-all flex items-center gap-3 justify-center hover:-translate-y-1 backdrop-blur-sm active:scale-[0.98]"
                            >
                                <MessageSquare className="h-5 w-5 text-emerald-400" />
                                Start Mock Interview
                            </Link>
                        </div>
                    </AnimatedElement>

                    {/* Scroll indicator */}
                    <AnimatedElement delay={1} distance={20} className="mt-16">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                            <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                            </div>
                        </div>
                    </AnimatedElement>
                </div>
            </ScrollSection>


            {/* ═══════════════════════════════════════════════
                SECTION 3 — FEATURES
            ═══════════════════════════════════════════════ */}
            <ScrollSection
                id="features"
                animation="fade-up"
                className="bg-slate-900/20 border-y border-slate-800/50 relative z-10"
            >
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Section Header */}
                    <div className="text-center mb-10">
                        <AnimatedElement delay={0} distance={30}>
                            <span className="inline-block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
                                Features
                            </span>
                        </AnimatedElement>
                        <AnimatedElement delay={0.1} distance={40}>
                            <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                                Everything you need to succeed
                            </h2>
                        </AnimatedElement>
                        <AnimatedElement delay={0.2} distance={20}>
                            <p className="text-slate-400 max-w-2xl mx-auto text-base">
                                Our AI tools identify your weaknesses and transform them into strengths.
                            </p>
                        </AnimatedElement>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((feature, i) => (
                            <AnimatedElement
                                key={i}
                                staggerIndex={i}
                                staggerDelay={0.1}
                                direction="up"
                                distance={40}
                                scale={0.96}
                            >
                                <div
                                    className={`group p-6 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/50 border ${feature.borderColor} hover:border-slate-500 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl relative overflow-hidden cursor-default h-full`}
                                >
                                    {/* Accent line at top */}
                                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                    {/* Glowing background on hover */}
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                    />

                                    <div className="relative z-10">
                                        <div className="h-11 w-11 rounded-lg bg-slate-950/80 border border-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-md">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </AnimatedElement>
                        ))}
                    </div>
                </div>
            </ScrollSection>


            {/* ─── FOOTER ─── */}
            <Footer />
        </ScrollContainer>
    );
}