import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, FileText, ArrowLeft, Maximize2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeBuilder() {
    const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', summary: '' });
    const [experience, setExperience] = useState([{ company: '', role: '', duration: '', description: '' }]);
    const [skills, setSkills] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'skills'>('personal');
    const [previewMode, setPreviewMode] = useState(false);

    const personalRef = useRef<HTMLDivElement>(null);
    const expRef = useRef<HTMLDivElement>(null);
    const skillsRef = useRef<HTMLDivElement>(null);

    // Smooth scroll to the active section when tab changes
    useEffect(() => {
        if (previewMode) return;
        
        const timer = setTimeout(() => {
            if (activeTab === 'personal' && personalRef.current) {
                personalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (activeTab === 'experience' && expRef.current) {
                expRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (activeTab === 'skills' && skillsRef.current) {
                skillsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [activeTab, previewMode]);

    const handleAddExperience = () => {
        setExperience([...experience, { company: '', role: '', duration: '', description: '' }]);
    };

    const handleRemoveExperience = (index: number) => {
        const newExp = experience.filter((_, i) => i !== index);
        setExperience(newExp);
    };

    const handleExpChange = (index: number, field: string, value: string) => {
        const newExp = [...experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setExperience(newExp);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setPreviewMode(true);
        }, 500);
    };

    return (
        <div className="w-full h-[calc(100vh-80px)] overflow-hidden p-4 sm:p-6 lg:p-8 flex gap-8">
            <AnimatePresence mode="wait">
                {!previewMode && (
                    <motion.div 
                        key="form-section"
                        initial={{ opacity: 0, x: -20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: '50%' }}
                        exit={{ opacity: 0, x: -50, width: 0, padding: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar pr-2"
                    >
                        <div className="space-y-6">
                            <div>
                    <h1 className="text-3xl font-bold mb-2">Resume Builder</h1>
                    <p className="text-slate-400">Fill out your details to generate a professional resume.</p>
                </div>

                {/* Animated Tabs */}
                <div className="relative flex rounded-xl bg-slate-900/60 p-1 mb-6 border border-slate-700/50">
                    {/* Animated Background */}
                    <div 
                        className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] bg-slate-700 rounded-lg shadow transition-all duration-300 ease-out z-0 ${
                            activeTab === 'personal' ? 'translate-x-0' : activeTab === 'experience' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-[calc(200%+12px)]'
                        }`}
                        style={{ width: 'calc(33.333% - 2.66px)' }}
                    />
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 py-2 relative z-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'personal' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('experience')}
                        className={`flex-1 py-2 relative z-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'experience' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        Experience
                    </button>
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`flex-1 py-2 relative z-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${activeTab === 'skills' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        Skills
                    </button>
                </div>

                <div className="space-y-4">
                    {activeTab === 'personal' && (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">Personal Information</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400">Full Name</label>
                                <input
                                    type="text"
                                    value={personalInfo.name}
                                    onChange={e => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400">Email address</label>
                                <input
                                    type="email"
                                    value={personalInfo.email}
                                    onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-medium text-slate-400">Phone Number</label>
                                <input
                                    type="tel"
                                    value={personalInfo.phone}
                                    onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-medium text-slate-400">Professional Summary</label>
                                <textarea
                                    rows={3}
                                    value={personalInfo.summary}
                                    onChange={e => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    placeholder="A brief summary of your professional background and goals..."
                                />
                            </div>
                        </div>
                    </div>
                    )}

                    {activeTab === 'experience' && (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-200">Experience</h2>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px] sm:max-w-xs">Add roles separately. Do not combine multiple jobs into one.</p>
                            </div>
                            <button onClick={handleAddExperience} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 shrink-0 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="h-4 w-4" /> Add Role
                            </button>
                        </div>
                        <div className="space-y-6">
                            {experience.map((exp, index) => (
                                <div key={index} className="space-y-4 relative pb-6 border-b border-slate-700 last:border-0 last:pb-0">
                                    {index > 0 && (
                                        <button
                                            onClick={() => handleRemoveExperience(index)}
                                            className="absolute top-0 right-0 p-1 text-slate-500 hover:text-red-400 focus:outline-none"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-400">Company</label>
                                            <input
                                                type="text"
                                                value={exp.company}
                                                onChange={e => handleExpChange(index, 'company', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Tech Inc"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-400">Role</label>
                                            <input
                                                type="text"
                                                value={exp.role}
                                                onChange={e => handleExpChange(index, 'role', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Software Engineer"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-sm font-medium text-slate-400">Duration</label>
                                            <input
                                                type="text"
                                                value={exp.duration}
                                                onChange={e => handleExpChange(index, 'duration', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                                placeholder="Jan 2020 - Present"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-sm font-medium text-slate-400">Description</label>
                                            <textarea
                                                rows={3}
                                                value={exp.description}
                                                onChange={e => handleExpChange(index, 'description', e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                                placeholder="Key responsibilities and achievements..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {activeTab === 'skills' && (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-slate-200">Skills</h2>
                            <p className="text-xs text-slate-400 mt-1">To add multiple skills properly, separate them with a comma (e.g., JavaScript, React, UI Design).</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-400">Technical & Soft Skills</label>
                            <input
                                type="text"
                                value={skills}
                                onChange={e => setSkills(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="React, Node.js, Project Management (comma separated)"
                            />
                        </div>
                    </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                        <div className="text-sm text-slate-500">
                            {activeTab === 'personal' && 'Step 1 of 3: Start with your basic details'}
                            {activeTab === 'experience' && 'Step 2 of 3: Add your work history'}
                            {activeTab === 'skills' && 'Step 3 of 3: Highlight your expertise'}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isSubmitting
                                    ? 'bg-blue-600/50 text-white/50 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'
                                }`}
                        >
                            <Maximize2 className="h-5 w-5" />
                            {isSubmitting ? 'Loading...' : 'Full Preview'}
                        </button>
                    </div>
                </div>
              </div>
            </motion.div>
            )}
            </AnimatePresence>

            {/* Preview Section */}
            <motion.div 
                layout
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className={`h-full flex flex-col ${previewMode ? 'w-full max-w-5xl mx-auto' : 'w-1/2'}`}
            >
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-slate-400" />
                        <h2 className="text-xl font-semibold text-slate-200">Live Preview</h2>
                    </div>
                    <AnimatePresence>
                        {previewMode && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-3"
                            >
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors border border-blue-500 shadow-lg"
                                >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => setPreviewMode(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 shadow-lg"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Editor
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/30 p-2 sm:p-4 md:p-8 overflow-y-auto custom-scrollbar relative">
                    <motion.div 
                        layout
                        initial={false}
                        animate={{ 
                            scale: previewMode ? 1 : 0.95,
                        }}
                        transition={{ duration: 0.4 }}
                        style={{ transformOrigin: 'top center' }}
                        className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl shrink-0 min-h-[1056px] w-[95%] sm:w-full max-w-[816px] mx-auto"
                    >
                        <div ref={personalRef} className="border-b-2 border-slate-800 pb-6 mb-6 pt-4 scroll-mt-8">
                        <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">
                            {personalInfo.name || 'YOUR NAME'}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            {personalInfo.email && <span>{personalInfo.email}</span>}
                            {personalInfo.phone && <span>{personalInfo.phone}</span>}
                        </div>
                    </div>

                    {personalInfo.summary && (
                        <div className="mb-6">
                            <p className="text-sm leading-relaxed">{personalInfo.summary}</p>
                        </div>
                    )}

                    {(activeTab === 'experience' || (experience.length > 0 && (experience[0].company || experience[0].role))) && (
                        <div ref={expRef} className="mb-6 scroll-mt-12 transition-all duration-300">
                            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-800">Experience</h2>
                            {!(experience.length > 0 && (experience[0].company || experience[0].role)) && (
                                <div className="text-slate-400 italic text-sm mb-4">Start typing in the editor to see your experience here...</div>
                            )}
                            <div className="space-y-4">
                                {experience.map((exp, idx) => (
                                    (exp.company || exp.role) ? (
                                        <div key={idx}>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-slate-800">{exp.role || 'Role'}</h3>
                                                <span className="text-sm text-slate-500">{exp.duration || 'Duration'}</span>
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 mb-2">{exp.company || 'Company'}</p>
                                            <p className="text-sm text-slate-600 whitespace-pre-line">{exp.description}</p>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'skills' || skills) && (
                        <div ref={skillsRef} className="scroll-mt-12 transition-all duration-300">
                            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-800">Skills</h2>
                            {!skills && (
                                <div className="text-slate-400 italic text-sm">Start typing in the editor to see your skills here...</div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {skills.split(',').map((skill, idx) => (
                                    skill.trim() && (
                                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                            {skill.trim()}
                                        </span>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
