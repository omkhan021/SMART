'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleDarkMode, setCurrentPage } from '@/store/slices/uiSlice';
import { Moon, Sun, BarChart3, Home } from 'lucide-react';
import { PLATFORMS } from '@/types';

interface HeaderProps {
  onNewAnalysis: () => void;
}

export function Header({ onNewAnalysis: _onNewAnalysis }: HeaderProps) {
  const dispatch = useDispatch();
  const { darkMode, currentPage } = useSelector((state: RootState) => state.ui);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  const handleNavigateToInput = () => {
    dispatch(setCurrentPage('input'));
  };

  const handleNavigateToResults = () => {
    dispatch(setCurrentPage('results'));
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sentiment Analyzer
              </h1>
            </div>
            
            {/* Platform Icons */}
            <div className="hidden md:flex items-center space-x-2 ml-8">
              {Object.values(PLATFORMS).map((platform) => (
                <div
                  key={platform.name}
                  className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white text-sm font-bold`}
                  title={platform.displayName}
                >
                  {platform.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <button
              onClick={handleNavigateToInput}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'input'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>New Analysis</span>
            </button>

            {currentPage === 'results' && (
              <button
                onClick={handleNavigateToResults}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Results</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={handleToggleDarkMode}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
