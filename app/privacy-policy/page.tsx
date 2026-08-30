import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | بيورلايف - بياناتك في أمان',
  description: 'نحن في بيورلايف نحترم خصوصيتك. تعرف على كيفية جمعنا واستخدامنا وحمايتنا لبياناتك الشخصية بكل شفافية وأمان.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyContent />;
}