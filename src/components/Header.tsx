import React from 'react';
import { Course, ActiveTab } from '../types';
import { Mail, Calendar, MapPin, Printer } from 'lucide-react';
import { formatKoreanDate } from '../utils/dateUtils';

interface HeaderProps {
  courses: Course[];
  activeCourse: Course | null;
  onSelectCourse: (courseId: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courses,
  activeCourse,
  onSelectCourse,
  activeTab,
  onTabChange,
  onQuickPrint,
}) => {
  return (
    <header className="screen-only bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Service Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('courses')}>
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shadow-md">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                  우정사업본부
                </span>
                <span className="text-xs text-slate-400 font-medium">우정인재개발원</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                집배원 교육관리 시스템
                <span className="text-xs font-normal text-slate-400 hidden md:inline">| 교육담당자 업무도구</span>
              </h1>
            </div>
          </div>

          {/* Active Course Quick Switcher & Actions */}
          <div className="flex items-center space-x-3">
            {courses.length > 0 && (
              <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
                <span className="text-xs text-slate-400 font-medium px-2 hidden sm:inline">현재 과정:</span>
                <select
                  value={activeCourse?.id || ''}
                  onChange={(e) => onSelectCourse(e.target.value)}
                  className="bg-slate-900 text-xs sm:text-sm font-semibold text-white px-2.5 py-1.5 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer max-w-[200px] sm:max-w-xs truncate"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.cohort})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeCourse && (
              <div className="hidden xl:flex items-center space-x-3 text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-400" />
                  {formatKoreanDate(activeCourse.startDate, false)} ~ {formatKoreanDate(activeCourse.endDate, false)}
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {activeCourse.location}
                </span>
              </div>
            )}

            <button
              onClick={onQuickPrint}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 active:from-red-700 active:to-red-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-md shadow-red-950/40 ring-2 ring-red-400/50 hover:ring-red-400 border border-red-500/40 transition-all transform active:scale-95 cursor-pointer"
              title="A4 인쇄 미리보기 및 즉시 출력"
            >
              <Printer className="w-4 h-4 text-white drop-shadow-sm" />
              <span className="tracking-tight">A4 인쇄</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
