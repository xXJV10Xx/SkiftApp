import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  colors: typeof lightColors | typeof darkColors;
}

const lightColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarInactive: '#8E8E93',
  chatBubble: '#007AFF',
  chatBubbleText: '#FFFFFF',
  chatBubbleOther: '#E5E5EA',
  chatBubbleOtherText: '#000000',
};

const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  success: '#30D158',
  error: '#FF453A',
  warning: '#FF9F0A',
  info: '#0A84FF',
  card: '#1C1C1E',
  tabBar: '#1C1C1E',
  tabBarInactive: '#8E8E93',
  chatBubble: '#0A84FF',
  chatBubbleText: '#FFFFFF',
  chatBubbleOther: '#2C2C2E',
  chatBubbleOtherText: '#FFFFFF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');

  const isDark = theme === 'system' 
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}; 