import { Modal } from '@/components/modals/Modal';

interface AppointmentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentDetails: {
    patientName: string;
    serviceName: string;
    dentistName: string;
    date: string;
    time: string;
    isGuest?: boolean;
  };
}

export function AppointmentSuccessModal({
  isOpen,
  onClose,
  appointmentDetails,
}: AppointmentSuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 flex items-center justify-center shadow-lg">
            <svg
              className="w-12 h-12 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Appointment Booked Successfully!
          </h2>
        </div>

        {/* Appointment Details */}
        <div className="bg-gray-50 dark:bg-black-800 rounded-lg p-6 space-y-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Patient:</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {appointmentDetails.patientName}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Service:</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {appointmentDetails.serviceName}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Dentist:</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {appointmentDetails.dentistName}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Date:</span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              {appointmentDetails.date}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Time:</span>
            <span className="text-base font-bold text-gold-600 dark:text-gold-400">
              {appointmentDetails.time}
            </span>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            We'll confirm your appointment shortly.
          </p>
          {appointmentDetails.isGuest && (
            <p className="text-gray-500 dark:text-gray-500 text-xs italic">
              Note: A patient record has been created for you.
            </p>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 uppercase tracking-wide"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

