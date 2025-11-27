import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppointments } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import api from '@/lib/api';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { AppointmentDetailsModal } from '@/components/modals/AppointmentDetailsModal';
import { Modal } from '@/components/modals/Modal';
import { filterAppointments } from '@/lib/appointment-filters';
import type { Appointment } from '@/types/dashboard';
import type { PatientProfile, DoctorProfile, ServiceItem } from '@/types/user';

export function AppointmentsTab() {
  const { appointments, loadAppointments, updateAppointment } = useAppointments();
  const { patients, loadPatients } = usePatients();
  const { services } = useServices();
  const { doctors } = useDoctors();
  
  const [isCalendarView, setIsCalendarView] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; appointmentId: string } | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [showRescheduleApprovalModal, setShowRescheduleApprovalModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  
  // Filters - matching legacy exactly
  const [dateFilter, setDateFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = getFilteredAppointments(
    appointments,
    dateFilter,
    serviceFilter,
    patientFilter,
    statusFilter
  );

  const handleCreateSuccess = () => {
    loadAppointments();
  };

  const handleConfirmAppointment = (appointmentId: string) => {
    setConfirmAction({ type: 'confirm', appointmentId });
    setShowConfirmModal(true);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setConfirmAction({ type: 'cancel', appointmentId });
    setShowConfirmModal(true);
  };

  const handleApproveCancellation = (appointmentId: string) => {
    setConfirmAction({ type: 'approve_cancellation', appointmentId });
    setShowConfirmModal(true);
  };

  const handleRejectCancellation = (appointmentId: string) => {
    setConfirmAction({ type: 'reject_cancellation', appointmentId });
    setShowConfirmModal(true);
  };

  const handleApproveReschedule = (appointmentId: string) => {
    const apt = appointments.find((a) => String(a.id) === String(appointmentId));
    if (apt) {
      setRescheduleAppointment(apt);
      setShowRescheduleApprovalModal(true);
    }
  };

  const handleRejectReschedule = (appointmentId: string) => {
    setConfirmAction({ type: 'reject_reschedule', appointmentId });
    setShowConfirmModal(true);
  };

  const executeRescheduleApproval = async () => {
    if (!rescheduleAppointment) return;
    
    setRescheduleLoading(true);
    try {
      const requestedDate = rescheduleAppointment.rescheduleRequestedDate;
      const requestedTime = rescheduleAppointment.rescheduleRequestedTime;
      
      if (!requestedDate || !requestedTime) {
        throw new Error('Missing reschedule request details');
      }

      const result = await updateAppointment(rescheduleAppointment.id, {
        date: requestedDate,
        time: requestedTime,
        rescheduleRequested: false,
        rescheduleRequestedDate: null as any,
        rescheduleRequestedTime: null as any,
      });
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to approve reschedule');
      }
      
      await loadAppointments();
      setShowRescheduleApprovalModal(false);
      setRescheduleAppointment(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to approve reschedule');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCompleteAppointment = (appointmentId: string) => {
    setConfirmAction({ type: 'complete', appointmentId });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      const appointment = appointments.find(
        (apt) => String(apt.id) === String(confirmAction.appointmentId),
      );
      if (!appointment) {
        alert('Appointment not found');
        return;
      }

      if (confirmAction.type === 'confirm') {
        const newPatientId = await createOrFindPatientRecord(appointment, patients, loadPatients);
        const updates: Partial<Appointment> = {
          status: 'confirmed',
          services: appointment.services,
        };
        if (newPatientId) {
          updates.patientId = newPatientId;
        }
        const result = await updateAppointment(appointment.id, updates);
        if (!result.success) throw new Error(result.message || 'Failed to confirm appointment');

        const serviceId =
          appointment.services?.[0]?.serviceId ?? (appointment.serviceId as string | undefined);
        const serviceName =
          appointment.services?.map((s) => s.serviceName).join(', ') ||
          services.find((s) => String(s.id) === String(serviceId))?.name ||
          'dental service';
        const patientId = updates.patientId ?? appointment.patientId;

        if (patientId) {
          await api.createMedicalHistory({
            patientId: String(patientId),
            serviceId: serviceId ? String(serviceId) : undefined,
            doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
            date: appointment.date || (appointment as any).appointmentDate || '',
            time: appointment.time || (appointment as any).appointmentTime || '',
            treatment: appointment.notes || `Confirmed appointment for ${serviceName}`,
            remarks: `Appointment confirmed on ${new Date().toLocaleDateString()}`,
          });
        }
      } else if (confirmAction.type === 'cancel') {
        const result = await updateAppointment(appointment.id, { status: 'cancelled' });
        if (!result.success) throw new Error(result.message);
      } else if (confirmAction.type === 'approve_cancellation') {
        const result = await updateAppointment(appointment.id, { status: 'cancelled' });
        if (!result.success) throw new Error(result.message);
      } else if (confirmAction.type === 'reject_cancellation') {
        const currentStatus = appointment.status || 'pending';
        const previousStatus = (currentStatus as string) === 'cancellation_requested' 
          ? (appointment.patientId ? 'confirmed' : 'pending')  // Default to confirmed if patient exists, else pending
          : currentStatus;
        const result = await updateAppointment(appointment.id, {
          status: previousStatus as Appointment['status'],
        });
        if (!result.success) throw new Error(result.message);
      } else if (confirmAction.type === 'reject_reschedule') {
        const result = await updateAppointment(appointment.id, {
          rescheduleRequested: false,
          rescheduleRequestedDate: null as any,
          rescheduleRequestedTime: null as any,
        });
        if (!result.success) throw new Error(result.message);
      } else if (confirmAction.type === 'complete') {
        const result = await updateAppointment(appointment.id, { status: 'completed' });
        if (!result.success) throw new Error(result.message);

        const serviceId =
          appointment.services?.[0]?.serviceId ?? (appointment.serviceId as string | undefined);
        const serviceName =
          appointment.services?.map((s) => s.serviceName).join(', ') ||
          services.find((s) => String(s.id) === String(serviceId))?.name ||
          'dental service';
        const patientId = appointment.patientId;

        if (patientId) {
          const history = await api.getMedicalHistory(String(patientId));
          const appointmentDate = appointment.date || (appointment as any).appointmentDate || '';
          const appointmentTime = appointment.time || (appointment as any).appointmentTime || '';

          const hasExistingRecord = Array.isArray(history)
            ? history.some(
                (record: any) =>
                  record.date === appointmentDate &&
                  record.time === appointmentTime &&
                  (record.serviceId === String(serviceId ?? '') ||
                    record.serviceName === serviceName) &&
                  (record.doctorId === String(appointment.doctorId || '') ||
                    record.doctorName ===
                      doctors.find((d) => String(d.id) === String(appointment.doctorId))?.name),
              )
            : false;

          if (!hasExistingRecord) {
            await api.createMedicalHistory({
              patientId: String(patientId),
              serviceId: serviceId ? String(serviceId) : undefined,
              doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
              date: appointmentDate,
              time: appointmentTime,
              treatment: appointment.notes || `Completed appointment for ${serviceName}`,
              remarks: `Appointment completed on ${new Date().toLocaleDateString()}`,
            });
          }
        }
      }

      await loadAppointments();
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Calculate statistics
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled' || a.status === 'cancellation_requested').length,
  };

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track all patient appointments</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-black shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Appointment
          </button>
          <button
            onClick={() => setIsCalendarView(!isCalendarView)}
            className="px-6 py-3 text-sm font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-black-700 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCalendarView ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )}
            </svg>
            {isCalendarView ? 'List View' : 'Calendar View'}
          </button>
          <button
            onClick={loadAppointments}
            className="px-6 py-3 text-sm font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-black-700 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!isCalendarView && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Appointments</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-5 border-2 border-yellow-200 dark:border-yellow-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-700 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5 border-2 border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-5 border-2 border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-5 border-2 border-red-200 dark:border-red-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Cancelled</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{stats.cancelled}</p>
              </div>
              <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-700 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl p-6 mb-6 border-2 border-gray-200 dark:border-gray-700 shadow-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 font-semibold bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm transition-all"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Service
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 font-semibold bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm transition-all"
            >
              <option value="all">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patient
            </label>
            <input
              type="text"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              placeholder="Search patient..."
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 font-semibold bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 font-semibold bg-white dark:bg-black-800 text-gray-900 dark:text-white shadow-sm transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="cancellation_requested">Cancellation Requested</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {isCalendarView ? (
        <CalendarView
          appointments={filteredAppointments}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={(direction) => {
            let newMonth = currentMonth + direction;
            let newYear = currentYear;
            if (newMonth < 0) {
              newMonth = 11;
              newYear--;
            } else if (newMonth > 11) {
              newMonth = 0;
              newYear++;
            }
            setCurrentMonth(newMonth);
            setCurrentYear(newYear);
          }}
          onDateClick={(date, dateAppointments) => {
            setSelectedDate(date);
            setSelectedDateAppointments(dateAppointments);
            setShowDateModal(true);
          }}
          onCreateAppointment={() => {
            setShowCreateModal(true);
            // Set date in modal when implemented
          }}
        />
      ) : (
        <AppointmentsListView
          appointments={filteredAppointments}
          patients={patients}
          doctors={doctors}
          services={services}
          onConfirm={handleConfirmAppointment}
          onCancel={handleCancelAppointment}
          onComplete={handleCompleteAppointment}
          onViewDetails={(apt) => setSelectedAppointment(apt)}
          onApproveCancellation={handleApproveCancellation}
          onRejectCancellation={handleRejectCancellation}
          onApproveReschedule={handleApproveReschedule}
          onRejectReschedule={handleRejectReschedule}
        />
      )}

      <AppointmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={executeConfirmAction}
        title={
          confirmAction?.type === 'confirm'
            ? 'Confirm Appointment'
            : confirmAction?.type === 'complete'
            ? 'Mark as Completed'
            : confirmAction?.type === 'approve_cancellation'
            ? 'Approve Cancellation'
            : confirmAction?.type === 'reject_cancellation'
            ? 'Reject Cancellation Request'
            : confirmAction?.type === 'reject_reschedule'
            ? 'Reject Reschedule Request'
            : 'Cancel Appointment'
        }
        message={
          confirmAction?.type === 'confirm'
            ? 'Are you sure you want to confirm this appointment?'
            : confirmAction?.type === 'complete'
            ? 'Are you sure you want to mark this appointment as completed?'
            : confirmAction?.type === 'approve_cancellation'
            ? 'Are you sure you want to approve this cancellation request? This action cannot be undone.'
            : confirmAction?.type === 'reject_cancellation'
            ? 'Are you sure you want to reject this cancellation request? The appointment will be restored to its previous status.'
            : confirmAction?.type === 'reject_reschedule'
            ? 'Are you sure you want to reject this reschedule request? The appointment will remain at its current date and time.'
            : 'Are you sure you want to cancel this appointment? This action cannot be undone.'
        }
        confirmText={
          confirmAction?.type === 'confirm'
            ? 'Confirm'
            : confirmAction?.type === 'complete'
            ? 'Mark as Completed'
            : confirmAction?.type === 'approve_cancellation'
            ? 'Yes, Approve'
            : confirmAction?.type === 'reject_cancellation'
            ? 'Yes, Reject'
            : 'Yes, Cancel'
        }
        variant={
          confirmAction?.type === 'cancel' || confirmAction?.type === 'approve_cancellation'
            ? 'danger'
            : confirmAction?.type === 'reject_cancellation'
            ? 'warning'
            : 'info'
        }
      />

      {/* Date Appointments Modal */}
      <DateAppointmentsModal
        isOpen={showDateModal}
        onClose={() => {
          setShowDateModal(false);
          setSelectedDate(null);
          setSelectedDateAppointments([]);
        }}
        date={selectedDate}
        appointments={selectedDateAppointments}
        patients={patients}
        services={services}
        doctors={doctors}
        onViewDetails={(apt) => {
          setSelectedAppointment(apt);
          setShowDateModal(false);
        }}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        patients={patients}
        doctors={doctors}
        services={services}
        updateAppointment={updateAppointment}
        onUpdate={() => {
          loadAppointments();
          setSelectedAppointment(null);
        }}
      />

      {/* Reschedule Approval Modal */}
      <Modal
        isOpen={showRescheduleApprovalModal}
        onClose={() => {
          setShowRescheduleApprovalModal(false);
          setRescheduleAppointment(null);
        }}
        title="Approve Reschedule Request"
        size="md"
      >
        {rescheduleAppointment && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Patient</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {patients.find(p => p.id === rescheduleAppointment.patientId)?.fullName || 
                 rescheduleAppointment.patientName || 'Unknown Patient'}
              </p>
            </div>

            {/* Current vs Requested Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Schedule */}
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="font-semibold text-red-700 dark:text-red-300">Current Schedule</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(rescheduleAppointment.date || '').toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rescheduleAppointment.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requested Schedule */}
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-semibold text-green-700 dark:text-green-300">Requested Schedule</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rescheduleAppointment.rescheduleRequestedDate ? 
                        new Date(rescheduleAppointment.rescheduleRequestedDate).toLocaleDateString('en-US', { 
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rescheduleAppointment.rescheduleRequestedTime || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow indicating change */}
            <div className="flex justify-center">
              <div className="bg-gold-100 dark:bg-gold-900/30 rounded-full p-2">
                <svg className="w-6 h-6 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">Confirm Reschedule</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Approving this request will update the appointment to the new date and time. The patient will be notified of the change.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowRescheduleApprovalModal(false);
                  setRescheduleAppointment(null);
                }}
                disabled={rescheduleLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeRescheduleApproval}
                disabled={rescheduleLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {rescheduleLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Date Appointments Modal Component
function DateAppointmentsModal({
  isOpen,
  onClose,
  date,
  appointments,
  patients,
  services,
  doctors,
  onViewDetails,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  appointments: Appointment[];
  patients: PatientProfile[];
  services: ServiceItem[];
  doctors: DoctorProfile[];
  onViewDetails: (apt: Appointment) => void;
}) {
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getPatientDisplayName = (apt: Appointment): string => {
    const patientIdStr = typeof apt.patientId === 'string' ? apt.patientId : apt.patientId ? String(apt.patientId) : '';
    const isGuest = patientIdStr.startsWith('guest_appointment');
    const isWalkin = patientIdStr.startsWith('walkin_');

    if (isGuest || isWalkin) {
      const notesMatch = apt.notes?.match(/(?:GUEST|WALK-IN) PATIENT[\s\S]*?Name:\s*([^\r\n]+)/i);
      return notesMatch ? notesMatch[1].trim() : isGuest ? 'Guest Patient' : 'Walk-in Patient';
    }

    const patient = patients.find((p) => String(p.id) === patientIdStr);
    return patient?.fullName || apt.patientName || apt.patientFullName || 'Unknown';
  };

  const getServiceName = (apt: Appointment): string => {
    if (apt.serviceName) return apt.serviceName;
    if (apt.serviceId) {
      const service = services.find((s) => s.id === apt.serviceId);
      if (service) return service.name;
      if (apt.serviceId === 'srv001') return 'Consultation';
    }
    return 'Service';
  };

  const getDoctorName = (apt: Appointment): string => {
    let name = '';
    if (apt.doctorName) {
      name = apt.doctorName;
    } else if (apt.doctorId) {
      const doctor = doctors.find((d) => d.id === apt.doctorId);
      name = doctor ? doctor.name : 'Unknown';
    } else {
      name = 'Unknown';
    }
    // Remove "Dr." prefix if it exists to avoid duplication
    return name.startsWith('Dr. ') ? name.substring(4) : name.startsWith('Dr.') ? name.substring(3) : name;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-500', text: 'text-white', label: 'Confirmed' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      cancellation_requested: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Cancellation Pending' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = a.time || (a as any).appointmentTime || '00:00';
    const timeB = b.time || (b as any).appointmentTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Appointments - ${formatDate(date)}`} size="xl">
      <div className="space-y-4">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No appointments scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((apt) => {
              const patientName = getPatientDisplayName(apt);
              const serviceName = getServiceName(apt);
              const doctorName = getDoctorName(apt);
              const appointmentTime = apt.time || (apt as any).appointmentTime;
              const patientIdStr = typeof apt.patientId === 'string' ? apt.patientId : apt.patientId ? String(apt.patientId) : '';
              const isGuest = patientIdStr.startsWith('guest_appointment');
              const isWalkin = patientIdStr.startsWith('walkin_');

              return (
                <div
                  key={apt.id}
                  onClick={() => onViewDetails(apt)}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-md border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500 transition-all p-5 cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatTime(appointmentTime)}</div>
                        {getStatusBadge(apt.status || 'pending')}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{patientName}</span>
                          {(isGuest || isWalkin) && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold">
                              {isGuest ? 'Guest' : 'Walk-in'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">{serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">Dr. {doctorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Helper function to create or find patient record - matching legacy logic exactly
async function createOrFindPatientRecord(
  appointment: Appointment,
  patients: PatientProfile[],
  reloadPatients: () => Promise<void> | void,
): Promise<string | null> {
  const patientIdStr =
    typeof appointment.patientId === 'string'
      ? appointment.patientId
      : String(appointment.patientId || '');
  const isGuest = patientIdStr.startsWith('guest_appointment');
  const isWalkin = patientIdStr.startsWith('walkin_');

  if (!isGuest && !isWalkin) {
    return null; // Already a registered patient
  }

  // Extract patient info from notes
  let patientName = '';
  let patientAge = '';
  let patientContact = '';
  let patientEmail = '';

  if (appointment.notes) {
    if (isGuest) {
      const guestMatch = appointment.notes.match(/GUEST PATIENT[\s\S]*?Name:\s*([^\r\n]+)(?:[\s\S]*?Age:\s*([^\r\n]+))?(?:[\s\S]*?Contact:\s*([^\r\n]+))?(?:[\s\S]*?Email:\s*([^\r\n]+))?/i);
      if (guestMatch) {
        patientName = guestMatch[1]?.trim() || '';
        patientAge = guestMatch[2]?.trim() || '';
        patientContact = guestMatch[3]?.trim() || '';
        patientEmail = guestMatch[4]?.trim() || '';
      }
    } else if (isWalkin) {
      const walkinMatch = appointment.notes.match(/WALK-IN PATIENT[\s\S]*?Name:\s*([^\r\n]+)(?:[\s\S]*?Age:\s*([^\r\n]+))?(?:[\s\S]*?Contact:\s*([^\r\n]+))?(?:[\s\S]*?Email:\s*([^\r\n]+))?/i);
      if (walkinMatch) {
        patientName = walkinMatch[1]?.trim() || '';
        patientAge = walkinMatch[2]?.trim() || '';
        patientContact = walkinMatch[3]?.trim() || '';
        patientEmail = walkinMatch[4]?.trim() || '';
      }
    }
  }

  if (!patientName) {
    return null; // Cannot create patient without name
  }

  // Check if patient already exists by name and contact
  const existingPatient = patients.find(
    (p) => p.fullName.toLowerCase() === patientName.toLowerCase() && 
           (patientContact ? p.phone === patientContact : true)
  );

  if (existingPatient) {
    return existingPatient.id;
  }

  // Create new patient record
  const nameParts = patientName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  let dateOfBirth = '';
  if (patientAge) {
    const ageNum = parseInt(patientAge);
    if (!isNaN(ageNum)) {
      const today = new Date();
      const birthYear = today.getFullYear() - ageNum;
      dateOfBirth = `${birthYear}-01-01`;
    }
  }

  const newPatient = {
    fullName: patientName,
    firstName,
    lastName,
    phone: patientContact || '',
    email: patientEmail || '',
    dateOfBirth,
  };

  const usernameBase = `${firstName || 'guest'}${Date.now()}`.replace(/\s+/g, '').toLowerCase();
  const email =
    patientEmail && patientEmail.includes('@')
      ? patientEmail
      : `${usernameBase}@guest.local`.toLowerCase();

  try {
    const response = await api.createPatient({
      username: usernameBase,
      password: 'patient123',
      fullName: newPatient.fullName,
      email,
      phone: newPatient.phone,
      dateOfBirth: newPatient.dateOfBirth || undefined,
      address: '',
    });
    await reloadPatients();
    return (response as { id?: string })?.id ?? null;
  } catch (error) {
    console.error('Error creating patient record:', error);
    return null;
  }
}

function getFilteredAppointments(
  appointments: Appointment[],
  dateFilter: string,
  serviceFilter: string,
  patientFilter: string,
  statusFilter: string
): Appointment[] {
  return filterAppointments(appointments, {
    dateFilter: dateFilter as 'all' | 'today' | 'week' | 'month',
    serviceFilter,
    patientFilter,
    statusFilter,
  });
}

// Calendar View Component
function CalendarView({
  appointments,
  currentMonth,
  currentYear,
  onMonthChange,
  onDateClick,
  onCreateAppointment,
}: {
  appointments: Appointment[];
  currentMonth: number;
  currentYear: number;
  onMonthChange: (direction: number) => void;
  onDateClick: (date: string, appointments: Appointment[]) => void;
  onCreateAppointment: (date: string) => void;
}) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group appointments by date
  const appointmentsByDate = new Map<string, Appointment[]>();
  appointments.forEach((apt) => {
    let aptDate = apt.date || (apt as any).appointmentDate;
    if (!aptDate) return;

    // Normalize date format to YYYY-MM-DD (in case it includes time or is in different format)
    // Handle both string dates and Date objects
    if (typeof aptDate === 'string') {
      // Extract just the date part (YYYY-MM-DD) if it includes time
      aptDate = aptDate.split('T')[0].split(' ')[0];
    } else if (aptDate instanceof Date) {
      // Convert Date object to YYYY-MM-DD string
      const year = aptDate.getFullYear();
      const month = String(aptDate.getMonth() + 1).padStart(2, '0');
      const day = String(aptDate.getDate()).padStart(2, '0');
      aptDate = `${year}-${month}-${day}`;
    }

    const bucket = appointmentsByDate.get(aptDate);
    if (bucket) {
      bucket.push(apt);
    } else {
      appointmentsByDate.set(aptDate, [apt]);
    }
  });

  // Sort appointments by time
  appointmentsByDate.forEach((list) => {
    list.sort((a, b) => {
      const timeA = a.time || (a as any).appointmentTime || '00:00';
      const timeB = b.time || (b as any).appointmentTime || '00:00';
      return timeA.localeCompare(timeB);
    });
  });


  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-black-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-black-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-black-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Color Legend */}
      <div className="mb-4 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-600"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-600"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Cancelled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-600"></div>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Cancellation Requested</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {dayHeaders.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const currentDayDate = new Date(currentYear, currentMonth, day);
          currentDayDate.setHours(0, 0, 0, 0);
          const isToday = today.getTime() === currentDayDate.getTime();
          const isPast = currentDayDate < today && !isToday;

          const dayAppointments = appointmentsByDate.get(dateStr) || [];
          
          // Determine the dominant status for the day (priority: cancelled > completed > confirmed > pending > cancellation_requested)
          const getDayStatusColor = () => {
            if (dayAppointments.length === 0) return '';
            const statuses = dayAppointments.map(apt => apt.status || 'pending');
            if (statuses.includes('cancelled')) return 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-600';
            if (statuses.includes('completed')) return 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600';
            if (statuses.includes('confirmed')) return 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600';
            if (statuses.includes('cancellation_requested')) return 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600';
            if (statuses.includes('pending')) return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600';
            return '';
          };

          return (
            <div
              key={day}
              className={`
                aspect-square border rounded-lg p-2 cursor-pointer relative flex items-center justify-center
                hover:shadow-md transition-all
                ${isToday ? 'ring-2 ring-blue-400' : ''}
                ${isPast ? 'opacity-60' : ''}
                ${dayAppointments.length > 0 ? getDayStatusColor() : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-black-800 hover:bg-gray-50 dark:hover:bg-black-700'}
                ${dayAppointments.length === 0 && !isPast ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-black-800' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation();
                if (dayAppointments.length > 0) {
                  onDateClick(dateStr, dayAppointments);
                } else {
                  onCreateAppointment(dateStr);
                }
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <div className={`text-base md:text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : isPast ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
                  {day}
                </div>
                {dayAppointments.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-gold-500 to-gold-400 rounded-full shadow-md border-2 border-white">
                    {dayAppointments.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Appointments List View Component
function AppointmentsListView({
  appointments,
  patients,
  doctors,
  services,
  onConfirm,
  onCancel,
  onComplete,
  onViewDetails,
  onApproveCancellation,
  onRejectCancellation,
  onApproveReschedule,
  onRejectReschedule,
}: {
  appointments: Appointment[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  services: ServiceItem[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onViewDetails: (apt: Appointment) => void;
  onApproveCancellation: (id: string) => void;
  onRejectCancellation: (id: string) => void;
  onApproveReschedule: (id: string) => void;
  onRejectReschedule: (id: string) => void;
}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const getPatientDisplayName = (apt: Appointment): string => {
    const patientIdStr = typeof apt.patientId === 'string' ? apt.patientId : apt.patientId ? String(apt.patientId) : '';
    const isGuest = patientIdStr.startsWith('guest_appointment');
    const isWalkin = patientIdStr.startsWith('walkin_');

    if (isGuest || isWalkin) {
      const notesMatch = apt.notes?.match(/(?:GUEST|WALK-IN) PATIENT[\s\S]*?Name:\s*([^\r\n]+)/i);
      return notesMatch ? notesMatch[1].trim() : isGuest ? 'Guest Patient' : 'Walk-in Patient';
    }

    const patient = patients.find((p) => String(p.id) === patientIdStr);
    return patient?.fullName || apt.patientName || apt.patientFullName || 'Unknown';
  };

  const getServiceName = (apt: Appointment): string => {
    if (apt.serviceName) return apt.serviceName;
    if (apt.serviceId) {
      const service = services.find((s) => s.id === apt.serviceId);
      if (service) return service.name;
      if (apt.serviceId === 'srv001') return 'Consultation';
    }
    return 'Service';
  };

  const getDoctorName = (apt: Appointment): string => {
    let name = '';
    if (apt.doctorName) {
      name = apt.doctorName;
    } else if (apt.doctorId) {
      const doctor = doctors.find((d) => d.id === apt.doctorId);
      name = doctor ? doctor.name : 'Unknown';
    } else {
      name = 'Unknown';
    }
    // Remove "Dr." prefix if it exists to avoid duplication
    return name.startsWith('Dr. ') ? name.substring(4) : name.startsWith('Dr.') ? name.substring(3) : name;
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Appointments Found</h3>
        <p className="text-gray-600 dark:text-gray-400">No appointments match your current filters. Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Appointment Cards */}
      {appointments.map((apt) => {
        const patientName = getPatientDisplayName(apt);
        const patientIdStr = typeof apt.patientId === 'string' ? apt.patientId : apt.patientId ? String(apt.patientId) : '';
        const isGuest = patientIdStr.startsWith('guest_appointment');
        const isWalkin = patientIdStr.startsWith('walkin_');

        // Extract guest/walk-in details from notes (unused but kept for potential future use)
        // let guestDetails = null;
        if ((isGuest || isWalkin) && apt.notes) {
          const match = apt.notes.match(/(?:GUEST|WALK-IN) PATIENT[\s\S]*?Name:\s*([^\r\n]+)(?:[\s\S]*?Age:\s*([^\r\n]+))?(?:[\s\S]*?Contact:\s*([^\r\n]+))?/i);
          if (match) {
            // Details extracted but not currently used in UI
            // const name = match[1]?.trim() || '';
            // const age = match[2]?.trim() || '';
            // const contact = match[3]?.trim() || '';
            // let details = `${isGuest ? 'GUEST' : 'WALK-IN'} PATIENT Name: ${name}`;
            // if (age) details += ` Age: ${age}`;
            // if (contact) details += ` Contact: ${contact.substring(0, 15)}${contact.length > 15 ? '...' : ''}`;
          }
        }

        const appointmentDate = apt.date || (apt as any).appointmentDate;
        const appointmentTime = apt.time || (apt as any).appointmentTime;
        const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : 'N/A';
        const formattedTime = appointmentTime ? (() => {
          try {
            const [hours, minutes] = appointmentTime.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
          } catch {
            return appointmentTime;
          }
        })() : 'N/A';

        return (
          <div
            key={apt.id}
            onClick={() => onViewDetails(apt)}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-black-800 dark:to-black-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Card Header */}
            <div className={`bg-gradient-to-r px-6 py-4 rounded-t-xl ${
              apt.status === 'confirmed' ? 'from-blue-500 to-blue-400' :
              apt.status === 'pending' ? 'from-yellow-500 to-yellow-400' :
              apt.status === 'completed' ? 'from-green-500 to-green-400' :
              apt.status === 'cancellation_requested' ? 'from-orange-500 to-orange-400' :
              'from-red-500 to-red-400'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{formattedDate}</h3>
                    <p className="text-sm text-white/90">{formattedTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      apt.status === 'confirmed'
                        ? 'bg-white/20 text-white border-2 border-white/30'
                        : apt.status === 'pending'
                        ? 'bg-white/20 text-white border-2 border-white/30'
                        : apt.status === 'completed'
                        ? 'bg-white/20 text-white border-2 border-white/30'
                        : apt.status === 'cancellation_requested'
                        ? 'bg-white/20 text-white border-2 border-white/30'
                        : 'bg-white/20 text-white border-2 border-white/30'
                    }`}
                  >
                    {apt.status === 'cancellation_requested' 
                      ? 'CANCELLATION REQUESTED' 
                      : apt.status?.toUpperCase() || 'PENDING'}
                  </span>
                  {apt.rescheduleRequested && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white border-2 border-white/30">
                      RESCHEDULE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Patient Info */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase mb-1">Patient</p>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">{patientName}</p>
                    {(isGuest || isWalkin) && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold">
                        {isGuest ? 'Guest' : 'Walk-in'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-10 h-10 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase mb-1">Service</p>
                    <p className="text-sm font-bold text-green-900 dark:text-green-100 truncate">{getServiceName(apt)}</p>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase mb-1">Doctor</p>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100 truncate">Dr. {getDoctorName(apt)}</p>
                  </div>
                </div>
              </div>

              {/* Reschedule Request Info */}
              {apt.rescheduleRequested && (
                <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Reschedule Requested</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Current Date & Time</p>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200">{formattedDate} at {formattedTime}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Requested Date & Time</p>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-200">
                        {(apt as any).rescheduleRequestedDate 
                          ? new Date((apt as any).rescheduleRequestedDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'N/A'} at {(apt as any).rescheduleRequestedTime || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div 
                className="flex items-center justify-end gap-2 pt-4 border-t-2 border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(apt);
                    setOpenDropdown(null);
                  }}
                  className="px-4 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-gray-100 to-gray-50 dark:from-black-800 dark:to-black-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-black-700 dark:hover:to-black-600 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>
                
                <div 
                  className="relative" 
                  ref={(el) => { if (apt.id) buttonRefs.current[apt.id] = el; }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openDropdown === (apt.id ? String(apt.id) : null)) {
                        setOpenDropdown(null);
                        setDropdownPosition(null);
                        return;
                      }
                      const button = e.currentTarget;
                      const rect = button.getBoundingClientRect();
                      
                      // Simple positioning - always below the button, no auto-adjustment
                      const dropdownWidth = 240;
                      const gap = 4; // Gap between button and dropdown
                      
                      // Position dropdown directly below the button
                      const top = rect.bottom + gap;
                      
                      // Calculate horizontal position (align to right edge of button)
                      const left = rect.right - dropdownWidth;
                      
                      setDropdownPosition({ top, left });
                      setOpenDropdown(apt.id ? String(apt.id) : null);
                    }}
                    className="px-4 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-black border-2 border-gold-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Actions
                    <svg className={`w-4 h-4 transition-transform ${openDropdown === (apt.id ? String(apt.id) : null) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

              {openDropdown === (apt.id ? String(apt.id) : null) && dropdownPosition && (
                <>
                  {createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => {
                          setOpenDropdown(null);
                          setDropdownPosition(null);
                        }}
                      />
                      <div 
                        className="fixed bg-white dark:bg-black-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl z-[10000] min-w-[240px] max-w-[240px] overflow-hidden"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          maxHeight: `${Math.min(400, window.innerHeight - dropdownPosition.top - 10)}px`,
                          overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => {
                              onConfirm(apt.id ? String(apt.id) : '');
                              setOpenDropdown(null);
                              setDropdownPosition(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirm Appointment
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              onComplete(apt.id ? String(apt.id) : '');
                              setOpenDropdown(null);
                              setDropdownPosition(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark as Completed
                          </button>
                        )}
                        {apt.status === 'cancellation_requested' && (
                          <>
                            <button
                              onClick={() => {
                                onApproveCancellation(apt.id ? String(apt.id) : '');
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Approve Cancellation
                            </button>
                            <button
                              onClick={() => {
                                onRejectCancellation(apt.id ? String(apt.id) : '');
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject Cancellation
                            </button>
                          </>
                        )}
                        {apt.rescheduleRequested && (
                          <>
                            <button
                              onClick={() => {
                                onApproveReschedule(apt.id ? String(apt.id) : '');
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Approve Reschedule
                            </button>
                            <button
                              onClick={() => {
                                onRejectReschedule(apt.id ? String(apt.id) : '');
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject Reschedule
                            </button>
                          </>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && apt.status !== 'cancellation_requested' && !apt.rescheduleRequested && (
                          <button
                            onClick={() => {
                              onCancel(apt.id ? String(apt.id) : '');
                              setOpenDropdown(null);
                              setDropdownPosition(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    </>,
                    document.body
                  )}
                </>
              )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

