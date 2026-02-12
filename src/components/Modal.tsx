import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  showActions?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmText = 'Confirm',
  onConfirm,
  cancelText = 'Cancel',
  showActions = true
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl",
          "dark:border-slate-700 dark:bg-slate-800"
        )}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <div className="mb-6">
          {children}
        </div>
        
        {showActions && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium",
                "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                "dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              )}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600",
                "dark:bg-red-600 dark:hover:bg-red-700"
              )}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}