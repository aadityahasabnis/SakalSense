'use client';

import { type JSX, type ReactNode } from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface IThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: IThemeProviderProps): JSX.Element => {
    return (
        <NextThemesProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
};
