import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, TrainingResponse, TrainingEvent } from '../api';
import { useAuth } from '../context/AuthContext';
import { Copy, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function TrainingResponseAdmin() {
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [responses, setResponses] = useState<TrainingResponse[]>([]);
    const [event, setEvent] = useState<TrainingEvent | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !eventId) return;
        const id = parseInt(eventId);

        Promise.all([
            api.getTrainingEvent(user.id, id),
            api.getTrainingResponses(user.id, id)
        ]).then(([eventRes, responsesRes]) => {
            setEvent(eventRes);
            setResponses(responsesRes);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [user, eventId]);

    const handleBulkCopy = async () => {
        try {
            const text = await api.exportTrainingResponses(parseInt(eventId!));
            await navigator.clipboard.writeText(text);
            alert('Gemini分析用に回答データをコピーしました。');
        } catch (error) {
            console.error(error);
            alert('コピーに失敗しました');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="text" onClick={() => navigate('/admin/training')}>
                    <ChevronLeft size={20} /> 戻る
                </Button>
                <h1 className="text-2xl font-bold text-m3-on-surface">受講回答一覧: {event?.title}</h1>
            </div>

            <div className="flex justify-end">
                <Button variant="filled" onClick={handleBulkCopy} className="flex items-center gap-2">
                    <Copy size={18} /> 全回答をコピー
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden border border-m3-outline-variant/20">
                <table className="w-full text-left text-sm">
                    <thead className="bg-m3-surface-container text-m3-on-surface-variant">
                        <tr>
                            <th className="p-3">受講者</th>
                            <th className="p-3">日時</th>
                            <th className="p-3">回答内容 (JSON)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-m3-outline-variant/10">
                        {responses.map(r => (
                            <tr key={r.id}>
                                <td className="p-3 font-medium">{r.attendeeName}</td>
                                <td className="p-3">{new Date(r.attendedAt).toLocaleString()}</td>
                                <td className="p-3 font-mono text-xs text-m3-outline truncate max-w-xs" title={r.answersJson}>
                                    {r.answersJson}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
