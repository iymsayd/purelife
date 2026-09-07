'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserMessage } from '@/lib/messageService';

interface NavItem {
  name: string;
  category: string;
}

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState(false);
  const [initialUserData, setInitialUserData] = useState({ name: '', email: '' });

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '' 
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [footerData, setFooterData] = useState({
    title: "بيورلايف لحياة أفضل",
    description: "وكلاء معتمدون لجميع أجهزة التكييف<br />خبراء متخصصون في معالجة وتحلية المياة<br />موزعون لقطع غيار التكييفات وفلاتر المياة<br />مقايسات فنية وتركيبات وتجهيزات وصيانة لجميع أعمال التكييف والتبريد",
    email: "purelife2024a@gmail.com",
    phone: "011008903 (45 - 44 - 43 - 42 - 41 - 40)",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
  });

  const fetchFooterSettings = useCallback(async () => {
    try {
      const docRef = doc(db, 'settings', 'site_content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFooterData({
          title: data.footerTitle || "بيورلايف لحياة أفضل",
          description: data.footerDescription || "وكلاء معتمدون لجميع أجهزة التكييف<br />خبراء متخصصون في معالجة وتحلية المياة<br />موزعون لقطع غيار التكييفات وفلاتر المياة<br />مقايسات فنية وتركيبات وتجهيزات وصيانة لجميع أعمال التكييف والتبريد",
          email: data.footerEmail || "purelife2024a@gmail.com",
          phone: data.footerPhone || "011008903 (45 - 44 - 43 - 42 - 41 - 40)",
          facebook: data.facebook || "https://facebook.com",
          instagram: data.instagram || "https://instagram.com",
          twitter: data.twitter || "https://x.com",
          linkedin: data.linkedin || "https://linkedin.com",
        });
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    fetchFooterSettings();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setCurrentUserUid(user.uid);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          let fetchedName = user.displayName || '';
          let fetchedEmail = user.email || '';

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            fetchedName = userData.name || userData.fullname || user.displayName || '';
            fetchedEmail = userData.email || user.email || '';
          }

          setFormData(prev => ({
            ...prev,
            name: fetchedName,
            email: fetchedEmail
          }));
          setInitialUserData({ name: fetchedName, email: fetchedEmail });
        } catch (err) {
          console.error("Error fetching user profile data:", err);
        }
      } else {
        setCurrentUser(null);
        setCurrentUserUid(null);
      }
    });

    return () => unsubscribe();
  }, [fetchFooterSettings]);

  const validateField = useCallback((field: string, value: string, isUserLoggedIn: boolean) => {
    let error = '';
    if (field === 'name') {
      if (!value.trim()) error = 'الاسم مطلوب.';
      else if (value.trim().length < 3) error = 'الاسم يجب ألا يقل عن 3 أحرف.';
    } else if (field === 'email' && !isUserLoggedIn) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.trim() && !emailRegex.test(value)) error = 'البريد الإلكتروني غير صحيح.';
    } else if (field === 'message') {
      if (!value.trim()) error = 'الرسالة مطلوبة.';
      else if (value.trim().length < 3) error = 'يرجى كتابة رسالة صحيحة.';
    }
    setFormErrors(prev => ({ ...prev, [field]: error }));
    return error;
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email' && currentUser) return;

    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (currentUser) {
      if (field === 'name') {
        if (value !== initialUserData.name) {
          setProfileWarning(true);
        } else {
          setProfileWarning(false);
        }
      }
    }

    validateField(field, value, !!currentUser);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nameErr = validateField('name', formData.name, !!currentUser);
    const emailErr = !currentUser ? validateField('email', formData.email, !!currentUser) : '';
    const messageErr = validateField('message', formData.message, !!currentUser);

    if (nameErr || emailErr || messageErr) {
      alert("يرجى تصحيح الأخطاء الموجودة في الحقول قبل إرسال الرسالة.");
      return;
    }

    setLoading(true);

    try {
      const finalEmail = currentUser && currentUser.email ? currentUser.email : formData.email.trim();

      await saveUserMessage('footer_messages', {
        name: formData.name.trim(),
        email: finalEmail,
        message: formData.message.trim(),
        userId: currentUserUid ? currentUserUid : 'زائر (بدون حساب)'
      });

      if (currentUser && currentUserUid && formData.name.trim() !== initialUserData.name) {
        try {
          const userRef = doc(db, 'users', currentUserUid);
          await updateDoc(userRef, { 
            name: formData.name.trim(),
            updatedAt: new Date().toISOString()
          });
          setInitialUserData(prev => ({ ...prev, name: formData.name.trim() }));
        } catch (updateErr) {
          console.error("Error updating profile name:", updateErr);
        }
      }

      setSubmitted(true);
      setProfileWarning(false);
      setFormData({ 
        name: currentUser ? (initialUserData.name || currentUser.displayName || '') : '', 
        email: currentUser ? (initialUserData.email || currentUser.email || '') : '', 
        message: '' 
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting footer message:", error);
      alert("تعذر الاتصال بالخادم أو حفظ الرسالة، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const headingClass = "text-lg md:text-xl font-bold mb-4 text-white border-b-2 border-[#0ea5e9] pb-2 inline-block";
  const labelClass = "block text-xs font-bold text-gray-300 mb-1";
  const inputClass = "w-full p-2.5 rounded-xl bg-gray-900 text-white border border-gray-800 focus:border-[#0ea5e9] outline-none transition-all text-xs md:text-sm shadow-xs";

  if (!mounted) {
    return null;
  }

  const navItems: NavItem[] = [
    { name: "فلاتر مياه", category: "فلاتر" },
    { name: "تكييفات", category: "تكييفات" },
    { name: "قطع غيار تكييف", category: "قطع غيار تكييفات" },
    { name: "قطع غيار فلاتر", category: "قطع غيار فلاتر" }
  ];

  return (
    <footer dir="rtl" className="bg-black text-gray-200 py-12 mt-12 border-t border-gray-900 transition-colors duration-300 shadow-inner">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12 text-right">
          <section className="text-right">
            <h2 className={headingClass}>{footerData.title}</h2>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: footerData.description }} />
            <div className="flex flex-col gap-2.5 text-xs md:text-sm text-gray-400 mb-6 font-medium">
              <span className="flex items-center gap-2">📧 {footerData.email}</span>
              <span className="flex items-center gap-2" dir="ltr">📞 {footerData.phone}</span>
            </div>
            <div className="flex gap-4 text-gray-400">
              <a href={footerData.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-900 hover:bg-[#1877F2] hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
              <a href={footerData.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-900 hover:bg-gradient-to-tr hover:from-[#feda75] hover:via-[#fa7e1e] hover:to-[#d62976] hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
              <a href={footerData.twitter} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-900 hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-110 shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href={footerData.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-gray-900 hover:bg-[#0A66C2] hover:text-white transition-all duration-300 transform hover:scale-110 shadow-sm"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
            </div>
          </section>

          <nav className="text-right" aria-label="Footer Navigation">
            <h3 className={headingClass}>منتجات بيور لايف</h3>
            <ul className="space-y-3 text-gray-400 text-xs md:text-sm font-medium">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link href={`/products?category=${encodeURIComponent(item.category)}`} className="hover:text-[#0ea5e9] transition-colors duration-300 inline-block transform hover:translate-x-1">{item.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <section className="text-right">
            <h4 className={headingClass}>تواصل معنا</h4>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="footer-name" className={labelClass}>الاسم</label>
                <input 
                  id="footer-name" 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)} 
                  onBlur={() => validateField('name', formData.name, !!currentUser)}
                  className={`${inputClass} ${formErrors.name ? 'border-red-500' : ''}`} 
                  placeholder=" الاسم "
                />
                {formErrors.name && <span className="block text-[10px] text-red-400 mt-1 font-bold">{formErrors.name}</span>}
              </div>

              <div>
                <label htmlFor="footer-email" className={labelClass}>
                  البريد الالكتروني {currentUser && <span className="text-[10px] text-[#0ea5e9] font-normal">(مسجل بحسابك)</span>}
                </label>
                <input 
                  id="footer-email" 
                  type="email" 
                  required 
                  disabled={!!currentUser} 
                  value={formData.email} 
                  onChange={(e) => handleInputChange('email', e.target.value)} 
                  onBlur={() => !currentUser && validateField('email', formData.email, !!currentUser)}
                  className={`${inputClass} ${currentUser ? 'opacity-75 cursor-not-allowed bg-gray-800' : ''} ${formErrors.email ? 'border-red-500' : ''}`} 
                  placeholder="name@example.com"
                />
                {formErrors.email && <span className="block text-[10px] text-red-400 mt-1 font-bold">{formErrors.email}</span>}
              </div>

              {profileWarning && (
                <p className="text-amber-400 text-[11px] font-medium leading-tight">
                  تنبيه: أنت عدلت اسمك، سيتم تحديث حسابك الأساسي تلقائياً عند الإرسال.
                </p>
              )}

              <div>
                <label htmlFor="footer-message" className={labelClass}>الرسالة</label>
                <textarea 
                  id="footer-message" 
                  rows={2} 
                  required 
                  value={formData.message} 
                  onChange={(e) => handleInputChange('message', e.target.value)} 
                  onBlur={() => validateField('message', formData.message, !!currentUser)}
                  className={`${inputClass} resize-y min-h-[70px] max-h-[140px] ${formErrors.message ? 'border-red-500' : ''}`} 
                  placeholder="أكتب رسالتك أو استفسارك هنا..."
                />
                {formErrors.message && <span className="block text-[10px] text-red-400 mt-1 font-bold">{formErrors.message}</span>}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white transition-colors py-3 rounded-xl font-bold cursor-pointer mt-1 text-xs md:text-sm shadow-sm disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>

              {submitted && (<p className="text-emerald-400 text-xs font-semibold mt-1 text-center animate-pulse">تم إرسال رسالتك بنجاح!</p>)}
            </form>
          </section>
        </div>

        <div className="text-center text-gray-500 text-xs md:text-sm border-t border-gray-900 pt-8 space-y-4">
          <p>© {new Date().getFullYear()} بيورلايف - جميع الحقوق محفوظة</p>
          <div className="flex justify-center gap-6">
            <Link href="/quality-policy" className="hover:text-[#0ea5e9] transition-colors">سياسة الجودة</Link>
            <Link href="/privacy-policy" className="hover:text-[#0ea5e9] transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}