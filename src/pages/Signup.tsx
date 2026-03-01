import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';
import { supabase } from '../services/supabaseClient';

export default function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Password strength logic
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const strengthScore = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    let strengthLabel = 'Weak';
    let strengthColor = 'bg-red-500';
    if (strengthScore >= 4) {
        strengthLabel = 'Strong';
        strengthColor = 'bg-emerald-500';
    } else if (strengthScore >= 3) {
        strengthLabel = 'Medium';
        strengthColor = 'bg-yellow-500';
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (strengthScore < 3) {
            toast.error('Please choose a stronger password');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (error) throw error;

            toast.success('Account created successfully!');
            navigate('/dashboard', { replace: true });
        } catch (error: any) {
            toast.error(error.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
            <Toaster position="top-right" />

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <Brain className="h-10 w-10 text-blue-500" />
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            VidyaMitra
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
                    <p className="text-slate-400">Join thousands of tech professionals</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className="w-full">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    placeholder="John Doe"
                                />
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    placeholder="name@example.com"
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <PasswordInput
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-[-10px] mb-4">
                                    <div className="flex gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1.5 w-full rounded-full ${level <= strengthScore ? strengthColor : 'bg-slate-700'
                                                    } transition-colors duration-300`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 flex items-center justify-between">
                                        <span>Password strength: <span className={`font-semibold ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel}</span></span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <PasswordInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            error={confirmPassword && password !== confirmPassword ? "Passwords don't match" : ""}
                        />

                        <button
                            type="submit"
                            disabled={isLoading || (password !== confirmPassword && confirmPassword !== '')}
                            className="w-full mt-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                            Log in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
