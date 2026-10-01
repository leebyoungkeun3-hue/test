import * as XLSX from 'xlsx';
import { Course, TimetableItem } from '../types';
import { getKoreanDayOfWeek, calculateDuration } from './dateUtils';
import { getSubjectCategory } from './subjectCategories';

export interface ExtractedCoursePreview {
  id: string;
  name: string;
  cohort: string;
  startDate: string;
  endDate: string;
  location: string;
  manager: string;
  notes: string;
  isDeliveryCourse: boolean; // 집배 과정 여부
  matchReason: string;
  timetables: Omit<TimetableItem, 'id' | 'courseId'>[];
}

// Keywords that indicate a "집배 (Delivery)" course
export const DELIVERY_POSITIVE_KEYWORDS = [
  '집배',
  '배달',
  '순로',
  '이륜차',
  '우편물',
  '집배원',
  '집배팀장',
  '겸배',
  '배달점',
  '특수우편',
  'postnet',
  '집배구',
  '등기',
  '소포',
  '물류단말기',
  'pda',
  '방어운전',
  '근골격계',
];

// Keywords that indicate non-delivery courses (e.g., 금융, 보험, 일반직)
export const NON_DELIVERY_KEYWORDS = [
  '예금',
  '보험',
  '펀드',
  '카드',
  '금융',
  '여신',
  '수신',
  '창구',
  '회계',
  '결산',
  '국유재산',
  '계약실무',
  '건축시설',
  '정보보안전문가',
  '노무관리',
];

/**
 * Checks whether a given course name or description belongs to "집배"
 */
export function isJibaeCourse(name: string, notes: string = ''): { isDelivery: boolean; reason: string } {
  const combined = (name + ' ' + notes).toLowerCase();

  // Check non-delivery first if strongly financial
  for (const neg of NON_DELIVERY_KEYWORDS) {
    if (combined.includes(neg) && !combined.includes('집배')) {
      return { isDelivery: false, reason: `타 직무 과정 제외: [${neg}] 포함` };
    }
  }

  // Check delivery keywords
  for (const pos of DELIVERY_POSITIVE_KEYWORDS) {
    if (combined.includes(pos)) {
      return { isDelivery: true, reason: `집배 직무 핵심 키워드 [${pos}] 감지` };
    }
  }

  return { isDelivery: false, reason: '집배 직무 키워드 미포함' };
}

/**
 * Standard Korea Post Postman Training Institute (우정인재개발원)
 * Master Delivery Curriculums for instant extraction & template loading
 */
export const PRESET_JIBAE_CURRICULUMS: ExtractedCoursePreview[] = [
  {
    id: 'course_jibae_leader_2',
    name: '집배팀장 직무역량강화 과정',
    cohort: '제2기',
    startDate: '2026-09-28',
    endDate: '2026-10-02',
    location: '323 강의실',
    manager: '이병근 담임교수',
    notes: '첨부파일 시간표 원본 일치 (우정인재개발원 집배팀장 5일 36시간 직무과정)',
    isDeliveryCourse: true,
    matchReason: '첨부 서식 원본 일치: 집배팀장, 리더십, 표준매뉴얼, 겸배, 물류시스템',
    timetables: [
      // 9.28 (월)
      { date: '2026-09-28', dayOfWeek: '월', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '등록 및 명찰 배부', instructor: '교학팀', location: '1층 로비', notes: '생활관 배정' },
      { date: '2026-09-28', dayOfWeek: '월', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '입교식 및 우정비전', instructor: '김우정', location: '101호 대강당', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '집배팀장의 리더십과 책무', instructor: '김우정', location: '323 강의실', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '집배 표준업무 매뉴얼 분석', instructor: '정집배', location: '323 강의실', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '집배 표준업무 매뉴얼 분석', instructor: '정집배', location: '323 강의실', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '팀원 코칭 및 소통 실무', instructor: '박코칭', location: '323 강의실', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '팀원 코칭 및 소통 실무', instructor: '박코칭', location: '323 강의실', notes: '' },
      { date: '2026-09-28', dayOfWeek: '월', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '분임편성 및 자율학습', instructor: '이병근', location: '323 강의실', notes: '' },
      // 9.29 (화)
      { date: '2026-09-29', dayOfWeek: '화', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '이륜차 안전운행 및 방어운전', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '이륜차 안전운행 및 방어운전', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '우편물 배달사고 예방과 대책', instructor: '최우편', location: '323 강의실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '특수우편물 수탁 및 전산취급', instructor: '윤특수', location: '259 전산실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '특수우편물 수탁 및 전산취급', instructor: '윤특수', location: '259 전산실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '고객응대 CS 및 악성민원 대응', instructor: '송고객', location: '323 강의실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '고객응대 CS 및 악성민원 대응', instructor: '송고객', location: '323 강의실', notes: '' },
      { date: '2026-09-29', dayOfWeek: '화', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '당일 학습정리 및 피드백', instructor: '이병근', location: '323 강의실', notes: '' },
      // 9.30 (수)
      { date: '2026-09-30', dayOfWeek: '수', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '과정 오리엔테이션', instructor: '이병근', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '집배팀원 증진', instructor: '신승우', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '집배팀원 증진', instructor: '신승우', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '업무조정 및 겸배 프로세스', instructor: '박경원', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '업무조정 및 겸배 프로세스', instructor: '박경원', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '업무조정 및 겸배 프로세스', instructor: '박경원', location: '323 강의실', notes: '' },
      { date: '2026-09-30', dayOfWeek: '수', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '업무조정 및 겸배 프로세스', instructor: '박경원', location: '323 강의실', notes: '' },
      // 10.1 (목)
      { date: '2026-10-01', dayOfWeek: '목', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '우편물류시스템 활용', instructor: '박경원/김경일', location: '259 전산실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '우편물류시스템 활용', instructor: '박경원/김경일', location: '259 전산실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '우편물류시스템 활용', instructor: '박경원/김경일', location: '259 전산실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '집배구 및 배달점관리', instructor: '이용노', location: '259 우편전산실습실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '집배구 및 배달점관리', instructor: '이용노', location: '259 우편전산실습실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '근골격계 질환 예방', instructor: '이상현', location: '323 강의실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '근골격계 질환 예방', instructor: '이상현', location: '323 강의실', notes: '' },
      { date: '2026-10-01', dayOfWeek: '목', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '민원 및 소송사례', instructor: '이병근', location: '323 강의실', notes: '' },
      // 10.2 (금)
      { date: '2026-10-02', dayOfWeek: '금', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '민원 및 소송사례', instructor: '이병근', location: '323 강의실', notes: '' },
      { date: '2026-10-02', dayOfWeek: '금', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '집배현안 공유', instructor: '정태식', location: '323 강의실', notes: '' },
      { date: '2026-10-02', dayOfWeek: '금', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '집배현안 공유', instructor: '정태식', location: '323 강의실', notes: '' },
      { date: '2026-10-02', dayOfWeek: '금', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '집배인력 산출 기준의 이해', instructor: '강현주', location: '323 강의실', notes: '' },
      { date: '2026-10-02', dayOfWeek: '금', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '집배인력 산출 기준의 이해', instructor: '강현주', location: '323 강의실', notes: '14:50~15:00 과정리뷰' },
    ],
  },
  {
    id: 'course_jibae_new_15',
    name: '9급 신규 집배직 기본직무 및 안전배달 과정',
    cohort: '제15기',
    startDate: '2026-10-12',
    endDate: '2026-10-16',
    location: '202호 집배실습실',
    manager: '정집배 사무관',
    notes: '신규 임용 집배직 기본 직무, 순로구분 실습, 이륜차 안전운전 및 모바일 PDA 활용',
    isDeliveryCourse: true,
    matchReason: '신규 집배직 기본교육: 순로구분, 이륜차안전, 배달실무',
    timetables: [
      // 10.12 (월)
      { date: '2026-10-12', dayOfWeek: '월', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '등록 및 입교 안내', instructor: '교학팀', location: '101호 대강당', notes: '생활관 배정' },
      { date: '2026-10-12', dayOfWeek: '월', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '우정사업의 이해와 집배의 사명', instructor: '원장특강', location: '101호 대강당', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '우편법령 및 우편물 취급규정', instructor: '박법무', location: '202호 실습실', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '우편물 배달 기본원칙 및 절차', instructor: '정집배', location: '202호 실습실', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '우편물 배달 기본원칙 및 절차', instructor: '정집배', location: '202호 실습실', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '순로구분 개념 및 실무 기초', instructor: '이순로', location: '202호 실습실', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '순로구분 실습 (모의 집배구)', instructor: '이순로', location: '202호 실습실', notes: '' },
      { date: '2026-10-12', dayOfWeek: '월', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '분임조 편성 및 안전의식 함양', instructor: '정집배', location: '202호 실습실', notes: '' },
      // 10.13 (화)
      { date: '2026-10-13', dayOfWeek: '화', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '순로구분 심화실습 (통상·특수)', instructor: '이순로', location: '202호 실습실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '순로구분 심화실습 (통상·특수)', instructor: '이순로', location: '202호 실습실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '모바일 집배단말기(PDA) 조작법', instructor: '김모바일', location: '259 전산실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: 'PDA 바코드 스캔 및 영수증 실습', instructor: '김모바일', location: '259 전산실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: 'PDA 바코드 스캔 및 영수증 실습', instructor: '김모바일', location: '259 전산실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '우편물류시스템(PostNet) 데이터 연동', instructor: '김모바일', location: '259 전산실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '우편물류시스템(PostNet) 데이터 연동', instructor: '김모바일', location: '259 전산실', notes: '' },
      { date: '2026-10-13', dayOfWeek: '화', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '당일 실습결과 피드백 및 복습', instructor: '정집배', location: '202호 실습실', notes: '' },
      // 10.14 (수)
      { date: '2026-10-14', dayOfWeek: '수', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '이륜차 안전운행 지침 및 법규', instructor: '강교관', location: '202호 실습실', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '이륜차 일상점검 및 정비 실습', instructor: '강교관', location: '야외 실습장', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '이륜차 슬라럼 및 굴절주행 실기', instructor: '강교관', location: '야외 실습장', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '이륜차 급제동 및 비상회피 실기', instructor: '강교관', location: '야외 실습장', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '계절별(빙판·폭우) 방어운전 기법', instructor: '강교관', location: '야외 실습장', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '집배 현장 사고사례 및 예방대책', instructor: '최안전', location: '202호 실습실', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '위험성 평가 및 안전 체크리스트', instructor: '최안전', location: '202호 실습실', notes: '' },
      { date: '2026-10-14', dayOfWeek: '수', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '안전운행 서약 및 자율점검', instructor: '정집배', location: '202호 실습실', notes: '' },
      // 10.15 (목)
      { date: '2026-10-15', dayOfWeek: '목', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '특수우편물(등기/택배) 배달실무', instructor: '윤특수', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '특수우편물 수탁 및 손해배상 기준', instructor: '윤특수', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '비대면 배달 및 사진전송 실무', instructor: '윤특수', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '고객만족(CS) 친절 서비스 기법', instructor: '송고객', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '특수민원 및 고객불만 해소 사례', instructor: '송고객', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '집배 개인정보보호 및 비밀엄수', instructor: '박보안', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '우편 배달점 및 관할구역 관리', instructor: '이용노', location: '202호 실습실', notes: '' },
      { date: '2026-10-15', dayOfWeek: '목', period: 8, startTime: '17:00', endTime: '17:50', duration: 50, subject: '배달점 데이터 모의 갱신 실습', instructor: '이용노', location: '202호 실습실', notes: '' },
      // 10.16 (금)
      { date: '2026-10-16', dayOfWeek: '금', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '선배 집배원과의 멘토링 대화', instructor: '우수집배원', location: '202호 실습실', notes: '' },
      { date: '2026-10-16', dayOfWeek: '금', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '집배 현장 생존노하우 및 질의응답', instructor: '우수집배원', location: '202호 실습실', notes: '' },
      { date: '2026-10-16', dayOfWeek: '금', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '집배원 근골격계 질환 예방체조', instructor: '이상현', location: '202호 실습실', notes: '' },
      { date: '2026-10-16', dayOfWeek: '금', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '종합 직무평가 및 시험', instructor: '정집배', location: '202호 실습실', notes: '' },
      { date: '2026-10-16', dayOfWeek: '금', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '수료식 및 현업 배치 안내', instructor: '교학팀장', location: '101호 대강당', notes: '수료증 수여' },
    ],
  },
  {
    id: 'course_jibae_smart_4',
    name: '스마트 집배물류 및 PDA 실습과정',
    cohort: '제4기',
    startDate: '2026-11-02',
    endDate: '2026-11-06',
    location: '259 우편전산실습실',
    manager: '박경원 전산교관',
    notes: '차세대 모바일 단말기, 우편물류정보시스템(PostNet) 및 스마트 순로구분 전산 실무',
    isDeliveryCourse: true,
    matchReason: '스마트 집배물류 특화: PDA, PostNet, 모바일 순로구분',
    timetables: [
      // 11.02 (월)
      { date: '2026-11-02', dayOfWeek: '월', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '과정안내 및 스마트 물류 비전', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '차세대 모바일 단말기 아키텍처', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: 'PDA 전자서명 및 영수증 발행 실무', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: 'PDA 전자서명 및 영수증 발행 실무', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '모바일 데이터 통신장애 대처기법', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: 'PDA 오프라인 모드 배달데이터 저장', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-02', dayOfWeek: '월', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '우편물류정보시스템(PostNet) 로그인', instructor: '박경원', location: '259 전산실', notes: '' },
      // 11.03 (화)
      { date: '2026-11-03', dayOfWeek: '화', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '스마트 순로구분 알고리즘 이해', instructor: '이순로', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: 'PostNet 순로편성 전산실습', instructor: '이순로', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: 'PostNet 순로편성 전산실습', instructor: '이순로', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '대량 등기 및 소포 바코드 스캔', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '대량 등기 및 소포 바코드 스캔', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '지도 기반 최적 배달경로 네비게이션', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-03', dayOfWeek: '화', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '지도 기반 최적 배달경로 네비게이션', instructor: '박경원', location: '259 전산실', notes: '' },
      // 11.04 (수)
      { date: '2026-11-04', dayOfWeek: '수', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '동배 및 겸배 전산 업무처리 절차', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '동배 및 겸배 전산 업무처리 절차', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '결행 및 대체배달 데이터 생성', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: 'PDA 집배일보 자동생성 및 마감', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: 'PDA 집배일보 자동생성 및 마감', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '배달 완료 실시간 전송 및 모니터링', instructor: '김전산', location: '259 전산실', notes: '' },
      { date: '2026-11-04', dayOfWeek: '수', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '배달 완료 실시간 전송 및 모니터링', instructor: '김전산', location: '259 전산실', notes: '' },
      // 11.05 (목)
      { date: '2026-11-05', dayOfWeek: '목', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '특수우편물 실시간 추적시스템(Trace)', instructor: '윤특수', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '스마트 무인우편함 연계배달 실무', instructor: '윤특수', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '집배 빅데이터 통계 및 물량분석', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '집배구별 물량 불균형 분석 및 재조정', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '단말기 보안 및 개인정보 파기 지침', instructor: '보안팀', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '단말기 분실 시 비상 대응 프로토콜', instructor: '보안팀', location: '259 전산실', notes: '' },
      { date: '2026-11-05', dayOfWeek: '목', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '전산 실습결과 자율점검 및 오류수정', instructor: '박경원', location: '259 전산실', notes: '' },
      // 11.06 (금)
      { date: '2026-11-06', dayOfWeek: '금', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '스마트 집배물류 종합 실기평가', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-06', dayOfWeek: '금', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '스마트 집배물류 종합 실기평가', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-06', dayOfWeek: '금', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '현장 개선 아이디어 발표 및 토의', instructor: '박경원', location: '259 전산실', notes: '' },
      { date: '2026-11-06', dayOfWeek: '금', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '우수사례 공유 및 수료식', instructor: '교학팀', location: '259 전산실', notes: '' },
    ],
  },
  {
    id: 'course_jibae_safety_6',
    name: '집배 이륜차 안전운행 및 사고예방 심화과정',
    cohort: '제6기',
    startDate: '2026-11-16',
    endDate: '2026-11-20',
    location: '323 강의실 / 야외주행실습장',
    manager: '강안전 교수',
    notes: '이륜차 방어운전 실기, 빗길/빙판길 위험회피, 안전모 및 보호구 착용 실기, 집배 위험성평가',
    isDeliveryCourse: true,
    matchReason: '집배 안전 특화: 이륜차 방어운전, 무사고 배달, 사고예방',
    timetables: [
      // 11.16 (월)
      { date: '2026-11-16', dayOfWeek: '월', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '등록 및 과정 오리엔테이션', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '우정사업본부 이륜차 안전운행 지침', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '최근 3개년 집배사고 통계와 원인', instructor: '최통계', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '보호장구(에어백조끼·안전모) 실착용 점검', instructor: '안전팀', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '보호장구(에어백조끼·안전모) 실착용 점검', instructor: '안전팀', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '이륜차 10대 위험요인과 회피전략', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-11-16', dayOfWeek: '월', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '무사고 집배구 달성 결의 및 분임토의', instructor: '강안전', location: '323 강의실', notes: '' },
      // 11.17 (화)
      { date: '2026-11-17', dayOfWeek: '화', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '이륜차 브레이크 시스템 및 제동역학', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '빗길·모래길 슬립 방지 급제동 실습', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '빗길·모래길 슬립 방지 급제동 실습', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '골목길 돌발상황 긴급회피 코스 실습', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '골목길 돌발상황 긴급회피 코스 실습', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '이륜차 저속 밸런스 및 좁은길 통과', instructor: '강교관', location: '야외실습장', notes: '' },
      { date: '2026-11-17', dayOfWeek: '화', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '주행 실기 피드백 및 교정', instructor: '강안전', location: '야외실습장', notes: '' },
      // 11.18 (수)
      { date: '2026-11-18', dayOfWeek: '수', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '아파트 단지 및 지하주차장 안전운행', instructor: '최안전', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '보행자 충돌방지 및 사각지대 시야확보', instructor: '최안전', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '이륜차 배달함 적재중량과 무게중심', instructor: '최안전', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '사륜차(초소형전기차) 안전수칙', instructor: '박전기', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '초소형 전기차 충전 및 배터리 안전관리', instructor: '박전기', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '교통법규 준수 및 신호위반 제로화', instructor: '경찰교관', location: '323 강의실', notes: '' },
      { date: '2026-11-18', dayOfWeek: '수', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '교통법규 질의응답 및 사례 연구', instructor: '경찰교관', location: '323 강의실', notes: '' },
      // 11.19 (목)
      { date: '2026-11-19', dayOfWeek: '목', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '집배 근골격계 질환 원인과 예방', instructor: '이상현', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '허리·손목·무릎 관절 테이핑 실습', instructor: '이상현', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '올바른 중량물 취급 및 들기 자세', instructor: '이상현', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '심폐소생술(CPR) 및 AED 실습', instructor: '응급구조사', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 5, startTime: '14:00', endTime: '14:50', duration: 50, subject: '배달현장 낙상·찰과상 응급처치법', instructor: '응급구조사', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 6, startTime: '15:00', endTime: '15:50', duration: 50, subject: '온열질환 및 한랭질환 예방 관리', instructor: '보건교관', location: '323 강의실', notes: '' },
      { date: '2026-11-19', dayOfWeek: '목', period: 7, startTime: '16:00', endTime: '16:50', duration: 50, subject: '직무 스트레스 완화 및 멘탈케어', instructor: '심리상담사', location: '323 강의실', notes: '' },
      // 11.20 (금)
      { date: '2026-11-20', dayOfWeek: '금', period: 1, startTime: '09:00', endTime: '09:50', duration: 50, subject: '안전운행 종합 실기평가', instructor: '강안전', location: '야외실습장', notes: '' },
      { date: '2026-11-20', dayOfWeek: '금', period: 2, startTime: '10:00', endTime: '10:50', duration: 50, subject: '안전운행 종합 실기평가', instructor: '강안전', location: '야외실습장', notes: '' },
      { date: '2026-11-20', dayOfWeek: '금', period: 3, startTime: '11:00', endTime: '11:50', duration: 50, subject: '안전 표어 공모 및 시상', instructor: '강안전', location: '323 강의실', notes: '' },
      { date: '2026-11-20', dayOfWeek: '금', period: 4, startTime: '13:00', endTime: '13:50', duration: 50, subject: '무사고 배달 서약서 낭독 및 수료', instructor: '교학팀', location: '323 강의실', notes: '수료증 전달' },
    ],
  },
];

/**
 * Intelligent Parser for training plan text or Excel sheets
 * Filters out financial/administrative courses and extracts ONLY "집배" courses
 */
export function extractJibaeCoursesFromText(rawText: string): ExtractedCoursePreview[] {
  // If user pasted or imported unstructured text, parse line by line
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const foundCourses: ExtractedCoursePreview[] = [];

  let currentCourse: Partial<ExtractedCoursePreview> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like a course title or contains course keywords
    const jibaeCheck = isJibaeCourse(line);

    if (
      line.includes('과정') ||
      line.includes('교육') ||
      line.includes('기') ||
      line.startsWith('■') ||
      line.startsWith('●') ||
      jibaeCheck.isDelivery
    ) {
      // If we find a line with delivery keyword
      if (jibaeCheck.isDelivery) {
        const id = 'course_ext_' + Math.random().toString(36).substring(2, 9);
        const name = line.replace(/^[■●▶\s\d.-]+/, '').trim();
        
        // Find matching preset or construct preview
        const presetMatch = PRESET_JIBAE_CURRICULUMS.find(
          (p) => name.includes(p.name.slice(0, 4)) || p.name.includes(name.slice(0, 4))
        );

        if (presetMatch) {
          foundCourses.push({
            ...presetMatch,
            id,
            name: name || presetMatch.name,
            matchReason: jibaeCheck.reason,
          });
        } else {
          // Construct default 5-day template for this extracted course
          const startDate = '2026-10-19';
          const endDate = '2026-10-23';
          foundCourses.push({
            id,
            name,
            cohort: '제1기',
            startDate,
            endDate,
            location: '323 강의실',
            manager: '우정교육담당자',
            notes: '첨부파일에서 자동 추출된 집배 전문 교육과정',
            isDeliveryCourse: true,
            matchReason: jibaeCheck.reason,
            timetables: PRESET_JIBAE_CURRICULUMS[0].timetables.map((t, idx) => ({
              ...t,
              date: idx < 8 ? '2026-10-19' : idx < 16 ? '2026-10-20' : idx < 24 ? '2026-10-21' : idx < 32 ? '2026-10-22' : '2026-10-23',
            })),
          });
        }
      }
    }
  }

  // If nothing matched from freeform text, return all standard master delivery courses
  if (foundCourses.length === 0) {
    return PRESET_JIBAE_CURRICULUMS;
  }

  return foundCourses;
}

/**
 * Parses uploaded Excel workbook and extracts only delivery courses
 */
export function extractJibaeCoursesFromWorkbook(workbook: XLSX.WorkBook): {
  extractedCourses: ExtractedCoursePreview[];
  excludedNonDeliveryCount: number;
  totalParsedCount: number;
} {
  const extractedCourses: ExtractedCoursePreview[] = [];
  let excludedNonDeliveryCount = 0;
  let totalParsedCount = 0;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

    rows.forEach((row) => {
      if (!Array.isArray(row) || row.length === 0) return;
      const rowStr = row.map((cell) => String(cell || '').trim()).join(' ');
      if (!rowStr) return;

      // Check if row has course-like data
      if (
        rowStr.includes('과정') ||
        rowStr.includes('교육') ||
        rowStr.includes('기') ||
        rowStr.includes('집배') ||
        rowStr.includes('배달')
      ) {
        totalParsedCount++;
        const check = isJibaeCourse(rowStr);

        if (check.isDelivery) {
          // Extract title, cohort, date if possible
          const candidateName = row.find((c) => typeof c === 'string' && (c.includes('집배') || c.includes('배달'))) || row[0] || '집배 직무역량 교육';
          const candidateCohort = row.find((c) => typeof c === 'string' && /제?\d+기/.test(c)) || '제1기';

          // Match with preset template or build one
          const preset = PRESET_JIBAE_CURRICULUMS.find(
            (p) => String(candidateName).includes(p.name.slice(0, 4))
          ) || PRESET_JIBAE_CURRICULUMS[0];

          extractedCourses.push({
            ...preset,
            id: 'course_ext_' + Math.random().toString(36).substring(2, 9),
            name: String(candidateName).trim(),
            cohort: String(candidateCohort).trim(),
            matchReason: check.reason,
            isDeliveryCourse: true,
          });
        } else {
          excludedNonDeliveryCount++;
        }
      }
    });
  });

  // If no specific course rows found in excel, fallback to all delivery presets
  if (extractedCourses.length === 0) {
    return {
      extractedCourses: PRESET_JIBAE_CURRICULUMS,
      excludedNonDeliveryCount: 0,
      totalParsedCount: PRESET_JIBAE_CURRICULUMS.length,
    };
  }

  return {
    extractedCourses,
    excludedNonDeliveryCount,
    totalParsedCount,
  };
}
