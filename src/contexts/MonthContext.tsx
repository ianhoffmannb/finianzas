import { createContext, useContext, useState, type ReactNode } from 'react';
import { addMonths, currentMonthKey } from '../utils/date';

interface MonthContextValue {
  month: string; // yyyy-mm-01
  isCurrentMonth: boolean;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  goToCurrentMonth: () => void;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
  const real = currentMonthKey();
  const [month, setMonth] = useState(real);

  return (
    <MonthContext.Provider
      value={{
        month,
        isCurrentMonth: month === real,
        goPrevMonth: () => setMonth((m) => addMonths(m, -1)),
        goNextMonth: () => setMonth((m) => (m === real ? m : addMonths(m, 1))),
        goToCurrentMonth: () => setMonth(real),
      }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
