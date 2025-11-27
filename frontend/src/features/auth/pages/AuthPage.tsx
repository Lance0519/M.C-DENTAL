import type { FormEvent } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '@/lib/auth-service';
import { validateEmailFormat, validatePasswordStrength, validatePhone, validateUsername } from '@/lib/validators';
import { useAuthStore } from '@/store/auth-store';
import { StorageService } from '@/lib/storage';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { ClaimAccountModal } from '@/components/modals/ClaimAccountModal';
import clinicLogo from '@/assets/images/logo.png';

type ViewMode = 'login' | 'register' | 'forgot';

type MessageState = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, recoverPassword } = useAuthStore();
  const [mode, setMode] = useState<ViewMode>('login');
  const [message, setMessage] = useState<MessageState>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const hasCheckedAuth = useRef(false);
  const registerFormRef = useRef<HTMLFormElement>(null);
  const forgotPasswordFormRef = useRef<HTMLFormElement>(null);

  // Redirect authenticated users to their dashboard (only on mount)
  useEffect(() => {
    // Prevent double-invocation in React Strict Mode
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    // Don't redirect if already on dashboard
    if (location.pathname.startsWith('/dashboard/')) {
      return;
    }

    // Check token first - if no token, stay on login page
    const token = sessionStorage.getItem('token');
    if (!token) {
      return;
    }

    // Check if user exists in localStorage (StorageService)
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && token) {
      const dashboardPath = AuthService.getDashboardPath(currentUser.role);
      if (location.pathname !== dashboardPath) {
        // Navigate to dashboard for already logged in users
        navigate(dashboardPath, { replace: true });
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (view: ViewMode) => {
    setMode(view);
    setMessage(null);
  };

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const usernameOrEmail = form.get('usernameOrEmail')?.toString().trim() ?? '';
    const password = form.get('password')?.toString() ?? '';

    setLoading(true);
    const result = await login(usernameOrEmail, password);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Login successful! Redirecting…' });
      // Get user from storage (token was already set by auth store)
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        // Navigate after a short delay to show success message
        setTimeout(() => {
          const dashboardPath = AuthService.getDashboardPath(currentUser.role);
          navigate(dashboardPath, { replace: true });
        }, 500);
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: form.get('firstName')?.toString().trim() ?? '',
      lastName: form.get('lastName')?.toString().trim() ?? '',
      username: form.get('username')?.toString().trim() ?? '',
      email: form.get('email')?.toString().trim() ?? '',
      phone: form.get('phone')?.toString().trim() ?? '',
      dateOfBirth: form.get('dateOfBirth')?.toString() ?? '',
      gender: form.get('gender')?.toString() ?? '',
      address: form.get('address')?.toString().trim() ?? '',
      password: form.get('password')?.toString() ?? ''
    };
    const confirmPassword = form.get('confirmPassword')?.toString() ?? '';

    if (!payload.firstName || !payload.lastName) {
      setMessage({ type: 'error', text: 'Please enter both first name and last name.' });
      return;
    }
    if (payload.password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    const emailValidation = validateEmailFormat(payload.email);
    if (!emailValidation.valid) {
      setMessage({ type: 'error', text: emailValidation.message });
      return;
    }
    const usernameValidation = validateUsername(payload.username);
    if (!usernameValidation.valid) {
      setMessage({ type: 'error', text: usernameValidation.message });
      return;
    }
    const passwordValidation = validatePasswordStrength(payload.password);
    if (!passwordValidation.valid) {
      setMessage({ type: 'error', text: passwordValidation.message });
      return;
    }
    if (!validatePhone(payload.phone)) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number.' });
      return;
    }

    setLoading(true);
    const result = await register(payload);
    setLoading(false);

    if (result && result.success) {
      // Reset form using ref (event.currentTarget may be null in async code)
      if (registerFormRef.current) {
        registerFormRef.current.reset();
      }
      
      // Clear any existing messages first
      setMessage(null);
      
      // Switch to login view immediately
      setMode('login');
      
      // Set success message on login page after mode switch
      // Use setTimeout to ensure mode switch completes first
      setTimeout(() => {
        setMessage({
          type: 'success',
          text: `Account created successfully! Welcome, ${payload.firstName} ${payload.lastName}. Please log in with your username: ${payload.username}`
        });
      }, 50);
    } else {
      setMessage({ 
        type: 'error', 
        text: result?.message || 'Registration failed. Please try again.' 
      });
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get('forgotEmail')?.toString().trim() ?? '';

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }
    const emailValidation = validateEmailFormat(email, { allowExisting: true });
    if (!emailValidation.valid) {
      setMessage({ type: 'error', text: emailValidation.message });
      return;
    }

    setLoading(true);
    const result = await recoverPassword(email);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: result.data ?? 'Password recovery email sent.' });
      // Reset form using ref (event.currentTarget may be null in async code)
      if (forgotPasswordFormRef.current) {
        forgotPasswordFormRef.current.reset();
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  }

  type MessageType = NonNullable<MessageState>['type'];
  const messageVariants: Record<MessageType, string> = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
    error: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
    info: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
  };

  const inputClasses =
    'w-full rounded-2xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-black-800 px-4 py-3 text-base text-black-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition focus:border-gold-500 dark:focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30';

  const primaryButtonClasses =
    'w-full rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-[#9b5de5] dark:from-gold-600 dark:via-gold-500 dark:to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-gold-500/30 dark:shadow-gold-500/50 transition hover:-translate-y-0.5 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gold-50 dark:from-black-950 dark:via-black-900 dark:to-black-950 px-4 py-12 sm:py-16 lg:py-20">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-gold-400/20 dark:bg-gold-400/10 blur-3xl" />
        <span className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-blue-400/20 dark:bg-blue-400/10 blur-3xl" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-300/10 dark:bg-purple-300/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center">
        <div className="w-full max-w-2xl rounded-3xl border-2 border-white/80 dark:border-gray-700 bg-white/95 dark:bg-black-900/95 p-8 sm:p-10 lg:p-12 shadow-2xl shadow-black/10 dark:shadow-black/50 backdrop-blur-sm">
          {/* Logo and Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-gold-500/30 dark:border-gold-600/50 bg-gradient-to-br from-white to-gold-50 dark:from-black-800 dark:to-black-900 shadow-lg">
              {!logoError ? (
                <img
                  src={clinicLogo}
                  alt="M.C DENTAL CLINIC Logo"
                  className="h-16 w-16 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 text-2xl font-extrabold text-white shadow-md">
                  MC
                </div>
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600 dark:text-gold-400 mb-2">M.C DENTAL CLINIC</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 dark:from-gold-400 dark:via-gold-300 dark:to-gold-400 bg-clip-text text-transparent mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
              {mode === 'login' 
                ? 'Sign in to access your account and manage your appointments' 
                : mode === 'register' 
                ? 'Join us today and start your journey to better dental health'
                : 'Enter your email to recover your password'}
            </p>
          </div>

          {message && (
            <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${messageVariants[message.type]}`}>
              {message.text}
            </div>
          )}

          {/* Login Form */}
          <form
            id="loginForm"
            className={`space-y-6 ${mode === 'login' ? 'block' : 'hidden'}`}
            onSubmit={handleLogin}
          >
            <div className="space-y-2">
              <label htmlFor="loginUsername" className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Username or Email
              </label>
              <input
                type="text"
                id="loginUsername"
                name="usernameOrEmail"
                className={inputClasses}
                placeholder="Enter your username or email"
                required
              />
            </div>
            <PasswordInput id="loginPassword" name="password" label="Password" required placeholder="Enter password" />
            <button type="submit" className={primaryButtonClasses} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </span>
              )}
            </button>
            <div className="flex flex-wrap justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Forgot Password?
              </button>
              <button type="button" onClick={() => switchMode('register')} className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors flex items-center gap-1">
                Create Account
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
            </div>
            
            {/* First Time Login / Claim Account */}
            <div className="pt-4 mt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl text-yellow-700 dark:text-yellow-400 hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/30 dark:hover:to-orange-900/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                First Time Login? Claim Your Account
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Booked an appointment as a guest? Set up your password here.
              </p>
            </div>
          </form>

          {/* Registration Form */}
          <form
            ref={registerFormRef}
            id="registerForm"
            className={`space-y-6 ${mode === 'register' ? 'block' : 'hidden'}`}
            onSubmit={handleRegister}
          >
            <div className="space-y-6">
              {/* Personal Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-gold-200 dark:border-gold-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Personal Details</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="regFirstName" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      First Name
                    </label>
                    <input type="text" id="regFirstName" name="firstName" className={inputClasses} placeholder="Enter your first name" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="regLastName" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Last Name
                    </label>
                    <input type="text" id="regLastName" name="lastName" className={inputClasses} placeholder="Enter your last name" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="regDOB" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Date of Birth
                    </label>
                    <input type="date" id="regDOB" name="dateOfBirth" className={inputClasses} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="regGender" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      Gender
                    </label>
                    <select id="regGender" name="gender" className={inputClasses} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-gold-200 dark:border-gold-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Address</h3>
                </div>
                <div className="space-y-2">
                  <label htmlFor="regAddress" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Complete Address
                  </label>
                  <textarea id="regAddress" name="address" className={`${inputClasses} min-h-[96px]`} rows={2} required></textarea>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-gold-200 dark:border-gold-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Contact Details</h3>
                </div>
                <div className="space-y-2">
                  <label htmlFor="regEmail" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Email Address
                  </label>
                  <input type="email" id="regEmail" name="email" className={inputClasses} placeholder="Enter your email address" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="regPhone" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Phone Number
                  </label>
                  <input type="tel" id="regPhone" name="phone" className={inputClasses} placeholder="Enter your phone number" required />
                </div>

              </div>

              {/* Account Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-gold-200 dark:border-gold-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Account Details</h3>
                </div>
                <div className="space-y-2">
                  <label htmlFor="regUsername" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Username
                  </label>
                  <input type="text" id="regUsername" name="username" className={inputClasses} required autoComplete="username" />
                </div>
                <PasswordInput id="regPassword" name="password" label="Password" required />
                <PasswordInput id="regConfirmPassword" name="confirmPassword" label="Confirm Password" required />
              </div>
            </div>

            <button type="submit" className={primaryButtonClasses} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </span>
              )}
            </button>
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => switchMode('login')} className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors flex items-center justify-center gap-1">
                Already have an account?
                <span className="underline">Login</span>
              </button>
            </div>
          </form>

          {/* Forgot Password Form */}
          <form
            ref={forgotPasswordFormRef}
            id="forgotPasswordForm"
            className={`space-y-6 ${mode === 'forgot' ? 'block' : 'hidden'}`}
            onSubmit={handleForgotPassword}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Forgot Password?</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Enter your email address and we'll help you recover your password</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="forgotEmail" className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </label>
              <input type="email" id="forgotEmail" name="forgotEmail" className={inputClasses} placeholder="Enter your email address" required />
            </div>
            <button type="submit" className={primaryButtonClasses} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Recovery Email
                </span>
              )}
            </button>
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => switchMode('login')} className="text-sm font-semibold text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold-500 dark:hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Claim Account Modal */}
      <ClaimAccountModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onSuccess={(email) => {
          setShowClaimModal(false);
          setMessage({
            type: 'success',
            text: `Account claimed successfully! You can now log in with ${email} and your new password.`,
          });
          // Pre-fill the email/username field if possible
          const usernameInput = document.getElementById('loginUsername') as HTMLInputElement;
          if (usernameInput) {
            usernameInput.value = email;
          }
        }}
      />
    </div>
  );
}
