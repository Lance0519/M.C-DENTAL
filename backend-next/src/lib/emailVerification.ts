import { promises as dns } from 'dns';
import net from 'net';

const disposableDomains = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'mohmal.com',
  'yopmail.com',
  'getnada.com',
  'maildrop.cc',
  'mintemail.com',
  'sharklasers.com',
  'spamgourmet.com',
  'tempmail.net',
  'trash-mail.com',
  'throwaway.email',
  'temp-mail.io',
]);

const popularDomains = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com']);

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
  'thisisfake',
  'notreal',
  'fakeemail',
  'notvalid',
  'notrealemail',
  'fakeuser',
  'dummyuser',
  'testemail',
  'fakeaccount',
];

const suspiciousPatterns = [
  /^(test|fake|dummy|temp|example|invalid|noreply|no-reply)/i,
  /(test|fake|dummy|temp|example|invalid)$/i,
  /^(thisisnotreal|thisisfake|notreal|fakeemail|notvalid|notrealemail|fakeuser|dummyuser)/i,
  /^[0-9]{10,}$/,
  /^[a-z]{1,2}$/,
  /^[a-z0-9]{1,3}\.[a-z0-9]{1,3}$/,
];

function isRandomEmail(localPart: string) {
  const cleanPart = localPart.replace(/\./g, '');
  const vowels = 'aeiou';
  let consonantCount = 0;
  let vowelCount = 0;
  let totalLetters = 0;

  for (let i = 0; i < cleanPart.length; i++) {
    const char = cleanPart[i]?.toLowerCase();
    if (!char || !/[a-z]/.test(char)) continue;
    totalLetters++;
    if (vowels.includes(char)) vowelCount++;
    else consonantCount++;
  }

  if (totalLetters > 5 && vowelCount === 0 && consonantCount > 8) return true;
  if (cleanPart.length >= 8 && /(.)\1{2,}/.test(cleanPart)) return true;
  if (cleanPart.length >= 8 && /^(.)(.)(?:\1\2){2,}/.test(cleanPart)) return true;
  if (/\d{6,}/.test(localPart)) return true;

  if (cleanPart.length >= 10) {
    const uniqueChars = new Set(cleanPart.split('')).size;
    const entropyRatio = uniqueChars / cleanPart.length;
    if (entropyRatio > 0.7 && vowelCount === 0 && totalLetters > 8) return true;
  }

  if (totalLetters > 10 && vowelCount > 0) {
    const vowelRatio = vowelCount / totalLetters;
    if (vowelRatio < 0.15 && consonantCount > 10) return true;
  }

  if (cleanPart.length >= 12 && vowelCount === 0 && /^[a-z0-9]+$/.test(cleanPart)) return true;

  return false;
}

function validateDomain(domain: string) {
  if (domain.length < 4 || domain.length > 255) return false;
  const domainPattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return domainPattern.test(domain);
}

async function checkMXRecords(domain: string) {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length) {
      mxRecords.sort((a, b) => a.priority - b.priority);
      return {
        valid: true,
        message: 'MX records found',
        mxHosts: mxRecords.map((record) => record.exchange),
      };
    }
  } catch {
    // fall through
  }

  try {
    await dns.resolve4(domain);
    return { valid: true, message: 'Domain has A record (no MX records, using A record)', mxHosts: [domain] };
  } catch {
    return { valid: false, message: 'Email domain does not exist or has no mail servers (no MX or A records)' };
  }
}

async function verifySMTP(domain: string, mxHosts: string[]) {
  if (!mxHosts.length) {
    const mxCheck = await checkMXRecords(domain);
    if (!mxCheck.valid) {
      return { valid: false, message: 'No MX records found for verification' };
    }
    mxHosts = mxCheck.mxHosts;
  }

  const ports = [25, 587, 465];
  for (const host of mxHosts.slice(0, 3)) {
    for (const port of ports) {
      const result = await attemptSMTPConnection(host, port);
      if (result.success) {
        return {
          valid: true,
          mxHost: host,
          message: 'SMTP server verified successfully (MX record and SMTP handshake confirmed)',
          smtpVerified: result.smtpVerified,
        };
      }
    }
  }

  return {
    valid: true,
    mxHost: mxHosts[0] ?? domain,
    message: 'MX record verified (SMTP connection blocked or server unavailable)',
    smtpVerified: false,
    note: 'Many mail servers block unauthenticated probes, so this is expected.',
  };
}

function attemptSMTPConnection(host: string, port: number) {
  return new Promise<{ success: boolean; smtpVerified: boolean }>((resolve) => {
    const socket = net.connect({ host, port, timeout: 1500 }, () => {
      socket.write('HELO verifier\r\n');
    });

    socket.on('data', () => {
      socket.end('QUIT\r\n');
      resolve({ success: true, smtpVerified: true });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ success: false, smtpVerified: false });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, smtpVerified: false });
    });
  });
}

export async function verifyEmailAddress(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  const [localPartRaw, domainRaw] = email.split('@');
  const domain = domainRaw.toLowerCase();
  const localPart = localPartRaw.toLowerCase();

  if (disposableDomains.has(domain)) {
    return { valid: false, message: 'Temporary/disposable email addresses are not allowed' };
  }

  if (popularDomains.has(domain)) {
    for (const keyword of suspiciousKeywords) {
      if (localPart.includes(keyword)) {
        return {
          valid: false,
          message: 'This email address appears to be fake or invalid. Please use a real email address.',
        };
      }
    }

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(localPart)) {
        return {
          valid: false,
          message: 'This email address appears to be fake or invalid. Please use a real email address.',
        };
      }
    }
  }

  if (isRandomEmail(localPart)) {
    return {
      valid: false,
      message: 'This email address appears to be random or fake. Please use a real email address.',
    };
  }

  if (localPart.length > 30) {
    return { valid: false, message: 'Email address appears to be invalid. Please use a real email address.' };
  }

  if (localPart.includes('..') || localPart.includes('---') || /[^a-z0-9._-]/i.test(localPart)) {
    return { valid: false, message: 'Invalid email format. Please use a valid email address.' };
  }

  if (!validateDomain(domain)) {
    return { valid: false, message: 'Invalid email domain format' };
  }

  const mxCheck = await checkMXRecords(domain);
  if (!mxCheck.valid) {
    return { valid: false, message: mxCheck.message };
  }

  const smtpResult = await verifySMTP(domain, mxCheck.mxHosts);

  return {
    valid: smtpResult.valid,
    message: smtpResult.message,
    mx_record: smtpResult.mxHost ?? mxCheck.mxHosts[0],
    smtp_verified: smtpResult.smtpVerified ?? false,
    note: smtpResult.note,
  };
}

