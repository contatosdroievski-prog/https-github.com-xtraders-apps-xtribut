import { createContext, useContext, useState, ReactNode } from 'react';
import { Trade } from '../types';

interface AppContextType {
  processedTrades: Trade[];
  setProcessedTrades: (trades: Trade[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [processedTrades, setProcessedTrades] = useState<Trade[]>([]);

  return (
    <AppContext.Provider value={{ processedTrades, setProcessedTrades }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
