'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

interface CustomThemeProviderProps extends Omit<ThemeProviderProps, 'children'> {
  children: React.ReactNode;
  primaryColor?: string;
}

export function ThemeProvider({ children, primaryColor = '#2563eb', ...props }: CustomThemeProviderProps) {
  React.useEffect(() => {
    // Cập nhật giá trị thẻ màu của Tailwind UI (thay đổi biến var(--primary) để Tailwind sử dụng được)
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
  }, [primaryColor]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
