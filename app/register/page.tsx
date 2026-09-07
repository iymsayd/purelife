'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, setDoc, doc, updateDoc } from 'firebase/firestore';
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
    orTraditional: "أو بالبيانات الشخصية",
    nameLabel: "الاسم بالكامل",
    namePlaceholder: "محمد أحمد",
    usernameLabel: "اسم المستخدم",
    usernamePlaceholder: "mohamed_123",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "name@example.com",
    phoneLabel: "رقم التليفون",
    phonePlaceholder: "01012345678",
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
    errorWeakPassword: "كلمة المرور ضعيفة جداً، يجب ألا تقل عن 6 أحرف.",
    errorInvalidName: "الرجاء إدخال اسم حقيقي صالح باللغة العربية أو الإنجليزية.",
    errorInvalidUsername: "اسم المستخدم يجب أن يتكون من حروف وأرقام إنجليزية وشرطة سفلية فقط (من 3 إلى 20 حرفاً).",
    errorInvalidPhone: "رقم الهاتف غير صالح.",
    errorGeneric: "حدث خطأ أثناء التسجيل، تأكد من صحة البيانات وحاول مرة أخرى.",
    successMsg: "تم إنشاء الحساب بنجاح! لقد أرسلنا رسالة تفعيل إلى بريدك الإلكتروني.",
    googleSuccess: "تم التسجيل بواسطة جوجل بنجاح! جاري تحويلك...",
    errorGoogleRegistered: "هذا البريد الإلكتروني مسجل مسبقاً بطريقة أخرى.",
    errorBanned: "عذراً، تم حظر هذا الحساب من قبل الإدارة."
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

const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzOxuYXKeA9B0yCF_k87NFXeUPqZmMtbbbTFRfDR5buwfqlQpoLsox_2cMiravSBPop/exec';

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0); 
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  
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
      if (user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (lockoutTime <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTime]);

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

  const sendDataToGoogleSheet = async (userData: { name: string; email: string; phone: string; address: string; clientType: string; isVerified: boolean; userId: string }) => {
    try {
      if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.includes('YOUR_GOOGLE')) return;
      await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName: "Sheet1",
          rowData: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            clientType: userData.clientType,
            isVerified: userData.isVerified,
            userId: userData.userId,
            createdAt: new Date().toLocaleString('ar-EG')
          }
        })
      });
    } catch (err) {
      console.error('Error logging to Google Sheets:', err);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (lockoutTime > 0) {
      setError(`الرجاء الانتظار ${lockoutTime} ثانية قبل إعادة المحاولة.`);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < 4000) {
      setError("الرجاء الانتظار قليلاً قبل المحاولة مرة أخرى.");
      return;
    }
    setLastSubmitTime(now);

    const trimmedName = formData.name.trim();
    const trimmedUsername = formData.username.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const countryName = tCountries[formData.country] || formData.country;
    const govName = tGovernorates[formData.governorate] || formData.governorate;
    const trimmedAddress = `${countryName} - ${govName} - ${formData.address.trim()}`;
    const trimmedPassword = formData.password.trim();

    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(trimmedName)) {
      setError(t.errorInvalidName);
      return;
    }

    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError(t.errorInvalidUsername);
      return;
    }

    if (trimmedPhone.length < 8 || trimmedPhone.length > 15) {
      setError(t.errorInvalidPhone);
      return;
    }

    if (formData.address.trim().length < 5) {
      setError("الرجاء إدخال عنوان تفصيلي صالح.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError(t.errorWeakPassword);
      return;
    }

    setLoading(true);

    try {
      const usernameQuery = query(collection(db, 'users'), where('username', '==', trimmedUsername));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        setError(t.errorUserTaken);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        phone: trimmedPhone,
        country: countryName,
        governorate: govName,
        address: formData.address.trim(),
        role: 'user',
        isBanned: false,
        isVerified: false,
        createdAt: new Date()
      });

      await sendDataToGoogleSheet({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: trimmedAddress,
        clientType: 'عادي (Sign Up)',
        isVerified: false,
        userId: user.uid
      });

      await sendEmailVerification(user);
      await signOut(auth);

      setSuccessMsg(t.successMsg);
      setTimeout(() => {
        router.push('/login');
      }, 4000);

    } catch (err: unknown) {
      console.error("Register Error:", err);
      const firebaseErr = err as FirebaseError;
      setLockoutTime(10); 

      if (firebaseErr.code === 'auth/email-already-in-use') {
        setError(t.errorEmailUsed);
      } else if (firebaseErr.code === 'auth/weak-password') {
        setError(t.errorWeakPassword);
      } else if (firebaseErr.code === 'auth/invalid-email') {
        setError("البريد الإلكتروني غير صالح.");
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError("تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً.");
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

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const countryName = tCountries['egypt'] || 'مصر';
      const govName = tGovernorates['cairo'] || 'القاهرة';
      const defaultAddress = 'مصر - القاهرة - غير محدد';

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData?.isBanned === true) {
          await signOut(auth);
          setError(t.errorBanned);
          setLoading(false);
          return;
        }
        if (!userData?.isVerified) {
          await updateDoc(userDocRef, { isVerified: true });
        }
      } else {
        const emailCheckQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const emailCheckSnap = await getDocs(emailCheckQuery);
        
        if (!emailCheckSnap.empty) {
          setError(t.errorGoogleRegistered);
          await signOut(auth);
          setLoading(false);
          return;
        }

        const baseUsername = user.email ? user.email.split('@')[0].toLowerCase() : 'user';
        
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'مستخدم جوجل',
          username: baseUsername,
          email: user.email || '',
          phone: user.phoneNumber || '',
          country: countryName,
          governorate: govName,
          address: 'غير محدد',
          role: 'user',
          isBanned: false,
          isVerified: true,
          createdAt: new Date()
        });

        await sendDataToGoogleSheet({
          name: user.displayName || 'مستخدم جوجل',
          email: user.email || '',
          phone: user.phoneNumber || 'غير متوفر',
          address: defaultAddress,
          clientType: 'Google (Sign Up)',
          isVerified: true,
          userId: user.uid
        });
      }

      setSuccessMsg(t.googleSuccess);
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (err: unknown) {
      console.error("Google Register Error:", err);
      setError('حدث خطأ أثناء التسجيل باستخدام جوجل.');
    } finally {
      setLoading(false);
    }
  };

  const currentGovernorateKeys = governoratesStructure[formData.country] || [];

  return (
    <main dir="rtl" className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <section className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-background text-foreground p-5 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-sky-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-md my-auto">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-500 opacity-90"></div>

        <header className="text-center mb-6 sm:mb-8 space-y-3 pt-2">
          <div className="flex justify-center">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-sky-500/10 text-sky-500 shadow-lg border border-sky-500/30">
              <UserPlus size={36} className="sm:w-10 sm:h-10" strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t.registerTitle}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {t.registerSubtitle}{' '}
              <Link href="/login" className="font-bold text-sky-500 hover:text-sky-600 transition-colors inline-block underline underline-offset-4">
                {t.registerLoginLink}
              </Link>
            </p>
          </div>
        </header>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/30 p-3.5 sm:p-4 text-xs sm:text-sm text-red-500 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 bg-green-500/10 border border-green-500/30 p-3.5 sm:p-4 text-xs sm:text-sm text-green-500 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading || lockoutTime > 0}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-3.5 px-4 border border-border rounded-2xl shadow-sm text-xs sm:text-sm font-bold text-foreground bg-secondary/20 hover:bg-secondary/45 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t.googleRegister}</span>
          </button>
        </div>

        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-foreground/60 text-xs font-semibold">{t.orTraditional}</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form className="space-y-4 sm:space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.nameLabel}</label>
            <input
              name="name"
              type="text"
              required
              maxLength={50}
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm"
              placeholder={t.namePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.usernameLabel}</label>
            <input
              name="username"
              type="text"
              required
              maxLength={20}
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm"
              placeholder={t.usernamePlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.emailLabel}</label>
            <input
              name="email"
              type="email"
              required
              maxLength={100}
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.phoneLabel}</label>
            <input
              name="phone"
              type="tel"
              required
              maxLength={15}
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm"
              placeholder={t.phonePlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.countryLabel}</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm cursor-pointer"
              >
                {countriesList.map((cKey) => (
                  <option key={cKey} value={cKey} className="bg-background text-foreground">
                    {tCountries[cKey]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.governorateLabel}</label>
              <select
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
                required
                className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm cursor-pointer"
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
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.addressLabel}</label>
            <input
              name="address"
              type="text"
              required
              maxLength={150}
              value={formData.address}
              onChange={handleChange}
              className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs font-medium text-xs sm:text-sm"
              placeholder={t.addressPlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-foreground mb-1.5 sm:mb-2">{t.passwordLabel}</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                maxLength={64}
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 sm:p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs ps-4 pe-12 font-medium text-xs sm:text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-4 flex items-center text-foreground/60 hover:text-foreground focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || lockoutTime > 0}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base transition-all duration-300 shadow-xl hover:shadow-sky-500/30 cursor-pointer disabled:opacity-50 mt-3"
          >
            {lockoutTime > 0 ? `انتظر ${lockoutTime} ثانية...` : loading ? t.registering : t.registerButton}
          </button>
        </form>

      </section>
    </main>
  );
}