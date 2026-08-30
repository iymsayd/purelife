'use client';
import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle2, Loader2, X, AlertCircle, Lock, Info } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserMessage } from '@/lib/messageService';

export default function ContactClient() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // اللينكات المباشرة لجوجل ماب
  const mahallatMarhumMapUrl = "https://www.google.com/maps/place/%D8%B4%D8%B1%D9%83%D8%A9+%D8%A8%D9%8A%D9%88%D8%B1%D9%84%D8%A7%D9%8A%D9%81+%D9%84%D9%84%D8%AA%D9%83%D9%8A%D9%8A%D9%81%D8%A7%D8%AA+%D9%88%D9%81%D9%84%D8%A7%D8%B1+%D8%A7%D9%8لل%D9%85%D9%8A%D8%A7%D8%B7%E2%80%AD/@30.7991156,30.9641935,17z/data=!3m1!4b1!4m6!3m5!1s0x14f7cbc10ca08457:0xf9b8e1fc23752b8f!8m2!3d30.7991156!4d30.9641935!16s%2Fg%2F11nymh5jr2?entry=ttu&g_ep=EgoyMDI2MDgxNi4wIKXMDSoASAFQAw%3D%3D";
  const tantaMapUrl = "https://www.google.com/maps/search/%D8%AD%D9%8ي+%D8%A3%D9%88%D9%84+%D8%B7%D9%86%D8%B7%D8%A7+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%8لل%D9%81%D8%A7%D8%AA%D8%AD+%D8%A8%D8%B1%D8%AC+%D8%A7%D9%8لل%D8%acc%D8%A7%D9%85%D8%B9%D9%8A%D9%86+%D8%A8%D8%جو%D8%A7%D8%B1+%D8%A8%D9%86%D9%83+%D9%85%D8%B5%D8%B5%E2%80%AD/@30.7929722,30.9905756,17z?entry=s&sa=X&ved=1t%3A199789";

  const [content, setContent] = useState({
    title: "تواصل معنا",
    subtitle: "نحن هنا لمساعدتك والرد على كافة استفساراتك ومقترحاتك",
    nameLabel: "الاسم",
    phoneLabel: "رقم الهاتف",
    subjectLabel: "الموضوع",
    messageLabel: "الرسالة",
    readonlyNote: "البريد الإلكتروني مسجل بحسابك ولا يمكن تعديله",
    addressLabel: "العنوان",
    emailLabel: "البريد الإلكتروني",
    emailOptional: "اختياري",
    submitButton: "إرسال الرسالة",
    submittingButton: "جاري الإرسال...",
    successMessage: "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.",
    anotherMessageButton: "إرسال رسالة أخرى",
    branchesTitle: "فروعنا ومواقعنا",
    viewMapButton: "اضغط للفتح على خرائط جوجل",
    tantaBranchName: "طنطا",
    tantaAddress: "حي أول طنطا شارع الفاتح برج الجامعيين بجوار بنك مصر",
    mahallaBranchName: "محلة مرحوم",
    mahallaAddress: "ش جمال عبدالناصر - محلة مرحوم - طنطا - الغربية"
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
    address: '',
    email: '',
  });

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const unsubscribeContent = onSnapshot(doc(db, 'site_content', 'contact_page'), (docSnap) => {
      if (docSnap.exists()) {
        setContent((prev) => ({ ...prev, ...docSnap.data() }));
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUserUid(user.uid);
        
        let firestoreData: any = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            firestoreData = userDocSnap.data();
          }
        } catch (err) {
          console.error("Error fetching user profile data:", err);
        }

        setFormData((prev) => ({
          ...prev,
          name: user.displayName || firestoreData.name || prev.name,
          email: user.email || firestoreData.email || prev.email,
          phone: firestoreData.phone || user.phoneNumber || prev.phone,
          address: firestoreData.address || prev.address,
        }));
      } else {
        setIsLoggedIn(false);
        setCurrentUserUid(null);
        const savedForm = sessionStorage.getItem('contact_form_draft');
        if (savedForm) {
          try {
            const parsed = JSON.parse(savedForm);
            setFormData((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error(e);
          }
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalMessage(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeContent();
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    if (field === 'email' && isLoggedIn) return;

    if (field === 'phone') {
      const filteredPhone = value.replace(/[^\d\s+\-()]/g, '');
      const updated = { ...formData, phone: filteredPhone };
      setFormData(updated);
      if (!isLoggedIn) sessionStorage.setItem('contact_form_draft', JSON.stringify(updated));
      return;
    }

    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (!isLoggedIn) sessionStorage.setItem('contact_form_draft', JSON.stringify(updated));
  };

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const finalEmail = isLoggedIn && formData.email ? formData.email : (data.get('email') as string || '');
    if (finalEmail && !data.get('email')) {
      data.set('email', finalEmail);
    }

    try {
      // 1. إرسال البيانات لـ Web3Forms للإيميل الخارجي
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!result.success) {
        setModalMessage(result.message || 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.');
        setIsSubmitting(false);
        return;
      }

      // 2. حفظ الرسالة في الكولكشن الموحد باسم الحقول الصحيحة والمتوافقة تماماً مع الـ Dashboard
      await saveUserMessage('contact', {
        title: formData.subject || 'رسالة تواصل جديدة',
        name: formData.name,
        phone: formData.phone,
        email: finalEmail,
        address: formData.address,
        message: formData.message,
      }, isLoggedIn ? currentUserUid : null);

      // 3. تحديث بيانات البروفايل لو المستخدم مسجل دخول
      if (isLoggedIn && currentUserUid) {
        try {
          const userDocRef = doc(db, 'users', currentUserUid);
          await updateDoc(userDocRef, {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            updatedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
        }
      }

      setIsSubmitted(true);
      form.reset();
      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: '',
        ...(isLoggedIn ? {} : { name: '', phone: '', address: '', email: '' })
      }));
      if (!isLoggedIn) sessionStorage.removeItem('contact_form_draft');
    } catch (error) {
      console.error(error);
      setModalMessage('حدث خطأ في الاتصال بالشبكة أو تحديث البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)]">
      
      {modalMessage && (
        <div 
          onClick={() => setModalMessage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 text-center"
          >
            <button
              onClick={() => setModalMessage(null)}
              className="absolute top-4 start-4 p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] bg-[var(--secondary)]/20 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="flex justify-center text-amber-500 pt-2">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-xl font-bold">تنبيه هام</h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">{modalMessage}</p>
            <button
              onClick={() => setModalMessage(null)}
              className="w-full py-3 bg-[var(--secondary)] hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer mt-2"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      <header className="text-center mb-12 md:mb-16 space-y-4">
        <div className="flex justify-center">
          <div className="p-5 rounded-3xl bg-[var(--secondary)]/10 text-[var(--secondary)] transition-all duration-300 hover:scale-110 shadow-lg border border-[var(--border)]">
            <Mail size={44} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--secondary)] tracking-tight">
          {content?.title}
        </h1>
        {content?.subtitle && (
          <p className="text-[var(--foreground)]/70 text-sm sm:text-base max-w-xl mx-auto">
            {content.subtitle}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
        
        <section className="lg:col-span-5 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-4">
            {content?.branchesTitle}
          </h2>

          <a 
            href={tantaMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[var(--background)] p-6 sm:p-8 rounded-3xl border border-[var(--border)] space-y-4 transition-all hover:border-[var(--secondary)] shadow-lg group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--secondary)]">
                {content?.tantaBranchName}
              </h3>
            </div>
            <p className="flex items-start gap-3 text-[var(--foreground)]/80 text-sm sm:text-base leading-relaxed">
              <MapPin size={22} className="shrink-0 text-[var(--secondary)] mt-0.5" /> 
              <span>{content?.tantaAddress}</span>
            </p>
            <p className="flex items-center gap-3 text-[var(--foreground)]/80 text-sm sm:text-base font-medium" dir="ltr">
              <Phone size={20} className="text-[var(--secondary)]" /> 
              <span className="text-right">0403400130</span>
            </p>
            <span className="inline-block text-[var(--secondary)] font-bold text-sm sm:text-base underline underline-offset-4 pt-2">
              {content?.viewMapButton} ←
            </span>
          </a>

          <a 
            href={mahallatMarhumMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[var(--background)] p-6 sm:p-8 rounded-3xl border border-[var(--border)] space-y-4 transition-all hover:border-[var(--secondary)] shadow-lg group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--secondary)]">
                {content?.mahallaBranchName}
              </h3>
            </div>
            <p className="flex items-start gap-3 text-[var(--foreground)]/80 text-sm sm:text-base leading-relaxed">
              <MapPin size={22} className="shrink-0 text-[var(--secondary)] mt-0.5" /> 
              <span>{content?.mahallaAddress}</span>
            </p>
            <p className="flex items-center gap-3 text-[var(--foreground)]/80 text-sm sm:text-base font-medium" dir="ltr">
              <Phone size={20} className="text-[var(--secondary)]" /> 
              <span className="text-right">0403611126</span>
            </p>
            <span className="inline-block text-[var(--secondary)] font-bold text-sm sm:text-base underline underline-offset-4 pt-2">
              {content?.viewMapButton} ←
            </span>
          </a>
        </section>

        <section className="lg:col-span-7 bg-[var(--background)] text-[var(--foreground)] p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-90"></div>

          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center text-green-500 animate-bounce">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {content?.successMessage}
              </h2>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-6 px-8 py-3.5 bg-[var(--secondary)] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg cursor-pointer"
              >
                {content?.anotherMessageButton}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
              <input type="hidden" name="access_key" value="3e5400f1-1eef-42f3-85e4-b42fc416b850" />
              <input type="hidden" name="subject" value="رسالة جديدة من صفحة تواصل معنا" />
              
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

              {isLoggedIn && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/30 text-[var(--foreground)] text-xs sm:text-sm">
                  <Info size={20} className="text-[var(--secondary)] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    أهلاً بك! بما أنك مسجل الدخول، أي تعديل ستقوم به على بياناتك (الاسم، الهاتف، أو العنوان) سيتم تحديثه تلقائياً في حسابك الشخصي فور إرسال هذه الرسالة.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-[var(--foreground)]/90 mb-2">
                    {content?.nameLabel}
                  </label>
                  <input 
                    name="name" 
                    id="name" 
                    type="text" 
                    required 
                    autoComplete="name" 
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs" 
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-[var(--foreground)]/90 mb-2">
                    {content?.phoneLabel}
                  </label>
                  <input 
                    name="phone" 
                    id="phone" 
                    type="tel" 
                    inputMode="numeric"
                    required 
                    autoComplete="tel" 
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs" 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject_field" className="block text-sm font-bold text-[var(--foreground)]/90 mb-2">
                  {content?.subjectLabel}
                </label>
                <input 
                  name="subject" 
                  id="subject_field" 
                  type="text" 
                  required 
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="address" className="block text-sm font-bold text-[var(--foreground)]/90 mb-2">
                    {content?.addressLabel}
                  </label>
                  <input 
                    name="address" 
                    id="address" 
                    type="text" 
                    required 
                    autoComplete="street-address" 
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="email" className="block text-sm font-bold text-[var(--foreground)]/90">
                      {content?.emailLabel}
                    </label>
                    {isLoggedIn ? (
                      <span className="text-xs text-[var(--secondary)] font-medium flex items-center gap-1">
                        <Lock size={12} /> {content?.readonlyNote}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--foreground)]/40 font-normal">
                        ({content?.emailOptional})
                      </span>
                    )}
                  </div>
                  <input 
                    name="email" 
                    id="email" 
                    type="email" 
                    autoComplete="email" 
                    required={!isLoggedIn}
                    value={formData.email}
                    disabled={isLoggedIn}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs ${isLoggedIn ? 'opacity-70 cursor-not-allowed bg-[var(--secondary)]/5' : ''}`} 
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-bold text-[var(--foreground)]/90 mb-2">
                  {content?.messageLabel}
                </label>
                <textarea 
                  name="message" 
                  id="message" 
                  rows={4} 
                  required 
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[var(--secondary)] hover:opacity-95 text-white py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>{content?.submittingButton}</span>
                  </>
                ) : (
                  <>
                    <Send size={20} className="rtl:rotate-180" />
                    <span>{content?.submitButton}</span>
                  </>
                )}
              </button>
            </form>
          )}

        </section>

      </div>
    </main>
  );
}