'use client';
import { useState, useEffect } from 'react';
import { MessageSquareText, CheckCircle2, Loader2, Send, X, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { saveUserMessage } from '@/lib/messageService';

interface ComplaintsFormProps {
  initialContent?: any;
}

export default function ComplaintsForm({ initialContent }: ComplaintsFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const [content, setContent] = useState(initialContent || {
    title: "شكاوى ومقترحات",
    subtitle: "نحن نهتم برأيك، اترك رسالتك وسنعمل على تحسين خدماتنا من أجلك",
    nameLabel: "الاسم",
    phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني",
    readonlyNote: "البريد الإلكتروني مسجل بحسابك ولا يمكن تعديله",
    emailOptional: "اختياري",
    messageLabel: "نص الرسالة",
    submitButton: "إرسال الرسالة",
    submittingButton: "جاري الإرسال...",
    successMessage: "تم إرسال رسالتك بنجاح! شكراً لاهتمامك.",
    anotherMessageButton: "إرسال رسالة أخرى"
  });

  const [userProfile, setUserProfile] = useState({
    isLoggedIn: false,
    name: '',
    phone: '',
    email: '',
    uid: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    let isMounted = true;

    let unsubscribeContent: any = () => {};
    try {
      unsubscribeContent = onSnapshot(doc(db, 'site_content', 'complaints_page'), (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setContent((prev: any) => ({ ...prev, ...docSnap.data() }));
        }
      }, (error) => {
        console.warn("Skipped content snapshot due to permissions:", error);
      });
    } catch (e) {
      console.warn("Content listener error:", e);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      if (user) {
        let firestoreData: any = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && isMounted) {
            firestoreData = userDocSnap.data();
          }
        } catch (error) {
          console.warn("Error fetching user profile data due to rules.");
        }

        if (!isMounted) return;

        const profileData = {
          isLoggedIn: true,
          name: firestoreData.name || user.displayName || '',
          phone: firestoreData.phone || user.phoneNumber || '',
          email: user.email || firestoreData.email || '',
          uid: user.uid,
        };

        setUserProfile(profileData);
        setFormData((prev) => ({
          ...prev,
          name: profileData.name,
          phone: profileData.phone,
          email: profileData.email,
        }));
      } else if (isMounted) {
        setUserProfile({ isLoggedIn: false, name: '', phone: '', email: '', uid: '' });
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalMessage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      unsubscribeContent();
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    if (field === 'email' && userProfile.isLoggedIn) return;

    const sanitizedValue = value.replace(/<[^>]*>?/gm, '');

    if (field === 'phone') {
      const filteredPhone = sanitizedValue.replace(/[^\d\s+\-()]/g, '');
      setFormData((prev) => ({ ...prev, phone: filteredPhone }));
      if (userProfile.isLoggedIn) {
        setIsModified(filteredPhone !== userProfile.phone || formData.name !== userProfile.name);
      }
      return;
    }

    if (field === 'name') {
      setFormData((prev) => ({ ...prev, name: sanitizedValue }));
      if (userProfile.isLoggedIn) {
        setIsModified(sanitizedValue !== userProfile.name || formData.phone !== userProfile.phone);
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const lastSubmitTime = localStorage.getItem('last_complaint_time');
    const submitCount = parseInt(localStorage.getItem('complaints_count') || '0', 10);
    const now = Date.now();

    if (lastSubmitTime && now - parseInt(lastSubmitTime, 10) < 300000) {
      if (submitCount >= 2) {
        setModalMessage('عذراً، لقد تجاوزت الحد المسموح به من الرسائل. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.');
        return;
      }
    } else {
      localStorage.setItem('complaints_count', '1');
    }

    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const finalEmail = userProfile.isLoggedIn && userProfile.email ? userProfile.email : formData.email;
    if (finalEmail) {
      data.set('email', finalEmail);
    } else {
      data.delete('email');
    }

    try {
      const web3Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      const web3Result = await web3Response.json();

      if (!web3Result.success) {
        setModalMessage(web3Result.message || 'حدث خطأ أثناء الإرسال.');
        setIsSubmitting(false);
        return;
      }

      await saveUserMessage('complaints', {
        title: 'شكوى أو مقترح جديد',
        name: formData.name,
        phone: formData.phone,
        email: finalEmail || '',
        message: formData.message,
        userId: userProfile.isLoggedIn ? userProfile.uid : 'anonymous',
      });

      if (userProfile.isLoggedIn) {
        try {
          const userDocRef = doc(db, 'users', userProfile.uid);
          await updateDoc(userDocRef, {
            name: formData.name,
            phone: formData.phone,
            updatedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.warn("Bypassed profile sync due to Firestore rules.");
        }
      }

      localStorage.setItem('last_complaint_time', now.toString());
      localStorage.setItem('complaints_count', (submitCount + 1).toString());

      setIsSubmitted(true);
      form.reset();
      setFormData({
        name: userProfile.isLoggedIn ? userProfile.name : '',
        phone: userProfile.isLoggedIn ? userProfile.phone : '',
        email: userProfile.isLoggedIn ? userProfile.email : '',
        message: '',
      });
      setIsModified(false);
    } catch (error) {
      setModalMessage('حدث خطأ في الاتصال بالشبكة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-20 transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col justify-center">
      {modalMessage && (
        <div onClick={() => setModalMessage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 text-center">
            <button onClick={() => setModalMessage(null)} className="absolute top-4 start-4 p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] bg-[var(--secondary)]/20 rounded-full transition-colors cursor-pointer"><X size={18} /></button>
            <div className="flex justify-center text-amber-500 pt-2"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold">تنبيه هام</h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">{modalMessage}</p>
            <button onClick={() => setModalMessage(null)} className="w-full py-3 bg-[var(--secondary)] hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer mt-2">حسناً، فهمت</button>
          </div>
        </div>
      )}

      <header className="text-center mb-8 sm:mb-12 space-y-3">
        <div className="flex justify-center">
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--secondary)]/10 text-[var(--secondary)] transition-all duration-300 hover:scale-110 shadow-lg border border-[var(--border)]">
            <MessageSquareText size={38} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--secondary)] tracking-tight">{content?.title}</h1>
        {content?.subtitle && <p className="text-[var(--foreground)]/70 text-xs sm:text-base max-w-xl mx-auto px-2">{content.subtitle}</p>}
      </header>

      <section className="max-w-2xl w-full mx-auto bg-[var(--background)] text-[var(--foreground)] p-5 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-90"></div>

        {isSubmitted ? (
          <div className="text-center py-10 sm:py-12 space-y-4">
            <div className="flex justify-center text-green-500 animate-bounce"><CheckCircle2 size={56} /></div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{content?.successMessage}</h2>
            <button 
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  name: userProfile.isLoggedIn ? userProfile.name : '',
                  phone: userProfile.isLoggedIn ? userProfile.phone : '',
                  email: userProfile.isLoggedIn ? userProfile.email : '',
                  message: '',
                });
                setIsModified(false);
              }} 
              className="mt-4 px-6 sm:px-8 py-3.5 bg-[var(--secondary)] text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-lg cursor-pointer text-sm sm:text-base"
            >
              {content?.anotherMessageButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pt-2">
            <input type="hidden" name="access_key" value="f88cf807-1f07-4e2d-8535-dc358db28d57" />
            <input type="hidden" name="subject" value="شكوى أو مقترح جديد من الموقع الإلكتروني" />
            
            {userProfile.isLoggedIn && (
              <input type="hidden" name="email" value={formData.email} />
            )}
            
            {userProfile.isLoggedIn && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/25 flex items-start gap-3 text-xs sm:text-sm text-[var(--foreground)]">
                <Sparkles size={18} className="text-[var(--secondary)] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    أهلاً بك! بما أنك مسجل الدخول، أي تعديل ستقوم به على بياناتك (الاسم، الهاتف، أو العنوان) سيتم تحديثه تلقائياً في حسابك الشخصي فور إرسال هذه الرسالة.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2">{content?.nameLabel}</label>
                <input 
                  name="name" 
                  type="text" 
                  required 
                  minLength={3}
                  maxLength={50}
                  pattern="[\u0600-\u06FFa-zA-Z\s]+" 
                  title="يرجى إدخال حروف صحيحة فقط بدون رموز أو أكواد"
                  value={formData.name} 
                  onChange={(e) => handleChange('name', e.target.value)} 
                  className="w-full p-3 sm:p-3.5 text-sm sm:text-base rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2">{content?.phoneLabel}</label>
                <input 
                  name="phone" 
                  type="tel" 
                  required 
                  minLength={10}
                  maxLength={15}
                  value={formData.phone} 
                  onChange={(e) => handleChange('phone', e.target.value)} 
                  className="w-full p-3 sm:p-3.5 text-sm sm:text-base rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all text-left rtl:text-right" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-xs sm:text-sm font-bold">
                  {content?.emailLabel}
                  {!userProfile.isLoggedIn && (
                    <span className="text-[var(--foreground)]/60 font-normal text-xs ms-1.5">
                      ({content?.emailOptional || 'اختياري'})
                    </span>
                  )}
                </label>
                {userProfile.isLoggedIn && (
                  <span className="text-xs text-[var(--secondary)] flex items-center gap-1">
                    <Lock size={12} /> {content?.readonlyNote}
                  </span>
                )}
              </div>
              <input 
                name={!userProfile.isLoggedIn ? 'email' : undefined} 
                type="email" 
                value={formData.email} 
                disabled={userProfile.isLoggedIn} 
                required={false}
                onChange={(e) => handleChange('email', e.target.value)} 
                className={`w-full p-3 sm:p-3.5 text-sm sm:text-base rounded-2xl border border-[var(--border)] outline-none transition-all ${
                  userProfile.isLoggedIn 
                    ? 'opacity-70 bg-[var(--secondary)]/5 cursor-not-allowed' 
                    : 'bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)]'
                }`} 
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2">{content?.messageLabel}</label>
              <textarea 
                name="message" 
                rows={4} 
                required 
                minLength={10}
                maxLength={1000}
                value={formData.message} 
                onChange={(e) => handleChange('message', e.target.value)} 
                className="w-full p-3 sm:p-3.5 text-sm sm:text-base rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all resize-none"
              ></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[var(--secondary)] text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all hover:opacity-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 shadow-lg">
              {isSubmitting ? <><Loader2 className="animate-spin" size={22} /> {content?.submittingButton}</> : <><Send size={18} className="rtl:rotate-180" /> {content?.submitButton}</>}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}