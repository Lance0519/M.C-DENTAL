import { useState, useRef, useEffect } from 'react';

interface MaskedDateInputProps {
  id?: string;
  name?: string;
  className?: string;
  required?: boolean;
}

export function MaskedDateInput({ id, name, className, required }: MaskedDateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [internalDate, setInternalDate] = useState(''); // YYYY-MM-DD
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Close calendar on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
        setShowYearPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDOB = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = '';
    if (raw.length > 0) formatted = raw.substring(0, 2);
    if (raw.length >= 3) formatted += ' / ' + raw.substring(2, 4);
    if (raw.length >= 5) formatted += ' / ' + raw.substring(4, 8);
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Smooth backend deletion over slashes
    if (displayValue.length > rawValue.length && displayValue.endsWith(' / ') && rawValue.endsWith(' ')) {
       const numericOnly = rawValue.replace(/\D/g, '');
       const newFormatted = formatDOB(numericOnly.slice(0, -1));
       setDisplayValue(newFormatted);
       updateInternalDate(newFormatted.replace(/\D/g, ''));
       return;
    }

    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length > 8) return;
    
    const newFormatted = formatDOB(digitsOnly);
    setDisplayValue(newFormatted);
    updateInternalDate(digitsOnly);
    
    // Auto-sync calendar view to typed date if valid
    if (digitsOnly.length >= 6) {
      const yyyy = parseInt(digitsOnly.substring(4, 8));
      const mm = parseInt(digitsOnly.substring(0, 2));
      if (yyyy >= 1900 && yyyy <= today.getFullYear() && mm >= 1 && mm <= 12) {
        setCurrentYear(yyyy);
        setCurrentMonth(mm - 1);
      }
    }
    
    // Open calendar if they start typing
    if (digitsOnly.length > 0 && !showCalendar) {
      setShowCalendar(true);
    }
  };

  const updateInternalDate = (digits: string) => {
    if (digits.length === 8) {
      const month = digits.substring(0, 2);
      const day = digits.substring(2, 4);
      const year = digits.substring(4, 8);
      setInternalDate(`${year}-${month}-${day}`);
    } else {
      setInternalDate('');
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Generate decades (e.g. 1920 to current Year) for year picker
  const renderYears = () => {
    const years = [];
    const currentY = today.getFullYear();
    for (let y = currentY; y >= currentY - 100; y--) {
      years.push(y);
    }
    return (
      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar p-2">
        {years.map(y => (
          <button
            type="button"
            key={y}
            onClick={() => {
              setCurrentYear(y);
              setShowYearPicker(false);
            }}
            className={`py-2 rounded-lg text-sm font-bold transition-colors ${currentYear === y ? 'bg-gold-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}
          >
            {y}
          </button>
        ))}
      </div>
    );
  };

  // Generate dates
  const renderDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} className="w-8 h-8"></div>);
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      // Format to MM / DD / YYYY
      const padM = String(currentMonth + 1).padStart(2, '0');
      const padD = String(day).padStart(2, '0');
      const formattedDateForComparison = `${padM} / ${padD} / ${currentYear}`;
      
      const isSelected = displayValue === formattedDateForComparison;
      
      return (
        <button
          type="button"
          key={day}
          onClick={() => {
            setDisplayValue(formattedDateForComparison);
            setInternalDate(`${currentYear}-${padM}-${padD}`);
            setShowCalendar(false); // Auto close
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 
            ${isSelected 
              ? 'bg-gold-500 text-black shadow-[0_0_15px_rgba(255,215,0,0.6)] scale-110' 
              : 'text-zinc-300 hover:bg-zinc-800 hover:text-cyan-400'}`}
        >
          {day}
        </button>
      );
    });

    return [...blanks, ...days];
  };

  return (
    <div className="relative group flex flex-col">
      <input type="hidden" name={name} id={id} value={internalDate} />
      
      {/* 1. The Input Field (The "Type" Part) */}
      <div className="relative">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          placeholder="MM / DD / YYYY"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setShowCalendar(true)}
          required={required}
          className={`${className} font-mono w-full dark:bg-[#121212] border-zinc-200 dark:border-zinc-700 transition-all duration-300 focus:outline-none focus:ring-0 focus:border-cyan-400 dark:focus:border-cyan-400 dark:focus:shadow-[0_0_15px_rgba(0,255,255,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]`}
        />
        <svg className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setShowCalendar(!showCalendar)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* 2 & 3. Header Navigation & Calendar Grid */}
      {showCalendar && (
        <div 
          ref={calendarRef}
          className="absolute z-50 top-full mt-2 left-0 w-[320px] bg-[#121212] border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),_0_0_20px_rgba(0,255,255,0.1)] p-4 transform origin-top animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Navigation (The "Jump" Part) */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1">
              {/* Back Button */}
              {!showYearPicker && (
                <button type="button" onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              
              <button 
                type="button" 
                onClick={() => setShowYearPicker(false)}
                className={`px-2 py-1 text-sm font-bold transition-colors ${!showYearPicker ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {months[currentMonth]}
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowYearPicker(!showYearPicker)}
                className={`px-2 py-1 text-sm font-bold transition-all rounded ${showYearPicker ? 'text-gold-400 bg-gold-400/10' : 'text-zinc-400 hover:text-white'}`}
              >
                {currentYear} <span className="text-[10px] opacity-70">▼</span>
              </button>

              {/* Forward Button */}
              {!showYearPicker && (
                <button type="button" onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Grid View */}
          {showYearPicker ? (
            renderYears()
          ) : (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((d, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-cyan-500/70 py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 justify-items-center">
                {renderDays()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
