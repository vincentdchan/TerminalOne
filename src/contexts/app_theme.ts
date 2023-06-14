import type { AppTheme } from "@pkg/models/app_theme";
import { createContext } from "react";

export const ThemeContext = createContext<AppTheme | null>(null);
