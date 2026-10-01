import React from 'react';
import { ActiveTab } from '../types';
import { Layers, Users, CalendarDays, Eye, FileDown } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  traineeCount: number;
  timetableCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  traineeCount,
  timetableCount,
}) => {
  const tabs = [
    {
      id: 'courses' as ActiveTab,
      label: '1. 과정관리',
      shortLabel: '과정관리',
      icon: Layers,
      desc: '과정 생성·수정·복사',
    },
    {
      id: 'trainees' as ActiveTab,
      label: '2. 교육생 명단',
      shortLabel: '교육생 명단',
      icon: Users,
      badge: traineeCount > 0 ? `${traineeCount}명` : undefined,
      desc: '엑셀 업로드·조편성',
    },
    {
      id: 'timetable' as ActiveTab,
      label: '3. 시간표 작성',
      shortLabel: '시간표 작성',
      icon: CalendarDays,
      badge: timetableCount > 0 ? `${timetableCount}개` : undefined,
      desc: '날짜별 교시·강사 입력',
    },
    {
      id: 'preview' as ActiveTab,
      label: '4. 출력 미리보기',
      shortLabel: '출력 미리보기',
      icon: Eye,
      desc: 'A4 공문서 배포용 뷰',
    },
    {
      id: 'export' as ActiveTab,
      label: '5. 저장 및 출력',
      shortLabel: '저장 및 출력',
      icon: FileDown,
      desc: '엑셀·PDF·데이터 보관',
    },
  ];

  return (
    <nav className="screen-only bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
