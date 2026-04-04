import { MessageSquare, Lightbulb } from 'lucide-react';
import type { InterviewFeedback } from '../contexts/AppContext';

interface FeedbackCardProps {
    feedback: InterviewFeedback;
    index: number;
}

export default function FeedbackCard({ feedback, index }: FeedbackCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        if (score >= 60) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        return 'text-red-400 bg-red-400/10 border-red-400/20';
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden mb-6 shadow-sm">
            <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700/50 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 shrink-0 flex items-center justify-center text-blue-400 font-bold text-sm">
                    Q{index + 1}
                </div>
                <div>
                    <h4 className="text-slate-200 font-medium mb-1">{feedback.question}</h4>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                        <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                        <p className="text-slate-400 text-sm italic">"{feedback.answer}"</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${getScoreColor(feedback.confidence)}`}>
                        <span className="text-xs uppercase tracking-wider opacity-80 mb-1">Confidence</span>
                        <span className="text-xl font-bold">{feedback.confidence}%</span>
                    </div>
                    <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${getScoreColor(feedback.clarity)}`}>
                        <span className="text-xs uppercase tracking-wider opacity-80 mb-1">Clarity</span>
                        <span className="text-xl font-bold">{feedback.clarity}%</span>
                    </div>
                    <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${getScoreColor(feedback.accuracy)}`}>
                        <span className="text-xs uppercase tracking-wider opacity-80 mb-1">Accuracy</span>
                        <span className="text-xl font-bold">{feedback.accuracy}%</span>
                    </div>
                </div>

                <div className="flex gap-3 items-start bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded text-blue-400 shrink-0">
                        <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold text-slate-200 mb-1">AI Suggestion</h5>
                        <p className="text-slate-400 text-sm leading-relaxed">{feedback.suggestion}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
