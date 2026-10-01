import * as XLSX from 'xlsx';
import { Trainee, TimetableItem } from '../types';

export interface TargetFieldDef {
  key: keyof Trainee | 'gender';
  label: string;
  required: boolean;
  aliases: string[];
  example: string;
}

export const TARGET_FIELDS: TargetFieldDef[] = [
  {
    key: 'name',
    label: '이름 (성명)',
    required: true,
    aliases: [
      '이름', '성명', '교육생', '교육생명', '성 명', '성 함', '이 름',
      '성명(이름)', '성명(한글)', '성명(원문)', '직원명', '성함',
      '피교육자', '이름(성명)', '대상자', '수강생', '이름/성명', '교육생성명',
      '성 명(이름)', '이름(필수)', '성명(필수)', '교원명', '이름(한글)',
      'name', 'trainee', 'student',
    ],
    example: '홍길동',
  },
  {
    key: 'affiliation',
    label: '소속 (근무지/우체국)',
    required: true,
    aliases: [
      '소속', '근무지', '총괄국', '소속국', '발령지', '소속관서', '총괄우체국',
      '우체국', '배치국', '소속부서', '근무국', '근무처', '소속청', '발령국',
      '근무관서', '현근무지', '소속(총괄국)', '근무지(우체국)', '소속기관',
      '부서', '배치관서', '관서명', '소속우체국', '근무우체국', '소속(근무지)',
      'affiliation', 'office', 'department',
    ],
    example: '서울강남우체국',
  },
  {
    key: 'rank',
    label: '직급 (직명)',
    required: false,
    aliases: [
      '직급', '직명', '계급', '직렬', '구분', '직위', '현직급', '임용직급',
      '신분', '직종', '직급(직명)', '호봉', '직급구분', '직급명', '임용직',
      'rank', 'position', 'grade',
    ],
    example: '행정서기보(시보)',
  },
  {
    key: 'gender',
    label: '성별 (남/여)',
    required: false,
    aliases: [
      '성별', '성 별', '남/여', '남여', '구분(성별)', '성', '성별구분',
      '남녀', '남녀구분', '성별(남/여)', '성별(남,여)', 'gender', 'sex',
    ],
    example: '남 / 여',
  },
  {
    key: 'group',
    label: '조 (분임/팀)',
    required: false,
    aliases: [
      '조', '분임', '반', '팀', '조편성', '분임조', '분임명', '조(분임)',
      '편성조', '분임(조)', '그룹', '배정조', '조구분', '분임번호',
      'group', 'team', 'class',
    ],
    example: '1조',
  },
  {
    key: 'dorm',
    label: '숙소 (생활관/호실)',
    required: false,
    aliases: [
      '숙소', '생활관', '호실', '기숙사', '방번호', '숙소배정', '호실배정',
      '생활관호실', '숙소(생활관)', '생활관(호실)', '입소여부', '숙소명',
      '기숙사호실', '생활관배정', '숙소호실', '합숙여부', '생활실',
      'dorm', 'room',
    ],
    example: '희망관 201호 / 비생활',
  },
  {
    key: 'notes',
    label: '비고 (특이사항)',
    required: false,
    aliases: [
      '비고', '특이사항', '메모', '비고사항', '기타', '참고사항', '특기사항',
      '주의사항', '전달사항', '메모사항', 'remarks', 'notes', 'comment',
    ],
    example: '조장 / 통근',
  },
  {
    key: 'order',
    label: '번호 (연번/순번)',
    required: false,
    aliases: [
      '번호', '연번', '순번', 'no', 'num', 'number', '순서', 'id', '순', '인덱스',
    ],
    example: '1, 2, 3...',
  },
];

/**
 * Normalizes string for fuzzy string matching
 */
export function normalizeStr(str: unknown): string {
  if (typeof str !== 'string') return String(str || '').trim();
  return str
    .replace(/[\s\-_()[\]{}*#.,/]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) matrix[i] = [i];
  for (let j = 0; j <= aLen; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

/**
 * Calculates fuzzy similarity ratio (0.0 to 1.0)
 */
export function stringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeStr(s1);
  const norm2 = normalizeStr(s2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Exact substring containment
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const distance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  return Math.max(0, 1 - distance / maxLen);
}

export interface MatchScore {
  fieldKey: string;
  header: string;
  score: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none';
  matchedAlias?: string;
}

/**
 * Computes best matching score between an Excel column header and target field aliases
 */
export function findBestFieldMatch(header: string): MatchScore[] {
  const normHeader = normalizeStr(header);
  const results: MatchScore[] = [];

  for (const field of TARGET_FIELDS) {
    let bestScore = 0;
    let bestType: MatchScore['matchType'] = 'none';
    let matchedAlias: string | undefined = undefined;

    for (const alias of field.aliases) {
      const normAlias = normalizeStr(alias);

      if (normHeader === normAlias) {
        bestScore = 1.0;
        bestType = 'exact';
        matchedAlias = alias;
        break;
      }

      // Check substring match
      if (normHeader.includes(normAlias) || normAlias.includes(normHeader)) {
        const subScore = Math.max(0.88, normAlias.length / Math.max(normHeader.length, normAlias.length));
        if (subScore > bestScore) {
          bestScore = subScore;
          bestType = 'alias';
          matchedAlias = alias;
        }
      } else {
        // Fuzzy Levenshtein match
        const sim = stringSimilarity(normHeader, normAlias);
        if (sim >= 0.65 && sim > bestScore) {
          bestScore = sim;
          bestType = 'fuzzy';
          matchedAlias = alias;
        }
      }
    }

    results.push({
      fieldKey: field.key,
      header,
      score: bestScore,
      matchType: bestType,
      matchedAlias,
    });
  }

  return results;
}

export interface ExcelInspectionResult {
  headers: string[];
  previewRows: Record<string, any>[];
  allRows: Record<string, any>[];
  totalRows: number;
  sheetNames: string[];
  activeSheet: string;
  autoMapping: Record<string, string | null>; // { fieldKey: headerName }
  matchDetails: Record<string, { score: number; matchType: string; matchedAlias?: string }>;
}

/**
 * Inspects uploaded Excel buffer, parses sheets, headers, and computes auto fuzzy mappings
 */
export function inspectExcelFile(fileBuffer: ArrayBuffer): ExcelInspectionResult {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[activeSheet];

  // Convert to JSON
  const allRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (allRows.length === 0) {
    return {
      headers: [],
      previewRows: [],
      allRows: [],
      totalRows: 0,
      sheetNames,
      activeSheet,
      autoMapping: {},
      matchDetails: {},
    };
  }

  const headers = Object.keys(allRows[0]);
  const previewRows = allRows.slice(0, 5);

  // Compute intelligent fuzzy mappings for all target fields
  const autoMapping: Record<string, string | null> = {};
  const matchDetails: Record<string, { score: number; matchType: string; matchedAlias?: string }> = {};

  const assignedHeaders = new Set<string>();

  TARGET_FIELDS.forEach((field) => {
    let bestHeader: string | null = null;
    let highestScore = 0;
    let bestDetail = { score: 0, matchType: 'none', matchedAlias: '' };

    for (const h of headers) {
      if (assignedHeaders.has(h)) continue;

      const scores = findBestFieldMatch(h);
      const fieldScore = scores.find((s) => s.fieldKey === field.key);

      if (fieldScore && fieldScore.score > highestScore && fieldScore.score >= 0.65) {
        highestScore = fieldScore.score;
        bestHeader = h;
        bestDetail = {
          score: Math.round(fieldScore.score * 100),
          matchType: fieldScore.matchType,
          matchedAlias: fieldScore.matchedAlias || '',
        };
      }
    }

    if (bestHeader) {
      autoMapping[field.key] = bestHeader;
      matchDetails[field.key] = bestDetail;
      assignedHeaders.add(bestHeader);
    } else {
      autoMapping[field.key] = null;
      matchDetails[field.key] = { score: 0, matchType: 'none' };
    }
  });

  return {
    headers,
    previewRows,
    allRows,
    totalRows: allRows.length,
    sheetNames,
    activeSheet,
    autoMapping,
    matchDetails,
  };
}

/**
 * Builds Trainee objects using confirmed mapping from rows
 */
export function buildTraineesFromMapping(
  rows: Record<string, any>[],
  mapping: Record<string, string | null>,
  courseId: string
): Trainee[] {
  return rows.map((row, index) => {
    const getVal = (key: string): string => {
      const colHeader = mapping[key];
      if (colHeader && row[colHeader] !== undefined) {
        return String(row[colHeader]).trim();
      }
      return '';
    };

    const parsedOrder = Number(getVal('order'));
    const order = !isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : index + 1;

    // Normalize gender: '남', '여', '남성', '여성', 'M', 'F'
    let rawGender = getVal('gender');
    let gender = '';
    if (rawGender) {
      const gNorm = rawGender.toLowerCase();
      if (gNorm.startsWith('남') || gNorm === 'm' || gNorm === 'male') gender = '남';
      else if (gNorm.startsWith('여') || gNorm === 'f' || gNorm === 'female') gender = '여';
      else gender = rawGender;
    }

    return {
      id: 'tr_' + Math.random().toString(36).substring(2, 9),
      courseId,
      order,
      affiliation: getVal('affiliation') || '소속 미정',
      rank: getVal('rank') || '행정서기보(시보)',
      name: getVal('name') || `교육생 ${index + 1}`,
      gender: gender || '남',
      group: getVal('group') || '1조',
      dorm: getVal('dorm') || '생활관',
      notes: getVal('notes') || '',
    };
  });
}

/**
 * Backward compatibility parser
 */
export function parseTraineeExcel(fileBuffer: ArrayBuffer, courseId: string) {
  const inspected = inspectExcelFile(fileBuffer);
  const trainees = buildTraineesFromMapping(inspected.allRows, inspected.autoMapping, courseId);
  const detectedColumns: Record<string, string> = {};
  Object.entries(inspected.autoMapping).forEach(([k, v]) => {
    if (v) detectedColumns[k] = v;
  });

  const missingColumns: string[] = [];
  if (!inspected.autoMapping['name']) missingColumns.push('이름(성명)');
  if (!inspected.autoMapping['affiliation']) missingColumns.push('소속(근무지)');

  return {
    trainees,
    detectedColumns,
    missingColumns,
    totalRows: inspected.totalRows,
  };
}

/**
 * Exports Trainee list to Excel (.xlsx) including '성별'
 */
export function exportTraineesToExcel(
  trainees: Trainee[],
  courseName: string,
  cohort: string
): void {
  const data = trainees.map((t, index) => ({
    '번호': t.order || index + 1,
    '소속': t.affiliation,
    '직급': t.rank,
    '이름': t.name,
    '성별': t.gender || '',
    '조': t.group,
    '숙소': t.dorm,
    '비고': t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // 번호
    { wch: 18 }, // 소속
    { wch: 16 }, // 직급
    { wch: 12 }, // 이름
    { wch: 8 },  // 성별
    { wch: 8 },  // 조
    { wch: 15 }, // 숙소
    { wch: 20 }, // 비고
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '교육생명단');

  const fileName = `${courseName}_${cohort}_교육생명단.xlsx`.replace(/[\/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports Timetable to Excel (.xlsx)
 */
export function exportTimetableToExcel(
  items: TimetableItem[],
  courseName: string,
  cohort: string
): void {
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const data = sorted.map((item) => ({
    '일자': item.date,
    '요일': item.dayOfWeek,
    '교시': item.period ? `${item.period}교시` : '',
    '시작시간': item.startTime,
    '종료시간': item.endTime,
    '교육시간(분)': item.duration,
    '과목명': item.subject,
    '강사명': item.instructor,
    '교육장소': item.location,
    '비고': item.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 24 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '교육시간표');

  const fileName = `${courseName}_${cohort}_교육시간표.xlsx`.replace(/[\/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(workbook, fileName);
}
