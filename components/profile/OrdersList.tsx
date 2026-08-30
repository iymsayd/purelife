"use client";

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

interface OrdersListProps {
  user: User;
}

export const OrdersList: React.FC<OrdersListProps> = ({ user }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // جلب الطلبات الخاصة بالمستخدم الحالي من فايربيز بناءً على البروب الواصل (user)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.uid) {
        setLoading(false);
        setOrders([]);
        return;
      }

      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedOrders: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedOrders.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          });
        });

        // ترتيب الطلبات من الأحدث للأقدم
        fetchedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // دعم إغلاق المودال بزر Esc من لوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cancelModalOpen) {
        setCancelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelModalOpen]);

  // فتح نافذة تأكيد الإلغاء مع السبب
  const openCancelModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCancelReason('');
    setErrorMessage('');
    setCancelModalOpen(true);
  };

  // إرسال طلب الإلغاء وتحديثه في الفايربيز
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMessage('برجاء كتابة سبب الإلغاء بشكل إجباري.');
      return;
    }
    if (!selectedOrderId) return;

    setSubmittingCancel(true);
    setErrorMessage('');

    try {
      const orderRef = doc(db, 'orders', selectedOrderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        statusLabel: 'ملغي',
        cancelReason: cancelReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: 'user', // لتوضيح أن الإلغاء تم من طرف المستخدم
      });

      // تحديث الحالة محلياً
      setOrders(prev => prev.map(ord => ord.id === selectedOrderId ? {
        ...ord,
        status: 'cancelled',
        statusLabel: 'ملغي',
        cancelReason: cancelReason.trim(),
        cancelledBy: 'user'
      } : ord));

      setCancelModalOpen(false);
      setSelectedOrderId(null);
      setCancelReason('');
    } catch (error) {
      console.error("Error cancelling order:", error);
      setErrorMessage('حدث خطأ أثناء إلغاء الطلب، حاول مرة أخرى.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="bg-card text-card-foreground rounded-3xl shadow-xl shadow-black/5 border border-border/80 p-6 sm:p-10 transition-all duration-300 relative">
      <div className="text-center sm:text-right mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">مشترياتي (الجديدة والمستعملة) ومتابعة الطلب</h2>
        <p className="text-xs sm:text-sm font-semibold text-[#0ea5e9]">
          تتبع تفاصيل مشترياتك وحالة الطلب لكل طلب بكل سهولة.
        </p>
      </div>

      {loading ? (
        <div className="bg-card text-card-foreground rounded-3xl p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-muted-foreground animate-pulse">جاري جلب المشتريات والطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/80 rounded-3xl bg-muted/20">
          <p className="text-foreground font-bold text-base mb-2">لا توجد طلبات شراء سابقة حتى الآن.</p>
          <p className="text-xs text-muted-foreground mb-6">ابحث عن منتجاتنا العادية أو المستعملة وابدأ التسوق الآن.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="/products" className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md shadow-[#0ea5e9]/20">
              تصفح المنتجات الجديدة
            </a>
            <a href="/used-products" className="bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition">
              تصفح المنتجات المستعملة
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const canCancel = order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'منتهي';

            return (
              <div key={order.id} className="border border-border/80 bg-background rounded-2xl p-5 sm:p-6 transition-all shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-xl text-xs font-black">
                      طلب #{order.id.slice(-6)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {order.createdAt ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(order.createdAt) : ''}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                      order.status === 'completed' || order.status === 'منتهي'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : order.status === 'cancelled' || order.status === 'ملغي'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {order.statusLabel || order.status || 'قيد التحضير والشحن'}
                    </span>
                  </div>
                </div>

                {/* تفاصيل المنتجات والمشتريات */}
                <div className="space-y-3">
                  <div className="bg-muted/40 rounded-xl p-4 text-sm text-foreground/90 font-medium space-y-1">
                    <p><strong className="text-muted-foreground ml-1">إجمالي المبلغ:</strong> {order.totalAmount || order.price || 'غير متوفر'} ج.م</p>
                    <p><strong className="text-muted-foreground ml-1">عنوان الشحن:</strong> {order.shippingAddress || order.address || 'العنوان المسجل بالملف الشخصي'}</p>
                    {order.cancelReason && (
                      <p className="text-rose-500 font-semibold pt-1">
                        <strong>سبب الإلغاء ({order.cancelledBy === 'admin' ? 'بواسطة الإدارة' : 'بواسطتك'}):</strong> {order.cancelReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* زر الإلغاء يظهر فقط لو لم ينتهِ الطلب من الإدارة */}
                {canCancel && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => openCancelModal(order.id)}
                      className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition cursor-pointer active:scale-98"
                    >
                      إلغاء الطلب
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* مودال إلغاء الطلب (بخلفية سوداء ثابتة وتصميم موحد للدارك والوايت) */}
      {cancelModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setCancelModalOpen(false)}
        >
          <div 
            className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-800 relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">تأكيد إلغاء الطلب</h3>
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              يرجى توضيح سبب إلغاء الطلب أدناه. هذا الحقل إجباري لتأكيد عملية الإلغاء.
            </p>

            {errorMessage && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="اكتب سبب الإلغاء هنا..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all shadow-xs resize-none placeholder:text-slate-500"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCancel ? 'جاري الإلغاء...' : 'تأكيد إلغاء الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};