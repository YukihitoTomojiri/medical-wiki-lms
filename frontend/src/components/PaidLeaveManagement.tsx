import { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle2, XCircle, Clock, AlertCircle, Gift } from 'lucide-react';
import { User } from '../types';

export default function PaidLeaveManagement() {
    const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [requests, setRequests] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkApproving, setIsBulkApproving] = useState(false);

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
            const [requestData, attData, usersData] = await Promise.all([
                api.getAllPaidLeaves(user.id),
                api.getAllAttendanceRequests(user.id),
                api.getUsers(user.id)
            ]);

            // Unify data
            const unified = [
                ...requestData.map(r => ({ ...r, isAttendance: false })),
                ...attData.map(a => ({ ...a, isAttendance: true }))
            ].sort((a, b) => {
                const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
                const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
                return dateB - dateA;
            });

            setRequests(unified);
            setUsers(usersData);
            setSelectedIds([]); // Reset selection after reload
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number, isAttendance: boolean) => {
        if (!confirm('承認しますか？')) return;
        try {
            if (isAttendance) {
                await api.approveAttendanceRequest(user.id, id);
            } else {
                await api.approvePaidLeave(user.id, id);
            }
            loadData();
        } catch (error) {
            alert('操作に失敗しました');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length}件を一括承認しますか？`)) return;

        setIsBulkApproving(true);
        try {
            const leaveIds = selectedIds
                .filter(sid => sid.startsWith('leave-'))
                .map(sid => parseInt(sid.replace('leave-', '')));

            const attIds = selectedIds
                .filter(sid => sid.startsWith('att-'))
                .map(sid => parseInt(sid.replace('att-', '')));

            const promises = [];
            if (leaveIds.length > 0) promises.push(api.bulkApprovePaidLeaves(user.id, leaveIds));
            if (attIds.length > 0) promises.push(api.bulkApproveAttendanceRequests(user.id, attIds));

            await Promise.all(promises);
            alert('一括承認が完了しました');
            loadData();
        } catch (error) {
            console.error(error);
            alert('一部の承認に失敗しました');
        } finally {
            setIsBulkApproving(false);
        }
    };

    const handleReject = async (id: number, isAttendance: boolean) => {
        if (!confirm('却下しますか？')) return;
        try {
            if (isAttendance) {
                await api.rejectAttendanceRequest(user.id, id);
            } else {
                await api.rejectPaidLeave(user.id, id);
            }
            loadData();
        } catch (error) {
            alert('操作に失敗しました');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const pendingRequests = requests.filter(r => r.status === 'PENDING');
        const pendingIds = pendingRequests.map(r => `${r.isAttendance ? 'att' : 'leave'}-${r.id}`);

        if (selectedIds.length === pendingIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingIds);
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
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 size={10} /> 承認済み</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-800 border border-red-200"><XCircle size={10} /> 却下</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"><Clock size={10} /> 未承認</span>;
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">有給休暇申請一覧</h3>
                    <p className="text-gray-400 text-sm font-bold mt-1">申請内容の確認と一括承認が可能です</p>
                </div>
                <div className="flex gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkApprove}
                            disabled={isBulkApproving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} />
                            {selectedIds.length}件を一括承認
                        </button>
                    )}
                    <button
                        onClick={() => setShowGrantModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                    >
                        <Gift size={18} />
                        有給付与
                    </button>
                    <div className="flex items-center px-4 py-2.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl font-bold text-xs">
                        未承認: {pendingCount}件
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-5 text-left">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={selectedIds.length > 0 && selectedIds.length === requests.filter(r => r.status === 'PENDING').length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">申請者</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">希望日 / 仕様</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">理由</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ステータス</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {requests.length > 0 ? requests.map((req) => {
                                const sid = `${req.isAttendance ? 'att' : 'leave'}-${req.id}`;
                                const isSelected = selectedIds.includes(sid);
                                const isPending = req.status === 'PENDING';

                                return (
                                    <tr key={sid} className={`transition-colors border-b border-gray-50 ${isSelected ? 'bg-indigo-50/20' : 'hover:bg-gray-50/30'}`}>
                                        <td className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                                                checked={isSelected}
                                                disabled={!isPending}
                                                onChange={() => toggleSelect(sid)}
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col leading-tight">
                                                <span className="font-bold text-gray-800 text-sm tracking-tight">{req.userName}</span>
                                                <span className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">{req.userFacility} / {req.userDepartment}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-col leading-tight">
                                                <div className="flex items-center gap-1.5 font-bold text-gray-700 text-sm tracking-tighter">
                                                    <span>{req.startDate}</span>
                                                    <span className="text-gray-300 font-normal">~</span>
                                                    <span>{req.endDate}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`px-1.5 py-0 rounded-md text-[9px] font-black uppercase tracking-tighter ${req.isAttendance ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'}`}>
                                                        {req.isAttendance ? req.type : '有給休暇'}
                                                    </span>
                                                    {!req.isAttendance && (
                                                        <span className="text-[9px] font-bold text-gray-400 tracking-tight">
                                                            {req.leaveType === 'FULL' ? '全日取得' : req.leaveType === 'HALF_AM' ? '午前半休' : '午後半休'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <p className="text-[13px] text-gray-500 max-w-xs truncate font-medium leading-relaxed" title={req.reason}>
                                                {req.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-3 uppercase tracking-tighter">{getStatusBadge(req.status)}</td>
                                        <td className="px-6 py-3 text-right">
                                            {isPending ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(req.id, req.isAttendance)}
                                                        className="px-3 py-1 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        承認
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(req.id, req.isAttendance)}
                                                        className="px-3 py-1 bg-white border border-red-200 text-red-500 rounded-lg text-[11px] font-black hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                                                    >
                                                        却下
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black text-gray-300 uppercase italic tracking-widest opacity-50">Locked</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-20">
                                            <AlertCircle size={48} className="mb-4" />
                                            <p className="text-xl font-black text-gray-400">申請データが見つかりませんでした</p>
                                        </div>
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
        </div>
    );
}
