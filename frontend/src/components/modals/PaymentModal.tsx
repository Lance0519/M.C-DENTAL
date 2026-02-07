import { useState, useEffect } from 'react';
import type { Appointment } from '@/types/dashboard';
import type { ServiceItem } from '@/types/user';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentAmount: number) => Promise<void>;
  appointment: Appointment | null;
  services: ServiceItem[];
  isLoading?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  services,
  isLoading: externalLoading = false
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  // Calculate suggested amount from service prices
  const suggestedAmount = appointment ? (() => {
    // Check if appointment has multiple services
    if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
      return appointment.services.reduce((sum, svc) => {
        const price = svc.price 
          ? (typeof svc.price === 'string' 
              ? parseFloat(svc.price.replace(/[^0-9.]/g, '')) 
              : Number(svc.price))
          : 0;
        return sum + price;
      }, 0);
    }
    
    // Single service - try to get from services list
    const serviceId = appointment.serviceId;
    if (serviceId) {
      const service = services.find((s) => String(s.id) === String(serviceId));
      if (service?.price) {
        return typeof service.price === 'string'
          ? parseFloat(service.price.replace(/[^0-9.]/g, ''))
          : Number(service.price);
      }
    }
    return 0;
  })() : 0;

  useEffect(() => {
    if (isOpen && appointment) {
      // Set suggested amount when modal opens
      if (suggestedAmount > 0) {
        setPaymentAmount(suggestedAmount.toFixed(2));
      } else {
        setPaymentAmount('');
      }
      setError('');
    }
  }, [isOpen, appointment, suggestedAmount]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid payment amount (0 or greater)');
      return;
    }

    try {
      setInternalLoading(true);
      await onConfirm(amount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete appointment');
    } finally {
      setInternalLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const serviceName = appointment.services?.map((s) => s.serviceName).join(', ') || 
                      appointment.serviceName || 
                      'Service';
  const patientName = appointment.patientName || 
                      appointment.patientFullName || 
                      appointment.walkInName || 
                      appointment.walkInFullName || 
                      'Patient';
  const appointmentDate = appointment.date 
    ? new Date(appointment.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-md p-4 transition-all duration-200"
      aria-modal="true"
      aria-labelledby="payment-title"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border-2 border-gray-300 dark:border-gray-600 ring-1 ring-gray-200 dark:ring-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id="payment-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Mark Appointment as Completed
          </h2>
          
          {/* Appointment Details */}
          <div className="mb-6 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Patient:</span>
              <span>{patientName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">Service:</span>
              <span>{serviceName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Date:</span>
              <span>{appointmentDate} at {appointment.time}</span>
            </div>
            {suggestedAmount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suggested amount: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(suggestedAmount)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Payment Amount Input */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Amount (₱)
              </label>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !paymentAmount}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Processing...' : 'Complete Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

