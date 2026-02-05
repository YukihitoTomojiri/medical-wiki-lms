import { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PaidLeaveRequestProps {
    user: User;
}

export default function PaidLeaveRequest({ user }: PaidLeaveRequestProps) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitDate, setSubmitDate] = useState('');
    const [submitReason, setSubmitReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.getMyPaidLeaves(user.id);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.submitPaidLeave(user.id, submitDate, submitReason);
            await loadData();
            setShowModal(false);
            setSubmitDate('');
            setSubmitReason('');
        } catch (error) {
            alert('申請に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12} /> 承認済み</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> 却下</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={12} /> 申請中</span>;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">有給休暇申請</h2>
                    <p className="text-gray-500 mt-1">有給休暇の申請と履歴の確認ができます</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    新規申請
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">日付</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">理由</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">申請日</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">ステータス</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {requests.length > 0 ? requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-bold text-gray-700">{req.date}</td>
                                <td className="px-6 py-4 text-gray-600">{req.reason}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 mb-4">申請履歴はありません</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">休養申請</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">希望日</label>
                                <input
                                    type="date"
                                    required
                                    value={submitDate}
                                    onChange={(e) => setSubmitDate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">理由</label>
                                <textarea
                                    required
                                    value={submitReason}
                                    onChange={(e) => setSubmitReason(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none h-24"
                                    placeholder="私用のため"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50"
                                >
                                    {submitting ? '送信中...' : '申請する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
