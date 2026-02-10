import { useState, useEffect } from 'react';
import { api } from '../api';
import { Building2, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import PageHeader from './PageHeader';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [facs, depts] = await Promise.all([
                api.getFacilities(),
                api.getDepartments()
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
        if (!newFacilityName.trim()) return;
        setError(null);
        const result = await api.createFacility(newFacilityName.trim());
        if (result.error) {
            setError(result.error);
            return;
        }
        setNewFacilityName('');
        setShowAddFacility(false);
        loadData();
    };

    const handleUpdateFacility = async (id: number) => {
        if (!editFacilityName.trim()) return;
        setError(null);
        const result = await api.updateFacility(id, editFacilityName.trim());
        if (result.error) {
            setError(result.error);
            return;
        }
        setEditingFacilityId(null);
        loadData();
    };

    const handleDeleteFacility = async (id: number) => {
        if (!confirm('この施設を削除しますか？関連する部署も同時に削除されます。')) return;
        await api.deleteFacility(id);
        loadData();
    };

    const handleAddDepartment = async (facilityId: number) => {
        if (!newDeptName.trim()) return;
        setError(null);
        const result = await api.createDepartment(newDeptName.trim(), facilityId);
        if (result.error) {
            setError(result.error);
            return;
        }
        setNewDeptName('');
        setShowAddDepartment(null);
        loadData();
    };

    const handleUpdateDepartment = async (id: number) => {
        if (!editDeptName.trim()) return;
        setError(null);
        const result = await api.updateDepartment(id, editDeptName.trim());
        if (result.error) {
            setError(result.error);
            return;
        }
        setEditingDeptId(null);
        loadData();
    };

    const handleDeleteDepartment = async (id: number) => {
        if (!confirm('この部署を削除しますか？')) return;
        await api.deleteDepartment(id);
        loadData();
    };

    const getDepartmentsForFacility = (facilityId: number) => {
        return departments.filter(d => d.facilityId === facilityId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <PageHeader
                title="組織管理"
                description="施設と部署の登録・編集"
                icon={Building2}
                iconColor="text-primary-600"
                iconBgColor="bg-primary-50"
                actions={
                    <button
                        onClick={() => setShowAddFacility(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        施設を追加
                    </button>
                }
            />

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Add Facility Form */}
            {showAddFacility && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    <input
                        type="text"
                        value={newFacilityName}
                        onChange={(e) => setNewFacilityName(e.target.value)}
                        placeholder="施設名を入力"
                        className="flex-1 px-4 py-2 border border-primary-300 rounded-lg focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={handleAddFacility}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        <Save size={18} />
                    </button>
                    <button
                        onClick={() => { setShowAddFacility(false); setNewFacilityName(''); }}
                        className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Facilities List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                {facilities.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                        <p>登録されている施設はありません</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {facilities.map((facility) => {
                            const depts = getDepartmentsForFacility(facility.id);
                            const isExpanded = expandedFacility === facility.id;

                            return (
                                <div key={facility.id}>
                                    {/* Facility Row - Entire row clickable */}
                                    <div
                                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setExpandedFacility(isExpanded ? null : facility.id)}
                                    >
                                        <div className="p-1 text-gray-500">
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>

                                        {editingFacilityId === facility.id ? (
                                            <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editFacilityName}
                                                    onChange={(e) => setEditFacilityName(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateFacility(facility.id); }}
                                                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                                >
                                                    <Save size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingFacilityId(null); }}
                                                    className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <span className="font-bold text-gray-800">{facility.name}</span>
                                                    <span className="ml-2 text-sm text-gray-400">
                                                        ({depts.length} 部署)
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingFacilityId(facility.id); setEditFacilityName(facility.name); }}
                                                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteFacility(facility.id); }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Departments */}
                                    {isExpanded && (
                                        <div className="bg-gray-50 border-t border-gray-100">
                                            <div className="pl-12 pr-4 py-2">
                                                {depts.map((dept) => (
                                                    <div key={dept.id} className="flex items-center gap-3 py-2">
                                                        {editingDeptId === dept.id ? (
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editDeptName}
                                                                    onChange={(e) => setEditDeptName(e.target.value)}
                                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateDepartment(dept.id)}
                                                                    className="p-1 bg-green-500 text-white rounded-lg"
                                                                >
                                                                    <Save size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingDeptId(null)}
                                                                    className="p-1 bg-gray-200 text-gray-600 rounded-lg"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="flex-1 text-gray-700 text-sm">{dept.name}</span>
                                                                <button
                                                                    onClick={() => { setEditingDeptId(dept.id); setEditDeptName(dept.name); }}
                                                                    className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add Department */}
                                                {showAddDepartment === facility.id ? (
                                                    <div className="flex items-center gap-2 py-2">
                                                        <input
                                                            type="text"
                                                            value={newDeptName}
                                                            onChange={(e) => setNewDeptName(e.target.value)}
                                                            placeholder="部署名を入力"
                                                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleAddDepartment(facility.id)}
                                                            className="p-1.5 bg-blue-600 text-white rounded-lg"
                                                        >
                                                            <Save size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowAddDepartment(null); setNewDeptName(''); }}
                                                            className="p-1.5 bg-gray-200 text-gray-600 rounded-lg"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowAddDepartment(facility.id)}
                                                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-blue-700 py-2"
                                                    >
                                                        <Plus size={14} />
                                                        部署を追加
                                                    </button>
                                                )}
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
    );
}
