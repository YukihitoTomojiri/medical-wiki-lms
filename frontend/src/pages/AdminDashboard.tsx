
import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { User } from '../types';
import AllUsersAdmin from './AllUsersAdmin';
import OrganizationManagement from '../components/OrganizationManagement';
import {
    Database,
    FileText,
    Users,
    RefreshCw,
    Activity,
    AlertTriangle,
    ShieldAlert,
    Cpu,
    HardDrive,
    FileDown
} from 'lucide-react';

interface AdminDashboardProps {
    user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
    const isDev = user.role === 'DEVELOPER';

    // Tabs Definition
    const tabs = useMemo(() => {
        const commonTabs = [
            { id: 'organization', label: '組織管理' },
            { id: 'users', label: '全ユーザー管理' },
            { id: 'export', label: 'レポート出力' },
        ];

        if (isDev) {
            return [
                { id: 'stats', label: 'システム統計' },
                { id: 'nodes', label: '稼働状況' },
                { id: 'audit', label: '操作履歴' },
                ...commonTabs
            ];
        }
        return commonTabs;
    }, [isDev]);

    // Initial Tab
    const [activeTab, setActiveTab] = useState<string>(isDev ? 'stats' : 'organization');

    const [stats, setStats] = useState({
        dbStatus: 'Check...',
        version: '1.0.0',
    });

    // Data States
    const [userList, setUserList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // System Data (Dev Only)
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
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
    const [nodeStatuses, setNodeStatuses] = useState<Map<number, any>>(new Map());
    const [lastSync, setLastSync] = useState<string>('Never');

    // Initial Load
    useEffect(() => {
        fetchData();
    }, []);

    // Polling only for Dev
    useEffect(() => {
        if (isDev && activeTab === 'nodes') {
            fetchNodeStatuses();
            const interval = setInterval(fetchNodeStatuses, 5000);
            return () => clearInterval(interval);
        }
    }, [isDev, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Always fetch users for general stats
            const promises = [
                api.getUsers(1),
            ];

            if (isDev) {
                promises.push(
                    api.getDiagnostics(1),
                    api.getSystemResources(1).catch(() => ({})),
                    api.getAuditLogs(1).catch(() => []),
                    api.getSecurityAlerts(1).catch(() => []),
                    api.getSecurityAlertStats(1).catch(() => ({ totalOpen: 0, criticalOpen: 0, alerts24h: 0 })),
                    api.getNodeStatuses().catch(() => [])
                );
            }

            const results = await Promise.all(promises);
            const [users, ...devData] = results;

            setUserList(users);

            // Stats
            setStats(prev => ({ ...prev, dbStatus: 'Connected' }));

            if (isDev) {
                const [diag, sysRes, audit, alerts, alertSt, nodes] = devData;
                setResources(prev => ({ ...prev, ...diag, ...sysRes }));
                setSystemLogs(audit);
                setSecurityAlerts(alerts);
                setAlertStats(alertSt);
                // process nodes
                const statusMap = new Map();
                if (Array.isArray(nodes)) {
                    nodes.forEach((node: any) => statusMap.set(node.userId, node));
                }
                setNodeStatuses(statusMap);
            }

            setLastSync(new Date().toLocaleTimeString());
        } catch (error) {
            console.error(error);
            setStats(prev => ({ ...prev, dbStatus: 'Error' }));
        } finally {
            setLoading(false);
        }
    };

    const fetchNodeStatuses = async () => {
        try {
            const data = await api.getNodeStatuses();
            const statusMap = new Map();
            data.forEach((node: any) => statusMap.set(node.userId, node));
            setNodeStatuses(statusMap);
        } catch (e) { console.error(e); }
    };

    // Calculate Stats
    const computedStats = useMemo(() => ({
        developers: userList.filter(u => u.role === 'DEVELOPER').length,
        admins: userList.filter(u => u.role === 'ADMIN').length,
        users: userList.filter(u => u.role === 'USER').length,
        facilities: new Set(userList.map(u => u.facility)).size,
    }), [userList]);

    return (
        <div className="space-y-6 pb-24 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {isDev ? '統合管理コンソール' : '管理者ダッシュボード'}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-gray-500 font-medium text-sm">
                            {user.facility} | {user.name}
                        </p>
                        {isDev && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                SYSTEM_MODE: DEV
                            </span>
                        )}
                        <p className="text-gray-400 text-xs flex items-center gap-1 border-l pl-4 border-gray-200">
                            <RefreshCw size={12} />
                            {lastSync}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        更新
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in duration-300">

                {/* 1. System Stats (Dev Only) */}
                {isDev && activeTab === 'stats' && (
                    <div className="space-y-6">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">データベース接続</p>
                                    <p className={`text-lg font-bold flex items-center gap-2 ${stats.dbStatus === 'Connected' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        <Database size={18} />
                                        {stats.dbStatus === 'Connected' ? '正常' : '異常'}
                                    </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${stats.dbStatus === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">総ユーザー数</p>
                                <p className="text-2xl font-bold text-gray-800">{userList.length} <span className="text-sm font-normal text-gray-400">名</span></p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">アラート(24h)</p>
                                <p className={`text-2xl font-bold ${alertStats.alerts24h > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {alertStats.alerts24h} <span className="text-sm font-normal text-gray-400">件</span>
                                </p>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Uptime</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {Math.floor(resources.uptime / 3600000)}h {Math.floor((resources.uptime % 3600000) / 60000)}m
                                </p>
                            </div>
                        </div>

                        {/* Resources Widgets */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Memory */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Cpu size={20} className="text-blue-500" />
                                        メモリ使用率 (JVM Heap)
                                    </h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${resources.memoryPercent > 80 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {resources.memoryPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${resources.memoryPercent > 90 ? 'bg-red-500' :
                                                resources.memoryPercent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${resources.memoryPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 font-mono">
                                    <span>Used: {(resources.memoryUsed / 1024 / 1024).toFixed(0)} MB</span>
                                    <span>Max: {(resources.memoryMax / 1024 / 1024).toFixed(0)} MB</span>
                                </div>
                            </div>

                            {/* Disk */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <HardDrive size={20} className="text-amber-500" />
                                        ディスク空き容量 (/)
                                    </h3>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${resources.diskPercent > 90 ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {(resources.diskFree / 1024 / 1024 / 1024).toFixed(1)} GB Free
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${resources.diskPercent > 90 ? 'bg-red-500' : 'bg-amber-500'
                                            }`}
                                        style={{ width: `${resources.diskPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 font-mono">
                                    <span>Used: {(resources.diskUsed / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                                    <span>Total: {(resources.diskTotal / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                                </div>
                            </div>
                        </div>

                        {/* Alerts List */}
                        {securityAlerts.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                                    <ShieldAlert className="text-red-500" />
                                    <h3 className="font-bold text-red-800">セキュリティアラート</h3>
                                </div>
                                <div className="p-4">
                                    {/* Simplified list for now as requested by user to focus on integration */}
                                    <p className="text-sm text-gray-600">詳細は監査ログを確認してください。</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Active Nodes (Dev Only) */}
                {isDev && activeTab === 'nodes' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-700">稼働中のノード</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from(nodeStatuses.values()).map((node: any) => (
                                <div key={node.userId} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{node.healthMetrics?.name || node.userId}</p>
                                        <p className="text-xs text-gray-500">{node.healthMetrics?.facility}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold ${node.status === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {node.status}
                                    </div>
                                </div>
                            ))}
                            {nodeStatuses.size === 0 && <p className="text-gray-500 text-sm p-4">アクティブなノードはありません</p>}
                        </div>
                    </div>
                )}

                {/* 3. Audit Logs (Dev Only) */}
                {isDev && activeTab === 'audit' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-700">操作履歴 (Audit Logs)</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Timestamp</th>
                                        <th className="px-4 py-2">User</th>
                                        <th className="px-4 py-2">Action</th>
                                        <th className="px-4 py-2">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {systemLogs.map((log: any) => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-2 font-mono text-xs">{log.timestamp}</td>
                                            <td className="px-4 py-2">{log.userId}</td>
                                            <td className="px-4 py-2 font-bold">{log.action}</td>
                                            <td className="px-4 py-2 text-gray-600 truncate max-w-xs">{log.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Organization Management */}
                {activeTab === 'organization' && (
                    <OrganizationManagement />
                )}

                {/* 5. All Users */}
                {activeTab === 'users' && (
                    <AllUsersAdmin />
                )}

                {/* 6. Export */}
                {activeTab === 'export' && (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                        <FileDown size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-700 mb-2">コンプライアンスレポート出力</h3>
                        <p className="text-gray-500 mb-6">監査用ログおよび学習進捗データをCSV形式でエクスポートします</p>
                        <button className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition">
                            データを出力する
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
