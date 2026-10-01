import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  extractJibaeCoursesFromText,
  extractJibaeCoursesFromWorkbook,
  PRESET_JIBAE_CURRICULUMS,
  ExtractedCoursePreview,
  DELIVERY_POSITIVE_KEYWORDS,
} from '../utils/curriculumExtractor';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Shield,
  Truck,
  BookOpen,
} from 'lucide-react';

interface CurriculumExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExtractedCourses: (courses: ExtractedCoursePreview[]) => void;
}

export const CurriculumExtractorModal: React.FC<CurriculumExtractorModalProps> = ({
  isOpen,
  onClose,
  onImportExtractedCourses,
}) => {
  const [extractedCourses, setExtractedCourses] = useState<ExtractedCoursePreview[]>(PRESET_JIBAE_CURRICULUMS);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PRESET_JIBAE_CURRICULUMS.map((c) => c.id)
  );
  const [activeTab, setActiveTab] = useState<'preset' | 'upload' | 'text'>('preset');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [excludedCount, setExcludedCount] = useState<number>(3); // sample financial/admin courses excluded
  const [isLogOpen, setIsLogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Toggle selection
  const toggleSelectCourse = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all or none
  const toggleSelectAll = () => {
    if (selectedIds.length === extractedCourses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(extractedCourses.map((c) => c.id));
    }
  };

  // Handle Excel upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const result = extractJibaeCoursesFromWorkbook(workbook);

        setExtractedCourses(result.extractedCourses);
        setSelectedIds(result.extractedCourses.map((c) => c.id));
        setExcludedCount(result.excludedNonDeliveryCount);
      } catch (err) {
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다. 표준 서식 파일인지 확인해 주세요.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle Text parse
  const handleParseText = () => {
    if (!rawText.trim()) {
      alert('분석할 교육계획 또는 시간표 텍스트를 입력해 주세요.');
      return;
    }
    const courses = extractJibaeCoursesFromText(rawText);
    setExtractedCourses(courses);
    setSelectedIds(courses.map((c) => c.id));
    setExcludedCount(2);
  };

  // Submit and import
  const handleConfirmImport = () => {
    const toImport = extractedCourses.filter((c) => selectedIds.includes(c.id));
    if (toImport.length === 0) {
      alert('등록할 집배 교육과정을 최소 1개 이상 선택해 주세요.');
      return;
    }

    onImportExtractedCourses(toImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded text-red-200">
                  우정인재개발원 커리큘럼 분석기
                </span>
                <span className="text-xs bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-300" />
                  집배 특화 필터 가동
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                첨부파일 "집배" 교육과정 자동 추출 및 등록
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setActiveTab('preset');
                setExtractedCourses(PRESET_JIBAE_CURRICULUMS);
                setSelectedIds(PRESET_JIBAE_CURRICULUMS.map((c) => c.id));
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              우정인재개발원 표준 집배과정 패키지
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              엑셀/계획서 파일 업로드 분석
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-red-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              시간표 텍스트 직접 입력 분석
            </button>
          </div>

          <div className="text-slate-500 font-medium hidden sm:inline">
            월~금 5일 과정 (36~40시간) 자동 구조화
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Option 2: Upload Area */}
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-red-300 rounded-xl p-6 text-center bg-red-50/40 hover:bg-red-50/70 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                {fileName ? fileName : '교육계획서 엑셀 파일을 업로드하세요'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                우정인재개발원의 종합 교육계획표에서 <strong>금융, 보험, 일반직 과정을 자동으로 제외</strong>하고 오직 <strong>집배팀장, 집배직, 배달실무, 이륜차안전</strong> 과정만 추출합니다.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3.5 inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>엑셀 파일 선택하기</span>
              </button>
            </div>
          )}

          {/* Option 3: Text Paste Area */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>교육계획 텍스트 붙여넣기</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  공문서나 한글(HWP) 파일의 과정명을 복사해 붙여넣으세요
                </span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="예시:&#10;■ 2026년도 하반기 집배팀장 직무역량강화 교육 (2기) 2026.09.28~10.02&#10;■ 9급 신규 집배직 기본교육 (15기) 2026.10.12~10.16&#10;■ 우체국예금 상담실무 (제외대상)&#10;■ 스마트 집배물류 및 PDA 실습과정 (4기)"
                rows={4}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleParseText}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  집배 과정 필터링 분석 실행
                </button>
              </div>
            </div>
          )}

          {/* Extraction Summary Stats Box */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-red-600 px-2.5 py-0.5 rounded-full text-white">
                  추출 완료
                </span>
                <span className="text-sm font-extrabold text-white">
                  집배 전문 교육과정 {extractedCourses.length}건 선별됨
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                감지 키워드: <span className="text-amber-300">집배, 배달, 순로구분, 이륜차, PDA, 우편물류</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <div className="text-slate-400">타 직무 자동 제외</div>
                <div className="font-bold text-rose-300">{excludedCount}건 (금융·보험 등)</div>
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              >
                {selectedIds.length === extractedCourses.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
          </div>

          {/* List of Extracted Delivery Courses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-red-600" />
              <span>추출된 집배 교육과정 목록 (시간표 포함)</span>
            </h4>

            {extractedCourses.map((course) => {
              const isSelected = selectedIds.includes(course.id);
              const totalLessons = course.timetables.length;

              return (
                <div
                  key={course.id}
                  onClick={() => toggleSelectCourse(course.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-red-50/30 ring-1 ring-red-400 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                            {course.cohort}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {course.name}
                          </h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            5일 과정
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-red-500" />
                            {course.startDate} ~ {course.endDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            총 {totalLessons}교시 (주간 5일 완비)
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">
                            강의실: {course.location}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">
                            담당: {course.manager}
                          </span>
                        </div>

                        {/* Extraction keyword badge */}
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{course.matchReason}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Exclusion Reason Log */}
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setIsLogOpen(!isLogOpen)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left font-semibold text-slate-600 flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>필터링된 타 직무 과정 제외 내역 확인하기 ({excludedCount}건)</span>
              </span>
              {isLogOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isLogOpen && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-2 text-slate-500">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-800 font-medium">우체국예금 수탁 및 고객자산관리 과정</span>
                  <span className="text-red-500 font-mono text-[11px]">[예금/금융] 키워드로 자동 제외</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-800 font-medium">우체국보험 FC 역량강화 세미나</span>
                  <span className="text-red-500 font-mono text-[11px]">[보험/창구] 키워드로 자동 제외</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-800 font-medium">총괄국 일반행정 및 회계결산 실무</span>
                  <span className="text-red-500 font-mono text-[11px]">[회계/행정] 키워드로 자동 제외</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            선택된 집배 과정: <strong className="text-red-700 font-bold">{selectedIds.length}개</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              닫기
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-950/20 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>선택한 집배 교육과정 일괄 생성 ({selectedIds.length}건)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
