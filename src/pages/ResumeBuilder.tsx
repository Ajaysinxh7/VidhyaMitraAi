import { useState } from 'react';
import { Save, Plus, Trash2, FileText } from 'lucide-react';

export default function ResumeBuilder() {
    const [personalInfo, setPersonalInfo] = useState({ name: '', email: '', phone: '', summary: '' });
    const [experience, setExperience] = useState([{ company: '', role: '', duration: '', description: '' }]);
    const [skills, setSkills] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            alert('Resume saved successfully!');
        }, 1000);
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="w-full lg:w-1/2 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Resume Builder</h1>
                    <p className="text-slate-400">Fill out your details to generate a professional resume.</p>
                </div>

                <div className="space-y-4">
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

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-200">Experience</h2>
                            <button onClick={handleAddExperience} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
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

                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h2 className="text-xl font-semibold mb-4 text-slate-200">Skills</h2>
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

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isSubmitting
                                    ? 'bg-blue-600/50 text-white/50 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5'
                                }`}
                        >
                            <Save className="h-5 w-5" />
                            {isSubmitting ? 'Saving...' : 'Save Resume'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="w-full lg:w-1/2 mt-8 lg:mt-0 lg:pl-8 lg:border-l border-slate-800 xl:sticky xl:top-[88px] xl:self-start">
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="h-6 w-6 text-slate-400" />
                    <h2 className="text-xl font-semibold text-slate-200">Live Preview</h2>
                </div>

                <div className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl min-h-[800px] border border-slate-200" style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
                    <div className="border-b-2 border-slate-800 pb-6 mb-6">
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

                    {(experience.length > 0 && (experience[0].company || experience[0].role)) && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-800">Experience</h2>
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

                    {skills && (
                        <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-800">Skills</h2>
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
                </div>
            </div>
        </div>
    );
}
