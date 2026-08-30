'use client';
import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebaseAnalytics'; // تأكد من المسار

export default function AnalyticsInitializer() {
  useEffect(() => {
    initAnalytics();
  }, []);
  
  return null;
}