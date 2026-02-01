import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { User } from '../types';
import { ArrowLeft, Save, Eye, FileUp, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ManualEditProps {
    user: User;
}

export default function ManualEdit({ user }: ManualEditProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = !id;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
        if (id) {
            loadManual(parseInt(id));
        }
    }, [id]);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadManual = async (manualId: number) => {
        try {
            const data = await api.getManual(user.id, manualId);
            setTitle(data.title);
            setContent(data.content || '');
            setCategory(data.category);
            setOriginalPdfUrl(data.pdfUrl || null);
        } catch (error) {
            console.error('Failed to load manual:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = { title, content, category };
            let savedManual;
            if (isNew) {
                savedManual = await api.createManual(user.id, data);
            } else {
                savedManual = await api.updateManual(user.id, parseInt(id!), data);
            }

            if (pdfFile && savedManual) {
                await api.uploadPdf(user.id, savedManual.id, pdfFile);
            }

            navigate('/manuals');
        } catch (error) {
            console.error('Failed to save manual:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>戻る</span>
                </button>
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${showPreview
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Eye size={18} />
                    プレビュー
                </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {isNew ? '新規マニュアル作成' : 'マニュアル編集'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            タイトル
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            placeholder="マニュアルのタイトルを入力"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            カテゴリ
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            list="categories"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            placeholder="カテゴリを入力または選択"
                            required
                        />
                        <datalist id="categories">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PDF マニュアル (任意)
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                                <FileUp size={20} className="text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    {pdfFile ? pdfFile.name : 'PDFを選択'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                />
                            </label>
                            {pdfFile && (
                                <button
                                    type="button"
                                    onClick={() => setPdfFile(null)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                            )}
                            {originalPdfUrl && !pdfFile && (
                                <span className="text-xs text-gray-400">
                                    ※ 既に PDF が設定されています。変更する場合のみ選択してください。
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            本文（Markdown対応）
                        </label>
                        {showPreview ? (
                            <div className="min-h-[300px] p-4 rounded-xl border border-gray-200 bg-gray-50 markdown-content">
                                <ReactMarkdown>{content || '*プレビュー内容がありません*'}</ReactMarkdown>
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all min-h-[300px] font-mono text-sm"
                                placeholder="# 見出し&#10;&#10;本文を入力&#10;&#10;- リスト1&#10;- リスト2"
                                required={!pdfFile && !originalPdfUrl}
                            />
                        )}
                        {(pdfFile || originalPdfUrl) && (
                            <p className="mt-2 text-xs text-gray-400 font-sans">
                                ※ PDF がある場合、詳細画面では PDF が優先的に表示されます（Markdown は予備として保存されます）。
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-500/30 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={20} />
                                    保存
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
