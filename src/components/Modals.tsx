import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Button, Input, Textarea, SectionHeader } from './ui';
import { detectIngredients } from '../lib/ai';
import toast from 'react-hot-toast';
import { Download, Upload, Trash2, Cpu, Loader2 } from 'lucide-react';
import { uid } from '../lib/utils';
import { Recipe } from '../types';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { apiKey, apiProvider, setAppState } = useAppStore();
  const [keyInput, setKeyInput] = useState(apiKey ? '••••••••' + apiKey.slice(-4) : '');
  const [provider, setProvider] = useState(apiProvider);

  const handleSave = () => {
    let k = keyInput.trim();
    if (k.startsWith('•')) k = apiKey; // no change
    setAppState(s => ({ ...s, apiKey: k, apiProvider: provider }));
    toast.success('Ustawienia zapisane');
    onClose();
  };

  const handleExport = () => {
    const s = localStorage.getItem('sn1') || '{}';
    const b = new Blob([s], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'sniadanie_backup.json';
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.recipes || !data.pantry) throw new Error();
        if (confirm(`Wczytać kopię? Zawiera ${data.recipes.length} przepisów. Obecne dane przepadną!`)) {
          setAppState(s => ({ ...s, ...data, apiProvider: provider, apiKey: s.apiKey }));
          toast.success(`Zaimportowano ${data.recipes.length} przepisów.`);
          onClose();
        }
      } catch {
        toast.error('Nieprawidłowy plik kopii');
      }
    };
    reader.readAsText(file);
  };

  const handleNuke = () => {
    if (confirm('Usunąć wszystko na dobre?')) {
      setAppState({ recipes: [], pantry: {}, calendar: {}, apiKey: '', apiProvider: 'gemini' });
      toast.success('Dane usunięte');
      onClose();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 rounded-t-[32px] p-6 pb-8 w-full max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl">
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
      <div className="font-sans text-[22px] font-black text-slate-800 mb-6">Ustawienia</div>

      {/* API Config */}
      <SectionHeader>Dostawca AI</SectionHeader>
      
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setProvider('gemini')}
          className={`flex-1 p-[12px] rounded-2xl border text-center font-sans text-sm font-bold transition-all shadow-sm ${provider === 'gemini' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300'}`}
        >
          <span className="text-xl inline-block mb-1">🔷</span>
          <br/>Google Gemini
        </button>
        <button 
          onClick={() => setProvider('claude')}
          className={`flex-1 p-[12px] rounded-2xl border text-center font-sans text-sm font-bold transition-all shadow-sm ${provider === 'claude' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300'}`}
        >
          <span className="text-xl inline-block mb-1">🟣</span>
          <br/>Claude
        </button>
      </div>
      
      <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-orange-500 rounded-2xl p-4 text-sm text-slate-600 mb-6 leading-relaxed">
        {provider === 'gemini' 
          ? <>Darmowy model z najlepszymi limitami do testów. Uzyskaj klucz z <strong>aistudio.google.com</strong></>
          : <>Świetny model językowy, dobry do skomplikowanych przepisów. Uzyskaj klucz z <strong>console.anthropic.com</strong></>}
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Klucz API</label>
        <Input 
          type="password" 
          placeholder="Wklej klucz API…" 
          value={keyInput} 
          onChange={e => setKeyInput(e.target.value)} 
        />
      </div>
      
      <Button variant="primary" size="full" onClick={handleSave} className="mb-6">
        Zapisz klucz
      </Button>

      <div className="h-px bg-slate-200 my-6" />

      {/* Backup */}
      <SectionHeader>Kopia zapasowa danych</SectionHeader>
      <div className="flex gap-2 mb-6">
        <Button size="full" className="flex-1 text-xs" onClick={handleExport}>
          <Download size={16} /> Eksportuj JSON
        </Button>
        <Button size="full" className="flex-1 text-xs" onClick={() => document.getElementById('json-upload')?.click()}>
          <Upload size={16} /> Importuj JSON
        </Button>
        <input type="file" id="json-upload" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      <div className="h-px bg-slate-200 my-6" />

      <Button variant="danger" size="full" onClick={handleNuke}>
        <Trash2 size={16} /> Usuń wszystkie dane (Wipe)
      </Button>

      <Button size="full" onClick={onClose} className="mt-4">
        Zamknij
      </Button>
    </div>
  );
}

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
    <div className="bg-white border-t border-slate-200 rounded-t-[32px] p-6 pb-8 w-full max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250 shadow-2xl">
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
      <div className="font-sans text-[22px] font-black text-slate-800 mb-6">
        {editId ? 'Edytuj przepis' : prefill ? '✨ Magiczny Przepis' : 'Nowy Przepis'}
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Nazwa śniadania</label>
        <Input placeholder="np. Owsianka z bananem i miodem" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {!editId && !prefill && (
        <div className="mb-4 space-y-3">
          <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Wklej tekst (wykrywanie pożre AI)</label>
          <Textarea 
            placeholder="Wklej tutaj treść z bloga lub książki. AI wydobędzie listę składników..." 
            value={text} 
            onChange={e => setText(e.target.value)}
            className="min-h-[80px]"
          />
          <Button variant="primary" size="full" onClick={handleDetect} disabled={isDetecting}>
            {isDetecting ? <Loader2 className="animate-spin" size={16} /> : <Cpu size={16} />} 
            {isDetecting ? 'Wykrywam...' : 'Wykryj składniki z tekstu'}
          </Button>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Składniki (Ręcznie, po przecinku)</label>
        <Textarea 
          placeholder="np. owsianka, banan, miód" 
          value={ingStr} 
          onChange={e => setIngStr(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Tagi (Słodkie, Słone, itp.)</label>
        <Input placeholder="np. Słodkie, Białkowe" value={tagsStr} onChange={e => setTagsStr(e.target.value)} />
      </div>

      <div className="mb-6">
        <label className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2">Instrukcje / Notatki</label>
        <Textarea 
          placeholder="Jak zrobić to śniadanie..." 
          value={inst} 
          onChange={e => setInst(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} className="basis-1/3">Anuluj</Button>
        <Button variant="primary" className="basis-2/3" onClick={handleSave}>Zapisz</Button>
      </div>

    </div>
  );
}

export default function Modals({ isSettingsOpen, closeSettings }: { isSettingsOpen: boolean, closeSettings: () => void }) {
  const [recipeModalState, setRecipeModalState] = useState<{ open: boolean, editId?: string, prefill?: any }>({ open: false });

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const ev = e as CustomEvent;
      setRecipeModalState({ open: true, editId: ev.detail?.id, prefill: ev.detail?.prefill });
    };
    window.addEventListener('open-recipe-modal', handleOpen);
    return () => window.removeEventListener('open-recipe-modal', handleOpen);
  }, []);

  if (!isSettingsOpen && !recipeModalState.open) return null;

  return (
    <div 
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-200" 
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          if (isSettingsOpen) closeSettings();
          if (recipeModalState.open) setRecipeModalState({ open: false });
        }
      }}
    >
      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}
      {recipeModalState.open && <RecipeModal onClose={() => setRecipeModalState({ open: false })} editId={recipeModalState.editId} prefill={recipeModalState.prefill} />}
    </div>
  );
}
