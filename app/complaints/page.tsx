import type { Metadata } from 'next';
import ComplaintsForm from './ComplaintsForm';

export const metadata: Metadata = {
  title: 'شكاوى ومقترحات | بيورلايف',
  description: 'نحن نهتم برأيكم. تواصل معنا لإرسال شكواك أو مقترحاتك لتحسين خدماتنا.',
};

export default function ComplaintsPage() {
  return <ComplaintsForm />;
}