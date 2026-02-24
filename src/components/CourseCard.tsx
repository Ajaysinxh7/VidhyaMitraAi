import { BookOpen, ExternalLink, Star } from 'lucide-react';

interface CourseCardProps {
    title: string;
    provider: string;
    url: string;
}

export default function CourseCard({ title, provider, url }: CourseCardProps) {
    return (
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-slate-200 font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-sm">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/20" />
                            <span>{provider}</span>
                        </div>
                    </div>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors bg-slate-800 rounded opacity-0 group-hover:opacity-100"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
