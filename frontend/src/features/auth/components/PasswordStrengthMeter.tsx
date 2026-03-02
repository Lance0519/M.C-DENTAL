import { useMemo } from 'react';

type PasswordStrengthMeterProps = {
    password?: string;
};

export function PasswordStrengthMeter({ password = '' }: PasswordStrengthMeterProps) {
    const strength = useMemo(() => {
        let score = 0;
        if (!password) return score;

        // Award points based on our explicitly required constraints
        if (password.length >= 8) score += 1; // Base length met
        if (/[a-z]/.test(password)) score += 1; // Has lowercase
        if (/[A-Z]/.test(password)) score += 1; // Has uppercase
        if (/\d/.test(password)) score += 1; // Has number
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1; // Has symbol

        return score;
    }, [password]);

    // Translate score (0-5) into visual indicators
    const getVisuals = () => {
        if (!password) {
            return {
                label: 'None',
                color: 'bg-gray-200 dark:bg-gray-700',
                textColor: 'text-gray-400 dark:text-gray-500',
                width: 'w-0'
            };
        }

        switch (strength) {
            case 1:
            case 2:
                return {
                    label: 'Weak',
                    color: 'bg-rose-500',
                    textColor: 'text-rose-600 dark:text-rose-400',
                    width: 'w-1/4'
                };
            case 3:
                return {
                    label: 'Fair',
                    color: 'bg-yellow-500',
                    textColor: 'text-yellow-600 dark:text-yellow-400',
                    width: 'w-2/4'
                };
            case 4:
                return {
                    label: 'Good',
                    color: 'bg-blue-500',
                    textColor: 'text-blue-600 dark:text-blue-400',
                    width: 'w-3/4'
                };
            case 5:
                return {
                    label: 'Strong',
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-600 dark:text-emerald-400',
                    width: 'w-full'
                };
            default:
                return {
                    label: 'None',
                    color: 'bg-gray-200 dark:bg-gray-700',
                    textColor: 'text-gray-400 dark:text-gray-500',
                    width: 'w-0'
                };
        }
    };

    const visuals = getVisuals();

    return (
        <div className="mt-2 space-y-1.5">
            {/* Progress Bar Track */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700/50">
                {/* Progress Bar Fill */}
                <div
                    className={`h-full transition-all duration-300 ease-out ${visuals.color} ${visuals.width}`}
                />
            </div>

            {/* Helper Text & Label */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-gray-400">
                    Must be 8-16 chars, incl. uppercase, lowercase, numbers & symbols.
                </p>
                <span className={`text-xs font-bold ${visuals.textColor} transition-colors duration-300`}>
                    {visuals.label}
                </span>
            </div>
        </div>
    );
}
