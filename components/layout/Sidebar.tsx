'use client';
import { useState, useEffect } from 'react';
import { Phone, Share2, Sun, Moon, Mail, MessageCircle, Menu, X } from 'lucide-react';

export default function Sidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // تثبيت الاتجاه دائمًا عربي (RTL)
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
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

  return (
    <>
      <aside className={`fixed left-1.5 md:left-3 top-1/2 -translate-y-1/2 z-50 ${isMobileOpen ? 'flex' : 'hidden'} md:flex flex-col gap-2 md:gap-3 p-1.5 md:p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-full border border-gray-200 dark:border-gray-700/80 transition-all`}>
        
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
          onClick={() => alert('جاري فتح الشات الذكي لمساعدتك يا رياد! 🚀')}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-blue-600 text-white font-bold text-xs md:text-sm rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer"
          aria-label="AI Chatbot"
        >
          AI
        </button>

        {/* 2. Contact Button */}
        <div className="group relative">
          <button 
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer border border-gray-200 dark:border-gray-700"
            aria-label="Contact Options"
          >
            <Phone size={20} className="md:w-[22px] md:h-[22px]" />
          </button>
          <div className="absolute left-12 md:left-14 top-0 w-60 md:w-64 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-3 border border-gray-200 dark:border-gray-700 hidden group-hover:flex flex-col gap-2.5 z-50">
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
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full hover:scale-110 transition-transform shadow-md cursor-pointer border border-gray-200 dark:border-gray-700"
            aria-label="Social Media Links"
          >
            <Share2 size={20} className="md:w-[22px] md:h-[22px]" />
          </button>
          <div className="absolute left-12 md:left-14 top-0 w-36 md:w-40 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-3 border border-gray-200 dark:border-gray-700 hidden group-hover:flex flex-col gap-1.5 z-50">
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
    </>
  );
}