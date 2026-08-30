import type { Metadata } from 'next';
import QualityContent from './QualityContent';

export const metadata: Metadata = {
  title: 'سياسة الجودة | بيورلايف - معاييرنا للأفضل',
  description: 'تعرف على سياسة الجودة في بيورلايف، التزامنا بالأسس العلمية وأعلى معايير الجودة في خدمات تكييف الهواء وتكنولوجيا معالجة المياه منذ أكثر من 15 عاماً.',
};

export default function QualityPolicyPage() {
  return <QualityContent />;
}