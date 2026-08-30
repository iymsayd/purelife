'use client';
import { useState, useEffect } from 'react';
import { MessageSquareText, CheckCircle2, Loader2, Send, X, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { saveUserMessage } from '@/lib/messageService'; // استدعاء الدالة الموحدة للحفظ

interface ComplaintsFormProps {
  initialContent?: any;
}

export default function ComplaintsForm({ initialContent }: ComplaintsFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [profileWarningMessage, setProfileWarningMessage] = useState<string | null>(null);
  const [warnedFields, setWarnedFields] = useState<{ [key: string]: boolean }>({});

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

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const unsubscribeContent = onSnapshot(doc(db, 'site_content', 'complaints_page'), (docSnap) => {
      if (docSnap.exists()) {
        setContent((prev: any) => ({ ...prev, ...docSnap.data() }));
      }
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let firestoreData: any = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            firestoreData = userDocSnap.data();
          }
        } catch (error) {
          console.error("Error fetching user profile data:", error);
        }

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
      } else {
        setUserProfile({ isLoggedIn: false, name: '', phone: '', email: '', uid: '' });
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalMessage(null);
        setProfileWarningMessage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeContent();
      unsubscribeAuth();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    if (field === 'email' && userProfile.isLoggedIn) return;

    if (field === 'phone') {
      const filteredPhone = value.replace(/[^\d\s+\-()]/g, '');
      setFormData((prev) => ({ ...prev, phone: filteredPhone }));

      if (userProfile.isLoggedIn && userProfile.phone) {
        if (filteredPhone !== userProfile.phone && !warnedFields['phone']) {
          setProfileWarningMessage('تنبيه: لقد قمت بتعديل رقم الهاتف مقارنة ببيانات حسابك الشخصي (سيتم تحديث حسابك الأساسي تلقائياً عند إرسال الطلب).');
          setWarnedFields((prev) => ({ ...prev, phone: true }));
        }
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (userProfile.isLoggedIn && field === 'name' && userProfile.name) {
      if (value !== userProfile.name && !warnedFields['name']) {
        setProfileWarningMessage('تنبيه: لقد قمت بتعديل الاسم مقارنة ببيانات حسابك الشخصي (سيتم تحديث حسابك الأساسي تلقائياً عند إرسال الطلب).');
        setWarnedFields((prev) => ({ ...prev, name: true }));
      }
    }
  };

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const finalEmail = userProfile.isLoggedIn && userProfile.email ? userProfile.email : formData.email;
    if (finalEmail) {
      data.set('email', finalEmail);
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

      // 1. حفظ الشكوى بالهيكل الموحد عبر saveUserMessage (توجيه تلقائي لكولكشن complaints)
      await saveUserMessage('complaints', {
        title: 'شكوى أو مقترح جديد',
        name: formData.name,
        phone: formData.phone,
        email: finalEmail || '',
        message: formData.message,
      }, userProfile.isLoggedIn ? userProfile.uid : null);

      // 2. تحديث البروفايل لو المستخدم مسجل وتم التعديل
      if (userProfile.isLoggedIn) {
        try {
          const userDocRef = doc(db, 'users', userProfile.uid);
          await updateDoc(userDocRef, {
            name: formData.name,
            phone: formData.phone,
            updatedAt: new Date().toISOString()
          });
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
        }
      }

      setIsSubmitted(true);
      form.reset();
      setFormData({
        name: userProfile.isLoggedIn ? userProfile.name : '',
        phone: userProfile.isLoggedIn ? userProfile.phone : '',
        email: userProfile.isLoggedIn ? userProfile.email : '',
        message: '',
      });
      setWarnedFields({});
    } catch (error) {
      setModalMessage('حدث خطأ في الاتصال بالشبكة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300 bg-[var(--background)] text-[var(--foreground)]">
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

      {profileWarningMessage && (
        <div onClick={() => setProfileWarningMessage(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] text-[var(--foreground)] border border-amber-500/40 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full relative space-y-4 text-center">
            <button onClick={() => setProfileWarningMessage(null)} className="absolute top-4 start-4 p-2 text-[var(--foreground)]/60 hover:text-[var(--foreground)] bg-[var(--secondary)]/20 rounded-full transition-colors cursor-pointer"><X size={18} /></button>
            <div className="flex justify-center text-amber-500 pt-2"><AlertCircle size={48} /></div>
            <h3 className="text-xl font-bold">تعديل البيانات</h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">{profileWarningMessage}</p>
            <button onClick={() => setProfileWarningMessage(null)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer mt-2">موافق، متابعة</button>
          </div>
        </div>
      )}

      <header className="text-center mb-12 md:mb-16 space-y-4">
        <div className="flex justify-center">
          <div className="p-5 rounded-3xl bg-[var(--secondary)]/10 text-[var(--secondary)] transition-all duration-300 hover:scale-110 shadow-lg border border-[var(--border)]">
            <MessageSquareText size={44} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--secondary)] tracking-tight">{content?.title}</h1>
        {content?.subtitle && <p className="text-[var(--foreground)]/70 text-sm sm:text-base max-w-xl mx-auto">{content.subtitle}</p>}
      </header>

      <section className="max-w-2xl mx-auto bg-[var(--background)] text-[var(--foreground)] p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-90"></div>

        {isSubmitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center text-green-500 animate-bounce"><CheckCircle2 size={64} /></div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{content?.successMessage}</h2>
            <button 
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  name: userProfile.isLoggedIn ? userProfile.name : '',
                  phone: userProfile.isLoggedIn ? userProfile.phone : '',
                  email: userProfile.isLoggedIn ? userProfile.email : '',
                  message: '',
                });
                setWarnedFields({});
              }} 
              className="mt-6 px-8 py-3.5 bg-[var(--secondary)] text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-lg cursor-pointer"
            >
              {content?.anotherMessageButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <input type="hidden" name="access_key" value="f88cf807-1f07-4e2d-8535-dc358db28d57" />
            <input type="hidden" name="subject" value="شكوى أو مقترح جديد من الموقع الإلكتروني" />
            
            {userProfile.isLoggedIn && (
              <div className="p-4 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 flex items-start gap-3 text-sm text-[var(--foreground)]">
                <Sparkles size={20} className="text-[var(--secondary)] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  أهلاً بك! بما أنك مسجل الدخول، أي تعديل ستقوم به على بياناتك (الاسم، أو الهاتف) سيتم تحديثه تلقائياً في حسابك الشخصي فور إرسال هذا الطلب.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold mb-2">{content?.nameLabel}</label>
                <input name="name" type="text" required value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{content?.phoneLabel}</label>
                <input name="phone" type="tel" required value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-sm font-bold">
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
                required={!userProfile.isLoggedIn}
                onChange={(e) => handleChange('email', e.target.value)} 
                className={`w-full p-3.5 rounded-2xl border border-[var(--border)] outline-none transition-all ${
                  userProfile.isLoggedIn 
                    ? 'opacity-70 bg-[var(--secondary)]/5 cursor-not-allowed' 
                    : 'bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)]'
                }`} 
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">{content?.messageLabel}</label>
              <textarea name="message" rows={5} required value={formData.message} onChange={(e) => handleChange('message', e.target.value)} className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all resize-none"></textarea>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[var(--secondary)] text-white py-4 rounded-2xl font-black text-lg transition-all hover:opacity-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> {content?.submittingButton}</> : <><Send size={20} className="rtl:rotate-180" /> {content?.submitButton}</>}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}