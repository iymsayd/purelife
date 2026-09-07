'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Users, ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, UserX, Search, ArrowUpDown, Filter, ChevronRight, ChevronLeft } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: string;
  isBanned?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  rawCreatedAt: number;
}

type SortOption = 'newest' | 'oldest' | 'nameAsc' | 'nameDesc';
type RoleFilterOption = 'all' | 'user' | 'moderator' | 'admin' | 'super_admin';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'banned'>('active');

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [roleFilter, setRoleFilter] = useState<RoleFilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  // جلب كل المستخدمين مرة واحدة لتجنب أي مشاكل فهارس (Indexes) مع Firestore
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList: UserData[] = [];

      querySnapshot.forEach((document) => {
        const data = document.data();
        if (!data.email || data.email.trim() === '') return;

        const rawTime = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || 0);
        const isGoogleProvider = data.provider === 'google' || data.email?.includes('gmail.com');
        const determinedVerified = isGoogleProvider || data.isVerified === true || data.emailVerified === true;

        usersList.push({
          id: document.id,
          email: data.email,
          name: data.name || data.displayName || 'مستخدم',
          username: data.username || '',
          role: data.role || 'user',
          isBanned: data.isBanned === true,
          isVerified: determinedVerified,
          createdAt: rawTime ? new Date(rawTime).toLocaleDateString('ar-EG') : 'حديث',
          rawCreatedAt: rawTime
        });
      });

      setAllUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setMessage({ text: 'فشل جلب بيانات المستخدمين.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    let isMounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (user) {
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
          if (!isMounted) return;
          if (!docSnap.exists() || docSnap.data()?.isBanned === true) {
            await signOut(auth);
            if (isMounted) window.location.href = '/login';
          }
        });

        // جلب دور المستخدم الحالي
        const currentUserDocSnap = await getDocs(query(collection(db, 'users'), limit(100)));
        currentUserDocSnap.forEach(d => {
          if (d.id === user.uid) {
            setCurrentUserRole(d.data().role || 'user');
          }
        });

        fetchAllUsers();
      } else {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [fetchAllUsers]);

  // إجماليات الأعداد الحقيقية
  const totalActiveCount = useMemo(() => {
    return allUsers.filter(u => !u.isBanned).length;
  }, [allUsers]);

  const totalBannedCount = useMemo(() => {
    return allUsers.filter(u => u.isBanned).length;
  }, [allUsers]);

  // تصفية، بحث، وترتيب البيانات محلياً بشكل شامل وصحيح
  const processedUsers = useMemo(() => {
    let result = [...allUsers];

    // 1. فلترة التبويب (نشط / محظور)
    const isBannedTarget = activeTab === 'banned';
    result = result.filter(u => !!u.isBanned === isBannedTarget);

    // 2. فلترة الدور إذا لم يكن 'all'
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // 3. البحث النصي (الاسم، البريد، اسم المستخدم)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q))
      );
    }

    // 4. الترتيب
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.rawCreatedAt - a.rawCreatedAt;
      } else if (sortBy === 'oldest') {
        return a.rawCreatedAt - b.rawCreatedAt;
      } else if (sortBy === 'nameAsc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'nameDesc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    return result;
  }, [allUsers, activeTab, roleFilter, searchQuery, sortBy]);

  // حساب الصفحات (Pagination) بناءً على النتائج المفلترة بالكامل
  const totalPages = Math.ceil(processedUsers.length / PAGE_SIZE) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedUsers.slice(start, start + PAGE_SIZE);
  }, [processedUsers, currentPage]);

  const handleTabChange = (tab: 'active' | 'banned') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (newRoleFilter: RoleFilterOption) => {
    setRoleFilter(newRoleFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const executeRoleChange = async () => {
    if (currentUserRole !== 'super_admin') {
      setMessage({ text: 'عذراً، المسؤول الرئيسي فقط هو من يمكنه تغيير أدوار المستخدمين.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' });
      return;
    }

    const { userId, newRole } = confirmModal;
    if (!newRole) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await fetchAllUsers();
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
    if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
      setMessage({ text: 'عذراً، المشرفون لا يملكون صلاحية حظر أو إلغاء حظر المستخدمين.', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' });
      return;
    }

    const { userId, currentBanStatus } = confirmModal;
    const newBanState = !currentBanStatus;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isBanned: newBanState,
        role: newBanState ? 'banned' : 'user'
      });

      await fetchAllUsers();

      if (newBanState && auth.currentUser && auth.currentUser.uid === userId) {
        await signOut(auth);
        window.location.href = '/login';
        return;
      }

      setMessage({ 
        text: newBanState ? 'تم حظر المستخدم بنجاح ونقله لقائمة الحسابات المحظورة.' : 'تم رفع الحظر عن المستخدم ونقله للمستخدمين النشطين.', 
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative px-3 sm:px-6 py-6 overflow-x-hidden text-foreground bg-background" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 sm:p-8 rounded-3xl border border-border/80 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0ea5e9] flex items-center gap-3 tracking-tight flex-wrap">
            <Users size={28} className="shrink-0" />
            <span>إدارة المستخدمين والصلاحيات</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            إدارة الحسابات النشطة والمحظورة والتحكم الكامل في الأدوار بمرونة وسلاسة.
          </p>
        </div>
        <div className="text-xs bg-[#0ea5e9]/10 text-[#0ea5e9] dark:text-sky-400 px-4 py-2.5 rounded-2xl font-black border border-[#0ea5e9]/20 self-start md:self-auto shrink-0 shadow-xs">
          صلاحيتك الحالية: <span className="uppercase">{currentUserRole}</span>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-md'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span className="break-all">{message.text}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-card text-card-foreground p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs space-y-4">
        
        {/* Row 1: Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            onClick={() => handleTabChange('active')}
            className={`w-full px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-between border ${
              activeTab === 'active'
                ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-[#0ea5e9]/20'
                : 'bg-background text-foreground border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="shrink-0" />
              <span>المستخدمين النشطين</span>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              إجمالي العدد: {totalActiveCount}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('banned')}
            className={`w-full px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-between border ${
              activeTab === 'banned'
                ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-lg shadow-[#0ea5e9]/20'
                : 'bg-background text-foreground border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserX size={18} className="shrink-0" />
              <span>الحسابات المحظورة</span>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${activeTab === 'banned' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              إجمالي العدد: {totalBannedCount}
            </span>
          </button>
        </div>

        {/* Row 2: Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <div className="flex items-center gap-2 bg-background text-foreground px-4 py-3 rounded-2xl border border-border shadow-xs w-full">
            <Filter size={16} className="text-[#0ea5e9] shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value as RoleFilterOption)}
              className="bg-transparent text-foreground text-xs font-bold outline-none cursor-pointer w-full py-1.5 px-2 rounded-xl"
            >
              <option value="all" className="bg-background text-foreground">كل الأدوار</option>
              <option value="user" className="bg-background text-foreground">مستخدم عادي</option>
              <option value="moderator" className="bg-background text-foreground">مشرف</option>
              <option value="admin" className="bg-background text-foreground">مسؤول (Admin)</option>
              <option value="super_admin" className="bg-background text-foreground">مسؤول رئيسي</option>
            </select>
          </div>

          <div className="relative w-full">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث شامل بالاسم أو البريد..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-background text-foreground pr-10 pl-4 py-3 rounded-2xl text-xs font-bold border border-border outline-none focus:border-[#0ea5e9] transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-background text-foreground px-4 py-3 rounded-2xl border border-border shadow-xs w-full">
            <ArrowUpDown size={16} className="text-[#0ea5e9] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-foreground text-xs font-bold outline-none cursor-pointer w-full py-1.5 px-2 rounded-xl"
            >
              <option value="newest" className="bg-background text-foreground">الأحدث انضماماً</option>
              <option value="oldest" className="bg-background text-foreground">الأقدم انضماماً</option>
              <option value="nameAsc" className="bg-background text-foreground">الاسم أبجدياً (أ-ي)</option>
              <option value="nameDesc" className="bg-background text-foreground">الاسم أبجدياً (ي-أ)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="bg-card text-card-foreground rounded-3xl border border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground text-xs font-black uppercase tracking-wider bg-muted/20">
                <th className="p-4 md:px-6">المستخدم</th>
                <th className="p-4 md:px-6">البريد الإلكتروني</th>
                <th className="p-4 md:px-6">تاريخ الانضمام</th>
                <th className="p-4 md:px-6">حالة التفعيل</th>
                <th className="p-4 md:px-6">الصلاحية / الدور</th>
                <th className="p-4 md:px-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-bold animate-pulse">
                    جاري تحميل البيانات...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-bold">
                    لا توجد حسابات مطابقة للفلتر أو البحث المختار حالياً.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 md:px-6 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="truncate max-w-[150px] sm:max-w-xs">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 md:px-6 text-muted-foreground truncate max-w-[180px] sm:max-w-xs" dir="ltr">{u.email}</td>
                    <td className="p-4 md:px-6 text-muted-foreground whitespace-nowrap">{u.createdAt}</td>
                    
                    <td className="p-4 md:px-6 whitespace-nowrap">
                      <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${
                        u.isVerified 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {u.isVerified ? 'مفعل' : 'غير مفعل'}
                      </span>
                    </td>

                    <td className="p-4 md:px-6 whitespace-nowrap">
                      {activeTab === 'banned' ? (
                        <span className="inline-block px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs">
                          محظور (Banned)
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={currentUserRole !== 'super_admin'}
                          onChange={(e) => {
                            if (currentUserRole !== 'super_admin') {
                              setMessage({ text: 'عذراً، المسؤول الرئيسي فقط هو من يمكنه تغيير الأدوار.', type: 'error' });
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
                          <option value="user" className="bg-background text-foreground">مستخدم عادي (User)</option>
                          <option value="moderator" className="bg-background text-foreground">مشرف (Moderator)</option>
                          <option value="admin" className="bg-background text-foreground">مسؤول (Admin)</option>
                          <option value="super_admin" className="bg-background text-foreground">مسؤول رئيسي</option>
                        </select>
                      )}
                    </td>

                    <td className="p-4 md:px-6 text-center whitespace-nowrap">
                      {currentUserRole === 'moderator' ? (
                        <span className="text-xs text-muted-foreground font-semibold">غير مسموح</span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
                                setMessage({ text: 'عذراً، لا تمتلك صلاحية تنفيذ الحظر.', type: 'error' });
                                return;
                              }
                              setConfirmModal({
                                isOpen: true,
                                type: 'toggleBan',
                                userId: u.id,
                                targetName: u.name || u.email,
                                currentBanStatus: u.isBanned
                              });
                            }}
                            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs ${
                              u.isBanned 
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                            title={u.isBanned ? "إلغاء الحظر وتفعيل الحساب" : "حظر المستخدم"}
                          >
                            {u.isBanned ? <ShieldCheck size={16} className="shrink-0" /> : <ShieldAlert size={16} className="shrink-0" />}
                            <span>{u.isBanned ? 'إلغاء الحظر' : 'حظر'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 bg-muted/10 border-t border-border/60">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-background border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-muted/50 transition"
          >
            <ChevronRight size={16} />
            <span>السابق</span>
          </button>

          <span className="text-xs font-black text-muted-foreground">
            الصفحة {currentPage} من {totalPages || 1}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-background border border-border text-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-muted/50 transition"
          >
            <span>التالي</span>
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {confirmModal.isOpen && (
        <div 
          onClick={() => setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' })}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-card text-card-foreground rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-border relative space-y-5"
          >
            <button 
              onClick={() => setConfirmModal({ isOpen: false, type: null, userId: '', targetName: '' })}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground font-bold text-sm transition cursor-pointer shadow-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 text-amber-500 font-black text-lg">
              <AlertTriangle size={24} className="shrink-0" />
              <span>تأكيد الإجراء</span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium break-words">
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmModal.type === 'toggleBan' ? executeToggleBan : executeRoleChange}
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