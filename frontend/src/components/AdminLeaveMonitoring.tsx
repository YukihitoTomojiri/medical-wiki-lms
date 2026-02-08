import { useState, useEffect } from 'react';
import { api, AdminLeaveMonitoring as MonitoringData } from '../api';
import { Search, AlertCircle, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';

export default function AdminLeaveMonitoring() {
    const [data, setData] = useState<MonitoringData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAttentionOnly, setShowAttentionOnly] = useState(false);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        if (user.id) {
            fetchData();
        }
    }, [user.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await api.getAdminLeaveMonitoring(user.id);
            setData(result);
        } catch (error) {
            console.error('Failed to fetch leave monitoring data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.facilityName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAttention = showAttentionOnly ? (item.needsAttention || item.isViolation || !item.isObligationMet) : true;

        return matchesSearch && matchesAttention;
    });

    // Counts
    const violationCount = data.filter(d => d.isViolation).length;
    const warningCount = data.filter(d => d.needsAttention).length;
    const unmetCount = data.filter(d => !d.isObligationMet).length;

    if (loading) return <div className="p-8 text-center text-gray-500">Loading leave data...</div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">対象職員数</div>
                    <div className="text-2xl font-bold text-gray-800">{data.length}名</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                        <AlertTriangle size={16} /> 現在未達
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{unmetCount}名</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-amber-600 mb-1">
                        <AlertCircle size={16} /> 期限切迫
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{warningCount}名</div>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                        <AlertTriangle size={16} /> 義務違反
                    </div>
                    <div className="text-2xl font-bold text-red-700">{violationCount}名</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="名前、社員ID、施設で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setShowAttentionOnly(!showAttentionOnly)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showAttentionOnly
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={16} />
                        {showAttentionOnly ? '全件表示' : '違反・要注意のみ'}
                    </button>
                    <button onClick={fetchData} className="text-gray-400 hover:text-orange-500 px-2">
                        更新
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="p-4">社員情報</th>
                                <th className="p-4">基準日 / 期間</th>
                                <th className="p-4 w-1/3">取得義務進捗 (年5日)</th>
                                <th className="p-4 text-center">状態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.map((employee) => {
                                const progressPercent = Math.min(100, (employee.obligatoryDaysTaken / 5.0) * 100);
                                const isWarning = employee.needsAttention;
                                const isViolation = employee.isViolation;

                                return (
                                    <tr
                                        key={employee.userId}
                                        className={`hover:bg-gray-50 transition-colors ${isViolation ? 'bg-red-50/50' :
                                                isWarning ? 'bg-amber-50/30' : ''
                                            }`}
                                    >
                                        <td className="p-4">
                                            <div>
                                                <div className="font-semibold text-gray-800">{employee.userName}</div>
                                                <div className="text-xs text-gray-400">{employee.facilityName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {employee.baseDate ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-700">{new Date(employee.baseDate).toLocaleDateString('ja-JP')} 〜</span>
                                                    <span className="text-xs text-gray-500">{new Date(employee.targetEndDate).toLocaleDateString('ja-JP')}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">算定期間外 (入社半年未満)</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-medium">
                                                        {employee.obligatoryDaysTaken.toFixed(1)} / 5.0 日
                                                    </span>
                                                    <span className="text-gray-400">
                                                        残り {employee.daysRemainingToObligation.toFixed(1)} 日
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${employee.isObligationMet ? 'bg-emerald-500' :
                                                            isWarning ? 'bg-amber-500' : 'bg-blue-500'
                                                            }`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                                {isWarning && (
                                                    <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                        <AlertCircle size={12} />
                                                        <span>期限切迫 (残り3ヶ月未満)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {isViolation ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertTriangle size={14} />
                                                    義務違反
                                                </span>
                                            ) : employee.isObligationMet ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    <CheckCircle2 size={14} />
                                                    達成
                                                </span>
                                            ) : isWarning ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    <AlertCircle size={14} />
                                                    警告
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                    進行中
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        該当する職員は見つかりませんでした
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
