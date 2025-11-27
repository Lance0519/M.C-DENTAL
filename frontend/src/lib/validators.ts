import { StorageService } from '@/lib/storage';

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

function isRandomEmail(localPart: string) {
  const cleanPart = localPart.replace(/\./g, '');
  const vowels = 'aeiou';
  const letters = cleanPart.split('').filter((char) => /[a-z]/.test(char));
  const vowelsCount = letters.filter((char) => vowels.includes(char)).length;
  const consonantCount = letters.length - vowelsCount;

  if (letters.length > 5 && vowelsCount === 0 && consonantCount > 8) return true;
  if (/(.)\1{2,}/.test(cleanPart)) return true;
  if (/^(?:(.)(.)){3,}/.test(cleanPart)) return true;
  if (/\d{6,}/.test(localPart)) return true;
  if (letters.length >= 10) {
    const uniqueChars = new Set(cleanPart.split('')).size;
    if (uniqueChars / cleanPart.length > 0.7 && vowelsCount === 0) return true;
  }
  if (letters.length > 10 && vowelsCount > 0) {
    const vowelRatio = vowelsCount / letters.length;
    if (vowelRatio < 0.15 && consonantCount > 10) return true;
  }
  if (cleanPart.length >= 12 && vowelsCount === 0 && /^[a-z0-9]+$/.test(cleanPart)) return true;
  return false;
}

type EmailValidationOptions = {
  allowExisting?: boolean;
};

export function validateEmailFormat(email: string, options: EmailValidationOptions = {}) {
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
    const existingEmail = StorageService.getUserByEmail(normalizedEmail);
    if (existingEmail) {
      return { valid: false, message: 'This email is already registered.' };
    }
  }

  return { valid: true, message: 'Email looks good!' };
}

export function validateUsername(username: string) {
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
  const existingUsername = StorageService.getUserByUsername(normalizedUsername);
  if (existingUsername) {
    return { valid: false, message: 'This username is already taken.' };
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

