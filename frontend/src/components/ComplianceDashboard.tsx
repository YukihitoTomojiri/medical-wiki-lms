import { useState, useEffect } from 'react';
import { api } from '../api';
import { UserProgress } from '../types';
import {
    Users,
    Search,
    Building2,
    TrendingUp,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    FileDown,
    Send,
    AlertTriangle,
    BookOpen
} from 'lucide-react';

export default function ComplianceDashboard() {
    const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
    const [laggingManuals, setLaggingManuals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [facilityFilter, setFacilityFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [progressData, laggingData] = await Promise.all([
                api.getAllUsersProgress(),
                api.getLaggingManuals(1)
            ]);
            setUsersProgress(progressData);
            setLaggingManuals(laggingData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await api.exportComplianceCsv(1, facilityFilter);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('エクスポートに失敗しました');
        } finally {
            setExporting(false);
        }
    };

    const handleRemind = async (userId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('督促メールを送信しますか？')) return;
        try {
            await api.remindUser(1, userId);
            alert('送信しました');
        } catch (error) {
            alert('送信に失敗しました');
        }
    };

    const facilities = [...new Set(usersProgress.map(u => u.facility))];
    const departments = [...new Set(
        usersProgress
            .filter(u => !facilityFilter || u.facility === facilityFilter)
            .map(u => u.department)
    )];

    const filteredUsers = usersProgress.filter((user) => {
        const matchesFacility = !facilityFilter || user.facility === facilityFilter;
        const matchesDepartment = !departmentFilter || user.department === departmentFilter;
        const matchesSearch = !searchQuery ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFacility && matchesDepartment && matchesSearch;
    });

    const totalUsers = filteredUsers.length;
    const averageProgress = totalUsers > 0
        ? Math.round(filteredUsers.reduce((sum, u) => sum + u.progressPercentage, 0) / totalUsers)
        : 0;
    const completedUsers = filteredUsers.filter(u => u.progressPercentage === 100).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl shadow-orange-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-orange-200" />
                        <span className="text-orange-100 font-bold">総ユーザー数</span>
                    </div>
                    <p className="text-3xl font-black">{totalUsers}<span className="text-sm font-medium ml-1">名</span></p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xl shadow-orange-500/5">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={20} className="text-orange-500" />
                        <span className="text-orange-600 font-bold">平均進捗率</span>
                    </div>
                    <p className="text-3xl font-black text-orange-600">{averageProgress}<span className="text-sm font-medium ml-1">%</span></p>
                </div>

                <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 text-white shadow-xl shadow-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 size={20} className="text-amber-100" />
                        <span className="text-amber-50 font-bold">全読了者</span>
                    </div>
                    <p className="text-3xl font-black">{completedUsers}<span className="text-sm font-medium ml-1">名</span></p>
                </div>

                {/* Lagging Manuals Widget */}
                <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">進捗遅延マニュアル TOP3</span>
                    </div>
                    <div className="space-y-2">
                        {laggingManuals.length > 0 ? laggingManuals.map((m, i) => (
                            <div key={m.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 truncate flex-1">
                                    <span className="w-4 h-4 flex items-center justify-center bg-red-50 text-red-600 rounded font-bold text-[10px]">{i + 1}</span>
                                    <span className="text-gray-700 truncate" title={m.title}>{m.title}</span>
                                </div>
                                <span className="font-bold text-red-500">{m.completionRate}%</span>
                            </div>
                        )) : (
                            <div className="text-center text-xs text-gray-400 py-2">データなし</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="氏名・社員番号で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all bg-white font-medium text-gray-700 placeholder:text-gray-400"
                    />
                </div>
                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={facilityFilter}
                        onChange={(e) => {
                            setFacilityFilter(e.target.value);
                            setDepartmentFilter('');
                        }}
                        className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all bg-white appearance-none cursor-pointer min-w-[180px] font-bold text-gray-600"
                    >
                        <option value="">すべての施設</option>
                        {facilities.map((facility) => (
                            <option key={facility} value={facility}>{facility}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all bg-white appearance-none cursor-pointer min-w-[180px] font-bold text-gray-600"
                        disabled={!facilityFilter}
                    >
                        <option value="">すべての部署</option>
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <FileDown size={20} className="text-orange-500" />
                    <span className="hidden sm:inline">CSV出力</span>
                </button>
            </div>

            {/* User Progress Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">職員</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell">施設 / 部署</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">進捗</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((userProgress) => (
                                <>
                                    <tr
                                        key={userProgress.userId}
                                        className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                                        onClick={() => setExpandedUser(expandedUser === userProgress.userId ? null : userProgress.userId)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center text-orange-600 font-black shrink-0 border border-orange-200">
                                                    {userProgress.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{userProgress.name}</p>
                                                    <p className="text-xs font-mono text-gray-400">#{userProgress.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-600 text-sm">{userProgress.facility}</span>
                                                <span className="text-xs font-medium text-gray-400">{userProgress.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-[100px] max-w-[150px] bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${userProgress.progressPercentage === 100
                                                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                                            : userProgress.progressPercentage >= 50
                                                                ? 'bg-orange-500'
                                                                : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${userProgress.progressPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-gray-600 w-12 text-right">
                                                    {userProgress.progressPercentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {userProgress.progressPercentage < 100 && (
                                                <button
                                                    onClick={(e) => handleRemind(userProgress.userId, e)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 text-xs font-bold hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all active:scale-95 shadow-sm"
                                                    title="督促を送る"
                                                >
                                                    <Send size={14} />
                                                    <span className="hidden sm:inline">督促</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {expandedUser === userProgress.userId ? (
                                                <ChevronUp size={20} className="text-gray-300" />
                                            ) : (
                                                <ChevronDown size={20} className="text-gray-300" />
                                            )}
                                        </td>
                                    </tr>
                                    {expandedUser === userProgress.userId && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-0 pb-6 border-b border-gray-50 bg-gray-50/30">
                                                <div className="pl-12 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                        <BookOpen size={14} />
                                                        Completed Manuals
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userProgress.progressList.length > 0 ? userProgress.progressList.map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm"
                                                            >
                                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                                {p.manualTitle}
                                                            </span>
                                                        )) : (
                                                            <span className="text-sm text-gray-400 italic">読了したマニュアルはありません</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="px-6 py-12 text-center">
                        <Users className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-bold">該当する職員が見つかりません</p>
                        <p className="text-xs text-gray-400 mt-1">検索条件を変更してください</p>
                    </div>
                )}
            </div>
        </div>
    );
}
