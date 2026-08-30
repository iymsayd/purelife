'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Users, ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, UserX } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: string;
  isBanned?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'banned'>('active');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'role' | 'toggleBan' | null;
    userId: string;
    targetName: string;
    newRole?: string;
    currentBanStatus?: boolean;
  }>({
    isOpen: false,
    type: null,
    userId: '',
    targetName: '',
  });

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
          if (!docSnap.exists() || docSnap.data()?.isBanned === true) {
            await signOut(auth);
            window.location.href = '/login';
          }
        });

        const currentDoc = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        
        currentDoc.forEach((document) => {
          const data = document.data();
          
          if (!data.email || data.email.trim() === '') {
            return;
          }

          if (document.id === user.uid) {
            setCurrentUserRole(data.role || 'user');
          }

          // اعتبار المستخدم مفعل افتراضياً طالما أنه مسجل دخول ولا يوجد حقل صريح يمنعه
          const isGoogleProvider = data.provider === 'google' || data.emailVerified === true;
          const verifiedStatus = data.isVerified === true || isGoogleProvider || data.isVerified === undefined;

          usersList.push({
            id: document.id,
            email: data.email,
            name: data.name || data.displayName || 'مستخدم',
            username: data.username || '',
            role: data.role || 'user',
            isBanned: data.isBanned || false,
            isVerified: verifiedStatus,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'حديث'
          });
        });

        setUsers(usersList);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const executeRoleChange = async () => {
    const { userId, newRole } = confirmModal;
    if (!newRole) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage({ text: 'تم تحديث صلاحية المستخدم بنجاح.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'حدث خطأ أثناء التحديث.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
    }
    setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' });
  };

  const executeToggleBan = async () => {
    const { userId, currentBanStatus } = confirmModal;
    const newBanState = !currentBanStatus;

    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isBanned: newBanState,
        role: newBanState ? 'banned' : 'user'
      });

      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: newBanState, role: newBanState ? 'banned' : 'user' } : u));

      if (newBanState && auth.currentUser && auth.currentUser.uid === userId) {
        await signOut(auth);
        window.location.href = '/login';
        return;
      }

      setMessage({ 
        text: newBanState ? 'تم حظر المستخدم بنجاح مع الاحتفاظ ببياناته.' : 'تم رفع الحظر عن المستخدم وإعادة تفعيل حسابه بنجاح.', 
        type: 'success' 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'فشل تنفيذ إجراء الحظر.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
    }
    setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' });
  };

  // تصفية المستخدمين بناءً على التبويب المختار (النشطين والمحظورين فقط)
  const filteredUsers = users.filter(u => {
    if (activeTab === 'banned') return u.isBanned === true;
    return !u.isBanned;
  });

  if (loading) {
    return (
      <div className="bg-card text-card-foreground rounded-3xl p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-[#0ea5e9] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-muted-foreground animate-pulse">جاري تحميل قائمة المستخدمين...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 sm:p-8 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0ea5e9] flex items-center gap-3 tracking-tight">
            <Users size={32} />
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1">
            إدارة الحسابات النشطة والمحظورة للتحكم الكامل فيها.
          </p>
        </div>
        <div className="text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] px-4 py-2.5 rounded-2xl font-black border border-[#0ea5e9]/20 self-start md:self-auto">
          صلاحيتك الحالية: <span className="uppercase">{currentUserRole}</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-md'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* شريط التنقل بين التبويبات (Tabs) - تبويبين فقط */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
            activeTab === 'active'
              ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-[#0ea5e9]/20'
              : 'bg-card text-card-foreground border-border hover:bg-muted/50'
          }`}
        >
          <ShieldCheck size={18} />
          <span>المستخدمين النشطين ({users.filter(u => !u.isBanned).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banned')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
            activeTab === 'banned'
              ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-[#0ea5e9]/20'
              : 'bg-card text-card-foreground border-border hover:bg-muted/50'
          }`}
        >
          <UserX size={18} />
          <span>الحسابات المحظورة ({users.filter(u => u.isBanned === true).length})</span>
        </button>
      </div>

      <div className="bg-card text-card-foreground rounded-3xl border border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground text-xs font-black uppercase tracking-wider bg-muted/20">
                <th className="p-4 md:px-6">المستخدم</th>
                <th className="p-4 md:px-6">البريد الإلكتروني</th>
                <th className="p-4 md:px-6">تاريخ الانضمام</th>
                <th className="p-4 md:px-6">الصلاحية / الحالة</th>
                <th className="p-4 md:px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-bold">
                    لا توجد حسابات في هذا القسم حالياً.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 md:px-6 font-bold text-foreground flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-black text-xs">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-4 md:px-6 text-muted-foreground" dir="ltr">{u.email}</td>
                    <td className="p-4 md:px-6 text-muted-foreground">{u.createdAt}</td>
                    
                    <td className="p-4 md:px-6">
                      {activeTab === 'banned' ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          محظور (Banned)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={currentUserRole !== 'admin' && currentUserRole !== 'super_admin'}
                          onChange={(e) => {
                            if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
                              setMessage({ text: 'عذراً، ليس لديك صلاحية لتعديل الأدوار.', type: 'error' });
                              return;
                            }
                            setConfirmModal({
                              isOpen: true,
                              type: 'role',
                              userId: u.id,
                              targetName: u.name || u.email,
                              newRole: e.target.value
                            });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none transition-all cursor-pointer shadow-xs ${
                            u.role === 'admin' || u.role === 'super_admin'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                              : u.role === 'moderator'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">مستخدم عادي (User)</option>
                          <option value="moderator" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">مشرف (Moderator)</option>
                          <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">مسؤول (Admin)</option>
                        </select>
                      )}
                    </td>

                    <td className="p-4 md:px-6 text-center">
                      {(currentUserRole === 'admin' || currentUserRole === 'super_admin') ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setConfirmModal({
                              isOpen: true,
                              type: 'toggleBan',
                              userId: u.id,
                              targetName: u.name || u.email,
                              currentBanStatus: u.isBanned
                            })}
                            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
                              u.isBanned 
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                            title={u.isBanned ? "إلغاء الحظر وتفعيل الحساب" : "حظر المستخدم"}
                          >
                            {u.isBanned ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                            <span>{u.isBanned ? 'إلغاء الحظر' : 'حظر'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">غير مسموح</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmModal.isOpen && (
        <div 
          onClick={() => setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' })}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-800 relative space-y-5"
          >
            <button 
              onClick={() => setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' })}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
              <AlertTriangle size={24} />
              <span>تأكيد الإجراء</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {confirmModal.type === 'toggleBan' 
                ? (confirmModal.currentBanStatus 
                    ? `هل أنت متأكد من رغبتك في رفع الحظر عن المستخدم (${confirmModal.targetName}) وإعادة تفعيل حسابه؟`
                    : `هل أنت متأكد من رغبتك في حظر المستخدم (${confirmModal.targetName})؟ سيتم منعه من الدخول فوراً مع الاحتفاظ ببياناته.`)
                : `هل أنت متأكد من تغيير صلاحية المستخدم (${confirmModal.targetName}) إلى (${confirmModal.newRole?.toUpperCase()})؟`
              }
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' })}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={
                  confirmModal.type === 'toggleBan' 
                    ? executeToggleBan 
                    : executeRoleChange
                }
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                  confirmModal.type === 'toggleBan' && !confirmModal.currentBanStatus
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : confirmModal.type === 'toggleBan' && confirmModal.currentBanStatus
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-[#0ea5e9] hover:bg-[#0284c7] shadow-[#0ea5e9]/20'
                }`}
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}