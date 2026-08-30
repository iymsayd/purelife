'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          // السماح للأدمن، السوبر أدمن، والمشرف بالدخول للوحة التحكم
          if (role === 'admin' || role === 'super_admin' || role === 'moderator') {
            setStatus('authorized');
          } else {
            setStatus('unauthorized');
          }
        } else {
          setStatus('unauthorized');
        }
      } else {
        setStatus('unauthorized');
      }
    });
    return () => unsubscribe();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="text-center py-10 font-bold text-blue-600 dark:text-blue-400">جاري التحقق من الصلاحيات...</div>
      </div>
    );
  }
  
  if (status === 'unauthorized') notFound();

  return <>{children}</>;
}
