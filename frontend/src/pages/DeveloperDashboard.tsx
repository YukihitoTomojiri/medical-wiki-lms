
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { User, UserCreateRequest } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { RestoreConfirmModal } from '../components/RestoreConfirmModal';
import AllUsersAdmin from './AllUsersAdmin';
import {
    Activity,
    Database,
    Shield,
    FileText,
    Users,
    RefreshCw,
    Edit2,
    Check,
    X as XIcon,
    Terminal,
    Plus,
    Upload,
    AlertCircle
} from 'lucide-react';



interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

export default function DeveloperDashboard() {
    const [stats, setStats] = useState({
        dbStatus: 'Check...',
        version: '1.0.0',
    });

    const [activeTab, setActiveTab] = useState<'system' | 'logs' | 'archive'>('system');

    // Data States
    const [userList, setUserList] = useState<User[]>([]);


    // UI States
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [lastSync, setLastSync] = useState<string>('Never');
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [diagnostics, setDiagnostics] = useState({
        uptime: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        dbPing: 0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Reset to default tab when location changes (e.g. clicking "Developer Menu" in sidebar)
    const location = useLocation();
    useEffect(() => {
        // When the path is exactly /developer, reset to system tab
        if (location.pathname === '/developer') {
            setActiveTab('system');
        }
    }, [location.pathname]);

    // Restore / Bulk Register States
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restorableUsers, setRestorableUsers] = useState<User[]>([]);
    const [pendingCsvData, setPendingCsvData] = useState<UserCreateRequest[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchData();
        addLog('System initialized', 'info');
    }, []);

    const fetchDiagnostics = async () => {
        try {
            const data = await api.getDiagnostics(1);
            setDiagnostics(data);
        } catch (e) { console.error(e); }
    };

    const fetchSystemLogs = async () => {
        try {
            const data = await api.getAuditLogs(1);
            setSystemLogs(data);
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            addLog('Fetching system data...', 'info');
            const [usersData] = await Promise.all([
                api.getUsers(1),
                api.getManuals(1).catch(() => []),
                api.getAllUsersProgress().catch(() => []),
                fetchDiagnostics(),
                fetchSystemLogs()
            ]);
            setUserList(usersData);
            setLastSync(new Date().toLocaleTimeString());
            addLog(`Loaded ${usersData.length} users and checked system health`, 'success');
        } catch (error) {
            console.error(error);
            setStats(prev => ({ ...prev, dbStatus: 'Error' }));
            addLog('Failed to fetch data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper: Add Log
    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const entry: LogEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        setLogs(prev => [entry, ...prev].slice(0, 50));
    };

    // Calculate Stats
    const computedStats = useMemo(() => ({
        developers: userList.filter(u => u.role === 'DEVELOPER').length,
        admins: userList.filter(u => u.role === 'ADMIN').length,
        users: userList.filter(u => u.role === 'USER').length,
        facilities: new Set(userList.map(u => u.facility)).size,
    }), [userList]);

    // Check DB Status
    useEffect(() => {
        if (userList.length > 0) {
            setStats(prev => ({ ...prev, dbStatus: 'Connected' }));
        }
    }, [userList]);

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedUsers.length === userList.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(userList.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: number) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const openDeleteModal = () => {
        if (selectedUsers.length === 0) return;
        setShowDeleteModal(true);
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0 || isDeleting) return;
        setIsDeleting(true);

        try {
            addLog(`Attempting to delete ${selectedUsers.length} users...`, 'info');
            const res = await api.bulkDeleteUsers(1, selectedUsers);

            if (res.success) {
                addLog(`Successfully deleted ${selectedUsers.length} users`, 'success');
                setSelectedUsers([]);
                setShowDeleteModal(false);
                fetchData();
            } else {
                const msg = res.message || 'Bulk delete failed';
                addLog(msg, 'error');
                alert(`削除に失敗しました: ${msg}`);
            }
        } catch (e: any) {
            console.error('Bulk delete error:', e);
            const msg = e.message || 'Server connection error during deletion';
            addLog(msg, 'error');
            alert(`エラーが発生しました: ${msg}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkReset = async () => {
        if (!window.confirm(`選択した ${selectedUsers.length} 名の進捗をリセットしますか？`)) return;
        try {
            addLog(`Resetting progress for ${selectedUsers.length} users...`, 'info');
            await api.bulkResetProgress(1, selectedUsers);
            addLog('Bulk reset successful', 'success');
            setSelectedUsers([]);
            fetchData();
        } catch (e) {
            addLog('Bulk reset failed', 'error');
        }
    };



    // Edit Logic
    const startEdit = (user: User) => {
        setEditingUserId(user.id);
        setEditForm({
            role: user.role,
            facility: user.facility,
            department: user.department
        });
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setEditForm({});
    };

    const saveEdit = async (id: number) => {
        try {
            addLog(`Updating user ID:${id}...`, 'info');
            await api.updateUser(1, id, {
                role: editForm.role,
                facility: editForm.facility,
                department: editForm.department
            });
            addLog(`User updated successfully`, 'success');
            setEditingUserId(null);
            fetchData(); // Refresh list to get latest data
        } catch (error) {
            console.error(error);
            addLog(`Failed to update user`, 'error');
            alert('更新に失敗しました');
        }
    };

    // Dynamic Department Options based on Facility
    const getDepartments = (facility?: string) => {
        const mapping: Record<string, string[]> = {
            '本館': ['3階病棟', '4階病棟', 'リハビリテーション', '事務部', '栄養課'],
            '南棟': ['2階病棟', '3階病棟', '透析室'],
            'ひまわりの里病院': ['外来', '薬局', '検査室'],
            'あおぞら中央クリニック': ['診療外来', '訪問看護']
        };
        return (facility && mapping[facility]) || [];
    };

    // Registration States
    const [registerForm, setRegisterForm] = useState({
        employeeId: '',
        name: '',
        password: 'password123', // Default for new users
        facility: '本館',
        department: '3階病棟',
        role: 'USER' as const
    });
    const [csvError, setCsvError] = useState<string | null>(null);

    const handleSingleRegister = async () => {
        if (!registerForm.employeeId || !registerForm.name) {
            alert('IDと名前を入力してください');
            return;
        }
        try {
            addLog(`Registering user ${registerForm.employeeId}...`, 'info');
            const res = await api.registerUser(1, registerForm);
            if (res.id) {
                addLog(`User registered successfully`, 'success');
                setRegisterForm({
                    employeeId: '',
                    name: '',
                    password: 'password123',
                    facility: '本館',
                    department: '3階病棟',
                    role: 'USER'
                });
                fetchData();
            } else {
                const errorMsg = res.message || 'Registration failed';
                addLog(errorMsg, 'error');
                setCsvError(errorMsg);
            }
        } catch (e: any) {
            const msg = e.message || 'Registration failed';
            addLog(msg, 'error');
            setCsvError(msg);
        }
    };

    const executeRestoreAndRegister = async (restoreIds: string[]) => {
        if (pendingCsvData.length === 0 || isRegistering) return;
        setIsRegistering(true);

        try {
            await api.bulkRegisterUsersV2(1, { users: pendingCsvData, restoreIds });
            addLog(`Bulk process completed: ${pendingCsvData.length} users (Restored: ${restoreIds.length})`, 'success');
            setPendingCsvData([]);
            setRestorableUsers([]);
            setShowRestoreModal(false);
            setCsvError(null);
            fetchData();
            alert(`${pendingCsvData.length} 件の処理が完了しました（復元: ${restoreIds.length}件）`);
        } catch (e: any) {
            const msg = e.message || 'Error executing bulk register';
            setCsvError(msg);
            addLog(msg, 'error');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvError(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            const users: any[] = [];

            try {
                for (let i = 1; i < rows.length; i++) {
                    const cols = rows[i].split(',').map(c => c.trim());
                    if (cols.length < 5) continue;
                    const name = cols[1];
                    // クライアント側でも簡易チェック
                    if (name && !name.includes(' ') && !name.includes('　')) {
                        throw new Error(`${i + 1}行目の名前 [${name}] に姓名間のスペースがありません。`);
                    }

                    users.push({
                        employeeId: cols[0],
                        name: name,
                        password: 'password123',
                        facility: cols[2],
                        department: cols[3],
                        role: (cols[4] || 'USER').toUpperCase()
                    });
                }

                if (users.length === 0) {
                    setCsvError('有効なデータが見つかりませんでした');
                    return;
                }

                addLog(`Validating ${users.length} users...`, 'info');

                // Validate first
                const validation = await api.validateBulkCsv(1, users);

                if (validation.errors && validation.errors.length > 0) {
                    setCsvError('以下のエラーがあります:\n' + validation.errors.join('\n'));
                    addLog('CSV validation failed', 'error');
                    return;
                }

                // Check for restorable users
                if (validation.restorableUsers && validation.restorableUsers.length > 0) {
                    setRestorableUsers(validation.restorableUsers);
                    setPendingCsvData(users);
                    setShowRestoreModal(true);
                    addLog(`Found ${validation.restorableUsers.length} restorable users. Waiting for confirmation...`, 'info');
                    return;
                }

                // If valid and no restorable users, proceed directly
                const res = await api.bulkRegisterUsersV2(1, { users, restoreIds: [] });
                if (res.success) {
                    addLog('Bulk registration successful', 'success');
                    fetchData();
                    alert('一括登録が完了しました');
                } else {
                    addLog('Bulk registration failed', 'error');
                    setCsvError(res.message);
                }
            } catch (err: any) {
                setCsvError(err.message || 'CSVの解析またはサーバー通信に失敗しました。');
                addLog('CSV Error: ' + err.message, 'error');
            } finally {
                // Clear input
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };


    return (
        <>
            <ConfirmModal
                isOpen={showDeleteModal}
                title="ユーザーの削除確認"
                message={`選択した ${selectedUsers.length} 人のユーザーを削除します。よろしいですか？`}
                confirmLabel="削除する"
                cancelLabel="キャンセル"
                onConfirm={handleBulkDelete}
                onCancel={() => setShowDeleteModal(false)}
                isLoading={isDeleting}
            />

            <RestoreConfirmModal
                isOpen={showRestoreModal}
                restorableUsers={restorableUsers}
                onConfirm={executeRestoreAndRegister}
                onCancel={() => {
                    setShowRestoreModal(false);
                    setPendingCsvData([]);
                    setRestorableUsers([]);
                }}
                isLoading={isRegistering}
            />
            <div className="space-y-4 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                            Developer Console
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                                <Activity size={16} className="text-green-500" />
                                System v{stats.version} Running
                            </p>
                            <p className="text-gray-400 text-sm flex items-center gap-2 border-l pl-4 border-gray-200">
                                <RefreshCw size={14} />
                                Last Sync: {lastSync}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-medium shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-gray-100 rounded-xl w-fit mb-8 border border-gray-200">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-black tracking-wide transition-all ${activeTab === 'system'
                            ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        System Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-black tracking-wide transition-all ${activeTab === 'logs'
                            ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Audit Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-black tracking-wide transition-all ${activeTab === 'archive'
                            ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        User Archive
                    </button>
                </div>

                {activeTab === 'system' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {/* DB Status */}
                            <div className={`p-3 rounded-xl border flex items-center gap-3 shadow-sm transition-all ${stats.dbStatus === 'Connected'
                                ? 'bg-emerald-50 border-emerald-100'
                                : 'bg-red-50 border-red-100'
                                } `}>
                                <div className={`p-2 rounded-lg ${stats.dbStatus === 'Connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                    } `}>
                                    <Database size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider opacity-60 leading-none mb-1">Database</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stats.dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                                            } `} />
                                        <p className="font-black text-sm truncate uppercase tracking-tight">{stats.dbStatus}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Users Count */}
                            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 leading-none mb-1">Total Users</p>
                                    <p className="font-black text-lg text-gray-800 leading-none">{userList.length}</p>
                                </div>
                            </div>

                            {/* Role Breakdown */}
                            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Shield size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 leading-none mb-1">Privileges</p>
                                    <div className="flex gap-1.5 text-[10px] font-bold mt-0.5">
                                        <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">D:{computedStats.developers}</span>
                                        <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">A:{computedStats.admins}</span>
                                        <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">U:{computedStats.users}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Facilities */}
                            <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 leading-none mb-1">Facilities</p>
                                    <p className="font-black text-lg text-gray-800 leading-none">{computedStats.facilities}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="max-w-6xl mx-auto w-full space-y-8">
                            {/* User Registration Section */}
                            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
                                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                                            <Plus className="text-emerald-500" size={20} />
                                            User Registration
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium whitespace-nowrap">Add individual users or upload batch data</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 cursor-pointer active:scale-95">
                                            <Upload size={14} />
                                            Upload CSV
                                            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5">
                                    {csvError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
                                            <div className="flex-grow">
                                                <p className="text-xs font-black text-red-800">処理エラーが発生しました</p>
                                                <p className="text-[10px] text-red-600 mt-0.5 whitespace-pre-line font-medium leading-tight">
                                                    {csvError}
                                                </p>
                                            </div>
                                            <button onClick={() => setCsvError(null)} className="ml-0.5 text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-lg transition-colors">
                                                <XIcon size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                                        <div className="md:col-span-1">
                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">ID</label>
                                            <input
                                                type="text"
                                                placeholder="dev-001"
                                                value={registerForm.employeeId}
                                                onChange={e => setRegisterForm({ ...registerForm, employeeId: e.target.value })}
                                                className="w-full py-1.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Identity Name</label>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={registerForm.name}
                                                onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                className="w-full py-1.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Facility</label>
                                            <select
                                                value={registerForm.facility}
                                                onChange={e => setRegisterForm({ ...registerForm, facility: e.target.value, department: getDepartments(e.target.value)[0] || '' })}
                                                className="w-full py-1.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                <option value="本館">本館</option>
                                                <option value="南棟">南棟</option>
                                                <option value="ひまわりの里病院">ひまわりの里病院</option>
                                                <option value="あおぞら中央クリニック">あおぞら中央クリニック</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Department</label>
                                            <select
                                                value={registerForm.department}
                                                onChange={e => setRegisterForm({ ...registerForm, department: e.target.value })}
                                                className="w-full py-1.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                {getDepartments(registerForm.facility).map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Role</label>
                                            <select
                                                value={registerForm.role}
                                                onChange={e => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                                                className="w-full py-1.5 px-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="DEVELOPER">DEVELOPER</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 flex items-end">
                                            <button
                                                onClick={handleSingleRegister}
                                                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all font-black text-[10px] tracking-widest active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Check size={14} />
                                                REGISTER
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Status Banner */}
                            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden group border border-slate-700">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700 group-hover:opacity-10">
                                    <Terminal size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                                        <h3 className="text-lg font-black flex items-center gap-3 tracking-tight">
                                            <Activity className="text-orange-500 animate-pulse" size={20} />
                                            System Diagnostics
                                        </h3>
                                        <div className="flex gap-4">
                                            <div className="px-2 py-0.5 bg-white/5 rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                Node: medical-wiki-backend
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">DB Latency</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">
                                                    {diagnostics.dbPing}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">ms</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">System Uptime</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-orange-400 font-mono tracking-tighter">
                                                    {Math.floor(diagnostics.uptime / 3600000)}h {Math.floor((diagnostics.uptime % 3600000) / 60000)}m
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">Memory Usage</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-blue-400 font-mono tracking-tighter">
                                                    {Math.round(diagnostics.memoryUsed / 1024 / 1024)}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500">/ {Math.round(diagnostics.memoryTotal / 1024 / 1024)} MB</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">DB Connectivity</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
                                                <span className="font-black text-xs uppercase tracking-wider">{stats.dbStatus}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Management Section */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
                                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800 tracking-tight">Active Nodes Control</h3>
                                        <p className="text-sm text-gray-500 font-medium">Control access and user privileges</p>
                                    </div>

                                    {/* Bulk Action Menu */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <span className="text-xs font-bold text-orange-600 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                                                {selectedUsers.length} Selected
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleBulkReset}
                                                    className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
                                                >
                                                    Reset Progress
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={openDeleteModal}
                                                    className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                                >
                                                    Delete Users
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedUsers.length === 0 && (
                                        <div className="px-5 py-2 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 shadow-sm uppercase tracking-widest">
                                            {userList.length} Nodes Registered
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 sm:p-5">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="px-3 py-3 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.length === userList.length && userList.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="w-4 h-4 rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID</th>
                                                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity Name</th>

                                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Facility</th>
                                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Department</th>
                                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                                    <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {userList.map(user => {
                                                    const isEditing = editingUserId === user.id;
                                                    const isSelected = selectedUsers.includes(user.id);
                                                    return (
                                                        <tr key={user.id} className={`transition-all group ${isEditing ? 'bg-orange-50/50' : (isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50/80')} `}>
                                                            <td className="px-4 py-4 w-10">
                                                                {!isEditing && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleSelectUser(user.id)}
                                                                        className="w-4 h-4 rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                                    />
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 text-sm font-mono text-gray-400">{user.employeeId}</td>
                                                            <td className="px-4 py-4 text-sm font-extrabold text-gray-800">{user.name}</td>

                                                            {/* Facility */}
                                                            <td className="px-4 py-4 text-sm">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editForm.facility}
                                                                        onChange={e => setEditForm({ ...editForm, facility: e.target.value })}
                                                                        className="w-full p-2 border-2 border-orange-200 rounded-xl text-sm bg-white focus:border-orange-500 outline-none transition-all font-bold"
                                                                    >
                                                                        <option value="本館">本館</option>
                                                                        <option value="南棟">南棟</option>
                                                                        <option value="ひまわりの里病院">ひまわりの里病院</option>
                                                                        <option value="あおぞら中央クリニック">あおぞら中央クリニック</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-[11px] font-black uppercase tracking-wider">
                                                                        {user.facility}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Department */}
                                                            <td className="px-4 py-4 text-sm">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editForm.department}
                                                                        onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                                        className="w-full p-2 border-2 border-orange-200 rounded-xl text-sm bg-white focus:border-orange-500 outline-none transition-all font-bold"
                                                                        disabled={!editForm.facility}
                                                                    >
                                                                        {getDepartments(editForm.facility).map(dept => (
                                                                            <option key={dept} value={dept}>{dept}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <span className="text-gray-600 font-medium">{user.department}</span>
                                                                )}
                                                            </td>

                                                            {/* Role */}
                                                            <td className="px-4 py-4 text-sm">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editForm.role}
                                                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                                                        className={`w-full p-2 border-2 rounded-xl text-sm bg-white focus:ring-0 outline-none transition-all font-black tracking-tight ${editForm.role === 'DEVELOPER' ? 'text-purple-700 border-purple-200 focus:border-purple-500' :
                                                                            editForm.role === 'ADMIN' ? 'text-red-700 border-red-200 focus:border-red-500' :
                                                                                'text-emerald-700 border-emerald-200 focus:border-emerald-500'
                                                                            } `}
                                                                    >
                                                                        <option value="USER">USER</option>
                                                                        <option value="ADMIN">ADMIN</option>
                                                                        <option value="DEVELOPER">DEVELOPER</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'DEVELOPER' ? 'bg-purple-100/50 text-purple-700 border border-purple-200' :
                                                                        user.role === 'ADMIN' ? 'bg-red-100/50 text-red-700 border border-red-200' :
                                                                            'bg-emerald-100/50 text-emerald-700 border border-emerald-200'
                                                                        } `}>
                                                                        {user.role}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-4 py-4 text-right">
                                                                {isEditing ? (
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={cancelEdit}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                                                            title="Cancel"
                                                                        >
                                                                            <XIcon size={20} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => saveEdit(user.id)}
                                                                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all text-xs font-black tracking-widest"
                                                                            title="Save Changes"
                                                                        >
                                                                            <Check size={16} />
                                                                            SAVE
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => startEdit(user)}
                                                                        className="flex items-center gap-2 px-4 py-2 text-xs font-black tracking-widest text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        EDIT
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'logs' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Audit Logs View */}
                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden mb-12">
                            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Activity className="text-emerald-500" />
                                        Audit Records (JST)
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">Immutable audit trail of all system actions</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-2xl border border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Shield size={14} className="text-emerald-500" />
                                        Secured Logs
                                    </div>
                                    <button
                                        onClick={fetchSystemLogs}
                                        className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
                                    >
                                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="h-[600px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                                <div className="space-y-4 max-w-5xl mx-auto py-4">
                                    {Array.isArray(systemLogs) && systemLogs.map((log) => (
                                        <div key={log.id} className="group relative flex items-start gap-6 p-5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300">
                                            {/* Timeline indicator */}
                                            <div className="absolute left-[111px] top-0 bottom-0 w-px bg-slate-800 group-hover:bg-emerald-500/20 transition-colors" />

                                            <div className="flex-shrink-0 w-24 pt-1 relative z-10 bg-slate-900 pr-4">
                                                <p className="text-[11px] font-black text-slate-400 font-mono tracking-tighter">
                                                    {log.timestamp.split(' ')[1]}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-widest">
                                                    {log.timestamp.split(' ')[0]}
                                                </p>
                                            </div>

                                            <div className="relative z-10 flex-shrink-0 mt-1.5">
                                                <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:bg-emerald-500 group-hover:border-emerald-400/30 transition-all" />
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${log.action === 'LOGIN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        log.action === 'USER_UPDATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            log.action === 'USER_DELETE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                log.action.includes('BULK') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="text-sm font-black text-white truncate">{log.target}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                                                    {log.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                                                        <Users size={12} className="text-slate-500" />
                                                        <span className="text-[10px] font-bold text-slate-500">{log.performedBy}</span>
                                                    </div>
                                                    {log.ipAddress && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                                                            <Terminal size={12} className="text-slate-500" />
                                                            <span className="text-[10px] font-mono text-slate-500">{log.ipAddress}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {systemLogs.length === 0 && (
                                        <div className="text-center py-20 px-4">
                                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Shield size={40} className="text-slate-700" />
                                            </div>
                                            <p className="text-slate-500 font-black uppercase tracking-[.2em] text-xs">No entries found in audit vault</p>
                                            <p className="text-slate-600 text-[10px] mt-2 font-medium">System activity logs will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <AllUsersAdmin />
                    </div>
                )}


                {/* System Log Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-300 border-t border-slate-700 shadow-2xl transition-transform transform translate-y-[calc(100%-40px)] hover:translate-y-0 z-50">
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-slate-700 rounded group-hover:bg-slate-600 transition-colors">
                                <Terminal size={14} className="text-orange-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">System Log Console</span>
                            <span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">{logs.length} events</span>
                        </div>
                        <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                        </div>
                    </div>
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 border-l-2 border-transparent hover:border-orange-500 transition-all">
                                <span className="text-slate-500 select-none w-20">{log.timestamp}</span>
                                <span className={`font-bold w-16 uppercase ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                    {log.type}
                                </span>
                                <span className="text-slate-300">{log.message}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-slate-600 italic px-2">System initialized. Waiting for events...</span>}
                    </div>
                </div>
            </div >
        </>
    );
}


