import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div className="app">
      {currentPage === 'landing' ? (
        <LandingPage onNavigateToLogin={() => setCurrentPage('login')} />
      ) : (
        <LoginPage onNavigateBack={() => setCurrentPage('landing')} />
      )}
    </div>
  );
}

export default App;
