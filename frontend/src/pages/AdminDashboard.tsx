import { useState, useMemo } from 'react';
import { User } from '../types';
import PaidLeaveManagement from '../components/PaidLeaveManagement';
import ComplianceDashboard from '../components/ComplianceDashboard';
import AdminLeaveMonitoring from '../components/AdminLeaveMonitoring';
import { LayoutDashboard, Calendar, AlertCircle } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';

export default function AdminDashboard() {
    const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const isDev = user.role === 'DEVELOPER';

    const tabs = useMemo(() => {
        const commonTabs = [
            { id: 'dashboard', label: '学習進捗', icon: LayoutDashboard, color: 'indigo' },
            { id: 'paid_leaves', label: '労務管理', icon: Calendar, color: 'teal' },
            { id: 'leave_monitoring', label: '有給モニタリング', icon: AlertCircle, color: 'amber' },
        ];
        return commonTabs;
    }, [isDev]);

    const [activeTab, setActiveTab] = useState('dashboard');

    const activeColor = tabs.find(t => t.id === activeTab)?.color ?? 'indigo';

    const tabColors: Record<string, { activeBg: string; activeText: string; activeAccent: string; hoverIcon: string; contentBg: string }> = {
        indigo: { activeBg: 'bg-indigo-100', activeText: 'text-indigo-900', activeAccent: 'bg-indigo-400/30', hoverIcon: 'group-hover:text-indigo-400', contentBg: 'bg-indigo-100' },
        teal: { activeBg: 'bg-teal-100', activeText: 'text-teal-900', activeAccent: 'bg-teal-400/30', hoverIcon: 'group-hover:text-teal-400', contentBg: 'bg-teal-100' },
        amber: { activeBg: 'bg-amber-100', activeText: 'text-amber-900', activeAccent: 'bg-amber-400/30', hoverIcon: 'group-hover:text-amber-400', contentBg: 'bg-amber-100' },
    };

    return (
        <div className="space-y-0">
            <PageHeader
                title="管理者ダッシュボード"
                subtitle="施設全体の管理および労務承認を行います"
                icon={LayoutDashboard}
            />

            {/* Folder-style Tab Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 -mb-2 relative z-10 px-4 md:px-6 mt-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const colors = tabColors[tab.color];
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative overflow-hidden rounded-t-2xl p-5 text-left transition-all duration-300 group ${isActive
                                ? `${colors.activeBg} ${colors.activeText} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-8`
                                : 'bg-transparent text-gray-500 hover:bg-gray-50 z-0 border-b border-gray-200 pb-5'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-black uppercase tracking-wider ${isActive ? colors.activeText : 'text-gray-400'}`}>{tab.label}</span>
                                <Icon className={isActive ? colors.activeText : `text-gray-300 ${colors.hoverIcon}`} size={20} />
                            </div>
                            {isActive && (
                                <div className={`absolute top-0 left-0 w-full h-1 ${colors.activeAccent}`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Content Area */}
            <div className={`rounded-3xl p-6 transition-colors duration-300 shadow-sm relative z-0 ${tabColors[activeColor]?.contentBg ?? 'bg-indigo-100'}`}>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === 'dashboard' && <ComplianceDashboard />}
                    {activeTab === 'paid_leaves' && <PaidLeaveManagement />}
                    {activeTab === 'leave_monitoring' && <AdminLeaveMonitoring />}
                </div>
            </div>
        </div>
    );
}

