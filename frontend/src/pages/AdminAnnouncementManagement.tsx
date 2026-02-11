import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, X, Save } from 'lucide-react';
import { api, Announcement } from '../api';
import { User } from '../types';

interface props {
    user: User;
}

export default function AdminAnnouncementManagement({ user }: props) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
    const [displayUntil, setDisplayUntil] = useState('');

    useEffect(() => {
        loadAnnouncements();
    }, [user.id]);

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminAnnouncements(user.id);
            setAnnouncements(data);
        } catch (err: any) {
            setError('お知らせの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingId(announcement.id);
            setTitle(announcement.title);
            setContent(announcement.content);
            setPriority(announcement.priority);
            setDisplayUntil(announcement.displayUntil);
        } else {
            setEditingId(null);
            setTitle('');
            setContent('');
            setPriority('NORMAL');
            // Default 2 weeks
            const date = new Date();
            date.setDate(date.getDate() + 14);
            setDisplayUntil(date.toISOString().split('T')[0]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateAnnouncement(user.id, editingId, {
                    title, content, priority, displayUntil
                });
            } else {
                await api.createAnnouncement(user.id, {
                    title, content, priority, displayUntil,
                    facilityId: user.role === 'ADMIN' ? undefined : undefined // Backend handles logic
                });
            }
            setIsModalOpen(false);
            loadAnnouncements();
        } catch (err: any) {
            alert('保存に失敗しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('本当に削除しますか？')) return;
        try {
            await api.deleteAnnouncement(user.id, id);
            loadAnnouncements();
        } catch (err: any) {
            alert('削除に失敗しました');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">お知らせ管理</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    <Plus size={18} />
                    <span>新規作成</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">優先度</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">タイトル</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">掲載期限</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">作成日</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {announcements.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                        a.priority === 'LOW' ? 'bg-gray-100 text-gray-600' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {a.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{a.title}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-xs">{a.content}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {a.displayUntil}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(a.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(a)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {announcements.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                                    お知らせはありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingId ? 'お知らせを編集' : '新規お知らせ作成'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">優先度</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    >
                                        <option value="HIGH">重要 (HIGH)</option>
                                        <option value="NORMAL">通常 (NORMAL)</option>
                                        <option value="LOW">低 (LOW)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">掲載期限</label>
                                    <input
                                        type="date"
                                        required
                                        value={displayUntil}
                                        onChange={(e) => setDisplayUntil(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">内容</label>
                                <textarea
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
