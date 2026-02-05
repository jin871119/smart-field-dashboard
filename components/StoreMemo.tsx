import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'store-memos';

export interface MemoItem {
  id: string;
  date: string;
  content: string;
}

interface StoreMemoProps {
  storeId: string;
  storeName: string;
}

const loadMemos = (storeId: string): MemoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: Record<string, MemoItem[]> = JSON.parse(raw);
    return all[storeId] || [];
  } catch {
    return [];
  }
};

const saveMemos = (storeId: string, memos: MemoItem[]) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, MemoItem[]> = raw ? JSON.parse(raw) : {};
    all[storeId] = memos;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('메모 저장 실패:', e);
  }
};

const StoreMemo: React.FC<StoreMemoProps> = ({ storeId, storeName }) => {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMemos(loadMemos(storeId));
  }, [storeId]);

  const handleSave = () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    const newMemo: MemoItem = {
      id: `memo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString().slice(0, 10),
      content: trimmed
    };

    const updated = [newMemo, ...memos];
    setMemos(updated);
    saveMemos(storeId, updated);
    setNewContent('');
  };

  const handleDelete = (id: string) => {
    const updated = memos.filter((m) => m.id !== id);
    setMemos(updated);
    saveMemos(storeId, updated);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">매장 방문 메모</h3>
            <p className="text-xs text-slate-500">
              {memos.length > 0 ? `저장된 메모 ${memos.length}개` : '이슈 사항을 기록하세요'}
            </p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          {/* 새 메모 입력 */}
          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`${storeName} 방문 시 확인한 이슈, 후속 조치 사항 등을 입력하세요`}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none resize-none"
            />
            <button
              onClick={handleSave}
              disabled={!newContent.trim()}
              className="mt-2 w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              저장
            </button>
          </div>

          {/* 저장된 메모 목록 */}
          {memos.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">저장된 메모</p>
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {memos.map((memo) => (
                  <li
                    key={memo.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{memo.content}</p>
                      <button
                        onClick={() => handleDelete(memo.id)}
                        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="삭제"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{memo.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreMemo;
