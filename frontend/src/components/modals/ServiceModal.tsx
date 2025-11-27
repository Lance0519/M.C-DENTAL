import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ServiceItem } from '@/types/storage';
import { ServiceDurations } from '@/lib/service-durations';

type ServiceModalProps = {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ServiceModal({ service, isOpen, onClose }: ServiceModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!service || !isOpen) return null;

  const duration = ServiceDurations.getDuration(service);
  const durationText = ServiceDurations.minutesToTime(duration);
  const price = service.price ? service.price.replace(/\$/g, '₱') : 'Contact us for pricing';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/85 p-4 transition-opacity duration-300" 
      onClick={onClose}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div 
        className="relative bg-white dark:bg-black-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" 
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <button 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-none text-gray-600 dark:text-gray-300 text-xl cursor-pointer flex items-center justify-center transition-all hover:bg-gray-200 hover:rotate-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 z-10" 
          onClick={onClose}
        >
          ✕
        </button>
        <div className="p-6 sm:p-8 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gold-50/30 to-white dark:from-gold-900/30 dark:to-black-900 rounded-t-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 pr-10">{service.name}</h2>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{service.description || 'Professional dental care service tailored to your needs.'}</p>
          </div>

          <div className="mb-6 p-6 bg-gradient-to-br from-gold-50 to-gold-100/50 dark:from-gold-900/30 dark:to-gold-800/20 rounded-xl border-2 border-gold-200 dark:border-gold-700">
            <div className="flex justify-between items-center py-3 border-b border-gold-300/30 dark:border-gold-600/50 last:border-0">
              <span className="font-semibold text-gray-900 dark:text-gray-100">⏱️ Duration:</span>
              <span className="font-bold text-gold-600 dark:text-gold-400 text-lg">{durationText}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-semibold text-gray-900 dark:text-gray-100">💰 Price:</span>
              <span className="font-bold text-gold-600 dark:text-gold-400 text-xl">{price}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">What's Included</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span>Comprehensive evaluation and consultation</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span>Professional dental care by experienced dentists</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span>Modern equipment and techniques</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span>Follow-up care and support</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/book"
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/50 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
              onClick={onClose}
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

