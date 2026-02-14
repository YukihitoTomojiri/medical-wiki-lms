import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubmissionSuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Icon Area */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
                        <div className="relative bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center shadow-inner">
                            <CheckCircle className="text-emerald-500" size={48} />
                        </div>
                    </div>
                </div>

                {/* Message Area */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                        申請が完了しました
                    </h1>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        管理者の承認をお待ちください。<br />
                        承認状況はマイページ（申請一覧）からいつでも確認できます。
                    </p>
                </div>

                {/* Actions Area */}
                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={() => navigate('/my-dashboard')}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-gray-200"
                    >
                        <ArrowLeft size={18} />
                        マイページ（申請一覧）に戻る
                    </button>
                    <button
                        onClick={() => navigate('/manuals')}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                        <Home size={18} />
                        ホームに戻る
                    </button>
                </div>

                {/* Footer Tip */}
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Medivisor Application System
                </p>
            </div>
        </div>
    );
}
