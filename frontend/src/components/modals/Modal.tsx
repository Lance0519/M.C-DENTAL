import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  zIndex?: number;
  position?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '', zIndex = 50, position = 'center' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleBackdrop = (e: MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    backdropRef.current?.addEventListener('click', handleBackdrop);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      backdropRef.current?.removeEventListener('click', handleBackdrop);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const positionClasses = {
    center: 'items-center justify-center',
    'top-right': 'items-start justify-end',
    'top-left': 'items-start justify-start',
    'bottom-right': 'items-end justify-end',
    'bottom-left': 'items-end justify-start'
  };

  const modalPositionClasses = {
    center: '',
    'top-right': 'mt-16 md:mt-20 mr-2 md:mr-4',
    'top-left': 'mt-16 md:mt-20 ml-2 md:ml-4',
    'bottom-right': 'mb-4 mr-2 md:mr-4',
    'bottom-left': 'mb-4 ml-2 md:ml-4'
  };

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 flex ${positionClasses[position]} bg-black/60 backdrop-blur-md p-2 md:p-4 transition-all duration-200`}
      style={{ zIndex }}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-black-900 rounded-lg shadow-2xl w-full ${sizeClasses[size]} ${modalPositionClasses[position]} ${className} max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] flex flex-col border border-gray-200 dark:border-gray-700`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-black-950 rounded-t-lg">
                <h2 id="modal-title" className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-white dark:bg-black-900 text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}

