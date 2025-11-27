// Time comparison utilities for break time validation

/**
 * Check if a time range overlaps with a break time range
 * @param slotStart Start time of the appointment slot (HH:MM)
 * @param slotEnd End time of the appointment slot (HH:MM)
 * @param breakStart Start time of break (HH:MM) - optional
 * @param breakEnd End time of break (HH:MM) - optional
 * @returns true if the slot overlaps with break time
 */
export function overlapsBreakTime(
  slotStart: string,
  slotEnd: string,
  breakStart?: string,
  breakEnd?: string
): boolean {
  // If no break time is defined, no overlap
  if (!breakStart || !breakEnd) {
    return false;
  }

  // Check if slot overlaps with break time
  // Overlap occurs if:
  // - Slot starts before break ends AND slot ends after break starts
  // This means any part of the slot falls within the break period
  // We use <= and >= to include slots that start/end exactly at break boundaries
  // because we don't want appointments that start exactly when break starts or end exactly when break ends
  return slotStart <= breakEnd && slotEnd >= breakStart;
}

/**
 * Format time (HH:MM to HH:MM AM/PM)
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    console.error('Error formatting time:', timeString, e);
    return timeString;
  }
}

