import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, Announcement } from '../api';
import { Bell, Info, AlertTriangle, MessageCircle, ChevronRight, X, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    userId: number;
    readAnnouncementIds?: number[];
    onMarkAsRead?: (id: number) => void;
}

export default function DashboardAnnouncements({ userId, readAnnouncementIds = [], onMarkAsRead }: Props) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getAnnouncements(userId);
                setAnnouncements(data);
            } catch (e) {
                console.error("Failed to load announcements", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const handleSelect = (a: Announcement) => {
        setSelectedAnnouncement(a);
        if (onMarkAsRead) {
            onMarkAsRead(a.id);
        }
    };

    if (loading) return null; // Or skeleton
    if (announcements.length === 0) return null;

    const displayedAnnouncements = showAll ? announcements : announcements.slice(0, 3);
    const hasMore = announcements.length > 3;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid gap-4">
                {displayedAnnouncements.map((a) => (
                    <div
                        key={a.id}
                        className="bg-white rounded-2xl border border-gray-100/50 p-5 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
                        onClick={() => handleSelect(a)}
                    >
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 mt-0.5">
                                {a.priority === 'HIGH' ? (
                                    <AlertTriangle size={20} className="text-red-500 fill-red-50" />
                                ) : a.priority === 'LOW' ? (
                                    <MessageCircle size={20} className="text-gray-400" />
                                ) : (
                                    <Info size={20} className="text-blue-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {a.priority === 'HIGH' && (
                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                            重要
                                        </span>
                                    )}
                                    {!a.facilityId && (
                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md">
                                            全体
                                        </span>
                                    )}
                                    <span className="text-xs font-medium text-gray-400">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-700 transition-colors">
                                    {a.title}
                                    {!readAnnouncementIds.includes(a.id) && (
                                        <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed truncate">
                                    {a.content}
                                </p>
                                <div className="flex gap-2 mt-3">
                                    {a.relatedWikiId && a.relatedType === 'WIKI' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/manuals/${a.relatedWikiId}?fromAnnouncement=${a.id}`);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[10px] font-bold transition-colors border border-purple-100/50"
                                        >
                                            <BookOpen size={12} />
                                            マニュアルを確認
                                        </button>
                                    )}
                                    {a.relatedEventId && a.relatedType === 'TRAINING_EVENT' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/training/${a.relatedEventId}?fromAnnouncement=${a.id}`);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-colors border border-blue-100/50"
                                        >
                                            <Bell size={12} />
                                            研修詳細
                                        </button>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-6 py-2 bg-white/50 hover:bg-white text-gray-500 hover:text-blue-600 rounded-full text-xs font-bold transition-all flex items-center gap-2 border border-blue-200/50 shadow-sm"
                    >
                        {showAll ? (
                            <>
                                閉じる
                                <X size={14} />
                            </>
                        ) : (
                            <>
                                すべて表示 ({announcements.length}件)
                                <ChevronRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Detail Modal - Using Portal to escape parent stacking context */}
            {selectedAnnouncement && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-emerald-50/30 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                    <Bell size={20} />
                                </div>
                                <h3 className="font-bold text-gray-800">お知らせ詳細</h3>
                            </div>
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {selectedAnnouncement.priority === 'HIGH' && (
                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            重要
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-gray-400 tracking-wider">
                                        {new Date(selectedAnnouncement.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-gray-800 leading-tight">
                                    {selectedAnnouncement.title}
                                </h4>
                            </div>

                            <div className="h-px bg-gray-50" />

                            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {selectedAnnouncement.content}
                            </div>

                            {(selectedAnnouncement.relatedWikiId || selectedAnnouncement.relatedEventId) && (
                                <div className="pt-4 border-t border-gray-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">関連リンク</p>
                                    <div className="space-y-2">
                                        {selectedAnnouncement.relatedWikiId && selectedAnnouncement.relatedType === 'WIKI' && (
                                            <button
                                                onClick={() => {
                                                    navigate(`/manuals/${selectedAnnouncement.relatedWikiId}?fromAnnouncement=${selectedAnnouncement.id}`);
                                                    setSelectedAnnouncement(null);
                                                }}
                                                className="w-full flex items-center justify-between p-5 bg-m3-surface-container hover:bg-m3-surface-container-high rounded-[2rem] transition-all group border border-m3-outline-variant/10 shadow-sm"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl shadow-sm transition-transform group-hover:scale-110">
                                                        <BookOpen size={24} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-black text-purple-900 text-base leading-tight">研修資料・マニュアルを確認する</span>
                                                        <span className="text-[10px] font-bold text-purple-600/60 uppercase tracking-widest mt-1 block">Wiki Manual Integration</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-white/50 rounded-full">
                                                    <ChevronRight size={20} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </button>
                                        )}
                                        {selectedAnnouncement.relatedEventId && selectedAnnouncement.relatedType === 'TRAINING_EVENT' && (
                                            <button
                                                onClick={() => {
                                                    navigate(`/training/${selectedAnnouncement.relatedEventId}?fromAnnouncement=${selectedAnnouncement.id}`);
                                                    setSelectedAnnouncement(null);
                                                }}
                                                className="w-full flex items-center justify-between p-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-[2rem] transition-all group shadow-lg shadow-blue-500/20"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/10 text-white rounded-2xl shadow-inner backdrop-blur-md transition-transform group-hover:scale-110">
                                                        <Bell size={24} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-black text-white text-lg leading-tight">研修詳細・参加予約へ</span>
                                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1 block">Material Design 3 High Emphasis</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-white/10 rounded-full">
                                                    <ChevronRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-600 rounded-full font-bold text-sm border border-gray-200 transition-all shadow-sm"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
