'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { URLInputPage } from '@/components/URLInputPage';
import { ResultsPage } from '@/components/ResultsPage';
import { Header } from '@/components/Header';

export default function Home() {
  const dispatch = useDispatch();
  const { currentPage } = useSelector((state: RootState) => state.ui);

  const handleNewAnalysis = () => {
    dispatch(setCurrentPage('input'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onNewAnalysis={handleNewAnalysis} />
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'input' ? (
          <URLInputPage />
        ) : (
          <ResultsPage />
        )}
      </main>
    </div>
  );
}
