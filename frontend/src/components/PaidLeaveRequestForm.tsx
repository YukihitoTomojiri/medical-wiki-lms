import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../api';

interface PaidLeaveRequestFormProps {
    userId: number;
    onSuccess: () => void;
}

interface RequestRow {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    startTime: string; // Only for half-day logic if needed, simplified for now to FULL/HALF
}

export default function PaidLeaveRequestForm({ userId, onSuccess }: PaidLeaveRequestFormProps) {
    const [requests, setRequests] = useState<RequestRow[]>([
        { id: crypto.randomUUID(), startDate: '', endDate: '', reason: '', leaveType: 'FULL', startTime: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [totalDays, setTotalDays] = useState(0);

    // Calculate total days whenever requests change
    useEffect(() => {
        let total = 0;
        requests.forEach(req => {
            if (req.startDate && req.endDate) {
                const start = new Date(req.startDate);
                const end = new Date(req.endDate);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    const multiplier = req.leaveType === 'FULL' ? 1 : 0.5;
                    total += diffDays * multiplier;
                }
            }
        });
        setTotalDays(total);
    }, [requests]);

    const handleAddRow = () => {
        setRequests([...requests, {
            id: crypto.randomUUID(),
            startDate: '',
            endDate: '',
            reason: '',
            leaveType: 'FULL',
            startTime: ''
        }]);
    };

    const handleRemoveRow = (id: string) => {
        if (requests.length > 1) {
            setRequests(requests.filter(req => req.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof RequestRow, value: string) => {
        setRequests(requests.map(req => {
            if (req.id === id) {
                return { ...req, [field]: value };
            }
            return req;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        // Validation
        for (const req of requests) {
            if (!req.startDate || !req.endDate || !req.reason) {
                setSubmitError("すべての項目を入力してください");
                setIsSubmitting(false);
                return;
            }
            if (new Date(req.startDate) > new Date(req.endDate)) {
                setSubmitError("開始日は終了日以前の日付を指定してください");
                setIsSubmitting(false);
                return;
            }
        }

        try {
            // Map to API format
            const apiRequests = requests.map(req => {
                // Map frontend leaveType to backend enum
                // Frontend: FULL, HALF_AM, HALF_PM
                // Backend expects: FULL, HALF_AM, HALF_PM (PaidLeaveRequest DTO)
                return {
                    startDate: req.startDate,
                    endDate: req.endDate,
                    reason: req.reason,
                    leaveType: req.leaveType === 'FULL' ? 'FULL' : (req.leaveType === 'HALF_AM' ? 'HALF_AM' : 'HALF_PM')
                };
            });

            await api.submitBulkPaidLeave(userId, apiRequests);

            // Reset form
            setRequests([{ id: crypto.randomUUID(), startDate: '', endDate: '', reason: '', leaveType: 'FULL', startTime: '' }]);
            onSuccess();
        } catch (error: any) {
            console.error('Submission failed:', error);
            setSubmitError(error.message || '申請に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-m3-1 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                    <Plus size={16} className="text-emerald-500" />
                    有給休暇申請 (一括)
                </h3>
                <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                    申請合計: {totalDays}日
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {requests.map((req, index) => (
                        <div key={req.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative group animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="absolute -left-2 top-4 w-6 h-6 flex items-center justify-center bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold z-10 shadow-sm">
                                {index + 1}
                            </div>

                            {requests.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRow(req.id)}
                                    className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="この申請を削除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 pl-2">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">取得単位</label>
                                    <select
                                        value={req.leaveType}
                                        onChange={(e) => updateRow(req.id, 'leaveType', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white transition-all shadow-sm"
                                    >
                                        <option value="FULL">全日</option>
                                        <option value="HALF_AM">半日 (午前)</option>
                                        <option value="HALF_PM">半日 (午後)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">事由</label>
                                    <input
                                        type="text"
                                        value={req.reason}
                                        onChange={(e) => updateRow(req.id, 'reason', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white transition-all shadow-sm"
                                        placeholder="私用のため..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pl-2">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">開始日</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            required
                                            value={req.startDate}
                                            onChange={(e) => updateRow(req.id, 'startDate', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">終了日</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            required
                                            value={req.endDate}
                                            onChange={(e) => updateRow(req.id, 'endDate', e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 outline-none text-xs font-bold text-gray-700 bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleAddRow}
                    className="w-full py-3 border border-dashed border-gray-300 text-gray-500 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 group"
                >
                    <div className="bg-gray-100 group-hover:bg-emerald-200 p-1 rounded-full transition-colors">
                        <Plus size={14} className="text-gray-500 group-hover:text-emerald-700" />
                    </div>
                    <span>期間を追加 (飛び石連休など)</span>
                </button>

                {submitError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-[10px] font-bold animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-xs flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <span className="animate-pulse">送信中...</span>
                    ) : (
                        <>
                            <span>一括申請を送信 ({totalDays}日分)</span>
                            <ArrowRight size={14} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
