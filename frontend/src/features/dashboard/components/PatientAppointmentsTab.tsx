import { useState, useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useDoctors } from '@/hooks/useDoctors';
import { BookingModal } from '@/features/booking/components/BookingModal';
import { RescheduleRequestModal } from '@/components/modals/RescheduleRequestModal';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import type { Appointment } from '@/types/dashboard';
import type { PatientProfile } from '@/types/user';

interface PatientAppointmentsTabProps {
  user: PatientProfile;
}

export function PatientAppointmentsTab({ user }: PatientAppointmentsTabProps) {
  const { appointments, loadAppointments, updateAppointment } = useAppointments();
  const { doctors } = useDoctors();
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Handle book appointment button click - BookingModal handles health screening
  const handleBookAppointment = () => {
    setShowBookModal(true);
  };

  // Filter appointments for current patient - matching legacy logic exactly
  const patientAppointments = appointments.filter((apt) => apt.patientId === user.id);

  // Get upcoming appointments - matching legacy logic
  // Include appointments with 'cancellation_requested' status so patient can see their request
  const upcomingAppointments = patientAppointments.filter((apt) => {
    const aptDate = apt.date || (apt as any).appointmentDate;
    if (!aptDate) return false;

    const appointmentDate = new Date(aptDate + ' ' + (apt.time || (apt as any).appointmentTime));
    const now = new Date();

    return (
      appointmentDate >= now &&
      apt.status !== 'cancelled' &&
      apt.status !== 'completed'
    );
  });

  // Get appointment history - matching legacy logic
  const appointmentHistory = patientAppointments
    .filter((apt) => {
      const aptDate = apt.date || (apt as any).appointmentDate;
      if (!aptDate) return false;

      const appointmentDate = new Date(aptDate + ' ' + (apt.time || (apt as any).appointmentTime));
      const now = new Date();

      // Include if appointment is in the past OR if it's completed, but exclude cancelled
      return apt.status !== 'cancelled' && (appointmentDate < now || apt.status === 'completed');
    })
    .sort((a, b) => {
      // Sort by date (newest first) - matching legacy logic
      const dateA = new Date((a.date || (a as any).appointmentDate) + ' ' + (a.time || (a as any).appointmentTime));
      const dateB = new Date((b.date || (b as any).appointmentDate) + ' ' + (b.time || (b as any).appointmentTime));
      return dateB.getTime() - dateA.getTime();
    });

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleCancel = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const handleReschedule = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSuccess = () => {
    if (!appointmentToReschedule) return;
    
    loadAppointments();
    setShowRescheduleModal(false);
    
    const appointmentDate = formatDate(appointmentToReschedule.date || (appointmentToReschedule as any).appointmentDate);
    const appointmentTime = formatTime(appointmentToReschedule.time || (appointmentToReschedule as any).appointmentTime);
    setSuccessMessage(
      `Reschedule request submitted successfully!\n\n` +
      `Service: ${getServiceName(appointmentToReschedule)}\n` +
      `Current Date: ${appointmentDate}\n` +
      `Current Time: ${appointmentTime}\n\n` +
      `Your reschedule request is pending staff/admin confirmation.`
    );
    setShowSuccessModal(true);
    setAppointmentToReschedule(null);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;

    // Request cancellation - status will be 'cancellation_requested' pending staff/admin confirmation
    const result = await updateAppointment(appointmentToCancel.id as string, { status: 'cancellation_requested' as any });
    if (result.success) {
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      loadAppointments();
      
      // Show success modal
      const appointmentDate = formatDate(appointmentToCancel.date || (appointmentToCancel as any).appointmentDate);
      const appointmentTime = formatTime(appointmentToCancel.time || (appointmentToCancel as any).appointmentTime);
      setSuccessMessage(
        `Cancellation request submitted successfully!\n\n` +
        `Service: ${getServiceName(appointmentToCancel)}\n` +
        `Date: ${appointmentDate}\n` +
        `Time: ${appointmentTime}\n\n` +
        `Your appointment cancellation is pending staff/admin confirmation.`
      );
      setShowSuccessModal(true);
    } else {
      alert(result.message || 'Failed to request cancellation');
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return 'N/A';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatStatus = (status: string): string => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      confirmed: 'bg-blue-500 dark:bg-blue-600 text-white',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      cancellation_requested: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    };

    return statusColors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  const getServiceName = (appointment: Appointment): string => {
    // Check for multiple services first
    if (appointment.services && appointment.services.length > 0) {
      return appointment.services.map(s => s.serviceName).join(', ');
    }
    // Fallback to single service (legacy)
    return appointment.serviceName || 'Service';
  };

  const getDoctorName = (appointment: Appointment): string => {
    let name = '';
    if (appointment.doctorName) {
      name = appointment.doctorName;
    } else {
      const doctor = doctors.find((d) => d.id === appointment.doctorId);
      name = doctor ? doctor.name : 'Unknown';
    }
    // Remove "Dr." prefix if it exists to avoid duplication
    return name.startsWith('Dr. ') ? name.substring(4) : name.startsWith('Dr.') ? name.substring(3) : name;
  };

  return (
    <div>
      {/* Header with Book Button - beautiful gold/white/black theme */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Appointments</h1>
        <button
          onClick={handleBookAppointment}
          className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
        >
          + Book Appointment
        </button>
      </div>

      {/* Upcoming Appointments Section - matching legacy layout */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gold-200 dark:border-gold-700 p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-4">No upcoming appointments</p>
            <button
              onClick={handleBookAppointment}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-400 dark:hover:border-gold-500 overflow-hidden transform hover:-translate-y-1"
              >
                {/* Appointment Card Header - gold accent */}
                <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-6 py-4 border-b-2 border-gold-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-black">{getServiceName(appointment)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formatStatus(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Appointment Card Body */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dr. {getDoctorName(appointment)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(appointment.date || (appointment as any).appointmentDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(appointment.time || (appointment as any).appointmentTime)}
                    </span>
                  </div>

                  {/* Notes Indicator */}
                  {appointment.notes && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400 italic">Has notes - Click "View Details" to read</span>
                    </div>
                  )}
                </div>

                {/* Appointment Card Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-black-800 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                  <button
                    onClick={() => handleViewDetails(appointment)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    View Details
                  </button>
                  {appointment.status !== 'cancelled' && 
                   appointment.status !== 'completed' && 
                   appointment.status !== 'cancellation_requested' && (
                    <div className="flex gap-2">
                      {!appointment.rescheduleRequested && (
                        <button
                          onClick={() => handleReschedule(appointment)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105"
                        >
                          Request Reschedule
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(appointment)}
                        className={`${appointment.rescheduleRequested ? 'w-full' : 'flex-1'} px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all transform hover:scale-105`}
                      >
                        Request Cancellation
                      </button>
                    </div>
                  )}
                  {appointment.status === 'completed' && (
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-center text-sm font-semibold">
                      This appointment is completed and cannot be modified
                    </div>
                  )}
                  {appointment.status === 'cancellation_requested' && (
                    <div className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-lg text-center font-semibold">
                      Cancellation Pending
                    </div>
                  )}
                  {appointment.rescheduleRequested && appointment.status !== 'cancellation_requested' && (
                    <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-center font-semibold">
                      Reschedule Request Pending
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment History Section - matching legacy layout */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Appointment History</h2>
        {appointmentHistory.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No appointment history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointmentHistory.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white dark:bg-black-900 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{getServiceName(appointment)}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dr. {getDoctorName(appointment)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${formatStatus(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatDate(appointment.date || (appointment as any).appointmentDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatTime(appointment.time || (appointment as any).appointmentTime)}
                      </span>
                    </div>
                  </div>

                  {/* Notes Indicator */}
                  {appointment.notes && (
                    <div className="flex items-center gap-2 mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400 italic">Has notes - Click "View Details" to read</span>
                    </div>
                  )}

                  {appointment.status === 'completed' && (
                    <div className="mb-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-center text-sm font-semibold">
                      This appointment is completed and cannot be modified
                    </div>
                  )}

                  <button
                    onClick={() => handleViewDetails(appointment)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Appointment Modal - Pre-select current patient (includes health screening) */}
      <BookingModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={() => {
          loadAppointments();
          setShowBookModal(false);
          // Show success message that appointment is pending confirmation
          setSuccessMessage(
            'Appointment booked successfully!\n\n' +
            'Your appointment is pending and waiting for staff/admin confirmation.\n\n' +
            'You will be notified once it is confirmed.'
          );
          setShowSuccessModal(true);
        }}
      />

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          getDoctorName={getDoctorName}
          getServiceName={getServiceName}
          formatDate={formatDate}
          formatTime={formatTime}
          formatStatus={formatStatus}
        />
      )}

      {/* Reschedule Request Modal */}
      <RescheduleRequestModal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setAppointmentToReschedule(null);
        }}
        appointment={appointmentToReschedule}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setAppointmentToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Request Cancellation"
        message={`Are you sure you want to request cancellation for this appointment?\n\nService: ${appointmentToCancel ? getServiceName(appointmentToCancel) : ''}\nDate: ${appointmentToCancel ? formatDate(appointmentToCancel.date || (appointmentToCancel as any).appointmentDate) : ''}\nTime: ${appointmentToCancel ? formatTime(appointmentToCancel.time || (appointmentToCancel as any).appointmentTime) : ''}\n\nYour cancellation request will be sent to staff/admin for confirmation.`}
        confirmText="Yes, Request Cancellation"
        cancelText="Keep Appointment"
        variant="danger"
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Request Submitted"
        message={successMessage}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
}

// Appointment Details Modal Component
function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  getDoctorName,
  getServiceName,
  formatDate,
  formatTime,
  formatStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  getDoctorName: (appointment: Appointment) => string;
  getServiceName: (appointment: Appointment) => string;
  formatDate: (date: string) => string;
  formatTime: (time: string) => string;
  formatStatus: (status: string) => string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
      <div className="space-y-6">
        {/* Service Information */}
        <div className="p-4 bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-600/30 dark:to-gold-500/30 rounded-lg border-2 border-gold-200 dark:border-gold-600">
          <h3 className="text-lg font-bold text-black dark:text-white mb-2">Service</h3>
          <p className="text-gray-900 dark:text-white font-semibold">{getServiceName(appointment)}</p>
        </div>

        {/* Doctor Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-black-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Dentist</h4>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Dr. {getDoctorName(appointment)}</p>
          </div>

          <div className="p-4 bg-white dark:bg-black-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${formatStatus(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Date and Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-black-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Date</h4>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatDate(appointment.date || (appointment as any).appointmentDate)}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-black-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Time</h4>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatTime(appointment.time || (appointment as any).appointmentTime)}
            </p>
          </div>
        </div>

        {/* Notes - Always visible */}
        <div className="p-4 bg-white dark:bg-black-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Notes</h4>
          {appointment.notes ? (
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-black-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {appointment.notes}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-black-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 border-dashed">
              No notes available for this appointment.
            </p>
          )}
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-700 mt-6">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

