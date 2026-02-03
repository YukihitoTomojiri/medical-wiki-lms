import { useState, useEffect } from 'react';
import { api } from '../api';
import { User } from '../types';
import { RefreshCw, Search, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AllUsersAdmin() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [facilities, setFacilities] = useState<string[]>([]);
    const [selectedFacility, setSelectedFacility] = useState('');
    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [selectedFacility]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const facilitiesData = await api.getDistinctFacilities();
            setFacilities(facilitiesData);
            await fetchUsers();
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
            setError('データの初期取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setError(null);
            const data = await api.getAllUsersIncludingDeleted(1, selectedFacility);
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('データの取得に失敗しました。サーバーとの通信を確認してください。');
        }
    };

    const handleRestore = async (user: User) => {
        if (!confirm(`ユーザー ${user.name} (${user.employeeId}) を復元しますか？\n論理削除状態から通常の在職状態に戻ります。`)) return;

        try {
            setError(null);
            setRestoringId(user.id);
            await api.restoreUser(1, user.id);
            await fetchUsers();
        } catch (err) {
            console.error('Failed to restore user:', err);
            setError('復元に失敗しました。権限やデータ状態を確認してください。');
        } finally {
            setRestoringId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeId.includes(searchTerm)
    );

    const retiredCount = users.filter(u => u.deletedAt).length;
    const activeCount = users.length - retiredCount;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Shield className="text-slate-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 tracking-tight">全データ管理 (アーカイブ)</h1>
                            <p className="text-xs text-gray-500 font-medium">退職者を含む全ての職員データを管理・復元します</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                    <button onClick={() => fetchUsers()} className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
            )}

            {/* Stats & Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex gap-4 flex-1">
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Active</p>
                            <p className="text-lg font-black text-gray-800 leading-none">{activeCount}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Archived</p>
                            <p className="text-lg font-black text-gray-500 leading-none">{retiredCount}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 flex-[1.5]">
                    <div className="flex-1 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100 flex items-center">
                        <Search size={16} className="text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Name or ID..."
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-gray-400 p-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-white border border-gray-100 text-gray-700 text-sm font-bold rounded-2xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-slate-500/10 focus:border-slate-300 outline-none transition-all min-w-[180px]"
                        value={selectedFacility}
                        onChange={(e) => setSelectedFacility(e.target.value)}
                    >
                        <option value="">全施設を表示</option>
                        {facilities.map((facility) => (
                            <option key={facility} value={facility}>
                                {facility}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={fetchUsers}
                        className="p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-slate-600 hover:bg-gray-50 transition-all shadow-sm"
                        title="Reload"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Info</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Facility / Dept</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold text-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin text-slate-300" size={32} />
                                            <span>Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <p className="font-bold text-sm">該当するデータは見つかりませんでした</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const isDeleted = !!user.deletedAt;
                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${isDeleted ? 'bg-gray-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                {isDeleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wide border border-gray-200/50">
                                                        <XCircle size={10} />
                                                        ARCHIVED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wide border border-emerald-200/50">
                                                        <CheckCircle size={10} />
                                                        ACTIVE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`font-black tracking-tight ${isDeleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-800'}`}>
                                                    {user.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] font-bold text-gray-400">
                                                    <span>{user.employeeId}</span>
                                                    {isDeleted && (
                                                        <span className="text-red-400">
                                                            (Deleted: {new Date(user.deletedAt!).toLocaleDateString('ja-JP')})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs font-bold truncate max-w-[150px] ${isDeleted ? 'text-gray-400' : 'text-gray-700'}`} title={user.facility}>{user.facility}</div>
                                                <div className={`text-[10px] font-medium ${isDeleted ? 'text-gray-300' : 'text-gray-400'}`}>{user.department}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${isDeleted ? 'bg-gray-50 text-gray-300 border-gray-100' :
                                                    user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        user.role === 'DEVELOPER' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isDeleted && (
                                                    <button
                                                        onClick={() => handleRestore(user)}
                                                        disabled={restoringId === user.id}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    >
                                                        {restoringId === user.id ? (
                                                            <span className="w-3 h-3 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                                        ) : (
                                                            <RefreshCw size={12} />
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

