import { UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadBoxProps {
    onFileUpload: (file: File) => void;
}

export default function UploadBox({ onFileUpload }: UploadBoxProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setUploadedFile(file);
            onFileUpload(file);
        }
    }, [onFileUpload]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setUploadedFile(file);
            onFileUpload(file);
        }
    };

    return (
        <div
            className={`relative w-full p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : uploadedFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleChange}
            />

            <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer h-full min-h-[200px]"
            >
                <AnimatePresence mode="wait">
                    {!uploadedFile ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700'}`}>
                                <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
                            </div>
                            <p className="text-lg font-medium text-slate-200 mb-1">
                                Drag & drop your resume here
                            </p>
                            <p className="text-sm text-slate-400 mb-4">
                                Supports PDF, DOCX, TXT up to 10MB
                            </p>
                            <span className="px-4 py-2 bg-slate-700 text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors">
                                Browse Files
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="relative mb-4">
                                <FileText className="h-16 w-16 text-emerald-400/80" />
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-lg font-medium text-emerald-400 mb-1">
                                {uploadedFile.name}
                            </p>
                            <p className="text-sm text-slate-400 mb-4">
                                Ready for analysis
                            </p>
                            <span className="text-sm text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider font-semibold">
                                Replace File
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </label>
        </div>
    );
}
