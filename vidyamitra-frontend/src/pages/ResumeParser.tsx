import { motion } from 'framer-motion';
import { ScanSearch } from 'lucide-react';
import ResumeUploader from '../components/ResumeUploader';
import type { ParsedResumeData } from '../services/api';

export default function ResumeParser() {
    const handleParseComplete = (data: ParsedResumeData) => {
        console.log('Parsed resume data:', data);
        // Data is available for further processing, e.g., saving to context or storage
    };

    return (
        <div className="max-w-3xl mx-auto flex flex-col w-full h-full pt-8 pb-20">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-500/15">
                        <ScanSearch className="h-8 w-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold">Resume Parser</h1>
                </div>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Upload your resume and let AI extract structured data — skills, experience, projects, and education — in seconds.
                </p>
            </motion.div>

            <ResumeUploader onParseComplete={handleParseComplete} />
        </div>
    );
}
