'use client';
import { useState, useEffect } from 'react';
import { FileText, UploadCloud, CheckCircle2, Loader2, Send, X, AlertCircle, Sparkles, Lock } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { saveUserMessage } from '@/lib/messageService';

interface JobsFormProps {
  initialContent?: any;
}

export default function JobsForm({ initialContent }: JobsFormProps) {
  const [mounted, setMounted] = useState(false);
  const [maxDate, setMaxDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [profileWarningMessage, setProfileWarningMessage] = useState<string | null>(null);
  const [warnedFields, setWarnedFields] = useState<{ [key: string]: boolean }>({});

  const [content, setContent] = useState(initialContent || {
    title: "وظائف بيورلايف",
    subtitle: "انضم إلى فريق عملنا، اترك بياناتك وسيرتك الذاتية وسنتواصل معك قريباً",
    fullnameLabel: "الاسم بالكامل",
    birthdateLabel: "تاريخ الميلاد",
    emailLabel: "البريد الإلكتروني",
    readOnlyNotice: "البريد الإلكتروني مسجل بحسابك ولا يمكن تعديله",
    emailOptional: "اختياري",
    addressLabel: "العنوان",
    phoneLabel: "رقم الهاتف",
    jobsTitle: "الوظيفة المطلوبة (يجب اختيار واحدة على الأقل)",
    cvLabel: "ارفع ملف الـ CV (اختياري)",
    cvPlaceholder: "اضغط لرفع الـ CV هنا (.pdf, .doc, .docx)",
    submitButton: "إرسال الطلب",
    submittingButton: "جاري الإرسال...",
    successMessage: "تم إرسال طلبك بنجاح! سنتواصل معك قريباً.",
    anotherMessageButton: "إرسال طلب آخر",
    validationError: "من فضلك، اختر وظيفة واحدة على الأقل للتقديم!",
    jobsList: {
      customerService: "خدمة عملاء",
      sales: "مبيعات",
      fieldMarketing: "تسويق خارجي",
      accounting: "حسابات",
      filterTechnician: "فني فلاتر",
      acTechnician: "فني تكييفات",
      filterAssistant: "مساعد فني فلاتر",
      acAssistant: "مساعد فني تكييفات",
      maintenanceTrainee: "متدرب صيانة وأعطال",
      driver: "سائق"
    }
  });

  const [userProfile, setUserProfile] = useState({
    isLoggedIn: false,
    fullname: '',
    phone: '',
    address: '',
    email: '',
    uid: '',
  });

  const [formData, setFormData] = useState({
    fullname: '',
    birthdate: '',
    email: '',
    address: '',
    phone: '',
    jobs: [] as string[],
    cvBase64: '',
    cvName: '',
  });

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const unsubscribeContent = onSnapshot(doc(db, 'site_content', 'jobs_page'), (docSnap) => {
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
          fullname: firestoreData.name || firestoreData.fullname || user.displayName || '',
          phone: firestoreData.phone || user.phoneNumber || '',
          address: firestoreData.address || '',
          email: user.email || firestoreData.email || '',
          uid: user.uid,
        };

        setUserProfile(profileData);
        setFormData((prev) => ({
          ...prev,
          fullname: profileData.fullname,
          phone: profileData.phone,
          address: profileData.address,
          email: profileData.email,
        }));
      } else {
        setUserProfile({ isLoggedIn: false, fullname: '', phone: '', address: '', email: '', uid: '' });
      }
    });

    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    setMaxDate(eighteenYearsAgo.toISOString().split('T')[0]);

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

    if (userProfile.isLoggedIn) {
      const originalValue = field === 'fullname' ? userProfile.fullname : field === 'address' ? userProfile.address : '';
      if (value !== originalValue && !warnedFields[field] && originalValue !== '') {
        setProfileWarningMessage('تنبيه: لقد قمت بتعديل هذا الحقل مقارنة ببيانات حسابك الشخصي (سيتم تحديث حسابك الأساسي تلقائياً عند إرسال الطلب).');
        setWarnedFields((prev) => ({ ...prev, [field]: true }));
      }
    }
  };

  const handleJobCheckboxCommand = (jobLabel: string) => {
    setFormData((prev) => {
      const exists = prev.jobs.includes(jobLabel);
      return {
        ...prev,
        jobs: exists ? prev.jobs.filter((j) => j !== jobLabel) : [...prev.jobs, jobLabel],
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        setModalMessage('عذراً، ملفات غير مدعومة. يرجى رفع السيرة الذاتية بصيغة PDF أو Word (.pdf, .doc, .docx) فقط.');
        e.target.value = '';
        setFileName('');
        return;
      }

      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData((prev) => ({
          ...prev,
          cvBase64: uploadEvent.target?.result as string || '',
          cvName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileName('');
    setFormData((prev) => ({ ...prev, cvBase64: '', cvName: '' }));
    const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (!mounted) return null;

  const jobsList = [
    { key: 'customerService', label: content?.jobsList?.customerService || 'خدمة عملاء' },
    { key: 'sales', label: content?.jobsList?.sales || 'مبيعات' },
    { key: 'fieldMarketing', label: content?.jobsList?.fieldMarketing || 'تسويق خارجي' },
    { key: 'accounting', label: content?.jobsList?.accounting || 'حسابات' },
    { key: 'filterTechnician', label: content?.jobsList?.filterTechnician || 'فني فلاتر' },
    { key: 'acTechnician', label: content?.jobsList?.acTechnician || 'فني تكييفات' },
    { key: 'filterAssistant', label: content?.jobsList?.filterAssistant || 'مساعد فني فلاتر' },
    { key: 'acAssistant', label: content?.jobsList?.acAssistant || 'مساعد فني تكييفات' },
    { key: 'maintenanceTrainee', label: content?.jobsList?.maintenanceTrainee || 'متدرب صيانة وأعطال' },
    { key: 'driver', label: content?.jobsList?.driver || 'سائق' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.jobs.length === 0) {
      setModalMessage(content?.validationError || 'من فضلك، اختر وظيفة واحدة على الأقل للتقديم!');
      return;
    }

    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);

      const finalEmail = userProfile.isLoggedIn && userProfile.email ? userProfile.email : formData.email;
      if (finalEmail) {
        data.set('email', finalEmail);
      }

      data.delete('jobs');
      formData.jobs.forEach((job) => data.append('jobs', job));

      if (formData.cvBase64) {
        data.set('cv_file_name', formData.cvName);
        data.set('cv_attachment', formData.cvBase64);
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!result.success) {
        setModalMessage(result.message || 'حدث خطأ أثناء الإرسال.');
        setIsSubmitting(false);
        return;
      }

      // هنا يتم الحفظ تلقائياً في كولكشن job_applications عبر دالة saveUserMessage
      await saveUserMessage('jobs', {
        title: `طلب توظيف: ${formData.jobs.join('، ')}`,
        name: formData.fullname,
        birthdate: formData.birthdate,
        email: finalEmail,
        address: formData.address,
        phone: formData.phone,
        jobs: formData.jobs,
        cvName: formData.cvName,
        cvBase64: formData.cvBase64,
        message: `الوظائف المتقدم لها: ${formData.jobs.join(', ')}`,
      }, userProfile.isLoggedIn ? userProfile.uid : null);

      if (userProfile.isLoggedIn) {
        try {
          const userDocRef = doc(db, 'users', userProfile.uid);
          await updateDoc(userDocRef, {
            name: formData.fullname,
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
      setFileName('');
      setFormData({ 
        fullname: userProfile.isLoggedIn ? userProfile.fullname : '', 
        birthdate: '', 
        email: userProfile.isLoggedIn ? userProfile.email : '', 
        address: userProfile.isLoggedIn ? userProfile.address : '', 
        phone: userProfile.isLoggedIn ? userProfile.phone : '', 
        jobs: [],
        cvBase64: '',
        cvName: '',
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
            <FileText size={44} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--secondary)] tracking-tight">{content?.title || 'وظائف بيورلايف'}</h1>
        {content?.subtitle && <p className="text-[var(--foreground)]/70 text-sm sm:text-base max-w-xl mx-auto">{content.subtitle}</p>}
      </header>

      <section className="max-w-2xl mx-auto bg-[var(--background)] text-[var(--foreground)] p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-[var(--border)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-90"></div>

        {isSubmitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center text-green-500 animate-bounce"><CheckCircle2 size={64} /></div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{content?.successMessage || 'تم إرسال طلبك بنجاح!'}</h2>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  fullname: userProfile.isLoggedIn ? userProfile.fullname : '',
                  birthdate: '',
                  email: userProfile.isLoggedIn ? userProfile.email : '',
                  address: userProfile.isLoggedIn ? userProfile.address : '',
                  phone: userProfile.isLoggedIn ? userProfile.phone : '',
                  jobs: [],
                  cvBase64: '',
                  cvName: '',
                });
                setWarnedFields({});
              }}
              className="mt-6 px-8 py-3.5 bg-[var(--secondary)] text-white rounded-xl font-bold hover:opacity-95 transition-all shadow-lg cursor-pointer"
            >
              {content?.anotherMessageButton || 'إرسال طلب آخر'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <input type="hidden" name="access_key" value="700a6c1a-aabe-4100-8d9d-e860e940a1e5" />
            <input type="hidden" name="subject" value="طلب توظيف جديد من الموقع الإلكتروني" />
            
            {userProfile.isLoggedIn && (
              <div className="p-4 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 flex items-start gap-3 text-sm text-[var(--foreground)]">
                <Sparkles size={20} className="text-[var(--secondary)] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  أهلاً بك! أي تعديل ستقوم به على بياناتك الشخصية (الاسم، الهاتف، العنوان) سيتم تحديثه تلقائياً في حسابك فور إرسال الطلب.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullname" className="block text-sm font-bold mb-2">{content?.fullnameLabel || 'الاسم بالكامل'}</label>
                <input 
                  name="fullname" 
                  id="fullname" 
                  type="text" 
                  required 
                  value={formData.fullname}
                  onChange={(e) => handleChange('fullname', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
              <div>
                <label htmlFor="birthdate" className="block text-sm font-bold mb-2">{content?.birthdateLabel || 'تاريخ الميلاد'}</label>
                <input 
                  name="birthdate" 
                  id="birthdate" 
                  type="date" 
                  max={maxDate} 
                  required 
                  value={formData.birthdate}
                  onChange={(e) => handleChange('birthdate', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label htmlFor="email" className="block text-sm font-bold">
                  {content?.emailLabel || 'البريد الإلكتروني'}
                  {!userProfile.isLoggedIn && (
                    <span className="text-[var(--foreground)]/60 font-normal text-xs ms-1.5">
                      ({content?.emailOptional || 'اختياري'})
                    </span>
                  )}
                </label>
                {userProfile.isLoggedIn && (
                  <span className="text-xs text-[var(--secondary)] flex items-center gap-1">
                    <Lock size={12} /> {content?.readOnlyNotice}
                  </span>
                )}
              </div>
              <input 
                name={!userProfile.isLoggedIn ? 'email' : undefined} 
                id="email" 
                type="email" 
                value={formData.email}
                disabled={userProfile.isLoggedIn}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full p-3.5 rounded-2xl border border-[var(--border)] outline-none transition-all ${
                  userProfile.isLoggedIn 
                    ? 'opacity-70 bg-[var(--secondary)]/5 cursor-not-allowed' 
                    : 'bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)]'
                }`} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="address" className="block text-sm font-bold mb-2">{content?.addressLabel || 'العنوان'}</label>
                <input 
                  name="address" 
                  id="address" 
                  type="text" 
                  required 
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold mb-2">{content?.phoneLabel || 'رقم الهاتف'}</label>
                <input 
                  name="phone" 
                  id="phone" 
                  type="tel" 
                  inputMode="numeric"
                  required 
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-3">{content?.jobsTitle || 'الوظيفة المطلوبة (يجب اختيار واحدة على الأقل)'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {jobsList.map((job) => (
                  <label key={job.key} className="flex items-center gap-3.5 bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)] cursor-pointer hover:border-[var(--secondary)] transition-all">
                    <input 
                      type="checkbox" 
                      name="jobs" 
                      value={job.label} 
                      checked={formData.jobs.includes(job.label)}
                      onChange={() => handleJobCheckboxCommand(job.label)}
                      className="accent-[var(--secondary)] w-5 h-5 rounded-md cursor-pointer" 
                    />
                    <span className="text-sm font-bold text-[var(--foreground)]">{job.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="cv-file-input" className="block text-sm font-bold mb-2">{content?.cvLabel || 'ارفع ملف الـ CV (اختياري)'}</label>
              <div className="relative border-2 border-dashed border-[var(--border)] hover:border-[var(--secondary)] rounded-2xl p-6 text-center bg-[var(--background)] transition-all">
                <input 
                  type="file" 
                  name="cv" 
                  id="cv-file-input" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <UploadCloud size={36} className="text-[var(--secondary)]" />
                  {fileName ? (
                    <div className="flex items-center gap-2 bg-[var(--secondary)]/10 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[var(--secondary)] font-semibold text-sm">
                      <span>{fileName}</span>
                      <button onClick={removeFile} className="hover:text-red-500 cursor-pointer"><X size={16} /></button>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--foreground)]/70">{content?.cvPlaceholder || 'اضغط لرفع الـ CV هنا (.pdf, .doc, .docx)'}</p>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[var(--secondary)] text-white py-4 rounded-2xl font-black text-lg transition-all hover:opacity-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>{content?.submittingButton || 'جاري الإرسال...'}</span>
                </>
              ) : (
                <>
                  <Send size={20} className="rtl:rotate-180" />
                  <span>{content?.submitButton || 'إرسال الطلب'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}