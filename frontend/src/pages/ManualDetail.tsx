import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Manual, User } from '../types';
import PageHeader from '../components/layout/PageHeader';
import ReactMarkdown from 'react-markdown';
import {
    ArrowLeft,
    CheckCircle2,
    BookCheck,
    Edit,
    Clock
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

            <PageHeader
                title={manual.title}
                subtitle={`${manual.category} | 作成者: ${manual.authorName}`}
                icon={BookCheck}
            >
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/manuals')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 text-orange-900 rounded-lg transition-all text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        一覧に戻る
                    </button>
                    {user.role === 'ADMIN' && (
                        <Link
                            to={`/admin/manuals/edit/${manual.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-200 text-orange-900 hover:bg-orange-300 rounded-lg transition-all text-sm font-medium"
                        >
                            <Edit size={18} />
                            編集
                        </Link>
                    )}
                </div>
            </PageHeader>

            {/* Metadata & Content */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
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
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
        </div >
    );
}
