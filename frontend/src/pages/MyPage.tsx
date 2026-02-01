import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Progress, User } from '../types';
import {
    User as UserIcon,
    BookOpen,
    CheckCircle2,
    Calendar,
    TrendingUp,
    Building2
} from 'lucide-react';

interface MyPageProps {
    user: User;
}

export default function MyPage({ user }: MyPageProps) {
    const [progress, setProgress] = useState<Progress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProgress();
    }, []);

    const loadProgress = async () => {
        try {
            const data = await api.getMyProgress(user.id);
            setProgress(data);
        } catch (error) {
            console.error('Failed to load progress:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Myページ</h2>
                <p className="text-gray-500 mt-1">あなたの学習履歴を確認できます</p>
            </div>

            {/* User Profile Card */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur text-2xl font-bold">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{user.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-primary-100">
                            <div className="flex items-center gap-1">
                                <Building2 size={14} />
                                <span>{user.facility}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <UserIcon size={14} />
                                <span>{user.employeeId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                            <BookOpen className="text-primary-500" size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">読了数</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{progress.length}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-medical-light rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-medical-DEFAULT" size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">今月</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-800">
                        {progress.filter(p => {
                            const readDate = new Date(p.readAt);
                            const now = new Date();
                            return readDate.getMonth() === now.getMonth() && readDate.getFullYear() === now.getFullYear();
                        }).length}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Calendar className="text-amber-500" size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">最新読了日</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                        {progress.length > 0
                            ? new Date(progress[0].readAt).toLocaleDateString('ja-JP')
                            : '-'
                        }
                    </p>
                </div>
            </div>

            {/* Reading History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">読了履歴</h3>
                </div>

                {progress.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {progress.map((item) => (
                            <Link
                                key={item.id}
                                to={`/manuals/${item.manualId}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 bg-medical-light rounded-xl flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="text-medical-DEFAULT" size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{item.manualTitle}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-400 shrink-0">
                                    {new Date(item.readAt).toLocaleDateString('ja-JP')}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="text-gray-400" size={28} />
                        </div>
                        <p className="text-gray-500">まだ読了したマニュアルがありません</p>
                        <Link
                            to="/manuals"
                            className="inline-block mt-4 text-primary-600 hover:underline"
                        >
                            マニュアルを見る
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
