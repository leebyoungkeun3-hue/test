import React, { useState, useRef, useMemo } from 'react';
import { Course, Trainee } from '../types';
import {
  inspectExcelFile,
  buildTraineesFromMapping,
  exportTraineesToExcel,
  ExcelInspectionResult,
} from '../utils/excel';
import { ExcelMappingModal } from './ExcelMappingModal';
import {
  Upload,
  Download,
  Plus,
  Trash2,
  ArrowUpDown,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Users,
  Home,
  CheckSquare,
  Square,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface TraineeManagerProps {
  course: Course | null;
  trainees: Trainee[];
  onUpdateTrainees: (trainees: Trainee[]) => void;
}

type SortField = 'order' | 'name' | 'affiliation' | 'rank' | 'gender' | 'group' | 'dorm';
type SortDirection = 'asc' | 'desc';

export const TraineeManager: React.FC<TraineeManagerProps> = ({
  course,
  trainees,
  onUpdateTrainees,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Interactive Excel Mapping Modal State
  const [pendingInspection, setPendingInspection] = useState<ExcelInspectionResult | null>(null);

  // Success / Feedback banner
  const [uploadFeedback, setUploadFeedback] = useState<{
    show: boolean;
    total: number;
    detected: Record<string, string>;
    missing: string[];
  } | null>(null);

  if (!course) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200">
        교육과정이 선택되지 않았습니다. 과정관리 메뉴에서 과정을 먼저 선택해 주세요.
      </div>
    );
  }

  // Handle Excel Upload -> triggers Inspection & Column Mapping Modal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const inspection = inspectExcelFile(buffer);

        if (inspection.totalRows === 0) {
          alert('엑셀 파일에서 유효한 데이터 행을 찾을 수 없습니다.');
          return;
        }

        // Open the mapping configuration modal
        setPendingInspection(inspection);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert('엑셀 파일 읽기 중 오류가 발생했습니다. 올바른 .xlsx, .xls 파일인지 확인해 주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm mapping from modal
  const handleConfirmMapping = (
    confirmedMapping: Record<string, string | null>,
    importMode: 'replace' | 'append'
  ) => {
    if (!pendingInspection) return;

    const newTrainees = buildTraineesFromMapping(
      pendingInspection.allRows,
      confirmedMapping,
      course.id
    );

    let finalTrainees: Trainee[] = [];
    if (importMode === 'replace') {
      finalTrainees = newTrainees;
    } else {
      const startOrder = trainees.length;
      const appended = newTrainees.map((t, i) => ({
        ...t,
        order: startOrder + i + 1,
      }));
      finalTrainees = [...trainees, ...appended];
    }

    onUpdateTrainees(finalTrainees);

    const detectedMap: Record<string, string> = {};
    Object.entries(confirmedMapping).forEach(([k, v]) => {
      if (v) detectedMap[k] = v;
    });

    setUploadFeedback({
      show: true,
      total: newTrainees.length,
      detected: detectedMap,
      missing: [],
    });

    setPendingInspection(null);
  };

  // Add new single trainee
  const handleAddTrainee = () => {
    const newOrder = trainees.length + 1;
    const newTrainee: Trainee = {
      id: 'tr_' + Math.random().toString(36).substring(2, 9),
      courseId: course.id,
      order: newOrder,
      affiliation: '서울강남우체국',
      rank: '행정서기보(시보)',
      name: '',
      gender: '남',
      group: '1조',
      dorm: '희망관',
      notes: '',
    };
    onUpdateTrainees([...trainees, newTrainee]);
  };

  // Inline edit handler
  const handleCellChange = (id: string, field: keyof Trainee, value: any) => {
    const updated = trainees.map((t) => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    });
    onUpdateTrainees(updated);
  };

  // Delete single trainee
  const handleDeleteTrainee = (id: string) => {
    const updated = trainees.filter((t) => t.id !== id);
    onUpdateTrainees(updated);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
  };

  // Batch delete selected
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`선택한 ${selectedIds.size}명의 교육생을 삭제하시겠습니까?`)) {
      const updated = trainees.filter((t) => !selectedIds.has(t.id));
      onUpdateTrainees(updated);
      setSelectedIds(new Set());
    }
  };

  // Move row up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newArr = [...trainees];
    const temp = newArr[index];
    newArr[index] = newArr[index - 1];
    newArr[index - 1] = temp;
    onUpdateTrainees(newArr);
  };

  // Move row down
  const handleMoveDown = (index: number) => {
    if (index === trainees.length - 1) return;
    const newArr = [...trainees];
    const temp = newArr[index];
    newArr[index] = newArr[index + 1];
    newArr[index + 1] = temp;
    onUpdateTrainees(newArr);
  };

  // Auto-renumber from 1 to N
  const handleAutoRenumber = () => {
    const renumbered = trainees.map((t, idx) => ({
      ...t,
      order: idx + 1,
    }));
    onUpdateTrainees(renumbered);
  };

  // Sort handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorting calculation
  const sortedTrainees = useMemo(() => {
    const list = [...trainees];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'order') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '');
        valB = String(valB || '');
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [trainees, sortField, sortDirection]);

  // Filtered by search query
  const filteredTrainees = useMemo(() => {
    if (!searchQuery.trim()) return sortedTrainees;
    const q = searchQuery.toLowerCase().trim();
    return sortedTrainees.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.affiliation.toLowerCase().includes(q) ||
        (t.gender && t.gender.toLowerCase().includes(q)) ||
        t.group.toLowerCase().includes(q) ||
        t.dorm.toLowerCase().includes(q) ||
        t.rank.toLowerCase().includes(q) ||
        String(t.order).includes(q)
    );
  }, [sortedTrainees, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = trainees.length;
    const groupCounts: Record<string, number> = {};
    let dormCount = 0;
    let nonDormCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    trainees.forEach((t) => {
      // Group count
      const grp = t.group.trim() || '미지정';
      groupCounts[grp] = (groupCounts[grp] || 0) + 1;

      // Dorm count
      const dormStr = t.dorm.trim().toLowerCase();
      if (!dormStr || dormStr.includes('비생활') || dormStr.includes('통근') || dormStr.includes('출퇴근')) {
        nonDormCount++;
      } else {
        dormCount++;
      }

      // Gender count
      if (t.gender === '여') {
        femaleCount++;
      } else {
        maleCount++;
      }
    });

    return { total, groupCounts, dormCount, nonDormCount, maleCount, femaleCount };
  }, [trainees]);

  // Select all checkbox toggle
  const handleSelectAllToggle = () => {
    if (selectedIds.size === filteredTrainees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTrainees.map((t) => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Download Excel
  const handleDownloadExcel = () => {
    exportTraineesToExcel(trainees, course.name, course.cohort);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Excel Upload Zone */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                {course.cohort}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {course.name} 교육생 명단
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              엑셀 파일(.xlsx, .xls)을 업로드하면 <strong>&apos;성명&apos;, &apos;근무지&apos;, &apos;성별&apos; 등 다양한 열 제목을 퍼지 매칭으로 자동 인식</strong>하며, 원하는 열로 직접 지정하여 불러올 수 있습니다.
            </p>
          </div>

          {/* Excel Upload and Download Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>교육생 엑셀파일 업로드</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              disabled={trainees.length === 0}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>명단 엑셀 다운로드</span>
            </button>
          </div>
        </div>

        {/* Upload Feedback banner if recently uploaded */}
        {uploadFeedback?.show && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-bold">
                  총 {uploadFeedback.total}명의 교육생 명단이 성공적으로 등록되었습니다.
                </p>
                <div className="flex flex-wrap gap-2 text-slate-600">
                  <span className="font-semibold text-emerald-800">적용된 열 매핑:</span>
                  {Object.entries(uploadFeedback.detected).map(([key, orig]) => (
                    <span key={key} className="bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800 font-mono">
                      &apos;{orig}&apos; &rarr; {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setUploadFeedback(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* STATS BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 rounded-xl p-4 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-600/90 text-white shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">전체 교육생</div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {stats.total}
                <span className="text-xs font-normal text-slate-300 ml-1">명</span>
                <span className="text-xs text-blue-300 font-medium ml-2">
                  (남 {stats.maleCount}명 / 여 {stats.femaleCount}명)
                </span>
              </div>
            </div>
          </div>

          {/* Group breakdown */}
          <div className="flex-1 min-w-[200px] border-l border-slate-700 pl-4 hidden md:block">
            <div className="text-xs text-slate-300 font-medium mb-1">조별 인원 현황</div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.keys(stats.groupCounts).length > 0 ? (
                Object.entries(stats.groupCounts).map(([grp, count]) => (
                  <span
                    key={grp}
                    className="inline-flex items-center gap-1 bg-slate-800/90 text-xs px-2.5 py-1 rounded border border-slate-700 text-slate-200"
                  >
                    <span className="font-semibold text-blue-300">{grp}:</span>
                    <strong className="text-white font-bold">{count}명</strong>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">조 편성 정보 없음</span>
              )}
            </div>
          </div>

          {/* Dorm stats */}
          <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
            <div className="p-2 rounded-lg bg-blue-800/80 text-blue-200">
              <Home className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="text-slate-300">숙소 사용 인원</div>
              <div className="text-base font-bold text-white">
                {stats.dormCount}명
                <span className="text-xs text-slate-400 font-normal ml-2">
                  (비생활/통근 {stats.nonDormCount}명)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR: Search, Sorting buttons, Add & Renumber */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Sort Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            정렬:
          </span>
          {(
            [
              { key: 'order', label: '번호순' },
              { key: 'name', label: '이름순' },
              { key: 'affiliation', label: '소속순' },
              { key: 'rank', label: '직급순' },
              { key: 'gender', label: '성별순' },
              { key: 'group', label: '조별' },
              { key: 'dorm', label: '숙소별' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => handleSort(item.key)}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer border ${
                sortField === item.key
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {item.label}
              {sortField === item.key && (
                <span className="ml-1 font-mono">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </button>
          ))}

          <button
            onClick={handleAutoRenumber}
            className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
            title="현재 정렬된 순서대로 1번부터 번호를 자동 재부여합니다"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>번호 자동 재부여</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="이름, 소속, 직급, 성별, 조, 숙소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{selectedIds.size}명 삭제</span>
            </button>
          )}

          <button
            onClick={handleAddTrainee}
            className="inline-flex items-center gap-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>교육생 1명 추가</span>
          </button>
        </div>
      </div>

      {/* EDITABLE TABLE */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-300 select-none">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    onClick={handleSelectAllToggle}
                    className="cursor-pointer text-slate-600 hover:text-slate-900"
                    title="전체 선택 / 해제"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredTrainees.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-2 w-14 text-center">번호</th>
                <th className="py-2.5 px-3 w-36">소속 (근무지/우체국)</th>
                <th className="py-2.5 px-3 w-32">직급</th>
                <th className="py-2.5 px-2 w-16 text-center">성별</th>
                <th className="py-2.5 px-3 w-28">이름 (성명)</th>
                <th className="py-2.5 px-3 w-20 text-center">조</th>
                <th className="py-2.5 px-3 w-32">숙소 (생활관)</th>
                <th className="py-2.5 px-3">비고</th>
                <th className="py-2.5 px-2 w-20 text-center">순서/관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrainees.length > 0 ? (
                filteredTrainees.map((trainee, index) => {
                  const isChecked = selectedIds.has(trainee.id);

                  return (
                    <tr
                      key={trainee.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isChecked ? 'bg-blue-50/80' : index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(trainee.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-2 px-2 text-center font-bold text-slate-700">
                        <input
                          type="number"
                          value={trainee.order}
                          onChange={(e) =>
                            handleCellChange(trainee.id, 'order', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-12 text-center py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded font-semibold bg-transparent focus:bg-white focus:outline-none"
                        />
                      </td>

                      {/* Affiliation */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={trainee.affiliation}
                          onChange={(e) => handleCellChange(trainee.id, 'affiliation', e.target.value)}
                          placeholder="소속 우체국"
                          className="w-full py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none font-medium"
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={trainee.rank}
                          onChange={(e) => handleCellChange(trainee.id, 'rank', e.target.value)}
                          placeholder="직급"
                          className="w-full py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none text-slate-700"
                        />
                      </td>

                      {/* Gender */}
                      <td className="py-2 px-1 text-center">
                        <select
                          value={trainee.gender || '남'}
                          onChange={(e) => handleCellChange(trainee.id, 'gender', e.target.value)}
                          className="text-xs py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none font-bold text-slate-800 cursor-pointer"
                        >
                          <option value="남">남</option>
                          <option value="여">여</option>
                        </select>
                      </td>

                      {/* Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={trainee.name}
                          onChange={(e) => handleCellChange(trainee.id, 'name', e.target.value)}
                          placeholder="이름"
                          className="w-full py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none font-bold text-slate-900"
                        />
                      </td>

                      {/* Group */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={trainee.group}
                          onChange={(e) => handleCellChange(trainee.id, 'group', e.target.value)}
                          placeholder="1조"
                          className="w-16 text-center py-1 px-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none font-semibold text-blue-900"
                        />
                      </td>

                      {/* Dorm */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={trainee.dorm}
                          onChange={(e) => handleCellChange(trainee.id, 'dorm', e.target.value)}
                          placeholder="생활관 / 비생활"
                          className="w-full py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none text-slate-700"
                        />
                      </td>

                      {/* Notes */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={trainee.notes || ''}
                          onChange={(e) => handleCellChange(trainee.id, 'notes', e.target.value)}
                          placeholder="비고사항 (조장, 특이사항 등)"
                          className="w-full py-1 px-1.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white focus:outline-none text-slate-500"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="위로 이동"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === filteredTrainees.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrainee(trainee.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer ml-1"
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
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">등록된 교육생이 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      상단의 [교육생 엑셀파일 업로드]를 누르거나 [교육생 1명 추가] 버튼을 클릭해 명단을 작성하세요.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>
            표시 중: <strong>{filteredTrainees.length}명</strong> / 전체: <strong>{trainees.length}명</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            * 각 셀을 클릭하여 내용을 직접 수정할 수 있으며, 수정사항은 즉시 자동 저장됩니다.
          </span>
        </div>
      </div>

      {/* INTERACTIVE COLUMN MAPPING MODAL */}
      {pendingInspection && (
        <ExcelMappingModal
          inspection={pendingInspection}
          existingCount={trainees.length}
          onConfirm={handleConfirmMapping}
          onCancel={() => setPendingInspection(null)}
        />
      )}
    </div>
  );
};
