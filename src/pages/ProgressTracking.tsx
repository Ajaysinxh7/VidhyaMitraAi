import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';

const quizData = [
    { name: 'Week 1', score: 65, average: 60 },
    { name: 'Week 2', score: 75, average: 62 },
    { name: 'Week 3', score: 72, average: 65 },
    { name: 'Week 4', score: 85, average: 68 },
    { name: 'Week 5', score: 90, average: 70 },
    { name: 'Week 6', score: 95, average: 72 },
];

const mockData = [
    { subject: 'React', tasksCompleted: 12, totalTasks: 15 },
    { subject: 'Node.js', tasksCompleted: 8, totalTasks: 10 },
    { subject: 'Database', tasksCompleted: 5, totalTasks: 8 },
    { subject: 'System Design', tasksCompleted: 3, totalTasks: 5 },
];

const resumeScoreData = [
    { date: 'Jan 1', score: 45 },
    { date: 'Feb 1', score: 55 },
    { date: 'Mar 1', score: 72 },
    { date: 'Apr 1', score: 85 },
    { date: 'May 1', score: 92 },
];

export default function ProgressTracking() {
    const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-indigo-400" />
                    Progress Dashboard
                </h1>
                <p className="text-slate-400 text-lg">
                    Track your growth across all modules and stay motivated to hit your goals.
                </p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-blue-400 text-sm font-semibold bg-blue-500/10 px-2 py-1 rounded">+12%</span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Tasks Completed</h3>
                    <p className="text-3xl font-bold text-slate-100">28</p>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                            <Award className="h-6 w-6 text-cyan-400" />
                        </div>
                        <span className="text-cyan-400 text-sm font-semibold bg-cyan-500/10 px-2 py-1 rounded">+5%</span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Average Quiz Score</h3>
                    <p className="text-3xl font-bold text-slate-100">83%</p>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <Target className="h-6 w-6 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-2 py-1 rounded">+20%</span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Resume Readiness Score</h3>
                    <p className="text-3xl font-bold text-slate-100">92%</p>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Interview Clarity (Avg)</h3>
                    <p className="text-3xl font-bold text-slate-100">88%</p>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Quiz Scores Over Time */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-xl font-bold mb-6">Quiz Scores Over Time</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={quizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Your Score" />
                                <Line type="monotone" dataKey="average" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Peer Average" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resume Score Improvement */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="text-xl font-bold mb-6">Resume Readiness Trend</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={resumeScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} name="Resume Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Topics Breakdown */}
            <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Tasks Completed by Topic</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            Overview
                        </button>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="subject" type="category" stroke="#e2e8f0" fontSize={13} fontWeight={500} tickLine={false} axisLine={false} width={120} />
                            <Tooltip
                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                            <Bar dataKey="tasksCompleted" fill="#6366f1" radius={[0, 4, 4, 0]} name="Completed" barSize={24} />
                            <Bar dataKey="totalTasks" fill="#334155" radius={[0, 4, 4, 0]} name="Total Tasks" barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
