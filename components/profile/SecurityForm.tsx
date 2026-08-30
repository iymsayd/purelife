"use client";

import React, { useState, useEffect } from 'react';
import { User, EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface SecurityFormProps {
  user: User;
}

export const SecurityForm: React.FC<SecurityFormProps> = ({ user }) => {
  const [updating, setUpdating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    if (user) {
      // التحقق مما إذا كان موفر الخدمة الأساسي هو جوجل فقط ولم يتم إضافة كلمة مرور مسبقاً
      const providers = user.providerData.map(p => p.providerId);
      const hasPasswordProvider = providers.includes('password');
      const isOnlyGoogle = providers.includes('google.com') && !hasPasswordProvider;
      
      setIsGoogleUser(isOnlyGoogle);
    }
  }, [user]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (passwords.newPassword.length < 6) {
      setErrorMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setErrorMessage('كلمة المرور الجديدة غير متطابقة.');
      return;
    }

    if (!user || !user.email) {
      setErrorMessage('لا يوجد مستخدم مسجل دخول حالياً.');
      return;
    }

    setUpdating(true);
    try {
      if (isGoogleUser) {
        // محاولة ربط الحساب بكلمة مرور جديدة لأول مرة
        const credential = EmailAuthProvider.credential(user.email, passwords.newPassword);
        try {
          await linkWithCredential(user, credential);
        } catch (linkError: any) {
          // إذا كان البريد مرتبطاً بالفعل كمزود كلمة مرور مسبقاً، نقوم بتحديث كلمة المرور مباشرة
          if (linkError.code === 'auth/provider-already-linked' || linkError.code === 'auth/credential-already-in-use') {
            await updatePassword(user, passwords.newPassword);
          } else {
            throw linkError;
          }
        }
        
        setIsGoogleUser(false);
        setSuccessMessage('تم إنشاء وربط كلمة المرور بنجاح في النظام!');
      } else {
        // المستخدم العادي أو من لديه كلمة مرور مسبقاً: نطلب كلمة المرور الحالية ونحدثها
        const credential = EmailAuthProvider.credential(user.email, passwords.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwords.newPassword);
        setSuccessMessage('تم تغيير كلمة المرور بنجاح في النظام!');
      }

      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        setErrorMessage('كلمة المرور الحالية غير صحيحة. تأكد منها وحاول مرة أخرى.');
      } else if (error.code === 'auth/provider-already-linked' || error.code === 'auth/credential-already-in-use') {
        setErrorMessage('هذا البريد مرتبط بالفعل بطريقة تسجيل أخرى.');
      } else {
        setErrorMessage('حدث خطأ أثناء تحديث كلمة المرور، حاول مرة أخرى.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleForgotPassword = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!user || !user.email) {
      setErrorMessage('برجاء تسجيل الدخول أو التأكد من توفر البريد الإلكتروني لإرسال رابط الاستعادة.');
      return;
    }

    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMessage(`تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني (${user.email}). تفقد صندوق الوارد أو الرسائل غير المرغوب فيها.`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setErrorMessage('فشل إرسال رسالة الاستعادة، حاول لاحقاً.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-6 sm:p-10 transition-all duration-300">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">تغيير كلمة المرور والأمان</h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0ea5e9] whitespace-nowrap overflow-hidden text-ellipsis max-w-full mx-auto">
          {isGoogleUser 
            ? 'حسابك مسجل عبر Google. يمكنك تعيين كلمة مرور جديدة لحسابك مباشرة من هنا.' 
            : 'حافظ على أمان حسابك بتحديث كلمة المرور بشكل دوري أو استخدام خيارات الاستعادة الآمنة.'}
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-sm text-center font-semibold animate-fade-in">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm text-center font-semibold animate-fade-in">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePasswordUpdate} className="space-y-6">
        <div className={`grid grid-cols-1 ${isGoogleUser ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-6`}>
          {!isGoogleUser && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">كلمة المرور الحالية</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwords.confirmNewPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              required
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetting}
            className="text-xs sm:text-sm font-bold text-[#0ea5e9] hover:underline cursor-pointer disabled:opacity-50"
          >
            {resetting ? 'جاري إرسال رابط الاستعادة...' : 'نسيت كلمة المرور؟ إرسال رابط عبر البريد'}
          </button>

          <button
            type="submit"
            disabled={updating}
            className="w-full sm:w-auto sm:min-w-[240px] bg-[#0ea5e9] hover:bg-opacity-90 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#0ea5e9]/25 disabled:opacity-50 cursor-pointer active:scale-98 block text-center"
          >
            {updating ? 'جاري التحديث...' : isGoogleUser ? 'تعيين كلمة المرور' : 'تحديث كلمة المرور'}
          </button>
        </div>
      </form>
    </div>
  );
};