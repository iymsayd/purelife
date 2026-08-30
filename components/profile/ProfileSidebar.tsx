"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activeTab, setActiveTab }) => {
  const [fullName, setFullName] = useState<string>('مستخدم رئاد');
  const [username, setUsername] = useState<string>('user');
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'supervisor'>('user');

  // دالة لجلب بيانات المستخدم من فايربيز وتحديث الحالة المحلية
  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.name || data.fullName) setFullName(data.name || data.fullName);
        if (data.username) setUsername(data.username);
        if (data.role) setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user additional data from firestore:", error);
    }
  };

  useEffect(() => {
    // 1. جلب البيانات الأولية السريعة من الـ localStorage إن وجدت
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) setFullName(parsed.name);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.role) setUserRole(parsed.role);
      } catch (e) {
        console.error("فشل قراءة بيانات المستخدم من التخزين المحلي.");
      }
    }

    // 2. الاستماع لتغيرات حالة المصادقة في فايربيز
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (currentUser.displayName) {
          setFullName(currentUser.displayName);
        }
        await fetchUserData(currentUser.uid);
      }
    });

    // 3. الاستماع لحدث التحديث المخصص لضمان المزامنة اللحظية عند تعديل البيانات
    const handleProfileUpdate = () => {
      if (auth.currentUser) {
        fetchUserData(auth.currentUser.uid);
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const tabs = [
    { id: 'info', label: 'البيانات الشخصية', icon: '👤' },
    { id: 'security', label: 'كلمة المرور والأمان', icon: '🔒' },
    { id: 'activities', label: 'الطلبات والخدمات', icon: '📋' },
    { id: 'orders', label: 'المشتريات والشحن', icon: '📦' },
  ];

  // استخراج أول حرف من الاسم الكامل لعرضه داخل الأيقونة الدائرية
  const firstLetter = fullName ? fullName.trim().charAt(0) : 'ر';

  // تنسيق اسم المستخدم الأساسي
  const formattedUsername = username.startsWith('@') ? username : `@${username}`;

  // تحديد الشارة الإضافية الخفيفة في حال كان أدمن أو مشرف
  const getSubBadge = () => {
    if (userRole === 'admin') {
      return { text: '✨ مسؤول', className: 'text-rose-500 bg-rose-500/10 border border-rose-500/20' };
    }
    if (userRole === 'supervisor') {
      return { text: '⭐ مشرف', className: 'text-purple-500 bg-purple-500/10 border border-purple-500/20' };
    }
    return null;
  };

  const subBadge = getSubBadge();

  return (
    <div className="sticky top-6 bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-5 sm:p-6 flex flex-col w-full transition-all duration-300">
      {/* رأس السايدبار (معلومات المستخدم مع ضمان ظهور الاسم الكامل بوضوح تام) */}
      <div className="flex items-center gap-3.5 p-4 mb-6 border-b border-border/80 bg-muted/30 rounded-2xl overflow-hidden">
        <div className="w-14 h-14 min-w-[56px] h-14 rounded-2xl bg-[#0ea5e9] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#0ea5e9]/25 shrink-0">
          {firstLetter}
        </div>
        <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
          {/* الاسم الكامل مع منع الاقتطاع وضبط العرض */}
          <h3 className="font-black text-foreground text-sm sm:text-base truncate tracking-tight w-full block" title={fullName}>
            {fullName}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* اسم المستخدم الأساسي دائماً */}
            <span className="inline-block px-2.5 py-0.5 text-xs rounded-xl font-bold bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 truncate max-w-full" title={formattedUsername}>
              {formattedUsername}
            </span>

            {/* شارة إضافية خفيفة جداً لو أدمن أو مشرف */}
            {subBadge && (
              <span className={`inline-block px-2 py-0.5 text-[10px] rounded-lg font-extrabold ${subBadge.className}`}>
                {subBadge.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* القائمة الجانبية */}
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/25 scale-[1.02]'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};