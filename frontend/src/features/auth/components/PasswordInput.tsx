import { useState } from 'react';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

export function PasswordInput({ label, id, className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const baseInputClasses =
    'w-full rounded-2xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-black-800 px-4 py-3 text-base text-black-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30';

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-black-900 dark:text-gray-100">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${baseInputClasses} pr-12 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full p-1.5 text-slate-500 dark:text-gray-400 transition hover:text-gold-500 dark:hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {visible ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
