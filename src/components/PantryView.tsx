import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, SectionHeader } from './ui';
import { Mic } from 'lucide-react';
import { processVoiceCommand } from '../lib/ai';
import toast from 'react-hot-toast';

export default function PantryView() {
  const { pantry, updatePantryItem, fillPantry, clearPantry, apiKey } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState("Skanuj głosem");

  const keys = Object.keys(pantry).sort();
  const missing = keys.filter(k => !pantry[k]);
  const inHome = keys.filter(k => pantry[k]);

  const copyShoppingList = () => {
    if (!missing.length) return;
    const text = "Lista zakupów:\n- " + missing.join("\n- ");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast.success('Skopiowano listę zakupów'));
    } else {
      toast.error('Kopiowanie nie powiodło się');
    }
  };

  const handleMicClick = async () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error("Przeglądarka nie obsługuje mikrofonu");
    if (!apiKey && !process.env.GEMINI_API_KEY) return toast.error("Brak klucza API (dodaj w ustawieniach)!");

    const rec = new SpeechRecognition();
    rec.lang = 'pl-PL';
    
    setIsListening(true);
    setMicStatus("Słucham... (Mów teraz)");

    rec.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMicStatus("Analizuję...");
      
      try {
        const result = await processVoiceCommand(transcript, keys, apiKey);
        let changes = 0;
        result.add?.forEach(i => {
          const k = keys.find(x => x.toLowerCase() === i.toLowerCase()) || i;
          updatePantryItem(k, true);
          changes++;
        });
        result.remove?.forEach(i => {
          const k = keys.find(x => x.toLowerCase() === i.toLowerCase());
          if (k) { updatePantryItem(k, false); changes++; }
        });
        toast.success(`Zaktualizowano (zmiany: ${changes})`);
      } catch (err) {
        toast.error("Błąd AI");
      }
    };
    
    rec.onerror = () => {
      setIsListening(false);
      setMicStatus("Błąd. Kliknij ponownie");
    };
    
    rec.onend = () => {
      setIsListening(false);
      if (micStatus === "Słucham... (Mów teraz)") {
         setMicStatus("Skanuj głosem");
      } else {
        setTimeout(() => setMicStatus("Skanuj głosem"), 2000);
      }
    };

    rec.start();
  };

  return (
    <>
      <Card className="flex flex-row items-center gap-4 bg-orange-50 border-orange-200">
        <button 
          onClick={handleMicClick}
          className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white border-none shadow-lg cursor-pointer transition-colors ${isListening ? 'bg-rose-500 animate-[pulse_1.5s_infinite]' : 'bg-orange-500 shadow-orange-200'}`}
        >
          <Mic size={24} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Szybka Aktualizacja</h2>
          <p className="text-xs text-slate-500 mt-1">{micStatus}</p>
        </div>
      </Card>

      {!keys.length ? (
        <div className="text-center py-14 px-6 text-slate-400">
          <div className="text-5xl mb-3.5 opacity-40">🛒</div>
          <div className="text-base font-semibold text-slate-700">Spiżarnia pusta</div>
          <div className="text-xs mt-2 leading-relaxed">
            Dodaj przepisy, aby zobaczyć składniki
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 px-1">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="text-slate-800 text-sm mr-1">{inHome.length}</span>/ {keys.length} gotowych
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={fillPantry}>Wszystko</Button>
              <Button size="sm" onClick={clearPantry}>Nic</Button>
            </div>
          </div>

          {missing.length > 0 && (
            <>
              <SectionHeader className="justify-between items-center flex">
                <span className="text-slate-500">Lista zakupów ({missing.length})</span>
                <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-300 transition-colors" onClick={copyShoppingList}>Kopiuj</span>
              </SectionHeader>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm mb-6">
                {missing.map((k) => (
                  <PantryItem 
                    key={k} 
                    name={k} 
                    isOn={false} 
                    onToggle={() => updatePantryItem(k, true)} 
                  />
                ))}
              </div>
            </>
          )}

          {inHome.length > 0 && (
            <>
              <SectionHeader>W domu ({inHome.length})</SectionHeader>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm mb-6">
                {inHome.map((k) => (
                  <PantryItem 
                    key={k} 
                    name={k} 
                    isOn={true} 
                    onToggle={() => updatePantryItem(k, false)} 
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

const PantryItem: React.FC<{ name: string, isOn: boolean, onToggle: () => void }> = ({ name, isOn, onToggle }) => {
  return (
    <div 
      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none text-center h-24 ${isOn ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-100 bg-white hover:border-orange-300'}`}
      onClick={onToggle}
    >
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isOn ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-slate-50 text-slate-400'}`}>
        {isOn ? '✓' : ''}
      </div>
      <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${isOn ? 'text-orange-700' : 'text-slate-500'}`}>{name}</span>
    </div>
  );
}
