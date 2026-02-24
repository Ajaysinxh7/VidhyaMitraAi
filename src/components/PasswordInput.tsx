import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="w-full mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {label}
                </label>
                <div className="relative">
                    <input
                        {...props}
                        ref={ref}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500'
                            } rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-1 transition-colors ${className}`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 p-1"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
