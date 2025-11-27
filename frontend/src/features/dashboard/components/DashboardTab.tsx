import { useState, useMemo, useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useServices } from '@/hooks/useServices';
import { useDoctors } from '@/hooks/useDoctors';
import { calculateAppointmentRevenue, getAppointmentCompletionDate, normalizeDate } from '@/lib/revenue-calculator';
import { getAppointmentsByPeriod as getAppointmentsByPeriodUtil } from '@/lib/appointment-filters';
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
import type { PatientProfile, DoctorProfile, ServiceItem } from '@/types/user';

const COLORS = ['#D4AF37', '#F4D03F', '#F7DC6F', '#E8B923', '#C9A961'];

export function DashboardTab() {
  const { appointments, loadAppointments } = useAppointments();
  const { patients } = usePatients();
  const { services } = useServices();
  const { doctors } = useDoctors();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
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

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Listen for appointment updates
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

  // Calculate all metrics
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Filter appointments by period
    const getAppointmentsByPeriod = (period: 'today' | 'week' | 'month') => {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.date || (apt as any).appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        
        if (period === 'today') {
          return aptDate.getTime() === today.getTime();
        } else if (period === 'week') {
          return aptDate >= weekStart && aptDate <= today;
        } else {
          return aptDate >= monthStart && aptDate <= today;
        }
      });
    };

    const todayApts = getAppointmentsByPeriod('today');
    const weekApts = getAppointmentsByPeriod('week');
    const monthApts = getAppointmentsByPeriod('month');

    // Calculate KPIs
    const calculateKPIs = (apts: Appointment[]) => {
      const scheduled = apts.length;
      const completed = apts.filter((a) => a.status === 'completed').length;
      const cancelled = apts.filter((a) => a.status === 'cancelled').length;
      const noShow = apts.filter((a) => a.status === 'pending' && new Date(a.date || (a as any).appointmentDate) < today).length;
      const noShowRate = scheduled > 0 ? ((noShow / scheduled) * 100).toFixed(1) : '0.0';
      
      return { scheduled, completed, cancelled, noShow, noShowRate };
    };

    const todayKPIs = calculateKPIs(todayApts);
    const weekKPIs = calculateKPIs(weekApts);
    const monthKPIs = calculateKPIs(monthApts);

    // Active patients (have at least one appointment)
    const activePatients = new Set(appointments.map((a) => a.patientId).filter(Boolean)).size;

    // New vs Returning patients
    const patientAppointmentCounts = new Map<string, number>();
    appointments.forEach((apt) => {
      if (apt.patientId) {
        const count = patientAppointmentCounts.get(apt.patientId.toString()) || 0;
        patientAppointmentCounts.set(apt.patientId.toString(), count + 1);
      }
    });
    const newPatients = Array.from(patientAppointmentCounts.values()).filter((c) => c === 1).length;
    const returningPatients = Array.from(patientAppointmentCounts.values()).filter((c) => c > 1).length;

    // Provider utilization
    const providerStats = doctors.map((doc) => {
      const docAppointments = appointments.filter((a) => a.doctorId === doc.id);
      const completedCount = docAppointments.filter((a) => a.status === 'completed').length;
      const totalSlots = 20; // Assume 20 slots per day average
      const utilization = docAppointments.length > 0 ? ((docAppointments.length / (totalSlots * 30)) * 100).toFixed(1) : '0.0';
      
      return {
        id: doc.id,
        name: doc.name || (doc as any).fullName || 'Unknown',
        appointmentCount: docAppointments.length,
        completedCount,
        utilization: parseFloat(utilization),
      };
    });

    // Popular services
    const serviceCounts = new Map<string, { name: string; count: number }>();
    appointments.forEach((apt) => {
      const serviceName = apt.serviceName || services.find((s) => s.id === apt.serviceId)?.name || 'Unknown';
      const current = serviceCounts.get(serviceName) || { name: serviceName, count: 0 };
      serviceCounts.set(serviceName, { ...current, count: current.count + 1 });
    });
    const popularServices = Array.from(serviceCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);


    // Appointment trends (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayApts = appointments.filter((a) => {
        const aptDateStr = normalizeDate(a.date || (a as any).appointmentDate);
        return aptDateStr === dateStr;
      });
      
      trendData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        scheduled: dayApts.length,
        completed: dayApts.filter((a) => a.status === 'completed').length,
        cancelled: dayApts.filter((a) => a.status === 'cancelled').length,
      });
    }

    // Revenue trends (based on actual completed appointments)
    // Use completion date for revenue, not appointment date
    const revenueData = trendData.map((d, index) => {
      // Calculate the actual date for this trend data point
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Filter completed appointments by completion date (not appointment date)
      const completedApts = appointments.filter((a) => {
        if (a.status !== 'completed') return false;
        
        // Get completion date (prioritizes completedAt > updatedAt > appointment date)
        const completionDate = getAppointmentCompletionDate(a);
        if (!completionDate) {
          // Fallback to appointment date
          const aptDate = normalizeDate(a.date || (a as any).appointmentDate);
          return aptDate === dateStr;
        }
        
        return completionDate === dateStr;
      });
      
      const revenue = completedApts.reduce((sum, apt) => {
        return sum + calculateAppointmentRevenue(apt, services);
      }, 0);
      
      return {
        ...d,
        revenue: Math.round(revenue),
      };
    });

    // Patient demographics
    const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    
    patients.forEach((patient) => {
      if (patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 35) ageGroups['19-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else if (age <= 65) ageGroups['51-65']++;
        else ageGroups['65+']++;
      }
      if (patient.gender) {
        const gender = patient.gender === 'Prefer not to say' ? 'Other' : patient.gender;
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      }
    });

    const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
    const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }));

    // Cancellation and rescheduling rates
    const totalAppointments = appointments.length;
    const cancelledCount = appointments.filter((a) => a.status === 'cancelled' || a.status === 'cancellation_requested').length;
    const rescheduledCount = appointments.filter((a) => (a as any).rescheduleRequested).length;
    const cancellationRate = totalAppointments > 0 ? ((cancelledCount / totalAppointments) * 100).toFixed(1) : '0.0';
    const reschedulingRate = totalAppointments > 0 ? ((rescheduledCount / totalAppointments) * 100).toFixed(1) : '0.0';

    // Upcoming appointments (next 7 days)
    const upcomingApts = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date || (apt as any).appointmentDate);
        return aptDate >= today && aptDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && apt.status !== 'cancelled' && apt.status !== 'completed';
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || (a as any).appointmentDate);
        const dateB = new Date(b.date || (b as any).appointmentDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10);

    return {
      todayKPIs,
      weekKPIs,
      monthKPIs,
      activePatients,
      newPatients,
      returningPatients,
      providerStats,
      popularServices,
      trendData,
      revenueData,
      ageData,
      genderData,
      cancellationRate,
      reschedulingRate,
      upcomingApts,
    };
  }, [appointments, patients, services, doctors, lastRefresh, appointments.length, appointments.filter(a => a.status === 'completed').length, appointments.filter(a => a.status === 'completed' && (a as any).paymentAmount).length]);

  const currentKPIs = useMemo(() => {
    if (selectedPeriod === 'today') return metrics.todayKPIs;
    if (selectedPeriod === 'week') return metrics.weekKPIs;
    return metrics.monthKPIs;
  }, [selectedPeriod, metrics]);

  // Calculate revenue for current period
  const currentPeriodRevenue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const getAppointmentsByPeriod = (period: 'today' | 'week' | 'month') => {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.date || (apt as any).appointmentDate);
        aptDate.setHours(0, 0, 0, 0);
        
        if (period === 'today') {
          return aptDate.getTime() === today.getTime();
        } else if (period === 'week') {
          return aptDate >= weekStart && aptDate <= today;
        } else {
          return aptDate >= monthStart && aptDate <= today;
        }
      });
    };

    const periodApts = getAppointmentsByPeriod(selectedPeriod);
    const completedApts = periodApts.filter((a) => a.status === 'completed');
    const totalRevenue = completedApts.reduce((sum, apt) => {
      // Priority: Use paymentAmount if available (actual amount paid)
      if ((apt as any).paymentAmount !== undefined && (apt as any).paymentAmount !== null) {
        return sum + Number((apt as any).paymentAmount);
      }
      
      return sum + calculateAppointmentRevenue(apt, services);
    }, 0);
    
    const outstandingApts = periodApts.filter((a) => a.status === 'confirmed' || a.status === 'pending');
    const outstandingRevenue = outstandingApts.reduce((sum, apt) => {
      return sum + calculateAppointmentRevenue(apt, services);
    }, 0);

    return { totalRevenue, outstandingRevenue };
  }, [selectedPeriod, appointments, services]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await loadAppointments();
    setLastRefresh(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg font-semibold transition bg-white dark:bg-black-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black-700 border border-gray-200 dark:border-gray-700"
            title="Refresh data"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedPeriod === 'today'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black'
                : 'bg-white dark:bg-black-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedPeriod === 'week'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black'
                : 'bg-white dark:bg-black-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedPeriod === 'month'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black'
                : 'bg-white dark:bg-black-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Appointments"
          value={currentKPIs.scheduled}
          subtitle={`${currentKPIs.completed} completed, ${currentKPIs.cancelled} cancelled`}
          icon="📅"
        />
        <KPICard
          title="No-Show Rate"
          value={`${currentKPIs.noShowRate}%`}
          subtitle={`${currentKPIs.noShow} no-shows`}
          icon="❌"
        />
        <KPICard
          title="Active Patients"
          value={metrics.activePatients}
          subtitle={`${metrics.newPatients} new, ${metrics.returningPatients} returning`}
          icon="👥"
        />
        <KPICard
          title="Revenue"
          value={`₱${currentPeriodRevenue.totalRevenue.toLocaleString()}`}
          subtitle={`Outstanding: ₱${currentPeriodRevenue.outstandingRevenue.toLocaleString()}`}
          icon="💰"
        />
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="New Patients" value={metrics.newPatients} period={selectedPeriod} />
        <StatCard title="Returning Patients" value={metrics.returningPatients} period={selectedPeriod} />
        <StatCard title="Cancellation Rate" value={`${metrics.cancellationRate}%`} period={selectedPeriod} />
        <StatCard title="Rescheduling Rate" value={`${metrics.reschedulingRate}%`} period={selectedPeriod} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Appointment Trends (Last 7 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
              />
              <Legend wrapperStyle={{ color: isDarkMode ? '#f3f4f6' : '#111827' }} />
              <Line type="monotone" dataKey="scheduled" stroke="#D4AF37" strokeWidth={2} name="Scheduled" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Trends (Last 7 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
                formatter={(value: number) => `₱${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Patient Demographics - Age Groups">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.ageData.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
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
                {metrics.ageData.filter((d) => d.value > 0).map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  const total = metrics.ageData.reduce((sum, d) => sum + d.value, 0);
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
        </ChartCard>

        <ChartCard title="Patient Demographics - Gender">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.genderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" />
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
        </ChartCard>
      </div>

      {/* Provider Overview and Popular Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Provider Overview">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Provider</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Appointments</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {metrics.providerStats.map((provider) => (
                  <tr key={provider.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-black-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{provider.name}</td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">{provider.appointmentCount}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Popular Procedures/Services">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.popularServices} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
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
        </ChartCard>
      </div>

      {/* Upcoming Appointments */}
      <ChartCard title="Upcoming Appointments (Next 7 Days)">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Doctor</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.upcomingApts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No upcoming appointments
                  </td>
                </tr>
              ) : (
                metrics.upcomingApts.map((apt) => {
                  const patient = patients.find((p) => p.id === apt.patientId);
                  const doctor = doctors.find((d) => d.id === apt.doctorId);
                  const service = services.find((s) => s.id === apt.serviceId);
                  const aptDate = new Date(apt.date || (apt as any).appointmentDate);
                  const aptTime = apt.time || (apt as any).appointmentTime || '';
                  
                  return (
                    <tr key={apt.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-black-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{aptTime}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {patient?.fullName || apt.patientName || 'Guest'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{service?.name || apt.serviceName || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{doctor?.name || apt.doctorName || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'confirmed'
                              ? 'bg-blue-500 text-white'
                              : apt.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {apt.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle: string; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <div className="text-right">
          <div className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 dark:from-gold-400 dark:to-gold-300 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </div>
  );
}

function StatCard({ title, value, period }: { title: string; value: string | number; period: string }) {
  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{title}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-black-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

