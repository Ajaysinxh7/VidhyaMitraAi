import { useState } from 'react';
import { CheckCircle, AlertCircle, Target, Zap, ArrowRight } from 'lucide-react';

export default function Evaluating() {
    const [skills, setSkills] = useState('');
    const [goals, setGoals] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleEvaluate = () => {
        if (!skills || !goals) return;

        setIsEvaluating(true);
        // Simulate AI API Call
        setTimeout(() => {
            setResults({
                score: 75,
                strengths: ['Relevant core skills for the goal', 'Good baseline knowledge'],
                gaps: ['Missing advanced framework experience', 'Need more project portfolio items'],
                recommendation: 'Focus on building 2-3 full-stack projects using modern frameworks to bridge the gap.'
            });
            setIsEvaluating(false);
        }, 1500);
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-purple-400" />
                    Skill Evaluation
                </h1>
                <p className="text-slate-400 text-lg">
                    Enter your current skills and career goals to get an instant AI evaluation of your readiness.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl border border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-200 mb-6">Your Profile</h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-400" /> Current Skills
                            </label>
                            <textarea
                                rows={4}
                                value={skills}
                                onChange={e => setSkills(e.target.value)}
                                placeholder="e.g. React, Node.js, Python, Basic SQL..."
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Target className="h-4 w-4 text-rose-400" /> Career Goal / Target Role
                            </label>
                            <input
                                type="text"
                                value={goals}
                                onChange={e => setGoals(e.target.value)}
                                placeholder="e.g. Senior Frontend Developer"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleEvaluate}
                            disabled={isEvaluating || !skills || !goals}
                            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isEvaluating || !skills || !goals
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 hover:-translate-y-0.5'
                                }`}
                        >
                            {isEvaluating ? 'Analyzing...' : 'Evaluate Now'}
                            {!isEvaluating && <ArrowRight className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-slate-800/30 p-6 sm:p-8 rounded-2xl border border-slate-700/50 flex flex-col">
                    <h2 className="text-xl font-semibold text-slate-200 mb-6">Evaluation Results</h2>

                    {!results ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                            <CheckCircle className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400 max-w-sm">
                                Fill out your skills and goals on the left to see your AI-generated evaluation here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                <div className="relative">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                        <circle
                                            cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * results.score) / 100}
                                            className="text-purple-500 transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{results.score}%</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-200">Readiness Score</h3>
                                    <p className="text-sm text-slate-400">Based on industry requirements</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> Strengths
                                    </h4>
                                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                                        {results.strengths.map((str: string, i: number) => <li key={i}>{str}</li>)}
                                    </ul>
                                </div>
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> Skill Gaps
                                    </h4>
                                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                                        {results.gaps.map((gap: string, i: number) => <li key={i}>{gap}</li>)}
                                    </ul>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <h4 className="font-semibold text-blue-400 mb-2">AI Recommendation</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    {results.recommendation}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
