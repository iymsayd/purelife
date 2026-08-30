"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PersonalInfoFormProps {
  user: User;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ user }) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    country: 'مصر',
    governorate: '',
    address: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData({
              fullName: data.name || data.fullName || user.displayName || '',
              username: data.username || '',
              email: user.email || '',
              phone: data.phone || '',
              country: data.country || 'مصر',
              governorate: data.governorate || '',
              address: data.address || '',
            });
          } else {
            setFormData({
              fullName: user.displayName || '',
              username: '',
              email: user.email || '',
              phone: '',
              country: 'مصر',
              governorate: '',
              address: '',
            });
          }
        } catch (error) {
          console.error("Error fetching user data for profile:", error);
          setErrorMessage('فشل تحميل البيانات الشخصية.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const governoratesMap: { [key: string]: string[] } = {
    'مصر': ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية', 'كفر الشيخ', 'المنوفية', 'القليوبية'],
    'السعودية': ['الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية'],
    'الإمارات': ['دبي', 'أبو ظبي', 'الشارقة']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (!user) {
        throw new Error('لا يوجد مستخدم مسجل دخول حالياً.');
      }

      const userDocRef = doc(db, 'users', user.uid);
      
      // حفظ البيانات في Firestore مع الحفاظ على الحقول الأساسية
      await setDoc(userDocRef, {
        name: formData.fullName,
        fullName: formData.fullName,
        username: formData.username,
        email: user.email,
        phone: formData.phone,
        country: formData.country,
        governorate: formData.governorate,
        address: formData.address,
        updatedAt: new Date(),
      }, { merge: true });

      // إطلاق الحدث المخصص لتحديث السايدبار وباقي المكونات لحظياً
      window.dispatchEvent(new Event('userProfileUpdated'));
      setSuccessMessage('تم تحديث البيانات الشخصية وحفظها في قاعدة البيانات بنجاح!');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMessage('حدث خطأ أثناء حفظ التعديلات في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card text-card-foreground rounded-3xl shadow-sm border border-border/60 p-12 text-center transition-colors">
        <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-6 sm:p-10 transition-all duration-300">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">بيانات التوصيل والمعلومات الشخصية</h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0ea5e9] whitespace-nowrap overflow-hidden text-ellipsis max-w-full mx-auto">
          قم بتحديث عنوانك ورقم هاتفك بدقة لضمان سرعة وسهولة توصيل الطلبات الخاصة بك.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">الاسم بالكامل</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">اسم المستخدم (Username)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              placeholder="username"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">البريد الإلكتروني (غير قابل للتعديل)</label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full rounded-2xl border border-input/60 bg-muted/40 px-4 py-3.5 text-muted-foreground text-sm font-medium cursor-not-allowed transition-all shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              placeholder="01XXXXXXXXX"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">الدولة</label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value, governorate: '' })}
              className="w-full rounded-2xl border border-input bg-background text-foreground px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="مصر" className="bg-black text-white py-2">مصر</option>
              <option value="السعودية" className="bg-black text-white py-2">السعودية</option>
              <option value="الإمارات" className="bg-black text-white py-2">الإمارات</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">المحافظة</label>
            <select
              value={formData.governorate}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background text-foreground px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="" className="bg-black text-zinc-400 py-2">اختر المحافظة</option>
              {governoratesMap[formData.country]?.map((gov) => (
                <option key={gov} value={gov} className="bg-black text-white py-2">
                  {gov}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">العنوان التفصيلي</label>
          <textarea
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs resize-none"
            placeholder="الشارع، رقم المبنى، الطابق، العلامة المميزة..."
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto sm:min-w-[240px] bg-[#0ea5e9] hover:bg-opacity-90 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#0ea5e9]/25 disabled:opacity-50 cursor-pointer active:scale-98 mx-auto block text-center"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
};