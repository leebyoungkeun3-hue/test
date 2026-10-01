import { Course, Trainee, TimetableItem } from '../types';
import { PRESET_JIBAE_CURRICULUMS } from './curriculumExtractor';

export const SAMPLE_COURSE_ID = 'course_jibae_leader_2';
export const COURSE_JIBAE_NEW = 'course_jibae_new_15';
export const COURSE_JIBAE_SMART = 'course_jibae_smart_4';
export const COURSE_JIBAE_SAFETY = 'course_jibae_safety_6';

export const INITIAL_COURSES: Course[] = [
  {
    id: SAMPLE_COURSE_ID,
    name: '집배팀장 직무역량강화 과정',
    cohort: '제2기',
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    location: '323 강의실',
    manager: '이병근 담임교수',
    notes: '첨부파일 시간표 원본 일치 (우정인재개발원 집배팀장 5일 36시간 직무과정)',
    createdAt: '2026-09-25T09:00:00.000Z',
    updatedAt: '2026-09-25T09:00:00.000Z',
  },
  {
    id: COURSE_JIBAE_NEW,
    name: '9급 신규 집배직 기본직무 및 안전배달 과정',
    cohort: '제15기',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    location: '202호 집배실습실',
    manager: '정집배 사무관',
    notes: '신규 임용 집배직 기본 직무, 순로구분 실습, 이륜차 안전운전 및 모바일 PDA 활용',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: COURSE_JIBAE_SMART,
    name: '스마트 집배물류 및 PDA 실습과정',
    cohort: '제4기',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    location: '259 우편전산실습실',
    manager: '박경원 전산교관',
    notes: '차세대 모바일 단말기, 우편물류정보시스템(PostNet) 및 스마트 순로구분 전산 실무',
    createdAt: '2026-10-10T09:00:00.000Z',
    updatedAt: '2026-10-10T09:00:00.000Z',
  },
  {
    id: COURSE_JIBAE_SAFETY,
    name: '집배 이륜차 안전운행 및 사고예방 심화과정',
    cohort: '제6기',
    startDate: '2026-11-16',
    endDate: '2026-11-20',
    location: '323 강의실 / 야외주행실습장',
    manager: '강안전 교수',
    notes: '이륜차 방어운전 실기, 빗길/빙판길 위험회피, 안전모 및 보호구 착용 실기, 집배 위험성평가',
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
  },
];

export const INITIAL_TRAINEES: Trainee[] = [
  // Course 1 Trainees (18명)
  { id: 'tr_01', courseId: SAMPLE_COURSE_ID, order: 1, affiliation: '서울강남', rank: '집배서기', name: '김철수', gender: '남', group: '1조', dorm: '희망 201', notes: '조장' },
  { id: 'tr_02', courseId: SAMPLE_COURSE_ID, order: 2, affiliation: '서울송파', rank: '집배서기', name: '이영희', gender: '여', group: '1조', dorm: '온누리 301', notes: '' },
  { id: 'tr_03', courseId: SAMPLE_COURSE_ID, order: 3, affiliation: '부산연제', rank: '집배주사보', name: '박민수', gender: '남', group: '1조', dorm: '희망 201', notes: '' },
  { id: 'tr_04', courseId: SAMPLE_COURSE_ID, order: 4, affiliation: '대구수성', rank: '집배서기', name: '정수진', gender: '여', group: '1조', dorm: '온누리 302', notes: '' },
  { id: 'tr_05', courseId: SAMPLE_COURSE_ID, order: 5, affiliation: '인천남동', rank: '집배서기', name: '최동현', gender: '남', group: '1조', dorm: '희망 202', notes: '' },
  { id: 'tr_06', courseId: SAMPLE_COURSE_ID, order: 6, affiliation: '광주광산', rank: '집배주사보', name: '강지훈', gender: '남', group: '2조', dorm: '희망 202', notes: '조장' },
  { id: 'tr_07', courseId: SAMPLE_COURSE_ID, order: 7, affiliation: '대전유성', rank: '집배서기', name: '윤아름', gender: '여', group: '2조', dorm: '온누리 303', notes: '' },
  { id: 'tr_08', courseId: SAMPLE_COURSE_ID, order: 8, affiliation: '울산남구', rank: '집배주사보', name: '조현우', gender: '남', group: '2조', dorm: '희망 203', notes: '' },
  { id: 'tr_09', courseId: SAMPLE_COURSE_ID, order: 9, affiliation: '수원영통', rank: '집배서기', name: '한예슬', gender: '여', group: '2조', dorm: '온누리 303', notes: '' },
  { id: 'tr_10', courseId: SAMPLE_COURSE_ID, order: 10, affiliation: '천안', rank: '집배주사보', name: '임태호', gender: '남', group: '2조', dorm: '비생활', notes: '통근' },
  { id: 'tr_11', courseId: SAMPLE_COURSE_ID, order: 11, affiliation: '성남분당', rank: '집배서기', name: '오세훈', gender: '남', group: '3조', dorm: '희망 203', notes: '' },
  { id: 'tr_12', courseId: SAMPLE_COURSE_ID, order: 12, affiliation: '창원', rank: '집배주사보', name: '배수지', gender: '여', group: '3조', dorm: '온누리 304', notes: '' },
  { id: 'tr_13', courseId: SAMPLE_COURSE_ID, order: 13, affiliation: '전주', rank: '집배서기', name: '신동엽', gender: '남', group: '3조', dorm: '희망 204', notes: '' },
  { id: 'tr_14', courseId: SAMPLE_COURSE_ID, order: 14, affiliation: '청주', rank: '집배주사보', name: '유재석', gender: '남', group: '3조', dorm: '희망 204', notes: '조장' },
  { id: 'tr_15', courseId: SAMPLE_COURSE_ID, order: 15, affiliation: '원주', rank: '집배서기', name: '송지효', gender: '여', group: '3조', dorm: '온누리 304', notes: '' },
  { id: 'tr_16', courseId: SAMPLE_COURSE_ID, order: 16, affiliation: '춘천', rank: '집배서기', name: '이광수', gender: '남', group: '4조', dorm: '희망 205', notes: '' },
  { id: 'tr_17', courseId: SAMPLE_COURSE_ID, order: 17, affiliation: '포항', rank: '집배주사보', name: '하동훈', gender: '남', group: '4조', dorm: '희망 205', notes: '조장' },
  { id: 'tr_18', courseId: SAMPLE_COURSE_ID, order: 18, affiliation: '제주', rank: '집배서기', name: '양세찬', gender: '남', group: '4조', dorm: '희망 205', notes: '' },

  // Course 2: 신규 집배직 15기 Trainees
  { id: 'tr_new_01', courseId: COURSE_JIBAE_NEW, order: 1, affiliation: '서울중앙', rank: '집배서기보(시보)', name: '홍길동', gender: '남', group: '1조', dorm: '희망 101', notes: '신규대표' },
  { id: 'tr_new_02', courseId: COURSE_JIBAE_NEW, order: 2, affiliation: '부산사하', rank: '집배서기보(시보)', name: '김나래', gender: '여', group: '1조', dorm: '온누리 201', notes: '' },
  { id: 'tr_new_03', courseId: COURSE_JIBAE_NEW, order: 3, affiliation: '인천부평', rank: '집배서기보(시보)', name: '이준호', gender: '남', group: '1조', dorm: '희망 101', notes: '' },
  { id: 'tr_new_04', courseId: COURSE_JIBAE_NEW, order: 4, affiliation: '대구달서', rank: '집배서기보(시보)', name: '박서현', gender: '여', group: '1조', dorm: '온누리 201', notes: '' },
  { id: 'tr_new_05', courseId: COURSE_JIBAE_NEW, order: 5, affiliation: '광주북구', rank: '집배서기보(시보)', name: '정우성', gender: '남', group: '2조', dorm: '희망 102', notes: '조장' },
  { id: 'tr_new_06', courseId: COURSE_JIBAE_NEW, order: 6, affiliation: '대전서구', rank: '집배서기보(시보)', name: '강동원', gender: '남', group: '2조', dorm: '희망 102', notes: '' },
  { id: 'tr_new_07', courseId: COURSE_JIBAE_NEW, order: 7, affiliation: '울산중구', rank: '집배서기보(시보)', name: '한가인', gender: '여', group: '2조', dorm: '온누리 202', notes: '' },
  { id: 'tr_new_08', courseId: COURSE_JIBAE_NEW, order: 8, affiliation: '경기일산', rank: '집배서기보(시보)', name: '송중기', gender: '남', group: '2조', dorm: '희망 103', notes: '' },
  { id: 'tr_new_09', courseId: COURSE_JIBAE_NEW, order: 9, affiliation: '강원원주', rank: '집배서기보(시보)', name: '김태리', gender: '여', group: '3조', dorm: '온누리 203', notes: '조장' },
  { id: 'tr_new_10', courseId: COURSE_JIBAE_NEW, order: 10, affiliation: '충북충주', rank: '집배서기보(시보)', name: '조인성', gender: '남', group: '3조', dorm: '희망 103', notes: '' },
  { id: 'tr_new_11', courseId: COURSE_JIBAE_NEW, order: 11, affiliation: '전남순천', rank: '집배서기보(시보)', name: '손예진', gender: '여', group: '3조', dorm: '온누리 203', notes: '' },
  { id: 'tr_new_12', courseId: COURSE_JIBAE_NEW, order: 12, affiliation: '경북구미', rank: '집배서기보(시보)', name: '현빈', gender: '남', group: '3조', dorm: '희망 104', notes: '' },

  // Course 3: 스마트 집배물류 4기 Trainees
  { id: 'tr_sm_01', courseId: COURSE_JIBAE_SMART, order: 1, affiliation: '서울강동', rank: '집배서기', name: '차은우', gender: '남', group: '1조', dorm: '희망 301', notes: '조장' },
  { id: 'tr_sm_02', courseId: COURSE_JIBAE_SMART, order: 2, affiliation: '부산해운대', rank: '집배주사보', name: '아이유', gender: '여', group: '1조', dorm: '온누리 401', notes: '' },
  { id: 'tr_sm_03', courseId: COURSE_JIBAE_SMART, order: 3, affiliation: '경기수원', rank: '집배서기', name: '박보검', gender: '남', group: '1조', dorm: '희망 301', notes: '' },
  { id: 'tr_sm_04', courseId: COURSE_JIBAE_SMART, order: 4, affiliation: '대전중구', rank: '집배서기', name: '김세정', gender: '여', group: '2조', dorm: '온누리 401', notes: '조장' },
  { id: 'tr_sm_05', courseId: COURSE_JIBAE_SMART, order: 5, affiliation: '전북익산', rank: '집배주사보', name: '임영웅', gender: '남', group: '2조', dorm: '희망 302', notes: '' },
  { id: 'tr_sm_06', courseId: COURSE_JIBAE_SMART, order: 6, affiliation: '경남김해', rank: '집배서기', name: '안유진', gender: '여', group: '2조', dorm: '온누리 402', notes: '' },

  // Course 4: 집배 이륜차 안전 6기 Trainees
  { id: 'tr_sf_01', courseId: COURSE_JIBAE_SAFETY, order: 1, affiliation: '서울마포', rank: '집배주사보', name: '마동석', gender: '남', group: '1조', dorm: '희망 401', notes: '안전반장' },
  { id: 'tr_sf_02', courseId: COURSE_JIBAE_SAFETY, order: 2, affiliation: '부산진구', rank: '집배서기', name: '김혜수', gender: '여', group: '1조', dorm: '온누리 501', notes: '' },
  { id: 'tr_sf_03', courseId: COURSE_JIBAE_SAFETY, order: 3, affiliation: '대구동구', rank: '집배주사보', name: '황정민', gender: '남', group: '1조', dorm: '희망 401', notes: '' },
  { id: 'tr_sf_04', courseId: COURSE_JIBAE_SAFETY, order: 4, affiliation: '경기안양', rank: '집배서기', name: '이정재', gender: '남', group: '2조', dorm: '희망 402', notes: '조장' },
  { id: 'tr_sf_05', courseId: COURSE_JIBAE_SAFETY, order: 5, affiliation: '충남아산', rank: '집배서기', name: '전도연', gender: '여', group: '2조', dorm: '온누리 502', notes: '' },
  { id: 'tr_sf_06', courseId: COURSE_JIBAE_SAFETY, order: 6, affiliation: '강원강릉', rank: '집배주사보', name: '정해인', gender: '남', group: '2조', dorm: '희망 402', notes: '' },
];

/**
 * Builds all initial timetable items for the 4 master postal delivery courses
 */
export const INITIAL_TIMETABLE: TimetableItem[] = [
  // Populate from PRESET_JIBAE_CURRICULUMS
  ...PRESET_JIBAE_CURRICULUMS.flatMap((preset) =>
    preset.timetables.map((item, idx) => ({
      ...item,
      id: `time_${preset.id}_${idx + 1}`,
      courseId: preset.id,
    }))
  ),
];
