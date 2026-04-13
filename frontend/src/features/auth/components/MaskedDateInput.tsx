import { useState, useRef, useEffect } from 'react';

interface MaskedDateInputProps {
  id?: string;
  name?: string;
  className?: string;
  required?: boolean;
}

export function MaskedDateInput({ id, name, className, required }: MaskedDateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [internalDate, setInternalDate] = useState(''); // YYYY-MM-DD for form submission
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Format string like 05121995 to 05 / 12 / 1995
  const formatDOB = (val: string) => {
    const raw = val.replace(/\D/g, ''); // keep only digits
    let formatted = '';
    
    if (raw.length > 0) {
      formatted = raw.substring(0, 2);
    }
    if (raw.length >= 3) {
      formatted += ' / ' + raw.substring(2, 4);
    }
    if (raw.length >= 5) {
      formatted += ' / ' + raw.substring(4, 8);
    }
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Check if user is deleting a slash
    if (displayValue.length > rawValue.length && displayValue.endsWith(' / ') && rawValue.endsWith(' ')) {
       // Allow smooth deletion over slashes
       const numericOnly = rawValue.replace(/\D/g, '');
       const newFormatted = formatDOB(numericOnly.slice(0, -1));
       setDisplayValue(newFormatted);
       updateInternalDate(newFormatted.replace(/\D/g, ''));
       return;
    }

    const digitsOnly = rawValue.replace(/\D/g, '');
    
    // Reject if too long
    if (digitsOnly.length > 8) return;
    
    const newFormatted = formatDOB(digitsOnly);
    setDisplayValue(newFormatted);
    updateInternalDate(digitsOnly);
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

  return (
    <div className="relative group">
      <input
        type="hidden"
        name={name}
        id={id}
        value={internalDate}
      />
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        placeholder="MM / DD / YYYY"
        value={displayValue}
        onChange={handleChange}
        required={required}
        className={`${className} dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 transition-all duration-300 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/30 dark:focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:ring-2`}
      />
    </div>
  );
}
