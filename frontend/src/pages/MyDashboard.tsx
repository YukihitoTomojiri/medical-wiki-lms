import { useState, useEffect } from 'react';
import { api } from '../api';
import PageHeader from '../components/layout/PageHeader';
import { User, Progress } from '../types';
import {
    BookOpen,
    CheckCircle2,
    Calendar,
    Clock,
    XCircle,
    LayoutDashboard,
    AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PaidLeaveRequestForm from '../components/PaidLeaveRequestForm';
import DashboardAnnouncements from '../components/DashboardAnnouncements';

interface MyDashboardProps {
    user: User;
}

export default function MyDashboard({ user }: MyDashboardProps) {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [leaveStatus, setLeaveStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Removed activeTab state as we moved to 3-section layout
    const [trainingEvents, setTrainingEvents] = useState<any[]>([]);
    const [trainingResponses, setTrainingResponses] = useState<any[]>([]);

    const [showLeaveForm, setShowLeaveForm] = useState(false);

    const [historyStartDate] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    });

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
    }, [user.id, historyStartDate]);

    const loadData = async () => {
        try {
            const [dashData, progressData, historyData, statusData, eventsData, responsesData] = await Promise.all([
                api.getMyDashboard(user.id),
                api.getMyProgress(user.id),
                api.getMyHistory(user.id, historyStartDate),
                api.getLeaveStatus(user.id),
                api.getTrainingEvents(user.id),
                api.getMyTrainingResponses(user.id)
            ]);
            setDashboardData(dashData);
            setProgress(progressData);
            setLeaveRequests(historyData);
            setLeaveStatus(statusData);
            setTrainingEvents(eventsData);
            setTrainingResponses(responsesData);
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
            {/* Header Area */}
            <PageHeader
                title="Myダッシュボード"
                subtitle={`ようこそ、${user.name}さん。今日のタスクを確認しましょう。`}
                icon={LayoutDashboard}
            />

            {/* Summary Cards removed and replaced by 3-section layout */}

            {/* 3-Section Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Section 1: Training Status */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-orange-500" />
                        研修・学習状況
                    </h2>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase">未完了の研修</span>
                                {(() => {
                                    // Calculate uncompleted count
                                    // We need to fetch training events and responses
                                    // But dashboard data might not have it yet.
                                    // For now, use a placeholder or derived state if we add it to loadData
                                    // Let's assume we load it.
                                    return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">要確認</span>
                                })()}
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-black text-gray-800">
                                    {/* Placeholder for now, ideally calculated */}
                                    {trainingEvents.filter(e => !trainingResponses.some(r => r.eventId === e.id)).length}
                                </span>
                                <span className="text-sm font-bold text-gray-400">件</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">受講が必要な研修があります</p>
                            <Link to="/training" className="block w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-center text-xs transition-colors shadow-lg shadow-orange-500/20">
                                研修一覧を確認
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">直近の修了</h3>
                        {progress.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-700 truncate">{item.manualTitle}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(item.readAt).toLocaleDateString('ja-JP')}</p>
                                </div>
                            </div>
                        ))}
                        {progress.length === 0 && <p className="text-xs text-gray-400 text-center py-2">修了した学習はありません</p>}
                    </div>
                </div>

                {/* Section 2: Paid Leave Status */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-emerald-500" />
                        有給休暇
                    </h2>

                    {/* Paid Leave Card (Compact) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase">有給残日数</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                    {leaveStatus?.isObligationMet ? "義務達成済み" : "取得義務あり"}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-black text-gray-800">
                                    {leaveStatus?.remainingDays ?? dashboardData?.paidLeaveDays ?? 0}
                                </span>
                                <span className="text-sm font-bold text-gray-400">日</span>
                            </div>

                            {/* Obligation Progress */}
                            {leaveStatus && leaveStatus.obligatoryTarget > 0 && (
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                        <span>義務取得状況</span>
                                        <span>{leaveStatus.obligatoryDaysTaken}/{leaveStatus.obligatoryTarget}日</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${leaveStatus.isObligationMet ? 'bg-emerald-500' : 'bg-orange-400'}`}
                                            style={{ width: `${Math.min(100, (leaveStatus.obligatoryDaysTaken / leaveStatus.obligatoryTarget) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Simple Application Form Trigger (just jumps to details or distinct page? User asked for 3 sections) */}
                            {/* Reusing existing logic but maybe simplified. Or just listing recent requests. */}
                            {/* User request: "Display application status from PAID_LEAVE table". */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase">申請ステータス</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {leaveRequests.slice(0, 3).map(req => (
                                        <div key={req.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700">{new Date(req.startDate).toLocaleDateString('ja-JP')}</span>
                                                <span className="text-[10px] text-gray-400">{req.type === 'PAID_LEAVE' ? '有給' : 'その他'}</span>
                                            </div>
                                            {getLeaveStatusBadge(req.status)}
                                        </div>
                                    ))}
                                    {leaveRequests.length === 0 && <p className="text-[10px] text-gray-400">履歴はありません</p>}
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100">
                                <button
                                    className="w-full py-2 border border-emerald-500 text-emerald-600 rounded-lg font-bold text-xs hover:bg-emerald-50 transition-colors"
                                    onClick={() => setShowLeaveForm(!showLeaveForm)}
                                >
                                    {showLeaveForm ? '閉じる' : '休暇・勤怠を申請する'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Announcements */}
                <div className="lg:col-span-12 xl:col-span-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <AlertCircle className="text-blue-500" />
                        お知らせ
                    </h2>
                    <DashboardAnnouncements userId={user.id} />
                </div>
            </div>

            {/* Leave Application Form (Collapsible) */}
            {showLeaveForm && (
                <div className="bg-white rounded-[28px] border border-gray-200 shadow-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-800">休暇・勤怠申請</h3>
                        <button onClick={() => setShowLeaveForm(false)} className="text-gray-400 hover:text-gray-600">
                            <XCircle />
                        </button>
                    </div>
                    <div className="max-w-xl mx-auto">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1">申請種別</label>
                            <select
                                value={requestType}
                                onChange={(e) => setRequestType(e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
                            >
                                <option value="PAID_LEAVE">有給休暇</option>
                                <option value="ABSENCE">欠勤</option>
                                <option value="LATE">遅刻</option>
                                <option value="EARLY_DEPARTURE">早退</option>
                            </select>
                        </div>
                        {requestType === 'PAID_LEAVE' ? (
                            <PaidLeaveRequestForm userId={user.id} onSuccess={() => {
                                loadData();
                                setShowLeaveForm(false); // Close on success
                                navigate('/submission-success');
                            }} />
                        ) : (
                            <form onSubmit={handleSubmitLeave} className="space-y-4">
                                {/* Reusing existing form logic here... shortening for brevity in this replacement */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500">開始日</label>
                                        <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500">終了日</label>
                                        <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
                                    </div>
                                </div>
                                {(requestType === 'LATE' || requestType === 'EARLY_DEPARTURE') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500">開始時間</label>
                                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500">終了時間</label>
                                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500">事由</label>
                                    <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm h-24" placeholder="理由を入力..." />
                                </div>
                                {submitError && (
                                    <div className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs font-bold">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>{submitError}</span>
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                                    {isSubmitting ? '送信中...' : '申請を送信'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
