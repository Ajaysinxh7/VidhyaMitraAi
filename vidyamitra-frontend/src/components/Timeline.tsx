import { CheckCircle2, Circle, Clock } from 'lucide-react';

export interface Milestone {
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'upcoming';
    duration: string;
}

interface TimelineProps {
    milestones: Milestone[];
}

export default function Timeline({ milestones }: TimelineProps) {
    return (
        <div className="relative pl-8 md:pl-0">
            {/* Central Line for Desktop, Left Line for Mobile */}
            <div className="absolute left-[31px] md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-800 -translate-x-1/2" />

            <div className="space-y-12">
                {milestones.map((milestone, index) => {
                    const isDesktopLeft = index % 2 === 0;
                    const statusColors = {
                        completed: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50',
                        current: 'text-blue-500 bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
                        upcoming: 'text-slate-500 bg-slate-800/50 border-slate-700'
                    };

                    return (
                        <div key={milestone.id} className="relative flex flex-col md:flex-row items-center justify-between w-full">
                            {/* Mobile Icon (Absolute on the line) */}
                            <div className="md:hidden absolute left-[-31px] top-4 w-8 flex justify-center translate-x-1/2 z-10">
                                <div className={`p-1 rounded-full bg-slate-900 border ${statusColors[milestone.status]}`}>
                                    {milestone.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                                    {milestone.status === 'current' && <Circle className="h-4 w-4 fill-current animate-pulse" />}
                                    {milestone.status === 'upcoming' && <Clock className="h-4 w-4" />}
                                </div>
                            </div>

                            {/* Left Content (Desktop) */}
                            <div className={`w-full md:w-5/12 ${isDesktopLeft ? 'md:text-right md:pr-8' : 'md:hidden'}`}>
                                {isDesktopLeft && (
                                    <ContentCard milestone={milestone} statusColors={statusColors} />
                                )}
                            </div>

                            {/* Desktop Icon (Center) */}
                            <div className="hidden md:flex w-2/12 justify-center z-10">
                                <div className={`p-1.5 rounded-full bg-slate-900 border shrink-0 ${statusColors[milestone.status]}`}>
                                    {milestone.status === 'completed' && <CheckCircle2 className="h-5 w-5" />}
                                    {milestone.status === 'current' && <Circle className="h-5 w-5 fill-current animate-pulse" />}
                                    {milestone.status === 'upcoming' && <Clock className="h-5 w-5" />}
                                </div>
                            </div>

                            {/* Right Content (Desktop) / Mobile Content */}
                            <div className={`w-full md:w-5/12 ${!isDesktopLeft ? 'md:pl-8' : 'md:hidden'}`}>
                                <div className={`${isDesktopLeft ? 'block md:hidden' : ''}`}>
                                    <ContentCard milestone={milestone} statusColors={statusColors} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ContentCard({ milestone, statusColors }: { milestone: Milestone, statusColors: Record<string, string> }) {
    return (
        <div className={`p-5 rounded-xl border bg-slate-900/50 transition-all hover:bg-slate-800/50 ${milestone.status === 'current' ? 'border-blue-500/30' : 'border-slate-800'
            }`}>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider">
                <span className={statusColors[milestone.status].split(' ')[0]}>
                    {milestone.status}
                </span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400">{milestone.duration}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-2">{milestone.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{milestone.description}</p>
        </div>
    );
}
