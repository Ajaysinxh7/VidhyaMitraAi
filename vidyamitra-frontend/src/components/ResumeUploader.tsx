import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UploadCloud, FileText, CheckCircle, AlertTriangle,
    Briefcase, GraduationCap, Code2, FolderKanban, Sparkles,
    RefreshCw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { parseResume, type ParsedResumeData } from '../services/api';

interface ResumeUploaderProps {
    onParseComplete?: (data: ParsedResumeData) => void;
}

export default function ResumeUploader({ onParseComplete }: ResumeUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        skills: true, projects: true, experience: true, education: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const processFile = (f: File) => {
        const allowed = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
            setError('Please upload a PDF, DOC, DOCX, or TXT file.');
            return;
        }
        if (f.size > 10 * 1024 * 1024) {
            setError('File size must be under 10 MB.');
            return;
        }
        setFile(f);
        setError('');
        setParsedData(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const handleParse = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');

        try {
            const data = await parseResume(file);
            setParsedData(data);
            onParseComplete?.(data);
        } catch (err: any) {
            setError(err?.response?.data?.detail || err.message || 'Failed to parse resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedData(null);
        setError('');
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full space-y-4">
            {/* Upload Zone */}
            <AnimatePresence mode="wait">
                {!parsedData && (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-5"
                    >
                        <div
                            className={`relative w-full p-6 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${
                                isDragging
                                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                    : file
                                        ? 'border-emerald-500/50 bg-emerald-500/5'
                                        : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleChange}
                            />

                            <label
                                htmlFor="resume-upload"
                                className="flex flex-col items-center justify-center cursor-pointer min-h-[140px]"
                            >
                                <AnimatePresence mode="wait">
                                    {!file ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col items-center text-center"
                                        >
                                            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700/80'}`}>
                                                <UploadCloud className={`h-10 w-10 transition-colors ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
                                            </div>
                                            <p className="text-lg font-semibold text-slate-200 mb-1">
                                                Drag & drop your resume here
                                            </p>
                                            <p className="text-sm text-slate-400 mb-5">
                                                Supports PDF, DOCX, TXT — up to 10 MB
                                            </p>
                                            <span className="px-5 py-2.5 bg-slate-700 text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-600 transition-colors">
                                                Browse Files
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="preview"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="flex flex-col items-center text-center"
                                        >
                                            <div className="relative mb-4">
                                                <FileText className="h-14 w-14 text-emerald-400/80" />
                                                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                </div>
                                            </div>
                                            <p className="text-lg font-semibold text-emerald-400 mb-0.5">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-slate-400 mb-3">
                                                {formatFileSize(file.size)} • Ready for parsing
                                            </p>
                                            <span className="text-sm text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider font-semibold">
                                                Replace File
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </label>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2.5 text-sm"
                            >
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* Parse Button */}
                        <button
                            type="button"
                            onClick={handleParse}
                            disabled={isLoading || !file}
                            className={`w-full py-3.5 rounded-xl font-semibold text-md transition-all flex items-center justify-center gap-2.5 ${
                                isLoading || !file
                                    ? 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    >
                                        <RefreshCw className="h-5 w-5" />
                                    </motion.div>
                                    Parsing Resume...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Parse Resume with AI
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 gap-4"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-700 rounded-full" />
                            <motion.div
                                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Extracting data from your resume…</p>
                        <p className="text-slate-500 text-xs">This usually takes 5–10 seconds</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results Display */}
            <AnimatePresence>
                {parsedData && !isLoading && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-400" />
                                Parsed Resume Data
                            </h3>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Upload Another
                            </button>
                        </div>

                        {/* Summary Card */}
                        {parsedData.summary && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl"
                            >
                                <p className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wider">Professional Summary</p>
                                <p className="text-slate-300 leading-relaxed">{parsedData.summary}</p>
                            </motion.div>
                        )}

                        {/* Skills */}
                        <SectionCard
                            title="Skills"
                            icon={<Code2 className="h-5 w-5 text-emerald-400" />}
                            count={parsedData.skills.length}
                            expanded={expandedSections.skills}
                            onToggle={() => toggleSection('skills')}
                            delay={0.1}
                        >
                            <div className="flex flex-wrap gap-2">
                                {parsedData.skills.map((skill, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 + i * 0.02 }}
                                        className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg"
                                    >
                                        {skill}
                                    </motion.span>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Experience */}
                        {parsedData.experience.length > 0 && (
                            <SectionCard
                                title="Experience"
                                icon={<Briefcase className="h-5 w-5 text-amber-400" />}
                                count={parsedData.experience.length}
                                expanded={expandedSections.experience}
                                onToggle={() => toggleSection('experience')}
                                delay={0.15}
                            >
                                <div className="space-y-4">
                                    {parsedData.experience.map((exp, i) => (
                                        <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="font-semibold text-slate-200">{exp.title}</h4>
                                                <span className="text-xs text-slate-500 whitespace-nowrap ml-3">{exp.duration}</span>
                                            </div>
                                            <p className="text-sm text-blue-400 mb-2">{exp.company}</p>
                                            <p className="text-sm text-slate-400 leading-relaxed">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* Projects */}
                        {parsedData.projects.length > 0 && (
                            <SectionCard
                                title="Projects"
                                icon={<FolderKanban className="h-5 w-5 text-purple-400" />}
                                count={parsedData.projects.length}
                                expanded={expandedSections.projects}
                                onToggle={() => toggleSection('projects')}
                                delay={0.2}
                            >
                                <div className="space-y-4">
                                    {parsedData.projects.map((proj, i) => (
                                        <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                            <h4 className="font-semibold text-slate-200 mb-1">{proj.name}</h4>
                                            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{proj.description}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {proj.technologies.map((tech, j) => (
                                                    <span key={j} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-md font-medium">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* Education */}
                        {parsedData.education.length > 0 && (
                            <SectionCard
                                title="Education"
                                icon={<GraduationCap className="h-5 w-5 text-sky-400" />}
                                count={parsedData.education.length}
                                expanded={expandedSections.education}
                                onToggle={() => toggleSection('education')}
                                delay={0.25}
                            >
                                <div className="space-y-3">
                                    {parsedData.education.map((edu, i) => (
                                        <div key={i} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-200">{edu.degree}</h4>
                                                <p className="text-sm text-slate-400">{edu.institution}</p>
                                            </div>
                                            <span className="text-sm text-slate-500 whitespace-nowrap">{edu.year}</span>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Collapsible Section Card ─────────────────────────── */

interface SectionCardProps {
    title: string;
    icon: React.ReactNode;
    count: number;
    expanded: boolean;
    onToggle: () => void;
    delay: number;
    children: React.ReactNode;
}

function SectionCard({ title, icon, count, expanded, onToggle, delay, children }: SectionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden"
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    {icon}
                    <span className="font-semibold text-slate-200">{title}</span>
                    <span className="ml-1 px-2 py-0.5 bg-slate-700/80 text-slate-400 text-xs rounded-full font-medium">
                        {count}
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
