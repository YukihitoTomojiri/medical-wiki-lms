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
    ChevronUp
} from 'lucide-react';

export default function AdminDashboard() {
    const [usersProgress, setUsersProgress] = useState<UserProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [facilityFilter, setFacilityFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.getAllUsersProgress();
            setUsersProgress(data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
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
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h2>
                <p className="text-gray-500 mt-1">全職員の読了状況を確認できます</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-xl shadow-primary-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-primary-200" />
                        <span className="text-primary-100">総ユーザー数</span>
                    </div>
                    <p className="text-3xl font-bold">{totalUsers}名</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-primary-200 shadow-xl shadow-primary-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={20} className="text-primary-500" />
                        <span className="text-primary-600 font-medium">平均進捗率</span>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">{averageProgress}%</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl shadow-amber-500/20">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 size={20} className="text-amber-200" />
                        <span className="text-amber-100">全読了者</span>
                    </div>
                    <p className="text-3xl font-bold">{completedUsers}名</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="氏名・社員番号で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-white"
                    />
                </div>
                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={facilityFilter}
                        onChange={(e) => {
                            setFacilityFilter(e.target.value);
                            setDepartmentFilter(''); // Reset department when facility changes
                        }}
                        className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-white appearance-none cursor-pointer min-w-[180px]"
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
                        className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-white appearance-none cursor-pointer min-w-[180px]"
                        disabled={!facilityFilter}
                    >
                        <option value="">すべての部署</option>
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* User Progress Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">職員</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 hidden sm:table-cell">施設</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">進捗</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">読了数</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((userProgress) => (
                                <>
                                    <tr
                                        key={userProgress.userId}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setExpandedUser(expandedUser === userProgress.userId ? null : userProgress.userId)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                                    {userProgress.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{userProgress.name}</p>
                                                    <p className="text-sm text-gray-500">{userProgress.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-700">{userProgress.facility}</span>
                                                <span className="text-xs text-gray-500">{userProgress.department}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-[100px] max-w-[150px] bg-gray-100 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all ${userProgress.progressPercentage === 100
                                                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                                            : userProgress.progressPercentage >= 50
                                                                ? 'bg-gradient-to-r from-primary-400 to-primary-500'
                                                                : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                            }`}
                                                        style={{ width: `${userProgress.progressPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-600 w-12">
                                                    {userProgress.progressPercentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-800">{userProgress.readManuals}</span>
                                            <span className="text-gray-400"> / {userProgress.totalManuals}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expandedUser === userProgress.userId ? (
                                                <ChevronUp size={20} className="text-gray-400" />
                                            ) : (
                                                <ChevronDown size={20} className="text-gray-400" />
                                            )}
                                        </td>
                                    </tr>
                                    {expandedUser === userProgress.userId && userProgress.progressList.length > 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                <div className="pl-12 space-y-2">
                                                    <p className="text-sm font-medium text-gray-600 mb-2">読了済みマニュアル:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userProgress.progressList.map((p) => (
                                                            <span
                                                                key={p.id}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                                                            >
                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                                {p.manualTitle}
                                                            </span>
                                                        ))}
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
                        <Users className="mx-auto text-gray-400 mb-4" size={40} />
                        <p className="text-gray-500">該当する職員が見つかりません</p>
                    </div>
                )}
            </div>
        </div>
    );
}
