import React, { useState, useEffect, useMemo } from 'react';
import { Course, Trainee, TimetableItem, ActiveTab } from './types';
import {
  loadCourses,
  saveCourses,
  loadTrainees,
  saveTrainees,
  loadTimetables,
  saveTimetables,
  loadActiveCourseId,
  saveActiveCourseId,
  duplicateCourse,
} from './utils/storage';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { CourseManager } from './components/CourseManager';
import { TraineeManager } from './components/TraineeManager';
import { TimetableManager } from './components/TimetableManager';
import { PrintPreview } from './components/PrintPreview';
import { ExportManager } from './components/ExportManager';

import { ExtractedCoursePreview } from './utils/curriculumExtractor';

export default function App() {
  // Navigation tab state (default: 'courses' as requested)
  const [activeTab, setActiveTab] = useState<ActiveTab>('courses');

  // Core Data States
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Load from LocalStorage
  useEffect(() => {
    const loadedCourses = loadCourses();
    const loadedTrainees = loadTrainees();
    const loadedTimetables = loadTimetables();
    const activeId = loadActiveCourseId(loadedCourses);

    setCourses(loadedCourses);
    setTrainees(loadedTrainees);
    setTimetables(loadedTimetables);
    setActiveCourseId(activeId);
    setIsLoaded(true);
  }, []);

  // Sync Courses changes
  const handleUpdateCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    saveCourses(newCourses);
  };

  // Sync Trainees changes
  const handleUpdateTrainees = (newTrainees: Trainee[]) => {
    setTrainees(newTrainees);
    saveTrainees(newTrainees);
  };

  // Sync Timetables changes
  const handleUpdateTimetables = (newTimetables: TimetableItem[]) => {
    setTimetables(newTimetables);
    saveTimetables(newTimetables);
  };

  // Import extracted delivery courses batch
  const handleImportExtractedCourses = (extracted: ExtractedCoursePreview[]) => {
    const updatedCourses = [...courses];
    const updatedTimetables = [...timetables];

    extracted.forEach((ec) => {
      const existingIdx = updatedCourses.findIndex((c) => c.id === ec.id);
      const courseObj: Course = {
        id: ec.id,
        name: ec.name,
        cohort: ec.cohort,
        startDate: ec.startDate,
        endDate: ec.endDate,
        location: ec.location,
        manager: ec.manager,
        notes: ec.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        updatedCourses[existingIdx] = courseObj;
      } else {
        updatedCourses.push(courseObj);
      }

      // Add timetables
      ec.timetables.forEach((t, idx) => {
        const tId = `time_${ec.id}_${idx + 1}`;
        const tIdx = updatedTimetables.findIndex((existing) => existing.id === tId);
        const itemObj: TimetableItem = {
          ...t,
          id: tId,
          courseId: ec.id,
        };
        if (tIdx >= 0) {
          updatedTimetables[tIdx] = itemObj;
        } else {
          updatedTimetables.push(itemObj);
        }
      });
    });

    handleUpdateCourses(updatedCourses);
    handleUpdateTimetables(updatedTimetables);

    if (extracted.length > 0) {
      handleSelectCourse(extracted[0].id);
    }
  };

  // Change Active Course
  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    saveActiveCourseId(courseId);
  };

  // Create new course
  const handleCreateCourse = (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCourseId = 'course_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...courseData,
      id: newCourseId,
      createdAt: now,
      updatedAt: now,
    };
    const nextCourses = [newCourse, ...courses];
    handleUpdateCourses(nextCourses);
    handleSelectCourse(newCourseId);
  };

  // Update existing course
  const handleSaveEditCourse = (updatedCourse: Course) => {
    const nextCourses = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
    handleUpdateCourses(nextCourses);
  };

  // Delete course
  const handleDeleteCourse = (courseId: string) => {
    const nextCourses = courses.filter((c) => c.id !== courseId);
    handleUpdateCourses(nextCourses);

    // Also remove associated trainees and timetables
    const nextTrainees = trainees.filter((t) => t.courseId !== courseId);
    handleUpdateTrainees(nextTrainees);

    const nextTimetables = timetables.filter((t) => t.courseId !== courseId);
    handleUpdateTimetables(nextTimetables);

    if (activeCourseId === courseId) {
      const nextActive = nextCourses[0]?.id || '';
      handleSelectCourse(nextActive);
    }
  };

  // Duplicate course (Section 3 Requirement)
  const handleDuplicateCourse = (
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
  ) => {
    const { newCourse, newTimetables } = duplicateCourse(
      sourceCourse,
      formData,
      formData.copyTimetable ? timetables : []
    );

    const nextCourses = [newCourse, ...courses];
    handleUpdateCourses(nextCourses);

    if (formData.copyTimetable && newTimetables.length > 0) {
      handleUpdateTimetables([...timetables, ...newTimetables]);
    }

    if (formData.copyTrainees) {
      const sourceTrainees = trainees.filter((t) => t.courseId === sourceCourse.id);
      const copiedTrainees = sourceTrainees.map((t) => ({
        ...t,
        id: 'tr_' + Math.random().toString(36).substring(2, 9),
        courseId: newCourse.id,
      }));
      handleUpdateTrainees([...trainees, ...copiedTrainees]);
    }

    handleSelectCourse(newCourse.id);
    alert(`'${newCourse.name} (${newCourse.cohort})' 과정이 성공적으로 생성되었습니다.`);
  };

  // Refresh all data from storage (after backup restore or sample reset)
  const handleRefreshData = () => {
    const loadedCourses = loadCourses();
    const loadedTrainees = loadTrainees();
    const loadedTimetables = loadTimetables();
    const activeId = loadActiveCourseId(loadedCourses);

    setCourses(loadedCourses);
    setTrainees(loadedTrainees);
    setTimetables(loadedTimetables);
    setActiveCourseId(activeId);
  };

  // Current active course object
  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === activeCourseId) || courses[0] || null;
  }, [courses, activeCourseId]);

  // Counts for current course
  const currentCourseTrainees = useMemo(() => {
    return activeCourse ? trainees.filter((t) => t.courseId === activeCourse.id) : [];
  }, [trainees, activeCourse]);

  const currentCourseTimetables = useMemo(() => {
    return activeCourse ? timetables.filter((t) => t.courseId === activeCourse.id) : [];
  }, [timetables, activeCourse]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold">우정사업본부 교육관리 시스템 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        courses={courses}
        activeCourse={activeCourse}
        onSelectCourse={handleSelectCourse}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickPrint={() => setActiveTab('preview')}
      />

      {/* 5-Menu Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        traineeCount={currentCourseTrainees.length}
        timetableCount={currentCourseTimetables.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'courses' && (
          <CourseManager
            courses={courses}
            activeCourse={activeCourse}
            onSelectCourse={handleSelectCourse}
            onCreateCourse={handleCreateCourse}
            onUpdateCourse={handleSaveEditCourse}
            onDeleteCourse={handleDeleteCourse}
            onDuplicateCourse={handleDuplicateCourse}
            onNavigateTab={setActiveTab}
            trainees={trainees}
            timetables={timetables}
            onImportExtractedCourses={handleImportExtractedCourses}
          />
        )}

        {activeTab === 'trainees' && (
          <TraineeManager
            course={activeCourse}
            trainees={currentCourseTrainees}
            onUpdateTrainees={(newTrainees) => {
              // Replace trainees for this course only
              if (!activeCourse) return;
              const others = trainees.filter((t) => t.courseId !== activeCourse.id);
              handleUpdateTrainees([...others, ...newTrainees]);
            }}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableManager
            course={activeCourse}
            courses={courses}
            timetables={timetables}
            onUpdateTimetables={handleUpdateTimetables}
            onImportExtractedCourses={handleImportExtractedCourses}
          />
        )}

        {activeTab === 'preview' && (
          <PrintPreview
            course={activeCourse}
            trainees={currentCourseTrainees}
            timetables={currentCourseTimetables}
          />
        )}

        {activeTab === 'export' && (
          <ExportManager
            course={activeCourse}
            courses={courses}
            trainees={trainees}
            timetables={timetables}
            onRefreshData={handleRefreshData}
            onNavigateToPreview={() => setActiveTab('preview')}
          />
        )}
      </main>

      {/* Footer (Screen only) */}
      <footer className="screen-only bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">대한민국 우정사업본부</span>
            <span>우정인재개발원 집배원 교육관리 시스템</span>
          </div>
          <div className="text-slate-400">
            A4 규격 공문서 자동 생성 &bull; 엑셀 양방향 연동 &bull; 로컬 브라우저 보안 보장
          </div>
        </div>
      </footer>
    </div>
  );
}
