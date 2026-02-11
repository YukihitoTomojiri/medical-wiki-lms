import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = '削除する',
    cancelLabel = 'キャンセル',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Scrim (M3 overlay) */}
            <div
                className="absolute inset-0 bg-m3-on-surface/32 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog — M3 Extra Large shape (28px) */}
            <div className="relative bg-m3-surface-container-high rounded-m3-xl shadow-m3-3 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-m3-error-container rounded-full">
                            <AlertTriangle className="text-m3-error" size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-m3-on-surface">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 text-m3-on-surface-variant hover:bg-m3-on-surface/8 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                    <p className="text-m3-on-surface-variant text-sm font-medium leading-relaxed">{message}</p>
                </div>

                {/* Actions — M3: right-aligned, pill-shaped buttons */}
                <div className="flex justify-end gap-2 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2.5 text-m3-primary font-medium rounded-full hover:bg-m3-primary/5 transition-colors disabled:opacity-50 text-sm"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-m3-error text-m3-on-error font-medium rounded-full hover:shadow-m3-1 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                処理中...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
