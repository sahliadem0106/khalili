
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeMode, ThemeConfig } from '../types';

interface ThemeContextType {
  theme: ThemeConfig;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('muslimDaily_theme');
    // Default to system if nothing saved
    return saved ? JSON.parse(saved) : { mode: 'system', color: 'forest' };
  });

  useEffect(() => {
    localStorage.setItem('muslimDaily_theme', JSON.stringify(theme));
    applyTheme(theme);
  }, [theme]);

  // Listen for system changes if mode is 'system'
  useEffect(() => {
    if (theme.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(theme);
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme.mode]);

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    const isDark = 
      config.mode === 'dark' || 
      (config.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Ensure meta theme-color matches for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#111827' : '#F2F3F4');
    }
  };

  const setThemeMode = (mode: ThemeMode) => setTheme(prev => ({ ...prev, mode }));

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
