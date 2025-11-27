import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

// Convert any dollar-formatted prices to Philippine Peso symbol
export function toPeso(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  return str.replace(/\$/g, '₱');
}

// Generate unique ID
export function generateId(): string {
  return 'id' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// Resolve legacy URL for loading legacy HTML pages
export function resolveLegacyUrl(href: string, baseUrl: URL): string {
  if (!href) return '';
  // If it's already an absolute URL, return as is
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  // If it starts with /, resolve from origin
  if (href.startsWith('/')) {
    return new URL(href, window.location.origin).href;
  }
  // Handle relative paths - try both legacy/common and common
  const resolved = new URL(href, baseUrl).href;
  
  // If the resolved path doesn't exist, try alternative locations
  // For ../common/ paths, try both /common/ and /legacy/common/
  // Note: Alternative paths are handled by the browser/legacy page loader
  if (href.includes('../common/') || href.includes('common/')) {
    // Return the resolved path (will be checked by the browser)
    // The browser will try the resolved path first
    return resolved;
  }
  
  // Otherwise, resolve relative to baseUrl
  return resolved;
}

// Format time
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Validate email
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate phone
export function validatePhone(phone: string): boolean {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Show notification (creates a DOM notification element)
export function showNotification(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Generate time slots
export function generateTimeSlots(startTime: string, endTime: string, interval: number = 30): string[] {
  const slots: string[] = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    slots.push(timeString);

    currentMinute += interval;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
}
