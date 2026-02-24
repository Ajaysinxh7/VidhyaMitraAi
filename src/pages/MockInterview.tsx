import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, PlayCircle } from 'lucide-react';
import { submitInterviewAnswer, getMockQuestions } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import FeedbackCard from '../components/FeedbackCard';

const INTERVIEW_TYPES = ['HR', 'Technical', 'MBA Case Interview'];

export default function MockInterview() {
    const { interviewHistory, addInterviewFeedback, clearInterview } = useAppContext();
    const [interviewType, setInterviewType] = useState<string>('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [answerInput, setAnswerInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [answerInput, interviewHistory]);

    const handleStart = () => {
        if (!interviewType) return;
        clearInterview();
        setQuestions(getMockQuestions(interviewType));
        setCurrentQuestionIndex(0);
        setIsStarted(true);
        setIsFinished(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answerInput.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const question = questions[currentQuestionIndex];

        try {
            const feedback = await submitInterviewAnswer(question, answerInput);
            addInterviewFeedback(feedback);
            setAnswerInput('');

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setIsFinished(true);
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Setup Stage
    if (!isStarted) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center w-full h-full pt-20">
                <h1 className="text-4xl font-bold mb-6 text-center">Mock Interview Practice</h1>
                <p className="text-slate-400 text-lg mb-12 text-center max-w-2xl">
                    Select an interview type to start. Our AI agent will ask you questions one by one and evaluate your responses in real-time.
                </p>

                <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl w-full max-w-xl">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Select Interview Type
                    </h2>
                    <div className="flex flex-col gap-4 mb-8">
                        {INTERVIEW_TYPES.map(type => (
                            <label
                                key={type}
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${interviewType === type
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                                    }`}
                                onClick={() => setInterviewType(type)}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${interviewType === type ? 'border-blue-500' : 'border-slate-500'
                                    }`}>
                                    {interviewType === type && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                </div>
                                <span className={`font-medium ${interviewType === type ? 'text-blue-400' : 'text-slate-200'}`}>
                                    {type}
                                </span>
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={!interviewType}
                        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${!interviewType
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                            }`}
                    >
                        <PlayCircle className="h-5 w-5" /> Start Interview
                    </button>
                </div>
            </div>
        );
    }

    // Finished Stage
    if (isFinished) {
        const avgConfidence = Math.round(interviewHistory.reduce((acc, curr) => acc + curr.confidence, 0) / interviewHistory.length);
        const avgClarity = Math.round(interviewHistory.reduce((acc, curr) => acc + curr.clarity, 0) / interviewHistory.length);
        const avgAccuracy = Math.round(interviewHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / interviewHistory.length);

        return (
            <div className="max-w-4xl mx-auto w-full pt-8 pb-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Interview Summary</h1>
                    <p className="text-slate-400 text-lg">Great job completing the {interviewType} mock interview.</p>
                </div>

                <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-2xl mb-12">
                    <h2 className="text-xl font-semibold mb-6">Overall Performance Average</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
                            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Confidence</div>
                            <div className="text-4xl font-bold text-blue-400">{avgConfidence}%</div>
                        </div>
                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
                            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Clarity</div>
                            <div className="text-4xl font-bold text-emerald-400">{avgClarity}%</div>
                        </div>
                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
                            <div className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Accuracy</div>
                            <div className="text-4xl font-bold text-purple-400">{avgAccuracy}%</div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Detailed Feedback</h2>
                <div className="space-y-8">
                    {interviewHistory.map((fb, idx) => (
                        <FeedbackCard key={idx} feedback={fb} index={idx} />
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setIsStarted(false)}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Start Another Interview
                    </button>
                </div>
            </div>
        );
    }

    // Active Chat Stage
    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)] w-full">
            {/* Header and Progress */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800 pt-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold">{interviewType} Interview</h1>
                    <p className="text-slate-400">Answer thoughtfully and concisely.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-slate-300">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <button
                        onClick={() => setIsStarted(false)}
                        className="text-sm text-slate-500 hover:text-white transition-colors"
                    >
                        End Session
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-8 custom-scrollbar mb-6">
                {/* Past Questions and Feedback */}
                {interviewHistory.map((fb, idx) => (
                    <div key={idx} className="space-y-6">
                        {/* AI Question */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 max-w-[80%]">
                                <p className="text-slate-200">{fb.question}</p>
                            </div>
                        </div>

                        {/* User Answer */}
                        <div className="flex gap-4 flex-row-reverse">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                                <User className="h-5 w-5 text-slate-300" />
                            </div>
                            <div className="bg-blue-600/20 text-blue-100 rounded-2xl p-5 border border-blue-500/30 max-w-[80%]">
                                <p>{fb.answer}</p>
                            </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20 w-full">
                                <FeedbackCard feedback={fb} index={idx} />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Current Pending Question */}
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 max-w-[80%]">
                            <p className="text-slate-200">{questions[currentQuestionIndex]}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 pt-4 border-t border-slate-800">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        disabled={isSubmitting}
                        placeholder={isSubmitting ? "AI is analyzing your answer..." : "Type your answer here..."}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pr-16 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-28"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!answerInput.trim() || isSubmitting}
                        className="absolute right-3 bottom-3 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </form>
                <p className="text-xs text-slate-500 mt-2 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mx-1">Enter</kbd> to submit, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mx-1">Shift + Enter</kbd> for new line.
                </p>
            </div>
        </div>
    );
}
