import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean; // Computed active state for logic usage
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check local storage or default to auto
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('khalili_theme');
            return (saved as Theme) || 'auto';
        }
        return 'auto';
    });

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (isDarkTheme: boolean) => {
            setIsDark(isDarkTheme);
            if (isDarkTheme) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        if (theme === 'auto') {
            const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemChange = (e: MediaQueryListEvent) => {
                applyTheme(e.matches);
            };

            // Initial check
            applyTheme(systemPreference.matches);

            // Listener for system changes
            systemPreference.addEventListener('change', handleSystemChange);

            return () => {
                systemPreference.removeEventListener('change', handleSystemChange);
            };
        } else {
            applyTheme(theme === 'dark');
        }

        // Persist preference
        localStorage.setItem('khalili_theme', theme);

    }, [theme]);

    const value = {
        theme,
        setTheme,
        isDark
    };

    return (
        <ThemeContext.Provider value={value}>
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
