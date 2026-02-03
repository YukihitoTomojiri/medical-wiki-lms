import { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { RefreshCw, Search, Shield, CheckCircle, XCircle } from 'lucide-react';

export default function AllUsersAdmin() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [facilities, setFacilities] = useState<string[]>([]);
    const [selectedFacility, setSelectedFacility] = useState('');
    const [restoringId, setRestoringId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, facilitiesData] = await Promise.all([
                api.getAllUsersIncludingDeleted(1),
                api.getDistinctFacilities()
            ]);
            setUsers(usersData);
            setFacilities(facilitiesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            alert('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        // Keeps compatibility with handleRestore logic
        try {
            const data = await api.getAllUsersIncludingDeleted(1);
            setUsers(data);
        } catch (e) { console.error(e); }
    };

    const handleRestore = async (user: User) => {
        if (!confirm(`ユーザー ${user.name} (${user.employeeId}) を復元しますか？\n論理削除状態から通常の在職状態に戻ります。`)) return;

        try {
            setRestoringId(user.id);
            await api.restoreUser(1, user.id);
            alert('復元が完了しました');
            fetchUsers();
        } catch (error) {
            console.error('Failed to restore user:', error);
            alert('復元に失敗しました');
        } finally {
            setRestoringId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.employeeId.includes(searchTerm)) &&
        (!selectedFacility || user.facility === selectedFacility)
    );

    const retiredCount = users.filter(u => u.deletedAt).length;
    const activeCount = users.length - retiredCount;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-slate-100 rounded-2xl">
                            <Shield className="text-slate-600" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-800 tracking-tight">全データ管理 (アーカイブ)</h1>
                            <p className="text-gray-500 font-medium">退職者を含む全ての職員データを管理・復元します</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">在職者数 (Active)</p>
                        <p className="text-2xl font-black text-gray-800">{activeCount}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">退職済 (Archived)</p>
                        <p className="text-2xl font-black text-gray-500">{retiredCount}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 text-gray-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name or ID..."
                        className="w-full bg-transparent border-none focus:ring-0 text-gray-700 font-medium placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-end">
                <select
                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium shadow-sm"
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                >
                    <option value="">全施設を表示 (全ての拠点)</option>
                    {facilities.map((facility) => (
                        <option key={facility} value={facility}>
                            {facility}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Facility / Dept</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading data...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isDeleted = !!user.deletedAt;
                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isDeleted ? 'bg-gray-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                {isDeleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                                                        <XCircle size={12} />
                                                        退職済み（アーカイブ）
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-200">
                                                        <CheckCircle size={12} />
                                                        在職中
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 font-mono text-sm font-bold ${isDeleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {user.employeeId}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`font-bold ${isDeleted ? 'text-gray-400 line-through decoration-2 decoration-gray-300' : 'text-gray-800'}`}>
                                                    {user.name}
                                                </div>
                                                {isDeleted && (
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        Deleted: {new Date(user.deletedAt!).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-sm font-medium ${isDeleted ? 'text-gray-400' : 'text-gray-700'}`}>{user.facility}</div>
                                                <div className={`text-xs ${isDeleted ? 'text-gray-300' : 'text-gray-400'}`}>{user.department}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDeleted ? 'bg-gray-100 text-gray-400' :
                                                    user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' :
                                                        user.role === 'DEVELOPER' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isDeleted && (
                                                    <button
                                                        onClick={() => handleRestore(user)}
                                                        disabled={restoringId === user.id}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-emerald-600 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    >
                                                        {restoringId === user.id ? (
                                                            <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <RefreshCw size={14} />
                                                        )}
                                                        Restore
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

