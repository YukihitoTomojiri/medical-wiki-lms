import { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface PaidLeaveManagementProps {
    user?: User;
}

export default function PaidLeaveManagement({ user: propUser }: PaidLeaveManagementProps) {
    const [user] = useState<User>(() => propUser || JSON.parse(localStorage.getItem('user') || '{}'));
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.getAllPaidLeaves(user.id);
            setRequests(data);
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
                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg">
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
                                <td className="px-6 py-4 font-bold text-gray-700">{req.date}</td>
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
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                                    申請はありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
