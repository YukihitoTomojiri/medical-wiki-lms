import { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle2, XCircle, Clock, AlertCircle, Gift } from 'lucide-react';
import { User } from '../types';

export default function PaidLeaveManagement() {
    const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [requests, setRequests] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Grant leave modal state
    const [showGrantModal, setShowGrantModal] = useState(false);
    const [grantTargetUserId, setGrantTargetUserId] = useState<number | null>(null);
    const [grantDays, setGrantDays] = useState('');
    const [grantReason, setGrantReason] = useState('');
    const [isGranting, setIsGranting] = useState(false);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        try {
            const [requestData, usersData] = await Promise.all([
                api.getAllPaidLeaves(user.id),
                api.getUsers(user.id)
            ]);
            setRequests(requestData);
            setUsers(usersData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('承認しますか？')) return;
        try {
            await api.approvePaidLeave(user.id, id);
            loadData();
        } catch (error) {
            alert('操作に失敗しました');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('却下しますか？')) return;
        try {
            await api.rejectPaidLeave(user.id, id);
            loadData();
        } catch (error) {
            alert('操作に失敗しました');
        }
    };

    const handleGrantLeave = async () => {
        if (!grantTargetUserId || !grantDays) {
            alert('対象ユーザーと日数を入力してください');
            return;
        }
        setIsGranting(true);
        try {
            await api.grantPaidLeave(user.id, grantTargetUserId, parseFloat(grantDays), grantReason);
            alert('有給を付与しました');
            setShowGrantModal(false);
            setGrantTargetUserId(null);
            setGrantDays('');
            setGrantReason('');
            loadData();
        } catch (error) {
            alert('付与に失敗しました');
        } finally {
            setIsGranting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12} /> 承認済み</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> 却下</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12} /> 承認待ち</span>;
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">有給休暇申請一覧</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGrantModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold text-sm hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20"
                    >
                        <Gift size={16} />
                        有給付与
                    </button>
                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg self-center">
                        承認待ち: {requests.filter(r => r.status === 'PENDING').length}件
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">申請者</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">組織</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">希望日</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">種別</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">理由</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase">ステータス</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {requests.length > 0 ? requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-bold text-gray-700">{req.userName}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-xs">
                                        <span className="font-bold text-gray-600">{req.userFacility}</span>
                                        <span className="text-gray-400">{req.userDepartment}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">
                                    {req.startDate} ~ {req.endDate}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                                        {req.leaveType === 'FULL' ? '全日' : req.leaveType === 'HALF_AM' ? '午前半休' : '午後半休'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    {req.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                            >
                                                承認
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                            >
                                                却下
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                    <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                                    申請はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Grant Leave Modal */}
            {showGrantModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-purple-500" />
                            有給日数を付与
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">対象ユーザー</label>
                                <select
                                    value={grantTargetUserId || ''}
                                    onChange={(e) => setGrantTargetUserId(parseInt(e.target.value) || null)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm font-bold text-gray-700"
                                >
                                    <option value="">選択してください</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.facility} / {u.department})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">付与日数</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={grantDays}
                                    onChange={(e) => setGrantDays(e.target.value)}
                                    placeholder="例: 10, 0.5"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm font-bold text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">付与理由</label>
                                <textarea
                                    value={grantReason}
                                    onChange={(e) => setGrantReason(e.target.value)}
                                    placeholder="年度更新、特別付与など"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none text-sm h-20 resize-none"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowGrantModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleGrantLeave}
                                    disabled={isGranting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50"
                                >
                                    {isGranting ? '処理中...' : '付与する'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
