export const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * Returns Korean day of week (월, 화, 수, 목, 금, 토, 일) from YYYY-MM-DD
 */
export function getKoreanDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return KOREAN_DAYS[date.getDay()];
}

/**
 * Calculates duration in minutes from "HH:mm" and "HH:mm"
 */
export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return Math.max(0, endMinutes - startMinutes);
}

/**
 * Formats date into "YYYY.MM.DD (요일)" or "YYYY.MM.DD"
 */
export function formatKoreanDate(dateStr: string, withDayOfWeek = true): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const formatted = `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (withDayOfWeek) {
    const day = getKoreanDayOfWeek(dateStr);
    return `${formatted} (${day})`;
  }
  return formatted;
}

/**
 * Formats date into "M. D. (요일)" as seen in Korea Post official HWP timetables
 * e.g. "9. 28. (월)", "10. 1. (목)"
 */
export function formatTableDayHeader(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const dayOfWeek = getKoreanDayOfWeek(dateStr);
  return `${month}. ${day}. (${dayOfWeek})`;
}

/**
 * Calculates number of days between two dates inclusive
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diffDays);
}

/**
 * Generates an array of date strings between startDate and endDate
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export interface WeekDayInfo {
  date: string;
  dayOfWeek: string;
  headerLabel: string; // e.g. "9. 28. (월)"
  isWeekend: boolean;
}

export interface CourseWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string; // e.g. "제1주차 (10.12 ~ 10.16)"
  days: WeekDayInfo[]; // 5 working days (Mon-Fri) or whatever days in this week
}

/**
 * Groups dates into weekly 5-day (Monday-Friday) blocks as standard in Korean postal training centers
 */
export function getCourseWeeks(startDate: string, endDate: string): CourseWeek[] {
  if (!startDate || !endDate) return [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  // Find Monday of the starting week
  const getMonday = (d: Date): Date => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay(); // 0 is Sun, 1 is Mon
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
    copy.setDate(diff);
    return copy;
  };

  const weeks: CourseWeek[] = [];
  let currMon = getMonday(start);
  let weekNum = 1;

  while (currMon <= end || weeks.length === 0) {
    const days: WeekDayInfo[] = [];
    const monCopy = new Date(currMon);

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const d = new Date(monCopy);
      d.setDate(d.getDate() + dayOffset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      const dow = getKoreanDayOfWeek(dateStr);

      days.push({
        date: dateStr,
        dayOfWeek: dow,
        headerLabel: formatTableDayHeader(dateStr),
        isWeekend: false,
      });
    }

    const firstDate = days[0].date;
    const lastDate = days[4].date;

    weeks.push({
      weekNumber: weekNum,
      startDate: firstDate,
      endDate: lastDate,
      label: `제${weekNum}주차 (${formatKoreanDate(firstDate, false)} ~ ${formatKoreanDate(lastDate, false)})`,
      days,
    });

    weekNum++;
    currMon.setDate(currMon.getDate() + 7);
    if (currMon > end && weeks.length > 0) break;
  }

  return weeks;
}

/**
 * Checks if a date is within startDate and endDate
 */
export function isDateWithinRange(dateStr: string, startDate: string, endDate: string): boolean {
  if (!dateStr || !startDate || !endDate) return true;
  return dateStr >= startDate && dateStr <= endDate;
}

/**
 * Checks for time overlap between two intervals on the same day
 */
export function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && start2 < end1;
}
