
import React, { useState, useRef, useEffect } from 'react';
import { StoreData } from '../types';

interface StoreSelectorProps {
  stores: StoreData[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ stores, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 가나다 순으로 정렬된 매장 목록
  const sortedStores = [...stores].sort((a, b) => 
    a.store.name.localeCompare(b.store.name, 'ko')
  );

  // 검색 필터링
  const filteredStores = sortedStores.filter(store =>
    store.store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 매장 정보
  const selectedStore = stores.find(s => s.store.id === selectedId);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (storeId: string) => {
    onSelect(storeId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      {/* 필터 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm hover:border-blue-300 transition-all"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-semibold text-slate-900 truncate">
            {selectedStore ? selectedStore.store.name : '매장을 선택하세요'}
          </span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="매장명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* 매장 목록 */}
          <div className="overflow-y-auto flex-1">
            {filteredStores.length > 0 ? (
              <div className="py-2">
                {filteredStores.map((item) => (
                  <button
                    key={item.store.id}
                    onClick={() => handleSelect(item.store.id)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                      selectedId === item.store.id
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {selectedId === item.store.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>{item.store.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                검색 결과가 없습니다
              </div>
            )}
          </div>

          {/* 하단 정보 */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 text-center">
              총 {filteredStores.length}개 매장
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSelector;
