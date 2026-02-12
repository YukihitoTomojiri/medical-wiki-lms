import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { BookOpen, Calendar, Clock, FileText, CheckCircle2, PlayCircle, Video, ArrowLeft, ExternalLink } from 'lucide-react';

export default function TrainingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<any[]>([]);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get current user from storage or context (already handled by hook, but used here for fetch)
                const storedUser = localStorage.getItem('user');
                const userData = storedUser ? JSON.parse(storedUser) : null;
                // setUser(userData); // Removed as unused

                if (!userData) {
                    navigate('/login');
                    return;
                }

                // Get event details
                const eventData = await api.getTrainingEvent(userData.id, Number(id));
                setEvent(eventData);

                // Check if already responded
                if (userData) {
                    const myResponses = await api.getMyTrainingResponses(userData.id);
                    setResponses(myResponses);
                }
            } catch (error) {
                console.error("Failed to load training details", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!event) return <div className="p-8 text-center text-red-500">Training event not found.</div>;

    const isCompleted = responses.some(r => r.eventId === event.id);

    // Extract YouTube ID
    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(event.videoUrl);

    // Get file type icon
    const getFileIcon = (url: string) => {
        if (url.endsWith('.pdf')) return <FileText className="text-red-500" size={24} />;
        if (url.endsWith('.doc') || url.endsWith('.docx')) return <FileText className="text-blue-500" size={24} />;
        if (url.endsWith('.xls') || url.endsWith('.xlsx')) return <FileText className="text-green-500" size={24} />;
        return <FileText className="text-gray-500" size={24} />;
    };

    const getFileName = (url: string) => {
        return url.split('/').pop() || '資料ファイル';
    };

    // Assuming we have a route for answering or it's a modal.
    // Let's assume for now it's a separate page or component, but the user plan mentioned "Answer button".
    // I'll add a placeholder action or link to the existing response logic if available, 
    // or just a button that says "Answer" which might open a modal (not implemented yet, but requested UI).
    // Actually, looking at `TrainingList` or similar, there might be a flow.
    // The previous implementation had a "Take Survey" link. I'll duplicate that logic.
    // Wait, the prompt says "QR Code Link: QR code ... points to TrainingDetail URL". 
    // And "Action: Button to take the survey/response".

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                    <ArrowLeft size={24} className="text-gray-500 group-hover:text-gray-700" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
                    <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">研修会</span>
                        <span>{new Date(event.startTime).toLocaleDateString()} 開催</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Video & Description */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Video Section */}
                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 aspect-video relative group ring-1 ring-gray-900/5">
                        {showVideo && youtubeId ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="transform transition-all duration-300"
                            />
                        ) : youtubeId ? (
                            <div
                                className="w-full h-full bg-cover bg-center cursor-pointer relative group-hover:scale-105 transition-transform duration-700 ease-out"
                                style={{ backgroundImage: `url(https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg)` }}
                                onClick={() => setShowVideo(true)}
                            >
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center backdrop-blur-[1px] group-hover:backdrop-blur-none">
                                    <div className="w-20 h-20 bg-white/20 rounded-full backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300 shadow-xl border border-white/30 group-hover:border-transparent">
                                        <PlayCircle size={64} className="text-white fill-white/20 ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h2 className="text-white font-bold text-xl drop-shadow-md truncate">{event.title}</h2>
                                    <div className="flex items-center gap-2 text-white/80 text-sm mt-2 font-medium">
                                        <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">YOUTUBE</div>
                                        <span>クリックして再生を開始</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-100">
                                <Video size={48} className="mb-4 opacity-50" />
                                <p className="font-bold">動画コンテンツはありません</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 pb-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <BookOpen className="text-blue-500" size={24} />
                            研修概要
                        </h2>
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {event.description || "この研修に関する詳細な説明はありません。"}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Info & Materials & Action */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-50 rounded-full opacity-50 blur-2xl" />
                        <h3 className="font-bold text-gray-800 mb-4 relative z-10">受講アクション</h3>

                        {isCompleted ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/50 pattern-dots opacity-20" />
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce-slow">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="font-bold text-emerald-800 text-lg">受講完了済み</h4>
                                <p className="text-xs text-emerald-600 font-bold">お疲れ様でした！</p>
                                <p className="text-xs text-emerald-600/70">回答日時: {new Date(responses.find(r => r.eventId === event.id)?.attendedAt).toLocaleString()}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    動画の視聴と資料の確認が終わったら、アンケートに回答して受講を完了させてください。
                                </p>
                                <button
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
                                    onClick={() => alert("アンケート回答画面へ遷移します（未実装）")}
                                >
                                    <span>アンケートに回答する</span>
                                    <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={18} />
                                </button>
                                <p className="text-[10px] text-center text-gray-400">
                                    ※ 回答は一度しか送信できません
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Key Info */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h3 className="font-bold text-gray-800 mb-2">開催情報</h3>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Calendar size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">START DATE</p>
                                <p className="font-bold text-gray-700">
                                    {new Date(event.startTime).toLocaleDateString('ja-JP')}
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-50" />

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Clock size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">DEADLINE</p>
                                <p className="font-bold text-gray-700">
                                    {new Date(event.endTime).toLocaleDateString('ja-JP')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Materials */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-400" />
                            配布資料
                        </h3>
                        {event.materialsUrl ? (
                            <a
                                href={event.materialsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group decoration-0"
                            >
                                <div className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all bg-gray-50 hover:bg-white group-hover:ring-2 ring-blue-500/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                            {getFileIcon(event.materialsUrl)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="font-bold text-sm text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                                                {getFileName(event.materialsUrl)}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">PDF</span>
                                                <span className="text-[10px] text-gray-400">クリックして開く</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
                                <FileText size={24} className="opacity-20" />
                                <span>配布資料はありません</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
