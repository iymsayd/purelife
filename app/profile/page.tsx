"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { SecurityForm } from '@/components/profile/SecurityForm';
import { ActivitiesList } from '@/components/profile/ActivitiesList';
import { OrdersList } from '@/components/profile/OrdersList';

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activities' | 'orders'>('info');
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setUserData(user);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#0ea5e9]">حسابي الشخصي</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="lg:col-span-3 space-y-6">
            {userData && (
              <>
                {activeTab === 'info' && <PersonalInfoForm user={userData} />}
                {activeTab === 'security' && <SecurityForm user={userData} />}
                {activeTab === 'activities' && <ActivitiesList user={userData} />}
                {activeTab === 'orders' && <OrdersList user={userData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}