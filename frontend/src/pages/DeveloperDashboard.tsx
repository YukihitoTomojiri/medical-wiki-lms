
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { User, UserCreateRequest } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { RestoreConfirmModal } from '../components/RestoreConfirmModal';
import AllUsersAdmin from './AllUsersAdmin';
import { PostRegisterModal } from '../components/PostRegisterModal';
import OrganizationManagement from '../components/OrganizationManagement';
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
    Search,
    Key,
    AlertTriangle,
    Clock,
    Server,
    Download,
    Upload,
    Trash2,
    Terminal,
    Plus,
    AlertCircle,
    FileDown,
    Building2,
    Calendar,
    ShieldAlert,
    Eye,
    CheckCircle2
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

    const [activeTab, setActiveTab] = useState<'system' | 'logs' | 'archive' | 'compliance' | 'organization'>('system');

    // Compliance Export States
    const [complianceFacilities, setComplianceFacilities] = useState<string[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [exporting, setExporting] = useState(false);

    // Data States
    const [userList, setUserList] = useState<User[]>([]);

    // Organization Master Data (from API)
    const [orgFacilities, setOrgFacilities] = useState<{ id: number, name: string }[]>([]);
    const [orgDepartments, setOrgDepartments] = useState<{ id: number, name: string, facilityId: number }[]>([]);


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
    const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
    const [alertStats, setAlertStats] = useState({ totalOpen: 0, criticalOpen: 0, alerts24h: 0 });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Active Nodes Filter States
    const [nodeSearchQuery, setNodeSearchQuery] = useState('');
    const [nodeStatusFilter, setNodeStatusFilter] = useState<'all' | 'UP' | 'DOWN' | 'WARNING'>('all');
    const [activeNodesFacilityFilter, setActiveNodesFacilityFilter] = useState<string>('all');
    const [nodeStatuses, setNodeStatuses] = useState<Map<number, {
        status: string;
        statusLabel: string;
        statusDetail?: string;
        isAlert?: boolean;
        healthMetrics?: any;
    }>>(new Map());

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
    const [registeredUser, setRegisteredUser] = useState<any>(null);
    const [showPostRegisterModal, setShowPostRegisterModal] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title?: string, defaultTab?: 'invite' | 'temp' }>({});

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

    const fetchSecurityAlerts = async () => {
        try {
            const [alerts, stats] = await Promise.all([
                api.getSecurityAlerts(1),
                api.getSecurityAlertStats(1)
            ]);
            setSecurityAlerts(alerts);
            setAlertStats(stats);
        } catch (e) { console.error(e); }
    };

    // Fetch node statuses from API
    const fetchNodeStatuses = async () => {
        try {
            const statuses = await api.getNodeStatuses();
            const statusMap = new Map();
            statuses.forEach((node: any) => {
                statusMap.set(node.userId, {
                    status: node.status,
                    statusLabel: node.statusLabel,
                    statusDetail: node.statusDetail,
                    isAlert: node.isAlert,
                    healthMetrics: node.healthMetrics
                });
            });
            setNodeStatuses(statusMap);
        } catch (e) { console.error('Failed to fetch node statuses:', e); }
    };

    // Polling interval for node statuses (every 5 seconds)
    useEffect(() => {
        fetchNodeStatuses(); // Initial fetch
        const pollInterval = setInterval(fetchNodeStatuses, 5000);
        return () => clearInterval(pollInterval);
    }, []);

    const handleAcknowledgeAlert = async (id: number) => {
        try {
            await api.acknowledgeSecurityAlert(1, id);
            addLog(`Alert ${id} acknowledged`, 'success');
            fetchSecurityAlerts();
        } catch (e) {
            addLog('Failed to acknowledge alert', 'error');
        }
    };

    const handleResolveAlert = async (id: number) => {
        try {
            await api.resolveSecurityAlert(1, id);
            addLog(`Alert ${id} resolved`, 'success');
            fetchSecurityAlerts();
        } catch (e) {
            addLog('Failed to resolve alert', 'error');
        }
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
                fetchSystemLogs(),
                fetchSecurityAlerts()
            ]);
            setUserList(usersData);
            // Load organization master for dropdowns
            try {
                const facs = await api.getFacilities();
                const depts = await api.getDepartments();
                setOrgFacilities(facs);
                setOrgDepartments(depts);
                // Auto-set initial register form values if data exists
                if (facs.length > 0) {
                    const firstFac = facs[0];
                    const firstDept = depts.find((d: any) => d.facilityId === firstFac.id);
                    setRegisterForm(prev => ({
                        ...prev,
                        facility: firstFac.name,
                        department: firstDept?.name || ''
                    }));
                }
            } catch (e) {
                console.error('Failed to load organization data', e);
            }
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
            department: user.department,
            email: user.email
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
                department: editForm.department,
                email: editForm.email
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

    // Dynamic Department Options based on Facility (from API) with deduplication
    const getDepartmentsForFacility = (facilityName?: string) => {
        if (!facilityName) return [];
        const fac = orgFacilities.find(f => f.name === facilityName);
        if (!fac) return [];
        const deptNames = orgDepartments.filter(d => d.facilityId === fac.id).map(d => d.name);
        // Deduplicate department names
        return Array.from(new Set(deptNames));
    };
    // Legacy alias for compatibility
    const getDepartments = getDepartmentsForFacility;

    // Filtered nodes based on search and status
    const filteredNodes = userList.filter(user => {
        // Search filter: facility name
        const matchesSearch = nodeSearchQuery === '' ||
            user.facility?.toLowerCase().includes(nodeSearchQuery.toLowerCase()) ||
            user.name?.toLowerCase().includes(nodeSearchQuery.toLowerCase()) ||
            user.department?.toLowerCase().includes(nodeSearchQuery.toLowerCase());

        // Status filter using API-provided status
        const userStatus = nodeStatuses.get(user.id)?.status || 'UP';
        const matchesStatus = nodeStatusFilter === 'all' || userStatus === nodeStatusFilter;

        // Facility filter
        const matchesFacility = activeNodesFacilityFilter === 'all' || user.facility === activeNodesFacilityFilter;

        return matchesSearch && matchesStatus && matchesFacility;
    });

    // Registration States
    const [registerForm, setRegisterForm] = useState({
        employeeId: '',
        name: '',
        password: '',
        facility: '本館',
        department: '3階病棟',
        role: 'USER' as const,
        email: ''
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
                setRegisteredUser(res);
                setModalConfig({}); // Default for new registration
                setShowPostRegisterModal(true);
                setRegisterForm({
                    employeeId: '',
                    name: '',
                    password: '',
                    facility: '本館',
                    department: '3階病棟',
                    role: 'USER',
                    email: ''
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

    const openResetModal = (user: User) => {
        setRegisteredUser(user);
        setModalConfig({
            title: 'User Access Control',
            defaultTab: 'temp'
        });
        setShowPostRegisterModal(true);
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
            <div className="space-y-4 pb-24 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between pt-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                            Developer Console
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-gray-500 font-medium text-xs flex items-center gap-2">
                                <Activity size={14} className="text-green-500" />
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
                <div className="flex p-1 bg-gray-100/50 rounded-xl w-fit mb-4 border border-gray-200/50 backdrop-blur-sm">
                    {['system', 'logs', 'archive', 'compliance', 'organization'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-5 py-2 rounded-lg text-xs font-black tracking-wide transition-all ${activeTab === tab
                                ? 'bg-white text-gray-800 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'system' ? 'System Stats' :
                                tab === 'logs' ? 'Audit Logs' :
                                    tab === 'archive' ? 'User Archive' :
                                        tab === 'compliance' ? 'Compliance Export' :
                                            '組織管理'}
                        </button>
                    ))}
                </div>

                {activeTab === 'system' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {/* DB Status */}
                            <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm transition-all ${stats.dbStatus === 'Connected'
                                ? 'bg-emerald-50 border-emerald-100'
                                : 'bg-red-50 border-red-100'
                                } `}>
                                <div className={`p-3 rounded-xl ${stats.dbStatus === 'Connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                    } `}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium opacity-70">データベース</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                                            } `} />
                                        <p className="font-bold text-lg">{stats.dbStatus === 'Connected' ? '接続中' : '切断'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Users Count */}
                            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">総ユーザー数</p>
                                    <p className="font-bold text-2xl text-gray-800">{userList.length}</p>
                                </div>
                            </div>

                            {/* Role Breakdown */}
                            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">権限内訳</p>
                                    <div className="flex flex-wrap gap-1 text-xs font-semibold mt-1">
                                        <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Dev:{computedStats.developers}</span>
                                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">Adm:{computedStats.admins}</span>
                                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">Usr:{computedStats.users}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Facilities */}
                            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">施設数</p>
                                    <p className="font-bold text-2xl text-gray-800">{computedStats.facilities}</p>
                                </div>
                            </div>

                            {/* 24h Alerts Widget */}
                            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${alertStats.alerts24h === 0 ? 'bg-emerald-100 text-emerald-600' :
                                    alertStats.alerts24h < 5 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">アラート (24時間)</p>
                                    <p className={`font-bold text-2xl ${alertStats.alerts24h === 0 ? 'text-emerald-600' :
                                        alertStats.alerts24h < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {alertStats.alerts24h}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Alerts Section */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-red-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 tracking-tight">
                                            Security Alerts
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">異常行動の検知とアラート管理</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {alertStats.criticalOpen > 0 && (
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black animate-pulse">
                                            {alertStats.criticalOpen} Critical
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black">
                                        {alertStats.totalOpen} Open
                                    </span>
                                    <button
                                        onClick={fetchSecurityAlerts}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                                    >
                                        <RefreshCw size={18} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                {securityAlerts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <ShieldAlert size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="font-medium">セキュリティアラートはありません</p>
                                        <p className="text-sm">システムは正常に稼働しています</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {securityAlerts.slice(0, 10).map((alert) => (
                                            <div
                                                key={alert.id}
                                                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${alert.status === 'RESOLVED'
                                                    ? 'bg-gray-50 border-gray-100 opacity-60'
                                                    : alert.severity === 'CRITICAL'
                                                        ? 'bg-red-50 border-red-200'
                                                        : alert.severity === 'HIGH'
                                                            ? 'bg-orange-50 border-orange-200'
                                                            : alert.severity === 'MEDIUM'
                                                                ? 'bg-yellow-50 border-yellow-200'
                                                                : 'bg-blue-50 border-blue-200'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-xl ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                    alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                        alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {alert.type === 'LATE_NIGHT_ACCESS' ? <Clock size={20} /> :
                                                        alert.type === 'RAPID_ACCESS' ? <AlertTriangle size={20} /> :
                                                            alert.type === 'MASS_DOWNLOAD' ? <FileDown size={20} /> :
                                                                <ShieldAlert size={20} />}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-sm text-gray-800">
                                                            {alert.typeDisplayName}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${alert.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                                                                alert.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                                                    'bg-blue-200 text-blue-800'
                                                            }`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${alert.status === 'OPEN' ? 'bg-red-100 text-red-600' :
                                                            alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-green-100 text-green-600'
                                                            }`}>
                                                            {alert.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {alert.description}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                                        <span>{alert.userName || alert.userEmployeeId || 'Unknown'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(alert.detectedAt).toLocaleString('ja-JP')}</span>
                                                        {alert.ipAddress && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{alert.ipAddress}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {alert.status !== 'RESOLVED' && (
                                                    <div className="flex gap-2">
                                                        {alert.status === 'OPEN' && (
                                                            <button
                                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                                                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-yellow-600"
                                                                title="Acknowledge"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleResolveAlert(alert.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-green-600"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* User Registration Section */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                            <Plus className="text-emerald-500" size={24} />
                                            User Registration
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">Add individual users or upload batch data</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 cursor-pointer active:scale-95">
                                            <Upload size={16} />
                                            Upload CSV
                                            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {csvError && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                                            <div className="flex-grow">
                                                <p className="text-sm font-black text-red-800">処理エラーが発生しました</p>
                                                <p className="text-xs text-red-600 mt-1 whitespace-pre-line font-medium leading-relaxed">
                                                    {csvError}
                                                </p>
                                            </div>
                                            <button onClick={() => setCsvError(null)} className="ml-0.5 text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-lg transition-colors">
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">ID</label>
                                            <input
                                                type="text"
                                                placeholder="dev-001"
                                                value={registerForm.employeeId}
                                                onChange={e => setRegisterForm({ ...registerForm, employeeId: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Identity Name</label>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={registerForm.name}
                                                onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                            <input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={registerForm.email}
                                                onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Facility</label>
                                            <select
                                                value={registerForm.facility}
                                                onChange={e => setRegisterForm({ ...registerForm, facility: e.target.value, department: getDepartments(e.target.value)[0] || '' })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                {orgFacilities.length === 0 && (
                                                    <option value="">施設を登録してください</option>
                                                )}
                                                {orgFacilities.map(f => (
                                                    <option key={f.id} value={f.name}>{f.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                                            <select
                                                value={registerForm.department}
                                                onChange={e => setRegisterForm({ ...registerForm, department: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                {getDepartments(registerForm.facility).map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                                            <select
                                                value={registerForm.role}
                                                onChange={e => setRegisterForm({ ...registerForm, role: e.target.value as any })}
                                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="DEVELOPER">DEVELOPER</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 flex items-end">
                                            <button
                                                onClick={handleSingleRegister}
                                                className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all font-black text-xs tracking-widest active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <Check size={16} />
                                                REGISTER
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Management Section */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-800 tracking-tight">Active Nodes Control</h3>
                                        <p className="text-xs text-gray-500 font-medium">Control access and user privileges</p>
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

                                {/* Main Content Area with Fixed Height and Scroll */}
                                <div className="h-[70vh] flex flex-col">
                                    {/* Filtering Section - Sticky / Fixed part */}
                                    <div className="flex-none px-5 py-3 bg-gray-50/30 border-b border-gray-100 flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-orange-50 text-orange-600 rounded-md">
                                                <Search size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FILTERING</span>
                                        </div>

                                        <div className="flex-1 flex gap-4 items-center">
                                            {/* Search Input */}
                                            <div className="flex-1 relative max-w-sm">
                                                <input
                                                    type="text"
                                                    value={nodeSearchQuery}
                                                    onChange={(e) => setNodeSearchQuery(e.target.value)}
                                                    placeholder="検索..."
                                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                />
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            </div>

                                            {/* Filters Group */}
                                            <div className="flex items-center gap-2">
                                                {/* Facility Filter */}
                                                <select
                                                    value={activeNodesFacilityFilter}
                                                    onChange={(e) => setActiveNodesFacilityFilter(e.target.value)}
                                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none cursor-pointer transition-all"
                                                >
                                                    <option value="all">全施設</option>
                                                    {orgFacilities.map(f => (
                                                        <option key={f.id} value={f.name}>{f.name}</option>
                                                    ))}
                                                </select>

                                                {/* Status Filter */}
                                                <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
                                                    {[
                                                        { key: 'all', label: 'All', color: 'bg-gray-600' },
                                                        { key: 'UP', label: 'UP', color: 'bg-green-500' },
                                                        { key: 'DOWN', label: 'DOWN', color: 'bg-gray-400' },
                                                        { key: 'WARNING', label: 'WARN', color: 'bg-yellow-500' }
                                                    ].map(({ key, label, color }) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => setNodeStatusFilter(key as 'all' | 'UP' | 'DOWN' | 'WARNING')}
                                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${nodeStatusFilter === key
                                                                ? `${color} text-white shadow-sm`
                                                                : 'text-gray-400 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scrollable Table Area */}
                                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent p-0">
                                        <table className="w-full text-left border-collapse relative">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="border-b border-gray-100 shadow-sm shadow-gray-100/50">
                                                    <th className="px-6 py-4 w-10 bg-white/95 backdrop-blur-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.length === userList.length && userList.length > 0}
                                                            onChange={toggleSelectAll}
                                                            className="w-4 h-4 rounded-md border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/95 backdrop-blur-sm">IDENTITY NAME</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/95 backdrop-blur-sm">ID (EMP)</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/95 backdrop-blur-sm">FACILITY / DEPARTMENT</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/95 backdrop-blur-sm">STATUS</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/95 backdrop-blur-sm">ROLE</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right bg-white/95 backdrop-blur-sm">ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredNodes.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className="px-4 py-16 text-center">
                                                            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                </svg>
                                                                <p className="text-gray-400 font-medium">該当するノードが見つかりません</p>
                                                                <button
                                                                    onClick={() => { setNodeSearchQuery(''); setNodeStatusFilter('all'); }}
                                                                    className="text-xs text-orange-500 hover:text-orange-600 font-bold"
                                                                >
                                                                    フィルタをクリア
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredNodes.map(user => {
                                                    const isEditing = editingUserId === user.id;
                                                    const isSelected = selectedUsers.includes(user.id);
                                                    return (
                                                        <tr key={user.id} className={`transition-all group animate-in fade-in slide-in-from-bottom-2 duration-200 ${isEditing ? 'bg-orange-50/50' : (isSelected ? 'bg-blue-50/30' : 'hover:bg-gray-50/80')} `}>
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
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-gray-800 tracking-tight">{user.name}</span>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="email"
                                                                            value={editForm.email || ''}
                                                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                                            className="mt-1 w-full p-1 border border-orange-200 rounded text-xs bg-white focus:border-orange-500 outline-none"
                                                                            placeholder="Email"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-400 font-mono">{user.email || 'No Email'}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-mono text-gray-400 font-bold">{user.employeeId}</td>

                                                            {/* Facility/Dept */}
                                                            <td className="px-6 py-4">
                                                                {isEditing ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <select
                                                                            value={editForm.facility}
                                                                            onChange={e => setEditForm({ ...editForm, facility: e.target.value, department: getDepartments(e.target.value)[0] || '' })}
                                                                            className="p-1 border border-orange-200 rounded text-xs"
                                                                        >
                                                                            {orgFacilities.map(f => (
                                                                                <option key={f.id} value={f.name}>{f.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <select
                                                                            value={editForm.department}
                                                                            onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                                            className="p-1 border border-orange-200 rounded text-xs"
                                                                        >
                                                                            {getDepartments(editForm.facility).map(dept => (
                                                                                <option key={dept} value={dept}>{dept}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-xs font-bold text-gray-600 truncate max-w-[140px]" title={user.facility}>{user.facility}</span>
                                                                        <span className="text-[10px] text-gray-400">{user.department}</span>
                                                                    </div>
                                                                )}
                                                            </td>

                                                            {/* Status */}
                                                            <td className="px-6 py-4">
                                                                {(() => {
                                                                    const statusInfo = nodeStatuses.get(user.id);
                                                                    const status = statusInfo?.status || 'UP';
                                                                    const label = status === 'UP' ? '稼働中' : status === 'DOWN' ? '停止中' : '警告';

                                                                    let colorClass = 'bg-emerald-500 text-white shadow-emerald-200';
                                                                    if (status === 'DOWN') colorClass = 'bg-gray-400 text-white shadow-gray-200';
                                                                    if (status === 'WARNING') colorClass = 'bg-amber-400 text-white shadow-amber-200';

                                                                    return (
                                                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-sm ${colorClass}`}>
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </td>

                                                            {/* Role */}
                                                            <td className="px-6 py-4">
                                                                {isEditing ? (
                                                                    <select
                                                                        value={editForm.role}
                                                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as any })}
                                                                        className="p-1 border rounded text-xs"
                                                                    >
                                                                        <option value="USER">USER</option>
                                                                        <option value="ADMIN">ADMIN</option>
                                                                        <option value="DEVELOPER">DEVELOPER</option>
                                                                    </select>
                                                                ) : (
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'DEVELOPER' ? 'text-purple-600' :
                                                                        user.role === 'ADMIN' ? 'text-red-500' :
                                                                            'text-gray-400'
                                                                        }`}>
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
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => openResetModal(user)}
                                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-black tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                                                                            title="Reset Password"
                                                                        >
                                                                            <Key size={14} />
                                                                            RESET
                                                                        </button>
                                                                        <button
                                                                            onClick={() => startEdit(user)}
                                                                            className="flex items-center gap-2 px-4 py-2 text-xs font-black tracking-widest text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                            EDIT
                                                                        </button>
                                                                    </div>
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
                ) : activeTab === 'compliance' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                        {/* Header */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <FileDown className="text-blue-600" size={24} />
                                <h2 className="text-xl font-black text-gray-800">Compliance Export</h2>
                            </div>
                            <p className="text-sm text-gray-500">
                                施設・期間を選択して、学習進捗データをCSV/PDF形式でエクスポートします。
                            </p>
                        </div>

                        {/* Filter Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Building2 size={16} />
                                フィルター設定
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Facility Dropdown */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">施設</label>
                                    <select
                                        value={selectedFacility}
                                        onChange={(e) => setSelectedFacility(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">全施設</option>
                                        {complianceFacilities.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                                        <Calendar size={12} />
                                        開始日
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                                        <Calendar size={12} />
                                        終了日
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">エクスポート</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={async () => {
                                        setExporting(true);
                                        try {
                                            const blob = await api.exportComplianceCsv(1, selectedFacility, startDate, endDate);
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.style.display = 'none';
                                            a.href = url;
                                            const filename = `compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            window.URL.revokeObjectURL(url);
                                            addLog('CSV exported successfully', 'success');
                                        } catch (e) {
                                            console.error(e);
                                            addLog('CSV export failed', 'error');
                                        } finally {
                                            setExporting(false);
                                        }
                                    }}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    <FileDown size={18} />
                                    {exporting ? 'Exporting...' : 'CSV ダウンロード'}
                                </button>

                                <button
                                    onClick={async () => {
                                        setExporting(true);
                                        try {
                                            const blob = await api.exportCompliancePdf(1, selectedFacility, startDate, endDate);
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.style.display = 'none';
                                            a.href = url;
                                            const filename = `compliance_report_${new Date().toISOString().split('T')[0]}.pdf`;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            window.URL.revokeObjectURL(url);
                                            addLog('PDF exported successfully', 'success');
                                        } catch (e) {
                                            console.error(e);
                                            addLog('PDF export failed', 'error');
                                        } finally {
                                            setExporting(false);
                                        }
                                    }}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    <FileText size={18} />
                                    {exporting ? 'Exporting...' : 'PDF ダウンロード'}
                                </button>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">エクスポート内容</p>
                                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                                        <li>CSV: ユーザー × マニュアル進捗マトリクス（Excel対応）</li>
                                        <li>PDF: サマリーレポート（完了率統計、ユーザー一覧）</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'organization' ? (
                    <OrganizationManagement />
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <AllUsersAdmin />
                    </div>
                )
                }


                {/* System Log Footer with Integrated Diagnostics */}
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-300 border-t border-slate-700 shadow-2xl transition-transform duration-300 ease-out transform translate-y-[calc(100%-88px)] hover:translate-y-0 z-50 backdrop-blur-sm">
                    {/* Diagnostics Bar - Always visible */}
                    <div className="bg-slate-900/95 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* System Status */}
                            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                                <div className={`w-2 h-2 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${stats.dbStatus === 'Connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {stats.dbStatus === 'Connected' ? 'Operational' : 'Degraded'}
                                </span>
                            </div>

                            {/* DB Latency */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                                <Database size={12} className="text-slate-500" />
                                <span className={`text-[10px] font-bold ${diagnostics.dbPing < 50 ? 'text-emerald-400' : diagnostics.dbPing < 100 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {diagnostics.dbPing}ms
                                </span>
                            </div>

                            {/* Uptime */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                                <Activity size={12} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-orange-400">
                                    {Math.floor(diagnostics.uptime / 3600000)}h {Math.floor((diagnostics.uptime % 3600000) / 60000)}m
                                </span>
                            </div>

                            {/* Memory Usage */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                                <Shield size={12} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-blue-400">
                                    {Math.round(diagnostics.memoryUsed / 1024 / 1024)}
                                </span>
                                <span className="text-[9px] text-slate-500">/ {Math.round(diagnostics.memoryTotal / 1024 / 1024)} MB</span>
                            </div>

                            {/* Node Name */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[9px] font-black uppercase tracking-widest border border-orange-500/30">
                                    medical-wiki-backend
                                </span>
                            </div>

                            {/* Soft-deleted Users Count */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500">🗑️</span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {userList.filter(u => u.deletedAt).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Console Header */}
                    <div className="bg-slate-800/95 px-4 py-2 flex items-center justify-between cursor-pointer group">
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

                    {/* Log Entries */}
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 border-l-2 border-transparent hover:border-orange-500 transition-all items-center">
                                {/* Environment Badge */}
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded text-[8px] font-bold uppercase tracking-wider border border-slate-700 flex-shrink-0">
                                    ENV
                                </span>
                                <span className="text-slate-500 select-none w-20 flex-shrink-0">{log.timestamp}</span>
                                <span className={`font-bold w-16 uppercase flex-shrink-0 ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                    {log.type}
                                </span>
                                <span className="text-slate-300 truncate">{log.message}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-slate-600 italic px-2">System initialized. Waiting for events...</span>}
                    </div>
                </div>
            </div >
            {showPostRegisterModal && registeredUser && (
                <PostRegisterModal
                    user={registeredUser}
                    onClose={() => setShowPostRegisterModal(false)}
                    title={modalConfig.title}
                    defaultTab={modalConfig.defaultTab}
                />
            )
            }
        </>
    );
}


