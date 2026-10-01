import React, { useRef } from 'react';
import { Course, Trainee, TimetableItem } from '../types';
import { exportTraineesToExcel, exportTimetableToExcel } from '../utils/excel';
import { resetToSampleData, clearAllData } from '../utils/storage';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  FileText,
} from 'lucide-react';

interface ExportManagerProps {
  course: Course | null;
  courses: Course[];
  trainees: Trainee[];
  timetables: TimetableItem[];
  onRefreshData: () => void;
  onNavigateToPreview: () => void;
}

export const ExportManager: React.FC<ExportManagerProps> = ({
  course,
  courses,
  trainees,
  timetables,
  onRefreshData,
  onNavigateToPreview,
}) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Trainee Excel Download
  const handleDownloadTraineeExcel = () => {
    if (!course) return;
    const currentTrainees = trainees.filter((t) => t.courseId === course.id);
    if (currentTrainees.length === 0) {
      alert('현재 과정에 등록된 교육생이 없습니다.');
      return;
    }
    exportTraineesToExcel(currentTrainees, course.name, course.cohort);
  };

  // Timetable Excel Download
  const handleDownloadTimetableExcel = () => {
    if (!course) return;
    const currentTimetables = timetables.filter((t) => t.courseId === course.id);
    if (currentTimetables.length === 0) {
      alert('현재 과정에 등록된 시간표가 없습니다.');
      return;
    }
    exportTimetableToExcel(currentTimetables, course.name, course.cohort);
  };

  // Export JSON Backup
  const handleExportJsonBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      courses,
      trainees,
      timetables,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `우정사업본부_교육관리_전체백업_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed.courses)) {
          alert('올바른 백업 파일 형식이 아닙니다.');
          return;
        }

        if (confirm('백업 파일을 복원하시겠습니까? 현재 작성 중인 데이터가 백업 파일 내용으로 대체됩니다.')) {
          localStorage.setItem('koreapost_training_courses_v4', JSON.stringify(parsed.courses));
          localStorage.setItem('koreapost_training_trainees_v4', JSON.stringify(parsed.trainees || []));
          localStorage.setItem('koreapost_training_timetables_v4', JSON.stringify(parsed.timetables || []));
          if (parsed.courses[0]?.id) {
            localStorage.setItem('koreapost_active_course_id_v4', parsed.courses[0].id);
          }
          onRefreshData();
          alert('백업 데이터가 성공적으로 복원되었습니다.');
        }
      } catch (err) {
        alert('백업 파일 파싱 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to Sample Data
  const handleResetSample = () => {
    if (confirm('초기 샘플 데이터(9급 신규 집배직 제15기)로 복원하시겠습니까? 현재 작성된 데이터가 샘플로 초기화됩니다.')) {
      resetToSampleData();
      onRefreshData();
      alert('초기 샘플 데이터로 복원되었습니다.');
    }
  };

  // Clear All Data
  const handleClearAll = () => {
    if (confirm('경고: 모든 교육과정, 교육생 명단, 시간표를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      clearAllData();
      onRefreshData();
      alert('모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
            데이터 저장 및 출력
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            출력물 인쇄 &amp; 엑셀 다운로드 &amp; 데이터 백업
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          작성한 교육생 명단과 시간표를 엑셀 파일로 추출하거나 공문서 양식으로 인쇄할 수 있으며, 브라우저에 저장된 데이터를 안전하게 파일로 백업할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: 엑셀 파일 내보내기 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">엑셀(Excel) 파일 내보내기</h3>
              <p className="text-xs text-slate-500">수정 및 편집이 완료된 데이터를 .xlsx 파일로 저장합니다.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleDownloadTraineeExcel}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group"
            >
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">
                  교육생 명단 엑셀 다운로드
                </div>
                <div className="text-xs text-slate-500">
                  번호, 소속, 직급, 성별, 이름, 조, 숙소, 비고 열이 포함된 서식
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={handleDownloadTimetableExcel}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group"
            >
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-900">
                  교육 시간표 엑셀 다운로드
                </div>
                <div className="text-xs text-slate-500">
                  일자, 요일, 교시, 시작/종료시간, 교육시간, 과목명, 강사명, 장소 서식
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
            </button>
          </div>
        </div>

        {/* CARD 2: 인쇄 및 PDF 저장 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">A4 종이 인쇄 및 PDF 저장</h3>
              <p className="text-xs text-slate-500">교육생 배포용 공문서 양식으로 깔끔하게 출력합니다.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onNavigateToPreview}
              className="w-full flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group"
            >
              <div className="text-left">
                <div className="font-bold text-sm text-slate-800 group-hover:text-blue-900">
                  출력 미리보기 및 바로 인쇄
                </div>
                <div className="text-xs text-slate-500">
                  HWP 공문서 서식, 결재란, 교육생 명단/시간표 선택 인쇄
                </div>
              </div>
              <Printer className="w-4 h-4 text-blue-600 shrink-0" />
            </button>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                A4 최적화 기준 안내
              </span>
              <p className="text-[11px] text-slate-500">
                인쇄 시 웹앱의 메뉴 및 버튼은 자동으로 제외되며, 표의 제목행이 매 페이지마다 반복 출력됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3: 전체 데이터 백업 및 복원 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">전체 데이터 백업 &amp; 복원</h3>
              <p className="text-xs text-slate-500">다른 PC로 옮기거나 안전한 보관을 위해 JSON 파일로 저장합니다.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleExportJsonBackup}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="text-left">
                <div className="font-bold text-xs text-slate-800">전체 데이터 백업 파일 다운로드 (.json)</div>
                <div className="text-[11px] text-slate-500">모든 과정, 명단, 시간표를 단일 파일로 저장</div>
              </div>
              <Download className="w-4 h-4 text-amber-700" />
            </button>

            <input
              type="file"
              ref={jsonInputRef}
              onChange={handleImportJsonBackup}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="text-left">
                <div className="font-bold text-xs text-slate-800">백업 파일 불러오기 및 복원 (.json)</div>
                <div className="text-[11px] text-slate-500">기존에 백업해 둔 JSON 파일을 업로드하여 복원</div>
              </div>
              <Upload className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>

        {/* CARD 4: 데이터 초기화 및 보안 안내 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">개인정보 보호 및 초기화</h3>
              <p className="text-xs text-slate-500">외부 서버 전송 없는 100% 로컬 프라이버시 환경</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <strong>🔒 교육생 개인정보 안심 보장:</strong> 교육생 성명, 근무지 등 개인정보는 외부 AI 서버나 외부 데이터베이스로 전송되지 않으며, 오직 담당자 본인의 브라우저 로컬 저장소에만 안전하게 보관됩니다.
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleResetSample}
                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>샘플 데이터 복원</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>모든 데이터 삭제</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
