import React from 'react';
import { useAppStore } from '../store';
import { Button, Card, Badge, SectionHeader } from './ui';
import { Plus } from 'lucide-react';
import { todayStr } from '../lib/utils';
import toast from 'react-hot-toast';

export default function RecipesView() {
  const { recipes, pantry, calendar, deleteRecipe } = useAppStore();

  const availableIds = recipes
    .filter(r => r.ingredients?.length > 0 && r.ingredients.every(i => pantry[i]))
    .map(r => r.id);

  const handleDelete = (id: string) => {
    if (confirm('Usunąć ten przepis?')) {
      deleteRecipe(id);
      toast.success('Usunięto przepis');
    }
  };

  const openAdd = () => {
    window.dispatchEvent(new CustomEvent('open-recipe-modal'));
  };

  const openEdit = (id: string) => {
    window.dispatchEvent(new CustomEvent('open-recipe-modal', { detail: { id } }));
  };

  const getStats = (id: string) => {
    let count = 0, lastDate = null;
    for (const [date, rid] of Object.entries(calendar)) {
      if (rid === id) {
        count++;
        if (!lastDate || date > lastDate) lastDate = date;
      }
    }
    let daysAgoText = 'Nigdy';
    if (lastDate) {
      const todayDate = new Date(todayStr());
      const pastDate = new Date(lastDate);
      todayDate.setHours(0, 0, 0, 0);
      pastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((todayDate.getTime() - pastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) daysAgoText = 'Dzisiaj';
      else if (diffDays === 1) daysAgoText = 'Wczoraj';
      else daysAgoText = `${diffDays} dni temu`;
    }
    return { count, daysAgoText };
  };

  return (
    <>
      <button 
        onClick={openAdd}
        className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-[24px] text-slate-500 font-sans text-sm font-semibold cursor-pointer mb-6 transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Dodaj nowy przepis
      </button>

      {!recipes.length ? (
        <div className="text-center py-14 px-6 text-slate-400">
          <div className="text-5xl mb-3.5 opacity-40">🥣</div>
          <div className="text-base font-semibold text-slate-700">Brak przepisów</div>
          <div className="text-xs mt-2 leading-relaxed">
            Dodaj swoje ulubione śniadania.<br/>AI wykryje składniki automatycznie.
          </div>
        </div>
      ) : (
        <>
          <SectionHeader>{recipes.length} {recipes.length === 1 ? 'przepis' : recipes.length < 5 ? 'przepisy' : 'przepisów'}</SectionHeader>
          
          {recipes.map(r => {
            const ingN = r.ingredients?.length || 0;
            const hasN = r.ingredients?.filter(i => pantry[i]).length || 0;
            const isAv = availableIds.includes(r.id);
            const stats = getStats(r.id);

            return (
              <Card key={r.id} className={isAv ? "border-emerald-200 shadow-emerald-50 bg-emerald-50/50" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="font-sans text-lg font-bold text-slate-800">{r.name}</div>
                  {isAv ? <Badge variant="success" className="shrink-0">✓ gotowe</Badge> : (ingN > 0 && <Badge variant="muted" className="shrink-0">{hasN}/{ingN}</Badge>)}
                </div>
                
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 mb-1">
                    {r.tags.map(t => (
                      <span key={t} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">{t}</span>
                    ))}
                  </div>
                )}

                {ingN > 0 ? (
                  <div className="text-[13px] text-slate-500 mt-2.5 leading-relaxed font-medium">
                    {r.ingredients.map((i, iIdx) => (
                      <React.Fragment key={i}>
                        <span className={pantry[i] ? "text-emerald-600 font-bold" : "text-rose-500 line-through opacity-70"}>{i}</span>
                        {iIdx < r.ingredients.length - 1 && ' · '}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs italic text-slate-400 mt-2">Brak składników — edytuj by dodać</div>
                )}

                {r.instructions && (
                  <div className="text-xs text-slate-500 bg-slate-50 border-l-4 border-orange-200 p-3 rounded-r-xl mt-3 italic whitespace-pre-wrap">
                    {r.instructions}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => openEdit(r.id)}>
                    Edytuj
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(r.id)}>
                    Usuń
                  </Button>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4 flex justify-between font-bold tracking-widest uppercase">
                  <span>Jadłeś: <span className="text-slate-600">{stats.count}x</span></span>
                  <span>Ostatnio: <span className="text-slate-600">{stats.daysAgoText}</span></span>
                </div>
              </Card>
            )
          })}
        </>
      )}
    </>
  );
}
