import { AppState } from "@pkg/models/app_state";
import { createContext } from "react";

export const AppContext = createContext<AppState | null>(null);
