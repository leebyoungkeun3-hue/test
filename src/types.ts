export interface Course {
  id: string;
  name: string; // e.g. "9급 신규 집배직 교육"
  cohort: string; // e.g. "제15기"
  startDate: string; // "2026-10-12"
  endDate: string; // "2026-10-23"
  location: string; // e.g. "우정인재개발원"
  manager: string; // e.g. "홍길동 주무관"
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trainee {
  id: string;
  courseId: string;
  order: number; // 번호 (1, 2, 3...)
  affiliation: string; // 소속 (e.g. "서울강남우체국")
  rank: string; // 직급 (e.g. "행정서기보(시보)", "집배서기보")
  name: string; // 이름
  gender?: string; // 성별 (e.g. "남", "여")
  group: string; // 조 (e.g. "1조", "2조")
  dorm: string; // 숙소 (e.g. "희망관 301호", "비생활")
  notes?: string; // 비고
}

export interface TimetableItem {
  id: string;
  courseId: string;
  date: string; // "YYYY-MM-DD"
  dayOfWeek: string; // "월", "화", "수", "목", "금", "토", "일"
  period: number; // 교시 (1, 2, 3...)
  startTime: string; // "09:00"
  endTime: string; // "09:50"
  duration: number; // minutes (e.g. 50)
  subject: string; // 과목명 (e.g. "집배업무의 이해")
  instructor: string; // 강사명 (e.g. "홍길동")
  location: string; // 교육장소 (e.g. "제1강의실")
  notes?: string; // 비고 (e.g. "교재 지참")
}

export type ActiveTab = 'courses' | 'trainees' | 'timetable' | 'preview' | 'export';
