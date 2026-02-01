
import { Activity, Database, Server, Wifi } from 'lucide-react';

interface SystemHealthFooterProps {
    stats: {
        dbStatus: string;
        version: string;
    };
    diagnostics: {
        uptime: number;
        memoryUsed: number;
        dbPing: number;
    };
}

export default function SystemHealthFooter({ stats, diagnostics }: SystemHealthFooterProps) {
    const isDbConnected = stats.dbStatus === 'Connected';
    const isHealthy = isDbConnected && diagnostics.dbPing < 100;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="mx-auto max-w-7xl">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 p-4 flex items-center justify-between">

                    {/* Left: Overall Status */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isHealthy ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">System Status</p>
                                <p className={`text-sm font-black tracking-tight ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {isHealthy ? 'SYSTEM OPERATIONAL' : 'SYSTEM DEGRADED'}
                                </p>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                        <div className="hidden sm:flex items-center gap-6">
                            {/* DB Latency */}
                            <div className="flex items-center gap-3">
                                <Database size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">Database Latency</p>
                                    <p className="text-xs font-mono font-bold text-gray-700">{diagnostics.dbPing}ms</p>
                                </div>
                            </div>

                            {/* Node Info */}
                            <div className="flex items-center gap-3">
                                <Server size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">Node</p>
                                    <p className="text-xs font-bold text-gray-700">medical-wiki-backend</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Version & Connection */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <Wifi size={14} className={isDbConnected ? 'text-emerald-500' : 'text-red-500'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                {isDbConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Version</p>
                            <p className="text-xs font-bold text-gray-600">v{stats.version}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
