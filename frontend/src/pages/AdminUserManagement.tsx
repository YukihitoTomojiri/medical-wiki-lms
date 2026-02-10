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
    Calendar,
    UserCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-m3-surface-container-high rounded-[28px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-m3-outline-variant/20 flex justify-between items-center sticky top-0 bg-m3-surface-container-high z-10">
                    <h2 className="text-xl font-medium text-m3-on-surface">{title}</h2>
                    <Button variant="text" size="sm" onClick={onClose} className="rounded-full h-10 w-10 px-0">
                        <X size={20} />
                    </Button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium text-m3-on-surface tracking-tight flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-m3-primary-container text-m3-on-primary-container">
                            <Shield size={18} />
                        </div>
                        ユーザー管理
                    </h1>
                    <p className="text-m3-on-surface-variant text-sm mt-1 ml-11">
                        職員の登録、情報の編集、権限設定を行います
                    </p>
                </div>
                <Button variant="filled" onClick={handleAddClick} icon={<UserPlus size={18} />}>
                    新規ユーザー登録
                </Button>
            </div>

            {/* Filters */}
            <Card variant="filled" className="p-4 flex flex-wrap gap-4 items-center bg-m3-surface-container">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" size={18} />
                    <input
                        type="text"
                        placeholder="氏名または職員番号で検索..."
                        className="w-full pl-10 pr-4 py-2.5 bg-m3-surface border border-m3-outline-variant rounded-full focus:ring-2 focus:ring-m3-primary focus:border-m3-primary text-sm transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {user.role === 'DEVELOPER' && (
                    <select
                        className="px-4 py-2.5 bg-m3-surface border border-m3-outline-variant rounded-full focus:ring-2 focus:ring-m3-primary text-sm text-m3-on-surface"
                        value={selectedFacility}
                        onChange={e => setSelectedFacility(e.target.value)}
                    >
                        <option value="">全施設</option>
                        {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                )}

                <Button variant="outlined" onClick={() => fetchUsers()} size="md" className="rounded-full px-3">
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </Button>
            </Card>

            {/* Success Message */}
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 font-medium animate-in fade-in">
                    <CheckCircle size={20} />
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto hover:bg-emerald-100 p-1 rounded-full">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Users List Data Table */}
            <Card variant="outlined" className="overflow-hidden bg-m3-surface">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-m3-surface-container-low border-b border-m3-outline-variant">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-m3-on-surface-variant">職員</th>
                                <th className="px-6 py-4 text-xs font-bold text-m3-on-surface-variant">所属</th>
                                <th className="px-6 py-4 text-xs font-bold text-m3-on-surface-variant">権限</th>
                                <th className="px-6 py-4 text-xs font-bold text-m3-on-surface-variant hidden md:table-cell">入職日</th>
                                <th className="px-6 py-4 text-xs font-bold text-m3-on-surface-variant text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-m3-outline-variant/20">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-m3-outline-variant">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin text-m3-primary" size={32} />
                                            <span className="text-sm">データを読み込み中...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-m3-outline-variant">
                                        <div className="flex flex-col items-center gap-2">
                                            <UserCircle size={48} className="opacity-20" />
                                            <span className="text-sm">ユーザーが見つかりませんでした</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id} className="group hover:bg-m3-surface-container-highest/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-m3-secondary-container flex items-center justify-center text-m3-on-secondary-container font-bold text-sm">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-m3-on-surface">{u.name}</div>
                                                    <div className="text-xs text-m3-outline font-mono">{u.employeeId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-m3-on-surface">
                                                <Building2 size={14} className="text-m3-outline" />
                                                {u.facility}
                                            </div>
                                            <div className="text-xs text-m3-outline pl-5">{u.department}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                u.role === 'ADMIN' ? 'error' :
                                                    u.role === 'DEVELOPER' ? 'warning' : 'success'
                                            }>
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-sm text-m3-outline">
                                                <Calendar size={14} />
                                                {u.joinedDate || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="text"
                                                size="sm"
                                                onClick={() => handleEditClick(u)}
                                                className="text-m3-outline hover:text-m3-primary"
                                                icon={<Edit2 size={18} />}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modals */}
            {showAddModal && (
                <Modal title="新規ユーザー登録" onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                label="職員番号"
                                required
                                value={formData.employeeId}
                                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                placeholder="例: 1001"
                            />
                        </div>

                        <div>
                            <Input
                                label="氏名"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 山田 太郎"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-m3-on-surface-variant mb-1.5 ml-1">施設</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-lg focus:ring-1 focus:ring-m3-primary focus:border-m3-primary outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                                    value={formData.facility}
                                    onChange={e => setFormData({ ...formData, facility: e.target.value })}
                                    disabled={user.role === 'ADMIN'}
                                >
                                    {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <Input
                                    label="部署"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="例: 事務部"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-m3-on-surface-variant mb-1.5 ml-1">権限</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-lg focus:ring-1 focus:ring-m3-primary focus:border-m3-primary outline-none transition-all text-sm"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="USER">一般 (USER)</option>
                                <option value="ADMIN">管理者 (ADMIN)</option>
                                {user.role === 'DEVELOPER' && <option value="DEVELOPER">開発者 (DEVELOPER)</option>}
                            </select>
                        </div>

                        <div>
                            <Input
                                type="email"
                                label="メールアドレス（任意）"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="taro@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    type="date"
                                    label="入職日"
                                    required
                                    value={formData.joinedDate}
                                    onChange={e => setFormData({ ...formData, joinedDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    label="有給付与日数"
                                    step="0.5"
                                    min="0"
                                    value={formData.paidLeaveDays}
                                    onChange={e => setFormData({ ...formData, paidLeaveDays: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <Input
                                type="password"
                                label="初期パスワード（任意）"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="未入力の場合は自動生成されます"
                                autoComplete="new-password"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-m3-error-container text-m3-on-error-container rounded-xl text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="filled"
                                disabled={submitting}
                                className="flex-1 w-full"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <RefreshCw className="animate-spin" size={18} />
                                        処理中...
                                    </span>
                                ) : '登録する'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {showEditModal && selectedUser && (
                <Modal title="ユーザー編集" onClose={() => setShowEditModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Edit form fields are similar to Add form, but shorter for brevity here */}
                        <div>
                            <Input
                                label="氏名"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 山田 太郎"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-m3-on-surface-variant mb-1.5 ml-1">施設</label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-lg text-sm"
                                    value={formData.facility}
                                    onChange={e => setFormData({ ...formData, facility: e.target.value })}
                                    disabled={user.role === 'ADMIN'}
                                >
                                    {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <Input
                                    label="部署"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-m3-on-surface-variant mb-1.5 ml-1">権限</label>
                            <select
                                required
                                className="w-full px-4 py-3 bg-m3-surface border border-m3-outline rounded-lg text-sm"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="USER">一般 (USER)</option>
                                <option value="ADMIN">管理者 (ADMIN)</option>
                                {user.role === 'DEVELOPER' && <option value="DEVELOPER">開発者 (DEVELOPER)</option>}
                            </select>
                        </div>

                        <div>
                            <Input
                                type="email"
                                label="メールアドレス"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    type="date"
                                    label="入職日"
                                    required
                                    value={formData.joinedDate}
                                    onChange={e => setFormData({ ...formData, joinedDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    label="有給付与日数"
                                    value={formData.paidLeaveDays}
                                    onChange={e => setFormData({ ...formData, paidLeaveDays: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-m3-error-container text-m3-on-error-container rounded-xl text-sm font-bold animate-pulse">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 justify-between">
                            <Button
                                type="button"
                                variant="text"
                                onClick={handleDelete}
                                disabled={submitting}
                                className="text-m3-error hover:text-red-700"
                                icon={<Trash2 size={18} />}
                            >
                                削除
                            </Button>

                            <Button
                                type="submit"
                                variant="filled"
                                disabled={submitting}
                                className="w-1/2"
                            >
                                {submitting ? '処理中...' : '更新する'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
