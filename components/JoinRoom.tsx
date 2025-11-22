
import React, { useState } from 'react';
import { User, Theme } from '../types';
import { MessageSquare, Users, Plus, LogIn, ShieldCheck, Sun, Moon } from 'lucide-react';
import { generateSecureRoomCode, sanitizeInput } from '../utils/security';

interface JoinRoomProps {
  onJoin: (user: User) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(name);
    if (!cleanName) return;

    setIsLoading(true);
    const newCode = generateSecureRoomCode();
    
    setTimeout(() => {
      onJoin({ 
        name: cleanName, 
        roomCode: newCode,
        isHost: true 
      });
      setIsLoading(false);
    }, 800);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(name);
    const cleanCode = sanitizeInput(roomCode).toUpperCase();

    if (!cleanName || !cleanCode) return;

    if (cleanCode.replace('-', '').length < 4) {
      alert("Geçersiz oda kodu formatı.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onJoin({ 
        name: cleanName, 
        roomCode: cleanCode,
        isHost: false
      });
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
      
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-4 left-4 p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors z-50"
        title="Temayı Değiştir"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Security Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-500/20">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs font-medium">Secure Connection</span>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 transition-colors duration-300">
        
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Kodla Sohbet</h1>
        <p className="text-gray-500 dark:text-slate-400 text-center mb-6 text-sm">
          Uçtan uca şifreli (P2P) güvenli sohbet odası.
        </p>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6 transition-colors">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'create' 
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Oda Oluştur
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'join' 
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Odaya Katıl
          </button>
        </div>

        {/* Form */}
        <form onSubmit={activeTab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all"
                placeholder="Adın nedir?"
                required
              />
            </div>
          </div>

          {activeTab === 'join' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Oda Kodu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  maxLength={12}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all uppercase tracking-wider"
                  placeholder="Örn: K9XP-M2R4"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'create' && (
             <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                Oluştur butonuna bastığında kriptografik olarak güvenli bir oda kodu verilecek.
             </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all
              ${activeTab === 'create' 
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isLoading 
              ? 'İşleniyor...' 
              : activeTab === 'create' ? 'Güvenli Oda Oluştur' : 'Odaya Katıl'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-200 dark:border-slate-800 pt-4">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Bu sohbet geçmişi sunucularda saklanmaz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
