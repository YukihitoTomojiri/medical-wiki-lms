import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Manual, User } from '../types';
import {
    BookOpen,
    Search,
    CheckCircle2,
    Circle,
    Filter,
    Plus,
    FileText,
    Clock
} from 'lucide-react';

interface ManualListProps {
    user: User;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    '電子カルテ': { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
    '社内ルール': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    '研修資料': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
};

const getCategoryStyle = (category: string) => {
    return categoryColors[category] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
};

export default function ManualList({ user }: ManualListProps) {
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [manualsData, categoriesData] = await Promise.all([
                api.getManuals(user.id),
                api.getCategories(),
            ]);
            setManuals(manualsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredManuals = manuals.filter((manual) => {
        const matchesCategory = !selectedCategory || manual.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            manual.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const readCount = manuals.filter(m => m.isRead).length;
    const totalCount = manuals.length;
    const progressPercentage = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">マニュアル一覧</h2>
                    <p className="text-gray-500 mt-1">社内マニュアル・研修資料を確認できます</p>
                </div>
                {user.role === 'ADMIN' && (
                    <Link
                        to="/admin/manuals/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25"
                    >
                        <Plus size={20} />
                        新規作成
                    </Link>
                )}
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">学習進捗</h3>
                            <p className="text-primary-100 text-sm">あなたの読了状況</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{progressPercentage}%</p>
                        <p className="text-primary-100 text-sm">{readCount} / {totalCount} 読了</p>
                    </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur">
                    <div
                        className="bg-white rounded-full h-3 transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="マニュアルを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-white"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-12 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all bg-white appearance-none cursor-pointer min-w-[180px]"
                    >
                        <option value="">すべてのカテゴリ</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Manual Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredManuals.map((manual) => {
                    const categoryStyle = getCategoryStyle(manual.category);
                    return (
                        <Link
                            key={manual.id}
                            to={`/manuals/${manual.id}`}
                            className="group bg-white rounded-2xl p-5 border border-gray-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border`}>
                                    {manual.category}
                                </span>
                                {manual.isRead ? (
                                    <CheckCircle2 className="text-emerald-500" size={22} />
                                ) : (
                                    <Circle className="text-gray-300 group-hover:text-primary-300 transition-colors" size={22} />
                                )}
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryStyle.bg} ${categoryStyle.text} shrink-0`}>
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-2">
                                        {manual.title}
                                    </h3>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>{new Date(manual.createdAt).toLocaleDateString('ja-JP')}</span>
                                        <span className="mx-1">•</span>
                                        <span>{manual.authorName}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {filteredManuals.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-gray-400" size={28} />
                    </div>
                    <p className="text-gray-500">マニュアルが見つかりません</p>
                </div>
            )}
        </div>
    );
}
