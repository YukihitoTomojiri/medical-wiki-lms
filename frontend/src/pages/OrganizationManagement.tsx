import { useState, useEffect } from 'react';
import { api } from '../api';
import { Building2, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Check, X, Save } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Facility {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
    facilityId: number;
    facilityName: string;
}

export default function OrganizationManagement() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [expandedFacility, setExpandedFacility] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Add/Edit states
    const [showAddFacility, setShowAddFacility] = useState(false);
    const [newFacilityName, setNewFacilityName] = useState('');
    const [editingFacilityId, setEditingFacilityId] = useState<number | null>(null);
    const [editFacilityName, setEditFacilityName] = useState('');

    const [showAddDepartment, setShowAddDepartment] = useState<number | null>(null);
    const [newDeptName, setNewDeptName] = useState('');
    const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
    const [editDeptName, setEditDeptName] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.id);
            loadData(user.id);
        }
    }, []);

    const loadData = async (uid?: number) => {
        const targetUserId = uid || userId;
        if (!targetUserId) return;

        setLoading(true);
        try {
            const [facs, depts] = await Promise.all([
                api.getFacilities(targetUserId),
                api.getDepartments(targetUserId)
            ]);
            setFacilities(facs);
            setDepartments(depts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFacility = async () => {
        if (!newFacilityName.trim() || !userId) return;
        setError(null);
        await api.createFacility(newFacilityName.trim(), userId);
        setNewFacilityName('');
        setShowAddFacility(false);
        loadData();
    };

    const handleUpdateFacility = async (id: number) => {
        if (!editFacilityName.trim() || !userId) return;
        setError(null);
        await api.updateFacility(id, editFacilityName.trim(), userId);
        setEditingFacilityId(null);
        loadData();
    };

    const handleDeleteFacility = async (id: number) => {
        if (!window.confirm('施設を削除しますか？\n紐づく部署も削除されます。')) return;
        if (!userId) return;
        await api.deleteFacility(id, userId);
        loadData();
    };

    const handleAddDepartment = async (facilityId: number) => {
        if (!newDeptName.trim() || !userId) return;
        setError(null);
        await api.createDepartment(newDeptName.trim(), facilityId, userId);
        setNewDeptName('');
        setShowAddDepartment(null);
        loadData();
    };

    const handleUpdateDepartment = async (id: number) => {
        if (!editDeptName.trim() || !userId) return;
        setError(null);
        await api.updateDepartment(id, editDeptName.trim(), userId);
        setEditingDeptId(null);
        loadData();
    };

    const handleDeleteDepartment = async (id: number) => {
        if (!window.confirm('部署を削除しますか？')) return;
        if (!userId) return;
        await api.deleteDepartment(id, userId);
        loadData();
    };

    const getDepartmentsForFacility = (facilityId: number) => {
        return departments.filter(d => d.facilityId === facilityId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-m3-primary/30 border-t-m3-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <PageHeader
                title="組織管理"
                subtitle="施設内の部署・病棟の構成を管理します"
                icon={Building2}
            >
                <Button
                    variant="filled"
                    onClick={() => setShowAddFacility(true)}
                    icon={<Plus size={18} />}
                >
                    施設を追加
                </Button>
            </PageHeader>

            <div className="bg-white rounded-[28px] border border-stone-200 p-6 shadow-sm">
                {error && (
                    <div className="p-4 mb-4 bg-m3-error-container text-m3-on-error-container rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Add Facility Form */}
                {showAddFacility && (
                    <Card variant="filled" className="p-4 mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <Input
                            variant="filled"
                            value={newFacilityName}
                            onChange={(e) => setNewFacilityName(e.target.value)}
                            placeholder="施設名を入力"
                            autoFocus
                            className="flex-1"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="filled"
                                size="sm"
                                onClick={handleAddFacility}
                                icon={<Save size={18} />}
                            >
                                保存
                            </Button>
                            <Button
                                variant="tonal"
                                size="sm"
                                onClick={() => { setShowAddFacility(false); setNewFacilityName(''); }}
                                icon={<X size={18} />}
                            />
                        </div>
                    </Card>
                )}

                {/* Facilities List (Grouped List Style) */}
                <div className="overflow-hidden bg-m3-surface border border-m3-outline-variant rounded-xl">
                    {facilities.length === 0 ? (
                        <div className="p-12 text-center text-m3-outline-variant">
                            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                            <p>登録されている施設はありません</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-m3-outline-variant/20">
                            {facilities.map((facility) => {
                                const depts = getDepartmentsForFacility(facility.id);
                                const isExpanded = expandedFacility === facility.id;

                                return (
                                    <div key={facility.id} className="transition-colors hover:bg-m3-surface-container-low group">
                                        {/* Facility Row */}
                                        <div
                                            className="flex items-center gap-4 p-4 cursor-pointer"
                                            onClick={() => setExpandedFacility(isExpanded ? null : facility.id)}
                                        >
                                            <div className="p-1 text-m3-outline transition-transform duration-200">
                                                {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                            </div>

                                            <div className="w-10 h-10 rounded-full bg-m3-tertiary-container text-m3-on-tertiary-container flex items-center justify-center shrink-0">
                                                <Building2 size={20} />
                                            </div>

                                            {editingFacilityId === facility.id ? (
                                                <div className="flex-1 flex items-center gap-2 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        variant="outlined"
                                                        value={editFacilityName}
                                                        onChange={(e) => setEditFacilityName(e.target.value)}
                                                        autoFocus
                                                        className="flex-1"
                                                    />
                                                    <Button variant="filled" size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateFacility(facility.id); }}>
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button variant="tonal" size="sm" onClick={(e) => { e.stopPropagation(); setEditingFacilityId(null); }}>
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-bold text-m3-on-surface truncate">{facility.name}</h3>
                                                        <p className="text-xs text-m3-on-surface-variant font-medium mt-0.5">{depts.length} 部署</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="text"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); setEditingFacilityId(facility.id); setEditFacilityName(facility.name); }}
                                                            className="text-m3-outline hover:text-m3-primary"
                                                        >
                                                            <Edit2 size={18} />
                                                        </Button>
                                                        <Button
                                                            variant="text"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteFacility(facility.id); }}
                                                            className="text-m3-outline hover:text-m3-error"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Departments (Nested) */}
                                        {isExpanded && (
                                            <div className="bg-m3-surface-container-lowest border-t border-m3-outline-variant/20 animate-in slide-in-from-top-1 duration-200">
                                                <div className="pl-16 sm:pl-20 pr-4 py-3 space-y-1">
                                                    {depts.map((dept) => (
                                                        <div key={dept.id} className="group/dept flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-m3-surface-variant/50 transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-m3-outline-variant"></div>

                                                            {editingDeptId === dept.id ? (
                                                                <div className="flex-1 flex items-center gap-2 animate-in fade-in">
                                                                    <Input
                                                                        variant="outlined"
                                                                        value={editDeptName}
                                                                        onChange={(e) => setEditDeptName(e.target.value)}
                                                                        autoFocus
                                                                        className="py-1 text-sm"
                                                                    />
                                                                    <Button variant="filled" size="sm" className="h-8 w-8 px-0" onClick={() => handleUpdateDepartment(dept.id)}>
                                                                        <Check size={14} />
                                                                    </Button>
                                                                    <Button variant="tonal" size="sm" className="h-8 w-8 px-0" onClick={() => setEditingDeptId(null)}>
                                                                        <X size={14} />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span className="flex-1 text-sm font-medium text-m3-on-surface-variant">{dept.name}</span>
                                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover/dept:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => { setEditingDeptId(dept.id); setEditDeptName(dept.name); }}
                                                                            className="p-1 text-m3-outline hover:text-m3-primary rounded transition-colors"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteDepartment(dept.id)}
                                                                            className="p-1 text-m3-outline hover:text-m3-error rounded transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add Department Input */}
                                                    <div className="pl-3 mt-2">
                                                        {showAddDepartment === facility.id ? (
                                                            <div className="flex items-center gap-2 py-1 animate-in fade-in">
                                                                <Input
                                                                    variant="outlined"
                                                                    value={newDeptName}
                                                                    onChange={(e) => setNewDeptName(e.target.value)}
                                                                    placeholder="部署名を追加..."
                                                                    autoFocus
                                                                    className="py-1 text-sm"
                                                                />
                                                                <Button variant="filled" size="sm" onClick={() => handleAddDepartment(facility.id)}>
                                                                    <Check size={16} />
                                                                </Button>
                                                                <Button variant="tonal" size="sm" onClick={() => { setShowAddDepartment(null); setNewDeptName(''); }}>
                                                                    <X size={16} />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setShowAddDepartment(facility.id)}
                                                                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-m3-primary hover:bg-m3-primary-container/30 rounded-lg transition-colors w-full text-left"
                                                            >
                                                                <Plus size={16} />
                                                                <span>部署を追加</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
