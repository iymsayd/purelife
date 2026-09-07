'use client';
import { useState, useEffect, useRef } from 'react';
import { Phone, Share2, Sun, Moon, Mail, MessageCircle, Menu, X, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Sidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // حالات للتحكم في فتح وقوف القوائم بالضغط على الموبايل
  const [activeMenu, setActiveMenu] = useState<'contact' | 'social' | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك معك "بيورو" مساعد شركة بيورلايف. أقدر أساعدك بإيه النهاردة في الفلاتر ولا التكييفات؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  }, []);

  // إضافة دعم زر الـ Escape لإغلاق الشات أو القوائم المفتوحة
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChatOpen(false);
        setIsMobileOpen(false);
        setActiveMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (typeof window !== 'undefined') {
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'عذرا يوجد مشكلة بالسيرفر، حاول مرة أخرى.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'تأكد من اتصالك بالانترنت وحاول مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <aside className={`fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 ${isMobileOpen ? 'flex' : 'hidden'} md:flex flex-col gap-2 md:gap-3 p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-full border border-gray-200 dark:border-gray-700/80 transition-all`}>
        
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden w-10 h-10 flex items-center justify-center bg-red-600/90 text-white rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer mb-1 self-center"
          aria-label="Close Sidebar Menu"
        >
          <X size={18} />
        </button>

        {/* 1. AI Button */}
        <button 
          title="شات بوت" 
          onClick={() => {
            setIsChatOpen(true);
            setIsMobileOpen(false);
          }}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-600 text-white font-bold text-xs md:text-sm rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer"
          aria-label="AI Chatbot"
        >
          AI
        </button>

        {/* 2. Contact Button */}
        <div className="group relative">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'contact' ? null : 'contact')}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer border border-gray-200 dark:border-gray-700"
            aria-label="Contact Options"
          >
            <Phone size={20} className="md:w-[22px] md:h-[22px]" />
          </button>
          
          <div className={`absolute left-12 md:left-14 top-1/2 -translate-y-1/2 w-60 md:w-64 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-3 border border-gray-200 dark:border-gray-700 transition-all duration-200 flex flex-col gap-2.5 z-50 ${activeMenu === 'contact' ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto'}`}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
              طرق التواصل معنا:
            </span>
            
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs md:text-sm text-gray-900 dark:text-gray-100 font-medium">
              <Phone size={16} className="text-blue-500 shrink-0" />
              <span dir="ltr">011008903050</span>
            </div>

            <a 
              href="https://wa.me/2011008903050" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400 font-bold text-xs md:text-sm transition-colors"
            >
              <MessageCircle size={18} className="text-green-600 dark:text-green-400 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-[11px] md:text-xs text-gray-800 dark:text-gray-200 font-medium overflow-hidden">
              <Mail size={16} className="text-amber-500 shrink-0" />
              <span className="truncate">purelife2024a@gmail.com</span>
            </div>
          </div>
        </div>

        {/* 3. Social Media Button */}
        <div className="group relative">
          <button 
            onClick={() => setActiveMenu(activeMenu === 'social' ? null : 'social')}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer border border-gray-200 dark:border-gray-700"
            aria-label="Social Media Links"
          >
            <Share2 size={20} className="md:w-[22px] md:h-[22px]" />
          </button>
          
          <div className={`absolute left-12 md:left-14 top-1/2 -translate-y-1/2 w-36 md:w-40 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-3 border border-gray-200 dark:border-gray-700 transition-all duration-200 flex flex-col gap-1.5 z-50 ${activeMenu === 'social' ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto'}`}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
              تابعنا على:
            </span>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl text-blue-600 font-bold text-xs md:text-sm transition-colors">
              Facebook
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-pink-50 dark:hover:bg-gray-800 rounded-xl text-pink-600 font-bold text-xs md:text-sm transition-colors">
              Instagram
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-sky-50 dark:hover:bg-gray-800 rounded-xl text-sky-600 font-bold text-xs md:text-sm transition-colors">
              LinkedIn
            </a>
          </div>
        </div>

        {/* 4. Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          title={isDarkMode ? "الوضع الفاتح" : "الوضع المظلم"}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-amber-500 text-gray-900 font-black rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} className="md:w-[22px] md:h-[22px] text-white" /> : <Moon size={20} className="md:w-[22px] md:h-[22px] text-gray-900" />}
        </button>

      </aside>

      {/* Floating Toggle for Mobile */}
      {!isMobileOpen && (
        <div className="fixed md:hidden left-3 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-110 transition-transform"
            aria-label="Open Sidebar Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && (
        <div 
          onClick={() => setIsChatOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs md:items-end md:justify-start md:p-6" 
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-md md:w-[380px] h-[520px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            
            <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">خدمة عملاء PureLife</h3>
                  <span className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    متواجد للرد عليك
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-950/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tl-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tr-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5 max-w-[85%] ml-auto items-center">
                  <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs flex items-center gap-2 rounded-tr-none">
                    <Loader2 size={14} className="animate-spin text-sky-500" />
                    <span>بيورو بيطبع الرد...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل بيورو عن الفلاتر أو الصيانة..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-600 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Send size={16} />
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}