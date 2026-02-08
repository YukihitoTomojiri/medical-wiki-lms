import { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Progress } from '../types';
import {
    BookOpen,
    CheckCircle2,
    Calendar,
    Bell,
    TrendingUp,
    Clock,
    XCircle,
    Plus,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface MyDashboardProps {
    user: User;
}

export default function MyDashboard({ user }: MyDashboardProps) {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'learning' | 'leaves'>('learning');

    // Leave Form State
    const [requestType, setRequestType] = useState('PAID_LEAVE');
    const [durationType, setDurationType] = useState('FULL_DAY');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        try {
            const [dashData, progressData, attData, leaveData] = await Promise.all([
                api.getMyDashboard(user.id),
                api.getMyProgress(user.id),
                api.getMyAttendanceRequests(user.id),
                api.getMyPaidLeaves(user.id)
            ]);
            setDashboardData(dashData);
            setProgress(progressData);

            // Unify history
            const unified = [
                ...attData.map(a => ({ ...a, isAttendance: true })),
                ...leaveData.map(l => ({ ...l, type: 'PAID_LEAVE', isAttendance: false }))
            ].sort((a, b) => {
                const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
                const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
                return dateB - dateA;
            });

            setLeaveRequests(unified);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            if (requestType === 'PAID_LEAVE') {
                let mappedType = 'FULL';
                if (durationType === 'HALF_DAY_AM') mappedType = 'HALF_AM';
                if (durationType === 'HALF_DAY_PM') mappedType = 'HALF_PM';

                await api.submitPaidLeave(user.id, startDate, endDate, reason, mappedType);
            } else {
                const finalStartTime = (requestType === 'LATE' || requestType === 'EARLY_DEPARTURE') ? (startTime || null) : null;
                const finalEndTime = (requestType === 'LATE' || requestType === 'EARLY_DEPARTURE') ? (endTime || null) : null;

                await api.submitAttendanceRequest(
                    user.id,
                    requestType,
                    null,
                    startDate,
                    endDate,
                    finalStartTime as any,
                    finalEndTime as any,
                    reason
                );
            }

            setStartDate('');
            setEndDate('');
            setStartTime('');
            setEndTime('');
            setReason('');
            setRequestType('PAID_LEAVE');
            setDurationType('FULL_DAY');

            // Redirect to success page instead of alert
            navigate('/submission-success');
        } catch (error: any) {
            console.error('Submission failed:', error);
            setSubmitError(error.message || '申請に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLeaveStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 size={12} /> 承認済み</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> 却下</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12} /> 申請中</span>;
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400">Loading Dashboard...</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Area - Removed Admin Link for Separation */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Myダッシュボード</h2>
                    <p className="text-gray-500 mt-1">ようこそ、{user.name}さん。今日のタスクを確認しましょう。</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Learning Stats */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <BookOpen size={18} className="text-orange-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">学習完了</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{dashboardData?.completedManualsCount}</span>
                            <span className="text-sm text-gray-400">/ {dashboardData?.totalManualsCount}</span>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-orange-600 font-medium">
                            <TrendingUp size={14} className="mr-1" />
                            今月: {dashboardData?.monthlyReadCount}件完了
                        </div>
                    </div>
                </div>

                {/* Leave Stats */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Calendar size={18} className="text-emerald-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">有給残日数</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{dashboardData?.paidLeaveDays}</span>
                            <span className="text-sm text-gray-400">日</span>
                        </div>
                        <div className="mt-3 flex items-center text-xs text-emerald-600 font-medium">
                            <Clock size={14} className="mr-1" />
                            申請中: {dashboardData?.pendingLeaveRequestsCount}件
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                            <Bell size={18} className="text-blue-500" />
                            <span className="text-xs font-bold uppercase tracking-wider">お知らせ</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-gray-800">{dashboardData?.unreadNotificationsCount}</span>
                            <span className="text-sm text-gray-400">件の未読</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-400">
                            最終読了日: {dashboardData?.lastReadDate}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Tabs and Content */}
            <div>
                <div className="flex gap-6 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'learning' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        学習履歴
                        {activeTab === 'learning' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'leaves' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        有給休暇管理
                        {activeTab === 'leaves' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />}
                    </button>
                </div>

                {/* Learning Tab Content */}
                {activeTab === 'learning' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {progress.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-50">
                                    {progress.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/manuals/${item.manualId}`}
                                            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                                                <CheckCircle2 className="text-orange-500" size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-800 truncate group-hover:text-orange-700 transition-colors">{item.manualTitle}</p>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-mono">
                                                        {new Date(item.readAt).toLocaleDateString('ja-JP')}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{item.category}</span>
                                                </div>
                                            </div>
                                            <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-400" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                                <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500 font-bold">まだ読了したマニュアルがありません</p>
                                <Link to="/manuals" className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                                    マニュアルを探す
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Paid Leaves Tab Content */}
                {activeTab === 'leaves' && (
                    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Application Form */}
                        <div className="lg:col-span-5">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-emerald-500" />
                                    新規申請
                                </h3>
                                <form onSubmit={handleSubmitLeave} className="space-y-4">
                                    {/* Request Type Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">申請種別</label>
                                        <select
                                            value={requestType}
                                            onChange={(e) => setRequestType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700"
                                        >
                                            <option value="PAID_LEAVE">有給休暇</option>
                                            <option value="ABSENCE">欠勤</option>
                                            <option value="LATE">遅刻</option>
                                            <option value="EARLY_DEPARTURE">早退</option>
                                        </select>
                                    </div>

                                    {requestType === 'PAID_LEAVE' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">取得単位</label>
                                            <select
                                                value={durationType}
                                                onChange={(e) => setDurationType(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700"
                                            >
                                                <option value="FULL_DAY">全日</option>
                                                <option value="HALF_DAY_AM">半日 (午前)</option>
                                                <option value="HALF_DAY_PM">半日 (午後)</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">開始日</label>
                                            <input
                                                type="date"
                                                required
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">終了日</label>
                                            <input
                                                type="date"
                                                required
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {(requestType === 'LATE' || requestType === 'EARLY_DEPARTURE') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">開始時間</label>
                                                <div className="flex gap-1 items-center flex-nowrap">
                                                    <div className="relative w-20">
                                                        <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <select
                                                            value={startTime ? startTime.split(':')[0] : ''}
                                                            onChange={(e) => {
                                                                const h = e.target.value;
                                                                const m = startTime ? startTime.split(':')[1] : '00';
                                                                setStartTime(`${h}:${m}`);
                                                            }}
                                                            className="w-full pl-6 pr-4 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700 appearance-none bg-white text-center"
                                                        >
                                                            <option value="" disabled>時</option>
                                                            {Array.from({ length: 24 }).map((_, i) => (
                                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                                    {i.toString().padStart(2, '0')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                                                    </div>
                                                    <span className="text-gray-400 font-bold">:</span>
                                                    <div className="relative w-14">
                                                        <select
                                                            value={startTime ? startTime.split(':')[1] : ''}
                                                            onChange={(e) => {
                                                                const h = startTime ? startTime.split(':')[0] : '09';
                                                                const m = e.target.value;
                                                                setStartTime(`${h}:${m}`);
                                                            }}
                                                            className="w-full pl-1 pr-4 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700 appearance-none bg-white text-center"
                                                        >
                                                            {['00', '15', '30', '45'].map((m) => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">終了時間</label>
                                                <div className="flex gap-1 items-center flex-nowrap">
                                                    <div className="relative w-20">
                                                        <Clock size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <select
                                                            value={endTime ? endTime.split(':')[0] : ''}
                                                            onChange={(e) => {
                                                                const h = e.target.value;
                                                                const m = endTime ? endTime.split(':')[1] : '00';
                                                                setEndTime(`${h}:${m}`);
                                                            }}
                                                            className="w-full pl-6 pr-4 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700 appearance-none bg-white text-center"
                                                        >
                                                            <option value="" disabled>時</option>
                                                            {Array.from({ length: 24 }).map((_, i) => (
                                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                                    {i.toString().padStart(2, '0')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                                                    </div>
                                                    <span className="text-gray-400 font-bold">:</span>
                                                    <div className="relative w-14">
                                                        <select
                                                            value={endTime ? endTime.split(':')[1] : ''}
                                                            onChange={(e) => {
                                                                const h = endTime ? endTime.split(':')[0] : '18';
                                                                const m = e.target.value;
                                                                setEndTime(`${h}:${m}`);
                                                            }}
                                                            className="w-full pl-1 pr-4 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm font-bold text-gray-700 appearance-none bg-white text-center"
                                                        >
                                                            {['00', '15', '30', '45'].map((m) => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">事由</label>
                                        <textarea
                                            required
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-sm h-24 resize-none"
                                            placeholder="私用のため、通院のため..."
                                        />
                                    </div>
                                    {submitError && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>{submitError}</span>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isSubmitting ? '送信中...' : '申請する'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800 text-sm">申請履歴</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">期間</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400">事由</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400">ステータス</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {leaveRequests.length > 0 ? leaveRequests.map((req) => (
                                                <tr key={`${req.isAttendance ? 'att' : 'leave'}-${req.id}`} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap">
                                                        {req.startDate} <span className="text-gray-300 mx-1">~</span> {req.endDate}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            {req.isAttendance && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{req.type}</span>}
                                                            <span>{req.reason}</span>
                                                        </div>
                                                        {req.status === 'REJECTED' && req.rejectionReason && (
                                                            <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                                                <AlertCircle size={10} />
                                                                却下理由: {req.rejectionReason}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">{getLeaveStatusBadge(req.status)}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                                                        申請履歴はありません
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
