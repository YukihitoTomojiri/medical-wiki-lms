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
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import PaidLeaveRequestForm from '../components/PaidLeaveRequestForm';
import DashboardAnnouncements from '../components/DashboardAnnouncements';

interface MyDashboardProps {
    user: User;
}

export default function MyDashboard({ user }: MyDashboardProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');

    const [dashboardData, setDashboardData] = useState<any>(null);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [leaveStatus, setLeaveStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'STUDY' | 'LEAVE' | 'NOTICE'>(() => {
        if (tabParam === 'notice') return 'NOTICE';
        if (tabParam === 'leave') return 'LEAVE';
        return 'STUDY';
    });
    const [trainingEvents, setTrainingEvents] = useState<any[]>([]);
    const [trainingResponses, setTrainingResponses] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [readAnnouncementIds, setReadAnnouncementIds] = useState<number[]>([]);

    const [showLeaveForm, setShowLeaveForm] = useState(false);

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

    const [historyStartDate] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    });

    useEffect(() => {
        loadData();
    }, [user.id, historyStartDate]);

    const loadData = async () => {
        try {
            const [dashData, progressData, historyData, statusData, eventsData, responsesData, announcementData] = await Promise.all([
                api.getMyDashboard(user.id),
                api.getMyProgress(user.id),
                api.getMyHistory(user.id, historyStartDate),
                api.getLeaveStatus(user.id),
                api.getTrainingEvents(user.id),
                api.getMyTrainingResponses(user.id),
                api.getAnnouncements(user.id)
            ]);
            setDashboardData(dashData);
            setProgress(progressData);
            setLeaveRequests(historyData);
            setLeaveStatus(statusData);
            setTrainingEvents(eventsData);
            setTrainingResponses(responsesData);
            setAnnouncements(announcementData);

            // Load read IDs from localStorage
            const storedReadIds = localStorage.getItem(`readAnnouncements_${user.id}`);
            if (storedReadIds) {
                setReadAnnouncementIds(JSON.parse(storedReadIds));
            }
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

    const uncompletedCount = trainingEvents.filter(e => !trainingResponses.some(r => r.eventId === e.id)).length;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Area */}
            <PageHeader
                title="Myダッシュボード"
                subtitle={`ようこそ、${user.name}さん。今日のタスクを確認しましょう。`}
                icon={LayoutDashboard}
            />

            {/* Summary Cards (Tabs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Study */}
                <button
                    onClick={() => setActiveTab('STUDY')}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 group ${activeTab === 'STUDY'
                        ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500 ring-opacity-50 shadow-md'
                        : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold uppercase ${activeTab === 'STUDY' ? 'text-orange-700' : 'text-gray-500'}`}>研修・学習状況</span>
                        <BookOpen className={activeTab === 'STUDY' ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'} size={20} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-800">{uncompletedCount}</span>
                        <span className="text-xs font-bold text-gray-400">件の未完了 / {dashboardData?.completedTrainingCount || 0}件完了</span>
                    </div>
                    {activeTab === 'STUDY' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />
                    )}
                </button>

                {/* Card 2: Leave */}
                <button
                    onClick={() => setActiveTab('LEAVE')}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 group ${activeTab === 'LEAVE'
                        ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500 ring-opacity-50 shadow-md'
                        : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold uppercase ${activeTab === 'LEAVE' ? 'text-emerald-700' : 'text-gray-500'}`}>有給休暇</span>
                        <Calendar className={activeTab === 'LEAVE' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'} size={20} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-800">{leaveStatus?.remainingDays ?? dashboardData?.paidLeaveDays ?? 0}</span>
                        <span className="text-xs font-bold text-gray-400">日の残日数</span>
                    </div>
                    {activeTab === 'LEAVE' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500" />
                    )}
                </button>

                {/* Card 3: Notices */}
                <button
                    onClick={() => setActiveTab('NOTICE')}
                    className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 group ${activeTab === 'NOTICE'
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-50 shadow-md'
                        : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-bold uppercase ${activeTab === 'NOTICE' ? 'text-blue-700' : 'text-gray-500'}`}>お知らせ</span>
                        <div className="relative">
                            <AlertCircle className={activeTab === 'NOTICE' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} size={20} />
                            {announcements.some(a => !readAnnouncementIds.includes(a.id)) && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                            {announcements.some(a => !readAnnouncementIds.includes(a.id)) ? (
                                <span className="text-sm font-bold text-gray-800">未読のお知らせが {announcements.filter(a => !readAnnouncementIds.includes(a.id)).length} 件あります</span>
                            ) : (
                                <span className="text-sm font-bold text-gray-600">最新情報を確認</span>
                            )}
                        </div>
                        {announcements.length > 0 && (
                            <div className="text-[10px] text-gray-400 truncate mt-1">
                                {announcements[0].title}
                            </div>
                        )}
                    </div>
                    {activeTab === 'NOTICE' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500" />
                    )}
                </button>
            </div>

            {/* Dynamic Content Area */}
            <div className={`rounded-3xl p-6 transition-colors duration-300 ${activeTab === 'STUDY' ? 'bg-orange-50/30' :
                    activeTab === 'LEAVE' ? 'bg-emerald-50/30' :
                        'bg-blue-50/30'
                }`}>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === 'STUDY' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Uncompleted List */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <AlertCircle className="text-orange-500" size={18} />
                                    未完了の研修
                                </h3>
                                <div className="space-y-3">
                                    {trainingEvents.filter(e => !trainingResponses.some(r => r.eventId === e.id)).map(event => (
                                        <div key={event.id} className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex justify-between items-center group hover:shadow-sm transition-shadow">
                                            <div>
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full mb-1 inline-block">必須</span>
                                                <h4 className="font-bold text-gray-800">{event.title}</h4>
                                                <p className="text-xs text-gray-500">期限: {new Date(event.endTime).toLocaleDateString('ja-JP')}</p>
                                            </div>
                                            <Link to={`/training/${event.id}`} className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-lg border border-orange-200 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                受講する
                                            </Link>
                                        </div>
                                    ))}
                                    {uncompletedCount === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-300" />
                                            <p>未完了の研修はありません</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent History */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" size={18} />
                                    直近の学習履歴
                                </h3>
                                <div className="space-y-4">
                                    {progress.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 font-bold text-xs">
                                                完了
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 truncate">{item.manualTitle}</p>
                                                <p className="text-xs text-gray-400">{new Date(item.readAt).toLocaleDateString('ja-JP')} に修了</p>
                                            </div>
                                            <Link to={`/manuals/${item.manualId}`} className="text-xs font-bold text-gray-400 hover:text-gray-600">
                                                再確認
                                            </Link>
                                        </div>
                                    ))}
                                    {progress.length === 0 && <p className="text-sm text-gray-400 text-center py-4">履歴はありません</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'LEAVE' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Leave Status & Application Form */}
                            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                                {/* Obligation Progress */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <h3 className="font-bold text-gray-800 mb-4">有給休暇取得状況</h3>
                                    {leaveStatus && leaveStatus.obligatoryTarget > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">義務取得日数</p>
                                                    <p className="text-2xl font-black text-gray-800">{leaveStatus.obligatoryDaysTaken} <span className="text-sm text-gray-400 font-bold">/ {leaveStatus.obligatoryTarget}日</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${leaveStatus.isObligationMet ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {leaveStatus.isObligationMet ? "目標達成！" : "あと" + (leaveStatus.obligatoryTarget - leaveStatus.obligatoryDaysTaken) + "日不足"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${leaveStatus.isObligationMet ? 'bg-emerald-500' : 'bg-orange-400'}`}
                                                    style={{ width: `${Math.min(100, (leaveStatus.obligatoryDaysTaken / leaveStatus.obligatoryTarget) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400">※ 年間5日の有給休暇取得が義務付けられています。</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">現在の取得義務情報はありません。</p>
                                    )}
                                </div>

                                {/* Application Form */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800">新規申請</h3>
                                        <button
                                            onClick={() => setShowLeaveForm(!showLeaveForm)}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            {showLeaveForm ? '折りたたむ' : 'フォームを表示'}
                                        </button>
                                    </div>

                                    {showLeaveForm && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">申請種別</label>
                                                <select
                                                    value={requestType}
                                                    onChange={(e) => setRequestType(e.target.value)}
                                                    className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                                                    navigate('/submission-success');
                                                }} />
                                            ) : (
                                                <form onSubmit={handleSubmitLeave} className="space-y-4">
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
                                    )}
                                    {!showLeaveForm && (
                                        <p className="text-sm text-gray-400">「フォームを表示」ボタンを押して申請を行ってください。</p>
                                    )}
                                </div>
                            </div>

                            {/* History List */}
                            <div className="lg:col-span-12 xl:col-span-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Clock className="text-gray-400" size={18} />
                                        申請履歴
                                    </h3>
                                    <div className="space-y-4">
                                        {leaveRequests.map(req => (
                                            <div key={req.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-sm transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                                            {req.type === 'PAID_LEAVE' ? '有給' : 'その他'}
                                                        </span>
                                                        <span className="font-bold text-gray-700 text-sm">{new Date(req.startDate).toLocaleDateString('ja-JP')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{req.reason}</p>
                                                </div>
                                                {getLeaveStatusBadge(req.status)}
                                            </div>
                                        ))}
                                        {leaveRequests.length === 0 && (
                                            <div className="text-center py-12 text-gray-400">
                                                <p>申請履歴はありません</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'NOTICE' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <AlertCircle className="text-blue-500" />
                                お知らせ一覧
                            </h2>
                            <DashboardAnnouncements
                                userId={user.id}
                                readAnnouncementIds={readAnnouncementIds}
                                onMarkAsRead={(id) => {
                                    if (!readAnnouncementIds.includes(id)) {
                                        const newIds = [...readAnnouncementIds, id];
                                        setReadAnnouncementIds(newIds);
                                        localStorage.setItem(`readAnnouncements_${user.id}`, JSON.stringify(newIds));
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
