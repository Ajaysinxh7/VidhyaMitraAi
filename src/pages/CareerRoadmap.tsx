import { useState } from 'react';
import { Target, TrendingUp, Compass, Flag, MapPin, ArrowRight, Lightbulb, Loader2, AlertCircle, RefreshCcw, PlaySquare } from 'lucide-react';
import Timeline, { type Milestone } from '../components/Timeline';
import ScoreCircle from '../components/ScoreCircle';
import { generateRoadmap, type VideoRecommendation } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────
export default function CareerRoadmap() {
    const { user } = useAuth();

    // Input state
    const [goal, setGoal] = useState<string>('');
    const [timelineMonths, setTimelineMonths] = useState<number>(6);

    // Roadmap state (replaces mock data)
    const [roadmap, setRoadmap] = useState<Milestone[] | null>(null);
    const [roadmapId, setRoadmapId] = useState<string | null>(null);
    const [generatedGoal, setGeneratedGoal] = useState<string>('');
    const [recommendedVideos, setRecommendedVideos] = useState<VideoRecommendation[]>([]);
    const [dashboardImage, setDashboardImage] = useState<string | null>(null);

    // UI state
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'timeline' | 'overview'>('timeline');

    // ─── Generate Roadmap ─────────────────────────────────────────────────────
    const handleGenerate = async () => {
        // Validation
        if (!goal.trim()) {
            setErrorMessage('Please enter a career goal before generating a roadmap.');
            return;
        }

        setLoadingState('loading');
        setErrorMessage('');

        try {
            // Use actual user ID if authenticated, otherwise use a guest identifier
            const userId = user?.id ?? 'guest-' + Date.now();

            const response = await generateRoadmap(userId, goal.trim(), timelineMonths);

            // Map backend milestones to Timeline's Milestone type
            const milestones: Milestone[] = response.milestones.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                duration: m.duration,
                status: m.status,
            }));

            setRoadmap(milestones);
            setRoadmapId(response.roadmap_id);
            setGeneratedGoal(response.goal);
            setRecommendedVideos(response.recommended_videos || []);
            setDashboardImage(response.dashboard_image_url || null);
            setLoadingState('success');
        } catch (err: any) {
            console.error('Roadmap generation error:', err);

            // User-friendly error messages
            if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
                setErrorMessage('Cannot reach the server. Please make sure the backend is running on port 8000.');
            } else if (err?.response?.status === 400) {
                setErrorMessage(err.response.data?.detail ?? 'Invalid request. Please check your goal and try again.');
            } else if (err?.response?.status === 500) {
                setErrorMessage('The AI service encountered an error. Please try again in a moment.');
            } else {
                setErrorMessage('Something went wrong. Please try again.');
            }

            setLoadingState('error');
        }
    };

    const handleReset = () => {
        setRoadmap(null);
        setRoadmapId(null);
        setGeneratedGoal('');
        setRecommendedVideos([]);
        setDashboardImage(null);
        setGoal('');
        setLoadingState('idle');
        setErrorMessage('');
        setActiveTab('timeline');
    };

    // ─── Loading Screen ───────────────────────────────────────────────────────
    if (loadingState === 'loading') {
        return (
            <div className="max-w-4xl mx-auto flex flex-col w-full h-full items-center justify-center pt-16 pb-20 px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    {/* Animated spinner */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Loader2 className="h-12 w-12 text-orange-400 animate-spin" />
                        </div>
                        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full -z-10 animate-pulse" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-2">Generating Your AI Roadmap...</h2>
                        <p className="text-slate-400 max-w-sm">
                            Our AI is crafting a personalized milestone-by-milestone path for{' '}
                            <span className="text-orange-400 font-semibold">"{goal}"</span>
                        </p>
                    </div>

                    {/* Animated progress dots */}
                    <div className="flex items-center gap-2 mt-2">
                        {['Analyzing goal', 'Planning milestones', 'Building roadmap'].map((step, i) => (
                            <span
                                key={step}
                                className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700"
                                style={{ animationDelay: `${i * 0.3}s` }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"
                                    style={{ animationDelay: `${i * 0.3}s` }}
                                />
                                {step}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Input / Goal Entry Screen ────────────────────────────────────────────
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
                    <div className="space-y-5">
                        {/* Goal Input */}
                        <div>
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-emerald-400" /> What is your ultimate goal?
                            </label>
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => {
                                    setGoal(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-lg"
                                placeholder="e.g. Become a Senior Full Stack Developer"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />
                        </div>

                        {/* Timeline Selector */}
                        <div>
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-blue-400" /> Timeline
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[3, 6, 9, 12].map((months) => (
                                    <button
                                        key={months}
                                        onClick={() => setTimelineMonths(months)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${timelineMonths === months
                                            ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                                            }`}
                                    >
                                        {months} months
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 animate-in fade-in duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <p className="text-sm">{errorMessage}</p>
                            </div>
                        )}

                        {/* Generate Button */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={!goal.trim()}
                                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!goal.trim()
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 hover:-translate-y-0.5'
                                    }`}
                            >
                                Generate Roadmap
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Pro Tip */}
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

    // ─── Progress Calculation (dynamic, from API milestones) ──────────────────
    const completedCount = roadmap.filter((m) => m.status === 'completed').length;
    const currentCount = roadmap.filter((m) => m.status === 'current').length;
    const progressPercent = Math.round(((completedCount + currentCount * 0.5) / roadmap.length) * 100);

    // Overview skills derived from milestones
    const overviewItems = roadmap.map((m) => ({
        label: m.title,
        statusText: m.status === 'completed' ? 'Completed' : m.status === 'current' ? 'In Progress' : 'Upcoming',
        colorClass: m.status === 'completed' ? 'text-emerald-400' : m.status === 'current' ? 'text-blue-400' : 'text-slate-400',
    }));

    // ─── Roadmap Result Screen ────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto flex flex-col w-full min-h-full pt-8 pb-20 px-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className={`shrink-0 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-12 border p-8 rounded-2xl relative overflow-hidden ${dashboardImage ? 'border-slate-700/50 bg-slate-900/60' : 'bg-slate-800/30 border-slate-700/50'
                }`}>
                {/* Background Image (if fetched from Pexels) */}
                {dashboardImage && (
                    <div
                        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay filter blur-[2px]"
                        style={{ backgroundImage: `url(${dashboardImage})` }}
                    />
                )}
                {/* Fallback gradients if no image */}
                {!dashboardImage && (
                    <>
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full z-0" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full z-0" />
                    </>
                )}

                <div className="z-10 flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-semibold mb-4 border border-orange-500/30">
                        <Target className="h-4 w-4" /> Target: {generatedGoal}
                    </div>
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <h1 className="text-3xl md:text-5xl font-bold">Your Career Roadmap</h1>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white underline underline-offset-4 mt-1 transition-colors"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" /> Change Goal
                        </button>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        This AI-generated learning path is designed to bridge your skill gaps and prepare you for your target role.
                        Follow the milestones to achieve your career goals.
                    </p>
                    {roadmapId && (
                        <p className="text-xs text-slate-600 mt-3 font-mono">Roadmap ID: {roadmapId}</p>
                    )}
                </div>

                <div className="z-10 shrink-0 flex items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-700 shadow-xl">
                    <div className="text-center mr-6">
                        <h3 className="text-slate-400 font-medium mb-1">Overall Progress</h3>
                        <p className="text-sm text-slate-500">Based on active path</p>
                        <p className="text-xs text-slate-600 mt-1">{roadmap.length} milestones</p>
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
                        {/* Legend */}
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
                                <span className="font-medium">Goal: {generatedGoal}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Overview tab — dynamically generated from API milestones */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">All Milestones</h3>
                            <ul className="space-y-3">
                                {overviewItems.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800"
                                    >
                                        <span className="text-slate-300 text-sm truncate pr-2">{item.label}</span>
                                        <span className={`${item.colorClass} font-semibold text-xs shrink-0`}>
                                            {item.statusText}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">Progress Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Total Milestones</span>
                                    <span className="text-white font-bold">{roadmap.length}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Completed</span>
                                    <span className="text-emerald-400 font-bold">{completedCount}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">In Progress</span>
                                    <span className="text-blue-400 font-bold">{currentCount}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                    <span className="text-slate-300">Remaining</span>
                                    <span className="text-slate-400 font-bold">
                                        {roadmap.length - completedCount - currentCount}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-4">Goal Details</h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                    <p className="text-xs text-orange-400 font-semibold mb-1">TARGET GOAL</p>
                                    <p className="text-slate-200 text-sm">{generatedGoal}</p>
                                </div>
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-400 font-semibold mb-1">COMPLETION</p>
                                    <p className="text-slate-200 text-sm font-bold">{progressPercent}%</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="w-full mt-2 py-3 rounded-xl border border-slate-600 text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-all text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" /> Generate New Roadmap
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* External Resources / YouTube */}
                {recommendedVideos.length > 0 && (
                    <div className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl md:col-span-2 lg:col-span-3 mt-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <PlaySquare className="h-5 w-5 text-red-500" /> Recommended Tutorials
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recommendedVideos.map((video, idx) => (
                                <a
                                    key={idx}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800 hover:border-red-500/50 transition-all p-4 flex flex-col gap-3 shadow-lg"
                                >
                                    <div className="aspect-video bg-black/50 rounded-lg overflow-hidden relative border border-slate-800 group-hover:border-red-500/30 transition-colors">
                                        <img
                                            src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow-lg transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                                <PlaySquare className="h-5 w-5 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-red-400 transition-colors">
                                        {video.title}
                                    </h4>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
