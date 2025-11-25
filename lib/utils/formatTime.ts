import { format, getTime, formatDistanceToNow } from 'date-fns';

// ----------------------------------------------------------------------

export function fDate(date: Date | number | string | null | undefined, newFormat?: string): string {
  const fm = newFormat || 'dd MMM yyyy';
  return date ? format(new Date(date), fm) : '';
}

export function fDateTime(date: Date | number | string | null | undefined, newFormat?: string): string {
  const fm = newFormat || 'dd MMM yyyy p';
  return date ? format(new Date(date), fm) : '';
}

export function fDateTimes(date: Date | number | string | null | undefined, newFormat?: string): string {
  const fm = newFormat || 'dd/MM/yyyy HH:mm';
  if (!date) return '';
  try {
    // Handle unix timestamp in seconds
    const dateValue = typeof date === 'number' && date < 10000000000 
      ? new Date(date * 1000) 
      : new Date(date);
    return format(dateValue, fm);
  } catch {
    return '';
  }
}

export function fTimestamp(date: Date | number | string | null | undefined): number {
  if (!date) return 0;
  try {
    // Handle unix timestamp in seconds
    const dateObj = typeof date === 'number' && date < 10000000000
      ? new Date(date * 1000)
      : (typeof date === 'number' ? new Date(date) : new Date(date));
    return getTime(dateObj);
  } catch {
    return 0;
  }
}

export function fTime(time: Date | number | string | null | undefined): string {
  if (!time) return '';
  try {
    const date = typeof time === 'number' && time < 10000000000
      ? new Date(time * 1000)
      : (typeof time === 'number' ? new Date(time) : new Date(time));
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function fToNow(date: Date | number | string | null | undefined): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'number' && date < 10000000000
      ? new Date(date * 1000)
      : (typeof date === 'number' ? new Date(date) : new Date(date));
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return '';
  }
}
