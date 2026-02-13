import { useEffect, useState } from 'react';
import { api, TrainingEvent, Committee } from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, QrCode as QrIcon, Users, FileText, Edit2, Trash2, Youtube } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function TrainingAdmin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<TrainingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null);

    // Create Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoUrl2, setVideoUrl2] = useState('');
    const [videoUrl3, setVideoUrl3] = useState('');
    const [materialsUrl, setMaterialsUrl] = useState('');
    const [targetCommitteeId, setTargetCommitteeId] = useState<number | null>(null);
    const [targetJobType, setTargetJobType] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [committees, setCommittees] = useState<Committee[]>([]);

    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsRes, committeesRes] = await Promise.all([
                api.getAdminTrainingEvents(user!.id),
                api.getCommittees(user!.id)
            ]);
            setEvents(eventsRes);
            setCommittees(committeesRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setVideoUrl2('');
        setVideoUrl3('');
        setMaterialsUrl('');
        setTargetCommitteeId(null);
        setTargetJobType('');
        setStartTime('');
        setEndTime('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                title, description, videoUrl, videoUrl2, videoUrl3, materialsUrl,
                targetCommitteeId, targetJobType: targetJobType || null,
                startTime, endTime
            };

            if (editingEvent) {
                await api.updateTrainingEvent(user!.id, editingEvent.id, data);
            } else {
                await api.createTrainingEvent(user!.id, data);
            }
            setShowCreateModal(false);
            setEditingEvent(null);
            resetForm();
            loadData();
        } catch (error: any) {
            console.error(error);
            const action = editingEvent ? '更新' : '作成';
            alert(`${action}に失敗しました: ${error.message}`);
        }
    };

    const handleEdit = (event: TrainingEvent) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDescription(event.description || '');
        setVideoUrl(event.videoUrl || '');
        setVideoUrl2(event.videoUrl2 || '');
        setVideoUrl3(event.videoUrl3 || '');
        setMaterialsUrl(event.materialsUrl || '');
        setTargetCommitteeId(event.targetCommitteeId || null);
        setTargetJobType(event.targetJobType || '');
        setStartTime(new Date(event.startTime).toISOString().slice(0, 10));
        setEndTime(new Date(event.endTime).toISOString().slice(0, 10));
        setShowCreateModal(true);
    };

    const handleDeleteClick = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('本当に削除しますか？')) return; // 念のためブラウザ標準で確認、もしくはこれも削除可だが「即時」という要件なら確認なしも検討。
        // User asked for "popup removal" but also "delete immediately".
        // The safest "immediate" interpretation is NO custom modal, but maybe a standard confirm for safety?
        // Actually the prompt says: "ポップアップが出ることなく、即座に一覧から該当の研修が消えること"
        // So I should remove ALL confirmation.
    };

    const handleDeleteImmediate = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await api.deleteTrainingEvent(user!.id, id);
            // Simple feedback: reload data
            loadData();
        } catch (error) {
            console.error(error);
            alert('削除に失敗しました');
        }
    };

    const openQr = async (eventId: number) => {
        try {
            const url = await api.getTrainingQrCode(user!.id, eventId);
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html>
                        <head><title>Quest Check-in QR</title></head>
                        <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                            <h1>QRコードをスキャンして受講</h1>
                            <div id="qrcode"></div>
                            <p>${url}</p>
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                            <script>
                                new QRCode(document.getElementById("qrcode"), {
                                    text: "${url}",
                                    width: 300,
                                    height: 300
                                });
                            </script>
                        </body>
                    </html>
                `);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-m3-on-surface">研修会管理</h1>
                <Button variant="filled" onClick={() => {
                    setEditingEvent(null);
                    resetForm();
                    setShowCreateModal(true);
                }} className="flex items-center gap-2">
                    <Plus size={18} /> 新規作成
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow border border-m3-outline-variant/20 overflow-hidden">
                <table className="w-full text-left text-sm text-m3-on-surface">
                    <thead className="bg-m3-surface-container text-m3-on-surface-variant">
                        <tr>
                            <th className="p-4">タイトル</th>
                            <th className="p-4">対象委員会/職種</th>
                            <th className="p-4">期間</th>
                            <th className="p-4">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-m3-outline-variant/10">
                        {events.map(event => (
                            <tr key={event.id} className="hover:bg-m3-surface-container-low">
                                <td className="p-4 font-medium">{event.title}</td>
                                <td className="p-4">
                                    {event.targetCommitteeId ? committees.find(c => c.id === event.targetCommitteeId)?.name : '全対象'}
                                    {event.targetJobType && ` / ${event.targetJobType}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-m3-on-surface-variant">
                                    {new Date(event.startTime).toLocaleDateString('ja-JP')} 〜 {new Date(event.endTime).toLocaleDateString('ja-JP')}
                                </td>
                                <td className="p-4 flex gap-2">
                                    <Button variant="text" onClick={() => openQr(event.id)} title="QRコード">
                                        <QrIcon size={18} />
                                    </Button>
                                    <Button variant="text" onClick={() => navigate(`/admin/training/responses/${event.id}`)} title="回答確認">
                                        <Users size={18} />
                                    </Button>
                                    <Button variant="text" onClick={() => navigate(`/training/${event.id}`)} title="プレビュー">
                                        <FileText size={18} />
                                    </Button>
                                    <Button variant="text" onClick={() => handleEdit(event)} title="編集">
                                        <Edit2 size={18} className="text-m3-primary" />
                                    </Button>
                                    <Button variant="text" onClick={(e) => handleDeleteImmediate(e, event.id!)} title="削除">
                                        <Trash2 size={18} className="text-m3-error" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{editingEvent ? '研修会の編集' : '新規研修会作成'}</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-m3-on-surface-variant flex items-center gap-2">
                                    <FileText size={18} className="text-m3-primary" /> 基本情報
                                </h3>
                                <input
                                    placeholder="タイトル"
                                    className="w-full p-2 border rounded"
                                    value={title} onChange={e => setTitle(e.target.value)} required
                                />
                                <textarea
                                    placeholder="説明"
                                    className="w-full p-2 border rounded h-24"
                                    value={description} onChange={e => setDescription(e.target.value)} required
                                />
                            </div>

                            <div className="h-px bg-m3-outline-variant/10" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-m3-on-surface-variant flex items-center gap-2">
                                    <Youtube size={18} className="text-red-500" /> 動画学習設定
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 ml-1">
                                            <Youtube size={14} className="text-red-500" /> 動画1 (メイン)
                                        </label>
                                        <input
                                            placeholder="YouTube URLを入力 (例: https://www.youtube.com/watch?v=...)"
                                            className="w-full p-2 border rounded focus:ring-2 ring-m3-primary/20 outline-none"
                                            value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 ml-1">
                                            <Youtube size={14} className="text-gray-400" /> 動画2 (任意)
                                        </label>
                                        <input
                                            placeholder="YouTube URLを入力 (任意)"
                                            className="w-full p-2 border rounded focus:ring-2 ring-m3-primary/20 outline-none"
                                            value={videoUrl2} onChange={e => setVideoUrl2(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-m3-on-surface-variant flex items-center gap-1.5 ml-1">
                                            <Youtube size={14} className="text-gray-400" /> 動画3 (任意)
                                        </label>
                                        <input
                                            placeholder="YouTube URLを入力 (任意)"
                                            className="w-full p-2 border rounded focus:ring-2 ring-m3-primary/20 outline-none"
                                            value={videoUrl3} onChange={e => setVideoUrl3(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-m3-outline-variant/10" />

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-m3-on-surface-variant flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" /> 配布資料設定
                                </h3>
                                <input
                                    placeholder="資料URL (PDFなど)"
                                    className="w-full p-2 border rounded"
                                    value={materialsUrl} onChange={e => setMaterialsUrl(e.target.value)}
                                />
                            </div>

                            <div className="h-px bg-m3-outline-variant/10" />

                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="p-2 border rounded"
                                    value={targetCommitteeId || ''}
                                    onChange={e => setTargetCommitteeId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">全委員会対象</option>
                                    {committees.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <input
                                    placeholder="職種 (任意)"
                                    className="p-2 border rounded"
                                    value={targetJobType} onChange={e => setTargetJobType(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-m3-on-surface-variant ml-1">開始日時</label>
                                    <input
                                        type="date"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-xl focus:ring-2 ring-m3-primary outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-m3-on-surface-variant ml-1">終了日時</label>
                                    <input
                                        type="date"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-xl focus:ring-2 ring-m3-primary outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="text" type="button" onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingEvent(null);
                                    resetForm();
                                }}>キャンセル</Button>
                                <Button variant="filled" type="submit">{editingEvent ? '保存' : '作成'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
