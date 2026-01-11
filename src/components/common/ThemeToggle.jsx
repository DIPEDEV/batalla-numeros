import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-3 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 border ${theme === 'dark' ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-orange-500 border-orange-100 hover:bg-orange-50'} ${className}`}
      title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
