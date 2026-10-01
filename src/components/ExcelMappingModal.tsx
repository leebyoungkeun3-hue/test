import React, { useState } from 'react';
import { TARGET_FIELDS, ExcelInspectionResult, TargetFieldDef } from '../utils/excel';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  Check,
  HelpCircle,
} from 'lucide-react';

interface ExcelMappingModalProps {
  inspection: ExcelInspectionResult;
  existingCount: number;
  onConfirm: (
    confirmedMapping: Record<string, string | null>,
    importMode: 'replace' | 'append'
  ) => void;
  onCancel: () => void;
}

export const ExcelMappingModal: React.FC<ExcelMappingModalProps> = ({
  inspection,
  existingCount,
  onConfirm,
  onCancel,
}) => {
  // Current mapping state
  const [mapping, setMapping] = useState<Record<string, string | null>>({
    ...inspection.autoMapping,
  });

  // Import mode
  const [importMode, setImportMode] = useState<'replace' | 'append'>(
    existingCount > 0 ? 'replace' : 'append'
  );

  // Show raw preview table toggle
  const [showRawPreview, setShowRawPreview] = useState(false);

  // Handle dropdown change
  const handleSelectHeader = (fieldKey: string, headerValue: string) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: headerValue === '__NONE__' ? null : headerValue,
    }));
  };

  // Check required fields
  const missingRequired = TARGET_FIELDS.filter(
    (f) => f.required && !mapping[f.key]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      alert(`필수 항목인 [${missingRequired.map((m) => m.label).join(', ')}]에 매칭할 엑셀 열을 선택해 주세요.`);
      return;
    }
    onConfirm(mapping, importMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>엑셀 열(Column) 지능형 매핑 및 확인</span>
                <span className="text-xs bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full">
                  퍼지 자동 매칭 완료
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                업로드된 엑셀 열 제목(&apos;성명&apos;, &apos;근무지&apos;, &apos;성별&apos; 등)을 자동 인식했습니다. 필요시 직접 열을 재지정하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">
                인식된 엑셀 행 수: <strong className="text-blue-900 font-extrabold">{inspection.totalRows}명</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                시트명: <strong className="text-slate-800">{inspection.activeSheet}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowRawPreview(!showRawPreview)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showRawPreview ? '원본 엑셀 미리보기 닫기' : '원본 엑셀 데이터 5행 미리보기'}</span>
            </button>
          </div>

          {/* Raw Excel Data Preview Accordion */}
          {showRawPreview && inspection.previewRows.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-3.5 text-white text-xs border border-slate-800">
              <div className="text-slate-400 font-bold mb-2 flex items-center justify-between">
                <span>원본 엑셀 데이터 미리보기 (상위 {inspection.previewRows.length}행)</span>
                <span className="text-[11px] text-slate-500">열 제목: {inspection.headers.join(', ')}</span>
              </div>
              <div className="overflow-x-auto max-h-40">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800 text-slate-300">
                      {inspection.headers.map((h) => (
                        <th key={h} className="py-1 px-2.5 whitespace-nowrap font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                    {inspection.previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/60">
                        {inspection.headers.map((h) => (
                          <td key={h} className="py-1 px-2.5 whitespace-nowrap">
                            {row[h] !== undefined ? String(row[h]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Missing Required Warning */}
          {missingRequired.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                필수 항목인 <strong>{missingRequired.map((m) => m.label).join(', ')}</strong>에 매칭된 엑셀 열이 없습니다. 아래 목록에서 알맞은 열을 선택해 주세요.
              </span>
            </div>
          )}

          {/* Mapping Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="py-2.5 px-3 w-40">시스템 대상 항목</th>
                  <th className="py-2.5 px-3 min-w-[200px]">엑셀 파일 열(Column) 선택</th>
                  <th className="py-2.5 px-3 w-32 text-center">인식 신뢰도</th>
                  <th className="py-2.5 px-3 min-w-[140px]">1행 추출값 미리보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TARGET_FIELDS.map((field) => {
                  const selectedHeader = mapping[field.key] || '';
                  const detail = inspection.matchDetails[field.key];
                  const sampleValue =
                    selectedHeader && inspection.previewRows[0]
                      ? String(inspection.previewRows[0][selectedHeader] || '')
                      : '';

                  const isMatched = !!selectedHeader;
                  const score = detail?.score || 0;

                  return (
                    <tr
                      key={field.key}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !isMatched && field.required ? 'bg-red-50/50' : 'bg-white'
                      }`}
                    >
                      {/* Field label */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500 font-black">*</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          예시: {field.example}
                        </span>
                      </td>

                      {/* Dropdown mapping */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedHeader || '__NONE__'}
                            onChange={(e) => handleSelectHeader(field.key, e.target.value)}
                            className={`w-full text-xs py-1.5 px-2.5 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer font-medium ${
                              selectedHeader
                                ? 'border-blue-400 bg-blue-50/40 text-blue-950 focus:ring-blue-500'
                                : field.required
                                ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-400'
                                : 'border-slate-300 bg-slate-50 text-slate-500 focus:ring-slate-400'
                            }`}
                          >
                            <option value="__NONE__">[매핑 안 함 / 기본값 사용]</option>
                            {inspection.headers.map((h) => (
                              <option key={h} value={h}>
                                엑셀 열: &quot;{h}&quot;
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Match confidence badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isMatched ? (
                          score >= 95 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              정확 일치 ({score}%)
                            </span>
                          ) : score >= 75 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <Sparkles className="w-3 h-3" />
                              유사 일치 ({score}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              수동 매칭
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                            미지정
                          </span>
                        )}
                      </td>

                      {/* Sample preview value */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {sampleValue ? (
                          <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold truncate max-w-[180px]">
                            &quot;{sampleValue}&quot;
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">미리보기 없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import Mode Selection */}
          {existingCount > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-amber-900 block">
                기존 교육생 명단 처리 방식 (현재 {existingCount}명 등록됨):
              </span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>기존 명단 삭제 후 덮어쓰기 (새 기수 신규 등록 시 추천)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>기존 명단 뒤에 이어서 추가하기</span>
                </label>
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              * 필수 항목(*)만 지정되면 나머지 항목은 기본값으로 자동 보정되어 안전하게 등록됩니다.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>교육생 {inspection.totalRows}명 최종 불러오기</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
