import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
    const content = (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
                <Loader2 className="h-10 w-10 text-blue-500" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                className="text-slate-400 font-medium"
            >
                {message}
            </motion.p>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900text-slate-900/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return content;
}
