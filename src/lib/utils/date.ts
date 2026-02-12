/**
 * Date Utility Functions
 * 
 * Provides date formatting, parsing, and calculation utilities.
 */

import { 
  format, 
  parseISO, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isValid,
  formatDistanceToNow,
  formatRelative
} from 'date-fns';

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format a date for display (e.g., "Jan 15, 2024")
 */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date with time for display (e.g., "Jan 15, 2024 at 3:30 PM")
 */
export function formatDateTimeDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

/**
 * Format time for display (e.g., "3:30 PM")
 */
export function formatTimeDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
}

/**
 * Format a relative date (e.g., "today", "tomorrow", "yesterday", or the actual date)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  
  return formatDateDisplay(d);
}

/**
 * Format a human-readable distance (e.g., "2 days ago", "in 3 hours")
 */
export function formatDistance(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ============================================
// DATE PARSING
// ============================================

/**
 * Parse an ISO date string to a Date object
 */
export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Parse a date string in YYYY-MM-DD format
 */
export function parseDateString(dateString: string): Date | null {
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid date in YYYY-MM-DD format
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const parsed = parseISO(dateString);
  return isValid(parsed);
}

/**
 * Check if a string is a valid ISO datetime
 */
export function isValidDateTimeString(dateTimeString: string): boolean {
  try {
    const parsed = parseISO(dateTimeString);
    return isValid(parsed);
  } catch {
    return false;
  }
}

// ============================================
// RELATIVE DATE CALCULATIONS
// ============================================

/**
 * Get today's date at start of day
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * Get tomorrow's date
 */
export function getTomorrow(): Date {
  return startOfDay(addDays(new Date(), 1));
}

/**
 * Get tomorrow's date as a string
 */
export function getTomorrowString(): string {
  return formatDate(addDays(new Date(), 1));
}

/**
 * Get yesterday's date
 */
export function getYesterday(): Date {
  return startOfDay(subDays(new Date(), 1));
}

/**
 * Get yesterday's date as a string
 */
export function getYesterdayString(): string {
  return formatDate(subDays(new Date(), 1));
}

/**
 * Get a date N days from now
 */
export function getDaysFromNow(days: number): Date {
  return startOfDay(addDays(new Date(), days));
}

/**
 * Get a date N days from now as a string
 */
export function getDaysFromNowString(days: number): string {
  return formatDate(addDays(new Date(), days));
}

/**
 * Get a date N days ago
 */
export function getDaysAgo(days: number): Date {
  return startOfDay(subDays(new Date(), days));
}

/**
 * Get a date N days ago as a string
 */
export function getDaysAgoString(days: number): string {
  return formatDate(subDays(new Date(), days));
}

// ============================================
// DATE RANGE CALCULATIONS
// ============================================

/**
 * Get the start of the current week (Sunday)
 */
export function getWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 0 });
}

/**
 * Get the end of the current week (Saturday)
 */
export function getWeekEnd(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 0 });
}

/**
 * Get the date range for the current week
 */
export function getWeekRange(): { start: Date; end: Date } {
  return {
    start: getWeekStart(),
    end: getWeekEnd(),
  };
}

/**
 * Get the date range for the next N days
 */
export function getNextDaysRange(days: number): { start: Date; end: Date } {
  return {
    start: getToday(),
    end: endOfDay(addDays(new Date(), days - 1)),
  };
}

/**
 * Get the date range for the next 7 days
 */
export function getNext7DaysRange(): { start: Date; end: Date } {
  return getNextDaysRange(7);
}

/**
 * Get the date range for the next 30 days
 */
export function getNext30DaysRange(): { start: Date; end: Date } {
  return getNextDaysRange(30);
}

// ============================================
// DATE COMPARISONS
// ============================================

/**
 * Check if a date is today
 */
export function isDateToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

/**
 * Check if a date is tomorrow
 */
export function isDateTomorrow(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isTomorrow(d);
}

/**
 * Check if a date is yesterday
 */
export function isDateYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isYesterday(d);
}

/**
 * Check if a date is in the past
 */
export function isDatePast(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(startOfDay(d));
}

/**
 * Check if a date is in the future
 */
export function isDateFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(startOfDay(d));
}

/**
 * Check if a date is overdue (past and not today)
 */
export function isDateOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(startOfDay(d)) && !isToday(d);
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(
  date: Date | string, 
  startDate: Date | string, 
  endDate: Date | string
): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return d >= start && d <= end;
}

// ============================================
// DATE DIFFERENCES
// ============================================

/**
 * Get the number of days between two dates
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d2, d1);
}

/**
 * Get the number of hours between two dates
 */
export function getHoursDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInHours(d2, d1);
}

/**
 * Get the number of minutes between two dates
 */
export function getMinutesDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInMinutes(d2, d1);
}

/**
 * Get the number of days until a date
 */
export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

/**
 * Get the number of days since a date
 */
export function getDaysSince(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(new Date(), d);
}
