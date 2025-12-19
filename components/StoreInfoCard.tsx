
import React from 'react';
import { Store } from '../types';
import { calculateAge, calculateYearsOfService } from '../utils/dateUtils';

interface StoreInfoCardProps {
  store: Store;
}

const StoreInfoCard: React.FC<StoreInfoCardProps> = ({ store }) => {
  const managerAge = store.manager.birthDate ? calculateAge(store.manager.birthDate) : 0;
  const yearsOfService = store.manager.startDate ? calculateYearsOfService(store.manager.startDate) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">
              {store.category}
            </span>
            {store.py && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                {store.py}평
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{store.name}</h2>
          <p className="text-xs text-slate-400 flex items-center mt-1">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
             {store.location}
          </p>
        </div>
        <div className="bg-slate-100 p-2 rounded-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
             </svg>
        </div>
      </div>

      <div className="border-t border-slate-50 pt-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-medium">{store.manager.position}</p>
          <p className="text-sm font-bold text-slate-900">{store.manager.name}</p>
          <div className="flex items-center gap-3 mt-1">
            {managerAge > 0 && (
              <span className="text-[10px] text-slate-400">
                만 {managerAge}세
              </span>
            )}
            {yearsOfService > 0 && (
              <span className="text-[10px] text-slate-400">
                근속 {yearsOfService}년
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            <a 
              href={`tel:${store.manager.phone}`} 
              className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            </a>
            <a 
              href={`sms:${store.manager.phone}`}
              className="w-9 h-9 flex items-center justify-center bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </a>
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;
