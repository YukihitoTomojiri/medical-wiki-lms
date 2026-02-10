import { useState, useEffect } from 'react';
import { api } from '../api';
import { User, UserCreateRequest, UserUpdateRequest } from '../types';
import {
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    X,
    RefreshCw,
    Shield,
    UserPlus,
    Building2,
    Calendar
} from 'lucide-react';

interface Props {
    user: User;
}

export default function AdminUserManagement({ user }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [facilities, setFacilities] = useState<string[]>([]);
    const [selectedFacility, setSelectedFacility] = useState(user.role === 'ADMIN' ? user.facility : '');

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [formData, setFormData] = useState<UserCreateRequest>({
        employeeId: '',
        name: '',
        facility: user.role === 'ADMIN' ? user.facility : '本館',
        department: '',
        role: 'USER',
        email: '',
        paidLeaveDays: 0,
        joinedDate: '',
        password: '' // Optional for create
    });

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (user.role === 'DEVELOPER') {
            fetchUsers();
        } else {
            // Admin always fetches their own facility, handled by backend but good to be explicit
            fetchUsers();
        }
    }, [selectedFacility]);

    const fetchInitialData = async () => {
        try {
            const fetchedFacilities = await api.getDistinctFacilities();
            setFacilities(fetchedFacilities);
            await fetchUsers();
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers(user.id, selectedFacility);
            // Filter out deleted users just in case backend returns them (though default getAllUsers shouldn't)
            setUsers(data.filter(u => !u.deletedAt));
        } catch (err) {
            setError('ユーザー一覧の取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setFormData({
            employeeId: '',
            name: '',
            facility: user.role === 'ADMIN' ? user.facility : '本館',
            department: '',
            role: 'USER',
            email: '',
            paidLeaveDays: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            password: ''
        });
        setError(null);
        setShowAddModal(true);
    };

    const handleEditClick = (targetUser: User) => {
        setSelectedUser(targetUser);
        setFormData({
            employeeId: targetUser.employeeId,
            name: targetUser.name,
            facility: targetUser.facility,
            department: targetUser.department,
            role: targetUser.role,
            email: targetUser.email || '',
            paidLeaveDays: targetUser.paidLeaveDays || 0,
            joinedDate: targetUser.joinedDate || '',
            password: ''
        });
        setError(null);
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!selectedUser || !confirm(`${selectedUser.name} を削除してもよろしいですか？\nこの操作は取り消せません（論理削除されます）。`)) return;

        try {
            setSubmitting(true);
            await api.bulkDeleteUsers(user.id, [selectedUser.id]);
            setSuccessMessage('ユーザーを削除しました。');
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            setError('削除に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (showAddModal) {
                await api.registerUser(user.id, formData);
                setSuccessMessage('ユーザーを登録しました。');
                setShowAddModal(false);
            } else if (showEditModal && selectedUser) {
                const updateData: UserUpdateRequest = {
                    role: formData.role,
                    facility: formData.facility,
                    department: formData.department,
                    email: formData.email,
                    paidLeaveDays: formData.paidLeaveDays,
                    joinedDate: formData.joinedDate
                };
                await api.updateUser(user.id, selectedUser.id, updateData);
                setSuccessMessage('ユーザー情報を更新しました。');
                setShowEditModal(false);
            }
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setError(err.message || '操作に失敗しました。入力内容を確認してください。');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employeeId.includes(searchTerm)
    );

    const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-xl text-primary-600">
                            <Shield size={24} />
                        </div>
                        ユーザー管理
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">
                        職員の登録、情報の編集、権限設定を行います
                    </p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="btn-primary py-3 rounded-2xl shadow-lg shadow-primary-200 active:scale-95"
                >
                    <UserPlus size={20} />
                    新規ユーザー登録
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="氏名または職員番号で検索..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {user.role === 'DEVELOPER' && (
                    <select
                        className="px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-500/20 text-sm font-bold text-gray-600"
                        value={selectedFacility}
                        onChange={e => setSelectedFacility(e.target.value)}
                    >
                        <option value="">全施設</option>
                        {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                )}

                <button
                    onClick={() => fetchUsers()}
                    className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 font-bold animate-in fade-in">
                    <CheckCircle size={20} />
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto hover:bg-emerald-100 p-1 rounded-full">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Users List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">職員</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">所属</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">権限</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">入職日</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin text-primary-200" size={32} />
                                            <span className="text-sm font-bold">データを読み込み中...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-gray-100 rounded-full">
                                                <Search size={24} className="text-gray-300" />
                                            </div>
                                            <span className="text-sm font-bold">ユーザーが見つかりませんでした</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{u.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                <Building2 size={14} className="text-gray-400" />
                                                {u.facility}
                                            </div>
                                            <div className="text-xs text-gray-500 pl-5">{u.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${u.role === 'ADMIN' ? 'bg-primary-50 text-primary-700 border-primary-100' :
                                                u.role === 'DEVELOPER' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={14} />
                                                {u.joinedDate || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditClick(u)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && (
                <Modal title="新規ユーザー登録" onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">職員番号</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                placeholder="例: 1001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">氏名</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 山田 太郎"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">施設</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.facility}
                                    onChange={e => setFormData({ ...formData, facility: e.target.value })}
                                    disabled={user.role === 'ADMIN'}
                                >
                                    {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">部署</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="例: 事務部"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">権限</label>
                            <select
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="USER">一般 (USER)</option>
                                <option value="ADMIN">管理者 (ADMIN)</option>
                                {user.role === 'DEVELOPER' && <option value="DEVELOPER">開発者 (DEVELOPER)</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス（任意）</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="taro@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">入職日</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    value={formData.joinedDate}
                                    onChange={e => setFormData({ ...formData, joinedDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">有給付与日数</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    value={formData.paidLeaveDays}
                                    onChange={e => setFormData({ ...formData, paidLeaveDays: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">初期パスワード（任意）</label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="未入力の場合は自動生成されます"
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="animate-spin" size={18} />
                                        処理中...
                                    </span>
                                ) : '登録する'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {showEditModal && selectedUser && (
                <Modal title="ユーザー編集" onClose={() => setShowEditModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">氏名</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 山田 太郎"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">施設</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                                    value={formData.facility}
                                    onChange={e => setFormData({ ...formData, facility: e.target.value })}
                                    disabled={user.role === 'ADMIN'}
                                >
                                    {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">部署</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="例: 事務部"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">権限</label>
                            <select
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="USER">一般 (USER)</option>
                                <option value="ADMIN">管理者 (ADMIN)</option>
                                {user.role === 'DEVELOPER' && <option value="DEVELOPER">開発者 (DEVELOPER)</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス（任意）</label>
                            <input
                                type="email"
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="taro@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">入職日</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    value={formData.joinedDate}
                                    onChange={e => setFormData({ ...formData, joinedDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">有給付与日数</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.paidLeaveDays}
                                    onChange={e => setFormData({ ...formData, paidLeaveDays: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors mr-auto"
                            >
                                <Trash2 size={18} className="inline mr-2" />
                                削除
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="animate-spin" size={18} />
                                        処理中...
                                    </span>
                                ) : '更新する'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
