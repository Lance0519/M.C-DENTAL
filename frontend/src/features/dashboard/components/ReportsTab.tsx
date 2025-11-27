import { useState, useMemo, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { useAppointments } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import { calculateAppointmentRevenue, getAppointmentCompletionDate, normalizeDate } from '@/lib/revenue-calculator';
import { filterAppointmentsByDateRange } from '@/lib/appointment-filters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Appointment } from '@/types/dashboard';

const COLORS = ['#D4AF37', '#F4D03F', '#F7DC6F', '#E8B923', '#C9A961'];

export function ReportsTab() {
  // Fetch data from hooks
  const { appointments, loading: appointmentsLoading, error: appointmentsError, loadAppointments } = useAppointments();
  const { patients, loading: patientsLoading, error: patientsError, loadPatients } = usePatients();
  const { services, loading: servicesLoading, error: servicesError, loadServices } = useServices();
  const { doctors, loading: doctorsLoading, error: doctorsError, loadDoctors } = useDoctors();
  
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Check if any data is loading
  const isLoading = appointmentsLoading || patientsLoading || servicesLoading || doctorsLoading;
  
  // Check if there are any errors
  const hasError = appointmentsError || patientsError || servicesError || doctorsError;

  // Hooks auto-load on mount, so we only need to call loadAppointments
  // since useAppointments no longer auto-loads
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Listen for appointment updates to refresh revenue data
  useEffect(() => {
    const handleStorageUpdate = () => {
      loadAppointments();
      setLastRefresh(new Date());
    };

    window.addEventListener('clinicDataUpdated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('clinicDataUpdated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadAppointments]);


  // Calculate reports based on current data
  const reports = useMemo(() => {
    // Ensure we have valid data
    if (!Array.isArray(appointments) || !Array.isArray(patients) || !Array.isArray(services) || !Array.isArray(doctors)) {
      console.warn('ReportsTab - Invalid data arrays:', {
        appointments: Array.isArray(appointments),
        patients: Array.isArray(patients),
        services: Array.isArray(services),
        doctors: Array.isArray(doctors)
      });
      return getEmptyReports();
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of day
    
    // Calculate date range - include both past and future appointments
    if (dateRange === 'week') {
      startDate.setDate(today.getDate() - 6); // Last 7 days including today
      endDate.setDate(today.getDate() + 7); // Include next 7 days
    } else if (dateRange === 'month') {
      startDate.setDate(today.getDate() - 29); // Last 30 days including today
      endDate.setDate(today.getDate() + 30); // Include next 30 days
    } else {
      // Year: last 12 months and next 12 months
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setMonth(today.getMonth());
      startDate.setDate(1); // First day of the month
      endDate.setFullYear(today.getFullYear() + 1);
      endDate.setMonth(today.getMonth());
      endDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of the month
    }

    // Debug: Log date range
    console.log('ReportsTab - Date range:', {
      dateRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      today: today.toISOString(),
      totalAppointments: appointments.length
    });

    // Filter appointments within date range (including future dates)
    const filteredApts = appointments.filter((apt) => {
      const aptDateStr = apt.date || (apt as any).appointmentDate;
      if (!aptDateStr) {
        console.warn('ReportsTab - Appointment missing date:', apt.id);
        return false;
      }
      
      try {
        // Use normalizeDate to handle date parsing consistently
        const normalizedAptDate = normalizeDate(aptDateStr);
        if (!normalizedAptDate) {
          console.warn('ReportsTab - Could not normalize appointment date:', apt.id, aptDateStr);
          return false;
        }
        
        // Parse normalized date to compare
        const dateParts = normalizedAptDate.split('-');
        const aptYear = parseInt(dateParts[0], 10);
        const aptMonth = parseInt(dateParts[1], 10) - 1;
        const aptDay = parseInt(dateParts[2], 10);
        const aptDate = new Date(aptYear, aptMonth, aptDay);
        aptDate.setHours(0, 0, 0, 0);
        
        // Normalize start and end dates
        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);
        const normalizedEnd = new Date(endDate);
        normalizedEnd.setHours(23, 59, 59, 999);
        
        // Include appointments within the range (past, present, and future)
        const isInRange = aptDate >= normalizedStart && aptDate <= normalizedEnd;
        
        if (!isInRange && appointments.length <= 10) {
          // Only log for small datasets to avoid console spam
          console.debug('ReportsTab - Appointment outside date range:', {
            aptId: apt.id,
            aptDate: normalizedAptDate,
            startDate: normalizedStart.toISOString().split('T')[0],
            endDate: normalizedEnd.toISOString().split('T')[0]
          });
        }
        
        return isInRange;
      } catch (error) {
        console.warn('ReportsTab - Error parsing date:', aptDateStr, error);
        return false;
      }
    });

    // Debug: Log filtered results
    console.log('ReportsTab - Filtered appointments:', {
      total: appointments.length,
      filtered: filteredApts.length,
      sampleDates: appointments.slice(0, 3).map(a => a.date || (a as any).appointmentDate)
    });

    // Total Appointments by Status
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const statusCounts = {
      scheduled: filteredApts.length,
      completed: filteredApts.filter((a) => a.status === 'completed').length,
      cancelled: filteredApts.filter((a) => a.status === 'cancelled').length,
      noShow: filteredApts.filter((a) => {
        const aptDateStr = a.date || (a as any).appointmentDate;
        if (!aptDateStr) return false;
        try {
          const aptDate = new Date(aptDateStr);
          if (isNaN(aptDate.getTime())) return false;
          aptDate.setHours(0, 0, 0, 0);
          return a.status === 'pending' && aptDate < todayStart;
        } catch {
          return false;
        }
      }).length,
    };

    const noShowRate = statusCounts.scheduled > 0 
      ? ((statusCounts.noShow / statusCounts.scheduled) * 100).toFixed(1) 
      : '0.0';

    // New vs Returning Patients
    const patientAppointmentCounts = new Map<string, number>();
    filteredApts.forEach((apt) => {
      if (apt.patientId) {
        const patientId = String(apt.patientId);
        const count = patientAppointmentCounts.get(patientId) || 0;
        patientAppointmentCounts.set(patientId, count + 1);
      }
    });
    const newPatients = Array.from(patientAppointmentCounts.values()).filter((c) => c === 1).length;
    const returningPatients = Array.from(patientAppointmentCounts.values()).filter((c) => c > 1).length;

    // Appointment Volume by Provider
    const providerVolume = doctors
      .filter((doc) => doc && doc.id)
      .map((doc) => {
        const docId = String(doc.id);
        const docApts = filteredApts.filter((a) => {
          const aptDoctorId = a.doctorId ? String(a.doctorId) : null;
          return aptDoctorId === docId;
        });
        return {
          name: doc.name || (doc as any).fullName || 'Unknown',
          appointments: docApts.length,
          completed: docApts.filter((a) => a.status === 'completed').length,
        };
      })
      .filter((p) => p.appointments > 0);

    // Revenue (based on actual completed appointments)
    const revenueByPeriod: Array<{ period: string; revenue: number }> = [];
    const periodCount = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 12;
    const todayForPeriods = new Date();
    todayForPeriods.setHours(0, 0, 0, 0);
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date(todayForPeriods);
      if (dateRange === 'week' || dateRange === 'month') {
        date.setDate(date.getDate() - i);
      } else {
        // Year: go back i months
        date.setMonth(date.getMonth() - i);
        date.setDate(1); // First day of month
      }
      date.setHours(0, 0, 0, 0);
      
      // Calculate actual revenue for this period
      // For revenue, use completion date (completedAt) if available, otherwise use updatedAt or appointment date
      // This ensures revenue is recorded in the period when the service was actually completed
      const periodDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Filter completed appointments by completion date
      const completedInPeriod = filteredApts.filter((apt) => {
        if (apt.status !== 'completed') return false;
        
        // Get completion date (prioritizes completedAt > updatedAt > appointment date)
        const completionDate = getAppointmentCompletionDate(apt);
        if (!completionDate) {
          // Fallback to appointment date if no completion date
          const aptDate = normalizeDate(apt.date || (apt as any).appointmentDate);
          if (!aptDate) return false;
          
          if (dateRange === 'year') {
            const aptMonth = aptDate.substring(0, 7);
            const periodMonth = periodDateStr.substring(0, 7);
            return aptMonth === periodMonth;
          }
          return aptDate === periodDateStr;
        }
        
        // Match by completion date
        if (dateRange === 'year') {
          // Match by month (compare YYYY-MM)
          const aptMonth = completionDate.substring(0, 7); // YYYY-MM
          const periodMonth = periodDateStr.substring(0, 7); // YYYY-MM
          return aptMonth === periodMonth;
        } else {
          // Match by exact date
          return completionDate === periodDateStr;
        }
      });
      
      // Calculate revenue (only from completed appointments)
      const revenue = completedInPeriod.reduce((sum, apt) => {
        return sum + calculateAppointmentRevenue(apt, services);
      }, 0);
      
      let periodLabel: string;
      if (dateRange === 'year') {
        periodLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        periodLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      revenueByPeriod.push({
        period: periodLabel,
        revenue: Math.round(revenue),
      });
    }

    // Patient Demographics
    const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    
    patients.forEach((patient) => {
      if (patient && patient.dateOfBirth) {
        try {
          const birthDate = new Date(patient.dateOfBirth);
          if (!isNaN(birthDate.getTime())) {
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
            
            if (actualAge <= 18) ageGroups['0-18']++;
            else if (actualAge <= 35) ageGroups['19-35']++;
            else if (actualAge <= 50) ageGroups['36-50']++;
            else if (actualAge <= 65) ageGroups['51-65']++;
            else ageGroups['65+']++;
          }
        } catch {
          // Invalid date, skip
        }
      }
      if (patient && patient.gender) {
        const gender = patient.gender === 'Prefer not to say' ? 'Other' : patient.gender;
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      }
    });

    // Provider Productivity
    const providerProductivity = doctors
      .filter((doc) => doc && doc.id)
      .map((doc) => {
        const docId = String(doc.id);
        const docApts = filteredApts.filter((a) => {
          const aptDoctorId = a.doctorId ? String(a.doctorId) : null;
          return aptDoctorId === docId;
        });
        const completed = docApts.filter((a) => a.status === 'completed').length;
        
        // Calculate utilization based on date range
        const totalSlots = dateRange === 'week' ? 140 : dateRange === 'month' ? 600 : 7200;
        const utilization = docApts.length > 0 ? ((docApts.length / totalSlots) * 100).toFixed(1) : '0.0';
        
        return {
          name: doc.name || (doc as any).fullName || 'Unknown',
          appointments: docApts.length,
          completed,
          utilization: parseFloat(utilization),
          productivity: docApts.length > 0 ? ((completed / docApts.length) * 100).toFixed(1) : '0.0',
        };
      });

    // Average Appointment Lead Time
    const leadTimes = filteredApts
      .filter((apt) => apt.createdAt)
      .map((apt) => {
        try {
          const created = new Date(apt.createdAt!);
          const scheduled = new Date(apt.date || (apt as any).appointmentDate);
          if (isNaN(created.getTime()) || isNaN(scheduled.getTime())) return null;
          return Math.floor((scheduled.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // days
        } catch {
          return null;
        }
      })
      .filter((lt): lt is number => lt !== null);
      
    const avgLeadTime = leadTimes.length > 0 
      ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1)
      : '0';

    // Cancellation & Rescheduling Rates
    const cancelledCount = filteredApts.filter((a) => 
      a.status === 'cancelled' || a.status === 'cancellation_requested'
    ).length;
    const rescheduledCount = filteredApts.filter((a) => (a as any).rescheduleRequested).length;
    const cancellationRate = filteredApts.length > 0 
      ? ((cancelledCount / filteredApts.length) * 100).toFixed(1) 
      : '0.0';
    const reschedulingRate = filteredApts.length > 0 
      ? ((rescheduledCount / filteredApts.length) * 100).toFixed(1) 
      : '0.0';

    // Most Popular Procedures
    const serviceCounts = new Map<string, number>();
    filteredApts.forEach((apt) => {
      const serviceName = apt.serviceName || 
        (apt.serviceId ? services.find((s) => String(s.id) === String(apt.serviceId))?.name : null) || 
        'Unknown';
      serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
    });
    const popularProcedures = Array.from(serviceCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Active Patient Count (patients with appointments in the period)
    const activePatientIds = new Set(
      filteredApts
        .map((a) => a.patientId)
        .filter(Boolean)
        .map((id) => String(id))
    );
    const activePatients = activePatientIds.size;

    // Return with new array references to ensure React detects changes
    return {
      statusCounts,
      noShowRate,
      newPatients,
      returningPatients,
      providerVolume: [...providerVolume], // Create new array reference
      revenueByPeriod: [...revenueByPeriod], // Create new array reference
      ageGroups: { ...ageGroups }, // Create new object reference
      genderCounts: { ...genderCounts }, // Create new object reference
      providerProductivity: [...providerProductivity], // Create new array reference
      avgLeadTime,
      cancellationRate,
      reschedulingRate,
      popularProcedures: [...popularProcedures], // Create new array reference
      activePatients,
    };
  }, [appointments, patients, services, doctors, dateRange, lastRefresh, appointments.length, appointments.filter(a => a.status === 'completed').length]);


  // Helper function to get empty reports structure
  function getEmptyReports() {
    return {
      statusCounts: { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 },
      noShowRate: '0.0',
      newPatients: 0,
      returningPatients: 0,
      providerVolume: [],
      revenueByPeriod: [],
      ageGroups: { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 },
      genderCounts: { Male: 0, Female: 0, Other: 0 },
      providerProductivity: [],
      avgLeadTime: '0',
      cancellationRate: '0.0',
      reschedulingRate: '0.0',
      popularProcedures: [],
      activePatients: 0,
    };
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      console.log('ReportsTab - Refreshing data...');
      // Reload all data synchronously
      loadAppointments();
      loadPatients();
      loadServices();
      loadDoctors();
      
      // Update last refresh time to trigger recalculation
      setLastRefresh(new Date());
      
      // Log after a brief delay to see updated data
      setTimeout(() => {
        console.log('ReportsTab - After refresh:', {
          appointments: appointments.length,
          patients: patients.length,
          services: services.length,
          doctors: doctors.length
        });
      }, 100);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      // Use setTimeout to allow state updates to complete
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleExport = () => {
    // Simple CSV export implementation
    const csvData = [
      ['Report Period', dateRange],
      ['Generated At', new Date().toLocaleString()],
      ['Total Appointments', reports.statusCounts.scheduled],
      ['Completed', reports.statusCounts.completed],
      ['Cancelled', reports.statusCounts.cancelled],
      ['No-Show', reports.statusCounts.noShow],
      ['No-Show Rate', `${reports.noShowRate}%`],
      ['New Patients', reports.newPatients],
      ['Returning Patients', reports.returningPatients],
      ['Active Patients', reports.activePatients],
      ['Average Lead Time (days)', reports.avgLeadTime],
      ['Cancellation Rate', `${reports.cancellationRate}%`],
      ['Rescheduling Rate', `${reports.reschedulingRate}%`],
    ];

    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Debug: Show data counts
  useEffect(() => {
    console.log('ReportsTab - Current data state:', {
      appointments: appointments.length,
      patients: patients.length,
      services: services.length,
      doctors: doctors.length,
      isLoading,
      hasError,
      dateRange
    });
  }, [appointments.length, patients.length, services.length, doctors.length, isLoading, hasError, dateRange]);

  // Show loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-2">Error loading reports data</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white dark:bg-black-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:border-gold-500 dark:hover:border-gold-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh reports data"
          >
            <svg 
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'year')}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 font-semibold"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Debug Info - Only show in development or when there's an issue */}
      {process.env.NODE_ENV === 'development' && (appointments.length === 0 || reports.statusCounts.scheduled === 0) && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
          <p className="text-yellow-400 text-sm font-semibold mb-2">Debug Information (Development Only):</p>
          <div className="text-yellow-300 text-xs space-y-1">
            <p>Total Appointments in System: {appointments.length}</p>
            <p>Total Patients: {patients.length}</p>
            <p>Total Services: {services.length}</p>
            <p>Total Doctors: {doctors.length}</p>
            <p>Date Range: {dateRange}</p>
            <p>Filtered Appointments: {reports.statusCounts.scheduled}</p>
            <p>Completed Appointments (all): {appointments.filter(a => a.status === 'completed').length}</p>
            <p>Completed with Payment: {appointments.filter(a => a.status === 'completed' && (a as any).paymentAmount).length}</p>
            {appointments.length > 0 && (
              <div className="mt-2">
                <p>Sample Appointment Dates:</p>
                <ul className="list-disc list-inside ml-2">
                  {appointments.slice(0, 5).map((apt, idx) => (
                    <li key={idx}>
                      ID: {apt.id}, Date: {apt.date || (apt as any).appointmentDate || 'N/A'}, Status: {apt.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="Total Appointments" value={reports.statusCounts.scheduled} />
        <ReportCard title="Completed" value={reports.statusCounts.completed} />
        <ReportCard title="Cancelled" value={reports.statusCounts.cancelled} />
        <ReportCard title="No-Show" value={reports.statusCounts.noShow} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard title="No-Show Rate" value={`${reports.noShowRate}%`} />
        <ReportCard title="New Patients" value={reports.newPatients} />
        <ReportCard title="Returning Patients" value={reports.returningPatients} />
        <ReportCard title="Active Patients" value={reports.activePatients} />
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title="New vs Returning Patients">
          <div className="flex gap-4">
            <div className="flex-1 bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-950 dark:to-gold-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gold-700 dark:text-gold-300 mb-2">{reports.newPatients}</div>
              <div className="text-sm font-semibold text-gold-800 dark:text-gold-200">New Patients</div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">{reports.returningPatients}</div>
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-200">Returning Patients</div>
            </div>
          </div>
        </ReportSection>

        <ReportSection title="Appointment Volume by Provider">
          {reports.providerVolume.length > 0 ? (
            <ResponsiveContainer key={`provider-volume-${lastRefresh.getTime()}-${dateRange}`} width="100%" height={300}>
              <BarChart data={[...reports.providerVolume]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-gray-400" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                  }}
                />
                <Legend />
                <Bar dataKey="appointments" fill="#D4AF37" name="Total" radius={[8, 8, 0, 0]} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No provider data available for the selected period
            </div>
          )}
        </ReportSection>
      </div>

      {/* Revenue Trends */}
      <ReportSection title="Revenue Trends">
        {reports.revenueByPeriod.length > 0 ? (
          <ResponsiveContainer key={`revenue-${lastRefresh.getTime()}-${dateRange}`} width="100%" height={350}>
            <LineChart data={[...reports.revenueByPeriod]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="period" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `₱${value.toLocaleString()}`}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No revenue data available for the selected period
          </div>
        )}
      </ReportSection>

      {/* Patient Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title="Patient Demographics - Age Groups">
          {Object.values(reports.ageGroups).some(v => v > 0) ? (
            <ResponsiveContainer key={`age-groups-${lastRefresh.getTime()}`} width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(reports.ageGroups)
                    .map(([name, value]) => ({ name, value }))
                    .filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }: { percent: number; cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number }) => {
                    if (percent < 0.05) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontWeight="600" fontSize="14">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(reports.ageGroups)
                    .map(([name, value]) => ({ name, value }))
                    .filter((d) => d.value > 0)
                    .map((_entry, index) => (
                      <Cell key={`cell-${index}-${lastRefresh.getTime()}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  itemStyle={{
                    color: isDarkMode ? '#f9fafb' : '#111827',
                  }}
                  labelStyle={{
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    fontWeight: 600,
                  }}
                  formatter={(value: number, name: string) => {
                    const total = Object.values(reports.ageGroups).reduce((sum, v) => sum + v, 0);
                    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    return [`${value} patients (${percent}%)`, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                  verticalAlign="bottom" 
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No age group data available
            </div>
          )}
        </ReportSection>

        <ReportSection title="Patient Demographics - Gender">
          {Object.values(reports.genderCounts).some(v => v > 0) ? (
            <ResponsiveContainer key={`gender-${lastRefresh.getTime()}`} width="100%" height={300}>
              <BarChart data={Object.entries(reports.genderCounts).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                  }}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No gender data available
            </div>
          )}
        </ReportSection>
      </div>

      {/* Provider Productivity */}
      <ReportSection title="Provider Productivity & Utilization">
        {reports.providerProductivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Provider</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Appointments</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Completed</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Utilization</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {reports.providerProductivity.map((provider, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-black-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{provider.name}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{provider.appointments}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{provider.completed}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-400 dark:to-gold-300 h-2 rounded-full"
                            style={{ width: `${Math.min(provider.utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{provider.utilization}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{provider.productivity}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No provider productivity data available
          </div>
        )}
      </ReportSection>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportCard title="Average Lead Time" value={`${reports.avgLeadTime} days`} />
        <ReportCard title="Cancellation Rate" value={`${reports.cancellationRate}%`} />
        <ReportCard title="Rescheduling Rate" value={`${reports.reschedulingRate}%`} />
      </div>

      {/* Most Popular Procedures */}
      <ReportSection title="Most Popular Procedures/Services">
        {reports.popularProcedures.length > 0 ? (
          <ResponsiveContainer key={`procedures-${lastRefresh.getTime()}-${dateRange}`} width="100%" height={350}>
            <BarChart data={[...reports.popularProcedures]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#D4AF37" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No procedure data available for the selected period
          </div>
        )}
      </ReportSection>
    </div>
  );
}

function ReportCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{title}</div>
      <div className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 dark:from-gold-400 dark:to-gold-300 bg-clip-text text-transparent">
        {value}
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}
