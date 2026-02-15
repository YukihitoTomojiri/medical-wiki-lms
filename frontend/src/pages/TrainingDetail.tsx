import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, TrainingEvent } from '../api';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, PlayCircle, Video, ArrowLeft, Download, Send, Star, MessageSquare, Edit2 } from 'lucide-react';

const getYoutubeId = (url: string) => {
    if (!url) return null;
    try {
        // Handle direct ID input
        if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return match[2];
        }

        // Fallback for some edge cases or just the ID at the end of a slash
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1].split('?')[0];
        if (lastPart.length === 11) return lastPart;

        return null;
    } catch (e) {
        console.error("Error parsing YouTube URL", e);
        return null;
    }
};

const getFileIcon = (url: string) => {
    if (url.endsWith('.pdf')) return <FileText className="text-red-500" size={24} />;
    if (url.endsWith('.doc') || url.endsWith('.docx')) return <FileText className="text-blue-500" size={24} />;
    if (url.endsWith('.xls') || url.endsWith('.xlsx')) return <FileText className="text-green-500" size={24} />;
    return <FileText className="text-gray-400" size={24} />;
};

const getFileName = (url: string) => {
    return url.split('/').pop() || '資料ファイル';
};

export default function TrainingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<TrainingEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Questionnaire Form State
    const [comprehension, setComprehension] = useState(5);
    const [clarity, setClarity] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const storedUser = localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;

                if (!userData) {
                    navigate('/login');
                    return;
                }

                const [eventData, myResponses] = await Promise.all([
                    api.getTrainingEvent(userData.id, Number(id)),
                    api.getMyTrainingResponses(userData.id)
                ]);

                if (isMounted) {
                    setEvent(eventData);
                    setResponses(myResponses);
                    setUserRole(userData.role);
                    setError(null);
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Failed to load training details", err);
                    setError(err.message === 'Training event not found' ? '対象の研修が見つからないか、閲覧権限がありません。' : 'データの読み込みに失敗しました。');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [id, navigate]);

    const handleSubmit = async () => {
        const storedUser = localStorage.getItem('user');
        const userData = storedUser ? JSON.parse(storedUser) : null;
        if (!userData || !event) return;

        setSubmitting(true);
        try {
            const answers = JSON.stringify({
                comprehension,
                clarity,
                comment
            });
            await api.submitTrainingResponse(userData.id, event.id, answers);

            // Reload responses
            const myResponses = await api.getMyTrainingResponses(userData.id);
            setResponses(myResponses);

            // Scroll to top to show completion status
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error("Failed to submit response", err);
            alert("送信に失敗しました。もう一度お試しください。");
        } finally {
            setSubmitting(false);
        }
    };

    const isCompleted = useMemo(() => {
        return event ? responses.some((r: any) => r.eventId === event.id) : false;
    }, [responses, event]);

    const activeVideos = useMemo(() => {
        if (!event) return [];
        return [
            { id: getYoutubeId(event.videoUrl || ''), url: event.videoUrl, index: 1 },
            { id: getYoutubeId(event.videoUrl2 || ''), url: event.videoUrl2, index: 2 },
            { id: getYoutubeId(event.videoUrl3 || ''), url: event.videoUrl3, index: 3 }
        ].filter(v => v.id);
    }, [event]);

    const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-m3-primary/20 border-t-m3-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="max-w-xl mx-auto mt-20 p-10 bg-white rounded-[2.5rem] border border-m3-error/20 shadow-2xl text-center space-y-6">
                <div className="w-20 h-20 bg-m3-error/10 text-m3-error rounded-full flex items-center justify-center mx-auto">
                    <Video size={40} />
                </div>
                <h2 className="text-2xl font-bold text-m3-on-surface">{error || "研修イベントが見つかりません"}</h2>
                <p className="text-m3-on-surface-variant leading-relaxed">
                    お探しの研修は削除されたか、お客様の権限では閲覧できない可能性があります。管理者にお問い合わせください。
                </p>
                <button
                    onClick={() => navigate('/my-dashboard')}
                    className="px-8 py-3 bg-m3-primary text-white rounded-full font-bold hover:bg-m3-primary/90 transition-all shadow-lg"
                >
                    ダッシュボードに戻る
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Section */}
            <div className="relative group">
                {new URLSearchParams(window.location.search).get('fromAnnouncement') && (
                    <button
                        onClick={() => navigate('/my-dashboard?tab=notice')}
                        className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-all border border-emerald-100/50"
                    >
                        <ArrowLeft size={16} />
                        お知らせに戻る
                    </button>
                )}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ring-1 ring-blue-500/20">Learning Content</span>
                        {isCompleted && (
                            <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ring-1 ring-emerald-500/20 flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> 受講完了
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl md:text-5xl font-black text-m3-on-surface tracking-tight leading-tight">
                            {event.title}
                        </h1>
                        {(userRole === 'ADMIN' || userRole === 'DEVELOPER') && (
                            <button
                                onClick={() => navigate('/admin/training')} // Simple redirect to admin list as we don't have a direct edit page yet, but the user requested an edit button.
                                // Actually, it's better to navigate to admin and let them find it, or we could add a specific param.
                                // But for now, direct navigation to Admin Training is a good start as requested.
                                className="flex items-center gap-2 px-6 py-2 bg-m3-primary/10 text-m3-primary hover:bg-m3-primary/20 rounded-full font-bold transition-all shadow-sm"
                            >
                                <Edit2 size={18} /> 編集
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Main Content (Video & Description) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Description Card */}
                    <div className="relative p-10 bg-white rounded-[2.5rem] border border-m3-outline-variant/10 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-3 bg-m3-primary/10 rounded-2xl text-m3-primary">
                                <BookOpen size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-m3-on-surface tracking-tight">研修の目的と概要</h2>
                        </div>
                        <div className="prose prose-lg max-w-none text-m3-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {event.description || "この研修に関する詳細な説明は提供されていません。"}
                        </div>
                    </div>

                    {/* Video / Player Section */}
                    {activeVideos.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
                                    <Video size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-m3-on-surface">研修動画</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeVideos.map((v, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-m3-surface-container shadow-lg ring-1 ring-m3-outline-variant/10 hover:shadow-xl transition-shadow">
                                        {activeVideoIndex === v.index ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${v.id}?autoplay=1`}
                                                title={`YouTube video player ${v.index}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full bg-cover bg-center cursor-pointer relative group"
                                                style={{ backgroundImage: `url(https://img.youtube.com/vi/${v.id}/maxresdefault.jpg)` }}
                                                onClick={() => setActiveVideoIndex(v.index)}
                                            >
                                                <div className="absolute inset-0 bg-m3-on-surface/40 group-hover:bg-m3-on-surface/20 transition-all duration-300 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-white/40 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                                                        <PlayCircle size={28} className="text-white fill-white/10 ml-0.5" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-3 left-3 px-3 py-2 rounded-xl backdrop-blur-md bg-black/40 border border-white/10">
                                                    <p className="text-white text-xs font-bold">動画 {v.index}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-m3-surface-container shadow-2xl shadow-blue-500/10 flex flex-col items-center justify-center text-m3-on-surface-variant/30">
                            <div className="p-10 rounded-full bg-m3-surface-container-high mb-6">
                                <Video size={64} className="opacity-30" />
                            </div>
                            <p className="font-black text-2xl tracking-tight">動画コンテンツはありません</p>
                        </div>
                    )}


                    {/* Questionnaire Section */}
                    {!isCompleted && (
                        <div className="relative p-12 bg-m3-surface-container-low rounded-[3rem] border border-m3-primary/20 shadow-xl space-y-10 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-m3-primary text-white rounded-2xl shadow-lg ring-4 ring-m3-primary/10">
                                    <MessageSquare size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-m3-on-surface tracking-tight">アンケート・受講報告</h2>
                                    <p className="text-m3-on-surface-variant text-sm font-bold mt-1">動画を確認後、アンケートに回答して受講を完了してください。</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-black text-m3-on-surface-variant tracking-wider uppercase">
                                        <Star size={16} className="text-orange-500" />
                                        内容の理解度
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setComprehension(val)}
                                                className={`flex-1 py-4 rounded-2xl font-black transition-all ${comprehension === val
                                                    ? 'bg-orange-500 text-white shadow-lg scale-105'
                                                    : 'bg-white text-m3-on-surface-variant border border-m3-outline-variant/20 hover:border-orange-500/50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-m3-on-surface-variant/40 px-1">
                                        <span>全く理解できなかった</span>
                                        <span>十分理解できた</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-black text-m3-on-surface-variant tracking-wider uppercase">
                                        <Star size={16} className="text-blue-500" />
                                        動画の見やすさ
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setClarity(val)}
                                                className={`flex-1 py-4 rounded-2xl font-black transition-all ${clarity === val
                                                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                                                    : 'bg-white text-m3-on-surface-variant border border-m3-outline-variant/20 hover:border-blue-500/50'}`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-m3-on-surface-variant/40 px-1">
                                        <span>見にくかった</span>
                                        <span>非常に見やすかった</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-black text-m3-on-surface-variant tracking-wider uppercase">
                                    <MessageSquare size={16} className="text-emerald-500" />
                                    自由記述・質問（任意）
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="研修のご感想や不明点があれば入力してください..."
                                    className="w-full p-6 rounded-3xl bg-white border border-m3-outline-variant/20 focus:outline-none focus:ring-4 focus:ring-m3-primary/10 transition-all min-h-[120px] text-lg"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`w-full py-6 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${submitting
                                    ? 'bg-m3-surface-container-high text-m3-on-surface-variant/40'
                                    : 'bg-m3-primary text-white hover:bg-m3-primary/90 hover:-translate-y-1'}`}
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        送信して受講を完了する
                                        <Send size={24} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Event Status Card */}
                    <div className="bg-white rounded-[2.5rem] border border-m3-outline-variant/10 p-8 space-y-8">
                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-m3-secondary-container flex items-center justify-center text-m3-primary group-hover:rotate-6 transition-transform shadow-sm">
                                <Calendar size={28} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-m3-on-surface-variant mb-1">開始日</p>
                                <p className="text-xl font-black text-m3-on-surface leading-tight">
                                    {new Date(event.startTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-m3-outline-variant/10" />

                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-m3-error-container flex items-center justify-center text-m3-error group-hover:-rotate-6 transition-transform shadow-sm">
                                <Clock size={28} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-m3-on-surface-variant mb-1">終了日</p>
                                <p className="text-xl font-black text-m3-on-surface leading-tight">
                                    {new Date(event.endTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Materials Card */}
                    <div className="bg-white rounded-[2.5rem] border border-m3-outline-variant/10 p-8">
                        <h3 className="text-lg font-black text-m3-on-surface mb-6 flex items-center gap-3">
                            <FileText size={22} className="text-m3-primary" /> 研修資料
                        </h3>
                        {event.materialsUrl ? (
                            <a
                                href={event.materialsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="p-5 rounded-2xl bg-m3-surface-container-low border border-m3-outline-variant/10 hover:border-m3-primary/30 hover:bg-m3-surface-container-high transition-all group-hover:shadow-lg relative overflow-hidden">
                                    <div className="absolute top-4 right-4 text-m3-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download size={20} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm border border-m3-outline-variant/10 group-hover:scale-110 transition-transform">
                                            {getFileIcon(event.materialsUrl)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                                                {getFileName(event.materialsUrl)}
                                            </p>
                                            <span className="text-[10px] font-bold text-m3-on-surface-variant/50 mt-1 block">ダウンロード</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <div className="text-center py-12 bg-m3-surface-container-low rounded-2xl border border-dashed border-m3-outline-variant/20 flex flex-col items-center gap-3">
                                <FileText size={40} className="text-m3-on-surface-variant/10" />
                                <span className="text-xs font-bold text-m3-on-surface-variant/30">資料はありません</span>
                            </div>
                        )}
                    </div>

                    {/* Completion Status Overlay (Floating) */}
                    {isCompleted && (
                        <div className="sticky top-24 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                            <div className="relative z-10 text-center space-y-6">
                                <div className="w-20 h-20 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-white/10">
                                    <CheckCircle2 size={44} />
                                </div>
                                <div>
                                    <h4 className="font-black text-3xl tracking-tight">受講完了</h4>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2 px-6">
                                        回答済: {new Date(responses.find((r: any) => r.eventId === event.id)?.attendedAt).toLocaleDateString('ja-JP')} {new Date(responses.find((r: any) => r.eventId === event.id)?.attendedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        一覧に戻る
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
