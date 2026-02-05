
import { useState, useEffect } from 'react';
import { api } from '../api';
import {
    Terminal,
    Cpu,
    HardDrive,
    Activity,
    Server,
    Shield,
    Clock
} from 'lucide-react';

interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

export default function DevConsole() {
    const [resources, setResources] = useState({
        memoryUsed: 0,
        memoryMax: 0,
        memoryPercent: 0,
        diskUsed: 0,
        diskTotal: 0,
        diskPercent: 0,
        diskFree: 0,
        uptime: 0,
        dbPing: 0
    });

    const [nodeStatuses, setNodeStatuses] = useState<Map<number, any>>(new Map());
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchNodeStatuses, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchResources(),
                fetchNodeStatuses(),
                fetchLogs()
            ]);
        } catch (e) {
            console.error('Init failed', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            // Get base resources
            const resData = await api.getSystemResources(1);
            // Get diagnostics for uptime/ping if needed, or just merge
            const diagData = await api.getDiagnostics(1);

            setResources(prev => ({
                ...prev,
                ...resData,
                ...diagData
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchNodeStatuses = async () => {
        try {
            const statuses = await api.getNodeStatuses();
            const statusMap = new Map();
            statuses.forEach((node: any) => {
                statusMap.set(node.userId, node);
            });
            setNodeStatuses(statusMap);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLogs = async () => {
        try {
            const data = await api.getAuditLogs(1);
            setSystemLogs(data);
        } catch (e) {
            console.error(e);
        }
    };

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatUptime = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        return `${h}h ${m}m`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-green-500 font-mono flex items-center justify-center">
                <div className="animate-pulse flex items-center gap-2">
                    <Terminal size={20} />
                    INITIALIZING_DEV_CONSOLE...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-green-400 font-mono p-6">
            <header className="mb-8 border-b border-green-900/50 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Terminal className="text-green-500" />
                        DEV_CONSOLE_v1.0
                    </h1>
                    <p className="text-xs text-green-600 mt-1">SYSTEM_INTEGRITY: OPTIMAL</p>
                </div>
                <div className="text-right text-xs text-green-700">
                    <p>{new Date().toISOString()}</p>
                    <p>USER: ROOT_ACCESS</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. System Stats Widget */}
                <div className="bg-gray-900/50 border border-green-900 rounded-lg p-4 relative overflow-hidden group hover:border-green-500/50 transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20"></div>
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-green-300">
                        <Activity size={16} />
                        SYSTEM_RESOURCES
                    </h2>

                    <div className="space-y-6">
                        {/* Memory */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-2">
                                    <Cpu size={12} /> MEMORY_HEAP
                                </span>
                                <span className={resources.memoryPercent > 80 ? 'text-yellow-400' : 'text-green-400'}>
                                    {resources.memoryPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                <div
                                    className={`h-full ${resources.memoryPercent > 90 ? 'bg-red-500' : resources.memoryPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${resources.memoryPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>USED: {formatBytes(resources.memoryUsed)}</span>
                                <span>MAX: {formatBytes(resources.memoryMax)}</span>
                            </div>
                        </div>

                        {/* Disk */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-2">
                                    <HardDrive size={12} /> DISK_VOLUME (/)
                                </span>
                                <span className={resources.diskPercent > 90 ? 'text-red-400' : 'text-green-400'}>
                                    {resources.diskPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                <div
                                    className={`h-full ${resources.diskPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${resources.diskPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>FREE: {formatBytes(resources.diskFree)}</span>
                                <span>TOTAL: {formatBytes(resources.diskTotal)}</span>
                            </div>
                        </div>

                        {/* Extra Metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800">
                            <div className="p-2 bg-gray-800/30 rounded">
                                <span className="text-[10px] text-gray-500 block flex items-center gap-1">
                                    <Clock size={10} /> UPTIME
                                </span>
                                <span className="text-sm">{formatUptime(resources.uptime)}</span>
                            </div>
                            <div className="p-2 bg-gray-800/30 rounded">
                                <span className="text-[10px] text-gray-500 block">DB_LATENCY</span>
                                <span className={`text-sm ${resources.dbPing > 100 ? 'text-red-400' : 'text-green-400'}`}>
                                    {resources.dbPing}ms
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Active Nodes Widget */}
                <div className="bg-gray-900/50 border border-green-900 rounded-lg p-4 group hover:border-green-500/50 transition-colors">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-green-300">
                        <Server size={16} />
                        ACTIVE_NODES [{nodeStatuses.size}]
                    </h2>

                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-900">
                        {Array.from(nodeStatuses.values()).map((node: any) => (
                            <div key={node.userId} className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-800 hover:border-green-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${node.status === 'UP' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                                            node.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-300">ID: {node.healthMetrics?.employeeId || node.userId}</div>
                                        <div className="text-[10px] text-gray-500">{node.healthMetrics?.facility || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${node.status === 'UP' ? 'bg-green-900/30 text-green-400' :
                                            node.status === 'WARNING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                        }`}>
                                        {node.status}
                                    </div>
                                    <div className="text-[9px] text-gray-600 mt-0.5">
                                        Last: {new Date(node.healthMetrics?.lastActiveAt || Date.now()).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {nodeStatuses.size === 0 && (
                            <div className="text-center py-8 text-gray-600 text-xs">
                                NO_NODES_DETECTED
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Audit Logs Widget */}
                <div className="bg-gray-900/50 border border-green-900 rounded-lg p-4 lg:col-span-1 min-h-[300px] flex flex-col group hover:border-green-500/50 transition-colors">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-green-300">
                        <Shield size={16} />
                        AUDIT_STREAM
                    </h2>

                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 scrollbar-thin scrollbar-thumb-green-900">
                        {systemLogs.map((log) => (
                            <div key={log.id} className="flex gap-2 p-1.5 hover:bg-green-900/10 rounded border-l-2 border-transparent hover:border-green-500">
                                <span className="text-gray-500 shrink-0">[{log.timestamp.split(' ')[1]}]</span>
                                <span className={`shrink-0 w-16 font-bold ${log.action === 'LOGIN' ? 'text-blue-400' :
                                        log.action === 'ERROR' ? 'text-red-400' :
                                            log.action.includes('DELETE') ? 'text-red-400' :
                                                'text-green-400'
                                    }`}>{log.action}</span>
                                <span className="text-gray-300 truncate">{log.description || log.target}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
