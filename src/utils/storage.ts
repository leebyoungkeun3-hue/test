import { Course, Trainee, TimetableItem } from '../types';
import { INITIAL_COURSES, INITIAL_TRAINEES, INITIAL_TIMETABLE } from './initialData';
import { getKoreanDayOfWeek, calculateDaysBetween } from './dateUtils';

const KEYS = {
  COURSES: 'koreapost_training_courses_v5',
  TRAINEES: 'koreapost_training_trainees_v5',
  TIMETABLES: 'koreapost_training_timetables_v5',
  ACTIVE_COURSE_ID: 'koreapost_active_course_id_v5',
};

export function loadCourses(): Course[] {
  try {
    const raw = localStorage.getItem(KEYS.COURSES);
    if (!raw) {
      saveCourses(INITIAL_COURSES);
      return INITIAL_COURSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COURSES;
  } catch (e) {
    console.error('Failed to load courses:', e);
    return INITIAL_COURSES;
  }
}

export function saveCourses(courses: Course[]): void {
  try {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
  } catch (e) {
    console.error('Failed to save courses:', e);
  }
}

export function loadTrainees(): Trainee[] {
  try {
    const raw = localStorage.getItem(KEYS.TRAINEES);
    if (!raw) {
      saveTrainees(INITIAL_TRAINEES);
      return INITIAL_TRAINEES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TRAINEES;
  } catch (e) {
    console.error('Failed to load trainees:', e);
    return INITIAL_TRAINEES;
  }
}

export function saveTrainees(trainees: Trainee[]): void {
  try {
    localStorage.setItem(KEYS.TRAINEES, JSON.stringify(trainees));
  } catch (e) {
    console.error('Failed to save trainees:', e);
  }
}

export function loadTimetables(): TimetableItem[] {
  try {
    const raw = localStorage.getItem(KEYS.TIMETABLES);
    if (!raw) {
      saveTimetables(INITIAL_TIMETABLE);
      return INITIAL_TIMETABLE;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TIMETABLE;
  } catch (e) {
    console.error('Failed to load timetables:', e);
    return INITIAL_TIMETABLE;
  }
}

export function saveTimetables(timetables: TimetableItem[]): void {
  try {
    localStorage.setItem(KEYS.TIMETABLES, JSON.stringify(timetables));
  } catch (e) {
    console.error('Failed to save timetables:', e);
  }
}

export function loadActiveCourseId(courses: Course[]): string {
  try {
    const saved = localStorage.getItem(KEYS.ACTIVE_COURSE_ID);
    if (saved && courses.some((c) => c.id === saved)) {
      return saved;
    }
    return courses[0]?.id || '';
  } catch (e) {
    return courses[0]?.id || '';
  }
}

export function saveActiveCourseId(id: string): void {
  try {
    localStorage.setItem(KEYS.ACTIVE_COURSE_ID, id);
  } catch (e) {}
}

/**
 * Copies an existing course and duplicate its timetable with shifted dates
 */
export function duplicateCourse(
  sourceCourse: Course,
  newProps: {
    name: string;
    cohort: string;
    startDate: string;
    endDate: string;
    location: string;
    manager: string;
    notes: string;
  },
  existingTimetables: TimetableItem[]
): { newCourse: Course; newTimetables: TimetableItem[] } {
  const newCourseId = 'course_' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newCourse: Course = {
    id: newCourseId,
    name: newProps.name,
    cohort: newProps.cohort,
    startDate: newProps.startDate,
    endDate: newProps.endDate,
    location: newProps.location,
    manager: newProps.manager,
    notes: newProps.notes,
    createdAt: now,
    updatedAt: now,
  };

  // Duplicate timetable items from source course
  const sourceItems = existingTimetables.filter((t) => t.courseId === sourceCourse.id);

  // Calculate day offsets
  const sourceStart = new Date(sourceCourse.startDate).getTime();
  const targetStart = new Date(newProps.startDate);

  const newTimetables: TimetableItem[] = sourceItems.map((item) => {
    let targetDateStr = newProps.startDate;
    try {
      const itemDate = new Date(item.date).getTime();
      const dayDiff = Math.round((itemDate - sourceStart) / (1000 * 60 * 60 * 24));
      const targetDate = new Date(targetStart);
      targetDate.setDate(targetDate.getDate() + dayDiff);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getDate()).padStart(2, '0');
      targetDateStr = `${y}-${m}-${d}`;
    } catch {
      targetDateStr = newProps.startDate;
    }

    return {
      ...item,
      id: 'time_' + Math.random().toString(36).substring(2, 9),
      courseId: newCourseId,
      date: targetDateStr,
      dayOfWeek: getKoreanDayOfWeek(targetDateStr),
    };
  });

  return { newCourse, newTimetables };
}

/**
 * Resets local storage to sample data
 */
export function resetToSampleData(): void {
  localStorage.setItem(KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
  localStorage.setItem(KEYS.TRAINEES, JSON.stringify(INITIAL_TRAINEES));
  localStorage.setItem(KEYS.TIMETABLES, JSON.stringify(INITIAL_TIMETABLE));
  localStorage.setItem(KEYS.ACTIVE_COURSE_ID, INITIAL_COURSES[0].id);
}

/**
 * Clears all data
 */
export function clearAllData(): void {
  localStorage.removeItem(KEYS.COURSES);
  localStorage.removeItem(KEYS.TRAINEES);
  localStorage.removeItem(KEYS.TIMETABLES);
  localStorage.removeItem(KEYS.ACTIVE_COURSE_ID);
}
