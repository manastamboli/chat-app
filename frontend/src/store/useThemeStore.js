import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: localStorage.getItem("scf-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("scf-theme", theme);
    set({ theme });
  },
}));

export { useThemeStore };
