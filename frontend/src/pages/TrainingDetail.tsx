import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, TrainingEvent } from '../api';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, PlayCircle, Video, ArrowLeft, Download, Send, Star, MessageSquare } from 'lucide-react';

const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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
                    onClick={() => navigate('/dashboard')}
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
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -left-12 top-1 p-2 hover:bg-m3-surface-container-high rounded-full transition-all group hidden lg:block"
                >
                    <ArrowLeft size={24} className="text-m3-on-surface-variant group-hover:text-m3-primary" />
                </button>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ring-1 ring-blue-500/20">Learning Content</span>
                        {isCompleted && (
                            <span className="bg-emerald-500/10 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ring-1 ring-emerald-500/20 flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> 受講完了
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-m3-on-surface tracking-tight leading-tight">
                        {event.title}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Main Content (Video & Description) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Video / Player Section */}
                    {activeVideos.length > 0 ? (
                        <div className={`grid gap-6 ${activeVideos.length > 1 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {activeVideos.map((v, idx) => (
                                <div key={idx} className="relative aspect-video rounded-[2rem] overflow-hidden bg-m3-surface-container shadow-xl ring-1 ring-m3-outline-variant/10">
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
                                                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-white/40 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                                                    <PlayCircle size={40} className="text-white fill-white/10 ml-0.5" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl backdrop-blur-md bg-black/40 border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Video {v.index}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-m3-surface-container shadow-2xl shadow-blue-500/10 flex flex-col items-center justify-center text-m3-on-surface-variant/30">
                            <div className="p-10 rounded-full bg-m3-surface-container-high mb-6">
                                <Video size={64} className="opacity-30" />
                            </div>
                            <p className="font-black text-2xl tracking-tight">動画コンテンツはありません</p>
                        </div>
                    )}

                    {/* Description Card */}
                    <div className="relative p-12 bg-white rounded-[3rem] border border-m3-outline-variant/10 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="p-4 bg-m3-primary/10 rounded-2xl text-m3-primary">
                                <BookOpen size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-m3-on-surface tracking-tight">研修の目的と概要</h2>
                        </div>
                        <div className="prose prose-lg max-w-none text-m3-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {event.description || "この研修に関する詳細な説明は提供されていません。"}
                        </div>
                    </div>

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
                    <div className="bg-white rounded-[3rem] border border-m3-outline-variant/10 p-10 space-y-10">
                        <div className="flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-m3-secondary-container flex items-center justify-center text-m3-primary group-hover:rotate-6 transition-transform shadow-sm">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-[0.3em] mb-1">Session Date</p>
                                <p className="text-2xl font-black text-m3-on-surface leading-tight">
                                    {new Date(event.startTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-m3-outline-variant/10" />

                        <div className="flex items-center gap-6 group">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-m3-error-container flex items-center justify-center text-m3-error group-hover:-rotate-6 transition-transform shadow-sm">
                                <Clock size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-[0.3em] mb-1">Time Limit</p>
                                <p className="text-2xl font-black text-m3-on-surface leading-tight">
                                    {new Date(event.endTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Materials Card */}
                    <div className="bg-white rounded-[3rem] border border-m3-outline-variant/10 p-10">
                        <h3 className="text-xl font-black text-m3-on-surface mb-8 flex items-center gap-4">
                            <FileText size={24} className="text-m3-primary" /> 研修資料
                        </h3>
                        {event.materialsUrl ? (
                            <a
                                href={event.materialsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="p-6 rounded-[2rem] bg-m3-surface-container-low border border-m3-outline-variant/10 hover:border-m3-primary/30 hover:bg-m3-surface-container-high transition-all group-hover:shadow-xl relative overflow-hidden">
                                    <div className="absolute top-6 right-6 text-m3-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download size={22} />
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-m3-outline-variant/10 group-hover:scale-110 transition-transform">
                                            {getFileIcon(event.materialsUrl)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-m3-on-surface truncate group-hover:text-m3-primary transition-colors text-lg">
                                                {getFileName(event.materialsUrl)}
                                            </p>
                                            <span className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-[0.2em] mt-2 block">Download Material</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <div className="text-center py-16 bg-m3-surface-container-low rounded-[2rem] border border-dashed border-m3-outline-variant/20 flex flex-col items-center gap-4">
                                <FileText size={48} className="text-m3-on-surface-variant/10" />
                                <span className="text-sm font-black text-m3-on-surface-variant/30 tracking-wider uppercase">資料はありません</span>
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
