import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, Card, Badge, SectionHeader } from './ui';
import { Plus, ChevronDown } from 'lucide-react';
import { todayStr } from '../lib/utils';
import toast from 'react-hot-toast';

export default function RecipesView() {
  const { recipes, pantry, calendar, deleteRecipe } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'słodkie' | 'słone'>('all');

  const availableIds = recipes
    .filter(r => r.ingredients?.length > 0 && r.ingredients.every(i => pantry[i]))
    .map(r => r.id);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Usunąć ten przepis?')) {
      deleteRecipe(id);
      toast.success('Usunięto przepis'); // Use standard UI deletion notification
    }
  };

  const openAdd = () => {
    window.dispatchEvent(new CustomEvent('open-recipe-modal'));
  };

  const openEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    let diffDays: number | null = null;
    if (lastDate) {
      const todayDate = new Date(todayStr());
      const pastDate = new Date(lastDate);
      todayDate.setHours(0, 0, 0, 0);
      pastDate.setHours(0, 0, 0, 0);
      diffDays = Math.round((todayDate.getTime() - pastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return { count, diffDays };
  };

  const filteredRecipes = recipes.filter(r => {
    if (filter === 'all') return true;
    const isMatched = r.tags && r.tags.some(t => {
      const lower = t.toLowerCase();
      // specifically match variations of the words
      if (filter === 'słodkie' && (lower.includes('słodk') || lower.includes('slodk'))) return true;
      if (filter === 'słone' && (lower.includes('słon') || lower.includes('slon') || lower.includes('wytrawn'))) return true;
      return false;
    });
    return isMatched;
  });

  return (
    <div className="relative min-h-full pb-20">
      {!recipes.length ? (
        <div className="text-center py-16 px-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] rounded-2xl shadow-lg mt-4">
          <div className="text-5xl mb-6 opacity-80">🥣</div>
          <div className="text-2xl font-display font-medium text-white mb-2">Brak przepisów</div>
          <div className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
            Dodaj pierwsze śniadanie.<br/>AI zautomatyzuje składniki.
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-center font-display text-xl font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-4 mt-2">
            Przepisy
          </h2>
          
          <div className="flex justify-center gap-2 mb-6">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full border text-[11px] font-medium tracking-wide transition-all ${filter === 'all' ? 'bg-[var(--color-accent-gold)] text-black border-[var(--color-accent-gold)]' : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-dark-border)] hover:bg-white/5'}`}
            >
              Wszystkie
            </button>
            <button 
              onClick={() => setFilter('słodkie')}
              className={`px-4 py-1.5 rounded-full border text-[11px] font-medium tracking-wide transition-all ${filter === 'słodkie' ? 'bg-[#f472b6] text-white border-[#f472b6]' : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-dark-border)] hover:bg-white/5'}`}
            >
              🍩 Słodkie
            </button>
            <button 
              onClick={() => setFilter('słone')}
              className={`px-4 py-1.5 rounded-full border text-[11px] font-medium tracking-wide transition-all ${filter === 'słone' ? 'bg-[#38bdf8] text-white border-[#38bdf8]' : 'bg-transparent text-[var(--color-text-secondary)] border-[var(--color-dark-border)] hover:bg-white/5'}`}
            >
              🍳 Słone
            </button>
          </div>
          
          {filteredRecipes.length === 0 ? (
             <div className="text-center py-10 px-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] rounded-2xl text-[var(--color-text-secondary)] text-sm">
                Brak przepisów w tej kategorii.
             </div>
          ) : (
            filteredRecipes.map(r => {
              const ingN = r.ingredients?.length || 0;
              const hasN = r.ingredients?.filter(i => pantry[i]).length || 0;
              const isAv = availableIds.includes(r.id);
              const stats = getStats(r.id);
              const isExpanded = expandedId === r.id;

              // Check if it's sweet or salty to render a tiny indicator
              const isSweet = r.tags && r.tags.some(t => t.toLowerCase().includes('słodk') || t.toLowerCase().includes('slodk'));
              const isSalty = r.tags && r.tags.some(t => t.toLowerCase().includes('słon') || t.toLowerCase().includes('slon') || t.toLowerCase().includes('wytrawn'));

              return (
                <Card key={r.id} className={`p-0 !mb-3 overflow-hidden ${isAv ? "ring-1 ring-[var(--color-success)]/30 bg-gradient-to-br from-[var(--color-dark-surface)] to-emerald-950/10" : ""}`}>
                  
                  {/* ALWAYS VISIBLE HEADER */}
                  <div 
                    className="flex justify-between items-center cursor-pointer select-none p-4"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <div className="flex-1 pr-3 flex flex-col justify-center">
                      <div className="font-display text-lg sm:text-xl font-medium text-white leading-tight flex items-center gap-2">
                        {r.name}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {isSweet && <span className="text-[10px] uppercase tracking-wider font-semibold text-[#f472b6]">Słodkie</span>}
                        {isSalty && <span className="text-[10px] uppercase tracking-wider font-semibold text-[#38bdf8]">Słone</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 pr-1">
                      <div 
                        className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-inner" 
                        title={`Spożyto: ${stats.count}x`}
                      >
                        {stats.count}
                      </div>
                      <div 
                        className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-inner"
                        title={stats.diffDays !== null ? `Ostatnio: ${stats.diffDays} dni temu` : 'Nigdy nie jedzono'}
                      >
                        {stats.diffDays !== null ? `${stats.diffDays}d` : '-'}
                      </div>
                      <ChevronDown size={22} className={`shrink-0 ml-1 text-[var(--color-accent-gold)] transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* EXPANDABLE BODY */}
                  <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="border-t border-white/5 p-4 sm:p-5 pt-4">
                        
                        <div className="flex items-center gap-3 mb-4">
                          {isAv ? <Badge variant="success" className="shrink-0 text-[10px] py-1">✓ DOSTĘPNE</Badge> : (ingN > 0 && <Badge variant="muted" className="shrink-0 text-[10px] py-1">{hasN}/{ingN} SKŁAD.</Badge>)}
                        </div>

                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-5">
                            {r.tags.map(t => (
                              <span key={t} className="px-2.5 py-1 bg-[var(--color-dark-surface-elevated)] border border-[var(--color-dark-border)] rounded-full text-[11px] font-medium tracking-wide text-[var(--color-text-secondary)]">{t}</span>
                            ))}
                          </div>
                        )}

                        {ingN > 0 ? (
                          <div className="text-[13px] leading-relaxed text-[var(--color-text-secondary)] mb-5">
                            {r.ingredients.map((i, iIdx) => (
                              <React.Fragment key={i}>
                                <span className={pantry[i] ? "text-white" : "text-red-400 opacity-90"}>{i}</span>
                                {iIdx < r.ingredients.length - 1 && <span className="opacity-40 mx-1.5">•</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[13px] opacity-50 mb-5">Brak podanych składników</div>
                        )}

                        {r.instructions && (
                          <div className="text-[14px] text-[var(--color-text-secondary)] bg-white/5 p-4 rounded-xl mb-5 whitespace-pre-wrap font-sans leading-relaxed">
                            {r.instructions}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button size="default" variant="secondary" onClick={(e) => openEdit(r.id, e)} className="flex-1 text-sm py-2">
                            Edytuj
                          </Button>
                          <Button size="default" variant="danger" onClick={(e) => handleDelete(r.id, e)} className="px-5 text-sm py-2">
                            Usuń
                          </Button>
                        </div>

                      </div>
                    </div>
                  </div>

                </Card>
              )
            })
          )}
        </>
      )}

      {/* Primary Action Positioned at Bottom (Sticky) */}
      <div className="fixed bottom-[104px] left-[50%] -translate-x-[50%] w-full max-w-[480px] px-5 z-40">
        <button 
          onClick={openAdd}
          className="w-full p-4 bg-gradient-to-r from-[var(--color-dark-surface-elevated)] to-[var(--color-dark-surface)] border border-[var(--color-accent-gold)]/30 rounded-2xl text-[var(--color-accent-gold)] font-medium text-[15px] tracking-wide cursor-pointer transition-all hover:bg-[var(--color-accent-gold)]/10 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_-5px_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          <Plus size={20} strokeWidth={2.5} /> DODAJ NOWY PRZEPIS
        </button>
      </div>

    </div>
  );
}
