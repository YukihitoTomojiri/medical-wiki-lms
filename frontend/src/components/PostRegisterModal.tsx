import React, { useState } from 'react';
import { api } from '../api';
import { X, Copy, Check, Mail, Key } from 'lucide-react';

interface Props {
    user: any;
    onClose: () => void;
}

export const PostRegisterModal = ({ user, onClose }: Props) => {
    const [activeTab, setActiveTab] = useState<'invite' | 'temp'>('invite');
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const inviteUrl = `${window.location.origin}/setup?token=${user.invitationToken}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const issuePass = async () => {
        try {
            const res = await api.issueTempPassword(1, user.id); // Using Admin ID 1
            setTempPassword(res.tempPassword);
        } catch (e) {
            console.error(e);
            alert('Failed to issue password');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-br from-emerald-50 via-white to-white border-b border-emerald-100/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Check size={18} />
                            </span>
                            Registration Complete
                        </h3>
                        <p className="text-xs text-gray-500 font-medium ml-10 mt-1">
                            {user.name} ({user.employeeId}) has been created
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Tabs */}
                    <div className="flex bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                        <button
                            onClick={() => setActiveTab('invite')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'invite'
                                    ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-gray-100'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                                }`}
                        >
                            <Mail size={14} />
                            INVITE LINK
                        </button>
                        <button
                            onClick={() => setActiveTab('temp')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'temp'
                                    ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-gray-100'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                                }`}
                        >
                            <Key size={14} />
                            TEMP PASSWORD
                        </button>
                    </div>

                    {/* Content */}
                    <div className="min-h-[180px]">
                        {activeTab === 'invite' ? (
                            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Onboarding URL
                                    </label>
                                    <div className="group relative">
                                        <div className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-xs font-mono text-gray-600 break-all select-all hover:bg-white hover:border-emerald-200 transition-colors">
                                            {inviteUrl}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                        Share this URL with the user. They will be prompted to set their password upon access.
                                    </p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'COPIED TO CLIPBOARD' : 'COPY URL'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                {!tempPassword ? (
                                    <>
                                        <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                                            <h4 className="text-sm font-bold text-orange-800 mb-2">Issue Temporary Password</h4>
                                            <p className="text-xs text-orange-600/80 leading-relaxed">
                                                This will generate a one-time password. The user will be forced to change it immediately after logging in.
                                            </p>
                                        </div>
                                        <button
                                            onClick={issuePass}
                                            className="w-full py-4 bg-slate-800 text-white rounded-xl font-black text-xs tracking-widest hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                                        >
                                            <Key size={16} />
                                            ISSUE PASSWORD
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                Temporary Password
                                            </label>
                                            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-stripes-emerald opacity-10"></div>
                                                <div className="relative text-2xl font-mono font-black text-emerald-800 tracking-wider">
                                                    {tempPassword}
                                                </div>
                                            </div>
                                            <p className="text-xs text-center text-emerald-600/70 font-medium">
                                                Click to copy is not implemented, please copy manually
                                            </p>
                                        </div>
                                        <button
                                            onClick={issuePass}
                                            className="w-full py-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-600 rounded-xl font-bold text-xs tracking-widest hover:bg-gray-50 transition-all"
                                        >
                                            RE-ISSUE
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
