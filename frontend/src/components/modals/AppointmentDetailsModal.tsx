import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from './Modal';
import { SuccessModal } from './SuccessModal';
import { ServiceDurations } from '@/lib/service-durations';
import { useAuthStore } from '@/store/auth-store';
import { useSchedules } from '@/hooks/useSchedules';
import api from '@/lib/api';
import type { Appointment } from '@/types/dashboard';
import type { PatientProfile, DoctorProfile, ServiceItem } from '@/types/user';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  services: ServiceItem[];
  onUpdate?: () => void;
  updateAppointment?: (id: string, updates: Partial<Appointment>) => Promise<{ success: boolean; message?: string }>;
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  patients,
  doctors,
  services,
  onUpdate,
  updateAppointment,
}: AppointmentDetailsModalProps) {
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editDoctorTime, setEditDoctorTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState<Appointment['status']>('pending');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [treatmentImages, setTreatmentImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Get current user from auth store
  const currentUser = useAuthStore((state) => state.user);
  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
  
  // Get schedules for time slot calculation
  const { schedules } = useSchedules();

  // Reset image state and success modal when modal opens/closes or appointment changes
  useEffect(() => {
    if (!isOpen) {
      setTreatmentImages([]);
      setImagePreviews([]);
      setUploadError(null);
      setShowSuccessModal(false);
      setSuccessMessage('');
      setPaymentAmount('');
    } else if (appointment) {
      // Initialize payment amount from appointment or calculate from services
      if ((appointment as any).paymentAmount !== undefined && (appointment as any).paymentAmount !== null) {
        setPaymentAmount(String((appointment as any).paymentAmount));
      } else {
        // Calculate estimated price from services
        let estimatedPrice = 0;
        if ((appointment as any).services && Array.isArray((appointment as any).services)) {
          estimatedPrice = (appointment as any).services.reduce((sum: number, svc: any) => {
            const svcItem = services.find((s) => String(s.id) === String(svc.serviceId));
            const svcPrice = svcItem?.price ? (typeof svcItem.price === 'string' ? parseFloat(svcItem.price.replace(/[^0-9.]/g, '')) : Number(svcItem.price)) : 0;
            return sum + svcPrice;
          }, 0);
        } else if (appointment.serviceId) {
          const service = services.find((s) => String(s.id) === String(appointment.serviceId));
          const price = service?.price ? (typeof service.price === 'string' ? parseFloat(service.price.replace(/[^0-9.]/g, '')) : Number(service.price)) : 0;
          estimatedPrice = price;
        }
        setPaymentAmount(estimatedPrice > 0 ? String(estimatedPrice) : '');
      }
      setEditStatus(appointment.status || 'pending');
    }
  }, [isOpen, appointment?.id, appointment, services]);

  // Define loadAvailableTimesForDoctor using useCallback so it can be used in useEffect
  // This must be defined before the early return to maintain hook order
  const loadAvailableTimesForDoctor = useCallback(async (doctorId: string, date: string, serviceName?: string, appointmentId?: string) => {
    if (!doctorId || !date) {
      setAvailableTimes([]);
      return;
    }

    try {
      const selectedDoctor = doctors.find(d => d.id === doctorId);
      if (!selectedDoctor || !selectedDoctor.available) {
        setAvailableTimes([]);
        return;
      }

      const serviceDuration = ServiceDurations.getDuration(serviceName || '');
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

      // Get doctor schedules from hook
      const daySchedules = schedules.filter((s: any) => {
        const scheduleDay = (s.day || s.dayOfWeek || '').toString();
        return s.doctorId === doctorId && scheduleDay === dayOfWeek;
      });

      if (daySchedules.length === 0) {
        setAvailableTimes([]);
        return;
      }

      const doctorSchedule = daySchedules[0];
      const startTime = doctorSchedule.startTime || '09:00';
      const endTime = doctorSchedule.endTime || '18:00';

      const allSlots = ServiceDurations.generateTimeSlots(startTime, endTime, 30);
      
      // Fetch appointments for conflict checking
      let appointmentsData: any[] = [];
      try {
        const response = await api.getAppointments({ doctor_id: doctorId, date, public: 'true' });
        appointmentsData = Array.isArray(response) ? response : (response as any)?.data ?? [];
      } catch {
        appointmentsData = [];
      }

      const availableSlots = allSlots.filter((slot) => {
        if (slot < startTime || slot >= endTime) {
          return false;
        }

        const slotEnd = ServiceDurations.addMinutesToTime(slot, serviceDuration);
        if (slotEnd > endTime) {
          return false;
        }

        return ServiceDurations.isTimeSlotAvailable(
          doctorId,
          date,
          slot,
          serviceDuration,
          appointmentsData,
          appointmentId || null,
          (id: string) => services.find(s => s.id === id)
        );
      });

      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Error loading available times:', error);
      setAvailableTimes([]);
    }
  }, [doctors, schedules, services]);

  // Load available times when editing doctor
  // This must be called before the early return to maintain hook order
  useEffect(() => {
    if (isEditingDoctor && editDoctorId && editDate && appointment) {
      const serviceName = (appointment as any).serviceName || (services.find(s => String(s.id) === String(appointment.serviceId))?.name);
      loadAvailableTimesForDoctor(editDoctorId, editDate, serviceName, appointment.id?.toString());
    }
  }, [editDoctorId, editDate, isEditingDoctor, appointment, services, loadAvailableTimesForDoctor]);

  if (!appointment) return null;

  const patient = appointment.patientId
    ? patients.find((p) => p.id === appointment.patientId)
    : null;

  const doctor = appointment.doctorId
    ? doctors.find((d) => d.id === appointment.doctorId)
    : null;

  const service = appointment.serviceId
    ? services.find((s) => s.id === appointment.serviceId)
    : null;

  // Handle guest/walk-in appointments
  const isGuest = appointment.patientId?.toString().startsWith('guest_appointment');
  const isWalkin = appointment.patientId?.toString().startsWith('walkin_');

  let patientDisplayName = 'Unknown';
  let patientContact = '';
  let patientEmail = '';

  if (isGuest || isWalkin) {
    // Extract guest/walk-in details from notes or appointment data
    patientDisplayName = appointment.walkInName || appointment.walkInFullName || appointment.patientName || 'Guest Patient';
    if (appointment.notes) {
      const phoneMatch = appointment.notes.match(/Phone:\s*([^\n]+)/i);
      const emailMatch = appointment.notes.match(/Email:\s*([^\n]+)/i);
      if (phoneMatch) patientContact = phoneMatch[1].trim();
      if (emailMatch) patientEmail = emailMatch[1].trim();
    }
  } else if (patient) {
    patientDisplayName = patient.fullName || `${patient.firstName} ${patient.lastName}`;
    patientContact = patient.phone || '';
    patientEmail = patient.email || '';
  }

  // Support multiple services
  let serviceName = 'N/A';
  let totalDuration = 0;
  
  if (appointment.services && appointment.services.length > 0) {
    // Multiple services
    serviceName = appointment.services.map(s => s.serviceName).join(', ');
    // Calculate total duration
    for (const serviceItem of appointment.services) {
      const svc = services.find(s => s.id === serviceItem.serviceId);
      if (svc) {
        totalDuration += ServiceDurations.getDuration(svc);
      }
    }
  } else {
    // Legacy: single service
    serviceName = (appointment as any).serviceName || service?.name || 'N/A';
    totalDuration = service ? ServiceDurations.getDuration(service) : 0;
  }
  
  const durationText = totalDuration > 0 ? ` (${ServiceDurations.minutesToTime(totalDuration)})` : '';

  const doctorName = doctor
    ? doctor.name?.startsWith('Dr. ')
      ? doctor.name.substring(4)
      : doctor.name?.startsWith('Dr.')
      ? doctor.name.substring(3)
      : doctor.name
    : 'Unknown';

  const appointmentDate = appointment.date || (appointment as any).appointmentDate || '';
  const appointmentTime = appointment.time || (appointment as any).appointmentTime || '';

  const formattedDate = appointmentDate
    ? new Date(appointmentDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const formattedTime = appointmentTime
    ? (() => {
        const [hours, minutes] = appointmentTime.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      })()
    : '';

  const getStatusBadge = (status: Appointment['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300`;
      case 'confirmed':
        return `${baseClasses} bg-blue-500 dark:bg-blue-600 text-white`;
      case 'completed':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
      case 'cancellation_requested':
        return `${baseClasses} bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300`;
    }
  };

  const handleUpdateDateTime = async () => {
    if (!appointment.id || !updateAppointment) return;

    setUpdating(true);
    try {
      // Validate date is not in the past
      const selectedDate = new Date(editDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        alert('Cannot schedule appointments in the past. Please select a future date.');
        setUpdating(false);
        return;
      }

      // Calculate total duration from all services
      let totalDuration = 0;
      if (appointment.services && appointment.services.length > 0) {
        for (const serviceItem of appointment.services) {
          const svc = services.find(s => s.id === serviceItem.serviceId.toString());
          if (svc) {
            totalDuration += ServiceDurations.getDuration(svc);
          }
        }
      } else {
        const service = services.find(s => s.id === String(appointment.serviceId || ''));
        totalDuration = ServiceDurations.getDuration(service || (appointment as any).serviceName || '');
      }
      
      // Fetch current appointments for conflict checking
      let appointmentsData: any[] = [];
      try {
        const response = await api.getAppointments({ doctor_id: String(appointment.doctorId || ''), date: editDate, public: 'true' });
        appointmentsData = Array.isArray(response) ? response : (response as any)?.data ?? [];
      } catch {
        appointmentsData = [];
      }
      
      const isAvailable = ServiceDurations.isTimeSlotAvailable(
        String(appointment.doctorId || ''),
        editDate,
        editTime,
        totalDuration,
        appointmentsData,
        String(appointment.id),
        (id: string) => services.find(s => s.id === id)
      );

      if (!isAvailable) {
        const doctor = doctors.find(d => d.id === String(appointment.doctorId || ''));
        const doctorName = doctor ? doctor.name : 'the selected dentist';
        alert(
          `The selected time slot conflicts with an existing appointment for ${doctorName}.\n\nThe selected service requires ${ServiceDurations.minutesToTime(totalDuration)}.\n\nPlease select a different time.`
        );
        setUpdating(false);
        return;
      }

      const updates: Partial<Appointment> = {
        date: editDate,
        time: editTime,
      };
      
      const result = await updateAppointment(String(appointment.id), updates);
      if (!result.success) {
        throw new Error(result.message || 'Failed to update appointment');
      }
      
      setIsEditingDateTime(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment date/time';
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditClick = () => {
    setIsEditingDateTime(true);
    setEditDate(appointmentDate);
    setEditTime(appointmentTime);
  };

  const handleEditDoctorClick = () => {
    setIsEditingDoctor(true);
    setEditDoctorId(appointment.doctorId?.toString() || '');
    setEditDoctorTime(appointmentTime);
    setEditDate(appointmentDate);
    const serviceName = (appointment as any).serviceName || (services.find(s => String(s.id) === String(appointment.serviceId))?.name);
    loadAvailableTimesForDoctor(appointment.doctorId?.toString() || '', appointmentDate, serviceName, appointment.id?.toString());
  };

  const handleUpdateDoctor = async () => {
    if (!appointment.id || !editDoctorId || !editDoctorTime || !updateAppointment) {
      alert('Please select a doctor and time');
      return;
    }

    setUpdating(true);
    try {
      const selectedDate = new Date(editDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        alert('Cannot schedule appointments in the past. Please select a future date.');
        setUpdating(false);
        return;
      }

      const serviceDuration = ServiceDurations.getDuration(service || (appointment as any).serviceName || '');
      
      // Fetch current appointments for conflict checking
      let appointmentsData: any[] = [];
      try {
        const response = await api.getAppointments({ doctor_id: editDoctorId, date: editDate, public: 'true' });
        appointmentsData = Array.isArray(response) ? response : (response as any)?.data ?? [];
      } catch {
        appointmentsData = [];
      }

      const isAvailable = ServiceDurations.isTimeSlotAvailable(
        editDoctorId,
        editDate,
        editDoctorTime,
        serviceDuration,
        appointmentsData,
        appointment.id.toString(),
        (id: string) => services.find(s => s.id === id)
      );

      if (!isAvailable) {
        alert('The selected time slot is not available. Please select a different time.');
        setUpdating(false);
        return;
      }

      const selectedDoctor = doctors.find(d => d.id === editDoctorId);
      const updates: Partial<Appointment> = {
        doctorId: editDoctorId,
        doctorName: selectedDoctor?.name || undefined,
        date: editDate,
        time: editDoctorTime,
      };

      const result = await updateAppointment(String(appointment.id), updates);
      if (!result.success) {
        throw new Error(result.message || 'Failed to update appointment');
      }
      
      setIsEditingDoctor(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment';
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!appointment.id || !updateAppointment) return;

    setUpdating(true);
    try {
      const updates: Partial<Appointment> = {
        notes: editNotes,
      };
      
      const result = await updateAppointment(String(appointment.id), updates);
      if (!result.success) {
        throw new Error(result.message || 'Failed to update appointment notes');
      }
      
      setIsEditingNotes(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update appointment notes:', error);
      alert('Failed to update appointment notes');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditNotesClick = () => {
    setIsEditingNotes(true);
    setEditNotes(appointment.notes || '');
  };

  // Helper function to check if patient already exists (matching AppointmentsTab logic)
  const findExistingPatient = (patientName: string, patientContact: string): PatientProfile | undefined => {
    return patients.find(
      (p) => p.fullName?.toLowerCase() === patientName.toLowerCase() && 
             (patientContact ? p.phone === patientContact : true)
    );
  };

  // Get valid status transitions based on current status
  const getValidStatusTransitions = (currentStatus: Appointment['status'], appointmentDate: string): Appointment['status'][] => {
    const validTransitions: Record<string, Appointment['status'][]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': [], // Cannot change from cancelled
      'cancellation_requested': ['cancelled', 'confirmed', 'pending'], // Can approve (cancelled) or reject (confirmed/pending)
    };
    
    let transitions = validTransitions[currentStatus] || [];
    
    // Allow completing appointments regardless of date
    // Removed date validation - appointments can be completed even if date hasn't passed
    
    return transitions;
  };

  // Unified save handler that saves all changes at once
  const handleSaveAllChanges = async () => {
    if (!appointment.id || !updateAppointment) return;

    setUpdating(true);
    setUploadError(null);
    const savedChanges: string[] = [];

    try {
      const oldStatus = appointment.status;
      const appointmentDate = appointment.date || '';
      const updates: Partial<Appointment> = {};

      // 1. Save status if changed
      if (isEditingStatus && editStatus !== oldStatus) {
        const validTransitions = getValidStatusTransitions(oldStatus, appointmentDate);
        if (!validTransitions.includes(editStatus)) {
          if (oldStatus === 'pending' && editStatus === 'completed') {
            alert('Invalid status transition.\n\nPending appointments must be confirmed first before marking as completed.\n\nPlease change status to "Confirmed" first.');
          } else {
            alert(`Invalid status transition. Cannot change from ${oldStatus} to ${editStatus}.`);
          }
          setUpdating(false);
          return;
        }

        updates.status = editStatus;
        
        // If changing to completed, require payment amount
        if (editStatus === 'completed' && oldStatus !== 'completed') {
          const paymentValue = parseFloat(paymentAmount);
          if (isNaN(paymentValue) || paymentValue < 0 || paymentAmount.trim() === '') {
            alert('Please enter a valid payment amount before marking the appointment as completed.\n\nThis amount will be used for revenue tracking.');
            setUpdating(false);
            return;
          }
          (updates as any).paymentAmount = paymentValue;
          (updates as any).completedAt = new Date().toISOString();
          savedChanges.push('payment');
        }
        
        // Also allow updating payment amount for already completed appointments
        if (oldStatus === 'completed' && isEditingStatus && paymentAmount.trim() !== '') {
          const paymentValue = parseFloat(paymentAmount);
          const currentPayment = (appointment as any).paymentAmount || 0;
          if (!isNaN(paymentValue) && paymentValue >= 0 && paymentValue !== currentPayment) {
            (updates as any).paymentAmount = paymentValue;
            if (!(appointment as any).completedAt) {
              (updates as any).completedAt = new Date().toISOString();
            }
            savedChanges.push('payment');
          }
        }
        
        savedChanges.push('status');
      }

      // 2. Save notes if changed
      if (isEditingNotes && editNotes !== (appointment.notes || '')) {
        updates.notes = editNotes;
        savedChanges.push('notes');
      }

      // 3. Update appointment if there are any changes
      if (Object.keys(updates).length > 0) {
        const result = await updateAppointment(String(appointment.id), updates);
        if (!result.success) {
          throw new Error(result.message || 'Failed to update appointment');
        }
        
        // Auto-create medical record when appointment is confirmed or completed
        if ((editStatus === 'confirmed' || editStatus === 'completed') && updates.status && oldStatus !== editStatus && appointment.patientId) {
          const aptDate = appointment.date || (appointment as any).appointmentDate || '';
          const aptTime = appointment.time || (appointment as any).appointmentTime || '';
          const aptService = services.find(s => s.id === String(appointment.serviceId || ''));
          const serviceName = aptService?.name || (appointment as any).serviceName || 'dental service';
          
          try {
            await api.createMedicalHistory({
              patientId: String(appointment.patientId),
              serviceId: appointment.serviceId ? String(appointment.serviceId) : undefined,
              doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
              date: aptDate,
              time: aptTime,
              treatment: appointment.notes || `Appointment ${editStatus === 'completed' ? 'completed' : 'confirmed'} for ${serviceName}`,
              remarks: `Appointment ${editStatus === 'completed' ? 'completed' : 'confirmed'} on ${new Date().toLocaleDateString()}`,
            });
          } catch (err) {
            console.error('Failed to create medical history record:', err);
          }
        }
      }

      // 4. Save images if any were added
      if (treatmentImages.length > 0 && appointment.patientId) {
        try {
          const imagePromises = treatmentImages.map((file) => compressImage(file));
          const imageUrls = await Promise.all(imagePromises);

          const aptDate = appointment.date || (appointment as any).appointmentDate || '';
          const aptTime = appointment.time || (appointment as any).appointmentTime || '';
          const aptService = services.find(s => s.id === String(appointment.serviceId || ''));
          const serviceName = aptService?.name || (appointment as any).serviceName || 'N/A';

          // Create medical history with images via API
          await api.createMedicalHistory({
            patientId: String(appointment.patientId),
            serviceId: appointment.serviceId ? String(appointment.serviceId) : undefined,
            doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
            date: aptDate,
            time: aptTime,
            treatment: appointment.notes || `Treatment session for ${serviceName}`,
            remarks: `Images uploaded on ${new Date().toLocaleDateString()}`,
            images: imageUrls,
          });

          savedChanges.push('images');
          setTreatmentImages([]);
          setImagePreviews([]);
        } catch (storageError: any) {
          if (storageError?.message?.includes('quota') || storageError?.message?.includes('QuotaExceededError')) {
            setUploadError(
              'Storage quota exceeded. The images are too large to save. ' +
              'Please try uploading fewer images or contact support to clear storage space.'
            );
          } else {
            throw storageError;
          }
        }
      }

      // Reset edit states
      if (savedChanges.includes('status')) {
        setIsEditingStatus(false);
      }
      if (savedChanges.includes('notes')) {
        setIsEditingNotes(false);
      }

      // Show success message immediately
      if (savedChanges.length > 0) {
        const changesList = savedChanges.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
        setSuccessMessage(`Successfully saved: ${changesList}`);
        setShowSuccessModal(true);
      } else {
        alert('No changes to save');
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      alert(errorMessage);
    } finally {
      setUpdating(false);
      setUploadingImages(false);
    }
  };

  // Keep individual handlers for backward compatibility but they now just set edit mode
  const handleUpdateStatus = async () => {
    // This is now handled by handleSaveAllChanges
    // But we keep it for the edit mode toggle
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);
    
    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setUploadError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name} is larger than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 images
    const remainingSlots = 5 - treatmentImages.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    setTreatmentImages((prev) => [...prev, ...filesToAdd]);

    // Create previews
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setTreatmentImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  // Compress image to reduce storage size
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, maxSizeKB: number = 500): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress with quality adjustment
          let quality = 0.85;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let sizeKB = (dataUrl.length * 3) / 4 / 1024; // Approximate size in KB

          // Reduce quality until size is acceptable
          while (sizeKB > maxSizeKB && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            sizeKB = (dataUrl.length * 3) / 4 / 1024;
          }

          if (sizeKB > maxSizeKB) {
            reject(new Error(`Image ${file.name} is too large even after compression (${sizeKB.toFixed(0)}KB). Please choose a smaller image.`));
            return;
          }

          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleSaveToMedicalHistory = async () => {
    if (!appointment.patientId || treatmentImages.length === 0) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      // Compress and convert images to base64
      const imagePromises = treatmentImages.map((file) => compressImage(file));
      const imageUrls = await Promise.all(imagePromises);

      // Get appointment details
      const appointmentDate = appointment.date || (appointment as any).appointmentDate || '';
      const appointmentTime = appointment.time || (appointment as any).appointmentTime || '';
      const aptService = services.find(s => s.id === String(appointment.serviceId || ''));
      const serviceName = aptService?.name || (appointment as any).serviceName || 'N/A';

      // Create new medical history record with images via API
      await api.createMedicalHistory({
        patientId: String(appointment.patientId),
        serviceId: appointment.serviceId ? String(appointment.serviceId) : undefined,
        doctorId: appointment.doctorId ? String(appointment.doctorId) : undefined,
        date: appointmentDate,
        time: appointmentTime,
        treatment: appointment.notes || `Treatment session for ${serviceName}`,
        remarks: `Treatment session images uploaded from appointment on ${new Date().toLocaleDateString()}`,
        images: imageUrls,
      });

      // Clear images after successful save
      setTreatmentImages([]);
      setImagePreviews([]);
      
      // Show success modal
      setSuccessMessage(
        `Treatment session images have been saved to medical history successfully!\n\n${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} uploaded.`
      );
      setShowSuccessModal(true);
      
      // Trigger update callback
      onUpdate?.();
    } catch (error: any) {
      console.error('Failed to save images to medical history:', error);
      if (error?.message?.includes('quota') || error?.message?.includes('QuotaExceededError')) {
        setUploadError(
          'Storage quota exceeded. The images are too large to save. ' +
          'Please try uploading fewer images or contact support to clear storage space.'
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save images to medical history';
        setUploadError(errorMessage);
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEditStatusClick = () => {
    setIsEditingStatus(true);
    const appointmentDate = appointment.date || '';
    const validTransitions = getValidStatusTransitions(appointment.status || 'pending', appointmentDate);
    // If there are valid transitions, default to the first one; otherwise keep current status
    setEditStatus(validTransitions.length > 0 ? validTransitions[0] : (appointment.status || 'pending'));
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
      <div className="space-y-4">
        {/* Patient Information */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Patient</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{patientDisplayName}</div>
              </div>
            </div>
            {patientContact && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Contact Number</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{patientContact}</div>
              </div>
            )}
            {patientEmail && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{patientEmail}</div>
              </div>
            )}
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-600/30 dark:to-gold-500/30 rounded-lg p-4 border-2 border-gold-200 dark:border-gold-600">
          <div className="text-xs font-semibold text-gray-900 dark:text-white uppercase mb-1">Service</div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {serviceName}
            {durationText && <span className="text-sm text-gray-700 dark:text-gray-300 font-normal ml-2">{durationText}</span>}
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          {!isEditingDoctor ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Doctor</div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">Dr. {doctorName}</div>
              </div>
              {isStaffOrAdmin && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <button
                  onClick={handleEditDoctorClick}
                  className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg hover:shadow-lg transition"
                >
                  Change Dentist
                </button>
              )}
              {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-semibold text-center">
                  {appointment.status === 'completed' 
                    ? 'This appointment is completed and cannot be modified' 
                    : 'This appointment is cancelled and cannot be modified'}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Select Doctor</label>
                <select
                  value={editDoctorId}
                  onChange={(e) => {
                    setEditDoctorId(e.target.value);
                    setEditDoctorTime('');
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none"
                >
                  <option value="">Select a doctor</option>
                  {doctors
                    .filter((d) => d.available !== false)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
              {editDoctorId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => {
                        setEditDate(e.target.value);
                        setEditDoctorTime('');
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Time</label>
                    {availableTimes.length === 0 ? (
                      <div className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-black-800 text-gray-500 dark:text-gray-400">
                        {editDoctorId && editDate ? 'No available time slots for this doctor on this date' : 'Please select a doctor and date first'}
                      </div>
                    ) : (
                      <select
                        value={editDoctorTime}
                        onChange={(e) => setEditDoctorTime(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none"
                      >
                        <option value="">Select a time</option>
                        {availableTimes.map((time) => {
                          const [hours, minutes] = time.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour % 12 || 12;
                          return (
                            <option key={time} value={time}>
                              {displayHour}:{minutes} {ampm}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateDoctor}
                  disabled={updating || !editDoctorId || !editDoctorTime}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingDoctor(false);
                    setEditDoctorId('');
                    setEditDoctorTime('');
                    setAvailableTimes([]);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          {!isEditingDateTime ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-2">
                  <span>📅</span> Date
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{formattedDate || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-2">
                  <span>🕐</span> Time
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{formattedTime || 'N/A'}</div>
              </div>
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <button
                  onClick={handleEditClick}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg hover:shadow-lg transition"
                >
                  Update Date/Time
                </button>
              )}
              {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                <div className="mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-semibold text-center">
                  {appointment.status === 'completed' 
                    ? 'This appointment is completed and cannot be rescheduled' 
                    : 'This appointment is cancelled and cannot be rescheduled'}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateDateTime}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditingDateTime(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        {(appointment as any).paymentMethod && (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Payment Method</div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{(appointment as any).paymentMethod}</div>
          </div>
        )}

        {/* Payment Amount - Always visible for completed appointments */}
        {appointment.status === 'completed' && isStaffOrAdmin && (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Payment Amount</div>
              {!isEditingStatus && (
                <button
                  onClick={() => {
                    setIsEditingStatus(true);
                    setEditStatus('completed');
                  }}
                  className="text-xs px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded hover:shadow-md transition"
                >
                  {((appointment as any).paymentAmount) ? 'Edit Amount' : 'Add Amount'}
                </button>
              )}
            </div>
            {((appointment as any).paymentAmount !== undefined && (appointment as any).paymentAmount !== null) ? (
              <>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₱{Number((appointment as any).paymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {(appointment as any).completedAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Completed on: {new Date((appointment as any).completedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                No payment amount recorded. Click "Add Amount" to record the payment.
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This amount is used for revenue tracking and reporting.
            </p>
          </div>
        )}

        {/* Status */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          {!isEditingStatus ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</div>
                {getValidStatusTransitions(appointment.status || 'pending', appointmentDate).length > 0 && (
                  <button
                    onClick={handleEditStatusClick}
                    className="text-xs px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded hover:shadow-md transition"
                  >
                    Change Status
                  </button>
                )}
              </div>
              <div className={getStatusBadge(appointment.status)}>
                {appointment.status === 'pending' && 'Pending'}
                {appointment.status === 'confirmed' && 'Confirmed'}
                {appointment.status === 'completed' && 'Completed'}
                {appointment.status === 'cancelled' && 'Cancelled'}
                {appointment.status === 'cancellation_requested' && 'Cancellation Requested'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</div>
              {getValidStatusTransitions(appointment.status || 'pending', appointmentDate).length > 0 ? (
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Appointment['status'])}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none text-sm font-semibold"
                >
                  {getValidStatusTransitions(appointment.status || 'pending', appointmentDate).map((status) => (
                    <option key={status} value={status}>
                      {status === 'pending' && 'Pending'}
                      {status === 'confirmed' && 'Confirmed'}
                      {status === 'completed' && 'Completed'}
                      {status === 'cancelled' && 'Cancelled'}
                      {status === 'cancellation_requested' && 'Cancellation Requested'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-black-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {appointment.status === 'pending' && 'Pending'}
                  {appointment.status === 'confirmed' && 'Confirmed'}
                  {appointment.status === 'completed' && 'Completed'}
                  {appointment.status === 'cancelled' && 'Cancelled'}
                  {appointment.status === 'cancellation_requested' && 'Cancellation Requested'}
                  {' (Cannot be changed)'}
                </div>
              )}
              {getValidStatusTransitions(appointment.status || 'pending', appointmentDate).length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  ⚠️ This appointment is finalized and cannot be changed.
                </p>
              )}
              
              {/* Payment Amount Input - Required when marking as completed or editing */}
              {isEditingStatus && editStatus === 'completed' && (
                <div className="mt-4 p-4 bg-gold-50 dark:bg-gold-900/20 border-2 border-gold-200 dark:border-gold-700 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Payment Amount (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount paid by patient"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none text-sm"
                    required
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    This amount will be recorded for revenue tracking. Enter the actual amount the patient paid.
                  </p>
                  {paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Amount: ₱{parseFloat(paymentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
              {getValidStatusTransitions(appointment.status || 'pending', appointmentDate).length > 0 ? (
                <button
                  onClick={() => {
                    setIsEditingStatus(false);
                    setEditStatus(appointment.status || 'pending');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingStatus(false)}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          {!isEditingNotes ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</div>
                <button
                  onClick={handleEditNotesClick}
                  className="text-xs px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded hover:shadow-md transition"
                >
                  {appointment.notes ? 'Edit Notes' : 'Add Notes'}
                </button>
              </div>
              {appointment.notes ? (
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-black-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  {appointment.notes}
                </div>
              ) : (
                <div className="text-sm text-gray-400 dark:text-gray-500 italic bg-white dark:bg-black-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 border-dashed">
                  No notes added yet
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</div>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Enter appointment notes..."
                rows={6}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white rounded-lg focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none resize-y text-sm placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  setEditNotes(appointment.notes || '');
                }}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Treatment Session Images - Staff/Admin Only */}
        {isStaffOrAdmin && appointment.patientId && !isGuest && !isWalkin && (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Treatment Session Images</div>
            
            {uploadError && (
              <div className="mb-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
                {uploadError}
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-4">
              <p className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Upload Images (Max 5, 5MB each)
              </p>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="appointment-image-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all select-none ${
                    uploadingImages || treatmentImages.length >= 5
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-gold-500 to-gold-400 text-black hover:shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  📁 Choose Files
                  <input
                    id="appointment-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    multiple
                    onChange={handleImageChange}
                    disabled={uploadingImages || treatmentImages.length >= 5}
                    className="sr-only"
                  />
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {treatmentImages.length > 0 ? `${treatmentImages.length} file(s) selected` : 'No file chosen'}
                </span>
              </div>
              {treatmentImages.length >= 5 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum 5 images allowed</p>
              )}
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-700"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Unified Save All Changes Button */}
        {(isEditingStatus || isEditingNotes || treatmentImages.length > 0) && (
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pending Changes:
              </div>
              <div className="flex flex-wrap gap-2">
                {isEditingStatus && (
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-semibold">
                    Status
                  </span>
                )}
                {isEditingNotes && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-semibold">
                    Notes
                  </span>
                )}
                {treatmentImages.length > 0 && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold">
                    {treatmentImages.length} Image{treatmentImages.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleSaveAllChanges}
              disabled={updating || uploadingImages}
              className="w-full px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {updating || uploadingImages ? 'Saving All Changes...' : 'Save All Changes'}
            </button>
          </div>
        )}
      </div>
    </Modal>
    <SuccessModal
      isOpen={showSuccessModal}
      onClose={() => {
        setShowSuccessModal(false);
        setSuccessMessage('');
        // Call onUpdate after success modal closes to refresh data
        onUpdate?.();
      }}
      title="Changes Saved Successfully!"
      message={successMessage}
      autoClose={true}
      autoCloseDelay={3500}
    />
  </>
  );
}

