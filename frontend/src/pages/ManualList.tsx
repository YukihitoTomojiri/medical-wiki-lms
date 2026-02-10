import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Manual, User } from '../types';
import {
    BookOpen,
    Search,
    CheckCircle2,
    Plus,
    FileText,
    Clock,
    Circle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';


interface ManualListProps {
    user: User;
}

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
                <div className="w-10 h-10 border-4 border-m3-primary/30 border-t-m3-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <PageHeader
                title="マニュアル一覧"
                description="社内マニュアル・研修資料を確認できます"
                icon={BookOpen}
                iconColor="text-m3-primary"
                iconBgColor="bg-m3-primary-container"
                actions={
                    user.role === 'ADMIN' && (
                        <Link to="/admin/manuals/new">
                            <Button variant="filled" icon={<Plus size={18} />}>
                                新規作成
                            </Button>
                        </Link>
                    )
                }
            />

            {/* M3 Cards for Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card variant="filled" className="p-5 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-8 opacity-5">
                        <CheckCircle2 size={120} />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center z-10">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="z-10">
                        <div className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1">学習進捗率</div>
                        <div className="text-3xl font-black text-m3-on-surface">{progressPercentage}%</div>
                        {/* M3 Progress Bar */}
                        <div className="w-32 h-2 bg-m3-surface-container-highest rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-m3-primary rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </Card>

                <Card variant="outlined" className="p-5 flex items-center gap-4 bg-m3-surface">
                    <div className="w-12 h-12 rounded-full bg-m3-surface-variant text-m3-on-surface-variant flex items-center justify-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-m3-on-surface-variant uppercase tracking-wider mb-1">読了状況</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-m3-on-surface">{readCount}</span>
                            <span className="text-sm font-medium text-m3-outline">/ {totalCount} マニュアル</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* M3 Search & Filter */}
            <div className="space-y-4">
                <div className="max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-m3-on-surface-variant" size={20} />
                        <input
                            type="text"
                            placeholder="キーワードで検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-m3-surface-container-highest rounded-full border-none focus:ring-2 focus:ring-m3-primary text-m3-on-surface placeholder-m3-outline transition-shadow"
                        />
                    </div>
                </div>

                {/* Filter Chips (Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant={selectedCategory === '' ? 'filled' : 'outlined'}
                        size="sm"
                        onClick={() => setSelectedCategory('')}
                        className="rounded-lg whitespace-nowrap"
                    >
                        すべて
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'filled' : 'outlined'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="rounded-lg whitespace-nowrap"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Manual Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredManuals.map((manual) => (
                    <Link key={manual.id} to={`/manuals/${manual.id}`}>
                        <Card variant="elevated" className="h-full group hover:shadow-m3-2 transition-all duration-300">
                            <div className="p-5 flex flex-col h-full relative">
                                <div className="flex items-start justify-between mb-4">
                                    <Badge variant="neutral" className="bg-m3-secondary-container text-m3-on-secondary-container">
                                        {manual.category}
                                    </Badge>
                                    {manual.isRead ? (
                                        <CheckCircle2 className="text-m3-primary" size={24} />
                                    ) : (
                                        <Circle className="text-m3-outline-variant group-hover:text-m3-primary transition-colors" size={24} />
                                    )}
                                </div>

                                <div className="flex-1 mb-4">
                                    <h3 className="text-lg font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors line-clamp-2 leading-snug">
                                        {manual.title}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-m3-outline-variant/20">
                                    <div className="w-8 h-8 rounded-full bg-m3-surface-variant flex items-center justify-center text-m3-on-surface-variant text-xs font-bold">
                                        <FileText size={14} />
                                    </div>
                                    <div className="flex flex-col text-xs text-m3-outline">
                                        <span className="font-medium text-m3-on-surface-variant">{manual.authorName}</span>
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            <span>{new Date(manual.createdAt).toLocaleDateString('ja-JP')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredManuals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-m3-surface-variant rounded-full flex items-center justify-center mb-6">
                        <Search className="text-m3-outline" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-m3-on-surface">マニュアルが見つかりません</h3>
                    <p className="text-m3-on-surface-variant mt-2">
                        検索条件を変更して再度お試しください
                    </p>
                </div>
            )}
        </div>
    );
}
