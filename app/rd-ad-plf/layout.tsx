'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, LayoutDashboard, Package, ShoppingBag, MessageSquare, Newspaper, Users, Home, Info, SlidersHorizontal, Globe, Sun, Moon } from 'lucide-react';
import AdminAuthProvider from '@/components/ui/AdminAuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const navItems = [
    { href: '/rd-ad-plf', label: 'الرئيسية والإحصائيات', icon: LayoutDashboard },
    { href: '/rd-ad-plf/products', label: 'إدارة المنتجات', icon: Package },
    { href: '/rd-ad-plf/orders', label: 'إدارة طلبات الشراء', icon: ShoppingBag },
    { href: '/rd-ad-plf/posting', label: 'إدارة النشر', icon: Newspaper },
    { href: '/rd-ad-plf/messages', label: 'إدارة الرسائل', icon: MessageSquare },
    { href: '/rd-ad-plf/users', label: 'المستخدمين والأدوار', icon: Users },
    { href: '/rd-ad-plf/homepage', label: 'تعديل الرئيسية', icon: Home },
    { href: '/rd-ad-plf/about', label: 'تعديل من نحن', icon: Info },
    { href: '/rd-ad-plf/site-settings', label: 'إعدادات الهيدر والفوتر', icon: Globe },
  ];

  return (
    <AdminAuthProvider>
      <div className="admin-layout flex items-start min-h-screen bg-[var(--background)] text-[var(--foreground)] relative" dir="rtl">
        
        {/* زر الموبايل العائم فقط */}
        <div className="md:hidden fixed bottom-6 left-6 z-[100]">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X size={26} /> : <SlidersHorizontal size={24} />}
          </button>
        </div>

        {/* القائمة الجانبية */}
        <aside className={`fixed md:sticky top-0 h-screen w-64 bg-[var(--background)]/95 backdrop-blur-2xl border-l border-white/10 p-6 z-50 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} transition-transform duration-300 overflow-y-auto shrink-0 shadow-lg md:shadow-none flex flex-col justify-between`}>
          <div>
            {/* الهيدر جوه السايدبار مع زرار الدارك مود */}
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-xl font-black text-blue-600">لوحة التحكم</h2>
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-amber-400 shadow-sm hover:scale-105 transition-all cursor-pointer border border-white/10 flex items-center justify-center"
                title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold opacity-100' 
                        : 'text-[var(--foreground)] opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10 text-xs text-center opacity-60">
            Pure Life Dashboard &copy; 2026
          </div>
        </aside>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-8 min-h-screen overflow-y-auto w-full bg-[var(--background)]">
          {children}
        </main>
      </div>
    </AdminAuthProvider>
  );
}