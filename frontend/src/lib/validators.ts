import api from '@/lib/api';

const disposableDomains = [
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'throwawaymail.com',
  'discard.email',
  'trashmail.com',
  'yopmail.com'
];

const suspiciousKeywords = [
  'test',
  'fake',
  'dummy',
  'temp',
  'example',
  'invalid',
  'noreply',
  'no-reply',
  'thisisnotreal',
  'notreal',
  'fakeemail',
  'fakeuser',
  'randomuser'
];

// Whitelist of accepted email domains
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.com.ph',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'ymail.com',
  'msn.com',
  'rocketmail.com',
  'googlemail.com',
];

/**
 * Check if an email has a valid domain from the allowed list.
 * Used across the system for consistent email validation.
 */
export function isValidEmailDomain(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.toLowerCase().trim().split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}


type EmailValidationOptions = {
  allowExisting?: boolean;
};

export async function validateEmailFormat(email: string, options: EmailValidationOptions = {}) {
  if (!email) {
    return { valid: false, message: '' };
  }

  const normalized = email.toLowerCase();
  const [localPart, domain] = normalized.split('@');

  // Basic format check (must have local@domain.tld structure)
  const basicPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,10}$/;
  if (!basicPattern.test(email)) {
    return { valid: false, message: 'Invalid email format. Please enter a correct email address.' };
  }

  if (!localPart || !domain) {
    return { valid: false, message: 'Invalid email format. Please enter a correct email address.' };
  }

  // Check against allowed domains whitelist
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, message: `Invalid email domain. Please use a valid email provider (e.g., @gmail.com, @yahoo.com, @outlook.com).` };
  }

  if (disposableDomains.some((d) => domain.includes(d))) {
    return { valid: false, message: 'Disposable email addresses are not allowed.' };
  }

  if (suspiciousKeywords.some((keyword) => localPart.includes(keyword))) {
    return { valid: false, message: 'Please use a real email address.' };
  }

  // Commented out: isRandomEmail check was too aggressive and flagged legitimate emails
  // if (isRandomEmail(localPart)) {
  //   return { valid: false, message: 'Email address appears to be fake.' };
  // }

  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2 || tld.length > 6 || !/^[a-z]+$/.test(tld)) {
    return { valid: false, message: 'Invalid email format. Please enter a correct email address.' };
  }

  if (!options.allowExisting) {
    const normalizedEmail = email.toLowerCase();
    try {
      const checkResult = await api.checkUserExists(undefined, normalizedEmail);
      if (checkResult.exists && checkResult.field === 'email') {
        return { valid: false, message: 'This email is already registered.' };
      }
    } catch (error) {
      // If API check fails, allow the email (fail open for better UX)
      console.warn('Email check failed:', error);
    }
  }

  return { valid: true, message: 'Email looks good!' };
}

export async function validateUsername(username: string) {
  if (!username) return { valid: false, message: '' };

  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters.' };
  }

  if (username.length > 20) {
    return { valid: false, message: 'Username must be less than 20 characters.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Only letters, numbers, and underscores are allowed.' };
  }

  // Normalize username for consistent checking
  const normalizedUsername = username.toLowerCase();
  try {
    const checkResult = await api.checkUserExists(normalizedUsername);
    if (checkResult.exists && checkResult.field === 'username') {
      return { valid: false, message: 'This username is already taken.' };
    }
  } catch (error) {
    // If API check fails, allow the username (fail open for better UX)
    console.warn('Username check failed:', error);
  }

  return { valid: true, message: 'Username is available.' };
}

export function validatePhone(phone: string) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
}

const commonWeakPasswords = [
  'password', 'password123', '12345678', '123456789',
  'qwerty', 'qwertyuiop', 'admin123', 'welcome',
  'letmein123', 'iloveyou'
];

export function validatePasswordStrength(password: string) {
  if (!password) {
    return { valid: false, message: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }

  if (password.length > 16) {
    return { valid: false, message: 'Password cannot exceed 16 characters.' };
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLowercase) return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  if (!hasUppercase) return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  if (!hasNumber) return { valid: false, message: 'Password must contain at least one number.' };
  if (!hasSymbol) return { valid: false, message: 'Password must contain at least one special character/symbol.' };

  // Basic check against extremely common/weak passwords
  const normalizedPassword = password.toLowerCase();
  if (commonWeakPasswords.some(weakPassword => normalizedPassword.includes(weakPassword))) {
    return { valid: false, message: 'This password is too common or easily guessable. Please choose a unique passphrase.' };
  }

  return { valid: true, message: 'Password strength looks good.' };
}

