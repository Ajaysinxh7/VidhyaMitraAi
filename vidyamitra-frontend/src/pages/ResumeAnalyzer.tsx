import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzeResumeText, analyzeResume } from '../services/api';
import type { ATSAnalysisResult } from '../services/api';
import {
    Upload, FileText, Search, Target, Building2,
    CheckCircle2, XCircle, Lightbulb, TrendingUp,
    BarChart3, ShieldCheck, Sparkles, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function ResumeAnalyzer() {
    const { user } = useAuth();
    const [resumeText, setResumeText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [targetCompany, setTargetCompany] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<ATSAnalysisResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
            setUploadedFile(file);
            setError('');
        } else if (file) {
            setError('Only PDF and DOCX files are supported.');
            setUploadedFile(null);
        }
    };

    const handleAnalyze = async () => {
        if (inputMode === 'paste' && resumeText.trim().length < 50) {
            setError('Please paste a complete resume (at least 50 characters).');
            return;
        }
        if (inputMode === 'upload' && !uploadedFile) {
            setError('Please upload a PDF/DOCX file first.');
            return;
        }
        if (!targetRole.trim()) {
            setError('Please enter a target job role.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        setResult(null);

        try {
            const userId = user?.id || '';

            if (inputMode === 'paste') {
                const data = await analyzeResumeText(resumeText, targetRole, userId, targetCompany);
                setResult(data);
            } else if (uploadedFile) {
                const data = await analyzeResume(uploadedFile, targetRole, userId);
                // Map the upload response — the backend returns { data: { analysis_result: {...} } }
                const analysis = data?.data?.analysis_result || data;
                // Adapt old format to new format if needed
                if (analysis.atsScore !== undefined) {
                    setResult(analysis);
                } else if (analysis.score !== undefined) {
                    // Adapt old format
                    setResult({
                        atsScore: analysis.score,
                        foundKeywords: analysis.strengths || [],
                        missingKeywords: analysis.skill_gaps || analysis.missingSkills?.map((s: any) => s.name) || [],
                        recommendations: analysis.courses?.map((c: any) => `Take ${c.title} on ${c.provider}`) || [],
                        strengths: analysis.strengths || [],
                        verdict: `Resume scored ${analysis.score}/100 for ${targetRole}.`,
                    });
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || err.message || 'Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        setResult(null);
        setResumeText('');
        setUploadedFile(null);
        setTargetRole('');
        setTargetCompany('');
        setError('');
    };

    const getScoreColor = (score: number) => {
        if (score >= 91) return '#10b981';
        if (score >= 71) return '#34d399';
        if (score >= 41) return '#fbbf24';
        return '#ef4444';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 91) return 'Excellent';
        if (score >= 71) return 'Good';
        if (score >= 41) return 'Needs Improvement';
        return 'Needs Major Work';
    };

    return (
        <div style={{ minHeight: '100%', color: '#f8fafc' }}>
            <div style={pageContainer}>
                {/* HERO SECTION */}
                <header style={heroSection}>
                    <div style={heroGlow}></div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={heroIcon}><ShieldCheck size={28} /></div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>
                                    Resume <span style={{ color: '#818cf8' }}>Analysis</span>
                                </h1>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                                    AI-powered ATS scoring with detailed feedback
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT */}
                {!result ? (
                    <div style={inputContainer}>
                        {/* TARGET FIELDS */}
                        <div style={targetFieldsRow}>
                            <div style={{ flex: 2 }}>
                                <label style={fieldLabel}><Target size={13} /> Target Job Role *</label>
                                <input
                                    style={inputField}
                                    placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer..."
                                    value={targetRole}
                                    onChange={e => setTargetRole(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={fieldLabel}><Building2 size={13} /> Target Company (Optional)</label>
                                <input
                                    style={inputField}
                                    placeholder="e.g. Google, Microsoft..."
                                    value={targetCompany}
                                    onChange={e => setTargetCompany(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* INPUT MODE TABS */}
                        <div style={modeTabs}>
                            <button
                                style={inputMode === 'paste' ? modeTabActive : modeTab}
                                onClick={() => setInputMode('paste')}
                            >
                                <FileText size={15} /> Paste Resume Text
                            </button>
                            <button
                                style={inputMode === 'upload' ? modeTabActive : modeTab}
                                onClick={() => setInputMode('upload')}
                            >
                                <Upload size={15} /> Upload PDF/DOCX
                            </button>
                        </div>

                        {/* PASTE MODE */}
                        {inputMode === 'paste' && (
                            <div>
                                <textarea
                                    style={textArea}
                                    placeholder={`Paste your complete resume text here...\n\nExample:\n\nJohn Doe\nFull Stack Developer\njohn@email.com | +91 9876543210 | Bhopal, India\n\nSummary: Passionate developer with 2+ years of experience...\n\nSkills: React, Node.js, MongoDB, Python...\n\nExperience:\nSoftware Engineer at Tech Corp (2024-Present)\n- Developed REST APIs serving 10k+ users...\n\nEducation:\nB.Tech in Computer Science, NIT Bhopal (2022-2026)`}
                                    value={resumeText}
                                    onChange={e => setResumeText(e.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#475569' }}>{resumeText.length} characters</span>
                                    <span style={{ fontSize: '12px', color: resumeText.length >= 50 ? '#34d399' : '#ef4444' }}>
                                        {resumeText.length >= 50 ? '✓ Ready' : 'Minimum 50 characters needed'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* UPLOAD MODE */}
                        {inputMode === 'upload' && (
                            <div
                                style={dropZone}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
                                        setUploadedFile(file);
                                        setError('');
                                    }
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                {uploadedFile ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <CheckCircle2 size={40} color="#34d399" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, fontWeight: '700', color: '#34d399' }}>{uploadedFile.name}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                                            {(uploadedFile.size / 1024).toFixed(1)} KB • Click to change
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <Upload size={40} color="#64748b" style={{ marginBottom: '12px' }} />
                                        <p style={{ margin: 0, fontWeight: '700', color: '#94a3b8' }}>Drop your file here or click to browse</p>
                                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#475569' }}>PDF or DOCX • Maximum file size: 5MB</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ERROR */}
                        {error && (
                            <div style={errorBox}>
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        {/* ANALYZE BUTTON */}
                        <button
                            style={{ ...analyzeBtn, opacity: isAnalyzing ? 0.7 : 1, cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <span className="resume-spin"><RefreshCw size={18} /></span>
                                    <span>Analyzing with AI... This may take 10-15 seconds</span>
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    <span>Analyze My Resume</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    /* ===== RESULTS STATE ===== */
                    <div style={{ animation: 'resumeFadeIn 0.6s ease-out' }}>
                        {/* TOP ROW: ATS Score + Verdict */}
                        <div style={resultsTopRow}>
                            {/* ATS SCORE CIRCLE */}
                            <div style={scoreCardMain}>
                                <div style={scoreCircleOuter}>
                                    <svg width="180" height="180" viewBox="0 0 180 180">
                                        <circle cx="90" cy="90" r="78" fill="none" stroke="#1e293b" strokeWidth="12" />
                                        <circle
                                            cx="90" cy="90" r="78" fill="none"
                                            stroke={getScoreColor(result.atsScore)}
                                            strokeWidth="12" strokeLinecap="round"
                                            strokeDasharray={`${(result.atsScore / 100) * 490} 490`}
                                            transform="rotate(-90 90 90)"
                                            style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
                                        />
                                    </svg>
                                    <div style={scoreText}>
                                        <span style={{ fontSize: '42px', fontWeight: '900', color: getScoreColor(result.atsScore) }}>
                                            {result.atsScore}
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>/ 100</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    <div style={{ ...scoreBadge, background: `${getScoreColor(result.atsScore)}15`, color: getScoreColor(result.atsScore) }}>
                                        {getScoreLabel(result.atsScore)}
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '12px', marginTop: '6px' }}>ATS Compatibility Score</p>
                                </div>
                            </div>

                            {/* VERDICT + STRENGTHS */}
                            <div style={verdictCard}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={cardTitle}><Sparkles size={16} color="#fbbf24" /> AI Verdict</h3>
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '14px', margin: 0 }}>
                                        {result.verdict}
                                    </p>
                                </div>
                                {result.strengths && result.strengths.length > 0 && (
                                    <div>
                                        <h3 style={cardTitle}><TrendingUp size={16} color="#34d399" /> Strengths</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {result.strengths.map((s, i) => (
                                                <div key={i} style={strengthItem}>
                                                    <CheckCircle2 size={15} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION SCORES */}
                        {result.sectionScores && (
                            <div style={sectionScoresCard}>
                                <h3 style={cardTitle}><BarChart3 size={16} color="#818cf8" /> Section-wise Breakdown</h3>
                                <div style={scoresGrid}>
                                    {Object.entries(result.sectionScores).map(([key, score]) => (
                                        <div key={key}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' as const, color: '#94a3b8' }}>
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span style={{ fontSize: '13px', fontWeight: '800', color: getScoreColor(score as number) }}>{score as number}%</span>
                                            </div>
                                            <div style={progressBarBg}>
                                                <div style={{
                                                    height: '100%', borderRadius: '10px',
                                                    background: `linear-gradient(90deg, ${getScoreColor(score as number)}88, ${getScoreColor(score as number)})`,
                                                    width: `${score}%`,
                                                    transition: 'width 1.2s ease-out'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* KEYWORDS ROW */}
                        <div style={keywordsRow}>
                            <div style={keywordCard}>
                                <h3 style={cardTitle}><CheckCircle2 size={16} color="#34d399" /> Keywords Found</h3>
                                <div style={tagsWrap}>
                                    {result.foundKeywords && result.foundKeywords.map((k, i) => (
                                        <span key={i} style={foundTag}>{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={keywordCard}>
                                <h3 style={cardTitle}><XCircle size={16} color="#ef4444" /> Missing Keywords</h3>
                                <div style={tagsWrap}>
                                    {result.missingKeywords && result.missingKeywords.map((k, i) => (
                                        <span key={i} style={missingTag}>{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RECOMMENDATIONS */}
                        {result.recommendations && result.recommendations.length > 0 && (
                            <div style={recsCard}>
                                <h3 style={cardTitle}><Lightbulb size={16} color="#fbbf24" /> AI Recommendations</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {result.recommendations.map((rec, i) => (
                                        <div key={i} style={recItem}>
                                            <div style={recNumber}>{i + 1}</div>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>{rec}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RETRY BUTTON */}
                        <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '40px' }}>
                            <button style={retryBtn} onClick={resetAnalysis}>
                                <RefreshCw size={16} /> Analyze Another Resume
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Animation CSS */}
            <style>{`
                @keyframes resumeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .resume-spin { animation: resumeSpin 1s linear infinite; display: inline-flex; }
                @keyframes resumeFadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            `}</style>
        </div>
    );
}

// ===========================================
//                 STYLES
// ===========================================

const pageContainer: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 60px' };

const heroSection: React.CSSProperties = {
    position: 'relative', padding: '30px', borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
    border: '1px solid rgba(99,102,241,0.15)', marginBottom: '30px', overflow: 'hidden'
};
const heroGlow: React.CSSProperties = {
    position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    borderRadius: '50%', zIndex: 1
};
const heroIcon: React.CSSProperties = {
    width: '52px', height: '52px', borderRadius: '16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
};

const inputContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };

const targetFieldsRow: React.CSSProperties = { display: 'flex', gap: '16px', flexWrap: 'wrap' };
const fieldLabel: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '12px', fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
};
const inputField: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box'
};

const modeTabs: React.CSSProperties = { display: 'flex', gap: '8px' };
const modeTab: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b',
    color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
};
const modeTabActive: React.CSSProperties = {
    ...modeTab,
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
    color: '#818cf8'
};

const textArea: React.CSSProperties = {
    width: '100%', minHeight: '280px', padding: '20px',
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '16px', color: '#e2e8f0', fontSize: '13px',
    lineHeight: '1.8', outline: 'none', resize: 'vertical',
    fontFamily: "'Plus Jakarta Sans', monospace", boxSizing: 'border-box'
};

const dropZone: React.CSSProperties = {
    padding: '50px 30px', borderRadius: '16px',
    border: '2px dashed #1e293b', background: 'rgba(15,23,42,0.5)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '200px'
};

const errorBox: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', borderRadius: '12px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171', fontSize: '13px', fontWeight: '600'
};

const analyzeBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '14px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
};

// Results styles
const resultsTopRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginBottom: '20px' };

const scoreCardMain: React.CSSProperties = {
    background: '#0f172a', borderRadius: '24px', padding: '30px',
    border: '1px solid #1e293b', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
};
const scoreCircleOuter: React.CSSProperties = { position: 'relative', width: '180px', height: '180px' };
const scoreText: React.CSSProperties = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
};
const scoreBadge: React.CSSProperties = {
    padding: '4px 14px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '700', display: 'inline-block'
};

const verdictCard: React.CSSProperties = {
    background: '#0f172a', borderRadius: '24px', padding: '28px',
    border: '1px solid #1e293b'
};
const cardTitle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: '700', color: '#f8fafc',
    marginBottom: '14px', margin: '0 0 14px 0'
};
const strengthItem: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '10px' };

const sectionScoresCard: React.CSSProperties = {
    background: '#0f172a', borderRadius: '24px', padding: '28px',
    border: '1px solid #1e293b', marginBottom: '20px'
};
const scoresGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const progressBarBg: React.CSSProperties = { height: '8px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden' };

const keywordsRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' };
const keywordCard: React.CSSProperties = {
    background: '#0f172a', borderRadius: '24px', padding: '28px',
    border: '1px solid #1e293b'
};
const tagsWrap: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
const foundTag: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'
};
const missingTag: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'
};

const recsCard: React.CSSProperties = {
    background: '#0f172a', borderRadius: '24px', padding: '28px',
    border: '1px solid #1e293b'
};
const recItem: React.CSSProperties = {
    display: 'flex', alignItems: 'flex-start', gap: '14px',
    padding: '14px', borderRadius: '14px',
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'
};
const recNumber: React.CSSProperties = {
    width: '28px', height: '28px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '800', flexShrink: 0, color: '#fff'
};

const retryBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '12px 28px', borderRadius: '12px',
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
    color: '#818cf8', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
};
