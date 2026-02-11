import { useState, useEffect } from 'react';
import { api, Announcement } from '../api';
import { Bell, Info, AlertTriangle, MessageCircle, ChevronRight, X } from 'lucide-react';

interface Props {
    userId: number;
}

export default function DashboardAnnouncements({ userId }: Props) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

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

    if (loading) return null; // Or skeleton
    if (announcements.length === 0) return null;

    const displayedAnnouncements = showAll ? announcements : announcements.slice(0, 3);
    const hasMore = announcements.length > 3;

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-m3-1 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-emerald-50/50 px-6 py-4 flex items-center justify-between border-b border-emerald-100/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-600">
                        <Bell size={20} className="stroke-[2.5]" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base">お知らせ</h3>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {announcements.length}
                    </span>
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {displayedAnnouncements.map((a) => (
                    <div key={a.id} className="p-5 hover:bg-gray-50/80 transition-colors group">
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
                                    <span className="text-xs font-medium text-gray-400">
                                        {new Date(a.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-emerald-700 transition-colors">
                                    {a.title}
                                </h4>
                                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                                    {a.content}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 border-t border-gray-50"
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
            )}
        </div>
    );
}
