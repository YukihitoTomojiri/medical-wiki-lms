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
            { id: 'dashboard', label: '学習進捗', icon: LayoutDashboard },
            { id: 'paid_leaves', label: '労務管理', icon: Calendar },
            { id: 'leave_monitoring', label: '有給モニタリング', icon: AlertCircle },
        ];
        // Restore system stats for Devs (simplified for now without full component)
        return commonTabs;
    }, [isDev]);

    const [activeTab, setActiveTab] = useState('dashboard');

    // ... imports

    return (
        <div className="space-y-6">
            <PageHeader
                title="管理者ダッシュボード"
                subtitle="施設全体の管理および労務承認を行います"
                icon={LayoutDashboard}
            />

            {/* Tabs Navigation */}
            <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-1 mb-6">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap
                                ${isActive
                                    ? 'bg-white border-b-2 border-primary-600 text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            <Icon size={18} className={isActive ? 'text-primary-600' : 'text-gray-400'} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'dashboard' && <ComplianceDashboard />}
                {activeTab === 'paid_leaves' && <PaidLeaveManagement />}
                {activeTab === 'leave_monitoring' && <AdminLeaveMonitoring />}
            </div>
        </div>
    );
}
