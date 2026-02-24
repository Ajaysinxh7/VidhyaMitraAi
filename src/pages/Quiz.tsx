import { useState, useEffect } from 'react';
import { HelpCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import ScoreCircle from '../components/ScoreCircle';

const mockQuestions = [
    {
        id: 1,
        question: "What is the primary purpose of the React Context API?",
        options: [
            "To replace Redux for all state management.",
            "To easily pass data through the component tree without prop-drilling.",
            "To speed up the rendering of functional components.",
            "To manage routing in a single-page application."
        ],
        correctIndex: 1
    },
    {
        id: 2,
        question: "Which hook should be used to perform side effects in a functional component?",
        options: ["useContext", "useMemo", "useEffect", "useReducer"],
        correctIndex: 2
    },
    {
        id: 3,
        question: "In JavaScript, what does the '===' operator do compared to '=='?",
        options: [
            "It strictly compares both value and type.",
            "It only compares type, not value.",
            "It only compares value with type coercion.",
            "It is used for assigning deep clones."
        ],
        correctIndex: 0
    }
];

export default function Quiz() {
    const [isStarted, setIsStarted] = useState(false);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Timer logic
    const timeLimit = 60; // 60 seconds per quiz
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isStarted && !isFinished && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && !isFinished) {
            setIsFinished(true); // auto-finish when time is up
        }
        return () => clearTimeout(timer);
    }, [isStarted, isFinished, timeLeft]);

    const handleStart = () => {
        setIsStarted(true);
        setTimeLeft(timeLimit);
        setCurrentQuestionIdx(0);
        setScore(0);
        setIsFinished(false);
        setSelectedOption(null);
    };

    const handleNext = () => {
        if (selectedOption !== null && selectedOption === mockQuestions[currentQuestionIdx].correctIndex) {
            setScore(prev => prev + 1);
        }

        if (currentQuestionIdx < mockQuestions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            setSelectedOption(null);
        } else {
            setIsFinished(true);
        }
    };

    const percentage = Math.round((score / mockQuestions.length) * 100);
    const timeMins = Math.floor(timeLeft / 60);
    const timeSecs = timeLeft % 60;

    if (!isStarted) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-cyan-500/10 rounded-full mb-6">
                        <HelpCircle className="h-12 w-12 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Technical Quiz</h1>
                    <p className="text-slate-400 mb-8">
                        Test your knowledge with 3 quick questions. You have {timeLimit} seconds to complete it.
                    </p>
                    <button
                        onClick={handleStart}
                        className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-600/20 hover:-translate-y-0.5 transition-all"
                    >
                        Start Quiz
                    </button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="w-full h-full p-4 flex items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="max-w-lg w-full bg-slate-800/40 p-10 rounded-3xl border border-slate-700 shadow-2xl text-center">
                    <h2 className="text-2xl font-bold mb-8">Quiz Completed!</h2>

                    <div className="flex justify-center mb-8">
                        <ScoreCircle score={percentage} size={150} strokeWidth={10} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Correct Answers</p>
                            <p className="text-2xl font-bold text-emerald-400">{score} / {mockQuestions.length}</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Time Left</p>
                            <p className="text-2xl font-bold text-blue-400">{timeMins}:{timeSecs.toString().padStart(2, '0')}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <RotateCcw className="h-5 w-5" /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = mockQuestions[currentQuestionIdx];

    return (
        <div className="max-w-3xl mx-auto w-full h-full pt-10 pb-20 px-4 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-400">Question</span>
                    <span className="text-cyan-400">{currentQuestionIdx + 1}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-400">{mockQuestions.length}</span>
                </div>

                <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium font-mono tracking-wider ${timeLeft <= 10 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-800/80 border-slate-700 text-slate-300'
                    }`}>
                    <Clock className="h-4 w-4" />
                    {timeMins}:{timeSecs.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-10 overflow-hidden">
                <div
                    className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${((currentQuestionIdx) / mockQuestions.length) * 100}%` }}
                />
            </div>

            {/* Question Card */}
            <div className="bg-slate-800/40 p-6 md:p-10 rounded-2xl border border-slate-700/50 shadow-xl mb-8 relative overflow-hidden">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full pointer-events-none" />

                <h2 className="text-xl md:text-2xl font-medium text-white mb-8 leading-snug">
                    {currentQ.question}
                </h2>

                <div className="space-y-3 relative z-10">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedOption(idx)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedOption === idx
                                ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm'
                                : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedOption === idx ? 'border-cyan-500' : 'border-slate-600'
                                    }`}>
                                    {selectedOption === idx && <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />}
                                </div>
                                <span className={selectedOption === idx ? 'font-medium' : ''}>{option}</span>
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
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/20 hover:-translate-y-0.5'
                        }`}
                >
                    {currentQuestionIdx === mockQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
