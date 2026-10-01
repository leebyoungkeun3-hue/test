export interface SubjectCategory {
  id: string;
  name: string;
  badgeLabel: string;
  iconName: 'delivery' | 'system' | 'safety' | 'cs_legal' | 'event';
  colorBg: string; // for web visual
  colorBorder: string;
  colorText: string;
  badgeBg: string;
  badgeText: string;
  printBg: string; // for color print mode
  printBorder: string;
}

export const SUBJECT_CATEGORIES: Record<string, SubjectCategory> = {
  delivery: {
    id: 'delivery',
    name: '집배실무·직무역량',
    badgeLabel: '집배실무',
    iconName: 'delivery',
    colorBg: 'bg-blue-50/90',
    colorBorder: 'border-blue-400',
    colorText: 'text-blue-950',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    printBg: '#eff6ff',
    printBorder: '#93c5fd',
  },
  system: {
    id: 'system',
    name: '우편물류·전산실습',
    badgeLabel: '물류전산',
    iconName: 'system',
    colorBg: 'bg-emerald-50/90',
    colorBorder: 'border-emerald-400',
    colorText: 'text-emerald-950',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    printBg: '#ecfdf5',
    printBorder: '#6ee7b7',
  },
  safety: {
    id: 'safety',
    name: '안전보건·사고예방',
    badgeLabel: '안전보건',
    iconName: 'safety',
    colorBg: 'bg-amber-50/90',
    colorBorder: 'border-amber-400',
    colorText: 'text-amber-950',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    printBg: '#fffbeb',
    printBorder: '#fcd34d',
  },
  cs_legal: {
    id: 'cs_legal',
    name: '민원·CS·소송사례',
    badgeLabel: '민원·CS',
    iconName: 'cs_legal',
    colorBg: 'bg-purple-50/90',
    colorBorder: 'border-purple-400',
    colorText: 'text-purple-950',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    printBg: '#faf5ff',
    printBorder: '#d8b4fe',
  },
  event: {
    id: 'event',
    name: '입교·소통·평가',
    badgeLabel: '학사·기본',
    iconName: 'event',
    colorBg: 'bg-slate-50',
    colorBorder: 'border-slate-300',
    colorText: 'text-slate-900',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    printBg: '#f8fafc',
    printBorder: '#cbd5e1',
  },
};

/**
 * Automatically classifies a subject into one of the 5 visual categories
 */
export function getSubjectCategory(subject: string): SubjectCategory {
  if (!subject) return SUBJECT_CATEGORIES.event;
  const s = subject.toLowerCase().trim();

  // Safety & Health
  if (
    s.includes('안전') ||
    s.includes('이륜차') ||
    s.includes('방어운전') ||
    s.includes('근골격계') ||
    s.includes('질환') ||
    s.includes('사고예방') ||
    s.includes('건강')
  ) {
    return SUBJECT_CATEGORIES.safety;
  }

  // System & Logistics
  if (
    s.includes('시스템') ||
    s.includes('물류') ||
    s.includes('전산') ||
    s.includes('pda') ||
    s.includes('postnet') ||
    s.includes('단말기') ||
    s.includes('우편물류') ||
    s.includes('pc실습')
  ) {
    return SUBJECT_CATEGORIES.system;
  }

  // Legal & CS
  if (
    s.includes('민원') ||
    s.includes('소송') ||
    s.includes('고객') ||
    s.includes('cs') ||
    s.includes('친절') ||
    s.includes('갈등') ||
    s.includes('청렴') ||
    s.includes('윤리')
  ) {
    return SUBJECT_CATEGORIES.cs_legal;
  }

  // Delivery Practice
  if (
    s.includes('집배') ||
    s.includes('배달') ||
    s.includes('겸배') ||
    s.includes('순로') ||
    s.includes('구분') ||
    s.includes('우편물') ||
    s.includes('등기') ||
    s.includes('특수') ||
    s.includes('매뉴얼') ||
    s.includes('배달점') ||
    s.includes('산출')
  ) {
    return SUBJECT_CATEGORIES.delivery;
  }

  // Event & Basic
  return SUBJECT_CATEGORIES.event;
}
