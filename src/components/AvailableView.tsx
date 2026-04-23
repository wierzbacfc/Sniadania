import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, SectionHeader } from './ui';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { findSubstitute, generateMagicRecipe } from '../lib/ai';

export default function AvailableView() {
  const { recipes, pantry, apiKey } = useAppStore();
  const [substituteInfo, setSubstituteInfo] = useState<{ item: string, recipeName: string, sub: string } | null>(null);
  
  const inHome = Object.keys(pantry).filter(k => pantry[k]);
  const available = recipes.filter(r => r.ingredients?.length > 0 && r.ingredients.every(i => pantry[i]));
  const almost = recipes.filter(r => r.ingredients?.length > 0 && r.ingredients.filter(i => !pantry[i]).length === 1);

  const handleMagic = async () => {
    if (!apiKey && !process.env.GEMINI_API_KEY) return toast.error('Wymagany klucz API w ustawieniach!');
    if (inHome.length === 0) return toast.error('Spiżarnia pusta, dodaj składniki!');

    const toastId = toast.loading('✨ Wymyślam przepis...');
    try {
      const generated = await generateMagicRecipe(inHome, apiKey);
      toast.dismiss(toastId);
      toast.success('Gotowe! Zapisz przepis.');
      window.dispatchEvent(new CustomEvent('open-recipe-modal', { detail: { prefill: generated } }));
    } catch (e) {
      toast.dismiss(toastId);
      toast.error('Błąd wyobraźni AI :( Spróbuj jeszcze raz');
    }
  };

  const handleFindSub = async (missing: string, recipeName: string) => {
    if (!apiKey && !process.env.GEMINI_API_KEY) return toast.error('Wymagany klucz API!');
    
    const toastId = toast.loading(`Szukam zamiennika dla: ${missing}...`);
    try {
      const sub = await findSubstitute(missing, recipeName, inHome, apiKey);
      toast.dismiss(toastId);
      setSubstituteInfo({ item: missing, recipeName, sub });
    } catch (e) {
      toast.dismiss(toastId);
      toast.error('Błąd pobierania zamiennika');
    }
  };

  return (
    <>
      {/* AI Bento Block */}
      <div className="bg-gradient-to-br from-[var(--color-dark-surface-elevated)] to-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent-gold)]/5 rounded-full blur-2xl" />
        <div className="flex items-center gap-4 relative z-10 flex-1">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm">✨</div>
          <div className="flex-1 pr-2">
            <h2 className="text-white text-lg font-display font-medium leading-tight mb-0.5">AI Creator</h2>
            <p className="text-[var(--color-text-secondary)] font-sans text-xs line-clamp-1">Kreatywne z tego co masz</p>
          </div>
        </div>
        <button 
          onClick={handleMagic}
          className="relative z-10 shrink-0 px-4 py-2 bg-[var(--color-accent-gold)] text-black rounded-lg font-medium text-xs shadow-[var(--shadow-glow)] active:scale-95 transition-all cursor-pointer hover:bg-[var(--color-accent-gold-hover)]"
        >
          Generuj
        </button>
      </div>

      {!available.length && !almost.length ? (
        <div className="text-center py-16 px-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] rounded-2xl shadow-lg">
          <div className="text-5xl mb-6 opacity-60">🌅</div>
          <div className="text-2xl font-display font-medium text-white mb-2">Brak możliwości</div>
          <div className="text-sm font-sans text-[var(--color-text-secondary)] leading-relaxed">
            Dodaj cokolwiek do spiżarni
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-dark-surface)] rounded-2xl p-6 shadow-2xl flex flex-col mb-4 border border-[var(--color-dark-border)]">
          <div className="mb-6 flex justify-between items-end border-b border-white/5 pb-4">
            <div>
              <h2 className="text-white text-2xl font-display font-medium leading-none">W Zasięgu</h2>
              <p className="text-emerald-400/80 font-sans text-xs mt-2 font-medium tracking-wide">MOŻESZ ROBIĆ TERAZ</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {available.map(r => (
              <div key={r.id} className="bg-[var(--color-dark-surface-elevated)] p-5 rounded-2xl flex flex-col gap-2 border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-white font-sans font-medium text-lg leading-tight">{r.name}</h3>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium tracking-widest shrink-0 uppercase">
                    100%
                  </span>
                </div>
                <div className="text-xs font-sans text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                  {r.ingredients.join(' \u2022 ')}
                </div>
              </div>
            ))}

            {almost.map(r => {
              const missing = r.ingredients.find(i => !pantry[i])!;
              return (
                <div key={r.id} className="bg-[var(--color-dark-bg)] p-5 rounded-2xl flex flex-col gap-3 border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-[var(--color-text-secondary)] font-sans font-medium text-lg leading-tight line-through decoration-white/20">{r.name}</h3>
                    <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-medium tracking-widest shrink-0 uppercase">
                      BRAKI
                    </span>
                  </div>
                  <div className="text-xs font-sans text-red-300 mt-1 mb-2">
                    Brakuje: <span className="font-semibold text-red-200">{missing}</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleFindSub(missing, r.name)}
                      className="bg-white/5 text-white px-4 py-2 border border-white/10 rounded-lg text-xs hover:bg-white/10 active:scale-95 transition-all cursor-pointer w-full text-center"
                    >
                      Znajdź Zamiennik
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Substitute Modal inline */}
      {substituteInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) setSubstituteInfo(null) }}>
          <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-3xl p-8 w-full max-w-sm animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="font-display text-3xl font-medium text-white mb-6 leading-tight relative z-10">Zamiennik</div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed relative z-10">
              Zamiast <span className="text-red-400 font-medium px-1">{substituteInfo.item}</span> w przepisie <span className="text-[var(--color-accent-gold)] font-medium px-1">{substituteInfo.recipeName}</span>:
            </p>
            <div className="bg-[var(--color-dark-surface-elevated)] border border-white/5 rounded-2xl p-6 text-sm text-white mb-8 shadow-inner leading-relaxed relative z-10">
              "{substituteInfo.sub.trim()}"
            </div>
            <Button size="full" variant="ghost" onClick={() => setSubstituteInfo(null)} className="relative z-10">
              Zamknij
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
