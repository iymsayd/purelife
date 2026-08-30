'use client';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const dict = {
  subTitle: "متجر بيورلايف",
  title: "منتجاتنا الحصرية",
  description: "استكشف أحدث منقيات المياه والتكييفات وقطع الغيار الأصلية بأفضل الأسعار.",
  searchPlaceholder: "ابحث بالاسم...",
  allProducts: "كل المنتجات",
  filtersCategory: "الفلاتر",
  airConditionersCategory: "التكييفات",
  filtersPartsCategory: "قطع غيار فلاتر",
  acPartsCategory: "قطع غيار تكييفات",
  brand: "الماركة",
  aquajet: "اكواجيت",
  panasonic: "باناسونيك",
  sharp: "شارب",
  carrier: "كاريير",
  stages: "المراحل",
  stagesFormat: "{n} مرحلة",
  sterilization: "التعقيم",
  uv: "فوق بنفسجية (UV)",
  ir: "أشعة تحت حمراء (IR)",
  filtrationType: "نوع التصفية",
  filtrationAndPurification: "فلترة وتحلية",
  filtrationOnly: "فلترة فقط",
  origin: "بلد المنشأ",
  egyptian: "مصري",
  imported: "مستورد",
  malaysian: "ماليزي",
  chinese: "صيني",
  power: "القدرة (حصان)",
  cooling: "التبريد",
  cool: "بارد",
  coolHot: "بارد/ساخن",
  deviceType: "نوع الجهاز",
  wallMounted: "حائطي",
  ceilingFloor: "سقفي / أرضي",
  standing: "دولابي",
  cassette: "كست (سقف مستعار)",
  searchAndFilter: "بحث وتصفية",
  sidebarCategory: "الفئة",
  priceSortTitle: "ترتيب حسب السعر",
  highestPrice: "الأعلى سعراً",
  lowestPrice: "الأقل سعراً",
  ratingSortTitle: "ترتيب حسب التقييم",
  stars5: "★★★★★ (5 نجوم)",
  stars4: "★★★★☆ (4 نجوم وأكثر)",
  stars3: "★★★☆☆ (3 نجوم وأكثر)",
  stars2: "★★☆☆☆ (نجمتان وأكثر)",
  stars1: "★☆☆☆☆ (نجمة واحدة)",
  clearFilters: "مسح جميع الفلاتر",
  noProducts: "عذراً، لا توجد منتجات تطابق بحثك أو الفلاتر المحددة.",
  productsCount: "منتجاتنا",
  details: "تفاصيل",
  addToCart: "اضافة للسلة",
  added: "تمت الإضافة ✓",
  quantity: "الكمية:",
  remove: "إزالة 🗑️",
  type: "النوع:",
  brandLabel: "الماركة:",
  callForPrice: "اتصل للسعر",
  cartTitle: "السلة",
  clearAll: "مسح الكل",
  emptyCart: "السلة فارغة 🛒",
  total: "الإجمالي",
  checkout: "إتمام الشراء",
  quantityAlertTitle: "تنبيه الكمية",
  quantityAlertDesc: "عذراً، الحد الأقص لكل منتج هو 10 قطع. للطلبات الكبيرة يرجى التواصل معنا.",
  close: "إغلاق"
};

const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cart') {
        try {
          const newCart = event.newValue ? JSON.parse(event.newValue) : [];
          setCartItems(newCart);
        } catch (error) {
          console.error("Error parsing cart from storage event:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateAndSaveCart = (newItems: any[]) => {
    setCartItems(newItems);
    try {
      localStorage.setItem('cart', JSON.stringify(newItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  };

  const totalAmount = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0), 
  [cartItems]);

  const addToCart = (product: any) => {
    if (!product?.id) return;
    
    const titleAr = product.nameAr || product.title || 'منتج بدون اسم';
    const itemType = product.type || (product.isUsed ? 'used' : undefined);
    const isUsedValue = itemType === 'used';

    const existingIndex = cartItems.findIndex(
      item => String(item.id) === String(product.id) && 
              ((item.type || (item.isUsed ? 'used' : undefined)) === (itemType || undefined))
    );
    
    if (existingIndex > -1 && cartItems[existingIndex].quantity >= 10) {
      setShowModal(true);
      return;
    }

    let updated;
    if (existingIndex > -1) {
      updated = cartItems.map((item, i) => 
        i === existingIndex ? { ...item, quantity: item.quantity + 1, titleAr, type: itemType, isUsed: isUsedValue } : item
      );
    } else {
      updated = [...cartItems, { 
        ...product, 
        titleAr, 
        quantity: 1, 
        type: itemType, 
        isUsed: isUsedValue 
      }];
    }

    updateAndSaveCart(updated);
  };

  const increaseQuantity = (id: string, type?: string) => {
    const item = cartItems.find(i => String(i.id) === String(id) && ((i.type || (i.isUsed ? 'used' : undefined)) === (type || undefined)));
    if (item && item.quantity >= 10) {
      setShowModal(true);
      return;
    }
    const updated = cartItems.map(i => 
      String(i.id) === String(id) && ((i.type || (i.isUsed ? 'used' : undefined)) === (type || undefined)) 
        ? { ...i, quantity: i.quantity + 1 } 
        : i
    );
    updateAndSaveCart(updated);
  };

  const decreaseQuantity = (id: string, type?: string) => {
    const updated = cartItems.map(i => 
      String(i.id) === String(id) && ((i.type || (i.isUsed ? 'used' : undefined)) === (type || undefined)) 
        ? { ...i, quantity: Math.max(1, i.quantity - 1) } 
        : i
    );
    updateAndSaveCart(updated);
  };

  const removeFromCart = (id: string, type?: string) => {
    const updated = cartItems.filter(p => !(String(p.id) === String(id) && ((p.type || (p.isUsed ? 'used' : undefined)) === (type || undefined))));
    updateAndSaveCart(updated);
  };

  const clearCart = () => { 
    setCartItems([]); 
    try {
      localStorage.removeItem('cart'); 
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, increaseQuantity, removeFromCart, decreaseQuantity, clearCart, totalAmount, showModal, setShowModal, isMounted, dict }}>
      {children}
      {isMounted && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} dir="rtl">
          <div className="bg-[var(--card)] border border-[var(--border)] p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black mb-3 text-[var(--foreground)]">{dict.quantityAlertTitle}</h2>
            <p className="text-[var(--foreground)]/70 mb-6 text-sm leading-relaxed">{dict.quantityAlertDesc}</p>
            <button onClick={() => setShowModal(false)} className="w-full bg-[var(--secondary)] text-white py-3.5 rounded-2xl font-black cursor-pointer hover:opacity-95 transition-all shadow-md">{dict.close}</button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    return {
      cartItems: [],
      addToCart: () => {},
      increaseQuantity: () => {},
      decreaseQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      totalAmount: 0,
      showModal: false,
      setShowModal: () => {},
      isMounted: false,
      dict
    };
  }
  return context;
};