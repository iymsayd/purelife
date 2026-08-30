'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Loader2, Info, CheckCircle, AlertTriangle } from 'lucide-react';

// النصوص الأصلية الافتراضية
const defaultAboutContent = {
  badgeTitle: "عن بيورلايف",
  subTitle: "مجموعة من الخبراء المتخصصين",
  paragraphOne: "تعتبر شركة بيورلايف مجموعة من الخبراء المتخصصين فى عالم التكييف والتبريد وتكنولوجيا معالجة المياة والبيئة داخل مصر وخارجها منذ أكثر من خمسة عشر عام قررنا تأسيس شركة بيور لايف بمفاهيم حديثة تعتمد على دراسة السوق ومتطلباته ومعالجة السلبيات الموجودة بالإعتماد على الأسس العلمية والمعاير المتبعة فى جميع دول العالم. ومن أهم نتائج البحث والدراسة وجدنا أن خدمة ما بعد البيع المتميزة هى الوسيلة الوحيدة والضمان لتقدم الشركة.",
  paragraphTwo: "ولكن لأننا لا نريد فقط التمييز بل نطمح أن نكون الأفضل وجدنا أن طريقنا يبدأ من خدمة البيع أولا ثم خدمة ما بعد البيع. فأنتقينا مجموعة من أفضل أجهزة التكييف، فلاتر المياة وأكثرها كفاءة ومنتجات لشركات ذات ثقل فى المجال لتساعدنا فى ما نطمح اليه ولم ننجرف نحو الأجهزة الأقل كفاءة حتى لو كانت الأكثر ربحا.",
  quoteText: "ولما كانت ثقتكم هي غايتنا، استعنا بخبرتنا العلمية والعملية لنعمل على خدمتكم بأقصى جهد...",
  footerMotto: "خبرتنا ماضينا... خدمتكم حاضرنا... ثقتكم مستقبلنا"
};

export default function AboutEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appMessage, setAppMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState(defaultAboutContent);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'site_content', 'about_page');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && Object.keys(docSnap.data()).length > 0) {
          // دمج البيانات الموجودة في فايربيز مع القيم الافتراضية لضمان عدم وجود حقول فارغة
          setFormData({ ...defaultAboutContent, ...docSnap.data() });
        } else {
          // إذا لم يكن المستند موجوداً، نقوم بإنشائه تلقائياً بالنصوص الأصلية
          await setDoc(docRef, defaultAboutContent);
        }
      } catch (error) {
        console.error("Error fetching about content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setAppMessage(null);
    try {
      const docRef = doc(db, 'site_content', 'about_page');
      // استخدام setDoc مع merge: true لضمان التحديث الكامل أو الإنشاء الآمن
      await setDoc(docRef, formData, { merge: true });
      
      setAppMessage({ text: 'تم حفظ وتحديث التعديلات بنجاح وظهرت في الموقع!', type: 'success' });
      setTimeout(() => setAppMessage(null), 4000);
    } catch (error) {
      console.error(error);
      setAppMessage({ text: 'حدث خطأ أثناء حفظ التعديلات.', type: 'error' });
      setTimeout(() => setAppMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm text-[var(--foreground)]" dir="rtl">
      <div className="flex items-center gap-3 mb-8 border-b pb-4 border-gray-100 dark:border-gray-800">
        <Info className="text-blue-600 dark:text-blue-400" size={28} />
        <div>
          <h2 className="text-2xl font-black">تعديل صفحة "من نحن"</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">التعديلات التي ستحفظها هنا ستظهر مباشرة للزوار في الموقع.</p>
        </div>
      </div>

      {appMessage && (
        <div className={`p-4 mb-6 rounded-2xl text-sm font-bold flex items-center gap-2 ${
          appMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-600 text-white'
        }`}>
          {appMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {appMessage.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">العنوان الرئيسي (Badge Title)</label>
            <input 
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
              value={formData.badgeTitle} 
              onChange={e => setFormData({...formData, badgeTitle: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">العنوان الفرعي (Sub Title)</label>
            <input 
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
              value={formData.subTitle} 
              onChange={e => setFormData({...formData, subTitle: e.target.value})} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">الفقرة الأولى</label>
          <textarea 
            rows={5} 
            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed" 
            value={formData.paragraphOne} 
            onChange={e => setFormData({...formData, paragraphOne: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">الفقرة الثانية</label>
          <textarea 
            rows={5} 
            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed" 
            value={formData.paragraphTwo} 
            onChange={e => setFormData({...formData, paragraphTwo: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">الاقتباس (Quote)</label>
          <input 
            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            value={formData.quoteText} 
            onChange={e => setFormData({...formData, quoteText: e.target.value})} 
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">الشعار الختامي (Motto)</label>
          <input 
            className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
            value={formData.footerMotto} 
            onChange={e => setFormData({...formData, footerMotto: e.target.value})} 
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'جاري الحفظ...' : 'حفظ التعديلات وتحديث الموقع'}
        </button>
      </div>
    </div>
  );
}