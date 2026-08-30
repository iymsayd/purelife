import ContactClient from './ContactClient';

export const metadata = {
  title: 'تواصل معنا | بيورلايف لمعالجة المياه والتكييف',
  description: 'تواصل مع فريق عمل بيورلايف في فروع طنطا ومحلة مرحوم لمعالجة المياه، محطات الرواى، وفلاتر المياه والتكييفات.',
  keywords: ['فلاتر مياه طنطا', 'صيانة تكييفات الغربية', 'بيورلايف محلة مرحوم', 'تواصل معنا بيورلايف'],
  openGraph: {
    title: 'تواصل معنا | بيورلايف',
    description: 'تواصل مع فريق عمل بيورلايف لمعالجة المياه والتكييف.',
    locale: 'ar_EG',
    type: 'website',
  },
};

export default function Page() {
  return <ContactClient />;
}