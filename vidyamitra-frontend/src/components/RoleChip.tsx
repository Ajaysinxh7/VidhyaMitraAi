import { motion } from 'framer-motion';

interface RoleChipProps {
    label: string;
    selected: boolean;
    onClick: () => void;
}

export default function RoleChip({ label, selected, onClick }: RoleChipProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
        border ${selected
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                }
      `}
        >
            {label}
        </motion.button>
    );
}
