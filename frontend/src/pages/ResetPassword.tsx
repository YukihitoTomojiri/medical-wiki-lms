import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Key, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('リセットトークンが無効です。');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) return;
        if (password !== confirm) {
            setError('パスワードが一致しません');
            return;
        }
        if (password.length < 8) {
            setError('パスワードは8文字以上にしてください');
            return;
        }

        setLoading(true);
        try {
            await api.resetPassword(token, password);
            // Redirect to login with success message? OR auto login?
            // Usually redirect to login for security re-auth.
            navigate('/login');
        } catch (e: any) {
            setError(e.message || 'パスワードの再設定に失敗しました。リンクが期限切れの可能性があります。');
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
                    <h2 className="text-xl font-black text-gray-800 mb-2">無効なリンク</h2>
                    <p className="text-base text-gray-500 mb-6">このパスワードリセット用リンクは無効か、期限切れです。</p>
                    <button onClick={() => navigate('/login')} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-base">
                        ログイン画面へ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl relative overflow-hidden z-10 border border-slate-100">
                <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />

                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl shadow-slate-900/50">
                        <Key className="text-emerald-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">パスワードの再設定</h1>
                    <p className="text-slate-500 text-base font-bold">
                        新しいパスワードを設定してください
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
                            <label className="block text-lg font-bold text-gray-900 mb-2 ml-1">新しいパスワード</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                placeholder="8文字以上"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-bold text-gray-900 mb-2 ml-1">確認用パスワード</label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                className="w-full p-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                placeholder="もう一度入力してください"
                                required
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShieldCheck size={24} />
                                パスワードを変更する
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
