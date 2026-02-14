import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { User, UserCreateRequest } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { RestoreConfirmModal } from '../components/RestoreConfirmModal';
import { PostRegisterModal } from '../components/PostRegisterModal';
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
    Terminal,
    AlertCircle,
    FileDown,
    Building2,
    Calendar,
    ShieldAlert,
    Eye,
    CheckCircle2,
    Cpu,
    HardDrive
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import PageHeader from '../components/layout/PageHeader';



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

    const [activeTab, setActiveTab] = useState<'stats' | 'nodes' | 'export' | 'audit'>('stats');

    // Compliance Export States
    const [complianceFacilities, setComplianceFacilities] = useState<string[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [exporting, setExporting] = useState(false);

    // Data States
    const [userList, setUserList] = useState<User[]>([]);

    // Get current user
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('medical_wiki_user') || '{}');
        } catch (e) {
            return {};
        }
    }, []);

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
    const [resources, setResources] = useState({
        uptime: 0,
        memoryUsed: 0,
        memoryMax: 0,
        memoryPercent: 0,
        diskUsed: 0,
        diskTotal: 0,
        diskPercent: 0,
        diskFree: 0,
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
            setActiveTab('stats');
        }
    }, [location.pathname]);

    // Restore / Bulk Register States (used by AllUsersAdmin restore flow)
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [restorableUsers, setRestorableUsers] = useState<User[]>([]);
    const [_pendingCsvData, setPendingCsvData] = useState<UserCreateRequest[]>([]);
    const [_isRegistering, _setIsRegistering] = useState(false);
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
            setResources(prev => ({ ...prev, ...data }));
        } catch (e) { console.error(e); }
    };

    const fetchSystemResources = async () => {
        try {
            const data = await api.getSystemResources(1);
            if (data) setResources(prev => ({ ...prev, ...data }));
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

    // Fetch compliance facilities when tab is switched to compliance
    const fetchComplianceFacilities = async () => {
        try {
            const data = await api.getComplianceFacilities(1);
            setComplianceFacilities(data);
        } catch (e) {
            console.error('Failed to fetch compliance facilities:', e);
        }
    };

    useEffect(() => {
        if (activeTab === 'export') {
            fetchComplianceFacilities();
        }
    }, [activeTab]);

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
                fetchSystemResources(),
                fetchSystemLogs(),
                fetchSecurityAlerts()
            ]);
            setUserList(usersData);
            // Load organization master for dropdowns
            try {
                // Ensure userId is available before calling
                if (user?.id) {
                    const facs = await api.getFacilities(user.id);
                    const depts = await api.getDepartments(user.id);
                    setOrgFacilities(facs);
                    setOrgDepartments(depts);
                }
                // Organization master loaded for remaining dropdowns
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
            email: user.email,
            paidLeaveDays: user.paidLeaveDays,
            joinedDate: user.joinedDate
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
                email: editForm.email,
                paidLeaveDays: editForm.paidLeaveDays,
                joinedDate: editForm.joinedDate
            });
            addLog(`User updated successfully: ID:${id}`, 'success');
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

    // Note: User registration functions moved to AdminUserManagement

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
                onConfirm={() => {
                    // Registration moved to AdminUserManagement
                    setShowRestoreModal(false);
                    setRestorableUsers([]);
                }}
                onCancel={() => {
                    setShowRestoreModal(false);
                    setPendingCsvData([]);
                    setRestorableUsers([]);
                }}
                isLoading={false}
            />
            <div className="space-y-6 pb-80 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <PageHeader
                    title="開発者ダッシュボード"
                    icon={Activity}
                    subtitle={
                        <div className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                システム v{stats.version} 稼働中
                            </span>
                            <span className="text-orange-800/60 flex items-center gap-2 border-l border-orange-200 pl-4">
                                <RefreshCw size={12} />
                                最終同期: {lastSync}
                            </span>
                        </div>
                    }
                >
                    <Button
                        variant="outlined"
                        onClick={fetchData}
                        icon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                        className="bg-white border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                        更新
                    </Button>
                </PageHeader>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-m3-surface-container-high rounded-full w-fit mb-4">
                    {['stats', 'nodes', 'export', 'audit'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-m3-secondary-container text-m3-on-secondary-container shadow-sm'
                                : 'text-m3-on-surface-variant hover:text-m3-on-surface hover:bg-m3-on-surface/5'}`}
                        >
                            {tab === 'stats' ? 'システム統計' :
                                tab === 'nodes' ? '稼働状況' :
                                    tab === 'export' ? 'レポート出力' :
                                        '操作履歴'}
                        </button>
                    ))}
                </div>

                {activeTab === 'stats' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* DB Status */}
                            <Card variant="filled" className={`p-4 flex items-center gap-4 ${stats.dbStatus === 'Connected' ? 'bg-emerald-50' : 'bg-m3-error-container'}`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.dbStatus === 'Connected' ? 'bg-emerald-100 text-emerald-600' : 'bg-m3-error text-m3-on-error'}`}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold opacity-70 mb-1">データベース</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-m3-on-error-container'}`} />
                                        <p className="font-bold text-lg leading-none">{stats.dbStatus === 'Connected' ? '接続中' : '切断'}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Users Count */}
                            <Card variant="elevated" className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-m3-on-surface-variant font-bold mb-1">総ユーザー数</p>
                                    <p className="font-bold text-2xl text-m3-on-surface leading-none">{userList.length}</p>
                                </div>
                            </Card>

                            {/* Role Breakdown */}
                            <Card variant="elevated" className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-m3-on-surface-variant font-bold mb-1">権限内訳</p>
                                    <div className="flex gap-1 text-[10px] font-black">
                                        <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Dev:{computedStats.developers}</span>
                                        <span className="text-m3-error bg-red-50 px-1.5 py-0.5 rounded">Adm:{computedStats.admins}</span>
                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Usr:{computedStats.users}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Facilities */}
                            <Card variant="elevated" className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-m3-on-surface-variant font-bold mb-1">施設数</p>
                                    <p className="font-bold text-2xl text-m3-on-surface leading-none">{computedStats.facilities}</p>
                                </div>
                            </Card>

                            {/* 24h Alerts Widget */}
                            <Card variant="elevated" className="p-4 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alertStats.alerts24h === 0 ? 'bg-emerald-100 text-emerald-600' :
                                    alertStats.alerts24h < 5 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-m3-on-surface-variant font-bold mb-1">アラート (24h)</p>
                                    <p className={`font-bold text-2xl leading-none ${alertStats.alerts24h === 0 ? 'text-emerald-600' :
                                        alertStats.alerts24h < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {alertStats.alerts24h}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* Resource Monitoring Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Memory Usage */}
                            <Card variant="outlined" className="p-5 flex flex-col justify-between h-full bg-m3-surface">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Cpu size={18} />
                                        </div>
                                        <h4 className="font-bold text-m3-on-surface text-sm">メモリ使用率</h4>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resources.memoryPercent > 90 ? 'bg-m3-error-container text-m3-on-error-container' : resources.memoryPercent > 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {resources.memoryPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-m3-surface-container-highest rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${resources.memoryPercent > 90 ? 'bg-m3-error' : resources.memoryPercent > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                        style={{ width: `${resources.memoryPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-m3-outline uppercase tracking-widest">
                                    <span>{(resources.memoryUsed / 1024 / 1024).toFixed(0)} MB / {(resources.memoryMax / 1024 / 1024).toFixed(0)} MB</span>
                                    <span>Allocated JVM Heap</span>
                                </div>
                            </Card>

                            {/* Disk Usage */}
                            <Card variant="outlined" className="p-5 flex flex-col justify-between h-full bg-m3-surface">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <HardDrive size={18} />
                                        </div>
                                        <h4 className="font-bold text-m3-on-surface text-sm">ディスク使用量</h4>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resources.diskPercent > 90 ? 'bg-m3-error-container text-m3-on-error-container' : resources.diskPercent > 80 ? 'bg-yellow-100 text-yellow-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {resources.diskPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-m3-surface-container-highest rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${resources.diskPercent > 90 ? 'bg-m3-error' : resources.diskPercent > 80 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                        style={{ width: `${resources.diskPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-m3-outline uppercase tracking-widest">
                                    <span>{(resources.diskUsed / 1024 / 1024 / 1024).toFixed(1)} GB / {(resources.diskTotal / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                                    <span>System Storage</span>
                                </div>
                            </Card>
                        </div>

                        {/* Security Alerts Section */}
                        <Card variant="outlined" className="bg-m3-surface rounded-2xl border-m3-outline-variant shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-m3-outline-variant flex items-center justify-between bg-m3-error-container/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-m3-error-container text-m3-on-error-container rounded-xl">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-m3-on-surface tracking-tight">セキュリティアラート</h3>
                                        <p className="text-xs text-m3-on-surface-variant font-medium">システムの異常行動をリアルタイムで監視・報告します</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {alertStats.criticalOpen > 0 && (
                                        <span className="px-3 py-1 bg-m3-error text-m3-on-error rounded-full text-xs font-bold animate-pulse">
                                            {alertStats.criticalOpen} Critical
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-m3-error-container text-m3-on-error-container text-[10px] font-bold uppercase tracking-widest rounded-lg border border-m3-error/20">
                                        <AlertTriangle size={12} />
                                        {alertStats.totalOpen} 件の未解決
                                    </span>
                                    <Button
                                        variant="text"
                                        onClick={fetchSecurityAlerts}
                                        icon={<RefreshCw size={18} />}
                                    />
                                </div>
                            </div>

                            <div className="p-4">
                                {securityAlerts.length === 0 ? (
                                    <div className="text-center py-12 text-m3-on-surface-variant/50">
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
                                                    ? 'bg-m3-surface-container-low border-m3-outline-variant opacity-60'
                                                    : alert.severity === 'CRITICAL'
                                                        ? 'bg-m3-error-container border-m3-error'
                                                        : alert.severity === 'HIGH'
                                                            ? 'bg-orange-50 border-orange-200'
                                                            : alert.severity === 'MEDIUM'
                                                                ? 'bg-yellow-50 border-yellow-200'
                                                                : 'bg-blue-50 border-blue-200'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-xl ${alert.severity === 'CRITICAL' ? 'bg-m3-error text-m3-on-error' :
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
                                                        <span className="font-bold text-sm text-m3-on-surface">
                                                            {alert.typeDisplayName}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.severity === 'CRITICAL' ? 'bg-m3-error text-m3-on-error' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-200 text-orange-800' :
                                                                alert.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                                                    'bg-blue-200 text-blue-800'
                                                            }`}>
                                                            {alert.severity}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${alert.status === 'OPEN' ? 'bg-m3-error-container text-m3-on-error-container' :
                                                            alert.status === 'ACKNOWLEDGED' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-emerald-100 text-emerald-600'
                                                            }`}>
                                                            {alert.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-m3-on-surface-variant mt-1">
                                                        {alert.description}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-m3-outline">
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
                                                            <Button
                                                                variant="text"
                                                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                                                className="text-m3-outline hover:text-yellow-600"
                                                                title="Acknowledge"
                                                            >
                                                                <Eye size={16} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="text"
                                                            onClick={() => handleResolveAlert(alert.id)}
                                                            className="text-m3-outline hover:text-emerald-600"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Main Content Area */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Removed: User Registration Section - now managed in AdminUserManagement */}
                        </div>
                    </div>
                ) : activeTab === 'nodes' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                        {/* User Management Section (Active Nodes Control) */}
                        <Card variant="outlined" className="bg-m3-surface rounded-2xl border-m3-outline-variant shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-m3-outline-variant flex items-center justify-between bg-m3-surface-container-high">
                                <div>
                                    <h3 className="text-lg font-bold text-m3-on-surface tracking-tight">稼働ノード管理</h3>
                                    <p className="text-xs text-m3-on-surface-variant font-medium">アクセス制御とユーザー権限の管理</p>
                                </div>

                                {/* Bulk Action Menu */}
                                {selectedUsers.length > 0 && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <span className="text-xs font-bold text-m3-on-secondary-container px-3 py-1 bg-m3-secondary-container rounded-full border border-m3-secondary-container">
                                            {selectedUsers.length} 件選択中
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="filled"
                                                size="sm"
                                                onClick={handleBulkReset}
                                            >
                                                進捗リセット
                                            </Button>
                                            <Button
                                                variant="filled"
                                                size="sm"
                                                onClick={openDeleteModal}
                                                className="bg-m3-error text-m3-on-error hover:bg-m3-error/80"
                                            >
                                                削除
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectedUsers.length === 0 && (
                                    <div className="px-5 py-2 bg-m3-surface border border-m3-outline-variant rounded-full text-[10px] font-bold text-m3-on-surface-variant shadow-sm uppercase tracking-widest">
                                        {userList.length} 件登録済み
                                    </div>
                                )}
                            </div>

                            <div className="h-[70vh] flex flex-col">
                                <div className="flex-none px-5 py-3 bg-m3-surface-container-high border-b border-m3-outline-variant flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-m3-secondary-container text-m3-on-secondary-container rounded-md">
                                            <Search size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="施設、名前、部署で検索..."
                                            value={nodeSearchQuery}
                                            onChange={(e) => setNodeSearchQuery(e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs font-bold text-m3-on-surface w-48 placeholder:text-m3-on-surface-variant/50"
                                        />
                                    </div>
                                    <div className="h-4 w-px bg-m3-outline-variant" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-widest">Status:</span>
                                        <div className="flex p-0.5 bg-m3-surface-container rounded-lg">
                                            {(['all', 'UP', 'WARNING', 'DOWN'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setNodeStatusFilter(s)}
                                                    className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${nodeStatusFilter === s ? 'bg-m3-surface text-m3-primary shadow-sm' : 'text-m3-on-surface-variant hover:text-m3-on-surface'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-4 w-px bg-m3-outline-variant" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-widest">Facility:</span>
                                        <select
                                            value={activeNodesFacilityFilter}
                                            onChange={(e) => setActiveNodesFacilityFilter(e.target.value)}
                                            className="bg-transparent border-none outline-none text-[10px] font-bold text-m3-on-surface cursor-pointer hover:text-m3-primary transition-colors"
                                        >
                                            <option value="all">ALL FACILITIES</option>
                                            {Array.from(new Set(userList.map(u => u.facility))).filter(Boolean).sort().map(fac => (
                                                <option key={fac} value={fac}>{fac?.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-none bg-white border-b border-gray-100">
                                    <table className="w-full table-fixed">
                                        <thead>
                                            <tr className="text-left border-b border-gray-100 bg-gray-50/50">
                                                <th className="w-12 px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.length === userList.length && userList.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Node ID / Name</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest w-48">Leave Info</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Facility / Dept</th>
                                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    <table className="w-full table-fixed">
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredNodes.map((user) => {
                                                const nodeInfo = nodeStatuses.get(user.id);
                                                const isEditing = editingUserId === user.id;
                                                return (
                                                    <tr key={user.id} className={`group hover:bg-orange-50/30 transition-all ${selectedUsers.includes(user.id) ? 'bg-orange-50/50' : ''}`}>
                                                        <td className="w-12 px-4 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.includes(user.id)}
                                                                onChange={() => toggleSelectUser(user.id)}
                                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-mono font-black text-gray-400 uppercase tracking-tighter">#{user.employeeId}</span>
                                                                <span className="text-sm font-bold text-gray-800">{user.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 w-40">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${nodeInfo?.status === 'UP' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                                    nodeInfo?.status === 'WARNING' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                                        nodeInfo?.status === 'DOWN' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                                            'bg-gray-300'
                                                                    }`} />
                                                                <span className={`text-[10px] font-black tracking-widest border px-2 py-0.5 rounded uppercase ${nodeInfo?.status === 'UP' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                                                    nodeInfo?.status === 'WARNING' ? 'text-yellow-700 bg-yellow-50 border-yellow-100' :
                                                                        nodeInfo?.status === 'DOWN' ? 'text-red-700 bg-red-50 border-red-100' :
                                                                            'text-gray-500 bg-gray-50 border-gray-100'
                                                                    }`}>
                                                                    {nodeInfo?.status || 'UP'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 w-48">
                                                            {isEditing ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Joined</span>
                                                                        <input
                                                                            type="date"
                                                                            value={editForm.joinedDate || ''}
                                                                            onChange={e => setEditForm({ ...editForm, joinedDate: e.target.value })}
                                                                            className="text-[10px] p-1 rounded border border-gray-200"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase">Leave Bal</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.5"
                                                                            min="0"
                                                                            value={editForm.paidLeaveDays || 0}
                                                                            onChange={e => setEditForm({ ...editForm, paidLeaveDays: parseFloat(e.target.value) || 0 })}
                                                                            className="text-[10px] p-1 rounded border border-gray-200"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar size={10} className="text-gray-400" />
                                                                        <span className="text-[10px] font-bold text-gray-600">{user.joinedDate || '未設定'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <Clock size={10} className="text-orange-400" />
                                                                        <span className="text-[11px] font-black text-orange-600">{user.paidLeaveDays ?? 0} <span className="text-[8px] font-bold">days</span></span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            {isEditing ? (
                                                                <div className="space-y-1">
                                                                    <select
                                                                        value={editForm.facility}
                                                                        onChange={e => setEditForm({ ...editForm, facility: e.target.value, department: getDepartments(e.target.value)[0] || '' })}
                                                                        className="w-full text-xs p-1 rounded border border-gray-200"
                                                                    >
                                                                        {orgFacilities.map(f => (
                                                                            <option key={f.id} value={f.name}>{f.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        value={editForm.department}
                                                                        onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                                        className="w-full text-xs p-1 rounded border border-gray-200"
                                                                    >
                                                                        {getDepartments(editForm.facility).map(dept => (
                                                                            <option key={dept} value={dept}>{dept}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest">{user.facility}</span>
                                                                    <span className="text-xs font-bold text-gray-500">{user.department}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {isEditing ? (
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={cancelEdit}
                                                                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-red-600"
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
                        </Card>
                    </div>
                ) : activeTab === 'audit' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Audit Logs View */}
                        <Card variant="filled" className="bg-m3-surface-container-high rounded-[28px] overflow-hidden mb-12 border-none">
                            <div className="p-6 border-b border-m3-outline-variant flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-m3-on-surface tracking-tight flex items-center gap-3">
                                        <Activity className="text-m3-primary" />
                                        操作履歴 (JST)
                                    </h3>
                                    <p className="text-sm text-m3-on-surface-variant font-medium">システムの全操作に対する変更不可能な証跡</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-m3-secondary-container rounded-full border border-m3-outline-variant text-[10px] font-bold text-m3-on-secondary-container uppercase tracking-widest">
                                        <Shield size={14} className="text-m3-primary" />
                                        保護されたログ
                                    </div>
                                    <Button
                                        variant="outlined"
                                        onClick={fetchSystemLogs}
                                        icon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                                    />
                                </div>
                            </div>
                            <div className="h-[600px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-m3-outline scrollbar-track-m3-surface-container">
                                <div className="space-y-4 max-w-5xl mx-auto py-4">
                                    {Array.isArray(systemLogs) && systemLogs.map((log) => (
                                        <div key={log.id} className="group relative flex items-start gap-6 p-5 rounded-2xl hover:bg-m3-on-surface/5 transition-all duration-300">
                                            {/* Timeline indicator */}
                                            <div className="absolute left-[111px] top-0 bottom-0 w-px bg-m3-outline-variant group-hover:bg-m3-primary/50 transition-colors" />

                                            <div className="flex-shrink-0 w-24 pt-1 relative z-10 bg-m3-surface-container-high pr-4">
                                                <p className="text-[11px] font-bold text-m3-on-surface-variant font-mono tracking-tighter">
                                                    {log.timestamp.split(' ')[1]}
                                                </p>
                                                <p className="text-[9px] font-bold text-m3-outline mt-1 uppercase tracking-widest">
                                                    {log.timestamp.split(' ')[0]}
                                                </p>
                                            </div>

                                            <div className="relative z-10 flex-shrink-0 mt-1.5">
                                                <div className="w-3 h-3 rounded-full bg-m3-surface-container-high border-2 border-m3-outline group-hover:bg-m3-primary group-hover:border-m3-primary transition-all" />
                                            </div>

                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                                                        log.action === 'USER_UPDATE' ? 'bg-amber-100 text-amber-700' :
                                                            log.action === 'USER_DELETE' ? 'bg-red-100 text-red-700' :
                                                                log.action.includes('BULK') ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="text-sm font-bold text-m3-on-surface truncate">{log.target}</span>
                                                </div>
                                                <p className="text-xs text-m3-on-surface-variant mt-2 font-medium leading-relaxed">
                                                    {log.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-m3-surface-container rounded-lg border border-m3-outline-variant">
                                                        <Users size={12} className="text-m3-outline" />
                                                        <span className="text-[10px] font-bold text-m3-outline">{log.performedBy}</span>
                                                    </div>
                                                    {log.ipAddress && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-m3-surface-container rounded-lg border border-m3-outline-variant">
                                                            <Terminal size={12} className="text-m3-outline" />
                                                            <span className="text-[10px] font-mono text-m3-outline">{log.ipAddress}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {systemLogs.length === 0 && (
                                        <div className="text-center py-20 px-4">
                                            <div className="w-20 h-20 bg-m3-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Shield size={40} className="text-m3-outline" />
                                            </div>
                                            <p className="text-m3-outline font-bold uppercase tracking-[.2em] text-xs">監査履歴が見つかりません</p>
                                            <p className="text-m3-outline-variant text-[10px] mt-2 font-medium">システムの操作ログがここに表示されます</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : activeTab === 'export' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                        {/* Header */}
                        <Card variant="filled" className="rounded-2xl border-m3-outline-variant p-4 shadow-sm relative overflow-hidden bg-m3-surface-container-high">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-m3-primary-container text-m3-on-primary-container rounded-xl">
                                    <FileDown size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-m3-on-surface tracking-tight">レポート出力（コンプライアンス）</h2>
                                    <p className="text-xs text-m3-on-surface-variant font-medium">
                                        施設・期間を選択して、学習進捗データをCSV形式でエクスポートします。
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Filter Section */}
                        <Card variant="outlined" className="bg-m3-surface rounded-2xl border-m3-outline-variant p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Building2 size={14} />
                                フィルター設定
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Facility Dropdown */}
                                <div>
                                    <label className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1.5">施設</label>
                                    <select
                                        value={selectedFacility}
                                        onChange={(e) => setSelectedFacility(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-m3-outline bg-m3-surface text-xs font-bold text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:border-m3-primary outline-none transition-all cursor-pointer"
                                    >
                                        <option value="all">全施設</option>
                                        {complianceFacilities.map(f => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Start Date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar size={12} />
                                        開始日
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-m3-outline bg-m3-surface text-xs font-bold text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:border-m3-primary outline-none transition-all"
                                    />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="block text-[10px] font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar size={12} />
                                        終了日
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-m3-outline bg-m3-surface text-xs font-bold text-m3-on-surface focus:ring-2 focus:ring-m3-primary focus:border-m3-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Export Buttons */}
                        <Card variant="outlined" className="bg-m3-surface rounded-2xl border-m3-outline-variant p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-widest mb-4">エクスポート</h3>
                            <div className="flex gap-3">
                                <Button
                                    variant="filled"
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
                                    icon={<FileDown size={16} />}
                                >
                                    {exporting ? '処理中...' : 'CSV ダウンロード'}
                                </Button>
                            </div>
                        </Card>

                        {/* Info Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">エクスポート内容</p>
                                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                                        <li>CSV: ユーザー × マニュアル進捗マトリクス（Excel対応）</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null
                }


                {/* System Log Footer with Integrated Diagnostics */}
                <div className="fixed bottom-0 left-0 lg:left-80 right-0 bg-slate-900 text-slate-100 border-t border-slate-700 shadow-2xl transition-transform duration-300 ease-out transform translate-y-[calc(100%-88px)] hover:translate-y-0 z-50">
                    {/* Diagnostics Bar - Always visible */}
                    <div className="bg-slate-800/95 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* System Status */}
                            <div className="flex items-center gap-2 pr-3 border-r border-m3-outline-variant">
                                <div className={`w-2 h-2 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-m3-error'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${stats.dbStatus === 'Connected' ? 'text-emerald-600' : 'text-m3-error'}`}>
                                    {stats.dbStatus === 'Connected' ? 'Operational' : 'Degraded'}
                                </span>
                            </div>

                            {/* DB Latency */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-m3-outline-variant">
                                <Database size={12} className="text-m3-outline" />
                                <span className={`text-[10px] font-bold ${resources.dbPing < 50 ? 'text-emerald-600' : resources.dbPing < 100 ? 'text-amber-600' : 'text-m3-error'}`}>
                                    {resources.dbPing}ms
                                </span>
                            </div>

                            {/* Uptime */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-m3-outline-variant">
                                <Activity size={12} className="text-m3-outline" />
                                <span className="text-[10px] font-bold text-orange-600">
                                    {Math.floor(resources.uptime / 3600000)}h {Math.floor((resources.uptime % 3600000) / 60000)}m
                                </span>
                            </div>

                            {/* Memory Usage */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-m3-outline-variant">
                                <Cpu size={12} className="text-m3-outline" />
                                <span className="text-[10px] font-bold text-blue-600">
                                    {Math.round(resources.memoryUsed / 1024 / 1024)}
                                </span>
                                <span className="text-[9px] text-m3-on-surface-variant">/ {Math.round(resources.memoryMax / 1024 / 1024)} MB</span>
                            </div>

                            {/* Node Name */}
                            <div className="flex items-center gap-1.5 pr-3 border-r border-m3-outline-variant">
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold uppercase tracking-widest border border-orange-200">
                                    medical-wiki-backend
                                </span>
                            </div>

                            {/* Soft-deleted Users Count */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-m3-outline">🗑️</span>
                                <span className="text-[10px] font-bold text-m3-on-surface-variant">
                                    {userList.filter(u => u.deletedAt).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Console Header */}
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between cursor-pointer group hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-slate-700 rounded group-hover:bg-slate-600 transition-colors">
                                <Terminal size={14} className="text-orange-400" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">System Log Console</span>
                            <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[10px] text-slate-400">{logs.length} events</span>
                        </div>
                        <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className="w-2 h-2 rounded-full bg-m3-error" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                    </div>

                    {/* Log Entries */}
                    <div className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 border-l-2 border-transparent hover:border-orange-500 transition-all items-center">
                                {/* Environment Badge */}
                                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[8px] font-bold uppercase tracking-wider border border-slate-700 flex-shrink-0">
                                    ENV
                                </span>
                                <span className="text-slate-500 select-none w-20 flex-shrink-0">{log.timestamp}</span>
                                <span className={`font-bold w-16 uppercase flex-shrink-0 ${log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                                    }`}>
                                    {log.type}
                                </span>
                                <span className="text-slate-300 truncate">{log.message}</span>
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-slate-500 italic px-2">System initialized. Waiting for events...</span>}
                    </div>
                </div>
            </div>
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


