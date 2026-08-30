'use client';
import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Calendar, Sparkles, CheckCircle2, ArrowLeft, Loader2, Info, Lock, Trash2, ChevronDown } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { saveUserMessage } from '@/lib/messageService';

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

export default function EventClient({ event, allEvents, initialUserData }: { event: any; allEvents?: any[]; initialUserData?: any }) {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [dataModified, setDataModified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  // قائمة الأحداث الإضافية المختارة وحالة فتح/غلق القائمة المنسدلة
  const [selectedExtraEvents, setSelectedExtraEvents] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

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
        const savedForm = sessionStorage.getItem('event_form_draft');
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
      document.removeEventListener('mousedown', handleClickOutside);
      unsubscribeAuth();
    };
  }, []);

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'email' && isLoggedIn) return;

    if (field === 'phone') {
      const filteredPhone = value.replace(/[^\d\s+\-()]/g, '');
      const updated = { ...formDataState, phone: filteredPhone };
      setFormDataState(updated);
      if (!isLoggedIn) sessionStorage.setItem('event_form_draft', JSON.stringify(updated));
      if (isLoggedIn) setDataModified(true);
      return;
    }

    const updated = { ...formDataState, [field]: value };
    setFormDataState(updated);
    if (!isLoggedIn) sessionStorage.setItem('event_form_draft', JSON.stringify(updated));

    if (isLoggedIn) {
      setDataModified(true);
    }
  };

  const toggleExtraEvent = (eventTitle: string) => {
    setSelectedExtraEvents(prev => 
      prev.includes(eventTitle) 
        ? prev.filter(t => t !== eventTitle) 
        : [...prev, eventTitle]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formElement = e.currentTarget;
    const dataToSend = new FormData(formElement);
    
    const finalEmail = isLoggedIn && formDataState.email ? formDataState.email : formDataState.email;
    if (finalEmail) {
      dataToSend.set('email', finalEmail);
    }

    const allBookedEventsTitles = [event.title, ...selectedExtraEvents].join('، ');

    dataToSend.append("access_key", "b55ed479-fbc2-4666-95f2-792d7e5a7367");
    dataToSend.append("subject", `حجز حدث جديد: ${event.title} ${selectedExtraEvents.length > 0 ? `(مع أحداث إضافية)` : ''}`);
    dataToSend.append("event_title", allBookedEventsTitles);

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
        sessionStorage.removeItem('event_form_draft');
      }

      await saveUserMessage('events', {
        title: `حجز أحداث: ${allBookedEventsTitles}`,
        name: formDataState.name,
        phone: formDataState.phone,
        address: formDataState.address,
        email: finalEmail,
        eventTitle: allBookedEventsTitles,
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
          console.error("Error updating user profile after event submission:", updateErr);
        }
      }

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.");
    } finally {
      setSubmitting(false);
    }
  };

  const otherEvents = allEvents?.filter(e => e.slug !== event.slug && e.id !== event.id) || [];

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center space-y-12 max-w-4xl" dir="rtl">
      
      {event.image && (
        <div className="w-full h-80 md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[var(--border)] relative group bg-[var(--secondary)]/5">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40"></div>
        </div>
      )}

      {event.date && (
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-base md:text-lg shadow-sm border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)]">
          <Calendar size={20} />
          <span>{event.date}</span>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[var(--secondary)]">
          {event.title}
        </h1>
        {event.location && (
          <div className="flex items-center justify-center gap-2 text-base md:text-lg font-bold opacity-80">
            <MapPin size={20} className="text-[var(--secondary)]" />
            <span className={event.location.includes('طنطا') ? "text-[var(--secondary)] font-extrabold" : ""}>
              {event.location}
            </span>
          </div>
        )}
        <p className="font-medium max-w-3xl mx-auto text-lg md:text-xl leading-relaxed opacity-85">{event.desc}</p>
      </div>

      <div className="pt-2">
        <button 
          onClick={() => { setSuccessMessage(false); setShowModal(true); }} 
          className="px-12 py-5 rounded-2xl font-black text-xl transition-all cursor-pointer shadow-xl hover:scale-105 duration-300 flex items-center gap-3 mx-auto bg-[var(--secondary)] hover:opacity-95 text-white"
        >
          <Sparkles size={24} />
          <span>احجز مكانك الآن</span>
        </button>
      </div>

      {otherEvents.length > 0 && (
        <div className="pt-16 border-t border-[var(--border)] mt-16 text-right">
          <h2 className="text-2xl md:text-3xl font-black mb-8 text-center">
            أحداث وفعاليات أخرى
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" dir="rtl">
            {otherEvents.map((item) => {
              const itemSlug = item.slug || item.id;
              return (
                <a 
                  key={itemSlug}
                  href={`/events/${itemSlug}`}
                  className="min-w-[280px] md:min-w-[320px] max-w-[320px] p-5 rounded-[2rem] border border-[var(--border)] bg-[var(--background)] shadow-xl flex-shrink-0 flex flex-col justify-between transition-all hover:scale-[1.02] hover:border-[var(--secondary)]"
                >
                  <div>
                    {item.image && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 border border-[var(--border)] bg-[var(--secondary)]/5">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-extrabold text-lg mb-2 line-clamp-1">{item.title}</h3>
                    {item.date && <p className="text-xs font-bold text-[var(--secondary)] mb-3">{item.date}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold pt-2 border-t border-[var(--border)] mt-2 text-[var(--secondary)]">
                    <span>عرض الحدث</span>
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
                    تم الحجز بنجاح!
                  </h3>
                  <p className="text-base font-semibold opacity-80">
                    سنتواصل معك في أقرب وقت لتأكيد الحجز وتم تحديث بياناتك الشخصية بنجاح.
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
                  <h2 className="text-3xl font-black mb-2">بيانات الحجز</h2>
                  <p className="text-sm font-semibold opacity-70">املأ بياناتك أدناه لتأكيد حجز مقعدك</p>
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
                    label="العنوان بالتفصيل" 
                    name="address" 
                    type="text" 
                    required 
                    value={formDataState.address}
                    onChange={(e: any) => handleFieldChange('address', e.target.value)}
                    placeholder="المدينة، الحي، الشارع" 
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

                  {otherEvents.length > 0 && (
                    <div className="text-right space-y-3 pt-2 border-t border-[var(--border)]" ref={dropdownRef}>
                      <label className="block text-sm font-bold text-[var(--foreground)]">إضافة فعاليات أخرى مع هذا الحجز (اختياري):</label>
                      
                      {selectedExtraEvents.length > 0 && (
                        <div className="p-3 rounded-2xl bg-[var(--secondary)]/10 border border-[var(--secondary)]/30 space-y-2">
                          <span className="text-xs font-extrabold text-[var(--secondary)] block">الفعاليات المضافة لحجزك الحالي:</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedExtraEvents.map((title) => (
                              <div key={title} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--secondary)] text-white text-xs font-bold shadow-sm">
                                <span className="max-w-[200px] truncate">{title}</span>
                                <button 
                                  type="button" 
                                  onClick={() => toggleExtraEvent(title)}
                                  className="hover:bg-black/20 p-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(prev => !prev)}
                          className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] flex items-center justify-between text-sm font-semibold transition-all shadow-xs cursor-pointer hover:border-[var(--secondary)]"
                        >
                          <span className="opacity-75">
                            {selectedExtraEvents.length > 0 ? `تم اختيار (${selectedExtraEvents.length}) فعاليات إضافية` : 'اختر فعاليات إضافية من القائمة...'}
                          </span>
                          <ChevronDown size={18} className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-[var(--secondary)]' : 'opacity-60'}`} />
                        </button>

                        {dropdownOpen && (
                          <div className="absolute top-full mt-2 left-0 right-0 z-20 p-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl space-y-1.5 max-h-56 overflow-y-auto">
                            {otherEvents.map((item: any) => {
                              const isSelected = selectedExtraEvents.includes(item.title);
                              return (
                                <div 
                                  key={item.id || item.slug}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-bold ${isSelected ? 'bg-[var(--secondary)]/15 border-[var(--secondary)] text-[var(--secondary)]' : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]/5'}`}
                                >
                                  <span className="line-clamp-1 flex-1 text-right ml-2">{item.title}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleExtraEvent(item.title)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${isSelected ? 'bg-red-500 hover:bg-red-600 text-white shadow-xs' : 'bg-[var(--secondary)] hover:opacity-90 text-white shadow-xs'}`}
                                  >
                                    {isSelected ? 'إزالة' : 'إضافة'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <label className="block text-sm font-bold mb-2">رسالة إضافية (اختياري)</label>
                    <textarea 
                      name="message" 
                      value={formDataState.message}
                      onChange={(e) => handleFieldChange('message', e.target.value)}
                      className="w-full p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--secondary)] outline-none transition-all shadow-xs resize-none min-h-[100px] text-sm font-semibold text-right" 
                      placeholder="أكتب ملاحظاتك..."
                    ></textarea>
                  </div>
                  
                  <button 
                    disabled={submitting} 
                    type="submit" 
                    className="w-full bg-[var(--secondary)] hover:opacity-95 text-white py-4 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>جاري الإرسال...</span>
                      </>
                    ) : (
                      <span>تأكيد الحجز</span>
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