'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, setDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';

interface FirebaseError extends Error {
  code?: string;
}

const governoratesStructure: { [key: string]: string[] } = {
  'egypt': [
    'cairo', 'giza', 'alexandria', 'dakahlia', 'sharqia', 'menofia', 
    'qalyubia', 'gharbia', 'beheira', 'kafr_el_sheikh', 'fayoum', 'beni_suef', 
    'minya', 'assiut', 'sohag', 'qena', 'aswan', 'luxor', 'red_sea', 
    'matrouh', 'new_valley', 'suez', 'ismailia', 'port_said', 'damietta', 
    'north_sinai', 'south_sinai'
  ],
  'saudi': [
    'riyadh', 'makkah', 'madinah', 'eastern_prov', 'qassim', 
    'asir', 'tabuk', 'hail', 'northern_borders', 'jazan', 'najran', 'baha', 'jouf'
  ],
  'uae': [
    'abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah'
  ]
};

const countriesList = ['egypt', 'saudi', 'uae'];

const t = {
    registerTitle: "إنشاء حساب جديد",
    registerSubtitle: "أو",
    registerLoginLink: "سجل الدخول إذا كان لديك حساب بالفعل",
    googleRegister: "التسجيل بواسطة Google",
    orTraditional: "أو بالبيانات ",
    nameLabel: "الاسم بالكامل",
    namePlaceholder: "محمد أحمد",
    usernameLabel: "اسم المستخدم",
    usernamePlaceholder: "mohamed_123",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "name@example.com",
    phoneLabel: "رقم التليفون",
    phonePlaceholder: "0",
    countryLabel: "الدولة",
    governorateLabel: "المحافظة / المنطقة",
    selectGovernorate: "اختر المحافظة",
    addressLabel: "العنوان التفصيلي",
    addressPlaceholder: "الشارع، رقم الحي، العلامة المميزة",
    passwordLabel: "كلمة المرور",
    registerButton: "تسجيل حساب جديد",
    registering: "جاري إنشاء الحساب وإرسال التفعيل...",
    errorUserTaken: "اسم المستخدم هذا مستخدم من قبل، اختر اسمًا آخر.",
    errorEmailUsed: "البريد الإلكتروني مستخدم بالفعل، يرجى تسجيل الدخول أو استخدام بريد آخر.",
    errorWeakPassword: "كلمة المرور ضعيفة جداً، يجب أن تكون 6 أحرف على الأقل.",
    errorGeneric: "حدث خطأ أثناء التسجيل، حاول مرة أخرى.",
    successMsg: "تم إنشاء الحساب بنجاح! لقد أرسلنا رسالة تفعيل إلى بريدك الإلكتروني.",
    googleSuccess: "تم التسجيل بواسطة جوجل بنجاح! جاري تحويلك..."
};

const tCountries: Record<string, string> = { 
  "egypt": "مصر", 
  "saudi": "السعودية", 
  "uae": "الإمارات" 
};

const tGovernorates: Record<string, string> = { 
  "cairo": "القاهرة", "giza": "الجيزة", "alexandria": "الإسكندرية", "dakahlia": "الدقهلية", "sharqia": "الشرقية", "menofia": "المنوفية", "qalyubia": "القليوبية", "gharbia": "الغربية", "beheira": "البحيرة", "kafr_el_sheikh": "كفر الشيخ", "fayoum": "الفيوم", "beni_suef": "بني سويف", "minya": "المنيا", "assiut": "أسيوط", "sohag": "سوهاج", "qena": "قنا", "aswan": "أسوان", "luxor": "الأقصر", "red_sea": "البحر الأحمر", "matrouh": "مطروح", "new_valley": "الوادي الجديد", "suez": "السويس", "ismailia": "الإسماعيلية", "port_said": "بورسعيد", "damietta": "دمياط", "north_sinai": "شمال سيناء", "south_sinai": "جنوب سيناء", 
  "riyadh": "الرياض", "makkah": "مكة المكرمة", "madinah": "المدينة المنورة", "eastern_prov": "الشرقية", "qassim": "القصيم", "asir": "عسير", "tabuk": "تبوك", "hail": "حائل", "northern_borders": "المنطقة الشمالية", "jazan": "جازان", "najran": "نجران", "baha": "الباحة", "jouf": "الجوف", 
  "abu_dhabi": "أبو ظبي", "dubai": "دبي", "sharjah": "الشارقة", "ajman": "عجمان", "umm_al_quwain": "أم القيوين", "ras_al_khaimah": "راس الخيمة", "fujairah": "الفجيرة" 
};

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    country: 'egypt',
    governorate: 'cairo',
    address: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // تم إلغاء إعادة التوجيه التلقائي هنا لمنع تعارض صفحة التسجيل مع حساب جوجل المفعّل مسبقاً
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') {
      const defaultGovKeys = governoratesStructure[value] || [];
      const defaultGov = defaultGovKeys[0] || '';
      setFormData({ ...formData, country: value, governorate: defaultGov });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const trimmedUsername = formData.username.trim().toLowerCase();
      const trimmedPhone = formData.phone.trim();
      const trimmedEmail = formData.email.trim().toLowerCase();

      const usernameQuery = query(collection(db, 'users'), where('username', '==', trimmedUsername));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        setError(t.errorUserTaken);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        trimmedEmail, 
        formData.password
      );
      const user = userCredential.user;

      const countryName = tCountries[formData.country] || formData.country;
      const govName = tGovernorates[formData.governorate] || formData.governorate;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        username: trimmedUsername,
        email: trimmedEmail,
        phone: trimmedPhone,
        country: countryName,
        governorate: govName,
        address: formData.address,
        role: 'user',
        isBanned: false,
        isVerified: false,
        createdAt: new Date()
      });

      await sendEmailVerification(user);
      await signOut(auth);

      setSuccessMsg(t.successMsg);
      setTimeout(() => {
        router.push('/login');
      }, 4000);

    } catch (err: unknown) {
      console.error(err);
      const firebaseErr = err as FirebaseError;
      if (firebaseErr.code === 'auth/email-already-in-use') {
        setError(t.errorEmailUsed);
      } else if (firebaseErr.code === 'auth/weak-password') {
        setError(t.errorWeakPassword);
      } else if (firebaseErr.code === 'auth/invalid-email') {
        setError("البريد الإلكتروني غير صالح.");
      } else {
        setError(t.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // فحص وجود المستند مباشرة باستخدام getDoc بالـ UID (أسرع وأدق بكثير)
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // إذا لم يكن الحساب موجوداً في قاعدة البيانات من قبل، نقوم بإنشائه
      if (!userDocSnap.exists()) {
        const baseUsername = user.email ? user.email.split('@')[0].toLowerCase() : 'user';
        
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Google User',
          username: baseUsername,
          email: user.email || '',
          phone: user.phoneNumber || '',
          country: tCountries['egypt'] || 'مصر',
          governorate: tGovernorates['cairo'] || 'القاهرة',
          address: 'غير محدد',
          role: 'user',
          isBanned: false,
          isVerified: true, 
          createdAt: new Date()
        });
      }

      setSuccessMsg(t.googleSuccess);
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: unknown) {
      console.error(err);
      setError('حدث خطأ أثناء التسجيل باستخدام جوجل.');
    } finally {
      setLoading(false);
    }
  };

  const currentGovernorateKeys = governoratesStructure[formData.country] || [];

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300">
      <section className="max-w-lg mx-auto bg-background text-foreground p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-sky-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-md">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-500 opacity-90"></div>

        <header className="text-center mb-8 space-y-4 pt-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-3xl bg-sky-500/10 text-sky-500 shadow-lg border border-sky-500/30">
              <UserPlus size={40} strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t.registerTitle}
            </h1>
            <p className="mt-2 text-sm text-foreground">
              {t.registerSubtitle}{' '}
              <Link href="/login" className="font-bold text-sky-500 hover:text-sky-600 transition-colors">
                {t.registerLoginLink}
              </Link>
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-500 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 p-4 text-sm text-green-500 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-2xl shadow-sm text-sm font-bold text-foreground bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {t.googleRegister}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-foreground text-xs font-semibold">{t.orTraditional}</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form className="space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.nameLabel}</label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              placeholder={t.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.usernameLabel}</label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              placeholder={t.usernamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.emailLabel}</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.phoneLabel}</label>
            <input
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              placeholder={t.phonePlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">{t.countryLabel}</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              >
                {countriesList.map((cKey) => (
                  <option key={cKey} value={cKey} className="bg-background text-foreground">
                    {tCountries[cKey]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">{t.governorateLabel}</label>
              <select
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
                required
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              >
                <option value="" disabled className="text-foreground/60">{t.selectGovernorate}</option>
                {currentGovernorateKeys.map((govKey) => (
                  <option key={govKey} value={govKey} className="bg-background text-foreground">
                    {tGovernorates[govKey]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.addressLabel}</label>
            <input
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium"
              placeholder={t.addressPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.passwordLabel}</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/70 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs ps-4 pe-12 font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-4 flex items-center text-foreground hover:text-foreground/80 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl hover:shadow-sky-500/30 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? t.registering : t.registerButton}
          </button>
        </form>

      </section>
    </main>
  );
}