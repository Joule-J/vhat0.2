import React, { useState, useEffect } from 'react';
import JoinRoom from './components/JoinRoom';
import ChatInterface from './components/ChatInterface';
import { User, Theme } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // Sistem tercihine göre varsayılan tema veya 'dark'
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Sayfa kök elementine dark class'ını ekle/çıkar
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleJoin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLeave = () => {
    setUser(null);
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {!user ? (
        <JoinRoom onJoin={handleJoin} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <ChatInterface user={user} onLeave={handleLeave} theme={theme} toggleTheme={toggleTheme} />
      )}
    </div>
  );
};

export default App;