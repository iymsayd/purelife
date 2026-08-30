'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Tag, Sparkles, CheckCircle2, ArrowLeft, Loader2, Info, Lock } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserMessage } from '@/lib/messageService';

const colors = [
  "border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/50",
  "border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/50",
  "border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/50",
  "border-pink-300 dark:border-pink-800 text-pink-800 dark:text-pink-200 bg-pink-50 dark:bg-pink-950/50",
  "border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50"
];

function InputField({ label, name, type, required, placeholder, value, onChange }: any) {
  return (
    <div className="text-right">
      <label className="block text-sm font-bold mb-2">{label}</label>
      <input 
        type={type} 
        name={name}
        required={required} 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs text-sm font-semibold text-right"
      />
    </div>
  );
}

export default function OfferClient({ offer, slug, allOffers }: { offer: any, slug: string, allOffers: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([slug]);
  const [newOffer, setNewOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [dataModified, setDataModified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  const [formDataState, setFormDataState] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowModal(false); };
    window.addEventListener('keydown', handleEsc);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUserUid(user.uid);
        let firestoreData: any = {};
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            firestoreData = userDocSnap.data();
          }
        } catch (err) {
          console.error("Error fetching user profile data:", err);
        }

        setFormDataState(prev => ({
          ...prev,
          name: firestoreData.name || firestoreData.fullname || user.displayName || prev.name,
          email: user.email || firestoreData.email || prev.email,
          phone: firestoreData.phone || user.phoneNumber || prev.phone,
          address: firestoreData.address || prev.address,
        }));
      } else {
        setIsLoggedIn(false);
        setCurrentUserUid(null);
        const savedForm = sessionStorage.getItem('offer_form_draft');
        if (savedForm) {
          try {
            const parsed = JSON.parse(savedForm);
            setFormDataState(prev => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error(e);
          }
        }
      }
    });

    return () => {
      window.removeEventListener('keydown', handleEsc);
      unsubscribeAuth();
    };
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'email' && isLoggedIn) return;

    if (field === 'phone') {
      const filteredPhone = value.replace(/[^\d\s+\-()]/g, '');
      const updated = { ...formDataState, phone: filteredPhone };
      setFormDataState(updated);
      if (!isLoggedIn) sessionStorage.setItem('offer_form_draft', JSON.stringify(updated));
      if (isLoggedIn) setDataModified(true);
      return;
    }

    const updated = { ...formDataState, [field]: value };
    setFormDataState(updated);
    if (!isLoggedIn) sessionStorage.setItem('offer_form_draft', JSON.stringify(updated));

    if (isLoggedIn) {
      setDataModified(true);
    }
  };

  const getOfferTitle = (s: string) => {
    const found = allOffers.find(o => o.slug === s);
    return found ? found.title : s;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedOffers.length === 0) return;
    setSubmitting(true);

    const formElement = e.currentTarget;
    const dataToSend = new FormData(formElement);
    
    const finalEmail = isLoggedIn && formDataState.email ? formDataState.email : formDataState.email;
    if (finalEmail) {
      dataToSend.set('email', finalEmail);
    }

    const offersTitlesText = selectedOffers.map(s => getOfferTitle(s)).join(", ");

    dataToSend.append("access_key", "3e5400f1-1eef-42f3-85e4-b42fc416b850");
    dataToSend.append("subject", `طلب عرض جديد: خصم 20% على فلاتر المياه`);
    dataToSend.append("selected_offers", offersTitlesText);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: dataToSend
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || "حدث خطأ ما، يرجى المحاولة لاحقاً.");
        setSubmitting(false);
        return;
      }

      setSuccessMessage(true);
      if (!isLoggedIn) {
        sessionStorage.removeItem('offer_form_draft');
      }

      // تم التعديل هنا إلى 'offers' ليتطابق مع الـ collectionsMap
      await saveUserMessage('offers', {
        title: `طلب عرض: ${offersTitlesText}`,
        name: formDataState.name,
        phone: formDataState.phone,
        address: formDataState.address,
        email: finalEmail,
        selectedOffers: selectedOffers.map(s => getOfferTitle(s)),
        message: formDataState.message || 'لا توجد ملاحظات إضافية',
      }, isLoggedIn ? currentUserUid : null);

      if (isLoggedIn && currentUserUid) {
        try {
          const userDocRef = doc(db, 'users', currentUserUid);
          await updateDoc(userDocRef, {
            name: formDataState.name,
            phone: formDataState.phone,
            address: formDataState.address,
            updatedAt: new Date().toISOString()
          });
          setDataModified(false);
        } catch (updateErr) {
          console.error("Error updating user profile after offer submission:", updateErr);
        }
      }

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.");
    } finally {
      setSubmitting(false);
    }
  };

  const otherOffers = allOffers?.filter(o => o.slug !== slug) || [];

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center space-y-12 max-w-4xl" dir="rtl">
      
      {offer.image && (
        <div className="w-full h-80 md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[var(--border)] relative group bg-[var(--secondary)]/5">
          <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40"></div>
        </div>
      )}

      <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-base md:text-lg shadow-sm border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)]">
        <Tag size={20} />
        <span>نسبة الخصم: 20%</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--secondary)]">خصم 20% على فلاتر المياه</h1>
        <p className="font-medium max-w-3xl mx-auto text-lg md:text-xl leading-relaxed opacity-85">{offer.desc}</p>
      </div>

      <div className="pt-2">
        <button 
          onClick={() => { setSuccessMessage(false); setShowModal(true); }} 
          className="px-12 py-5 rounded-2xl font-black text-xl transition-all cursor-pointer shadow-xl hover:scale-105 duration-300 flex items-center gap-3 mx-auto bg-[var(--secondary)] hover:opacity-95 text-white"
        >
          <Sparkles size={24} />
          <span>استمتع بالعرض الآن</span>
        </button>
      </div>

      {otherOffers.length > 0 && (
        <div className="pt-16 border-t border-[var(--border)] mt-16 text-right">
          <h2 className="text-2xl md:text-3xl font-black mb-8 text-center">
            عروض أخرى قد تهمك
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" dir="rtl">
            {otherOffers.map((item) => {
              const itemTitle = item.title;
              return (
                <a 
                  key={item.slug}
                  href={`/offers/${item.slug}`}
                  className="min-w-[280px] md:min-w-[320px] max-w-[320px] p-5 rounded-[2rem] border border-[var(--border)] bg-[var(--background)] shadow-xl flex-shrink-0 flex flex-col justify-between transition-all hover:scale-[1.02] hover:border-[var(--secondary)]"
                >
                  <div>
                    {item.image && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-[var(--border)] bg-[var(--secondary)]/5">
                        <img src={item.image} alt={itemTitle} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-extrabold text-lg mb-2 line-clamp-1">{itemTitle}</h3>
                    {item.discount && <p className="text-xs font-bold text-[var(--secondary)] mb-3">{item.discount}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold pt-2 border-t border-[var(--border)] mt-2 text-[var(--secondary)]">
                    <span>عرض التفاصيل</span>
                    <ArrowLeft size={16} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setShowModal(false)}>
          <div 
            className="w-full max-w-lg p-6 md:p-8 rounded-[2.5rem] relative shadow-2xl max-h-[90vh] overflow-y-auto bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" 
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              className="absolute top-5 start-5 cursor-pointer p-2.5 rounded-full transition-colors border border-[var(--border)] bg-[var(--secondary)]/10 text-[var(--foreground)] hover:bg-[var(--secondary)]/20" 
              onClick={() => setShowModal(false)}
            >
              <X size={18} />
            </button>
            
            {successMessage ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--secondary)]/10 text-green-500 shadow-lg">
                  <CheckCircle2 size={48} className="animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">
                    تم الإرسال بنجاح!
                  </h3>
                  <p className="text-base font-semibold opacity-80">
                    سنتواصل معك في أقرب وقت لتأكيد الطلب وتم تحديث بياناتك الشخصية بنجاح.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 bg-[var(--secondary)] hover:opacity-95 text-white rounded-2xl font-black transition-all cursor-pointer shadow-lg text-lg"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center pt-2">
                  <h2 className="text-3xl font-black mb-2">طلب العرض</h2>
                  <p className="text-sm font-semibold opacity-70">املأ البيانات أدناه وسيتواصل فريقنا معك لتأكيد الطلب</p>
                </div>
                
                {dataModified && (
                  <div className="mb-4 p-3 rounded-xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/30 flex items-center gap-2 text-xs font-bold text-[var(--secondary)]">
                    <Info size={16} className="shrink-0" />
                    <span>تنبيه: أي تعديل على هذه البيانات سيتم تحديثه في بياناتك الأساسية فور إرسال الطلب.</span>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <InputField 
                    label="الاسم بالكامل" 
                    name="name" 
                    type="text" 
                    required 
                    value={formDataState.name}
                    onChange={(e: any) => handleFieldChange('name', e.target.value)}
                    placeholder="أدخل اسمك الكامل" 
                  />
                  <InputField 
                    label="رقم الهاتف" 
                    name="phone" 
                    type="tel" 
                    required 
                    value={formDataState.phone}
                    onChange={(e: any) => handleFieldChange('phone', e.target.value)}
                    placeholder="01xxxxxxxx" 
                  />
                  <InputField 
                    label="العنوان" 
                    name="address" 
                    type="text" 
                    required 
                    value={formDataState.address}
                    onChange={(e: any) => handleFieldChange('address', e.target.value)}
                    placeholder="المدينة، الدوار، الشارع" 
                  />

                  <div className="text-right">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold mb-1">
                        البريد الإلكتروني {!isLoggedIn && <span className="text-xs opacity-60 font-normal">(اختياري)</span>}
                      </label>
                      {isLoggedIn && (
                        <span className="text-xs text-[var(--secondary)] font-medium flex items-center gap-1">
                          <Lock size={12} /> البريد مسجل بحسابك
                        </span>
                      )}
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formDataState.email}
                      disabled={isLoggedIn}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs text-sm font-semibold text-right ${isLoggedIn ? 'opacity-75 cursor-not-allowed bg-[var(--secondary)]/5' : ''}`}
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold mb-2">العروض المختارة:</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedOffers.map((s, index) => (
                        <div key={s} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold border shadow-sm ${colors[index % colors.length]}`}>
                          <span>{getOfferTitle(s)}</span>
                          {selectedOffers.length > 1 && (
                            <button type="button" onClick={() => setSelectedOffers(selectedOffers.filter(x => x !== s))} className="hover:opacity-75 transition cursor-pointer">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs text-sm font-bold" 
                        onChange={(e) => setNewOffer(e.target.value)}
                        value={newOffer}
                      >
                        <option value="" className="bg-[var(--background)] text-[var(--foreground)]">إضافة عرض إضافي...</option>
                        {allOffers.filter(o => !selectedOffers.includes(o.slug)).map(o => (
                          <option key={o.slug} value={o.slug} className="bg-[var(--background)] text-[var(--foreground)]">{o.title}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => { if(newOffer && !selectedOffers.includes(newOffer)) { setSelectedOffers([...selectedOffers, newOffer]); setNewOffer(""); } }} 
                        className="px-5 rounded-2xl transition cursor-pointer flex items-center justify-center hover:opacity-90 shadow-md bg-[var(--secondary)] text-white"
                      >
                        <Plus size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold mb-2">رسالة إضافية (اختياري)</label>
                    <textarea 
                      name="message" 
                      value={formDataState.message}
                      onChange={(e) => handleFieldChange('message', e.target.value)}
                      className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs resize-none min-h-[100px] text-sm font-semibold text-right" 
                      placeholder="أكتب ملاحظاتك أو موعد التركيب المناسب..."
                    ></textarea>
                  </div>
                  
                  <button 
                    disabled={submitting || selectedOffers.length === 0} 
                    type="submit" 
                    className="w-full bg-[var(--secondary)] hover:opacity-95 text-white py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <span>{selectedOffers.length === 0 ? "يجب اختيار عرض واحد على الأقل" : "تأكيد وإرسال الطلب"}</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}