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

// Standard 8 periods + Lunch
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

  // Density mode: 'normal' | 'compact' (for large rosters)
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');

  // Style Mode: 'korea-post' (Korea Post signature red) | 'visual' (Multi-color category) | 'official' (HWP standard monochrome)
  const [colorMode, setColorMode] = useState<'korea-post' | 'visual' | 'official'>('korea-post');

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

  // Compute weekly blocks from course dates
  const courseWeeks = useMemo(() => {
    return getCourseWeeks(course.startDate, course.endDate);
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

    // First try exact period number match
    const byPeriod = currentTimetables.find(
      (t) => t.date === date && t.period === periodSlot.periodNum
    );
    if (byPeriod) return byPeriod;

    // Second try time matching (e.g. startTime begins with 09: for 1st period)
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

  // Render a Single Landscape Sheet (Left: Timetable, Right: Trainee List)
  const renderLandscapeSheet = (week: CourseWeek, pageIndex: number, totalPages: number) => {
    const managerName = course.manager ? course.manager.replace(/\s*\(.*?\)/, '') : '담임교수';
    const footerDept = '직무역량교육팀';
    const footerDate = course.startDate === '2026-09-28' ? '2026-09-29' : new Date().toISOString().split('T')[0];

    return (
      <div
        key={week.weekNumber}
        className={`print-avoid-break mx-auto max-w-[297mm] bg-white border border-slate-300 shadow-xl p-[7mm] text-black ${
          pageIndex > 0 ? 'print-page-break mt-8' : ''
        }`}
        style={{
          fontFamily: '"Pretendard", "Malgun Gothic", "맑은 고딕", -apple-system, sans-serif',
        }}
      >
        {/* Main 2-Column Split: Left = Timetable (~62%), Right = Trainees (~38%) */}
        <div className="flex gap-[3.5mm] items-start">
          {/* ============================================================== */}
          {/* LEFT COLUMN: WEEKLY TIMETABLE MATRIX (IMAGE EXACT REPLICA)    */}
          {/* ============================================================== */}
          <div className="w-[62%] flex flex-col justify-between">
            <div>
              {/* Document Title with Top & Bottom Lines (HWP Standard) */}
              <div className="border-t-2 border-black pt-1 pb-1 border-b border-black text-center mb-1.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-widest text-black">
                  주간 교육 시간표
                </h1>
              </div>

              {/* Subheader info bar directly below title */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-black font-semibold mb-1.5 px-0.5">
                <span className="flex items-center gap-1">
                  <span className="text-[9px]">■</span> 과정명 : {course.name}({course.cohort})
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[9px]">■</span> 담임교수 : {managerName}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-[9px]">■</span> 강의실 : {course.location}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <span className="text-[9px]">■</span>{' '}
                  {(() => {
                    const [y1, m1, d1] = course.startDate.split('-').map(Number);
                    const [y2, m2, d2] = course.endDate.split('-').map(Number);
                    return `${y1}.${m1}.${d1}.~${y2}.${m2}.${d2}.`;
                  })()}
                </span>
              </div>

              {/* Weekly Timetable Grid Table */}
              <table className="w-full text-center border-collapse border border-black text-[9.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black h-7 font-bold text-black">
                    <th className="border border-black w-[17%] px-1">교시/요일</th>
                    {week.days.map((day) => (
                      <th
                        key={day.date}
                        className={`border border-black px-1 font-bold ${
                          day.dayOfWeek === '토' || day.dayOfWeek === '일' ? 'text-red-600' : 'text-black'
                        }`}
                        style={{ width: `${83 / week.days.length}%` }}
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
                            <div className="text-[8px] font-mono text-slate-500">{periodSlot.timeRange}</div>
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
                      <tr key={periodSlot.periodNum} className="border-b border-black h-[18mm]">
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

                          // Check if previous period in the same day had the same subject
                          const prevSlot = STANDARD_PERIODS[pIdx - 1];
                          const prevItem = prevSlot ? getItemForSlot(day.date, prevSlot) : undefined;
                          const isDitto =
                            item &&
                            prevItem &&
                            item.subject &&
                            item.subject === prevItem.subject &&
                            item.instructor === prevItem.instructor;

                          const isWithinCourse = day.date >= course.startDate && day.date <= course.endDate;
                          const showDiagonal = isWithinCourse && !item;

                          const category = item ? getSubjectCategory(item.subject) : null;

                          return (
                            <td
                              key={day.date}
                              className={`border border-black p-1 align-middle text-center relative ${
                                showDiagonal ? 'diagonal-slash' : ''
                              }`}
                              style={{
                                backgroundColor:
                                  colorMode !== 'official' && item && category
                                    ? category.printBg
                                    : undefined,
                              }}
                            >
                              {item ? (
                                isDitto ? (
                                  <div className="space-y-0.5">
                                    <div className="text-base font-bold text-slate-700 select-none">
                                      ″
                                    </div>
                                    {item.notes && (
                                      <div className="text-[8px] text-slate-900 font-bold border-t border-black/20 pt-0.5 mt-0.5">
                                        {item.notes}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="leading-tight space-y-0.5">
                                    {colorMode !== 'official' && category && (
                                      <div
                                        className={`inline-block text-[7.5px] px-1.5 py-0.2 rounded font-bold mb-0.5 ${
                                          colorMode === 'korea-post' && (category.id === 'safety' || category.id === 'delivery')
                                            ? 'bg-red-700 text-white'
                                            : `${category.badgeBg} ${category.badgeText}`
                                        }`}
                                      >
                                        {category.badgeLabel}
                                      </div>
                                    )}
                                    <div className="font-extrabold text-black text-[10px] line-clamp-2">
                                      {item.subject}
                                    </div>
                                    {item.instructor && (
                                      <div className="text-[8.5px] text-slate-700 font-medium">
                                        ({item.instructor})
                                      </div>
                                    )}
                                    {item.location && (
                                      <div className="text-[8px] text-slate-500 font-normal">
                                        ({item.location})
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="text-[8px] text-slate-900 font-semibold border-t border-black/20 pt-0.5 mt-0.5">
                                        {item.notes}
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Footer & Category Legend */}
              <div className="mt-1.5 flex items-center justify-between text-[8.5px] text-slate-600 px-0.5">
                <span className="font-mono">
                  {footerDept}/{managerName}/{footerDate}
                </span>

                {colorMode === 'visual' ? (
                  <div className="flex items-center gap-2 text-[8px]">
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
                    우정사업본부 우정인재개발원 [배포용] {totalPages > 1 ? `(${pageIndex + 1}/${totalPages})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: TRAINEE LIST TABLE (IMAGE EXACT REPLICA)         */}
          {/* ============================================================== */}
          <div className="w-[38%] flex flex-col justify-between">
            <div>
              {/* Header Box */}
              <div className="border-t-2 border-black pt-1 pb-1 border-b border-black text-center mb-1.5 bg-slate-100">
                <h2 className="text-base font-bold text-black tracking-wider">
                  교육생 명단
                  <span className="text-xs font-normal text-slate-600 ml-1.5">
                    (총 {currentTrainees.length}명)
                  </span>
                </h2>
              </div>

              {/* Subheader info note */}
              <div className="flex items-center justify-between text-[9px] text-slate-700 mb-1.5 px-0.5">
                <span>■ {course.cohort} 교육생</span>
                <span className="font-mono">생활관: 희망관/온누리관</span>
              </div>

              {/* Trainee Table */}
              <table className="w-full text-center border-collapse border border-black text-[9px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black h-7 font-bold text-black">
                    <th className="border border-black w-9 px-0.5">교번</th>
                    <th className="border border-black w-14 px-1 text-center">성명</th>
                    <th className="border border-black px-1 text-left">소속 (총괄국)</th>
                    <th className="border border-black w-16 px-1">직급</th>
                    <th className="border border-black w-8 px-0.5">조</th>
                    <th className="border border-black w-16 px-1 text-center">숙소</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrainees.length > 0 ? (
                    currentTrainees.map((trainee, idx) => {
                      // 3-digit number formatting (001, 002, 003...)
                      const orderNum = trainee.order || idx + 1;
                      const formattedNum = String(orderNum).padStart(3, '0');

                      return (
                        <tr
                          key={trainee.id}
                          className={`border-b border-black ${
                            density === 'compact' ? 'h-[6.2mm]' : 'h-[7.2mm]'
                          } ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                        >
                          {/* 교번 (001, 002...) */}
                          <td className="border border-black font-mono font-bold text-[9px] text-slate-800">
                            {formattedNum}
                          </td>

                          {/* 성명 */}
                          <td className="border border-black font-extrabold text-[9.5px] text-black">
                            {trainee.name}
                          </td>

                          {/* 소속 */}
                          <td className="border border-black text-left px-1 font-medium truncate max-w-[70px]">
                            {trainee.affiliation}
                          </td>

                          {/* 직급 */}
                          <td className="border border-black text-[8.5px] text-slate-700 truncate max-w-[50px]">
                            {trainee.rank}
                          </td>

                          {/* 조 */}
                          <td className="border border-black font-bold text-black">
                            {trainee.group}
                          </td>

                          {/* 숙소 */}
                          <td className="border border-black text-[8.5px] text-slate-700 truncate max-w-[55px]">
                            {trainee.dorm}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-black py-8 text-center text-slate-400">
                        등록된 교육생이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Trainee Footer */}
              <div className="mt-1.5 text-[8.5px] text-slate-500 text-right px-0.5">
                ※ 명단 문의: 인재개발과 ({managerName})
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
      <div className="screen-only bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                {course.cohort}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>A4 가로형 배포자료 (좌: 주간 시간표 + 우: 명단)</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  집배 전문 교육과정
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              첨부 서식과 동일하게 <strong>A4 가로 1장에 좌측 주간 시간표와 우측 교육생 명단이 공문서 규격으로 인쇄</strong>됩니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-lg shadow-md shadow-red-950/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>A4 가로 배포본 인쇄하기</span>
            </button>

            <button
              onClick={() => {
                alert(
                  '💡 [A4 가로 인쇄 및 PDF 저장 안내]\n\n1. [인쇄하기] 버튼을 누르면 브라우저 인쇄창이 열립니다.\n2. 인쇄 방향이 "가로(Landscape)"로 지정되어 있는지 확인하세요.\n3. 대상 프린터에서 "PDF로 저장"을 선택하시면 전자 파일로 보관하실 수 있습니다.\n4. 용지 여백을 "없음" 또는 "최소"로 설정하시면 규격에 완벽히 맞추어 출력됩니다.'
                );
              }}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>인쇄/PDF 저장 안내</span>
            </button>
          </div>
        </div>

        {/* Visual Controls: Week Selector, Style (Visual Color vs Official B&W), Density */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">주차 선택:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
              {courseWeeks.map((week, idx) => (
                <button
                  key={week.weekNumber}
                  onClick={() => setSelectedWeekIndex(idx)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
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

          {/* Color Mode & Density */}
          <div className="flex items-center gap-3">
            {/* Visual Color Mode Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">서식 스타일:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-medium">
                <button
                  onClick={() => setColorMode('korea-post')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    colorMode === 'korea-post'
                      ? 'bg-red-700 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span>우정 레드 배포본</span>
                </button>
                <button
                  onClick={() => setColorMode('visual')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    colorMode === 'visual'
                      ? 'bg-white text-blue-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>시각적 컬러 배포본</span>
                </button>
                <button
                  onClick={() => setColorMode('official')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    colorMode === 'official'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>정통 공문서 흑백</span>
                </button>
              </div>
            </div>

            {/* Density toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">명단 행 간격:</span>
              <button
                onClick={() => setDensity(density === 'normal' ? 'compact' : 'normal')}
                className="text-xs px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
              >
                {density === 'normal' ? '여유 있게' : '조밀하게'}
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
