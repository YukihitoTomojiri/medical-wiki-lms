import React, { useState } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Lock, ShieldCheck } from 'lucide-react';

interface Props {
    user: User;
    onComplete: (user: User) => void;
}

export default function ChangePassword({ user, onComplete }: Props) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
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
            await api.changePassword(user.id, password);
            onComplete({ ...user, mustChangePassword: false });
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl relative overflow-hidden z-10 border border-slate-100">
                <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />

                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl shadow-slate-900/50">
                        <Lock className="text-emerald-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Change Password</h1>
                    <p className="text-slate-400 text-sm font-medium">
                        For your security, please update your password to continue using the system.
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal"
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
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-300 placeholder:font-normal"
                                placeholder="Re-enter password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                UPDATE PASSWORD
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 font-medium">
                        Secure connection via HTTPS
                    </p>
                </form>
            </div>
        </div>
    );
}
