'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, updateDoc, orderBy, query } from 'firebase/firestore';
import { Upload, Link as LinkIcon, Save, Trash2, Mail, CheckCircle, RefreshCw, Eye } from 'lucide-react';

interface FooterMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // إعدادات الموقع واللوجو والفوتر
  const [settings, setSettings] = useState({
    logoUrl: 'http://purelife-egy.com/Images/pure-logo.jpeg',
    footerTitle: 'بيورلايف لحياة أفضل',
    footerDescription: 'وكلاء معتمدون لجميع أجهزة التكييف<br />خبراء متخصصون في معالجة وتحلية المياة<br />موزعون لقطع غيار التكييفات وفلاتر المياة<br />مقايسات فنية وتركيبات وتجهيزات وصيانة لجميع أعمال التكييف والتبريد',
    footerEmail: 'purelife2024a@gmail.com',
    footerPhone: '011008903 (45 - 44 - 43 - 42 - 41 - 40)',
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://x.com',
    linkedin: 'https://linkedin.com',
    copyright: '© 2026 بيورلايف - جميع الحقوق محفوظة'
  });

  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [messages, setMessages] = useState<FooterMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // جلب الإعدادات والرسائل عند التحميل
  useEffect(() => {
    fetchSettings();
    fetchMessages();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'site_content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          logoUrl: data.logoUrl !== undefined && data.logoUrl !== null ? data.logoUrl : '',
          footerTitle: data.footerTitle !== undefined && data.footerTitle !== null ? data.footerTitle : '',
          footerDescription: data.footerDescription !== undefined && data.footerDescription !== null ? data.footerDescription : '',
          footerEmail: data.footerEmail !== undefined && data.footerEmail !== null ? data.footerEmail : '',
          footerPhone: data.footerPhone !== undefined && data.footerPhone !== null ? data.footerPhone : '',
          facebook: data.facebook !== undefined && data.facebook !== null ? data.facebook : '',
          instagram: data.instagram !== undefined && data.instagram !== null ? data.instagram : '',
          twitter: data.twitter !== undefined && data.twitter !== null ? data.twitter : '',
          linkedin: data.linkedin !== undefined && data.linkedin !== null ? data.linkedin : '',
          copyright: data.copyright !== undefined && data.copyright !== null ? data.copyright : ''
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const q = query(collection(db, 'footer_messages'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const msgs: FooterMessage[] = [];
      querySnapshot.forEach((docItem) => {
        msgs.push({ id: docItem.id, ...docItem.data() } as FooterMessage);
      });
      setMessages(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // التعامل مع رفع الصورة من الجهاز وتحويلها إلى Base64 أو رابط مؤقت
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logoUrl: (reader.result as string) || '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // حفظ الإعدادات في Firestore
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'site_content');
      await setDoc(docRef, settings, { merge: true });
      
      // إطلاق حدث لتحديث الهيدر والفوتر فوراً في أي نافذة مفتوحة
      window.dispatchEvent(new Event('siteSettingsUpdated'));

      setSuccessMessage('تم حفظ الإعدادات بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('حدث خطأ أثناء الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  // حذف رسالة من لوحة التحكم
  const handleDeleteMessage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await deleteDoc(doc(db, 'footer_messages', id));
      setMessages(prev => prev.filter(msg => msg.id !== id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // تعليم الرسالة كمقروءة
  const handleToggleRead = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'footer_messages', id), { read: !currentStatus });
      setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: !currentStatus } : msg));
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-lg font-bold">جاري تحميل لوحة التحكم...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl text-right" dir="rtl">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-8 border-b pb-4 flex items-center gap-3">
        ⚙️ لوحة تحكم الهيدر، الفوتر والرسائل
      </h1>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500 text-emerald-600 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle size={20} /> {successMessage}
        </div>
      )}

      {/* نموذج تعديل إعدادات الهيدر والفوتر */}
      <form onSubmit={handleSaveSettings} className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm mb-12">
        <h2 className="text-xl font-bold mb-6 text-[#0ea5e9]">تعديل محتوى الهيدر والفوتر</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* إعدادات الشعار (اللوجو) */}
          <div className="md:col-span-2 bg-[var(--background)] p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="block font-bold text-sm mb-2">شعار الهيدر (Logo)</label>
            <div className="flex gap-4 mb-3">
              <button
                type="button"
                onClick={() => setUploadType('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${uploadType === 'url' ? 'bg-[#0ea5e9] text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                رابط مباشر (URL)
              </button>
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${uploadType === 'file' ? 'bg-[#0ea5e9] text-white' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                رفع من الجهاز
              </button>
            </div>

            {uploadType === 'url' ? (
              <input
                type="text"
                value={settings.logoUrl ?? ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
                placeholder="أدخل رابط الصورة هنا..."
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm cursor-pointer"
              />
            )}

            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs text-gray-500">معاينة الشعار الحالي:</span>
              <img src={settings.logoUrl || ''} alt="Logo Preview" className="h-10 object-contain bg-white p-1 rounded border" />
            </div>
          </div>

          {/* عنوان الفوتر */}
          <div>
            <label className="block font-bold text-sm mb-1">عنوان الفوتر الرئيسي</label>
            <input
              type="text"
              value={settings.footerTitle ?? ''}
              onChange={(e) => setSettings({ ...settings, footerTitle: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* البريد الإلكتروني للفوتر */}
          <div>
            <label className="block font-bold text-sm mb-1">البريد الإلكتروني للفوتر</label>
            <input
              type="email"
              value={settings.footerEmail ?? ''}
              onChange={(e) => setSettings({ ...settings, footerEmail: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* أرقام التواصل */}
          <div>
            <label className="block font-bold text-sm mb-1">أرقام التواصل الهاتفي</label>
            <input
              type="text"
              value={settings.footerPhone ?? ''}
              onChange={(e) => setSettings({ ...settings, footerPhone: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* حقوق النشر */}
          <div>
            <label className="block font-bold text-sm mb-1">نص حقوق النشر (Copyright)</label>
            <input
              type="text"
              value={settings.copyright ?? ''}
              onChange={(e) => setSettings({ ...settings, copyright: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* وصف الفوتر (يدعم HTML مثل <br />) */}
          <div className="md:col-span-2">
            <label className="block font-bold text-sm mb-1">نبذة / وصف الفوتر (يقبل أكواد HTML مثل &lt;br /&gt;)</label>
            <textarea
              rows={3}
              value={settings.footerDescription ?? ''}
              onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          {/* روابط السوشيال ميديا */}
          <div>
            <label className="block font-bold text-sm mb-1">رابط فيسبوك</label>
            <input
              type="url"
              value={settings.facebook ?? ''}
              onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">رابط انستجرام</label>
            <input
              type="url"
              value={settings.instagram ?? ''}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">رابط منصة X (تويتر)</label>
            <input
              type="url"
              value={settings.twitter ?? ''}
              onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>

          <div>
            <label className="block font-bold text-sm mb-1">رابط لينكد إن</label>
            <input
              type="url"
              value={settings.linkedin ?? ''}
              onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[var(--background)] border border-gray-300 dark:border-gray-700 text-sm outline-none focus:border-[#0ea5e9]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold py-3 px-6 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات وتحديث الموقع'}
        </button>
      </form>

      {/* قسم عرض رسائل الفوتر (Footer Messages) */}
      <div className="bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#0ea5e9] flex items-center gap-2">
            <Mail size={22} /> رسائل نموذج التواصل الواردة ({messages.length})
          </h2>
          <button 
            onClick={fetchMessages}
            className="p-2 bg-[var(--background)] border border-gray-200 dark:border-gray-700 hover:border-[#0ea5e9] rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="تحديث الرسائل"
          >
            <RefreshCw size={14} /> تحديث القائمة
          </button>
        </div>

        {loadingMessages ? (
          <p className="text-center py-6 text-gray-500">جاري تحميل الرسائل...</p>
        ) : messages.length === 0 ? (
          <p className="text-center py-8 text-gray-500 bg-[var(--background)] border border-gray-200 dark:border-gray-800 rounded-xl">لا توجد رسائل مسجلة حتى الآن.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-xl border transition-all ${msg.read ? 'bg-[var(--background)] border-gray-200 dark:border-gray-800 opacity-80' : 'bg-[var(--background)] border-[#0ea5e9]/50 shadow-xs'}`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                  <div>
                    <span className="font-bold text-base ml-3">{msg.name}</span>
                    <a href={`mailto:${msg.email}`} className="text-xs text-[#0ea5e9] hover:underline">{msg.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'منذ قليل'}
                    </span>
                    <button
                      onClick={() => handleToggleRead(msg.id, msg.read)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${msg.read ? 'bg-gray-200 dark:bg-gray-800 text-gray-600' : 'bg-emerald-500 text-white'}`}
                    >
                      {msg.read ? 'مقروءة' : 'تعليم كمقروءة'}
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                      title="حذف الرسالة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-[var(--background)] p-3 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}