import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, TrainingEvent } from '../api';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, PlayCircle, Video, ArrowLeft, Download } from 'lucide-react';

export default function TrainingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<TrainingEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<any[]>([]);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;

                if (!userData) {
                    navigate('/login');
                    return;
                }

                const eventData = await api.getTrainingEvent(userData.id, Number(id));
                setEvent(eventData);

                const myResponses = await api.getMyTrainingResponses(userData.id);
                setResponses(myResponses);
            } catch (error) {
                console.error("Failed to load training details", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) return <div className="p-8 text-center text-red-500">研修イベントが見つかりません。</div>;

    const isCompleted = responses.some(r => r.eventId === event.id);

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = event.videoUrl ? getYoutubeId(event.videoUrl) : null;

    const getFileIcon = (url: string) => {
        if (url.endsWith('.pdf')) return <FileText className="text-red-500" size={24} />;
        if (url.endsWith('.doc') || url.endsWith('.docx')) return <FileText className="text-blue-500" size={24} />;
        if (url.endsWith('.xls') || url.endsWith('.xlsx')) return <FileText className="text-green-500" size={24} />;
        return <FileText className="text-gray-400" size={24} />;
    };

    const getFileName = (url: string) => {
        return url.split('/').pop() || '資料ファイル';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative group">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -left-12 top-1 p-2 hover:bg-m3-surface-container-high rounded-full transition-all group hidden lg:block"
                >
                    <ArrowLeft size={24} className="text-m3-on-surface-variant group-hover:text-m3-primary" />
                </button>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-500/10 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ring-1 ring-blue-500/20">Learning Session</span>
                        {isCompleted && (
                            <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ring-1 ring-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 size={12} /> 受講完了
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-extrabold text-m3-on-surface tracking-tight leading-tight">
                        {event.title}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Main Content (Video & Description) */}
                <div className="lg:col-span-8 space-y-10">
                    {/* Video / Player Section with Glassmorphism Overlay */}
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-m3-surface-container shadow-2xl shadow-blue-500/10 ring-1 ring-m3-outline-variant/10">
                        {showVideo && youtubeId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        ) : youtubeId ? (
                            <div
                                className="w-full h-full bg-cover bg-center cursor-pointer relative group"
                                style={{ backgroundImage: `url(https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg)` }}
                                onClick={() => setShowVideo(true)}
                            >
                                <div className="absolute inset-0 bg-m3-on-surface/40 group-hover:bg-m3-on-surface/20 transition-all duration-500 flex items-center justify-center">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/40 group-hover:scale-110 group-hover:bg-red-600/90 group-hover:border-transparent transition-all duration-300">
                                        <PlayCircle size={64} className="text-white fill-white/10 ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl backdrop-blur-md bg-black/30 border border-white/10 translate-y-4 group-hover:translate-y-0 transition-all duration-500 opacity-0 group-hover:opacity-100">
                                    <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Click to play</p>
                                    <h2 className="text-white text-2xl font-bold truncate leading-tight">{event.title}</h2>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-m3-on-surface-variant/40 bg-m3-surface-container">
                                <div className="p-6 rounded-full bg-m3-surface-container-high mb-4">
                                    <Video size={48} className="opacity-40" />
                                </div>
                                <p className="font-bold text-lg">動画コンテンツはありません</p>
                            </div>
                        )}
                    </div>

                    {/* Description Card with Premium Feel */}
                    <div className="relative p-10 bg-white rounded-[2.5rem] border border-m3-outline-variant/10 shadow-sm overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-m3-primary/10 group-hover:bg-m3-primary transition-all" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-m3-primary/10 rounded-2xl text-m3-primary">
                                <BookOpen size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-m3-on-surface">研修の内容について</h2>
                        </div>
                        <div className="prose prose-sm max-w-none text-m3-on-surface-variant leading-relaxed whitespace-pre-wrap text-lg">
                            {event.description || "この研修に関する詳細な説明は提供されていません。"}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar (Info, Materials, Action) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Action Card - Highlighted */}
                    <div className="relative rounded-[2.5rem] p-8 bg-gradient-to-br from-m3-primary to-blue-700 text-white shadow-2xl shadow-m3-primary/30 overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 opacity-90">
                            <CheckCircle2 size={20} /> 受講アクション
                        </h3>

                        {isCompleted ? (
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center space-y-4 border border-white/20">
                                <div className="w-16 h-16 bg-white text-m3-primary rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/10">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl">受講完了</h4>
                                    <p className="text-white/60 text-xs mt-1">
                                        回答日時: {new Date(responses.find(r => r.eventId === event.id)?.attendedAt).toLocaleString('ja-JP')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 relative z-10">
                                <p className="text-sm text-white/80 leading-relaxed font-medium">
                                    動画と資料を確認したら、以下のボタンからアンケート（確認テスト）に回答してください。
                                </p>
                                <button
                                    className="w-full py-5 bg-white text-m3-primary hover:bg-white/90 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => alert("アンケート回答機能は順次提供予定です。")}
                                >
                                    回答を開始する
                                    <ArrowLeft size={20} className="rotate-180" />
                                </button>
                                <p className="text-[10px] text-center text-white/50 font-bold uppercase tracking-widest">
                                    ※ 完了確認後に受講済となります
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats/Info Grid */}
                    <div className="bg-white rounded-[2.5rem] border border-m3-outline-variant/10 p-8 space-y-8">
                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 rounded-2xl bg-m3-secondary-container flex items-center justify-center text-m3-primary group-hover:rotate-12 transition-transform">
                                <Calendar size={26} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-[0.2em]">Start Date</p>
                                <p className="text-xl font-bold text-m3-on-surface">
                                    {new Date(event.startTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-m3-outline-variant/10" />

                        <div className="flex items-center gap-5 group">
                            <div className="w-14 h-14 rounded-2xl bg-m3-error-container flex items-center justify-center text-m3-error group-hover:-rotate-12 transition-transform">
                                <Clock size={26} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-[0.2em]">Deadline</p>
                                <p className="text-xl font-bold text-m3-on-surface">
                                    {new Date(event.endTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Materials Card */}
                    <div className="bg-white rounded-[2.5rem] border border-m3-outline-variant/10 p-8">
                        <h3 className="font-bold text-m3-on-surface mb-6 flex items-center gap-3">
                            <FileText size={22} className="text-m3-primary" /> 配布資料
                        </h3>
                        {event.materialsUrl ? (
                            <a
                                href={event.materialsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="p-5 rounded-3xl bg-m3-surface-container-low border border-m3-outline-variant/10 hover:border-m3-primary/30 hover:bg-m3-surface-container-high transition-all group-hover:shadow-lg relative overflow-hidden">
                                    <div className="absolute top-4 right-4 text-m3-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download size={18} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-m3-outline-variant/10 group-hover:scale-110 transition-transform">
                                            {getFileIcon(event.materialsUrl)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-m3-on-surface truncate group-hover:text-m3-primary transition-colors">
                                                {getFileName(event.materialsUrl)}
                                            </p>
                                            <span className="text-[10px] font-black text-m3-on-surface-variant/40 uppercase tracking-widest mt-1 block">Click to view</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <div className="text-center py-12 bg-m3-surface-container-low rounded-3xl border border-dashed border-m3-outline-variant/20 flex flex-col items-center gap-3">
                                <FileText size={40} className="text-m3-on-surface-variant/20" />
                                <span className="text-sm font-bold text-m3-on-surface-variant/40 tracking-tight">資料はありません</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

