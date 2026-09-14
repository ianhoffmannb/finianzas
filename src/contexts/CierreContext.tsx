import { createContext, useContext, useState, type ReactNode } from 'react';

interface CierreContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CierreContext = createContext<CierreContextValue | undefined>(undefined);

export function CierreProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CierreContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CierreContext.Provider>
  );
}

export function useCierre() {
  const ctx = useContext(CierreContext);
  if (!ctx) throw new Error('useCierre must be used within CierreProvider');
  return ctx;
}
