import React, { useState, useMemo } from 'react';
import { Course, TimetableItem } from '../types';
import {
  getKoreanDayOfWeek,
  calculateDuration,
  formatKoreanDate,
  getCourseWeeks,
} from '../utils/dateUtils';
import { exportTimetableToExcel } from '../utils/excel';
import { getSubjectCategory, SUBJECT_CATEGORIES } from '../utils/subjectCategories';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  CalendarDays,
  Table as TableIcon,
  MapPin,
  User,
  CheckCircle2,
  Filter,
  Shield,
  Truck,
  Monitor,
  HeartHandshake,
  GraduationCap,
  Palette,
  Pencil,
  X,
  Check,
  ChevronDown,
} from 'lucide-react';
import { CurriculumExtractorModal } from './CurriculumExtractorModal';
import { ExtractedCoursePreview } from '../utils/curriculumExtractor';

interface TimetableManagerProps {
  course: Course | null;
  courses: Course[];
  timetables: TimetableItem[];
  onUpdateTimetables: (timetables: TimetableItem[]) => void;
  onImportExtractedCourses?: (courses: ExtractedCoursePreview[]) => void;
}

interface PeriodSlot {
  periodNum: number | 'lunch';
  label: string;
  timeRange: string;
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

// Delivery Standard Subject Presets for 1-Click Stamping
interface SubjectPreset {
  subject: string;
  instructor: string;
  location: string;
  category: 'delivery' | 'system' | 'safety' | 'cs_legal' | 'event';
  duration: number;
}

const JIBAE_QUICK_PRESETS: SubjectPreset[] = [
  { subject: '이륜차 안전운행 및 방어운전', instructor: '강안전', location: '323 강의실', category: 'safety', duration: 50 },
  { subject: '우편물류시스템(PostNet) 활용', instructor: '박경원/김경일', location: '259 전산실', category: 'system', duration: 50 },
  { subject: '집배구 및 배달점관리', instructor: '이용노', location: '259 우편전산실습실', category: 'delivery', duration: 50 },
  { subject: '우편물 순로구분 실습', instructor: '이순로', location: '202호 실습실', category: 'delivery', duration: 50 },
  { subject: '특수우편물 수탁 및 전산취급', instructor: '윤특수', location: '259 전산실', category: 'system', duration: 50 },
  { subject: '근골격계 질환 예방', instructor: '이상현', location: '323 강의실', category: 'safety', duration: 50 },
  { subject: '고객응대 CS 및 악성민원 대응', instructor: '송고객', location: '323 강의실', category: 'cs_legal', duration: 50 },
  { subject: '민원 및 소송사례', instructor: '이병근', location: '323 강의실', category: 'cs_legal', duration: 50 },
  { subject: '집배팀장의 리더십과 책무', instructor: '김우정', location: '323 강의실', category: 'delivery', duration: 50 },
  { subject: '업무조정 및 겸배 프로세스', instructor: '박경원', location: '323 강의실', category: 'delivery', duration: 50 },
  { subject: '집배인력 산출 기준의 이해', instructor: '강현주', location: '323 강의실', category: 'delivery', duration: 50 },
  { subject: '우편물 배달사고 예방과 대책', instructor: '최우편', location: '323 강의실', category: 'safety', duration: 50 },
];

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  course,
  courses,
  timetables,
  onUpdateTimetables,
  onImportExtractedCourses,
}) => {
  // Visual View Mode: 'matrix' (Weekly Visual Calendar) vs 'table' (Excel list)
  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');

  // Visual Theme: 'korea-post' | 'vivid-category' | 'official'
  const [visualTheme, setVisualTheme] = useState<'korea-post' | 'vivid-category' | 'official'>('korea-post');

  // Active week index
  const [activeWeekIndex, setActiveWeekIndex] = useState<number>(0);

  // Category filter (null = all)
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Active date filter in table mode (null = show all)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Extractor modal state
  const [isExtractorModalOpen, setIsExtractorModalOpen] = useState(false);

  // Quick edit modal state
  const [editingItem, setEditingItem] = useState<TimetableItem | null>(null);

  // Preset stamping target modal
  const [selectedPreset, setSelectedPreset] = useState<SubjectPreset | null>(null);
  const [targetSlotDate, setTargetSlotDate] = useState<string>('');
  const [targetSlotPeriod, setTargetSlotPeriod] = useState<number>(1);

  if (!course) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
        교육과정이 선택되지 않았습니다. 과정관리 메뉴에서 과정을 먼저 선택해 주세요.
      </div>
    );
  }

  // Filter items for current course
  const courseTimetables = useMemo(() => {
    return timetables.filter((t) => t.courseId === course.id);
  }, [timetables, course.id]);

  // Course weeks
  const courseWeeks = useMemo(() => {
    return getCourseWeeks(course.startDate, course.endDate);
  }, [course.startDate, course.endDate]);

  const currentWeek = courseWeeks[activeWeekIndex] || courseWeeks[0] || null;

  // Filtered timetables by category
  const filteredTimetables = useMemo(() => {
    if (!filterCategory) return courseTimetables;
    return courseTimetables.filter(
      (t) => getSubjectCategory(t.subject).id === filterCategory
    );
  }, [courseTimetables, filterCategory]);

  // Statistics by category
  const categoryStats = useMemo(() => {
    const counts: Record<string, { lessons: number; minutes: number }> = {};
    Object.keys(SUBJECT_CATEGORIES).forEach((k) => {
      counts[k] = { lessons: 0, minutes: 0 };
    });

    courseTimetables.forEach((t) => {
      const cat = getSubjectCategory(t.subject);
      if (!counts[cat.id]) counts[cat.id] = { lessons: 0, minutes: 0 };
      counts[cat.id].lessons += 1;
      counts[cat.id].minutes += t.duration || 50;
    });

    return counts;
  }, [courseTimetables]);

  const totalCourseMinutes = useMemo(() => {
    return courseTimetables.reduce((acc, t) => acc + (t.duration || 50), 0);
  }, [courseTimetables]);

  const totalCourseHours = Math.round(totalCourseMinutes / 60);

  // Daily hours count for the active 5-day week
  const dailyHoursStats = useMemo(() => {
    if (!currentWeek) return [];
    return currentWeek.days.map((d) => {
      const items = courseTimetables.filter((t) => t.date === d.date);
      const hours = items.reduce((acc, cur) => acc + (cur.duration || 50), 0) / 60;
      return {
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        headerLabel: d.headerLabel,
        count: items.length,
        hours: Math.round(hours * 10) / 10,
      };
    });
  }, [currentWeek, courseTimetables]);

  // Display items for table mode
  const displayItems = useMemo(() => {
    let list = filteredTimetables;
    if (selectedDate && selectedDate !== 'ALL') {
      list = list.filter((t) => t.date === selectedDate);
    }
    return [...list].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.period !== b.period) return (a.period || 0) - (b.period || 0);
      return a.startTime.localeCompare(b.startTime);
    });
  }, [filteredTimetables, selectedDate]);

  // Slot matching helper
  const getItemForSlot = (date: string, periodSlot: PeriodSlot): TimetableItem | undefined => {
    if (periodSlot.periodNum === 'lunch') return undefined;

    const byPeriod = courseTimetables.find(
      (t) => t.date === date && t.period === periodSlot.periodNum
    );
    if (byPeriod) return byPeriod;

    const byTime = courseTimetables.find((t) => {
      if (t.date !== date) return false;
      const startH = parseInt(t.startTime.split(':')[0], 10);
      return startH === periodSlot.startH;
    });

    return byTime;
  };

  // Category Icon helper
  const renderCategoryIcon = (iconName: string, className: string = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'safety':
        return <Shield className={className} />;
      case 'system':
        return <Monitor className={className} />;
      case 'delivery':
        return <Truck className={className} />;
      case 'cs_legal':
        return <HeartHandshake className={className} />;
      case 'event':
      default:
        return <GraduationCap className={className} />;
    }
  };

  // Update a single item
  const handleItemChange = (id: string, field: keyof TimetableItem, value: any) => {
    const updated = timetables.map((item) => {
      if (item.id !== id) return item;

      const newItem = { ...item, [field]: value };
      if (field === 'date') {
        newItem.dayOfWeek = getKoreanDayOfWeek(value);
      }
      if (field === 'startTime' || field === 'endTime') {
        const start = field === 'startTime' ? value : item.startTime;
        const end = field === 'endTime' ? value : item.endTime;
        newItem.duration = calculateDuration(start, end);
      }
      return newItem;
    });

    onUpdateTimetables(updated);
  };

  // Quick add lesson directly to a specific date & period slot
  const handleQuickAddSlot = (date: string, periodSlot: PeriodSlot) => {
    if (periodSlot.periodNum === 'lunch') return;

    const [start, end] = periodSlot.timeRange.split('~');
    const newItem: TimetableItem = {
      id: 'time_' + Math.random().toString(36).substring(2, 9),
      courseId: course.id,
      date,
      dayOfWeek: getKoreanDayOfWeek(date),
      period: typeof periodSlot.periodNum === 'number' ? periodSlot.periodNum : 1,
      startTime: start || '09:00',
      endTime: end || '09:50',
      duration: calculateDuration(start, end) || 50,
      subject: '집배실무 교과목',
      instructor: course.manager || '담당교수',
      location: course.location || '323 강의실',
      notes: '',
    };

    onUpdateTimetables([...timetables, newItem]);
  };

  // Apply Quick Preset to a selected target
  const handleApplyPresetToSlot = (preset: SubjectPreset) => {
    if (!currentWeek || currentWeek.days.length === 0) return;
    setTargetSlotDate(currentWeek.days[0].date);
    setTargetSlotPeriod(1);
    setSelectedPreset(preset);
  };

  const handleConfirmApplyPreset = () => {
    if (!selectedPreset || !targetSlotDate) return;

    const periodSlot = STANDARD_PERIODS.find((p) => p.periodNum === targetSlotPeriod);
    const [start, end] = periodSlot?.timeRange.split('~') || ['09:00', '09:50'];

    // Check if slot already has an item
    const existing = courseTimetables.find(
      (t) => t.date === targetSlotDate && t.period === targetSlotPeriod
    );

    if (existing) {
      // Overwrite
      const updated = timetables.map((item) => {
        if (item.id === existing.id) {
          return {
            ...item,
            subject: selectedPreset.subject,
            instructor: selectedPreset.instructor,
            location: selectedPreset.location,
            duration: selectedPreset.duration,
          };
        }
        return item;
      });
      onUpdateTimetables(updated);
    } else {
      // Create new
      const newItem: TimetableItem = {
        id: 'time_' + Math.random().toString(36).substring(2, 9),
        courseId: course.id,
        date: targetSlotDate,
        dayOfWeek: getKoreanDayOfWeek(targetSlotDate),
        period: targetSlotPeriod,
        startTime: start,
        endTime: end,
        duration: selectedPreset.duration,
        subject: selectedPreset.subject,
        instructor: selectedPreset.instructor,
        location: selectedPreset.location,
        notes: '',
      };
      onUpdateTimetables([...timetables, newItem]);
    }

    setSelectedPreset(null);
  };

  // Duplicate row
  const handleDuplicateRow = (item: TimetableItem) => {
    const newItem: TimetableItem = {
      ...item,
      id: 'time_' + Math.random().toString(36).substring(2, 9),
      period: (item.period || 0) + 1,
    };
    onUpdateTimetables([...timetables, newItem]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    onUpdateTimetables(timetables.filter((t) => t.id !== id));
  };

  // Add new general row
  const handleAddGeneralRow = () => {
    const targetDate = selectedDate && selectedDate !== 'ALL' ? selectedDate : course.startDate;
    const sameDateItems = courseTimetables.filter((t) => t.date === targetDate);
    const nextPeriod = sameDateItems.length + 1;

    const newItem: TimetableItem = {
      id: 'time_' + Math.random().toString(36).substring(2, 9),
      courseId: course.id,
      date: targetDate,
      dayOfWeek: getKoreanDayOfWeek(targetDate),
      period: nextPeriod,
      startTime: '09:00',
      endTime: '09:50',
      duration: 50,
      subject: '',
      instructor: course.manager || '담임교수',
      location: course.location || '323 강의실',
      notes: '',
    };

    onUpdateTimetables([...timetables, newItem]);
  };

  // Export Timetable to Excel
  const handleExportExcel = () => {
    exportTimetableToExcel(courseTimetables, course.name, course.cohort);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Visual Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                {course.cohort}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{course.name} 교육 시간표</span>
                <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                  집배 특화 시각적 시간표
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              월~금 5일 과정의 교과목을 유형별 색상 코딩(집배실무·우편물류·안전보건·CS민원)과 직관적인 캘린더 그리드로 시각화하여 확인하고 편집합니다.
            </p>
          </div>

          {/* Action Buttons & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Matrix vs Table */}
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>주간 캘린더 뷰 (시각적)</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-4 h-4 text-amber-400" />
                <span>교시별 목록 뷰 (엑셀형)</span>
              </button>
            </div>

            {/* Extractor Modal trigger */}
            {onImportExtractedCourses && (
              <button
                onClick={() => setIsExtractorModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-lg shadow-xs transition-all cursor-pointer ring-1 ring-red-400/50"
                title="연간/월간 교육계획에서 집배 교육과정만 추출합니다"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>집배과정 추출</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              disabled={courseTimetables.length === 0}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>시간표 엑셀</span>
            </button>

            <button
              onClick={handleAddGeneralRow}
              className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>새 교시 추가</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VISUAL THEME SELECTOR & 5-DAY PROGRESS BAR                      */}
        {/* ============================================================== */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Visual Theme Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-red-600" />
              시간표 시각 테마:
            </span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
              <button
                onClick={() => setVisualTheme('korea-post')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  visualTheme === 'korea-post'
                    ? 'bg-red-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>우정 레드 테마</span>
              </button>
              <button
                onClick={() => setVisualTheme('vivid-category')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  visualTheme === 'vivid-category'
                    ? 'bg-blue-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>멀티 비주얼 테마</span>
              </button>
              <button
                onClick={() => setVisualTheme('official')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  visualTheme === 'official'
                    ? 'bg-slate-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>관공서 흑백 모드</span>
              </button>
            </div>
          </div>

          {/* Daily 5-Day Hours Progress */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">요일별 배정:</span>
            <div className="flex items-center gap-1">
              {dailyHoursStats.map((stat) => (
                <div
                  key={stat.date}
                  className={`px-2 py-1 rounded border text-center transition-all ${
                    stat.count > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                  title={`${stat.headerLabel}: ${stat.count}교시 (${stat.hours}시간)`}
                >
                  <span className="font-extrabold">{stat.dayOfWeek}</span>{' '}
                  <span className="text-[10px] font-bold text-red-600 font-mono">
                    {stat.count}h
                  </span>
                </div>
              ))}
            </div>
            <div className="ml-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
              총 {totalCourseHours}시간 ({courseTimetables.length}교시)
            </div>
          </div>
        </div>

        {/* VISUAL CATEGORY METRICS BAR */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-blue-900" />
              과목 유형별 시각적 필터:
            </span>

            <button
              onClick={() => setFilterCategory(null)}
              className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer border ${
                filterCategory === null
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'
              }`}
            >
              전체 ({courseTimetables.length}개)
            </button>

            {Object.values(SUBJECT_CATEGORIES).map((cat) => {
              const stat = categoryStats[cat.id] || { lessons: 0, minutes: 0 };
              const isSelected = filterCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(isSelected ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? `${cat.badgeBg} text-white shadow-xs border-transparent ring-2 ring-blue-500/30`
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {renderCategoryIcon(cat.iconName, 'w-3 h-3')}
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {stat.lessons}교시
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            우정인재개발원 공문서 규격
          </div>
        </div>

        {/* ============================================================== */}
        {/* ONE-CLICK DELIVERY QUICK PRESET CHIPS BAR                       */}
        {/* ============================================================== */}
        <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              우정 집배 표준 교과목 원클릭 추가:
            </span>
            <span className="text-[11px] text-slate-400">
              칩을 누르면 희망하는 요일·교시에 즉시 배정됩니다.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {JIBAE_QUICK_PRESETS.map((preset) => {
              const cat = SUBJECT_CATEGORIES[preset.category] || SUBJECT_CATEGORIES.delivery;
              return (
                <button
                  key={preset.subject}
                  onClick={() => handleApplyPresetToSlot(preset)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                >
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-red-600" />
                  <span className="truncate max-w-[170px]">{preset.subject}</span>
                  <span
                    className={`text-[9px] px-1 rounded-sm font-bold text-white ${cat.badgeBg}`}
                  >
                    {cat.badgeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: VISUAL WEEKLY CALENDAR MATRIX (DEFAULT)                */}
      {/* ============================================================== */}
      {viewMode === 'matrix' && currentWeek && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4 sm:p-5">
          {/* Week selector toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">주차 전환:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
                {courseWeeks.map((week, idx) => (
                  <button
                    key={week.weekNumber}
                    onClick={() => setActiveWeekIndex(idx)}
                    className={`px-3 py-1.5 rounded-md font-bold transition-colors cursor-pointer ${
                      activeWeekIndex === idx
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    제{week.weekNumber}주차 ({formatKoreanDate(week.startDate, false).slice(5)}~{formatKoreanDate(week.endDate, false).slice(5)})
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>수업 카드를 클릭하면 <strong>강사·장소·과목명을 즉시 수정</strong>할 수 있습니다.</span>
            </div>
          </div>

          {/* Visual Grid Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-400 h-11 select-none">
                  <th className="border border-slate-400 w-28 px-2 font-black">교시 / 시간</th>
                  {currentWeek.days.map((day) => (
                    <th key={day.date} className="border border-slate-400 px-3 py-2 min-w-[170px]">
                      <div className="font-extrabold text-sm flex items-center justify-center gap-1.5">
                        <span>{day.headerLabel}</span>
                        {day.dayOfWeek === '월' && <span className="text-[10px] text-red-400 font-bold bg-red-950/80 px-1.5 py-0.2 rounded">입교일</span>}
                        {day.dayOfWeek === '금' && <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.2 rounded">수료일</span>}
                      </div>
                      <div className="text-[10px] text-slate-300 font-normal mt-0.5">
                        {courseTimetables.filter((t) => t.date === day.date).length}개 수업 배정
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {STANDARD_PERIODS.map((slot) => {
                  const isLunch = slot.periodNum === 'lunch';

                  if (isLunch) {
                    return (
                      <tr key="lunch" className="bg-slate-100/90 border-b border-slate-300 h-9">
                        <td className="border border-slate-300 font-bold text-xs text-slate-700 bg-slate-200">
                          점심시간 ({slot.timeRange})
                        </td>
                        {currentWeek.days.map((day) => (
                          <td key={day.date} className="border border-slate-300 text-slate-500 font-medium text-xs">
                            🍽️ 구내식당 중식 및 상호교류
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.periodNum} className="border-b border-slate-300 h-28">
                      {/* Period Header */}
                      <td className="border border-slate-300 bg-slate-50 font-bold px-2 align-middle">
                        <div className="text-slate-900 font-black text-sm">{slot.label}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">{slot.timeRange}</div>
                      </td>

                      {/* Each Day Cell */}
                      {currentWeek.days.map((day) => {
                        const item = getItemForSlot(day.date, slot);
                        const isWithinCourse = day.date >= course.startDate && day.date <= course.endDate;
                        const category = item ? getSubjectCategory(item.subject) : null;

                        // Visual styling based on selected theme
                        let cellBg = 'bg-white';
                        let cellBorder = 'border-slate-200';
                        if (visualTheme === 'vivid-category' && category) {
                          cellBg = category.colorBg;
                          cellBorder = category.colorBorder;
                        } else if (visualTheme === 'korea-post' && category) {
                          cellBg = category.id === 'safety' ? 'bg-red-50/70' : category.colorBg;
                          cellBorder = category.id === 'safety' ? 'border-red-300' : category.colorBorder;
                        }

                        return (
                          <td
                            key={day.date}
                            className={`border border-slate-300 p-1.5 align-middle relative transition-all ${
                              !item
                                ? isWithinCourse
                                  ? 'bg-slate-50/50 hover:bg-blue-50/40'
                                  : 'bg-slate-100/40'
                                : ''
                            }`}
                          >
                            {item ? (
                              <div
                                onClick={() => setEditingItem(item)}
                                className={`rounded-xl p-2.5 text-left border shadow-xs h-full flex flex-col justify-between transition-all hover:shadow-md cursor-pointer group relative ${cellBg} ${cellBorder}`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    {category && (
                                      <span
                                        className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-1 shadow-2xs ${category.badgeBg} ${category.badgeText}`}
                                      >
                                        {renderCategoryIcon(category.iconName, 'w-2.5 h-2.5')}
                                        <span>{category.badgeLabel}</span>
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono font-bold text-slate-500">
                                      {item.duration}분
                                    </span>
                                  </div>

                                  <h4 className="font-black text-xs text-slate-900 leading-snug line-clamp-2 mt-0.5">
                                    {item.subject}
                                  </h4>
                                </div>

                                <div>
                                  <div className="mt-2 pt-1.5 border-t border-black/10 flex flex-wrap items-center justify-between text-[10px] text-slate-600">
                                    <div className="flex items-center gap-1 font-semibold truncate max-w-[100px]">
                                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{item.instructor || '담임'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-slate-500 truncate max-w-[80px]">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{item.location || '323호'}</span>
                                    </div>
                                  </div>

                                  {item.notes && (
                                    <div className="text-[9px] text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded mt-1 truncate font-medium">
                                      {item.notes}
                                    </div>
                                  )}
                                </div>

                                {/* Hover fast controls */}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 p-1 rounded-md shadow-xs border border-slate-200">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateRow(item);
                                    }}
                                    className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                                    title="다음 교시로 복제"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRow(item.id);
                                    }}
                                    className="p-1 hover:bg-red-50 text-red-600 rounded"
                                    title="교시 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                {isWithinCourse ? (
                                  <button
                                    onClick={() => handleQuickAddSlot(day.date, slot)}
                                    className="opacity-40 hover:opacity-100 inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
                                    title="이 교시에 수업 등록하기"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>수업 배정</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 select-none">
                                    교육기간 외
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: EXCEL EDITABLE TABLE VIEW                              */}
      {/* ============================================================== */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
          {/* Date Selector Tabs */}
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                selectedDate === null
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              전체 날짜 보기 ({courseTimetables.length})
            </button>
            {courseWeeks.flatMap((w) => w.days).map((day) => {
              const count = courseTimetables.filter((t) => t.date === day.date).length;
              const isSelected = selectedDate === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{day.headerLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-red-500 text-white'
                        : count > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-300 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-28">일자</th>
                  <th className="py-2.5 px-1.5 w-12 text-center">요일</th>
                  <th className="py-2.5 px-1.5 w-14 text-center">교시</th>
                  <th className="py-2.5 px-2 w-20">시작</th>
                  <th className="py-2.5 px-2 w-20">종료</th>
                  <th className="py-2.5 px-1.5 w-16 text-center">시간</th>
                  <th className="py-2.5 px-3 w-24 text-center">유형</th>
                  <th className="py-2.5 px-3 min-w-[200px]">과목명</th>
                  <th className="py-2.5 px-3 w-28">강사명</th>
                  <th className="py-2.5 px-3 w-32">교육장소</th>
                  <th className="py-2.5 px-3">비고</th>
                  <th className="py-2.5 px-2 w-24 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayItems.length > 0 ? (
                  displayItems.map((item, index) => {
                    const category = getSubjectCategory(item.subject);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                            className="w-full border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-1.5 text-center font-bold text-slate-800">
                          {item.dayOfWeek}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={item.period || 1}
                            onChange={(e) =>
                              handleItemChange(item.id, 'period', parseInt(e.target.value, 10) || 1)
                            }
                            className="w-10 border border-slate-200 rounded px-1 py-1 text-center font-bold text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="time"
                            value={item.startTime}
                            onChange={(e) =>
                              handleItemChange(item.id, 'startTime', e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-1 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="time"
                            value={item.endTime}
                            onChange={(e) => handleItemChange(item.id, 'endTime', e.target.value)}
                            className="w-full border border-slate-200 rounded px-1 py-1 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-1.5 text-center font-mono font-bold text-slate-700">
                          {item.duration}분
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${category.badgeBg} ${category.badgeText}`}
                          >
                            {category.badgeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.subject}
                            onChange={(e) => handleItemChange(item.id, 'subject', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-bold text-xs text-slate-900 focus:ring-1 focus:ring-blue-500"
                            placeholder="과목명 입력"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.instructor}
                            onChange={(e) =>
                              handleItemChange(item.id, 'instructor', e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            placeholder="강사명"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) =>
                              handleItemChange(item.id, 'location', e.target.value)
                            }
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                            placeholder="강의실"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                            className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-600"
                            placeholder="비고"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleDuplicateRow(item)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                              title="복제"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(item.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-400">
                      등록된 시간표가 없습니다. 상단의 [+ 새 교시 추가] 또는 [우정 집배 표준과목]을 클릭해 추가해 보세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preset Target Slot Modal */}
      {selectedPreset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>표준 집배과목 배정</span>
              </h3>
              <button
                onClick={() => setSelectedPreset(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-red-50/70 p-3 rounded-lg border border-red-200 text-xs">
              <div className="font-bold text-red-950 text-sm">{selectedPreset.subject}</div>
              <div className="text-slate-600 mt-1 flex gap-3">
                <span>강사: {selectedPreset.instructor}</span>
                <span>장소: {selectedPreset.location}</span>
                <span>시간: {selectedPreset.duration}분</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">배정 요일 (날짜)</label>
                <select
                  value={targetSlotDate}
                  onChange={(e) => setTargetSlotDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {currentWeek?.days.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.headerLabel} ({d.date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">배정 교시</label>
                <select
                  value={targetSlotPeriod}
                  onChange={(e) => setTargetSlotPeriod(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {STANDARD_PERIODS.filter((p) => p.periodNum !== 'lunch').map((p) => (
                    <option key={p.periodNum} value={p.periodNum}>
                      {p.label} ({p.timeRange})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                onClick={() => setSelectedPreset(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmApplyPreset}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                이 교시에 배정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>수업 상세 정보 편집 ({editingItem.period}교시)</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">과목명</label>
                <input
                  type="text"
                  value={editingItem.subject}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, subject: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">담당 강사명</label>
                  <input
                    type="text"
                    value={editingItem.instructor}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, instructor: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">교육장소 (강의실)</label>
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, location: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">시작시간</label>
                  <input
                    type="time"
                    value={editingItem.startTime}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, startTime: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">종료시간</label>
                  <input
                    type="time"
                    value={editingItem.endTime}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, endTime: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">교육시간 (분)</label>
                  <input
                    type="number"
                    value={editingItem.duration}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        duration: parseInt(e.target.value, 10) || 50,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">비고 및 특이사항</label>
                <input
                  type="text"
                  value={editingItem.notes}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="예: 분임편성, 자율학습, 과정리뷰 등"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-between items-center">
              <button
                onClick={() => {
                  handleDeleteRow(editingItem.id);
                  setEditingItem(null);
                }}
                className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>교시 삭제</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    const updated = timetables.map((item) =>
                      item.id === editingItem.id ? editingItem : item
                    );
                    onUpdateTimetables(updated);
                    setEditingItem(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
                >
                  저장 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Extractor Modal */}
      {onImportExtractedCourses && (
        <CurriculumExtractorModal
          isOpen={isExtractorModalOpen}
          onClose={() => setIsExtractorModalOpen(false)}
          onImportExtractedCourses={(extracted) => {
            onImportExtractedCourses(extracted);
            setIsExtractorModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
