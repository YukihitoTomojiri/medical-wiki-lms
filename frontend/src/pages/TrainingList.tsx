import { useEffect, useState } from 'react';
import { api, TrainingEvent, Committee } from '../api';
import { useAuth } from '../context/AuthContext';
import { Video, FileText, Calendar, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrainingList() {
    const { user } = useAuth();
    const [events, setEvents] = useState<TrainingEvent[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        Promise.all([
            api.getTrainingEvents(user.id),
            api.getCommittees(user.id)
        ])
            .then(([eventsData, committeesData]) => {
                setEvents(eventsData);
                setCommittees(committeesData);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const getTargetLabel = (event: TrainingEvent) => {
        if (!event.targetCommitteeId && !event.targetJobType) return "全職員対象";

        const parts = [];
        if (event.targetCommitteeId) {
            const committee = committees.find(c => c.id === event.targetCommitteeId);
            if (committee) parts.push(committee.name);
        }
        if (event.targetJobType) {
            parts.push(event.targetJobType);
        }
        return parts.join(' / ');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-m3-on-surface">研修会一覧</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                    <div
                        key={event.id}
                        className="bg-m3-surface-container-low p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-m3-outline-variant/50"
                        onClick={() => navigate(`/training/${event.id}`)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-m3-primary line-clamp-2">{event.title}</h3>
                            {event.videoUrl && <Video size={20} className="text-m3-tertiary shrink-0 ml-2" />}
                        </div>

                        <div className="flex items-center text-xs text-m3-on-surface-variant gap-2 mb-2">
                            <Users size={14} />
                            <span className="font-medium text-m3-secondary">
                                対象: {getTargetLabel(event)}
                            </span>
                        </div>

                        <p className="text-sm text-m3-on-surface-variant line-clamp-3 mb-4 h-15">
                            {event.description}
                        </p>
                        <div className="flex items-center text-xs text-m3-on-surface-variant gap-2 mb-4">
                            <Calendar size={14} />
                            <span>
                                {new Date(event.startTime).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                {event.materialsUrl && (
                                    <span className="px-2 py-1 bg-m3-secondary-container text-m3-on-secondary-container rounded text-xs flex items-center gap-1">
                                        <FileText size={12} /> 資料
                                    </span>
                                )}
                            </div>
                            <span className="text-m3-primary flex items-center text-sm font-medium">
                                詳細 <ChevronRight size={16} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {events.length === 0 && (
                <div className="text-center text-m3-on-surface-variant py-10">
                    現在、参加可能な研修会はありません。
                </div>
            )}
        </div>
    );
}
