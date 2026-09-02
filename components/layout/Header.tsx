'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, AlertTriangle, IdCard } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("http://purelife-egy.com/Images/pure-logo.jpeg");
    
  const dropdownRef = useRef<HTMLLIElement>(null);
  const logoutModalRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'site_content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().logoUrl) {
        setLogoUrl(docSnap.data().logoUrl);
      }
    } catch (error) {
      console.error("Error fetching site logo:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    const fetchUserData = async (currentUser: User) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setDisplayName(userDoc.data().name);
        } else if (currentUser.displayName) {
          setDisplayName(currentUser.displayName);
        } else if (currentUser.email) {
          setDisplayName(currentUser.email.split('@')[0]);
        } else {
          setDisplayName('مستخدم');
        }
      } catch (error) {
        console.error("Error fetching user profile name:", error);
        setDisplayName(currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'مستخدم'));
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setDisplayName('');
      }
    });

    const handleProfileUpdate = () => {
      if (auth.currentUser) {
        fetchUserData(auth.currentUser);
      }
    };

    const handleSettingsUpdate = () => {
      fetchSiteSettings();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    window.addEventListener('siteSettingsUpdated', handleSettingsUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
      window.removeEventListener('siteSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleModalClickOutside = (event: MouseEvent) => {
      if (logoutModalRef.current && !logoutModalRef.current.contains(event.target as Node)) {
        setShowLogoutModal(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLogoutModal(false);
      }
    };

    if (showLogoutModal) {
      document.addEventListener('mousedown', handleModalClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogoutModal]);

  return (
    <header className="bg-[var(--background)] text-[var(--foreground)] border-b-2 border-gray-100 dark:border-gray-700/50 py-4 sticky top-0 z-40 transition-colors duration-300 shadow-sm">
      <div className="container mx-auto px-4">
        
        {/* Top Section */}
        <div className="flex flex-col items-center justify-center mb-4 relative gap-3">
          
          <div className="w-full flex items-center justify-between md:hidden px-2">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 text-xl cursor-pointer hover:text-[#0ea5e9] transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 w-full">
            
            <div className="flex items-center justify-center order-2 md:order-1">
              {isMounted && user ? (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs shadow-xs">
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-1 font-bold text-[#0ea5e9] hover:underline transition-all group"
                    title="Profile"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9] group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                      <IdCard size={12} />
                    </span>
                    <span className="max-w-[90px] md:max-w-[110px] truncate">مرحباً: {displayName || 'مستخدم'}</span>
                  </Link>
                  <button 
                    onClick={() => setShowLogoutModal(true)}
                    className="font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer px-1.5 py-0.5 bg-red-50 dark:bg-red-950/40 rounded text-[11px]"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              ) : isMounted ? (
                <Link 
                  href="/login" 
                  className="text-xs md:text-sm font-bold text-[#0ea5e9] bg-[#0ea5e9]/10 hover:bg-[#0ea5e9] hover:text-white transition-all px-3.5 py-1.5 rounded-lg border border-[#0ea5e9]/30 shadow-xs"
                >
                  تسجيل دخول
                </Link>
              ) : null}
            </div>

            <div className="flex justify-center items-center order-1 md:order-2 my-1 md:my-0 md:mx-3 min-h-[48px]">
              <Link href="/" className="inline-block">
                <img 
                  src={logoUrl} 
                  alt="PureLife Logo" 
                  className="w-28 md:w-32 h-auto object-contain transition-opacity duration-300"
                  loading="eager"
                />
              </Link>
            </div>

            <div className="flex items-center justify-center order-3 md:order-3">
              {isMounted && !user ? (
                <Link 
                  href="/register" 
                  className="text-xs md:text-sm font-bold bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition-all px-3.5 py-1.5 rounded-lg shadow-xs"
                >
                  انشاء حساب
                </Link>
              ) : null}
            </div>

          </div>

        </div>

        {/* Navigation */}
        <nav className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row justify-center items-center gap-3 md:gap-5 p-0 m-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 pt-3 md:pt-0`}>
          <ul className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-5 p-0 m-0 w-full">
            
            <li>
              <Link 
                href="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm md:text-base font-bold transition-colors duration-200 pb-1 border-b-2 block ${
                  isActive('/') ? 'text-[#0ea5e9] border-[#0ea5e9]' : 'border-transparent hover:text-[#0ea5e9]'
                }`}
              >
                الرئيسية
              </Link>
            </li>

            <li>
              <Link 
                href="/about" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-sm md:text-base font-bold transition-colors duration-200 pb-1 border-b-2 block ${
                  isActive('/about') ? 'text-[#0ea5e9] border-[#0ea5e9]' : 'border-transparent hover:text-[#0ea5e9]'
                }`}
              >
                عن بيورلايف
              </Link>
            </li>
            
            <li ref={dropdownRef} className="relative group w-full md:w-auto text-center">
              <div className="flex items-center justify-center gap-1 font-bold">
                <Link 
                  href="/products" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm md:text-base transition-colors duration-200 pb-1 border-b-2 ${
                    isActive('/products') ? 'text-[#0ea5e9] border-[#0ea5e9]' : 'border-transparent hover:text-[#0ea5e9]'
                  }`}
                >
                  المنتجات
                </Link>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Toggle Products Menu"
                  className="p-1 hover:text-[#0ea5e9] transition cursor-pointer"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <ul className={`${isDropdownOpen ? 'block' : 'hidden'} md:group-hover:block static md:absolute right-0 top-full mt-2 bg-[var(--background)] shadow-2xl rounded-xl p-2 w-full md:w-48 border border-gray-200 dark:border-gray-700 text-right z-50`}>
                {[
                  { name: 'فلاتر مياه', category: 'فلاتر' },
                  { name: 'تكييفات', category: 'تكييفات' },
                  { name: 'قطع غيار تكييف', category: 'قطع غيار تكييفات' },
                  { name: 'قطع غيار فلاتر', category: 'قطع غيار فلاتر' }
                ].map((item, i) => (
                  <li key={i}>
                    <Link 
                      href={`/products?category=${encodeURIComponent(item.category)}`} 
                      onClick={() => { setIsDropdownOpen(false); setIsMenuOpen(false); }}
                      className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium hover:text-[#0ea5e9] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {[
              { name: 'سوق المستعمل', path: '/used-products' },
              { name: 'العروض', path: '/offers' },
              { name: 'الاحداث', path: '/events' },
              { name: 'المدونة', path: '/blog' },
              { name: 'طلب صيانة', path: '/maintenance' },
              { name: 'الوظائف', path: '/jobs' },
              { name: 'تواصل معنا', path: '/contact' },
              { name: 'شكاوي ومقترحات', path: '/complaints' }
            ].map((link) => (
              <li key={link.path}>
                <Link 
                  href={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm md:text-base font-bold transition-colors duration-200 pb-1 border-b-2 block ${
                    isActive(link.path) ? 'text-[#0ea5e9] border-[#0ea5e9]' : 'border-transparent hover:text-[#0ea5e9]'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div 
            ref={logoutModalRef}
            className="bg-[var(--background)] text-[var(--foreground)] rounded-2xl shadow-2xl max-w-sm w-full p-6 text-right relative border border-gray-200 dark:border-gray-700"
          >
            <button 
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">تسجيل الخروج</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">هل أنت متأكد من رغبتك في تسجيل الخروج من الحساب؟</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                لا، بقاء
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
              >
                نعم، تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}