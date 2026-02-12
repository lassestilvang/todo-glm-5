/**
 * Date Utility Tests
 * 
 * Tests for date formatting, parsing, and calculation functions.
 */

import { describe, test, expect } from 'bun:test';
import { 
  formatDate,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatTime,
  formatTimeDisplay,
  formatRelativeDate,
  formatDistance,
  parseDate,
  parseDateString,
  isValidDateString,
  isValidDateTimeString,
  getToday,
  getTodayString,
  getTomorrow,
  getTomorrowString,
  getYesterday,
  getYesterdayString,
  getDaysFromNow,
  getDaysFromNowString,
  getDaysAgo,
  getDaysAgoString,
  getWeekStart,
  getWeekEnd,
  getWeekRange,
  getNextDaysRange,
  getNext7DaysRange,
  getNext30DaysRange,
  isDateToday,
  isDateTomorrow,
  isDateYesterday,
  isDatePast,
  isDateFuture,
  isDateOverdue,
  isDateInRange,
  getDaysDifference,
  getHoursDifference,
  getMinutesDifference,
  getDaysUntil,
  getDaysSince
} from '../date';
import { 
  format as dateFnsFormat,
  addDays,
  subDays,
  parseISO,
  startOfDay
} from 'date-fns';

describe('Date Utilities', () => {
  // Fixed test date for consistent results
  const testDate = new Date('2024-01-15T14:30:00');
  const testDateString = '2024-01-15';
  const testDateTimeString = '2024-01-15T14:30:00';

  describe('Date Formatting', () => {
    test('formatDate returns YYYY-MM-DD format', () => {
      expect(formatDate(testDate)).toBe('2024-01-15');
    });

    test('formatDate accepts string input', () => {
      expect(formatDate(testDateString)).toBe('2024-01-15');
    });

    test('formatDateDisplay returns readable format', () => {
      expect(formatDateDisplay(testDate)).toBe('Jan 15, 2024');
    });

    test('formatDateTimeDisplay returns date and time', () => {
      expect(formatDateTimeDisplay(testDate)).toBe('Jan 15, 2024 at 2:30 PM');
    });

    test('formatTime returns HH:MM format', () => {
      expect(formatTime(testDate)).toBe('14:30');
    });

    test('formatTimeDisplay returns readable time', () => {
      expect(formatTimeDisplay(testDate)).toBe('2:30 PM');
    });

    test('formatRelativeDate returns "Today" for today', () => {
      const today = new Date();
      expect(formatRelativeDate(today)).toBe('Today');
    });

    test('formatRelativeDate returns "Tomorrow" for tomorrow', () => {
      const tomorrow = addDays(new Date(), 1);
      expect(formatRelativeDate(tomorrow)).toBe('Tomorrow');
    });

    test('formatRelativeDate returns "Yesterday" for yesterday', () => {
      const yesterday = subDays(new Date(), 1);
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });

    test('formatRelativeDate returns formatted date for other dates', () => {
      const date = new Date('2024-01-15');
      expect(formatRelativeDate(date)).toBe('Jan 15, 2024');
    });

    test('formatDistance returns human-readable distance', () => {
      const date = subDays(new Date(), 2);
      const result = formatDistance(date);
      expect(result).toContain('ago');
    });
  });

  describe('Date Parsing', () => {
    test('parseDate parses ISO string to Date', () => {
      const result = parseDate('2024-01-15T14:30:00');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January = 0
      expect(result.getDate()).toBe(15);
    });

    test('parseDateString returns Date for valid string', () => {
      const result = parseDateString('2024-01-15');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2024);
    });

    test('parseDateString returns null for invalid string', () => {
      expect(parseDateString('invalid')).toBeNull();
    });

    test('isValidDateString returns true for valid date', () => {
      expect(isValidDateString('2024-01-15')).toBe(true);
    });

    test('isValidDateString returns false for invalid format', () => {
      expect(isValidDateString('01-15-2024')).toBe(false);
    });

    test('isValidDateString returns false for invalid date', () => {
      expect(isValidDateString('2024-13-45')).toBe(false);
    });

    test('isValidDateTimeString returns true for valid datetime', () => {
      expect(isValidDateTimeString('2024-01-15T14:30:00')).toBe(true);
    });

    test('isValidDateTimeString returns false for invalid datetime', () => {
      expect(isValidDateTimeString('invalid')).toBe(false);
    });
  });

  describe('Relative Date Calculations', () => {
    test('getToday returns start of today', () => {
      const today = getToday();
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
    });

    test('getTodayString returns today in YYYY-MM-DD', () => {
      const today = getTodayString();
      const expected = dateFnsFormat(new Date(), 'yyyy-MM-dd');
      expect(today).toBe(expected);
    });

    test('getTomorrow returns start of tomorrow', () => {
      const tomorrow = getTomorrow();
      const expected = startOfDay(addDays(new Date(), 1));
      expect(tomorrow.getDate()).toBe(expected.getDate());
    });

    test('getTomorrowString returns tomorrow in YYYY-MM-DD', () => {
      const tomorrow = getTomorrowString();
      const expected = dateFnsFormat(addDays(new Date(), 1), 'yyyy-MM-dd');
      expect(tomorrow).toBe(expected);
    });

    test('getYesterday returns start of yesterday', () => {
      const yesterday = getYesterday();
      const expected = startOfDay(subDays(new Date(), 1));
      expect(yesterday.getDate()).toBe(expected.getDate());
    });

    test('getYesterdayString returns yesterday in YYYY-MM-DD', () => {
      const yesterday = getYesterdayString();
      const expected = dateFnsFormat(subDays(new Date(), 1), 'yyyy-MM-dd');
      expect(yesterday).toBe(expected);
    });

    test('getDaysFromNow returns correct date', () => {
      const result = getDaysFromNow(5);
      const expected = startOfDay(addDays(new Date(), 5));
      expect(result.getDate()).toBe(expected.getDate());
    });

    test('getDaysFromNowString returns correct string', () => {
      const result = getDaysFromNowString(5);
      const expected = dateFnsFormat(addDays(new Date(), 5), 'yyyy-MM-dd');
      expect(result).toBe(expected);
    });

    test('getDaysAgo returns correct date', () => {
      const result = getDaysAgo(5);
      const expected = startOfDay(subDays(new Date(), 5));
      expect(result.getDate()).toBe(expected.getDate());
    });

    test('getDaysAgoString returns correct string', () => {
      const result = getDaysAgoString(5);
      const expected = dateFnsFormat(subDays(new Date(), 5), 'yyyy-MM-dd');
      expect(result).toBe(expected);
    });
  });

  describe('Date Range Calculations', () => {
    test('getWeekStart returns start of week', () => {
      const weekStart = getWeekStart();
      expect(weekStart.getDay()).toBe(0); // Sunday
    });

    test('getWeekEnd returns end of week', () => {
      const weekEnd = getWeekEnd();
      expect(weekEnd.getDay()).toBe(6); // Saturday
    });

    test('getWeekRange returns start and end', () => {
      const range = getWeekRange();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
      expect(range.start <= range.end).toBe(true);
    });

    test('getNextDaysRange returns correct range', () => {
      const range = getNextDaysRange(7);
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });

    test('getNext7DaysRange returns 7 day range', () => {
      const range = getNext7DaysRange();
      const daysDiff = Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(6); // 6 days difference = 7 days total
    });

    test('getNext30DaysRange returns 30 day range', () => {
      const range = getNext30DaysRange();
      const daysDiff = Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(29); // 29 days difference = 30 days total
    });
  });

  describe('Date Comparisons', () => {
    test('isDateToday returns true for today', () => {
      expect(isDateToday(new Date())).toBe(true);
    });

    test('isDateToday returns false for other dates', () => {
      expect(isDateToday(addDays(new Date(), 1))).toBe(false);
    });

    test('isDateTomorrow returns true for tomorrow', () => {
      expect(isDateTomorrow(addDays(new Date(), 1))).toBe(true);
    });

    test('isDateTomorrow returns false for other dates', () => {
      expect(isDateTomorrow(new Date())).toBe(false);
    });

    test('isDateYesterday returns true for yesterday', () => {
      expect(isDateYesterday(subDays(new Date(), 1))).toBe(true);
    });

    test('isDateYesterday returns false for other dates', () => {
      expect(isDateYesterday(new Date())).toBe(false);
    });

    test('isDatePast returns true for past dates', () => {
      expect(isDatePast(subDays(new Date(), 2))).toBe(true);
    });

    test('isDatePast returns false for future dates', () => {
      expect(isDatePast(addDays(new Date(), 1))).toBe(false);
    });

    test('isDateFuture returns true for future dates', () => {
      expect(isDateFuture(addDays(new Date(), 1))).toBe(true);
    });

    test('isDateFuture returns false for past dates', () => {
      expect(isDateFuture(subDays(new Date(), 1))).toBe(false);
    });

    test('isDateOverdue returns true for past dates not today', () => {
      expect(isDateOverdue(subDays(new Date(), 1))).toBe(true);
    });

    test('isDateOverdue returns false for today', () => {
      expect(isDateOverdue(new Date())).toBe(false);
    });

    test('isDateOverdue returns false for future dates', () => {
      expect(isDateOverdue(addDays(new Date(), 1))).toBe(false);
    });

    test('isDateInRange returns true for date in range', () => {
      const start = subDays(new Date(), 2);
      const end = addDays(new Date(), 2);
      expect(isDateInRange(new Date(), start, end)).toBe(true);
    });

    test('isDateInRange returns false for date outside range', () => {
      const start = subDays(new Date(), 2);
      const end = addDays(new Date(), 2);
      expect(isDateInRange(addDays(new Date(), 5), start, end)).toBe(false);
    });

    test('isDateInRange works with string inputs', () => {
      const today = dateFnsFormat(new Date(), 'yyyy-MM-dd');
      const start = dateFnsFormat(subDays(new Date(), 2), 'yyyy-MM-dd');
      const end = dateFnsFormat(addDays(new Date(), 2), 'yyyy-MM-dd');
      expect(isDateInRange(today, start, end)).toBe(true);
    });
  });

  describe('Date Differences', () => {
    test('getDaysDifference returns correct difference', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-15');
      expect(getDaysDifference(date1, date2)).toBe(5);
    });

    test('getDaysDifference returns negative for reversed dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-10');
      expect(getDaysDifference(date1, date2)).toBe(-5);
    });

    test('getHoursDifference returns correct difference', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-15T14:00:00');
      expect(getHoursDifference(date1, date2)).toBe(4);
    });

    test('getMinutesDifference returns correct difference', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-15T10:30:00');
      expect(getMinutesDifference(date1, date2)).toBe(30);
    });

    test('getDaysUntil returns positive for future dates', () => {
      const future = addDays(new Date(), 5);
      const result = getDaysUntil(future);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    test('getDaysUntil returns negative for past dates', () => {
      const past = subDays(new Date(), 5);
      const result = getDaysUntil(past);
      expect(result).toBeLessThanOrEqual(-4);
      expect(result).toBeGreaterThanOrEqual(-6);
    });

    test('getDaysSince returns positive for past dates', () => {
      const past = subDays(new Date(), 5);
      const result = getDaysSince(past);
      expect(result).toBeGreaterThanOrEqual(4);
      expect(result).toBeLessThanOrEqual(6);
    });

    test('getDaysSince returns negative for future dates', () => {
      const future = addDays(new Date(), 5);
      const result = getDaysSince(future);
      expect(result).toBeLessThanOrEqual(-4);
      expect(result).toBeGreaterThanOrEqual(-6);
    });
  });
});
