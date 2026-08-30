import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'عن بيورلايف | من نحن',
  description: 'تعرف على شركة بيورلايف ورؤيتنا في تقديم أفضل خدمات فلاتر المياه والتكييفات بجودة عالية واحترافية بخبرة أكثر من 15 عاماً.',
};

export default function AboutPage() {
  return <AboutContent />;
}