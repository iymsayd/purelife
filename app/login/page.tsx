'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface FirebaseError extends Error {
  code?: string;
}

const t = {
  loginTitle: "تسجيل الدخول",
  loginSubtitle: "أو",
  loginRegisterLink: "إنشاء حساب جديد إذا لم يكن لديك حساب",
  googleLogin: "تسجيل الدخول بواسطة Google",
  orEmail: "أو بالبيانات",
  identifierLabel: "البريد الإلكتروني أو اسم المستخدم",
  identifierPlaceholder: "name@example.com أو username",
  passwordLabel: "كلمة المرور",
  forgotPassword: "نسيت كلمة المرور؟",
  loginButton: "تسجيل الدخول",
  loggingIn: "جاري التحقق وتسجيل الدخول...",
  errorNotRegistered: "اسم المستخدم أو البريد الإلكتروني غير مسجل.",
  errorInvalidCred: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  errorGeneric: "حدث خطأ أثناء تسجيل الدخول، تأكد من صحة البيانات وحاول مرة أخرى.",
  errorGoogleRegistered: "هذا البريد الإلكتروني مسجل مسبقاً بطريقة أخرى.",
  errorGoogleFail: "حدث خطأ أثناء تسجيل الدخول باستخدام جوجل.",
  successLogin: "تم تسجيل الدخول بنجاح! جاري تحويلك إلى الصفحة الرئيسية...",
  successGoogle: "تم تسجيل الدخول بواسطة جوجل بنجاح! جاري تحويلك...",
  successReset: "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!",
  errorResetFail: "فشل إرسال بريد الاستعادة، تأكد من صحة البريد الإلكتروني.",
  errorResetMissing: "يرجى كتابة البريد الإلكتروني في حقل (البريد أو اسم المستخدم) أولاً.",
  errorNotVerified: "حسابك غير مفعل! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب قبل الدخول.",
  errorBanned: "عذراً، تم حظر هذا الحساب من قبل الإدارة. يرجى التواصل معنا للمزيد من التفاصيل."
};

const tCountries: Record<string, string> = { 
  "egypt": "مصر", 
  "saudi": "السعودية", 
  "uae": "الإمارات" 
};

const tGovernorates: Record<string, string> = { 
  "cairo": "القاهرة", 
  "giza": "الجيزة", 
  "alexandria": "الإسكندرية"
};

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.isVerified === false) {
            await updateDoc(userDocRef, { isVerified: true });
          }
        } catch (err) {
          console.error("Auth state check error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setError(t.errorInvalidCred);
      return;
    }

    setLoading(true);

    try {
      let emailToUse = trimmedIdentifier;

      // إذا أدخل اسم مستخدم وليس إيميل، نبحث عنه في Firestore
      if (!emailToUse.includes('@')) {
        const usersQuery = query(
          collection(db, 'users'), 
          where('username', '==', emailToUse.toLowerCase())
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          setError(t.errorNotRegistered);
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        emailToUse = userData.email;
        
        if (userData.isBanned) {
          setError(t.errorBanned);
          setLoading(false);
          return;
        }

        if (!emailToUse) {
          setError(t.errorNotRegistered);
          setLoading(false);
          return;
        }
      }

      // تسجيل الدخول عبر فايربيس
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, trimmedPassword);
      const user = userCredential.user;

      // جلب بيانات المستخدم من قاعدة البيانات
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        
        if (userData?.isBanned === true) {
          await signOut(auth);
          setError(t.errorBanned);
          setLoading(false);
          return;
        }

        if (!user.emailVerified && userData?.isVerified === false) {
          await signOut(auth);
          setError(t.errorNotVerified);
          setLoading(false);
          return;
        }

        if (user.emailVerified && userData?.isVerified === false) {
          await updateDoc(userDocRef, { isVerified: true });
        }
      }

      setSuccessMsg(t.successLogin);
      setTimeout(() => {
        router.push('/');
      }, 1200);

    } catch (err: unknown) {
      console.error("Login Error details:", err);
      const firebaseErr = err as FirebaseError;
      if (
        firebaseErr.code === 'auth/user-not-found' || 
        firebaseErr.code === 'auth/wrong-password' || 
        firebaseErr.code === 'auth/invalid-credential' ||
        firebaseErr.code === 'auth/invalid-email' ||
        firebaseErr.code === 'auth/missing-password'
      ) {
        setError(t.errorInvalidCred);
      } else {
        setError(t.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData?.isBanned === true) {
          await signOut(auth);
          setError(t.errorBanned);
          setLoading(false);
          return;
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
          country: tCountries['egypt'] || 'مصر',
          governorate: tGovernorates['cairo'] || 'القاهرة',
          address: 'غير محدد',
          role: 'user',
          isBanned: false,
          isVerified: true, 
          createdAt: new Date()
        });
      }

      setSuccessMsg(t.successGoogle);
      setTimeout(() => {
        router.push('/');
      }, 1200);

    } catch (err: unknown) {
      console.error("Google Login Error:", err);
      setError(t.errorGoogleFail);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!identifier || !identifier.includes('@')) {
      setError(t.errorResetMissing);
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, identifier.trim());
      setSuccessMsg(t.successReset);
      setError('');
    } catch (err) {
      console.error(err);
      setError(t.errorResetFail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-colors duration-300">
      <section className="max-w-md mx-auto bg-background text-foreground p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-sky-500/30 transition-all duration-300 relative overflow-hidden backdrop-blur-md">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-500 opacity-90"></div>

        <header className="text-center mb-8 space-y-4 pt-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-3xl bg-sky-500/10 text-sky-500 shadow-lg border border-sky-500/30">
              <LogIn size={40} strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {t.loginTitle}
            </h1>
            <p className="mt-2 text-sm text-foreground/80">
              {t.loginSubtitle}{' '}
              <Link href="/register" className="font-bold text-sky-500 hover:text-sky-600 transition-colors">
                {t.loginRegisterLink}
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
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border rounded-2xl shadow-sm text-sm font-bold text-foreground bg-secondary/20 hover:bg-secondary/45 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {t.googleLogin}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-foreground/60 text-xs font-semibold">{t.orEmail}</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">{t.identifierLabel}</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs"
              placeholder={t.identifierPlaceholder}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-foreground">{t.passwordLabel}</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-sky-500 hover:text-sky-600 focus:outline-none cursor-pointer"
              >
                {t.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-xs ps-4 pe-12"
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
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl hover:shadow-sky-500/30 cursor-pointer disabled:opacity-50"
          >
            {loading ? t.loggingIn : t.loginButton}
          </button>
        </form>

      </section>
    </main>
  );
}