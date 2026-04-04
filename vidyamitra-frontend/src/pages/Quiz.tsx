import { useState, useEffect, useRef } from 'react';
import {
    HelpCircle, Clock, ArrowRight, RotateCcw,
    ChevronDown, BookOpen, CheckCircle, XCircle, AlertCircle, Sparkles
} from 'lucide-react';
import ScoreCircle from '../components/ScoreCircle';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import {
    generateQuiz as generateQuizAPI,
    submitQuiz as submitQuizAPI,
} from '../services/api';
import type { QuizQuestion, QuizAnswerItem, DetailedResult, SubmitQuizResponse } from '../services/api';
import ResumeUploader from '../components/ResumeUploader';

// ─── Types ──────────────────────────────────────────────────────────────────

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// ─── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string }[] = [
    { value: 'beginner', label: '🌱 Beginner', color: 'text-emerald-400' },
    { value: 'intermediate', label: '🔥 Intermediate', color: 'text-amber-400' },
    { value: 'advanced', label: '⚡ Advanced', color: 'text-red-400' },
];

const NUM_QUESTION_OPTIONS = [3, 5, 10];

// Time limit scales with question count (30s per question, min 60s)
const getTimeLimit = (numQ: number) => Math.max(60, numQ * 30);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Quiz() {
    const { user } = useAuth();
    const { parsedResume, setParsedResume } = useAppContext();
    const userId = user?.id ?? 'anonymous';

    // ── Setup state ──
    const [quizMode, setQuizMode] = useState<'topic' | 'resume'>('resume');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
    const [numQuestions, setNumQuestions] = useState<number>(5);

    // ── Quiz state ──
    const [quizId, setQuizId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<QuizAnswerItem[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // ── Screen state ──
    const [isStarted, setIsStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [results, setResults] = useState<SubmitQuizResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [topicError, setTopicError] = useState<string | null>(null);

    // ── Timer ──
    const timeLimit = getTimeLimit(numQuestions);
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    // Use a ref so the submit callback always has the latest quizId/answers
    const quizIdRef = useRef<string | null>(null);
    const answersRef = useRef<QuizAnswerItem[]>([]);

    // Sync refs with state
    useEffect(() => { quizIdRef.current = quizId; }, [quizId]);
    useEffect(() => { answersRef.current = answers; }, [answers]);

    // ── Timer countdown ──
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isStarted && !isFinished && !isLoading && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isStarted && !isFinished) {
            // Auto-submit when time runs out
            handleSubmitQuiz(answersRef.current);
        }
        return () => clearTimeout(timer);
    }, [isStarted, isFinished, isLoading, timeLeft]);

    // ─── API Calls ──────────────────────────────────────────────────────────

    const handleGenerateQuiz = async () => {
        // Validate
        if (quizMode === 'topic' && !topic.trim()) {
            setTopicError('Please enter a topic to generate a quiz.');
            return;
        }
        if (quizMode === 'resume' && !parsedResume) {
            setTopicError('Please upload your resume to generate a quiz.');
            return;
        }
        setTopicError(null);
        setError(null);
        setIsLoading(true);

        try {
            const topicToSend = quizMode === 'resume' ? 'Resume Based' : topic.trim();
            const resumeToSend = quizMode === 'resume' && parsedResume ? parsedResume : undefined;
            
            const response = await generateQuizAPI(userId, topicToSend, difficulty, numQuestions, resumeToSend);
            setQuizId(response.quiz_id);
            setQuestions(response.questions);
            setAnswers([]);
            setCurrentQuestionIdx(0);
            setSelectedOption(null);
            setTimeLeft(getTimeLimit(response.questions.length));
            setIsStarted(true);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ??
                err?.message ??
                'Failed to generate quiz. Please check your connection and try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitQuiz = async (finalAnswers: QuizAnswerItem[]) => {
        if (isFinished) return; // prevent double-call
        setIsFinished(true);
        setIsLoading(true);
        setError(null);

        try {
            const response = await submitQuizAPI(userId, quizIdRef.current!, finalAnswers);
            setResults(response);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail ??
                err?.message ??
                'Failed to submit quiz. Your answers may not have been saved.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Navigation ─────────────────────────────────────────────────────────

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
    };

    const handleNext = () => {
        const currentQ = questions[currentQuestionIdx];
        // Record answer (replace existing if already answered this question)
        const newAnswer: QuizAnswerItem = {
            question_id: currentQ.id,
            selected_option: selectedOption ?? '',
        };
        const updatedAnswers = [
            ...answers.filter(a => a.question_id !== currentQ.id),
            newAnswer,
        ];
        setAnswers(updatedAnswers);

        if (currentQuestionIdx < questions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedOption(null);
        } else {
            // Last question — submit
            handleSubmitQuiz(updatedAnswers);
        }
    };

    const handleRetry = () => {
        // Reset everything back to setup screen
        setTopic('');
        setDifficulty('intermediate');
        setNumQuestions(5);
        setQuizId(null);
        setQuestions([]);
        setAnswers([]);
        setCurrentQuestionIdx(0);
        setSelectedOption(null);
        setIsStarted(false);
        setIsFinished(false);
        setIsLoading(false);
        setResults(null);
        setError(null);
        setTopicError(null);
        setTimeLeft(getTimeLimit(5));
    };

    // ─── Derived UI values ───────────────────────────────────────────────────

    const timeMins = Math.floor(timeLeft / 60);
    const timeSecs = timeLeft % 60;
    const scorePercentage = results?.score_percentage ?? 0;

    // ─── SCREEN: Loading ─────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <div className="text-center space-y-6">
                    <LoadingSpinner
                        message={isStarted ? 'Grading your quiz…' : 'Generating your quiz with AI…'}
                    />
                    {!isStarted && (
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">
                            This may take a few seconds. The AI is crafting {numQuestions} quality questions on <span className="text-cyan-400 font-medium">{topic}</span>.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ─── SCREEN: Setup (topic input) ─────────────────────────────────────────

    if (!isStarted) {
        return (
            <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center p-4 py-8 animate-in fade-in duration-500">
                <div className="max-w-xl w-full bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl shrink-0">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-full mb-4">
                            <HelpCircle className="h-8 w-8 text-cyan-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">AI Quiz Generator</h1>
                        <p className="text-slate-400 text-sm">
                            Enter any topic and let AI create a personalized quiz for you.
                        </p>
                    </div>

                    <div className="space-y-6">
                        
                        {/* Mode Toggle */}
                        <div className="relative flex rounded-xl bg-slate-900/60 p-1 mb-2 border border-slate-700/50">
                            {/* Animated Background */}
                            <div 
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700 rounded-lg shadow transition-all duration-300 ease-out z-0 ${
                                    quizMode === 'resume' ? 'translate-x-0' : 'translate-x-full'
                                }`}
                            />
                            <button
                                onClick={() => { setQuizMode('resume'); setTopicError(null); }}
                                className={`flex-1 py-2 relative z-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${quizMode === 'resume' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Your Resume
                            </button>
                            <button
                                onClick={() => { setQuizMode('topic'); setTopicError(null); }}
                                className={`flex-1 py-2 relative z-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${quizMode === 'topic' ? 'text-white' : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Topic
                            </button>
                        </div>

                        {/* Input Area based on Mode */}
                        {quizMode === 'topic' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                    <BookOpen className="inline h-4 w-4 mr-1 text-cyan-400" />
                                    Quiz Topic
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={e => {
                                        setTopic(e.target.value);
                                        if (topicError) setTopicError(null);
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') handleGenerateQuiz(); }}
                                    placeholder="e.g., React Hooks, Python, World War II…"
                                    className={`w-full bg-slate-900/60 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${topicError ? 'border-red-500/60' : 'border-slate-700 hover:border-slate-600'
                                        }`}
                                />
                                {topicError && (
                                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> {topicError}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Resume Based Quiz
                                </label>
                                {parsedResume ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                            <CheckCircle className="h-4 w-4 shrink-0" />
                                            Resume successfully loaded.
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            The AI will generate questions based on your <b>{parsedResume.skills.length} skills</b> and <b>{parsedResume.projects.length} projects</b>.
                                        </p>
                                        <button onClick={() => setParsedResume(null)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                                           Upload a different resume
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <ResumeUploader onParseComplete={(data) => {
                                            setParsedResume(data);
                                            setTopicError(null);
                                        }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {(quizMode === 'topic' || parsedResume) && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                            {/* Difficulty */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                    Difficulty Level
                                </label>
                                <div className="relative">
                                    <select
                                        value={difficulty}
                                        onChange={e => setDifficulty(e.target.value as Difficulty)}
                                        className="w-full appearance-none bg-slate-900/60 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer"
                                    >
                                        {DIFFICULTY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Number of Questions */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-slate-300">
                                        Questions
                                    </label>
                                    <span className="text-xs text-slate-500 mt-1">
                                        {getTimeLimit(numQuestions) / 60}m limit
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {NUM_QUESTION_OPTIONS.map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setNumQuestions(n)}
                                            className={`py-2 rounded-xl font-semibold text-sm border-2 transition-all ${numQuestions === n
                                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                                                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* API Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Start Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleGenerateQuiz}
                                        className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        Generate Quiz
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── SCREEN: Results ─────────────────────────────────────────────────────

    if (isFinished) {
        const correctCount = results?.detailed_results.filter(r => r.is_correct).length ?? 0;
        const totalCount = results?.detailed_results.length ?? questions.length;

        return (
            <div className="max-w-3xl mx-auto w-full h-full pt-8 pb-20 px-4 animate-in zoom-in-95 duration-500">
                {/* Score Header */}
                <div className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2 text-white">Quiz Completed!</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        {results?.is_resume_based ? (
                            <span className="text-cyan-400 font-medium">✨ Based on your Resume</span>
                        ) : (
                            <>Topic: <span className="text-cyan-400 font-medium">{topic}</span></>
                        )}
                        <span className="mx-2 text-slate-600">·</span>
                        {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}
                    </p>

                    <div className="flex justify-center mb-6">
                        <ScoreCircle score={Math.round(scorePercentage)} size={150} strokeWidth={10} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Score</p>
                            <p className="text-xl font-bold text-emerald-400">{results?.score ?? `${correctCount}/${totalCount}`}</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Percentage</p>
                            <p className="text-xl font-bold text-cyan-400">{Math.round(scorePercentage)}%</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Time Left</p>
                            <p className="text-xl font-bold text-blue-400">{timeMins}:{timeSecs.toString().padStart(2, '0')}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleRetry}
                        className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <RotateCcw className="h-5 w-5" /> Try Another Quiz
                    </button>
                </div>

                {/* Detailed Results */}
                {results?.detailed_results && results.detailed_results.length > 0 && (
                    <div className="space-y-4">
                        
                        {/* Skill Confidence Check (If explicitly resume based and skills returned) */}
                        {results.is_resume_based && results.skills_tested && results.skills_tested.length > 0 && (
                             <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 shadow-lg mb-8">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-cyan-400"/>
                                    Skill Confidence Check
                                </h3>
                                <p className="text-sm text-slate-400 mb-5">Here's a breakdown of how well you performed on the specific skills identified from your resume based on evaluating correct answers from questions mentioning them.</p>
                                <div className="space-y-4">
                                    {results.skills_tested.map((skill, i) => {
                                        // Simple synthetic heuristic: calculate percentage of correct answers where the skill was mentioned in the question or explanation
                                        const relevantQ = results.detailed_results.filter(r => r.question_text.toLowerCase().includes(skill.toLowerCase()) || r.explanation.toLowerCase().includes(skill.toLowerCase()));
                                        if (relevantQ.length === 0) return null; // Skill not explicitly tested
                                        const skillCorrect = relevantQ.filter(r => r.is_correct).length;
                                        const skillTotal = relevantQ.length;
                                        const skillPercent = Math.round((skillCorrect / skillTotal) * 100);

                                        return (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-1/3 text-sm font-medium text-slate-300 truncate" title={skill}>{skill}</div>
                                                <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                                                     <div className={`h-full transition-all duration-1000 ease-out ${skillPercent >= 70 ? 'bg-emerald-500' : skillPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${skillPercent}%` }} />
                                                </div>
                                                <div className={`w-12 text-right text-sm font-bold ${skillPercent >= 70 ? 'text-emerald-400' : skillPercent >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{skillPercent}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                             </div>
                        )}

                        <h3 className="text-lg font-semibold text-slate-300 px-1">Question Review</h3>
                        {results.detailed_results.map((result: DetailedResult, idx: number) => (
                            <ResultCard key={result.question_id} result={result} index={idx} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── SCREEN: Quiz Questions ───────────────────────────────────────────────

    const currentQ = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;

    return (
        <div className="max-w-3xl mx-auto w-full h-full pt-10 pb-20 px-4 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-400">Question</span>
                    <span className="text-cyan-400">{currentQuestionIdx + 1}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-400">{questions.length}</span>
                </div>

                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium font-mono tracking-wider ${timeLeft <= 10
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}>
                    <Clock className="h-4 w-4" />
                    {timeMins}:{timeSecs.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-10 overflow-hidden">
                <div
                    className="h-full bg-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${(currentQuestionIdx / questions.length) * 100}%` }}
                />
            </div>

            {/* Topic Badge */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    {quizMode === 'resume' ? <Sparkles className="h-3 w-3 text-cyan-400"/> : null} 
                    {quizMode === 'resume' ? 'RESUME BASED' : topic} · {difficulty}
                </span>
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/40 p-6 md:p-10 rounded-2xl border border-slate-700/50 shadow-xl mb-8 relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />

                <h2 className="text-xl md:text-2xl font-medium text-white mb-8 leading-snug">
                    {currentQ.question_text}
                </h2>

                <div className="space-y-3 relative z-10">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(option)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedOption === option
                                ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm'
                                : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedOption === option ? 'border-cyan-500' : 'border-slate-600'
                                    }`}>
                                    {selectedOption === option && <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />}
                                </div>
                                <span className={selectedOption === option ? 'font-medium' : ''}>{option}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    disabled={selectedOption === null}
                    className={`px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all ${selectedOption === null
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                >
                    {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// ─── Result Card Sub-component ────────────────────────────────────────────────

function ResultCard({ result, index }: { result: DetailedResult; index: number }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`rounded-2xl border p-5 transition-all ${result.is_correct
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
                }`}
        >
            {/* Question row */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                    {result.is_correct
                        ? <CheckCircle className="h-5 w-5 text-emerald-400" />
                        : <XCircle className="h-5 w-5 text-red-400" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 mb-1 font-medium">Q{index + 1}</p>
                    <p className="text-white font-medium leading-snug mb-3">{result.question_text}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className={`rounded-lg px-3 py-2 border ${result.is_correct
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}>
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-70 block mb-0.5">Your Answer</span>
                            {result.user_answer || <span className="italic opacity-50">No answer</span>}
                        </div>
                        {!result.is_correct && (
                            <div className="rounded-lg px-3 py-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
                                <span className="text-xs font-semibold uppercase tracking-wider opacity-70 block mb-0.5">Correct Answer</span>
                                {result.correct_answer}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Explanation toggle */}
            {result.explanation && (
                <div className="mt-3 ml-8">
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        {expanded ? 'Hide' : 'Show'} explanation
                    </button>
                    {expanded && (
                        <p className="mt-2 text-sm text-slate-400 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                            {result.explanation}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
