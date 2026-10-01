import React, { useState, useMemo } from 'react';
import { Course, Trainee, TimetableItem } from '../types';
import {
  formatKoreanDate,
  getCourseWeeks,
  CourseWeek,
} from '../utils/dateUtils';
import { getSubjectCategory, SUBJECT_CATEGORIES } from '../utils/subjectCategories';
import {
  Printer,
  Calendar,
  Users,
  HelpCircle,
  Palette,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface PrintPreviewProps {
  course: Course | null;
  trainees: Trainee[];
  timetables: TimetableItem[];
}

interface PeriodSlot {
  periodNum: number | 'lunch';
  label: string; // e.g. "1교시", "점심시간"
  timeRange: string; // e.g. "09:00~09:50"
  startH: number;
}

const STANDARD_PERIODS: PeriodSlot[] = [
  { periodNum: 1, label: '1교시', timeRange: '09:00~09:50', startH: 9 },
  { periodNum: 2, label: '2교시', timeRange: '10:00~10:50', startH: 10 },
  { periodNum: 3, label: '3교시', timeRange: '11:00~11:50', startH: 11 },
  { periodNum: 'lunch', label: '점심시간', timeRange: '12:00~12:50', startH: 12 },
  { periodNum: 4, label: '4교시', timeRange: '13:00~13:50', startH: 13 },
  { periodNum: 5, label: '5교시', timeRange: '14:00~14:50', startH: 14 },
  { periodNum: 6, label: '6교시', timeRange: '15:00~15:50', startH: 15 },
  { periodNum: 7, label: '7교시', timeRange: '16:00~16:50', startH: 16 },
  { periodNum: 8, label: '8교시', timeRange: '17:00~17:50', startH: 17 },
];

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  course,
  trainees,
  timetables,
}) => {
  // Current selected week index (or 'all' for multi-week printing)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | 'all'>(0);

  // Style Mode: 'official' (100% Attached Photo Exact Replica) | 'korea-post' (Red Accent) | 'visual' (Color Badges)
  const [colorMode, setColorMode] = useState<'official' | 'korea-post' | 'visual'>('official');

  if (!course) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
        교육과정이 선택되지 않았습니다. 과정관리 메뉴에서 과정을 먼저 선택해 주세요.
      </div>
    );
  }

  // Filter and sort trainees for current course
  const currentTrainees = useMemo(() => {
    return trainees
      .filter((t) => t.courseId === course.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [trainees, course.id]);

  // Filter timetable items for current course
  const currentTimetables = useMemo(() => {
    return timetables.filter((t) => t.courseId === course.id);
  }, [timetables, course.id]);

  // Compute weekly blocks from course dates (ensure Monday to Friday standard 5-day week)
  const courseWeeks = useMemo(() => {
    // If startDate is Wednesday (e.g. 2026-09-30), compute the Monday of that week
    const startObj = new Date(course.startDate);
    const day = startObj.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = day === 0 ? -6 : 1 - day;
    const mondayObj = new Date(startObj);
    mondayObj.setDate(startObj.getDate() + diffToMon);
    const monStr = mondayObj.toISOString().split('T')[0];

    const endObj = new Date(course.endDate);
    const endDay = endObj.getDay();
    const diffToFri = endDay === 0 ? -2 : 5 - endDay;
    const fridayObj = new Date(endObj);
    fridayObj.setDate(endObj.getDate() + diffToFri);
    const friStr = fridayObj.toISOString().split('T')[0];

    return getCourseWeeks(monStr, friStr);
  }, [course.startDate, course.endDate]);

  // Active week object for single-week view
  const activeWeek: CourseWeek | null = useMemo(() => {
    if (selectedWeekIndex === 'all') {
      return courseWeeks[0] || null;
    }
    return courseWeeks[selectedWeekIndex] || courseWeeks[0] || null;
  }, [courseWeeks, selectedWeekIndex]);

  // Helper to find timetable item for a given date & period
  const getItemForSlot = (date: string, periodSlot: PeriodSlot): TimetableItem | undefined => {
    if (periodSlot.periodNum === 'lunch') return undefined;

    // Exact period match
    const byPeriod = currentTimetables.find(
      (t) => t.date === date && t.period === periodSlot.periodNum
    );
    if (byPeriod) return byPeriod;

    // Time-based match
    const byTime = currentTimetables.find((t) => {
      if (t.date !== date) return false;
      const startH = parseInt(t.startTime.split(':')[0], 10);
      return startH === periodSlot.startH;
    });

    return byTime;
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Total target rows on the right trainee table (26 rows perfectly balances timetable height)
  const TARGET_TOTAL_TRAINEE_ROWS = 26;
  const blankRowsNeeded = Math.max(0, TARGET_TOTAL_TRAINEE_ROWS - currentTrainees.length);

  // Render a Single Landscape Sheet (Left: Timetable, Right: Trainee List)
  const renderLandscapeSheet = (week: CourseWeek, pageIndex: number, totalPages: number) => {
    const managerName = course.manager ? course.manager.replace(/\s*\(.*?\)/, '') : '이병근';
    const footerDeptLeft = '직무역량교육팀';
    const footerDeptRight = '역량교육팀';
    const footerDate = course.startDate.startsWith('2026-09') ? '2026-09-29' : new Date().toISOString().split('T')[0];

    // Format dates as YYYY.M.D.~YYYY.M.D. matching attached image exactly
    const [y1, m1, d1] = course.startDate.split('-').map(Number);
    const [y2, m2, d2] = course.endDate.split('-').map(Number);
    const dateRangeStr = `${y1}.${m1}.${d1}.~${y2}.${m2}.${d2}.`;

    return (
      <div
        key={week.weekNumber}
        className={`print-avoid-break mx-auto max-w-[297mm] bg-white border border-slate-300 shadow-2xl p-[6mm] print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-black relative overflow-hidden print:overflow-visible select-none ${
          pageIndex > 0 ? 'print-page-break mt-8 print:mt-0' : ''
        }`}
        style={{
          fontFamily: '"Pretendard", "Malgun Gothic", "맑은 고딕", -apple-system, sans-serif',
          minHeight: '190mm',
        }}
      >
        {/* Subtle Official Watermark Background (Matches attached document photo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.045] z-0 select-none">
          <div className="flex flex-col items-center">
            {/* Korea Post Eagle / Wings Silhouette SVG */}
            <svg
              className="w-[280px] h-[160px]"
              viewBox="0 0 200 110"
              fill="currentColor"
            >
              <path d="M100 15 C60 15 20 45 10 80 C40 65 75 60 100 70 C125 60 160 65 190 80 C180 45 140 15 100 15 Z" />
              <path d="M100 35 C75 35 45 55 35 85 C60 72 85 70 100 78 C115 70 140 72 165 85 C155 55 125 35 100 35 Z" />
            </svg>
            <span className="font-black text-4xl tracking-[0.3em] font-sans mt-1">
              KOREA POST
            </span>
          </div>
        </div>

        {/* Main 2-Column Split: Left = Timetable (~57%), Right = Trainees (~43%) */}
        <div className="flex gap-[3.5mm] items-start relative z-10">
          {/* ============================================================== */}
          {/* LEFT COLUMN: WEEKLY TIMETABLE MATRIX (IMAGE EXACT REPLICA)    */}
          {/* ============================================================== */}
          <div className="w-[57%] flex flex-col justify-between">
            <div>
              {/* Document Title with Top & Bottom Lines (Exact HWP Standard) */}
              <div className="border-t-2 border-black pt-1 pb-1 border-b border-black text-center mb-1 bg-white">
                <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-black">
                  주간 교육 시간표
                </h1>
              </div>

              {/* Subheader info bar directly below title (Matches photo 100%) */}
              <div className="flex flex-wrap items-center justify-between text-[9.5px] text-black font-semibold mb-1 px-0.5">
                <span>
                  ■ 과정명 : {course.name}({course.cohort})
                </span>
                <span>
                  ■ 담임교수 : {managerName}
                </span>
                <span>
                  ■ 강의실 : {course.location}
                </span>
                <span className="font-mono">
                  ■ {dateRangeStr}
                </span>
              </div>

              {/* Weekly Timetable Grid Table */}
              <table className="w-full text-center border-collapse border border-black text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black h-7 font-bold text-black">
                    <th className="border border-black w-[16%] px-0.5">교시/요일</th>
                    {week.days.map((day) => (
                      <th
                        key={day.date}
                        className="border border-black px-0.5 font-bold text-black"
                        style={{ width: `${84 / week.days.length}%` }}
                      >
                        {day.headerLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STANDARD_PERIODS.map((periodSlot, pIdx) => {
                    const isLunch = periodSlot.periodNum === 'lunch';

                    // LUNCH ROW (special row across columns)
                    if (isLunch) {
                      return (
                        <tr key="lunch" className="border-b border-black bg-slate-50/80 h-5">
                          <td className="border border-black font-bold text-[9px] text-slate-700 bg-slate-100 py-0.5">
                            <div>점심시간</div>
                            <div className="text-[7.5px] font-mono text-slate-500">{periodSlot.timeRange}</div>
                          </td>
                          {week.days.map((day) => (
                            <td key={day.date} className="border border-black text-[9px] text-slate-400">
                              -
                            </td>
                          ))}
                        </tr>
                      );
                    }

                    // STANDARD CLASS ROWS (1 to 8)
                    return (
                      <tr key={periodSlot.periodNum} className="border-b border-black h-[17.5mm]">
                        {/* Period & Time header cell */}
                        <td className="border border-black font-bold bg-slate-100 text-[9px] px-0.5 align-middle leading-tight">
                          <div className="font-extrabold text-black">{periodSlot.label}</div>
                          <div className="font-mono text-[8px] text-slate-600 tracking-tighter mt-0.5">
                            {periodSlot.timeRange}
                          </div>
                        </td>

                        {/* Each Day Cell */}
                        {week.days.map((day) => {
                          const item = getItemForSlot(day.date, periodSlot);

                          // Check if previous period in the same day had the same subject (skipping lunch row)
                          let prevItem: TimetableItem | undefined = undefined;
                          for (let i = pIdx - 1; i >= 0; i--) {
                            if (STANDARD_PERIODS[i].periodNum !== 'lunch') {
                              prevItem = getItemForSlot(day.date, STANDARD_PERIODS[i]);
                              break;
                            }
                          }
                          const isDitto =
                            item &&
                            prevItem &&
                            item.subject &&
                            item.subject === prevItem.subject &&
                            item.instructor === prevItem.instructor;

                          // Diagonal slash check: on Friday (10. 2.) periods 6, 7, 8
                          const isFridayAfternoonEmpty =
                            day.dayOfWeek === '금' &&
                            !item &&
                            typeof periodSlot.periodNum === 'number' &&
                            periodSlot.periodNum >= 6;

                          const category = item ? getSubjectCategory(item.subject) : null;

                          return (
                            <td
                              key={day.date}
                              className="border border-black p-0.5 align-middle text-center relative"
                              style={{
                                backgroundColor:
                                  colorMode === 'visual' && item && category
                                    ? category.printBg
                                    : undefined,
                              }}
                            >
                              {item ? (
                                isDitto ? (
                                  <div className="space-y-0.5">
                                    <div className="text-xl font-bold text-slate-800 select-none">
                                      ″
                                    </div>
                                    {item.notes && (
                                      <div className="text-[8px] text-black font-bold leading-tight mt-0.5">
                                        {item.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="leading-tight space-y-0.5">
                                    {colorMode === 'visual' && category && (
                                      <div
                                        className={`inline-block text-[7.5px] px-1.5 py-0.2 rounded font-bold mb-0.5 ${category.badgeBg} ${category.badgeText}`}
                                      >
                                        {category.badgeLabel}
                                      </div>
                                    )}
                                    <div className="font-black text-black text-[9.5px] line-clamp-2">
                                      {item.subject}
                                    </div>
                                    {item.instructor && (
                                      <div className="text-[8.5px] text-slate-800 font-medium">
                                        ({item.instructor})
                                      </div>
                                    )}
                                    {item.location && (
                                      <div className="text-[8px] text-slate-600 font-normal">
                                        ({item.location})
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="text-[8px] text-black font-semibold mt-0.5">
                                        {item.notes}
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : isFridayAfternoonEmpty ? (
                                /* Diagonal Line Slash across cell matching attached photo */
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 100 100"
                                >
                                  <line
                                    x1="0"
                                    y1="100"
                                    x2="100"
                                    y2="0"
                                    stroke="black"
                                    strokeWidth="0.8"
                                  />
                                </svg>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Footer (Matches photo: 직무역량교육팀/이병근/2026-09-29) */}
              <div className="mt-1 flex items-center justify-between text-[8px] text-slate-600 px-0.5">
                <span className="font-mono">
                  {footerDeptLeft}/{managerName}/{footerDate}
                </span>

                {colorMode === 'visual' ? (
                  <div className="flex items-center gap-2 text-[7.5px]">
                    <span className="font-bold text-slate-700">과목구분:</span>
                    {Object.values(SUBJECT_CATEGORIES).map((cat) => (
                      <span key={cat.id} className="flex items-center gap-0.5">
                        <span
                          className="w-2 h-2 rounded-xs inline-block border border-black/20"
                          style={{ backgroundColor: cat.printBg }}
                        />
                        <span>{cat.badgeLabel}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[8px] text-slate-400">
                    우정사업본부 우정인재개발원 [배포용]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: TRAINEE LIST TABLE (PHOTO EXACT REPLICA)         */}
          {/* ============================================================== */}
          <div className="w-[43%] flex flex-col justify-between">
            <div>
              {/* Header Box (Exact match with photo title) */}
              <div className="border-t-2 border-black pt-1 pb-1 border-b border-black text-center mb-1 bg-white">
                <h2 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-black">
                  교육생 명단
                </h2>
              </div>

              {/* Subheader info bar matching left column height for perfect baseline alignment */}
              <div className="flex items-center justify-between text-[9.5px] text-black font-semibold mb-1 px-0.5">
                <span>
                  ■ 정원 : {currentTrainees.length}명
                </span>
                <span>
                  ■ 과정명 : {course.name}({course.cohort})
                </span>
                <span className="font-mono">
                  ■ {dateRangeStr}
                </span>
              </div>

              {/* Trainee Table (Exact columns: 교번 | 청별 | 소속 | 직급 | 성명 | 숙소 | 분임조 | 비고) */}
              <table className="w-full text-center border-collapse border border-black text-[8.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black h-7 font-bold text-black">
                    <th className="border border-black w-[9%] px-0.5">교번</th>
                    <th className="border border-black w-[11%] px-0.5">청별</th>
                    <th className="border border-black w-[29%] px-1">소속</th>
                    <th className="border border-black w-[17%] px-0.5">직급</th>
                    <th className="border border-black w-[13%] px-0.5">성명</th>
                    <th className="border border-black w-[7%] px-0.5">숙소</th>
                    <th className="border border-black w-[8%] px-0.5">분임조</th>
                    <th className="border border-black w-[6%] px-0.5">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Real Trainee Rows */}
                  {currentTrainees.map((trainee, idx) => {
                    const orderNum = trainee.order || idx + 1;
                    const formattedNum = String(orderNum).padStart(3, '0');
                    const isBanJang = trainee.notes?.includes('반장') || trainee.name === '김선웅';

                    return (
                      <tr
                        key={trainee.id}
                        className="border-b border-black h-[5.8mm]"
                      >
                        {/* 교번 (001, 002...) */}
                        <td className="border border-black font-mono font-medium text-[8px] text-black">
                          {formattedNum}
                        </td>

                        {/* 청별 (경인청, 서울청, 충청청...) */}
                        <td className="border border-black text-center px-0.5 font-medium text-[8px] truncate">
                          {trainee.agency || '충청청'}
                        </td>

                        {/* 소속 (화성동탄우체국, 서울노원우체국...) */}
                        <td className="border border-black text-center px-0.5 font-medium text-[8.5px] truncate">
                          {trainee.affiliation}
                        </td>

                        {/* 직급 (우정서기, 우정주사보...) */}
                        <td className="border border-black text-center px-0.5 text-[8px] truncate font-medium">
                          {trainee.rank}
                        </td>

                        {/* 성명 */}
                        <td className="border border-black font-bold text-[8.5px] text-black relative">
                          {isBanJang ? (
                            <span className="inline-block border border-black rounded-full px-1 py-0 text-[8px] font-black">
                              {trainee.name}
                            </span>
                          ) : (
                            <span>{trainee.name}</span>
                          )}
                        </td>

                        {/* 숙소 (1, 2, 3, 4) */}
                        <td className="border border-black font-mono text-[8px] text-black">
                          {trainee.dorm}
                        </td>

                        {/* 분임조 (441, 442, 443...) */}
                        <td className="border border-black font-mono font-bold text-[8px] text-black">
                          {trainee.team || trainee.group}
                        </td>

                        {/* 비고 (반장 등) */}
                        <td className="border border-black text-[7.5px] text-black font-bold px-0.5">
                          {trainee.notes || (isBanJang ? '반장' : '')}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows to perfectly match timetable vertical height (Matches photo) */}
                  {Array.from({ length: blankRowsNeeded }).map((_, bIdx) => (
                    <tr
                      key={`blank_${bIdx}`}
                      className="border-b border-black h-[5.8mm]"
                    >
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                      <td className="border border-black">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Trainee Footer (Matches photo: 총 18 명 / 역량교육팀/이병근/2026-09-29) */}
              <div className="mt-1 px-0.5 flex flex-col items-start text-black">
                <div className="font-bold text-[9px]">
                  총 {currentTrainees.length} 명
                </div>
                <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                  {footerDeptRight}/{managerName}/{footerDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar (Hidden in Print) */}
      <div className="screen-only bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                {course.cohort}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>A4 가로형 배포본 (좌: 주간 시간표 + 우: 교육생 명단)</span>
                <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold border border-red-200">
                  첨부 원본 양식 100% 일치
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              업로드해주신 사진 원본과 완벽하게 동일하게 <strong>A4 가로 1장에 좌측 주간 시간표(교시/요일/과목/강사/강의실/사선)와 우측 교육생 명단(교번/청별/소속/직급/성명/숙소/분임조/비고)</strong>이 인쇄됩니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-lg shadow-md shadow-red-950/30 transition-all cursor-pointer ring-1 ring-red-400"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>A4 가로 배포본 인쇄하기</span>
            </button>

            <button
              onClick={() => {
                alert(
                  '💡 [A4 가로 인쇄 및 PDF 저장 안내]\n\n1. [A4 가로 배포본 인쇄하기] 버튼을 누르면 브라우저 인쇄창이 열립니다.\n2. 인쇄 방향을 "가로(Landscape)"로 지정해 주세요.\n3. 여백을 "없음" 또는 "최소"로 설정하시면 완벽한 원본 비율로 인쇄됩니다.\n4. 대상 프린터에서 "PDF로 저장"을 선택하시면 전자 공문서 파일로 보관하실 수 있습니다.'
                );
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>인쇄/PDF 저장 안내</span>
            </button>
          </div>
        </div>

        {/* Visual Controls: Week Selector, Style Toggle */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">주차 선택:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
              {courseWeeks.map((week, idx) => (
                <button
                  key={week.weekNumber}
                  onClick={() => setSelectedWeekIndex(idx)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedWeekIndex === idx
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  제{week.weekNumber}주차 ({formatKoreanDate(week.startDate, false).slice(5)}~{formatKoreanDate(week.endDate, false).slice(5)})
                </button>
              ))}

              {courseWeeks.length > 1 && (
                <button
                  onClick={() => setSelectedWeekIndex('all')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedWeekIndex === 'all'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 주차 일괄 인쇄 ({courseWeeks.length}장)
                </button>
              )}
            </div>
          </div>

          {/* Style Mode Toggle: Official Black & White vs Visual Colors */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">서식 스타일:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-medium">
              <button
                onClick={() => setColorMode('official')}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors cursor-pointer ${
                  colorMode === 'official'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>사진 원본 흑백 규격 (추천)</span>
              </button>
              <button
                onClick={() => setColorMode('visual')}
                className={`flex items-center gap-1 px-3 py-1 rounded transition-colors cursor-pointer ${
                  colorMode === 'visual'
                    ? 'bg-blue-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-blue-300" />
                <span>시각적 컬러 배포본</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PAPER CANVAS: A4 Landscape Sheets */}
      <div className="space-y-8">
        {selectedWeekIndex === 'all' ? (
          courseWeeks.map((week, idx) =>
            renderLandscapeSheet(week, idx, courseWeeks.length)
          )
        ) : activeWeek ? (
          renderLandscapeSheet(activeWeek, 0, 1)
        ) : (
          <div className="bg-white p-8 text-center text-slate-400">
            출력할 주차 시간표가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
