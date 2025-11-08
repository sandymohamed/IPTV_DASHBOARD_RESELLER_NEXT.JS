import { isPast, isToday, startOfDay, setHours, setMinutes } from 'date-fns';

/**
 * Validates if a datetime is not in the past
 * @param date - The date to validate
 * @param allowToday - If true, allows times for today even if they're slightly in the past
 * @returns Error message if invalid, undefined if valid
 */
export function validateNotPastDateTime(
  date: Date | null | undefined,
  allowToday: boolean = true
): string | undefined {
  if (!date) {
    return undefined; // Let required validation handle empty values
  }

  const now = new Date();
  const selectedDate = new Date(date);

  // If it's today and allowToday is true, only check if time is significantly in the past
  if (allowToday && isToday(selectedDate)) {
    // Allow times up to 1 minute in the past for today (to account for clock differences)
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    if (selectedDate < oneMinuteAgo) {
      return "You can't add tasks to a time in the past!";
    }
    return undefined;
  }

  // For future dates or if allowToday is false, check if it's in the past
  if (isPast(selectedDate)) {
    return "You can't add tasks to a time in the past!";
  }

  return undefined;
}

/**
 * Gets a default datetime value for today
 * Sets to current time instead of midnight
 */
export function getDefaultDateTimeForToday(): Date {
  return new Date();
}

/**
 * Normalizes a date to ensure it's not set to midnight if it's today
 * @param date - The date to normalize
 * @returns Normalized date with current time if it's today and set to midnight
 */
export function normalizeDateTimeForToday(date: Date | null): Date | null {
  if (!date) return null;

  const now = new Date();
  const selectedDate = new Date(date);
  const isSelectedToday = isToday(selectedDate);

  // If it's today and time is midnight, set to current time
  if (isSelectedToday && selectedDate.getHours() === 0 && selectedDate.getMinutes() === 0) {
    selectedDate.setHours(now.getHours());
    selectedDate.setMinutes(now.getMinutes());
    selectedDate.setSeconds(now.getSeconds());
  }

  return selectedDate;
}
