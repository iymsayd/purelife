'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  Package, 
  Search,  
  Eye, 
  Trash2, 
  X, 
  Phone, 
  MapPin,
  CheckCircle2
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'purelife2024a@gmail.com';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  type: string;
  image?: string;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: any;
  statusHistory?: any[];
  cancelInfo?: {
    isCancelled: boolean;
    reason?: string;
    cancelledBy?: string;
    cancelledByName?: string;
  };
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // نظام الرسائل والتنبيهات المخصص (Custom Modal Alert بديل alert نهائياً)
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // دعم زر Escape لإغلاق النوافذ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalAlert(prev => ({ ...prev, isOpen: false }));
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const userEmail = (currentUser.email || '').toLowerCase();
      const isSuper = userEmail === SUPER_ADMIN_EMAIL;

      const isAuthorizedAdmin = currentUser ? true : false;

      if (isAuthorizedAdmin) {
        setIsAdmin(true);
        setIsSuperAdmin(isSuper);
        fetchOrders();
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, mounted]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersList: Order[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ordersList.push({ 
          id: docSnap.id, 
          ...data,
          statusHistory: data.statusHistory || [{
            status: data.status || 'pending',
            updatedAt: data.createdAt || null,
            reason: 'تم إنشاء الطلب',
            updatedBy: data.customerName || 'العميل'
          }],
          cancelInfo: data.cancelInfo || {
            isCancelled: data.status === 'cancelled',
            reason: data.status === 'cancelled' ? (data.cancelInfo?.reason || 'بدون سبب محدد') : '',
            cancelledByName: data.cancelInfo?.cancelledByName || (data.status === 'cancelled' ? 'العميل أو النظام' : '')
          }
        } as Order);
      });

      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = orders;

    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.customerName?.toLowerCase().includes(term) ||
        order.phone?.toLowerCase().includes(term) ||
        order.id?.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSuperAdmin) {
      setModalAlert({
        isOpen: true,
        title: 'صلاحية محدودة',
        message: 'عذراً، بصفتك مشرفاً (Admin) يمكنك متابعة الطلبات وعرضها فقط، ولا تمتلك صلاحية التعديل.',
        type: 'warning'
      });
      return;
    }

    if (!selectedOrder || !newStatus) return;

    if (newStatus === 'cancelled' && !cancelReason.trim()) {
      setModalAlert({
        isOpen: true,
        title: 'تنبيه مطلوب',
        message: 'برجاء كتابة سبب الإلغاء قبل الحفظ.',
        type: 'warning'
      });
      return;
    }

    setUpdating(true);

    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      const adminNameVal = user?.displayName || user?.email || 'المسؤول الرئيسي';
      
      let reasonText = `تم تغيير الحالة إلى: ${newStatus}`;
      if (newStatus === 'cancelled') {
        reasonText = `تم الإلغاء بواسطة المسؤول (${adminNameVal}). السبب: ${cancelReason}`;
      }

      const currentHistory = selectedOrder.statusHistory || [];
      const updatedHistory = [
        ...currentHistory,
        {
          status: newStatus,
          updatedAt: new Date(),
          updatedBy: adminNameVal,
          reason: reasonText
        }
      ];

      const updatedCancelInfo = {
        isCancelled: newStatus === 'cancelled',
        cancelledBy: 'admin',
        cancelledByName: adminNameVal,
        reason: newStatus === 'cancelled' ? cancelReason : ''
      };

      await updateDoc(orderRef, {
        status: newStatus,
        statusHistory: updatedHistory,
        cancelInfo: updatedCancelInfo
      });

      const updatedOrders = orders.map(ord => {
        if (ord.id === selectedOrder.id) {
          return {
            ...ord,
            status: newStatus,
            statusHistory: updatedHistory,
            cancelInfo: updatedCancelInfo
          };
        }
        return ord;
      });

      setOrders(updatedOrders);
      setSelectedOrder(null);
      setNewStatus('');
      setCancelReason('');
      
      setModalAlert({
        isOpen: true,
        title: 'تم بنجاح',
        message: 'تم تحديث حالة الطلب بنجاح!',
        type: 'success'
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      setModalAlert({
        isOpen: true,
        title: 'خطأ',
        message: 'حدث خطأ أثناء تحديث الحالة.',
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!isSuperAdmin) {
      setModalAlert({
        isOpen: true,
        title: 'صلاحية محدودة',
        message: 'عذراً، حذف الطلبات مخصص للمسؤول الرئيسي (Super Admin) فقط.',
        type: 'warning'
      });
      return;
    }
    
    // استخدام البوكس المخصص بدلاً من window.confirm
    setModalAlert({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا الطلب نهائياً؟',
      type: 'warning',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'orders', orderId));
          setOrders(orders.filter(ord => ord.id !== orderId));
          setModalAlert({
            isOpen: true,
            title: 'تم الحذف',
            message: 'تم حذف الطلب بنجاح.',
            type: 'success'
          });
        } catch (error) {
          console.error("Error deleting order:", error);
          setModalAlert({
            isOpen: true,
            title: 'خطأ',
            message: 'حدث خطأ أثناء الحذف.',
            type: 'error'
          });
        }
      }
    });
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4" dir="rtl">
        <div className="bg-background border border-border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-black mb-2">منطقة محظورة</h1>
          <p className="text-sm text-foreground/70 mb-2">عذراً، الحساب ({user?.email || 'غير معروف'}) لا يمتلك صلاحية الدخول.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-secondary/25 hover:bg-secondary/35 text-foreground font-bold py-3 px-4 rounded-xl transition-all cursor-pointer mt-4"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, cancelInfo?: any) => {
    if (cancelInfo?.isCancelled || status === 'cancelled') {
      return (
        <div className="space-y-0.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 inline-block">ملغي</span>
          {cancelInfo?.cancelledByName && (
            <p className="text-[10px] text-foreground/60">بواسطة: <span className="font-bold text-red-500">{cancelInfo.cancelledByName}</span></p>
          )}
        </div>
      );
    }
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">قيد الانتظار</span>;
      case 'preparing':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">قيد التحضير</span>;
      case 'delivering':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">جاري الشحن</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">مكتمل</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/20 text-foreground/70">{status}</span>;
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-background border border-border/70 p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3.5 bg-sky-500/10 text-sky-500 rounded-2xl border border-sky-500/20">
              <Package size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">لوحة تحكم الطلبات</h1>
              <p className="text-xs text-foreground/60 mt-0.5">
                مسجل الدخول: <span className="font-bold text-sky-500">{user?.email}</span> 
                <span className={`ms-2 px-2.5 py-0.5 rounded-full text-[10px] font-black ${isSuperAdmin ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'}`}>
                  {isSuperAdmin ? 'مسؤول رئيسي (Super Admin - صلاحية كاملة وتعديل)' : 'مشرف (Admin - عرض ومتابعة فقط)'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-sky-500/10 text-sky-500 px-3 py-1.5 rounded-xl border border-sky-500/20">
              إجمالي الطلبات: {orders.length}
            </span>
            <button 
              onClick={fetchOrders}
              className="bg-secondary/20 hover:bg-secondary/30 text-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-border"
            >
              تحديث
            </button>
          </div>
        </header>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-8 relative">
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground/40 pointer-events-none">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم، رقم الهاتف، أو كود الطلب..."
              className="w-full pr-11 pl-4 py-3 rounded-2xl border border-border/80 bg-secondary/5 text-foreground text-sm outline-none"
            />
          </div>
          
          <div className="md:col-span-4 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-border/80 bg-black text-white text-sm outline-none cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-black text-white">كل الحالات</option>
              <option value="pending" className="bg-black text-white">قيد الانتظار</option>
              <option value="preparing" className="bg-black text-white">قيد التحضير</option>
              <option value="delivering" className="bg-black text-white">جاري الشحن</option>
              <option value="completed" className="bg-black text-white">مكتمل</option>
              <option value="cancelled" className="bg-black text-white">ملغي</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-background border border-border/70 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-secondary/10 border-b border-border text-foreground/70 uppercase text-xs font-black">
                <tr>
                  <th className="py-4 px-6">كود الطلب</th>
                  <th className="py-4 px-6">العميل</th>
                  <th className="py-4 px-6">الهاتف والعنوان</th>
                  <th className="py-4 px-6">المبلغ</th>
                  <th className="py-4 px-6">الحالة</th>
                  <th className="py-4 px-6 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/5 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-bold text-sky-500">
                        #{order.id.slice(0, 8)}...
                      </td>
                      <td className="py-4 px-6 font-bold text-foreground">
                        {order.customerName}
                      </td>
                      <td className="py-4 px-6 text-xs text-foreground/85 space-y-1">
                        <div className="flex items-center gap-1.5"><Phone size={14} className="text-sky-500" /> {order.phone}</div>
                        <div className="flex items-center gap-1.5 truncate max-w-xs"><MapPin size={14} className="text-sky-500 shrink-0" /> <span className="truncate">{order.address}</span></div>
                      </td>
                      <td className="py-4 px-6 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {order.totalAmount} ج.م
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status, order.cancelInfo)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setCancelReason(order.cancelInfo?.reason || '');
                            }}
                            className="p-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-xl transition-all cursor-pointer"
                            title="عرض التفاصيل للمتابعة"
                          >
                            <Eye size={16} />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all cursor-pointer"
                              title="حذف نهائي"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                    </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-foreground/50 text-sm">
                    لا توجد طلبات مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    {/* Modal تفاصيل الطلب وسجل المتابعة */}
    {selectedOrder && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
        <div className="bg-black border border-white/20 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
          
          <button 
            onClick={() => setSelectedOrder(null)}
            className="absolute top-5 start-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer transition-all"
          >
            <X size={18} />
          </button>

          <h3 className="text-xl font-black mb-5 text-white tracking-wide">تفاصيل الطلب وسجل المتابعة</h3>

          {/* تفاصيل العميل الأساسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-zinc-900 border border-white/10 text-xs">
            <div>
              <span className="text-white/60 block mb-1">العميل صاحب الطلب</span>
              <span className="font-bold text-white text-sm">{selectedOrder.customerName}</span>
            </div>
            <div>
              <span className="text-white/60 block mb-1">الهاتف</span>
              <span className="font-bold text-white text-sm">{selectedOrder.phone}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-white/60 block mb-1">العنوان</span>
              <span className="font-bold text-white text-sm">{selectedOrder.address}</span>
            </div>
          </div>

          {/* قائمة المنتجات */}
          <div className="mb-6">
            <h4 className="text-sm font-black mb-3 text-white/90">المنتجات:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-zinc-900 border border-white/10">
                  <span className="font-bold truncate max-w-[200px] text-white">{item.title} (الكمية: {item.quantity})</span>
                  <span className="font-black text-emerald-400">{item.price * item.quantity} ج.م</span>
                </div>
              ))}
            </div>
          </div>

          {/* سجل أحداث الطلب وسبب الإلغاء ومن قام به */}
          <div className="mb-6">
            <h4 className="text-sm font-black mb-3 text-white/90">سجل أحداث الطلب (Timeline):</h4>
            <div className="space-y-2 p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs">
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                selectedOrder.statusHistory.map((hist, index) => (
                  <div key={index} className="flex items-start gap-2.5 pb-2.5 border-b border-white/10 last:border-none">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${hist.status === 'cancelled' ? 'bg-red-500' : 'bg-sky-400'}`}></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase">الحالة: {hist.status}</span>
                        <span className="text-[10px] text-white/50">
                          {hist.updatedAt?.toDate ? new Date(hist.updatedAt.toDate()).toLocaleString('ar-EG') : 'حديث'}
                        </span>
                      </div>
                      <p className="text-white/80 text-[11px] mt-1 font-medium bg-black/40 p-2 rounded-lg border border-white/5">
                          {hist.reason || `تم التحديث بواسطة: ${hist.updatedBy || 'النظام'}`}
                      </p>
                      {hist.updatedBy && (
                        <span className="text-[10px] text-sky-400 block mt-1">👤 بواسطة المستخدم/المسؤول: {hist.updatedBy}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-center py-2">لا يوجد سجل تاريخي.</p>
              )}
          </div>
        </div>

        {/* قسم التعديل أو التنبيه للمشرف */}
        <div className="border-t border-white/15 pt-4 space-y-4">
          <h4 className="text-sm font-black text-white">إدارة الطلب:</h4>
           
          {!isSuperAdmin ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl font-medium">
              🔒 أنت مسجل كـ **مشرف (Admin)**: يمكنك متابعة الطلبات، قراءة من ألغى الطلب والسبب، وعرض التفاصيل بالكامل.
            </div>
          ) : (
            <form onSubmit={handleUpdateOrderStatus} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/25 bg-black text-white text-xs outline-none cursor-pointer"
                >
                  <option value="pending" className="bg-black text-white">قيد الانتظار</option>
                  <option value="preparing" className="bg-black text-white">قيد التحضير</option>
                  <option value="delivering" className="bg-black text-white">جاري الشحن</option>
                  <option value="completed" className="bg-black text-white">مكتمل</option>
                  <option value="cancelled" className="bg-black text-white">إلغاء الطلب</option>
                </select>

                {newStatus === 'cancelled' && (
                  <input 
                    type="text"
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="اكتب سبب الإلغاء هنا..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-red-500/50 bg-black text-white text-xs outline-none placeholder:text-white/40"
                  />
                )}
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-sky-500/20"
            >
              {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
          )}

          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/20 cursor-pointer transition-all"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  )}

  {/* مودال الرسائل والتنبيهات المخصص (Custom Alert Box) - أسود بالكامل ونصوص بيضاء */}
  {modalAlert.isOpen && (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => setModalAlert(prev => ({ ...prev, isOpen: false }))}
    >
      <div 
        className="bg-black border border-white/25 text-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => setModalAlert(prev => ({ ...prev, isOpen: false }))}
          className="absolute top-4 start-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer transition-all"
        >
          <X size={16} />
        </button>

        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${
          modalAlert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
          modalAlert.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
          'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          <CheckCircle2 size={28} />
        </div>

        <h3 className="text-lg font-black mb-2 text-white">{modalAlert.title}</h3>
        <p className="text-xs text-white/70 mb-6 leading-relaxed">{modalAlert.message}</p>

        <div className="flex gap-2">
          {modalAlert.onConfirm ? (
            <>
              <button
                onClick={() => {
                  modalAlert.onConfirm?.();
                  setModalAlert(prev => ({ ...prev, isOpen: false }));
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setModalAlert(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer border border-white/20"
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              onClick={() => setModalAlert(prev => ({ ...prev, isOpen: false }))}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-sky-500/20"
            >
              موافق
            </button>
          )}
        </div>
      </div>
    </div>
  )}
    </main>
  );
}