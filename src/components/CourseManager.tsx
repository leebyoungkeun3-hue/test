import React, { useState } from 'react';
import { Course, Trainee, TimetableItem, ActiveTab } from '../types';
import { formatKoreanDate, calculateDaysBetween } from '../utils/dateUtils';
import {
  Calendar,
  MapPin,
  User,
  Plus,
  Copy,
  Pencil,
  Trash2,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  BookOpen,
  Info,
  CalendarDays,
  Sparkles,
  Shield,
  Truck,
} from 'lucide-react';
import { CurriculumExtractorModal } from './CurriculumExtractorModal';
import { ExtractedCoursePreview } from '../utils/curriculumExtractor';

interface CourseManagerProps {
  courses: Course[];
  activeCourse: Course | null;
  onSelectCourse: (courseId: string) => void;
  onCreateCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onDuplicateCourse: (
    sourceCourse: Course,
    formData: {
      name: string;
      cohort: string;
      startDate: string;
      endDate: string;
      location: string;
      manager: string;
      notes: string;
      copyTimetable: boolean;
      copyTrainees: boolean;
    }
  ) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  trainees: Trainee[];
  timetables: TimetableItem[];
  onImportExtractedCourses?: (courses: ExtractedCoursePreview[]) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  activeCourse,
  onSelectCourse,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onDuplicateCourse,
  onNavigateTab,
  trainees,
  timetables,
  onImportExtractedCourses,
}) => {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isExtractorModalOpen, setIsExtractorModalOpen] = useState(false);
  const [courseToDuplicate, setCourseToDuplicate] = useState<Course | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    cohort: '',
    startDate: '',
    endDate: '',
    location: '우정인재개발원',
    manager: '',
    notes: '',
  });

  const [duplicateOptions, setDuplicateOptions] = useState({
    copyTimetable: true,
    copyTrainees: false,
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: '9급 신규 집배직 교육',
      cohort: `제${courses.length + 1}기`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0],
      location: '우정인재개발원',
      manager: '교육담당 주무관',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (course: Course) => {
    setFormData({
      name: course.name,
      cohort: course.cohort,
      startDate: course.startDate,
      endDate: course.endDate,
      location: course.location,
      manager: course.manager,
      notes: course.notes,
    });
    setIsEditModalOpen(true);
  };

  // Open Duplicate Modal
  const handleOpenDuplicate = (course: Course) => {
    setCourseToDuplicate(course);
    // Parse next cohort number if possible
    const cohortMatch = course.cohort.match(/제?(\d+)기?/);
    const nextCohortNum = cohortMatch ? parseInt(cohortMatch[1], 10) + 1 : '';
    const nextCohort = nextCohortNum ? `제${nextCohortNum}기` : `${course.cohort} (복사본)`;

    // Calculate next month dates by default
    const startDateObj = new Date(course.startDate);
    const endDateObj = new Date(course.endDate);
    const daysDuration = calculateDaysBetween(course.startDate, course.endDate) - 1;

    startDateObj.setMonth(startDateObj.getMonth() + 1);
    const newStartStr = startDateObj.toISOString().split('T')[0];

    const newEndObj = new Date(startDateObj);
    newEndObj.setDate(newEndObj.getDate() + (daysDuration > 0 ? daysDuration : 11));
    const newEndStr = newEndObj.toISOString().split('T')[0];

    setFormData({
      name: course.name,
      cohort: nextCohort,
      startDate: newStartStr,
      endDate: newEndStr,
      location: course.location,
      manager: course.manager,
      notes: `[${course.cohort} 복사생성] ${course.notes || ''}`.trim(),
    });
    setDuplicateOptions({
      copyTimetable: true,
      copyTrainees: false,
    });
    setIsDuplicateModalOpen(true);
  };

  // Save new course
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      alert('과정명, 시작일, 종료일은 필수 입력 항목입니다.');
      return;
    }
    onCreateCourse(formData);
    setIsCreateModalOpen(false);
  };

  // Save edit course
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    onUpdateCourse({
      ...activeCourse,
      ...formData,
      updatedAt: new Date().toISOString(),
    });
    setIsEditModalOpen(false);
  };

  // Execute Duplicate
  const handleSubmitDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseToDuplicate) return;
    onDuplicateCourse(courseToDuplicate, {
      ...formData,
      copyTimetable: duplicateOptions.copyTimetable,
      copyTrainees: duplicateOptions.copyTrainees,
    });
    setIsDuplicateModalOpen(false);
  };

  // Filter items for current active course
  const activeTrainees = activeCourse
    ? trainees.filter((t) => t.courseId === activeCourse.id)
    : [];
  const activeTimetables = activeCourse
    ? timetables.filter((t) => t.courseId === activeCourse.id)
    : [];

  const trainingDaysCount = activeCourse
    ? calculateDaysBetween(activeCourse.startDate, activeCourse.endDate)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & New Course Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>과정관리 및 대시보드</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              우정사업본부 집배원 직무교육
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            기수별 교육과정을 생성하고, 이전 기수 시간표를 복사하여 교육생 명단 및 시간표를 신속하게 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onImportExtractedCourses && (
            <button
              onClick={() => setIsExtractorModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-md shadow-red-950/20 transition-all cursor-pointer ring-1 ring-red-400/50"
              title="연간/월간 교육계획서나 종합시간표에서 오직 '집배' 교육과정만 추출합니다"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>첨부파일 "집배" 교육과정 추출</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-red-400" />
            <span>새 교육과정 만들기</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD: Current Course Status (Section 12) */}
      {activeCourse ? (
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-xl p-5 sm:p-6 text-white shadow-lg border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded shadow-xs">
                  현재 선택된 과정
                </span>
                <span className="text-blue-300 text-xs font-medium">
                  ID: {activeCourse.id}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeCourse.name} <span className="text-red-400 font-bold ml-1">{activeCourse.cohort}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs sm:text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-red-400" />
                    <strong>교육기간:</strong> {formatKoreanDate(activeCourse.startDate, true)} ~ {formatKoreanDate(activeCourse.endDate, true)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <strong>장소:</strong> {activeCourse.location}
                  </span>
                  {activeCourse.manager && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-400" />
                      <strong>담당자:</strong> {activeCourse.manager}
                    </span>
                  )}
                </div>
              </div>

              {activeCourse.notes && (
                <p className="text-xs text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 max-w-2xl">
                  {activeCourse.notes}
                </p>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/70">
              <div className="text-center px-2">
                <div className="text-xs text-slate-400 font-medium">전체 교육생</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {activeTrainees.length}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">명</span>
                </div>
              </div>
              <div className="text-center px-2 border-x border-slate-700">
                <div className="text-xs text-slate-400 font-medium">교육일수</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {trainingDaysCount}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">일</span>
                </div>
              </div>
              <div className="text-center px-2">
                <div className="text-xs text-slate-400 font-medium">시간표 등록</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                  {activeTimetables.length}
                  <span className="text-xs text-slate-400 font-normal ml-0.5">개</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons (Section 12) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => onNavigateTab('trainees')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>교육생 명단 관리</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                onClick={() => onNavigateTab('timetable')}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg border border-slate-600 shadow-xs transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>시간표 작성</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                onClick={() => onNavigateTab('preview')}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>출력 미리보기 (A4)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDuplicate(activeCourse)}
                className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-950 border border-amber-800/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                title="이 과정의 시간표와 구조를 새 기수로 복사합니다"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>이 과정 복사하기</span>
              </button>

              <button
                onClick={() => handleOpenEdit(activeCourse)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>과정정보 수정</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">등록된 교육과정이 없습니다.</p>
              <p className="text-xs text-amber-700 mt-0.5">
                우측 상단의 &apos;새 교육과정 만들기&apos; 버튼을 눌러 첫 과정을 등록해 주세요.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
          >
            과정 생성하기
          </button>
        </div>
      )}

      {/* Course List Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>전체 교육과정 목록</span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              총 {courses.length}개 과정
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            카드 클릭 시 해당 과정으로 즉시 전환됩니다
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const isSelected = activeCourse?.id === course.id;
            const courseTraineesCount = trainees.filter((t) => t.courseId === course.id).length;
            const courseTimetableCount = timetables.filter((t) => t.courseId === course.id).length;
            const daysCount = calculateDaysBetween(course.startDate, course.endDate);

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`relative rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                      {course.cohort}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        선택 중
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-900 leading-snug">
                    {course.name}
                  </h4>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {formatKoreanDate(course.startDate, false)} ~ {formatKoreanDate(course.endDate, false)} ({daysCount}일간)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{course.location}</span>
                    </div>
                    {course.manager && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{course.manager}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>교육생 <strong className="text-slate-800">{courseTraineesCount}명</strong></span>
                    <span>시간표 <strong className="text-slate-800">{courseTimetableCount}개</strong></span>
                  </div>

                  {/* Actions inside card */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenDuplicate(course)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                      title="이 과정 복사 (새 기수 생성)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectCourse(course.id);
                        handleOpenEdit(course);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      title="과정 정보 수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {courses.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`'${course.name} (${course.cohort})' 과정을 정말 삭제하시겠습니까?\n해당 과정의 교육생 및 시간표 데이터도 함께 삭제됩니다.`)) {
                            onDeleteCourse(course.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="과정 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE COURSE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-blue-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-400" />
                새 교육과정 만들기
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  과정명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 9급 신규 집배직 교육"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    기수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 제16기"
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육장소
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육 시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육 종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  담당자 (부서 및 직명)
                </label>
                <input
                  type="text"
                  placeholder="예: 인재개발과 홍길동 주무관"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  비고 (교육목표 및 안내사항)
                </label>
                <textarea
                  rows={2}
                  placeholder="과정 관련 메모 또는 전달사항"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  과정 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                교육과정 정보 수정
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  과정명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    기수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육장소
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육 시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육 종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  담당자
                </label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  비고
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  수정사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUPLICATE COURSE MODAL (기존 과정 복사 기능 - 중요 요구사항) */}
      {isDuplicateModalOpen && courseToDuplicate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Copy className="w-5 h-5 text-white" />
                  기존 교육과정 복사 (새 기수 생성)
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  원본: {courseToDuplicate.name} ({courseToDuplicate.cohort})
                </p>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="text-amber-200 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDuplicate} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                💡 <strong>시간표 구조 복사 안내:</strong> 이전 기수의 시간표 교시, 과목명, 교육시간, 장소가
                새로운 교육 시작일에 맞추어 날짜가 자동 변환되어 복사됩니다. 새 기수에서는 날짜, 강사명, 교육생만 수정하면 됩니다.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  새 과정명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    새 기수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교육장소
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    새 교육 시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    새 교육 종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={duplicateOptions.copyTimetable}
                    onChange={(e) =>
                      setDuplicateOptions({ ...duplicateOptions, copyTimetable: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>이전 기수 시간표 구조 함께 복사 (추천)</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  수업 과목, 교시, 시간, 강의실이 새 시작일에 맞춰 날짜가 변환되어 등록됩니다.
                </p>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-1 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={duplicateOptions.copyTrainees}
                    onChange={(e) =>
                      setDuplicateOptions({ ...duplicateOptions, copyTrainees: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>이전 기수 교육생 명단도 복사 (보통 새 기수는 엑셀로 신규 등록하므로 체크 해제)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  새 기수로 복사 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Curriculum Extractor Modal for Pure Delivery Courses */}
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
