import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Button, Input, Textarea } from './ui';
import { detectIngredients } from '../lib/ai';
import toast from 'react-hot-toast';
import { Cpu, Loader2 } from 'lucide-react';
import { uid } from '../lib/utils';
import { Recipe } from '../types';

export function RecipeModal({ onClose, editId, prefill }: { onClose: () => void, editId?: string, prefill?: any }) {
  const { recipes, addRecipe, updateRecipe, apiKey } = useAppStore();
  
  const existing = editId ? recipes.find(r => r.id === editId) : null;
  
  const [name, setName] = useState(existing?.name || prefill?.name || '');
  const [text, setText] = useState('');
  const [ingStr, setIngStr] = useState((existing?.ingredients || prefill?.ingredients || []).join(', '));
  const [tagsStr, setTagsStr] = useState((existing?.tags || prefill?.tags || []).join(', '));
  const [inst, setInst] = useState(existing?.instructions || prefill?.instructions || '');
  
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetect = async () => {
    if (!text.trim()) return toast.error('Wklej tekst przepisu!');
    if (!apiKey && !process.env.GEMINI_API_KEY) return toast.error('Brak klucza API');
    
    setIsDetecting(true);
    try {
      const ings = await detectIngredients(text, apiKey);
      setIngStr(ings.join(', '));
      toast.success(`Wykryto ${ings.length} składników`);
    } catch (e) {
      toast.error('Błąd wyciągania z tekstu');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error('Podaj nazwę przepisu');
    
    const ings = ingStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const tags = tagsStr.split(',').map(s => s.trim() || s).filter(Boolean);
    
    const recData = {
      name: name.trim(),
      ingredients: ings,
      tags,
      instructions: inst.trim()
    };

    if (editId) {
      updateRecipe(editId, recData);
      toast.success('Zaktualizowano przepis');
    } else {
      addRecipe({ id: uid(), ...recData });
      toast.success('Dodano przepis');
    }
    onClose();
  };

  return (
    <div className="bg-[var(--color-dark-surface)] border-t border-[var(--color-dark-border)] p-6 pb-top-safe w-full max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-300 mx-auto max-w-[480px] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="font-display text-2xl font-medium text-white mb-8 leading-none">
        {editId ? 'Edytuj Przepis' : prefill ? 'Cudowny Pomysł AI' : 'Nowy Przepis'}
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-2">Nazwa</label>
        <Input placeholder="np. Owsianka z bananem i miodem" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {!editId && !prefill && (
        <div className="mb-6 space-y-3">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-2 flex items-center justify-between">
            <span>Wklej pełny tekst</span>
            <span className="text-[10px] text-[var(--color-accent-gold)] normal-case tracking-normal">AI ODNAJDZIE SKŁADNIKI</span>
          </label>
          <Textarea 
            placeholder="Wklej tutaj treść z bloga lub notatki. AI automatycznie wyciągnie listę składników..." 
            value={text} 
            onChange={e => setText(e.target.value)}
            className="min-h-[100px]"
          />
          <Button variant="primary" size="full" onClick={handleDetect} disabled={isDetecting}>
            {isDetecting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Cpu size={18} className="mr-2" />} 
            {isDetecting ? 'Analizowanie...' : 'Wykryj z tekstu'}
          </Button>
        </div>
      )}

      {(!editId && !prefill) ? <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-dark-border)] to-transparent w-full my-8" /> : null}

      <div className="mb-5">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-2">Składniki (Ręcznie po przecinku)</label>
        <Textarea 
          placeholder="np. owsianka, banan, miód" 
          value={ingStr} 
          onChange={e => setIngStr(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-2">Tagi / Kategoria</label>
        <Input placeholder="np. Słodkie, Białkowe, Fit" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
      </div>

      <div className="mb-10">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-2">Instrukcje wykonania</label>
        <Textarea 
          placeholder="Jak zrobić to śniadanie..." 
          value={inst} 
          onChange={e => setInst(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="flex gap-4 mb-safe pb-8">
        <Button onClick={onClose} variant="ghost" className="basis-1/3 border border-[var(--color-dark-border)]">Anuluj</Button>
        <Button variant="primary" className="basis-2/3" onClick={handleSave}>Zapisz Przepis</Button>
      </div>

    </div>
  );
}

export default function Modals() {
  const [recipeModalState, setRecipeModalState] = useState<{ open: boolean, editId?: string, prefill?: any }>({ open: false });

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const ev = e as CustomEvent;
      setRecipeModalState({ open: true, editId: ev.detail?.id, prefill: ev.detail?.prefill });
    };
    window.addEventListener('open-recipe-modal', handleOpen);
    return () => window.removeEventListener('open-recipe-modal', handleOpen);
  }, []);

  if (!recipeModalState.open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-300" 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          setRecipeModalState({ open: false });
        }
      }}
    >
      {recipeModalState.open && <RecipeModal onClose={() => setRecipeModalState({ open: false })} editId={recipeModalState.editId} prefill={recipeModalState.prefill} />}
    </div>
  );
}
