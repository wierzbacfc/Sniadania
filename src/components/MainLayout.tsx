import React, { useState } from 'react';
import { Settings, ClipboardList, ShoppingCart, Sparkles, Calendar } from 'lucide-react';
import { useAppStore } from '../store';
import RecipesView from './RecipesView';
import PantryView from './PantryView';
import AvailableView from './AvailableView';
import CalendarView from './CalendarView';
import Modals from './Modals';

export type TabId = 'recipes' | 'pantry' | 'available' | 'calendar';

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('recipes');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { recipes, pantry } = useAppStore();
  
  const availCount = recipes.filter(r => r.ingredients?.length > 0 && r.ingredients.every(i => pantry[i])).length;

  const getTitle = () => {
    switch (activeTab) {
      case 'recipes': return 'Przepisy';
      case 'pantry': return 'Spiżarnia';
      case 'available': return 'Dostępne';
      case 'calendar': return 'Dziennik';
    }
  };

  return (
    <div className="h-[100dvh] w-full max-w-[480px] mx-auto bg-slate-50 relative overflow-hidden flex flex-col sm:border-x sm:border-slate-200 sm:shadow-2xl pt-[env(safe-area-inset-top,15px)]">
      {/* HEADER */}
      <header className="px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-orange-500 text-2xl leading-none">🍳</span>
          <h1 className="font-sans text-xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="bg-white border border-slate-200 text-slate-500 p-2.5 rounded-xl shadow-sm transition-all active:bg-slate-50 hover:text-slate-800"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-5 pb-[calc(72px+24px)] overflow-scrolling-touch">
        {activeTab === 'recipes' && <RecipesView />}
        {activeTab === 'pantry' && <PantryView />}
        {activeTab === 'available' && <AvailableView />}
        {activeTab === 'calendar' && <CalendarView />}
      </main>

      {/* TAB BAR */}
      <nav className="absolute bottom-0 left-0 right-0 h-[72px] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-md border-t border-slate-200 flex z-[100]">
        {[
          { id: 'recipes', icon: ClipboardList, label: 'Przepisy' },
          { id: 'pantry', icon: ShoppingCart, label: 'Spiżarnia' },
          { id: 'available', icon: Sparkles, label: 'Dostępne', badge: availCount },
          { id: 'calendar', icon: Calendar, label: 'Dziennik' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabId)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 bg-transparent border-none text-[10px] font-sans font-bold tracking-wide uppercase transition-colors relative ${activeTab === t.id ? 'text-orange-500' : 'text-slate-400'}`}
          >
            <t.icon size={22} strokeWidth={activeTab === t.id ? 2.5 : 2} />
            <span>{t.label}</span>
            {!!t.badge && t.badge > 0 && (
              <span className="absolute top-1 left-1/2 translate-x-3 bg-orange-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <Modals isSettingsOpen={isSettingsOpen} closeSettings={() => setIsSettingsOpen(false)} />
    </div>
  );
}
