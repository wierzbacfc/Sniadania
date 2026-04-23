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
      <Card className="flex flex-row items-center gap-4 bg-[var(--color-dark-surface-elevated)] p-5 border-[var(--color-dark-border)] border">
        <button 
          onClick={handleMicClick}
          className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] ${isListening ? 'bg-[var(--color-danger)] text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse scale-105' : 'bg-white/5 text-[var(--color-accent-gold)] border border-[var(--color-dark-border)] hover:bg-white/10'}`}
        >
          <Mic size={24} strokeWidth={isListening ? 2 : 1.5} />
        </button>
        <div>
          <h2 className="text-xl font-display font-medium text-white tracking-wide">Szybka Akcja</h2>
          <p className={`text-xs mt-1 transition-colors ${isListening ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}>{micStatus}</p>
        </div>
      </Card>

      {!keys.length ? (
        <div className="text-center py-16 px-6 border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] rounded-2xl shadow-lg mt-8">
          <div className="text-5xl mb-6 opacity-80">🛒</div>
          <div className="text-2xl font-display font-medium text-white mb-2">Spiżarnia pusta</div>
          <div className="text-sm font-sans text-[var(--color-text-secondary)] leading-relaxed">
            Dodaj przepisy, aby zobaczyć składniki
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 px-1 mt-6">
            <div className="text-[11px] font-medium text-[var(--color-accent-gold)] tracking-widest bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/20 px-3 py-1.5 rounded-full">
              {inHome.length} / {keys.length} W DOMU
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={fillPantry}>Wszystko</Button>
              <Button size="sm" variant="danger" onClick={clearPantry}>Nic</Button>
            </div>
          </div>

          {missing.length > 0 && (
            <div className="mb-8">
              <SectionHeader className="justify-between items-center flex border-none">
                <span className="text-[var(--color-danger)] text-xl">BRAKUJE ({missing.length})</span>
                <button className="text-[11px] bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] text-white px-3 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-all hover:bg-[var(--color-dark-surface-elevated)]" onClick={copyShoppingList}>Kopiuj</button>
              </SectionHeader>
              <div className="flex flex-wrap gap-2.5 bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-2xl p-5 shadow-xl">
                {missing.map((k) => (
                  <PantryItem 
                    key={k} 
                    name={k} 
                    isOn={false} 
                    onToggle={() => updatePantryItem(k, true)} 
                  />
                ))}
              </div>
            </div>
          )}

          {inHome.length > 0 && (
            <div className="mb-8">
              <SectionHeader className="text-emerald-400 text-xl border-none">W DOMU ({inHome.length})</SectionHeader>
              <div className="flex flex-wrap gap-2.5 bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-2xl p-5 shadow-xl">
                {inHome.map((k) => (
                  <PantryItem 
                    key={k} 
                    name={k} 
                    isOn={true} 
                    onToggle={() => updatePantryItem(k, false)} 
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

const PantryItem: React.FC<{ name: string, isOn: boolean, onToggle: () => void }> = ({ name, isOn, onToggle }) => {
  return (
    <div 
      className={`px-3 py-2 border transition-all duration-300 select-none shadow-sm cursor-pointer rounded-xl flex items-center gap-2.5 active:scale-95 ${isOn ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[var(--color-dark-border)] bg-[var(--color-dark-surface-elevated)] hover:border-white/20'}`}
      onClick={onToggle}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors text-xs shrink-0 ${isOn ? 'bg-emerald-500 text-[var(--color-dark-bg)]' : 'border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] text-transparent'}`}>
        {isOn ? '✓' : ''}
      </div>
      <span className={`text-[12px] font-medium tracking-wide ${isOn ? 'text-emerald-50' : 'text-[var(--color-text-secondary)] hover:text-white'}`}>{name}</span>
    </div>
  );
}
