'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface PersonalInfoFormProps {
  user: User;
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

// دالة مساعدة لتحويل الاسم العربي القديم إن وجد إلى مفتاح النظام الجديد
const getCountryKey = (countryVal: string) => {
  if (countryVal === 'السعودية') return 'saudi';
  if (countryVal === 'الإمارات') return 'uae';
  if (countriesList.includes(countryVal)) return countryVal;
  return 'egypt';
};

const getGovernorateKey = (govVal: string, countryKey: string) => {
  if (governoratesStructure[countryKey]?.includes(govVal)) return govVal;
  // البحث بالعكس عن القيمة العربية لتوليد المفتاح البرمجي المناسب
  for (const [key, arName] of Object.entries(tGovernorates)) {
    if (arName === govVal) return key;
  }
  return governoratesStructure[countryKey]?.[0] || '';
};

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
    country: 'egypt',
    governorate: 'cairo',
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
            const rawCountry = data.country || 'مصر';
            const cKey = getCountryKey(rawCountry);
            const rawGov = data.governorate || '';
            const gKey = getGovernorateKey(rawGov, cKey);

            setFormData({
              fullName: data.name || data.fullName || user.displayName || '',
              username: data.username || '',
              email: user.email || '',
              phone: data.phone || '',
              country: cKey,
              governorate: gKey,
              address: data.address || '',
            });
          } else {
            setFormData({
              fullName: user.displayName || '',
              username: '',
              email: user.email || '',
              phone: '',
              country: 'egypt',
              governorate: 'cairo',
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const trimmedName = formData.fullName.trim();
    const trimmedUsername = formData.username.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    // 1. التحقق من صحة الاسم (يجب ألا يقل عن 3 أحرف وصالح)
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(trimmedName)) {
      setErrorMessage('الاسم غير صالح (يجب ألا يقل عن 3 أحرف ويحتوي على حروف صحيحة).');
      setSaving(false);
      return;
    }

    // 2. التحقق من اسم المستخدم (حروف وأرقام إنجليزية وشرطة سفلية فقط بين 3 إلى 20 حرفاً)
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setErrorMessage('اسم المستخدم يجب أن يتكون من حروف وأرقام إنجليزية وشرطة سفلية فقط (من 3 إلى 20 حرفاً).');
      setSaving(false);
      return;
    }

    // 3. التحقق من رقم الهاتف (ألا يقل عن 8 أرقام ولا يزيد عن 15)
    if (trimmedPhone.length < 8 || trimmedPhone.length > 15) {
      setErrorMessage('رقم الهاتف غير صحيح (يجب ألا يقل عن 8 أرقام).');
      setSaving(false);
      return;
    }

    // 4. التحقق من العنوان التفصيلي
    if (trimmedAddress.length < 5) {
      setErrorMessage('يرجى كتابة العنوان بشكل مفصل وصحيح.');
      setSaving(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('لا يوجد مستخدم مسجل دخول حالياً.');
      }

      // التحقق من عدم توفر اسم المستخدم مع مستخدم آخر
      const usernameQuery = query(collection(db, 'users'), where('username', '==', trimmedUsername));
      const usernameSnapshot = await getDocs(usernameQuery);
      let isTakenByOther = false;
      usernameSnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.uid) {
          isTakenByOther = true;
        }
      });

      if (isTakenByOther) {
        setErrorMessage('اسم المستخدم هذا مستخدم من قبل شخص آخر، اختر اسماً آخر.');
        setSaving(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const countryReadableName = tCountries[formData.country] || formData.country;
      const govReadableName = tGovernorates[formData.governorate] || formData.governorate;

      // حفظ البيانات في Firestore مع الحفاظ على الحقول الأساسية
      await setDoc(userDocRef, {
        name: trimmedName,
        fullName: trimmedName,
        username: trimmedUsername,
        email: user.email,
        phone: trimmedPhone,
        country: countryReadableName,
        governorate: govReadableName,
        address: trimmedAddress,
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
        <div className="inline-block w-6 h-6 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const currentGovernorateKeys = governoratesStructure[formData.country] || [];

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
              maxLength={50}
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
              maxLength={20}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              placeholder="username"
              required
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
              maxLength={15}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs"
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">الدولة</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded-2xl border border-input bg-background text-foreground px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs cursor-pointer"
            >
              {countriesList.map((cKey) => (
                <option key={cKey} value={cKey} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 py-2">
                  {tCountries[cKey]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">المحافظة / المنطقة</label>
            <select
              name="governorate"
              value={formData.governorate}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-input bg-background text-foreground px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="" disabled className="text-muted-foreground py-2">اختر المحافظة</option>
              {currentGovernorateKeys.map((govKey) => (
                <option key={govKey} value={govKey} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 py-2">
                  {tGovernorates[govKey]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">العنوان التفصيلي</label>
          <textarea
            rows={3}
            maxLength={150}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3.5 text-foreground text-sm font-medium focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all shadow-xs resize-none"
            placeholder="الشارع، رقم المبنى، الطابق، العلامة المميزة..."
            required
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