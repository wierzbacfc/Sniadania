import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, SectionHeader } from './ui';
import { last30Days, dayLabel, formatMonthDay, todayStr } from '../lib/utils';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CalendarView() {
  const { calendar, recipes, setCalendarDay } = useAppStore();
  const [pickerDate, setPickerDate] = useState<string | null>(null);

  const td = todayStr();
  const days = last30Days();

  const handlePick = (date: string, rid: string) => {
    setCalendarDay(date, rid);
    setPickerDate(null);
    toast.success('Zapisano do dziennika!');
  };

  const handleClear = (date: string) => {
    setCalendarDay(date, null);
    setPickerDate(null);
  };

  return (
    <>
      <SectionHeader>Ostatnie 30 dni</SectionHeader>
      
      {days.map(ds => {
        const rid = calendar[ds];
        const r = rid ? recipes.find(x => x.id === rid) : null;
        const isTd = ds === td;
        const d = new Date(ds + 'T12:00:00');

        return (
          <div 
            key={ds}
            onClick={() => setPickerDate(ds)}
            className={`flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-[20px] mb-3 cursor-pointer transition-colors active:border-orange-500 shadow-sm ${isTd ? 'border-orange-200 bg-orange-50/50' : ''}`}
          >
            <div className="text-center min-w-[48px] shrink-0">
              <div className={`font-sans text-2xl font-black leading-none ${isTd ? 'text-orange-600' : 'text-slate-800'}`}>
                {d.getDate()}
              </div>
              <div className={`text-[10px] uppercase font-bold tracking-[0.1em] mt-1 ${isTd ? 'text-orange-500' : 'text-slate-400'}`}>
                {isTd ? 'dziś' : dayLabel(ds)}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {r ? (
                <>
                  <div className="text-[15px] font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{r.name}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">{formatMonthDay(ds)}</div>
                </>
              ) : (
                <div className="text-sm text-slate-400 font-medium">Nie zaznaczono</div>
              )}
            </div>
            
            <ChevronRight className={`shrink-0 ${isTd ? 'text-orange-300' : 'text-slate-300'}`} size={20} />
          </div>
        );
      })}

      {/* Picker Modal inline */}
      {pickerDate && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setPickerDate(null) }}>
          <div className="bg-white border-t border-slate-200 rounded-t-[32px] p-6 w-full max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
            <div className="font-sans text-[22px] font-black text-slate-800 mb-6 flex items-center justify-between">
              <span>{formatMonthDay(pickerDate)} {new Date(pickerDate).getFullYear()}</span>
              {calendar[pickerDate] && (
                <button onClick={() => handleClear(pickerDate)} className="text-rose-500 text-xs font-bold uppercase tracking-wider bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                  Usuń
                </button>
              )}
            </div>

            <SectionHeader className="mb-4">Wybierz śniadanie</SectionHeader>
            
            {!recipes.length ? (
              <div className="text-slate-500 text-center py-8 text-sm bg-slate-50 rounded-2xl border border-slate-200">
                Najpierw dodaj przepisy w zakładce Przepisy
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recipes.map(r => {
                  const isCur = calendar[pickerDate] === r.id;
                  return (
                    <div 
                      key={r.id}
                      onClick={() => handlePick(pickerDate, r.id)}
                      className={`p-4 rounded-[20px] cursor-pointer select-none transition-colors active:scale-[0.98] ${isCur ? 'border-2 border-orange-500 bg-orange-50 shadow-sm' : 'border border-slate-200 bg-white hover:border-orange-300 text-slate-800'}`}
                    >
                      <div className={`text-[15px] font-bold ${isCur ? 'text-orange-700' : 'text-slate-800'}`}>{r.name}</div>
                      <div className={`text-[12px] mt-1 font-medium ${isCur ? 'text-orange-600/70' : 'text-slate-500'}`}>{r.ingredients?.length || 0} składników</div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Button size="full" onClick={() => setPickerDate(null)} className="mt-6">
              Zamknij
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
