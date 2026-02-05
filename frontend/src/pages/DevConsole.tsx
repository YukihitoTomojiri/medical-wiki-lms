
import { useState, useEffect } from 'react';
import { api } from '../api';
import {
    Terminal,
    Cpu,
    HardDrive,
    Activity,
    Server,
    Shield,
    Clock,
    Database,
    AlertCircle
} from 'lucide-react';



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
            const resData = await api.getSystemResources(1);
            const diagData = await api.getDiagnostics(1);
            setResources(prev => ({ ...prev, ...resData, ...diagData }));
        } catch (e) { console.error(e); }
    };

    const fetchNodeStatuses = async () => {
        try {
            const statuses = await api.getNodeStatuses();
            const statusMap = new Map();
            statuses.forEach((node: any) => {
                statusMap.set(node.userId, node);
            });
            setNodeStatuses(statusMap);
        } catch (e) { console.error(e); }
    };

    const fetchLogs = async () => {
        try {
            const data = await api.getAuditLogs(1);
            setSystemLogs(data);
        } catch (e) { console.error(e); }
    };

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
            <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
                    <Activity className="animate-spin text-emerald-500" size={32} />
                    <span className="text-sm font-medium tracking-wider">SYSTEM INITIALIZING...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-8 font-sans">
            <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-100 mb-1">
                        <Terminal className="text-emerald-500" />
                        Developer Console
                    </h1>
                    <p className="text-xs text-slate-500 font-medium ml-1">SYSTEM MONITORING & DIAGNOSTICS</p>
                </div>
                <div className="text-right text-xs text-slate-500 font-medium hidden sm:block">
                    <p className="font-mono text-slate-400">{new Date().toISOString()}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. System Stats Widget */}
                <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Activity size={16} className="text-slate-500" />
                        System Resources
                    </h2>

                    <div className="space-y-6">
                        {/* Memory */}
                        <div>
                            <div className="flex justify-between text-xs mb-2 items-center">
                                <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <Cpu size={14} className="text-slate-500" /> Memory Heap
                                </span>
                                <span className={`font-mono font-bold ${resources.memoryPercent > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {resources.memoryPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${resources.memoryPercent > 90 ? 'bg-rose-500' : resources.memoryPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${resources.memoryPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                                <span>{formatBytes(resources.memoryUsed)}</span>
                                <span>/ {formatBytes(resources.memoryMax)}</span>
                            </div>
                        </div>

                        {/* Disk */}
                        <div>
                            <div className="flex justify-between text-xs mb-2 items-center">
                                <span className="flex items-center gap-2 text-slate-300 font-medium">
                                    <HardDrive size={14} className="text-slate-500" /> Disk Volume (Root)
                                </span>
                                <span className={`font-mono font-bold ${resources.diskPercent > 90 ? 'text-rose-400' : 'text-slate-200'}`}>
                                    {resources.diskPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${resources.diskPercent > 90 ? 'bg-rose-500' : 'bg-slate-500'}`}
                                    style={{ width: `${resources.diskPercent}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                                <span>Free: {formatBytes(resources.diskFree)}</span>
                                <span>Total: {formatBytes(resources.diskTotal)}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">Uptime</span>
                                <span className="text-sm font-mono font-medium text-slate-200 flex items-center gap-2">
                                    <Clock size={12} className="text-emerald-500" />
                                    {formatUptime(resources.uptime)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">DB Latency</span>
                                <span className={`text-sm font-mono font-medium flex items-center gap-2 ${resources.dbPing > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    <Database size={12} />
                                    {resources.dbPing}ms
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Active Nodes Widget */}
                <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                            <Server size={16} className="text-slate-500" />
                            Active Nodes
                        </h2>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {nodeStatuses.size} detected
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {Array.from(nodeStatuses.values()).map((node: any) => (
                            <div key={node.userId} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'UP' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                                            node.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}></div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">
                                            {node.healthMetrics?.name || `ID: ${node.userId}`}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            {node.healthMetrics?.facility || 'Unknown Facility'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded ml-auto w-fit mb-1 ${node.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400' :
                                        node.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                        {node.status}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-600">
                                        {new Date(node.healthMetrics?.lastActiveAt || Date.now()).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {nodeStatuses.size === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                <AlertCircle size={32} className="mb-2 opacity-50" />
                                <span className="text-xs font-medium">No active nodes detected</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Audit Logs Widget */}
                <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 shadow-sm lg:col-span-1 min-h-[300px] flex flex-col">
                    <h2 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Shield size={16} className="text-slate-500" />
                        Audit Stream
                    </h2>

                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {systemLogs.map((log) => (
                            <div key={log.id} className="flex gap-3 p-2 hover:bg-slate-700/30 rounded transition-colors group">
                                <span className="text-slate-600 shrink-0 select-none group-hover:text-slate-500">
                                    {log.timestamp.split(' ')[1]}
                                </span>
                                <span className={`shrink-0 w-20 font-bold ${log.action === 'LOGIN' ? 'text-sky-400' :
                                    log.action === 'ERROR' ? 'text-rose-400' :
                                        log.action.includes('DELETE') ? 'text-rose-400' :
                                            'text-emerald-400'
                                    }`}>{log.action}</span>
                                <span className="text-slate-400 truncate group-hover:text-slate-300">
                                    {log.description || log.target}
                                </span>
                            </div>
                        ))}
                        {systemLogs.length === 0 && (
                            <div className="text-center py-12 text-slate-600 text-xs">
                                No audit logs available
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
