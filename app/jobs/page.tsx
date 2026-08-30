import type { Metadata } from 'next';
import JobsForm from './JobsForm';

export const metadata: Metadata = {
  title: 'وظائف بيورلايف | انضم لفريق العمل',
  description: 'انضم إلى فريق شركة بيورلايف وقدم طلب توظيف في مجال خدمة العملاء، المبيعات، الصيانة، والفنيين.',
};

export default function JobsPage() {
  return <JobsForm />;
}