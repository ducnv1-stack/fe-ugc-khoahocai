'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface SettingsContextProps {
  systemName: string;
  setSystemName: (name: string) => void;
  colors: {
    primary: string;
    sidebarDark: string;
    bgDark: string;
  };
  setColors: (colors: any) => void;
}

const defaultColors = {
  primary: '#2563eb',
  sidebarDark: '#1e293b', // slate-800
  bgDark: '#0f172a', // slate-900
};

const SettingsContext = createContext<SettingsContextProps>({
  systemName: 'CSMS CRM',
  setSystemName: () => {},
  colors: defaultColors,
  setColors: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [systemName, setSystemName] = useState('CSMS CRM');
  const [colors, setColors] = useState(defaultColors);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get('/settings');
        if (data.general?.systemName) {
          setSystemName(data.general.systemName);
        }
        if (data.theme?.colors) {
          setColors((prev) => ({ ...prev, ...data.theme.colors }));
        }
      } catch (error) {
        console.error('Failed to init settings', error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    // Inject các biến CSS khi state colors thay đổi
    document.documentElement.style.setProperty('--primary', colors.primary);
    
    // Inject Custom variables cho dark mode:
    document.documentElement.style.setProperty('--custom-bg-dark', colors.bgDark);
    document.documentElement.style.setProperty('--custom-sidebar-dark', colors.sidebarDark);
  }, [colors]);

  return (
    <SettingsContext.Provider value={{ systemName, setSystemName, colors, setColors }}>
      {children}
    </SettingsContext.Provider>
  );
}
