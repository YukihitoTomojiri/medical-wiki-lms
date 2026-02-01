import { useState } from 'react';
import { User } from '../types';
import { RefreshCw, X, Check } from 'lucide-react';

interface RestoreConfirmModalProps {
    isOpen: boolean;
    restorableUsers: User[];
    onConfirm: (selectedIds: string[]) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function RestoreConfirmModal({
    isOpen,
    restorableUsers,
    onConfirm,
    onCancel,
    isLoading,
}: RestoreConfirmModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(
        restorableUsers.map(u => u.employeeId) // Default select all
    );

    if (!isOpen) return null;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === restorableUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(restorableUsers.map(u => u.employeeId));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={isLoading ? undefined : onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <RefreshCw className="text-amber-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-800">退職済みユーザーの復元</h3>
                            <p className="text-xs text-gray-500">CSVに含まれる以下のIDは退職済みです。復元して再登録しますか？</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - List */}
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2 sticky top-0 z-10">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === restorableUsers.length && restorableUsers.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Select All ({restorableUsers.length})</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-400 font-black uppercase tracking-widest sticky top-[53px] z-10">
                            <tr>
                                <th className="px-6 py-3 w-10"></th>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {restorableUsers.map(user => (
                                <tr key={user.employeeId} className={`hover:bg-amber-50/30 transition-colors ${selectedIds.includes(user.employeeId) ? 'bg-amber-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(user.employeeId)}
                                            onChange={() => toggleSelect(user.employeeId)}
                                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm font-bold text-gray-700">{user.employeeId}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.name}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : '-'}
                                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-bold">Deleted</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-white">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={() => onConfirm(selectedIds)}
                        disabled={isLoading || selectedIds.length === 0}
                        className="flex-1 px-4 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                処理中...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                選択したユーザーを復元して登録
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Ensure User type includes deletedAt
// Note: We assume User type in types.ts might need updating if it doesn't have deletedAt yet, 
// but for this component it will just be undefined if not present in type def, 
// though we access user.deletedAt. We should verify types.ts later.
