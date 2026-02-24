import { useState } from 'react';
import { Award, GraduationCap, Briefcase, FileCode, CheckCircle, XCircle } from 'lucide-react';

export default function EligibilityCriteria() {
    const [marks, setMarks] = useState('');
    const [skills, setSkills] = useState('');
    const [experience, setExperience] = useState('');
    const [targetCompany, setTargetCompany] = useState('');

    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleCheck = () => {
        if (!marks || !skills || !targetCompany) return;

        setIsChecking(true);
        // Simulate API verification
        setTimeout(() => {
            const isEligible = parseFloat(marks) >= 7.5; // dummy logic
            setResult({
                eligible: isEligible,
                message: isEligible
                    ? `Congratulations! Your profile meets the baseline requirements for ${targetCompany}.`
                    : `Your profile currently does not meet the strict criteria for ${targetCompany}. Check the specific areas below.`,
                breakdown: [
                    { criteria: 'Academic Marks', passed: parseFloat(marks) >= 7.0, required: '7.0 CGPA / 70%' },
                    { criteria: 'Technical Skills', passed: true, required: 'Match with JD core skills' },
                    { criteria: 'Experience Level', passed: parseInt(experience || '0') >= 1, required: '1+ years preferred' }
                ]
            });
            setIsChecking(false);
        }, 1500);
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-4">
                    <Award className="h-10 w-10 text-yellow-500" />
                    Eligibility Checker
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Verify if you meet the specific cutoff marks, skills, and experience criteria for your dream company.
                </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Form */}
                <div className="md:col-span-7 bg-slate-800/40 p-6 sm:p-8 rounded-2xl border border-slate-700/50">
                    <h2 className="text-2xl font-semibold text-slate-100 mb-6">Enter Your Details</h2>

                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-blue-400" /> CGPA / Percentage
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={marks}
                                    onChange={e => setMarks(e.target.value)}
                                    placeholder="e.g. 8.5"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-emerald-400" /> Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    value={experience}
                                    onChange={e => setExperience(e.target.value)}
                                    placeholder="e.g. 2"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <FileCode className="h-4 w-4 text-purple-400" /> Top Skills
                            </label>
                            <input
                                type="text"
                                value={skills}
                                onChange={e => setSkills(e.target.value)}
                                placeholder="React, Node.js, AWS..."
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Award className="h-4 w-4 text-yellow-400" /> Target Company / Exam
                            </label>
                            <input
                                type="text"
                                value={targetCompany}
                                onChange={e => setTargetCompany(e.target.value)}
                                placeholder="e.g. Google / GATE"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleCheck}
                            disabled={isChecking || !marks || !skills || !targetCompany}
                            className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all ${isChecking || !marks || !skills || !targetCompany
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/25 hover:-translate-y-0.5 mt-4'
                                }`}
                        >
                            {isChecking ? 'Verifying...' : 'Check Eligibility'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="md:col-span-5">
                    {result ? (
                        <div className="bg-slate-800/40 p-6 sm:p-8 rounded-2xl border border-slate-700/50 h-full animate-in slide-in-from-right-8 duration-500">
                            <div className={`p-4 rounded-xl border mb-6 flex items-start gap-4 ${result.eligible
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                                    : 'bg-red-500/10 border-red-500/30 text-red-100'
                                }`}>
                                {result.eligible ? (
                                    <CheckCircle className="h-8 w-8 text-emerald-400 shrink-0 mt-1" />
                                ) : (
                                    <XCircle className="h-8 w-8 text-red-400 shrink-0 mt-1" />
                                )}
                                <div>
                                    <h3 className={`text-xl font-bold mb-1 ${result.eligible ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.eligible ? 'Eligible' : 'Not Eligible'}
                                    </h3>
                                    <p className="text-sm opacity-90">{result.message}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-300 border-b border-slate-700 pb-2">Breakdown</h4>
                                {result.breakdown.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-200 text-sm">{item.criteria}</p>
                                            <p className="text-xs text-slate-500">Req: {item.required}</p>
                                        </div>
                                        {item.passed ? (
                                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-bold uppercase flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Pass
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-bold uppercase flex items-center gap-1">
                                                <XCircle className="h-3 w-3" /> Fail
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/10 border border-slate-800 border-dashed rounded-2xl h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <Award className="h-16 w-16 text-slate-600 mb-4" />
                            <p className="text-slate-400">Fill out your profile details to see if you meet the requirements.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
