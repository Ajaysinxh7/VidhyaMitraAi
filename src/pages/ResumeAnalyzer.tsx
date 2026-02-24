import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeResume } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import RoleChip from '../components/RoleChip';
import UploadBox from '../components/UploadBox';
import ScoreCircle from '../components/ScoreCircle';
import SkillRadarChart from '../components/SkillRadarChart';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertTriangle, Award, BookOpen, AlertCircle } from 'lucide-react';

const ROLES = [
    'Data Scientist',
    'Full Stack Developer',
    'ML Engineer',
    'Cloud Engineer',
    'Product Manager',
    'Data Analyst'
];

export default function ResumeAnalyzer() {
    const { resumeResult, setResumeResult } = useAppContext();
    const [targetRole, setTargetRole] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = (uploadedFile: File) => {
        setFile(uploadedFile);
        setError('');
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please upload a resume first.');
            return;
        }
        if (!targetRole) {
            setError('Please select a target role.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await analyzeResume(file, targetRole);
            setResumeResult(result);
        } catch (err) {
            setError('Failed to analyze resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col w-full h-full pt-8 pb-20">
            <div className="mb-10 text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">Resume Analyzer</h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Upload your resume and select your target role to get AI-powered insights on how to improve your chances.
                </p>
            </div>

            {!resumeResult ? (
                <div className="max-w-3xl mx-auto w-full space-y-10">
                    <div className="bg-slate-800/20 border border-slate-700/50 p-6 md:p-10 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="flex h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 items-center justify-center text-sm font-bold">1</span>
                            Upload Resume
                        </h2>
                        <UploadBox onFileUpload={handleUpload} />
                    </div>

                    <div className="bg-slate-800/20 border border-slate-700/50 p-6 md:p-10 rounded-2xl">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="flex h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center text-sm font-bold">2</span>
                            Select Target Role
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {ROLES.map(role => (
                                <RoleChip
                                    key={role}
                                    label={role}
                                    selected={targetRole === role}
                                    onClick={() => {
                                        setTargetRole(role);
                                        setError('');
                                    }}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center gap-2 text-sm"
                            >
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !file || !targetRole}
                            className={`mt-8 w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${isLoading || !file || !targetRole
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5'
                                }`}
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze My Resume'}
                        </button>
                    </div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <Award className="h-7 w-7 text-emerald-400" />
                                Analysis Results for {targetRole}
                            </h2>
                            <button
                                onClick={() => setResumeResult(null)}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors underline-offset-4 hover:underline"
                            >
                                Analyze Another Resume
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Score and Overview */}
                            <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg">
                                <h3 className="text-xl font-semibold mb-8">Overall Match Score</h3>
                                <ScoreCircle score={resumeResult.score} size={180} strokeWidth={12} />
                                <p className="mt-8 text-slate-400 text-sm max-w-xs">
                                    Your resume is a {resumeResult.score}% match for {targetRole} roles. Address the skill gaps below to improve your chances.
                                </p>
                            </div>

                            {/* Radar Chart */}
                            <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-semibold mb-6">Skill Alignment</h3>
                                <div className="h-[300px]">
                                    <SkillRadarChart data={resumeResult.categories} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Missing Skills */}
                            <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                                    Critical Skill Gaps
                                </h3>
                                <div className="space-y-4">
                                    {resumeResult.missingSkills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                                            <span className="font-medium text-slate-200">{skill.name}</span>
                                            <div className="flex items-center gap-2">
                                                {skill.severity === 'high' && (
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> High Priority
                                                    </span>
                                                )}
                                                {skill.severity === 'medium' && (
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                        Medium Priority
                                                    </span>
                                                )}
                                                {skill.severity === 'low' && (
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        Nice to Have
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Courses */}
                            <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-blue-400" />
                                    Recommended Learning
                                </h3>
                                <div className="space-y-4 z-10">
                                    {resumeResult.courses.map((course, idx) => (
                                        <CourseCard key={idx} {...course} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            {isLoading && <LoadingSpinner fullScreen message="Analyzing your resume with AI..." />}
        </div>
    );
}
