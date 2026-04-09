import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import {
    Download, Plus, Trash2, Save, ChevronDown, ChevronUp,
    User, Briefcase, GraduationCap, Award, Code2, FolderGit2,
    Link2, Mail, Phone, MapPin, GitBranch, Globe,
    CheckCircle2
} from 'lucide-react';

interface ResumeData {
    name: string; role: string; email: string; phone: string; location: string;
    linkedin: string; github: string; portfolio: string;
    summary: string;
    skills: { label: string; value: string }[];
    experience: { company: string; role: string; duration: string; bullets: string[] }[];
    projects: { title: string; tech: string; github: string; live: string; desc: string }[];
    education: { degree: string; institute: string; startYear: string; endYear: string; gpa: string }[];
    certifications: { title: string; issuer: string; year: string }[];
    languages: string;
}

export default function ResumeBuilder() {
    const { user } = useAuth();
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        personal: true, summary: true, experience: true, projects: true,
        education: true, skills: true, certifications: true
    });

    const [data, setData] = useState<ResumeData>({
        name: '', role: '', email: '', phone: '', location: '',
        linkedin: '', github: '', portfolio: '',
        summary: '',
        skills: [{ label: '', value: '' }],
        experience: [{ company: '', role: '', duration: '', bullets: [''] }],
        projects: [{ title: '', tech: '', github: '', live: '', desc: '' }],
        education: [{ degree: '', institute: '', startYear: '', endYear: '', gpa: '' }],
        certifications: [{ title: '', issuer: '', year: '' }],
        languages: ''
    });

    // --- HANDLERS ---
    const toggleSection = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
    const handleChange = (field: string, value: string) => setData(p => ({ ...p, [field]: value }));
    const handleSkillChange = (index: number, field: 'label' | 'value', val: string) => {
        const updated = [...data.skills];
        updated[index] = { ...updated[index], [field]: val };
        setData({ ...data, skills: updated });
    };
    const addSkill = () => setData({ ...data, skills: [...data.skills, { label: '', value: '' }] });
    const removeSkill = (index: number) => {
        if (data.skills.length <= 1) return;
        setData({ ...data, skills: data.skills.filter((_, i) => i !== index) });
    };

    const handleListChange = (section: keyof ResumeData, index: number, field: string, value: string) => {
        let finalValue = value;
        if (field === 'year' || field === 'startYear' || field === 'endYear') {
            finalValue = value.replace(/\D/g, '').slice(0, 4);
        }
        const updated = [...(data[section] as any[])];
        updated[index] = { ...updated[index], [field]: finalValue };
        setData({ ...data, [section]: updated });
    };
    const addItem = (section: keyof ResumeData, template: any) => setData({ ...data, [section]: [...(data[section] as any[]), template] });
    const removeItem = (section: keyof ResumeData, index: number) => {
        if ((data[section] as any[]).length <= 1) return;
        setData({ ...data, [section]: (data[section] as any[]).filter((_: any, i: number) => i !== index) });
    };

    // Experience bullets
    const handleBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
        const updated = [...data.experience];
        updated[expIdx] = { ...updated[expIdx], bullets: [...updated[expIdx].bullets] };
        updated[expIdx].bullets[bulletIdx] = value;
        setData({ ...data, experience: updated });
    };
    const addBullet = (expIdx: number) => {
        const updated = [...data.experience];
        updated[expIdx] = { ...updated[expIdx], bullets: [...updated[expIdx].bullets, ''] };
        setData({ ...data, experience: updated });
    };
    const removeBullet = (expIdx: number, bulletIdx: number) => {
        const updated = [...data.experience];
        if (updated[expIdx].bullets.length <= 1) return;
        updated[expIdx] = { ...updated[expIdx], bullets: updated[expIdx].bullets.filter((_: string, i: number) => i !== bulletIdx) };
        setData({ ...data, experience: updated });
    };

    // Save to Supabase
    const saveResume = async () => {
        setSaveStatus('saving');
        try {
            const userId = user?.id || '';
            await supabase.from('resumes').insert({
                user_id: userId,
                title: data.role || 'Untitled Resume',
                data: data,
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            alert('Error saving resume. Please check connection.');
            setSaveStatus('idle');
        }
    };

    const handlePrint = () => window.print();

    // Accordion helper (plain render, NOT a component — avoids remount/focus-loss)
    const renderAccordion = (id: string, Icon: any, title: string, color: string, children: React.ReactNode) => (
        <div style={accordionBox} key={id}>
            <div style={accordionHeader} onClick={() => toggleSection(id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ ...accordionIconBox, background: `${color}15`, color }}><Icon size={16} /></div>
                    <span style={{ fontWeight: '700', fontSize: '13px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{title}</span>
                </div>
                {openSections[id] ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>
            {openSections[id] && <div style={accordionBody}>{children}</div>}
        </div>
    );

    return (
        <div className="no-print" style={{ minHeight: '100%', color: '#fff' }}>
            {/* ACTION BAR */}
            <div style={actionBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Resume <span style={{ color: '#818cf8' }}>Builder</span></h2>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {saveStatus === 'saved' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '12px', fontWeight: '600' }}>
                            <CheckCircle2 size={14} /> Saved
                        </span>
                    )}
                    <button style={saveBtnStyle} onClick={saveResume} disabled={saveStatus === 'saving'}>
                        {saveStatus === 'saving' ? <span className="resume-spin"><Save size={14} /></span> : <Save size={14} />}
                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                    </button>
                    <button style={downloadBtnStyle} onClick={handlePrint}>
                        <Download size={14} /> Download PDF
                    </button>
                </div>
            </div>

            <div style={layout}>
                {/* === LEFT: EDITOR === */}
                <aside style={sidebar}>
                    {/* Personal Info */}
                    {renderAccordion('personal', User, 'Personal Info', '#818cf8', <>
                        <div style={gridTwo}>
                            <StyledInput placeholder="Full Name" value={data.name} onChange={v => handleChange('name', v)} />
                            <StyledInput placeholder="Target Role (e.g. Full Stack Dev)" value={data.role} onChange={v => handleChange('role', v)} />
                        </div>
                        <div style={gridTwo}>
                            <StyledInput placeholder="Email" value={data.email} onChange={v => handleChange('email', v)} icon={<Mail size={13} />} />
                            <StyledInput placeholder="Phone" value={data.phone} onChange={v => handleChange('phone', v)} icon={<Phone size={13} />} />
                        </div>
                        <StyledInput placeholder="Location (e.g. Bhopal, India)" value={data.location} onChange={v => handleChange('location', v)} icon={<MapPin size={13} />} />
                        <div style={gridTwo}>
                            <StyledInput placeholder="LinkedIn URL" value={data.linkedin} onChange={v => handleChange('linkedin', v)} icon={<Link2 size={13} />} />
                            <StyledInput placeholder="GitHub URL" value={data.github} onChange={v => handleChange('github', v)} icon={<GitBranch size={13} />} />
                        </div>
                        <StyledInput placeholder="Portfolio URL (optional)" value={data.portfolio} onChange={v => handleChange('portfolio', v)} icon={<Globe size={13} />} />
                    </>)}

                    {/* Summary */}
                    {renderAccordion('summary', Code2, 'Professional Summary', '#34d399', <>
                        <textarea
                            style={{ ...inputBase, height: '90px', resize: 'vertical' }}
                            placeholder="Write a compelling 2-3 line summary about yourself..."
                            value={data.summary}
                            onChange={e => handleChange('summary', e.target.value)}
                        />
                        <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {data.summary.length}/300 characters
                        </div>
                    </>)}

                    {/* Experience */}
                    {renderAccordion('experience', Briefcase, 'Work Experience', '#f59e0b', <>
                        {data.experience.map((exp, i) => (
                            <div key={i} style={itemCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>EXPERIENCE {i + 1}</span>
                                    <Trash2 size={13} color="#ef4444" cursor="pointer" onClick={() => removeItem('experience', i)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="Company" value={exp.company} onChange={v => handleListChange('experience', i, 'company', v)} />
                                    <StyledInput placeholder="Role / Title" value={exp.role} onChange={v => handleListChange('experience', i, 'role', v)} />
                                </div>
                                <StyledInput placeholder="Duration (e.g. Jan 2025 - Present)" value={exp.duration} onChange={v => handleListChange('experience', i, 'duration', v)} />
                                <div style={{ marginTop: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Bullet Points</span>
                                    {exp.bullets.map((bullet, bi) => (
                                        <div key={bi} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            <span style={{ color: '#6366f1', marginTop: '10px', fontSize: '10px' }}>•</span>
                                            <input
                                                style={{ ...inputBase, flex: 1 }}
                                                placeholder="Describe an achievement..."
                                                value={bullet}
                                                onChange={e => handleBulletChange(i, bi, e.target.value)}
                                            />
                                            <Trash2 size={12} color="#ef4444" cursor="pointer" style={{ marginTop: '10px' }} onClick={() => removeBullet(i, bi)} />
                                        </div>
                                    ))}
                                    <button style={addSmallBtn} onClick={() => addBullet(i)}>+ Add Bullet</button>
                                </div>
                            </div>
                        ))}
                        <button style={addItemBtn} onClick={() => addItem('experience', { company: '', role: '', duration: '', bullets: [''] })}>
                            <Plus size={14} /> Add Experience
                        </button>
                    </>)}

                    {/* Projects */}
                    {renderAccordion('projects', FolderGit2, 'Projects', '#ec4899', <>
                        {data.projects.map((proj, i) => (
                            <div key={i} style={itemCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PROJECT {i + 1}</span>
                                    <Trash2 size={13} color="#ef4444" cursor="pointer" onClick={() => removeItem('projects', i)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="Project Title" value={proj.title} onChange={v => handleListChange('projects', i, 'title', v)} />
                                    <StyledInput placeholder="Tech Stack (React, Node...)" value={proj.tech} onChange={v => handleListChange('projects', i, 'tech', v)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="GitHub Link" value={proj.github} onChange={v => handleListChange('projects', i, 'github', v)} />
                                    <StyledInput placeholder="Live Demo URL" value={proj.live} onChange={v => handleListChange('projects', i, 'live', v)} />
                                </div>
                                <textarea
                                    style={{ ...inputBase, height: '60px', resize: 'vertical' }}
                                    placeholder="Short description of the project..."
                                    value={proj.desc}
                                    onChange={e => handleListChange('projects', i, 'desc', e.target.value)}
                                />
                            </div>
                        ))}
                        <button style={addItemBtn} onClick={() => addItem('projects', { title: '', tech: '', github: '', live: '', desc: '' })}>
                            <Plus size={14} /> Add Project
                        </button>
                    </>)}

                    {/* Education */}
                    {renderAccordion('education', GraduationCap, 'Education', '#06b6d4', <>
                        {data.education.map((edu, i) => (
                            <div key={i} style={itemCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>EDUCATION {i + 1}</span>
                                    <Trash2 size={13} color="#ef4444" cursor="pointer" onClick={() => removeItem('education', i)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="Degree (B.Tech CS)" value={edu.degree} onChange={v => handleListChange('education', i, 'degree', v)} />
                                    <StyledInput placeholder="Institute" value={edu.institute} onChange={v => handleListChange('education', i, 'institute', v)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="Starting Year (e.g. 2022)" value={edu.startYear} onChange={v => handleListChange('education', i, 'startYear', v)} />
                                    <StyledInput placeholder="Passing Year (e.g. 2026)" value={edu.endYear} onChange={v => handleListChange('education', i, 'endYear', v)} />
                                </div>
                                <div style={gridTwo}>
                                    <StyledInput placeholder="GPA (optional)" value={edu.gpa} onChange={v => handleListChange('education', i, 'gpa', v)} />
                                    <div />
                                </div>
                            </div>
                        ))}
                        <button style={addItemBtn} onClick={() => addItem('education', { degree: '', institute: '', startYear: '', endYear: '', gpa: '' })}>
                            <Plus size={14} /> Add Education
                        </button>
                    </>)}

                    {/* Skills */}
                    {renderAccordion('skills', Code2, 'Skills', '#8b5cf6', <>
                        {data.skills.map((skill, i) => (
                            <div key={i} style={{ ...itemCard, padding: '10px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>SKILL GROUP {i + 1}</span>
                                    <Trash2 size={12} color="#ef4444" cursor="pointer" onClick={() => removeSkill(i)} />
                                </div>
                                <div style={gridTwo}>
                                    <input
                                        style={{ ...inputBase, fontWeight: '700', color: '#818cf8' }}
                                        placeholder="Category (e.g. Languages, Tools...)"
                                        value={skill.label}
                                        onChange={e => handleSkillChange(i, 'label', e.target.value)}
                                    />
                                    <input
                                        style={inputBase}
                                        placeholder="Skills (e.g. Python, Java, SQL...)"
                                        value={skill.value}
                                        onChange={e => handleSkillChange(i, 'value', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        <button style={addItemBtn} onClick={addSkill}>
                            <Plus size={14} /> Add Skill Category
                        </button>
                    </>)}

                    {/* Certifications */}
                    {renderAccordion('certifications', Award, 'Certifications', '#f97316', <>
                        {data.certifications.map((cert, i) => (
                            <div key={i} style={itemCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>CERT {i + 1}</span>
                                    <Trash2 size={13} color="#ef4444" cursor="pointer" onClick={() => removeItem('certifications', i)} />
                                </div>
                                <StyledInput placeholder="Certification Title" value={cert.title} onChange={v => handleListChange('certifications', i, 'title', v)} />
                                <div style={gridTwo}>
                                    <StyledInput placeholder="Issuer (Google, AWS...)" value={cert.issuer} onChange={v => handleListChange('certifications', i, 'issuer', v)} />
                                    <StyledInput placeholder="Year" value={cert.year} onChange={v => handleListChange('certifications', i, 'year', v)} />
                                </div>
                            </div>
                        ))}
                        <button style={addItemBtn} onClick={() => addItem('certifications', { title: '', issuer: '', year: '' })}>
                            <Plus size={14} /> Add Certification
                        </button>
                    </>)}
                </aside>

                {/* === RIGHT: LIVE A4 PREVIEW === */}
                <main style={previewArea}>
                    <div id="resume-root" className="print-area" style={paper}>
                        {/* HEADER */}
                        <header style={pHeader}>
                            <h1 style={pName}>{data.name || 'Your Name'}</h1>
                            <p style={pRole}>{data.role || 'Your Target Role'}</p>
                            <div style={pContactRow}>
                                {data.email && <span>{data.email}</span>}
                                {data.phone && <span>• {data.phone}</span>}
                                {data.location && <span>• {data.location}</span>}
                            </div>
                            <div style={pContactRow}>
                                {data.linkedin && <span style={{ color: '#6366f1' }}>LinkedIn: {data.linkedin}</span>}
                                {data.github && <span style={{ color: '#6366f1' }}>• GitHub: {data.github}</span>}
                                {data.portfolio && <span style={{ color: '#6366f1' }}>• {data.portfolio}</span>}
                            </div>
                        </header>

                        {/* SUMMARY */}
                        {data.summary && (
                            <PreviewSection title="PROFESSIONAL SUMMARY">
                                <p style={pText}>{data.summary}</p>
                            </PreviewSection>
                        )}

                        {/* SKILLS */}
                        {data.skills.some(s => s.label.trim() || s.value.trim()) && (
                            <PreviewSection title="SKILLS">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {data.skills.filter(s => s.label || s.value).map((skill, i) => (
                                        <div key={i} style={skillRow}>
                                            {skill.label && <b style={skillLabel}>{skill.label}:</b>} {skill.value}
                                        </div>
                                    ))}
                                </div>
                            </PreviewSection>
                        )}

                        {/* EXPERIENCE */}
                        {data.experience.some(e => e.company || e.role) && (
                            <PreviewSection title="WORK EXPERIENCE">
                                {data.experience.filter(e => e.company || e.role).map((exp, i) => (
                                    <div key={i} style={{ marginBottom: '14px' }}>
                                        <div style={pFlexBetween}>
                                            <b style={{ fontSize: '14px', color: '#0f172a' }}>{exp.company}</b>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{exp.duration}</span>
                                        </div>
                                        <div style={{ color: '#6366f1', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{exp.role}</div>
                                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                            {exp.bullets.filter(b => b.trim()).map((b, bi) => (
                                                <li key={bi} style={pText}>{b}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* PROJECTS */}
                        {data.projects.some(p => p.title) && (
                            <PreviewSection title="PROJECTS">
                                {data.projects.filter(p => p.title).map((proj, i) => (
                                    <div key={i} style={{ marginBottom: '14px' }}>
                                        <div style={pFlexBetween}>
                                            <b style={{ fontSize: '14px', color: '#0f172a' }}>{proj.title}</b>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{proj.github || proj.live}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#6366f1', marginBottom: '2px' }}>Tech: {proj.tech}</div>
                                        <p style={pText}>{proj.desc}</p>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* EDUCATION */}
                        {data.education.some(e => e.degree || e.institute) && (
                            <PreviewSection title="EDUCATION">
                                {data.education.filter(e => e.degree || e.institute).map((edu, i) => (
                                    <div key={i} style={{ ...pFlexBetween, marginBottom: '8px' }}>
                                        <div>
                                            <b style={{ fontSize: '14px', color: '#0f172a' }}>{edu.institute}</b>
                                            <div style={{ fontSize: '13px', color: '#475569' }}>{edu.degree}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
                                        </div>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{edu.startYear} {edu.startYear && edu.endYear ? '-' : ''} {edu.endYear}</span>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}

                        {/* CERTIFICATIONS */}
                        {data.certifications.some(c => c.title) && (
                            <PreviewSection title="CERTIFICATIONS">
                                {data.certifications.filter(c => c.title).map((cert, i) => (
                                    <div key={i} style={{ ...pFlexBetween, marginBottom: '6px' }}>
                                        <span style={{ fontSize: '13px' }}><b>{cert.title}</b> — {cert.issuer}</span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{cert.year}</span>
                                    </div>
                                ))}
                            </PreviewSection>
                        )}
                    </div>
                </main>
            </div>

            {/* PRINT CSS + Animations */}
            <style>{`
                @keyframes resumeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .resume-spin { animation: resumeSpin 1s linear infinite; display: inline-flex; }
                @media print {
                    @page { size: A4; margin: 0; }
                    .no-print { display: none !important; }
                    .print-area {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important; top: 0 !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        padding: 45px 50px !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: #1e293b !important;
                        z-index: 9999;
                    }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}

// --- Reusable Input Component ---
const StyledInput = ({ placeholder, value, onChange, icon }: {
    placeholder: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode;
}) => (
    <div style={{ position: 'relative', marginBottom: '8px' }}>
        {icon && <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>{icon}</div>}
        <input
            style={{ ...inputBase, paddingLeft: icon ? '32px' : '12px' }}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

// --- Preview Section Component ---
const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginTop: '20px' }}>
        <h5 style={pSectionTitle}>{title}</h5>
        {children}
    </div>
);

// ===========================================
//                 STYLES
// ===========================================

const layout: React.CSSProperties = { display: 'grid', gridTemplateColumns: '420px 1fr', height: 'calc(100vh - 130px)' };

const sidebar: React.CSSProperties = { background: '#0f172a', padding: '20px', overflowY: 'auto', borderRight: '1px solid #1e293b' };
const previewArea: React.CSSProperties = { background: '#1e293b', padding: '30px', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' };

const actionBar: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 30px',
    background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #1e293b'
};

const saveBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(52,211,153,0.1)', color: '#34d399',
    border: '1px solid rgba(52,211,153,0.3)',
    padding: '8px 16px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '700'
};
const downloadBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#6366f1', color: '#fff', border: 'none',
    padding: '8px 16px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '700',
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
};

const inputBase: React.CSSProperties = {
    width: '100%', background: '#1e293b', border: '1px solid #334155',
    padding: '9px 12px', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
};

const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' };

const accordionBox: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px', border: '1px solid #1e293b',
    marginBottom: '12px', overflow: 'hidden'
};
const accordionHeader: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', cursor: 'pointer',
    background: 'rgba(255,255,255,0.02)'
};
const accordionIconBox: React.CSSProperties = {
    width: '30px', height: '30px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const accordionBody: React.CSSProperties = { padding: '12px 16px 16px' };

const itemCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)', padding: '14px',
    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)',
    marginBottom: '10px'
};

const addItemBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    width: '100%', padding: '10px', marginTop: '8px',
    background: 'rgba(99,102,241,0.05)', color: '#818cf8',
    border: '1px dashed rgba(99,102,241,0.3)',
    borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
};

const addSmallBtn: React.CSSProperties = {
    background: 'transparent', border: 'none', color: '#818cf8',
    cursor: 'pointer', fontSize: '11px', fontWeight: '600', marginTop: '6px', padding: '2px 0'
};

// Paper (A4 Preview) Styles
const paper: React.CSSProperties = {
    width: '210mm', minHeight: '297mm',
    background: '#fff', padding: '45px 50px',
    color: '#334155', fontFamily: "'Inter','Plus Jakarta Sans',sans-serif",
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    borderRadius: '4px'
};

const pHeader: React.CSSProperties = { textAlign: 'center', borderBottom: '2.5px solid #1e293b', paddingBottom: '16px' };
const pName: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: '32px', letterSpacing: '-1px', fontWeight: '800' };
const pRole: React.CSSProperties = { color: '#6366f1', fontWeight: '700', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px', marginBottom: '0' };
const pContactRow: React.CSSProperties = { fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' };

const pSectionTitle: React.CSSProperties = {
    fontSize: '11px', color: '#0f172a', fontWeight: '800',
    borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px',
    marginBottom: '10px', letterSpacing: '1.5px', textTransform: 'uppercase'
};
const pText: React.CSSProperties = { fontSize: '12.5px', lineHeight: '1.6', margin: '0 0 2px 0', color: '#475569' };
const pFlexBetween: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const skillRow: React.CSSProperties = { fontSize: '12.5px', lineHeight: '1.8', color: '#475569' };
const skillLabel: React.CSSProperties = { color: '#0f172a', fontSize: '12.5px' };
