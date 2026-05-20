"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const THEME_STORAGE_KEY = "homestay-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "system";
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(getStoredTheme());
  });

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const nextResolvedTheme = resolveTheme("system");
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => {
      const nextResolvedTheme = resolveTheme(nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    },
  }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

export type { ThemePreference };
