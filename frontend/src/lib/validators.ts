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



type EmailValidationOptions = {
  allowExisting?: boolean;
};

export async function validateEmailFormat(email: string, options: EmailValidationOptions = {}) {
  if (!email) {
    return { valid: false, message: '' };
  }

  const normalized = email.toLowerCase();
  const [localPart, domain] = normalized.split('@');

  const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicPattern.test(email)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  if (!localPart || !domain) {
    return { valid: false, message: 'Please enter a valid email address.' };
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
    return { valid: false, message: 'Please enter a valid email address.' };
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

export function validatePasswordStrength(password: string) {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' };
  }
  return { valid: true, message: 'Password strength looks good.' };
}

