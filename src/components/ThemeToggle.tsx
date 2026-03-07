import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg transition-all
                bg-slate-800 dark:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500
                dark:text-slate-400 dark:hover:text-white dark:border-slate-700 dark:hover:border-slate-500"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
            ) : (
                <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
            )}
        </button>
    );
};

export default ThemeToggle;
