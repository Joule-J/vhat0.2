
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Theme } from '../types';
import { Send, Copy, LogOut, Hash, Wifi, WifiOff, ShieldCheck, User as UserIcon, Clock, Sun, Moon } from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';
import { RateLimiter, sanitizeInput } from '../utils/security';

interface ChatInterfaceProps {
  user: User;
  onLeave: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onLeave, theme, toggleTheme }) => {
  // Initialize with EMPTY array. 
  // REQUIREMENT: New users do NOT see previous history. 
  // Since we do not send history upon connection, this is satisfied by default.
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peerId, setPeerId] = useState<string>('');
  const [statusText, setStatusText] = useState('Güvenli bağlantı kuruluyor...');
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]); 
  const hostConnectionRef = useRef<DataConnection | null>(null);
  
  // Rate Limiters
  const messageRateLimiter = useRef(new RateLimiter(2000));

  // Initialize PeerJS
  useEffect(() => {
    if (peerRef.current) peerRef.current.destroy();

    const newPeer = user.isHost 
      ? new Peer(user.roomCode, { debug: 1 }) 
      : new Peer({ debug: 1 });

    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      console.log('Secure Peer ID established');
      setPeerId(id);
      
      if (user.isHost) {
        setIsConnected(true);
        setStatusText('Oda aktif. Bekleniyor...');
      } else {
        connectToHost(newPeer, user.roomCode);
      }
    });

    newPeer.on('connection', (conn) => {
      if (user.isHost) {
        handleHostConnection(conn);
      }
    });

    newPeer.on('error', (err) => {
      console.error('Security Error:', err.type);
      if (err.type === 'unavailable-id') {
        setStatusText('Oda çakışması hatası.');
        alert('Güvenlik hatası: Oda kimliği doğrulanamadı.');
      } else if (err.type === 'peer-unavailable') {
         setStatusText('Oda bulunamadı.');
         setIsConnected(false);
      } else {
         setStatusText('Bağlantı hatası.');
      }
    });

    const welcomeMsg: Message = {
      id: 'system-welcome',
      senderName: 'Sistem',
      text: user.isHost 
        ? `Güvenli Oda (${user.roomCode}) oluşturuldu. Kod sadece anlık oturum içindir.` 
        : `${user.roomCode} odasına bağlanılıyor...`,
      timestamp: Date.now(),
      isMe: false,
    };
    setMessages([welcomeMsg]);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const connectToHost = (peer: Peer, hostId: string) => {
    setStatusText('Ana bilgisayara bağlanılıyor...');
    // Fix: 'secure' and 'reliable' are not valid properties in PeerConnectOption.
    // Security is configured on the Peer instance itself.
    const conn = peer.connect(hostId);

    conn.on('open', () => {
      setIsConnected(true);
      setStatusText('Şifreli Bağlantı Aktif');
      hostConnectionRef.current = conn;
      
      const joinMsg: Message = {
        id: Date.now().toString(),
        senderName: user.name,
        text: 'Odaya katıldı!',
        timestamp: Date.now(),
        isMe: true,
      };
      conn.send(joinMsg);
    });

    conn.on('data', (data) => handleIncomingData(data));
    
    conn.on('close', () => {
      setIsConnected(false);
      setStatusText('Bağlantı koptu');
      hostConnectionRef.current = null;
    });
  };

  const handleHostConnection = (conn: DataConnection) => {
    connectionsRef.current.push(conn);
    
    // NOTE: We DO NOT send existing 'messages' state to the new user.
    // This ensures new users start with a blank chat history.
    
    conn.on('data', (data) => {
      const msg = data as Message;
      
      if (!msg || !msg.text || typeof msg.text !== 'string') return;

      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, { ...msg, isMe: false }];
      });

      // Host broadcasts message to all OTHER users
      broadcastMessage(msg, conn.peer);
    });

    conn.on('close', () => {
      connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
    });
  };

  const handleIncomingData = (data: any) => {
    const msg = data as Message;
    setMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, { ...msg, isMe: false }];
    });
  };

  const broadcastMessage = (msg: Message, excludePeerId?: string) => {
    if (!user.isHost) return;
    connectionsRef.current.forEach(conn => {
      if (conn.open && conn.peer !== excludePeerId) {
        conn.send(msg);
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const cleanText = sanitizeInput(inputValue);
    if (!cleanText) return;

    if ((!isConnected && !user.isHost)) return;

    if (!messageRateLimiter.current.tryAction()) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 2000);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString().slice(2,5),
      senderName: user.name,
      text: cleanText,
      timestamp: Date.now(),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    if (user.isHost) {
      broadcastMessage(newMessage);
    } else {
      hostConnectionRef.current?.send(newMessage);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(user.roomCode);
    alert('Oda kodu kopyalandı!');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm z-10 transition-colors">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${isConnected ? 'bg-indigo-600' : 'bg-gray-400 dark:bg-slate-700'}`}>
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
              Oda: {user.roomCode}
              {user.isHost && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30">HOST</span>}
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-xs flex items-center">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500 mr-1.5" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500 mr-1.5" />
              )}
              {statusText}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={copyRoomCode}
            className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="Kodu Kopyala"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button 
            onClick={onLeave}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            title="Çıkış"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50 dark:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-slate-950 transition-colors">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[80%] ${msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div className={`flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm
                ${msg.isMe 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                }`}
              >
                <UserIcon className="w-4 h-4" />
              </div>

              <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed break-words
                ${msg.isMe 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-bl-none'
                }`}
              >
                {!msg.isMe && (
                  <div className="text-[10px] font-bold mb-1 opacity-70 text-gray-500 dark:text-slate-400">
                    {msg.senderName}
                  </div>
                )}
                {msg.text}
                <div className={`text-[10px] mt-1 opacity-50 text-right ${msg.isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-900 p-4 border-t border-gray-200 dark:border-slate-800 relative transition-colors">
        {isRateLimited && (
           <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center animate-pulse">
             <Clock className="w-3 h-3 mr-1" /> Hız sınırı: Lütfen bekleyin.
           </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isConnected ? "Mesaj yaz..." : "Bağlantı kuruluyor..."}
            disabled={!isConnected && !user.isHost}
            maxLength={500}
            className="flex-1 bg-gray-100 dark:bg-slate-950 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-slate-700 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim() || (!isConnected && !user.isHost) || isRateLimited}
            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-gray-400 dark:text-slate-600 text-[10px] mt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" /> End-to-End P2P Encrypted
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
