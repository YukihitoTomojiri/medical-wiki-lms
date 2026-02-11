import { useState } from 'react';
import { api } from '../api';
import { User } from '../types';
import { BookOpen, Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginProps {
    onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.login({ employeeId, password });
            if (response.success && response.user) {
                onLogin(response.user);
            } else {
                setError(response.message || 'ログインに失敗しました');
            }
        } catch {
            setError('サーバーに接続できません');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-m3-xl shadow-m3-3 mb-4">
                        <BookOpen className="text-white" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                        社内Wiki
                    </h1>
                    <p className="text-m3-on-surface-variant mt-1 font-medium">学習管理システム</p>
                </div>

                {/* Login Card — M3 Extra Large shape */}
                <div className="bg-white/80 backdrop-blur-xl rounded-m3-xl shadow-m3-2 p-8 border border-white/50">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-m3-outline-variant/30">
                        <Building2 className="text-orange-500" size={20} />
                        <span className="text-m3-on-surface font-bold text-lg">医療法人 職員ログイン</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-m3-on-surface mb-2">
                                職員番号
                            </label>
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full px-4 py-4 text-base rounded-m3-lg border border-m3-outline-variant bg-transparent focus:border-m3-primary focus:border-2 focus:ring-0 outline-none transition-all font-medium placeholder:text-m3-on-surface-variant/40 text-m3-on-surface"
                                placeholder="例: user001"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-m3-on-surface mb-2">
                                パスワード
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-4 text-base rounded-m3-lg border border-m3-outline-variant bg-transparent focus:border-m3-primary focus:border-2 focus:ring-0 outline-none transition-all pr-12 font-medium placeholder:text-m3-on-surface-variant/40 text-m3-on-surface"
                                    placeholder="パスワードを入力してください"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant/60 hover:text-m3-on-surface transition-colors p-1 rounded-full hover:bg-m3-on-surface/5"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end mt-2">
                            <Link to="/forgot-password" className="text-sm font-bold text-m3-primary hover:underline transition-all">
                                パスワードを忘れた方はこちら
                            </Link>
                        </div>

                        {error && (
                            <div className="p-4 bg-m3-error-container rounded-m3-md text-m3-on-error-container text-sm flex items-center gap-2 font-medium">
                                <div className="w-2 h-2 bg-m3-error rounded-full flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base font-bold rounded-full hover:shadow-m3-2 focus:ring-4 focus:ring-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    ログインする
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-6 border-t border-m3-outline-variant/30">
                        <p className="text-xs text-m3-on-surface-variant mb-3 font-medium">テストアカウント:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="p-2.5 bg-m3-surface-container rounded-m3-md">
                                <p className="font-bold text-m3-on-surface">開発者</p>
                                <p className="text-m3-on-surface-variant mt-0.5">dev / admin123</p>
                            </div>
                            <div className="p-2.5 bg-m3-surface-container rounded-m3-md">
                                <p className="font-bold text-m3-on-surface">管理者</p>
                                <p className="text-m3-on-surface-variant mt-0.5">admin / admin123</p>
                            </div>
                            <div className="p-2.5 bg-m3-surface-container rounded-m3-md">
                                <p className="font-bold text-m3-on-surface">一般職員</p>
                                <p className="text-m3-on-surface-variant mt-0.5">honkan001 / user123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
