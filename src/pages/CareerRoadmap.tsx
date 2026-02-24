import { useState } from 'react';
import { Target, TrendingUp, Compass, Flag, MapPin, ArrowRight, Lightbulb } from 'lucide-react';
import Timeline, { type Milestone } from '../components/Timeline';
import ScoreCircle from '../components/ScoreCircle';

// Mock data
const defaultMilestones: Milestone[] = [
    {
        id: 'm1',
        title: 'Core Fundamentals',
        description: 'Master JavaScript ES6+, HTML5 semantic elements, and modern CSS layout techniques (Flexbox & Grid). Focus on building responsive layouts without frameworks.',
        status: 'completed',
        duration: 'Weeks 1-3'
    },
    {
        id: 'm2',
        title: 'React Fundamentals',
        description: 'Learn React hooks, component lifecycle, context API, and state management. Build 3 small projects to solidify understanding of one-way data flow.',
        status: 'current',
        duration: 'Weeks 4-6'
    },
    {
        id: 'm3',
        title: 'Backend Basics & APIs',
        description: 'Introduction to Node.js and Express. Learn how to create RESTful APIs, handle routing, and perform basic CRUD operations.',
        status: 'upcoming',
        duration: 'Weeks 7-9'
    }
];

export default function CareerRoadmap() {
    const [goal, setGoal] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [roadmap, setRoadmap] = useState<Milestone[] | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'overview'>('timeline');

    const handleGenerate = () => {
        if (!goal) return;
        setIsGenerating(true);
        setTimeout(() => {
            setRoadmap(defaultMilestones);
            setIsGenerating(false);
        }, 1500);
    };

    if (!roadmap) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col w-full h-full pt-16 pb-20 px-4 items-center justify-center animate-in fade-in duration-500">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 relative">
                        <MapPin className="h-12 w-12 text-orange-400" />
                        <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full -z-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Plan Your Career Journey</h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">
                        Tell us your career or study goal. Our AI will generate a personalized roadmap with actionable milestones to help you get there.
                    </p>
                </div>

                <div className="w-full bg-slate-800/40 p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-400" /> What is your ultimate goal?
                        </label>
                        <input
                            type="text"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-lg"
                            placeholder="e.g. Become a Senior Full Stack Developer"
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                        />
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !goal}
                                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isGenerating || !goal
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 hover:-translate-y-0.5'
                                    }`}
                            >
                                {isGenerating ? 'Mapping your journey...' : 'Generate Roadmap'}
                                {!isGenerating && <ArrowRight className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
                        <Lightbulb className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-300">
                            <span className="font-semibold text-blue-400">Pro Tip:</span> Be specific about your goal. Instead of "Learn coding", try "Become a React Native mobile developer in 6 months".
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const completedCount = roadmap.filter(m => m.status === 'completed').length;
    const currentCount = roadmap.filter(m => m.status === 'current').length;
    const progressPercent = Math.round(((completedCount + currentCount * 0.5) / roadmap.length) * 100);

    return (
        <div className="max-w-6xl mx-auto flex flex-col w-full h-full pt-8 pb-20 px-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-12 bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full z-0" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full z-0" />

                <div className="z-10 flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-semibold mb-4 border border-orange-500/30">
                        <Target className="h-4 w-4" /> Target: {goal}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-3xl md:text-5xl font-bold">Your Career Roadmap</h1>
                        <button
                            onClick={() => setRoadmap(null)}
                            className="text-sm text-slate-400 hover:text-white underline underline-offset-4 mt-2"
                        >
                            Change Goal
                        </button>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        This personalized learning path is designed to bridge your skill gaps and prepare you for your target role. Follow the milestones to achieve your career goals.
                    </p>
                </div>

                <div className="z-10 shrink-0 flex items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="text-center mr-6">
                        <h3 className="text-slate-400 font-medium mb-1">Overall Progress</h3>
                        <p className="text-sm text-slate-500">Based on active path</p>
                    </div>
                    <ScoreCircle score={progressPercent} size={100} strokeWidth={8} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 max-w-sm p-1.5 bg-slate-800/50 rounded-xl mb-10 border border-slate-700/50">
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'timeline'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <Compass className="h-4 w-4" /> Path Timeline
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'overview'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <TrendingUp className="h-4 w-4" /> Skills Overview
                </button>
            </div>

            {/* Content Area */}
            <div className="w-full relative">
                {activeTab === 'timeline' ? (
                    <div>
                        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm font-medium">
                            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed
                            </span>
                            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> In Progress
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-slate-400" /> Upcoming
                            </span>
                        </div>

                        <Timeline milestones={roadmap} />

                        <div className="mt-16 flex justify-center">
                            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                                <Flag className="h-5 w-5 text-purple-400" />
                                <span className="font-medium">Goal: Job Ready!</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">Core Competencies</h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Fundamentals</span>
                                    <span className="text-emerald-400 font-semibold text-sm">Completed</span>
                                </li>
                                <li className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Frameworks</span>
                                    <span className="text-blue-400 font-semibold text-sm">Target: 80%</span>
                                </li>
                                <li className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Backend Systems</span>
                                    <span className="text-slate-400 font-semibold text-sm">Target: 50%</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
