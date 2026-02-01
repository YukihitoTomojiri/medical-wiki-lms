import React, { useState } from 'react';
import { api } from '../api';
import { Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.forgotPassword(email);
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'リセットメールの送信に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">メールを確認してください</h2>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                        もしアカウントが存在する場合、<span className="font-bold text-slate-800">{email}</span> 宛てにパスワード再設定用のリンクを送信しました。
                    </p>
                    <Link to="/login" className="block w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-base hover:bg-slate-700 transition-colors">
                        ログイン画面に戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="bg-white max-w-md w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 z-10 relative">
                <div className="p-8 bg-slate-900 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl shadow-slate-900/50">
                        <Mail className="text-blue-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-black mb-2 tracking-tight">パスワードを忘れた場合</h1>
                    <p className="text-slate-500 text-base font-bold">パスワードを再設定するには<br />メールアドレスを入力してください</p>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-lg font-bold text-slate-700 mb-2 ml-1">メールアドレス</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-4 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                            placeholder="例: hanako.yamada@example.com"
                        />
                    </div>
                    <button
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '送信中...' : '再設定メールを送る'}
                    </button>
                    <Link to="/login" className="block text-center text-base font-bold text-slate-500 hover:text-slate-700 transition-colors">
                        ログイン画面に戻る
                    </Link>
                </form>
            </div>
        </div>
    );
}
