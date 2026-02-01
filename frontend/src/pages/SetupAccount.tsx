import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Lock, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Props {
    onLogin: (user: User) => void;
}

export default function SetupAccount({ onLogin }: Props) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link. Token is missing.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!token) return;

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const res = await api.setupAccount(token, password);
            if (res.user) {
                onLogin(res.user);
                navigate('/');
            } else {
                setError('Setup failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Setup failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 mb-2">Invalid Link</h2>
                    <p className="text-sm text-gray-500 mb-6">This invitation link is invalid or incomplete.</p>
                    <button onClick={() => navigate('/login')} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl relative overflow-hidden z-10 border border-slate-100">
                <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-emerald-500 to-purple-500" />

                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl shadow-slate-900/50">
                        <Mail className="text-purple-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Account Setup</h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Welcome! Please set your password to activate your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Create Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal"
                                placeholder="Minimum 8 characters"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal"
                                placeholder="Re-enter password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black tracking-widest transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                ACTIVATE ACCOUNT
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
