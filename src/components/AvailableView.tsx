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
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 shadow-lg shadow-indigo-100 mb-6">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">✨</div>
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold">AI Kreator Śniadań</h2>
          <p className="text-indigo-100 text-xs mt-1 mb-4">Wymyśl coś zupełnie nowego z Twoich produktów.</p>
          <button 
            onClick={handleMagic}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
          >
            Generuj pomysł przez AI
          </button>
        </div>
      </div>

      {!available.length && !almost.length ? (
        <div className="text-center py-14 px-6 text-slate-400">
          <div className="text-5xl mb-3.5 opacity-40">🌅</div>
          <div className="text-base font-semibold text-slate-700">Brak dostępnych śniadań</div>
          <div className="text-xs mt-2 leading-relaxed">
            Zaktualizuj spiżarnię, aby zobaczyć propozycje
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-3xl p-6 shadow-xl flex flex-col mb-4">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-white text-lg font-semibold">Dostępne Przepisy</h2>
              <p className="text-slate-400 text-xs">Możesz zrobić te dania już teraz</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {available.map(r => (
              <div key={r.id} className="bg-slate-700 p-4 rounded-2xl border-l-[4px] border-emerald-500 flex flex-col gap-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-white font-medium text-[15px]">{r.name}</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                    100% Składników
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  Składniki: {r.ingredients.join(', ')}
                </div>
              </div>
            ))}

            {almost.map(r => {
              const missing = r.ingredients.find(i => !pantry[i])!;
              return (
                <div key={r.id} className="bg-slate-700 p-4 rounded-2xl border-l-[4px] border-amber-500 flex flex-col gap-1 opacity-[0.85] grayscale-[0.3]">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-white font-medium text-[15px] line-through decoration-slate-500 border-none">{r.name}</h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      Brakuje: {missing}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    <button 
                      onClick={() => handleFindSub(missing, r.name)}
                      className="text-amber-400 underline decoration-amber-400/30 underline-offset-2 hover:decoration-amber-400/80 transition-colors"
                    >
                      ✨ Znajdź zamiennik przez AI
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
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setSubstituteInfo(null) }}>
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="font-sans text-xl font-bold text-white mb-4">Zamiennik od AI</div>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Zamiast <strong className="text-amber-400 font-medium">{substituteInfo.item}</strong> w przepisie na <strong className="text-white font-medium">{substituteInfo.recipeName}</strong>:
            </p>
            <div className="bg-slate-700/50 border border-indigo-500/30 border-l-4 border-l-indigo-500 rounded-2xl p-4 text-sm text-indigo-100 mb-6 italic leading-relaxed">
              "{substituteInfo.sub.trim()}"
            </div>
            <Button size="full" onClick={() => setSubstituteInfo(null)} className="bg-white text-slate-800 hover:bg-slate-100 border-none">Zamknij</Button>
          </div>
        </div>
      )}
    </>
  );
}
