import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Manual, User } from '../types';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeft,
    CheckCircle2,
    BookCheck,
    Edit,
    Clock,
    User as UserIcon
} from 'lucide-react';

interface ManualDetailProps {
    user: User;
}

export default function ManualDetail({ user }: ManualDetailProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [manual, setManual] = useState<Manual | null>(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        if (id) {
            loadManual(parseInt(id));
        }
    }, [id]);

    const loadManual = async (manualId: number) => {
        try {
            const data = await api.getManual(user.id, manualId);
            setManual(data);
        } catch (error) {
            console.error('Failed to load manual:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async () => {
        if (!manual) return;
        setMarking(true);
        try {
            await api.markAsRead(user.id, manual.id);
            setManual({ ...manual, isRead: true });
        } catch (error) {
            console.error('Failed to mark as read:', error);
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!manual) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">マニュアルが見つかりません</p>
                <button
                    onClick={() => navigate('/manuals')}
                    className="mt-4 text-primary-600 hover:underline"
                >
                    一覧に戻る
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <button
                onClick={() => navigate('/manuals')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6"
            >
                <ArrowLeft size={20} />
                <span>一覧に戻る</span>
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium">
                            {manual.category}
                        </span>
                        {manual.isRead && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                                <CheckCircle2 size={14} />
                                読了済み
                            </span>
                        )}
                    </div>
                    {user.role === 'ADMIN' && (
                        <Link
                            to={`/admin/manuals/edit/${manual.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                        >
                            <Edit size={18} />
                            編集
                        </Link>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                    {manual.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <UserIcon size={16} />
                        <span>{manual.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>作成: {new Date(manual.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                    {manual.updatedAt !== manual.createdAt && (
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>更新: {new Date(manual.updatedAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-6">
                {manual.pdfUrl ? (
                    <div className="space-y-6">
                        <div className="aspect-[1/1.4] w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                            <iframe
                                src={manual.pdfUrl}
                                className="w-full h-full"
                                title={manual.title}
                            />
                        </div>
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                                補足事項 (Markdown)
                            </h3>
                            <div className="markdown-content prose prose-gray max-w-none">
                                <ReactMarkdown>{manual.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="markdown-content prose prose-gray max-w-none">
                        <ReactMarkdown>{manual.content}</ReactMarkdown>
                    </div>
                )}
            </div>

            {/* Read button */}
            <div className="bg-gradient-to-r from-primary-50 to-amber-50 rounded-2xl p-6 border border-primary-100">
                {manual.isRead ? (
                    <div className="flex items-center justify-center gap-3 text-emerald-600">
                        <CheckCircle2 size={28} />
                        <span className="text-lg font-semibold">このマニュアルは読了済みです</span>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            内容を確認したら「読みました」ボタンを押してください
                        </p>
                        <button
                            onClick={handleMarkAsRead}
                            disabled={marking}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
                        >
                            {marking ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <BookCheck size={22} />
                                    読みました
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
