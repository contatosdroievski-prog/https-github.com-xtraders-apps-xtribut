import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trade } from '../types';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { saveTrades, getTrades, saveWithdrawals, getWithdrawals } from '../firestore';
import { toast } from 'sonner';

interface AppContextType {
  processedTrades: Trade[];
  setProcessedTrades: (trades: Trade[]) => void;
  withdrawals: any[];
  setWithdrawals: (withdrawals: any[]) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [processedTrades, setProcessedTrades] = useState<Trade[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(true);

      if (currentUser) {
        try {
          // Load data from Firestore
          const [loadedTrades, loadedWithdrawals] = await Promise.all([
            getTrades(currentUser.uid),
            getWithdrawals(currentUser.uid)
          ]);

          setProcessedTrades(loadedTrades);
          setWithdrawals(loadedWithdrawals);
          console.log('Data loaded from Firestore');
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Erro ao carregar dados salvos.');
        }
      } else {
        // Clear data on logout
        setProcessedTrades([]);
        setWithdrawals([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save trades to Firestore when they change
  useEffect(() => {
    if (user && processedTrades.length > 0) {
      const timeoutId = setTimeout(() => {
        saveTrades(user.uid, processedTrades).catch(err => {
          console.error('Error auto-saving trades:', err);
        });
      }, 2000); // Debounce 2s

      return () => clearTimeout(timeoutId);
    }
  }, [processedTrades, user]);

  // Save withdrawals to Firestore when they change
  useEffect(() => {
    if (user && withdrawals.length > 0) {
      const timeoutId = setTimeout(() => {
        saveWithdrawals(user.uid, withdrawals).catch(err => {
          console.error('Error auto-saving withdrawals:', err);
        });
      }, 2000); // Debounce 2s

      return () => clearTimeout(timeoutId);
    }
  }, [withdrawals, user]);

  return (
    <AppContext.Provider value={{
      processedTrades,
      setProcessedTrades,
      withdrawals,
      setWithdrawals,
      isLoading
    }}>
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
