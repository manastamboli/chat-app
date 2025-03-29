import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("baatcheet-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("baatcheet-theme", theme);
    set({ theme });
  },
}));
