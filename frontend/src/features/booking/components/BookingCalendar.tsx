import { useMemo } from 'react';
import type { ClinicSchedule } from '@/types/user';

interface BookingCalendarProps {
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null;
  availableDates: number[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (direction: number) => void;
  clinicSchedule?: ClinicSchedule;
}

export function BookingCalendar({
  currentMonth,
  currentYear,
  selectedDate,
  availableDates,
  onDateSelect,
  onMonthChange,
  clinicSchedule,
}: BookingCalendarProps) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust starting day (Monday = 0, Sunday = 6)
    const adjustedStartDay = (startingDayOfWeek + 6) % 7;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate minimum booking date (tomorrow)
    const minBookingDate = new Date(today);
    minBookingDate.setDate(minBookingDate.getDate() + 1); // Add 1 day (tomorrow)
    
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 14);
    
    const days: Array<{
      day: number;
      date: Date;
      isTooSoon: boolean;
      isFuture: boolean;
      isAvailable: boolean;
      isSelected: boolean;
    }> = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push({
        day: 0,
        date: new Date(),
        isTooSoon: false,
        isFuture: false,
        isAvailable: false,
        isSelected: false,
      });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      checkDate.setHours(0, 0, 0, 0);
      
      // Date is too soon if it's before the minimum booking date (1.5 days advance)
      const isTooSoon = checkDate < minBookingDate;
      const isFuture = checkDate > maxAllowedDate;
      
      // Check if clinic is open on this day
      let isClinicOpen = true;
      if (clinicSchedule) {
        const dayOfWeek = dayNamesFull[checkDate.getDay()];
        const clinicDay = clinicSchedule[dayOfWeek as keyof ClinicSchedule];
        isClinicOpen = clinicDay?.isOpen ?? true;
      }
      
      // Date is available only if: not too soon, not future, in availableDates, AND clinic is open
      const isAvailable = !isTooSoon && !isFuture && availableDates.includes(day) && isClinicOpen;
      const isSelected = selectedDate && 
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear;
      
      days.push({
        day,
        date: checkDate,
        isTooSoon,
        isFuture,
        isAvailable,
        isSelected: !!isSelected,
      });
    }
    
    return days;
  }, [currentMonth, currentYear, availableDates, selectedDate, clinicSchedule]);

  const handleDateClick = (day: number, date: Date) => {
    if (day === 0) return; // Empty cell
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate minimum booking date (tomorrow)
    const minBookingDate = new Date(today);
    minBookingDate.setDate(minBookingDate.getDate() + 1); // Add 1 day (tomorrow)
    
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 14);
    
    if (date < minBookingDate || date > maxAllowedDate) return;
    
    // Check if clinic is open on this day
    if (clinicSchedule) {
      const dayOfWeek = dayNamesFull[date.getDay()];
      const clinicDay = clinicSchedule[dayOfWeek as keyof ClinicSchedule];
      if (!clinicDay?.isOpen) {
        return; // Don't allow selection if clinic is closed
      }
    }
    
    onDateSelect(date);
  };

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
        >
          ‹
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors"
        >
          ›
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNamesShort.map((day, idx) => (
          <div key={idx} className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayData, idx) => {
          if (dayData.day === 0) {
            return <div key={idx} className="aspect-square" />;
          }
          
          // Check if clinic is closed on this day
          const dayOfWeek = dayNamesFull[dayData.date.getDay()];
          const clinicDay = clinicSchedule?.[dayOfWeek as keyof ClinicSchedule];
          const isClinicClosed = clinicSchedule && clinicDay && !clinicDay.isOpen;
          
          const isDisabled = dayData.isTooSoon || dayData.isFuture || !dayData.isAvailable || isClinicClosed;
          const isSelected = dayData.isSelected;
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(dayData.day, dayData.date)}
              disabled={isDisabled}
              title={isClinicClosed ? 'Clinic is closed on this day' : undefined}
              className={`
                aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-gradient-to-br from-gold-500 to-gold-400 text-black shadow-lg scale-110 z-10 relative'
                  : isDisabled
                  ? isClinicClosed
                    ? 'text-red-400 dark:text-red-500 cursor-not-allowed opacity-60 line-through'
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              {dayData.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

