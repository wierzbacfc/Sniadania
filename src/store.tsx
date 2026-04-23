import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Recipe } from './types';

const initialState: AppState = {
  recipes: [],
  pantry: {},
  calendar: {},
  apiKey: '',
  apiProvider: 'gemini',
};

interface AppContextType extends AppState {
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  updatePantryItem: (item: string, value: boolean) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  setCalendarDay: (date: string, recipeId: string | null) => void;
  clearPantry: () => void;
  fillPantry: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('sn1');
    if (saved) {
      try {
        return { ...initialState, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse state", e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('sn1', JSON.stringify(state));
  }, [state]);

  const updatePantryItem = (item: string, value: boolean) => {
    setAppState(s => ({ ...s, pantry: { ...s.pantry, [item]: value } }));
  };

  const addRecipe = (recipe: Recipe) => {
    setAppState(s => {
      const newPantry = { ...s.pantry };
      recipe.ingredients.forEach(i => {
        if (!(i in newPantry)) newPantry[i] = false;
      });
      return { ...s, recipes: [...s.recipes, recipe], pantry: newPantry };
    });
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setAppState(s => {
      const newRecipes = s.recipes.map(r => r.id === id ? { ...r, ...updates } : r);
      const newPantry = { ...s.pantry };
      if (updates.ingredients) {
        updates.ingredients.forEach(i => {
          if (!(i in newPantry)) newPantry[i] = false;
        });
      }
      return { ...s, recipes: newRecipes, pantry: newPantry };
    });
  };

  const deleteRecipe = (id: string) => {
    setAppState(s => {
      const newRecipes = s.recipes.filter(r => r.id !== id);
      const usedIngredients = new Set(newRecipes.flatMap(r => r.ingredients || []));
      const newPantry = { ...s.pantry };
      Object.keys(newPantry).forEach(k => {
        if (!usedIngredients.has(k)) delete newPantry[k];
      });
      return { ...s, recipes: newRecipes, pantry: newPantry };
    });
  };

  const setCalendarDay = (date: string, recipeId: string | null) => {
    setAppState(s => {
      const newCal = { ...s.calendar };
      if (recipeId) newCal[date] = recipeId;
      else delete newCal[date];
      return { ...s, calendar: newCal };
    });
  };

  const clearPantry = () => {
    setAppState(s => {
      const newPantry = { ...s.pantry };
      Object.keys(newPantry).forEach(k => newPantry[k] = false);
      return { ...s, pantry: newPantry };
    });
  };

  const fillPantry = () => {
    setAppState(s => {
      const newPantry = { ...s.pantry };
      Object.keys(newPantry).forEach(k => newPantry[k] = true);
      return { ...s, pantry: newPantry };
    });
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setAppState,
      updatePantryItem,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      setCalendarDay,
      clearPantry,
      fillPantry
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
