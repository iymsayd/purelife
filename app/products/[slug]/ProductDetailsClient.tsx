'use client';
import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

const dict = {
  description: "وصف المنتج:",
  addToCart: "اضافة للسلة",
  added: "تمت الإضافة بنجاح! ✅",
  addedCartCheck: "تمت الإضافة للسلة بنجاح ✓",
  quantity: "الكمية:",
  remove: "إزالة من السلة 🗑️",
  cartQuantityLabel: "عدد هذا المنتج في سلتك:",
  cartTotalLabel: "إجمالي السلة:",
  callForPrice: "اتصل للسعر"
};

interface Product {
  id: string;
  nameAr?: string;
  titleAr?: string;
  title?: string;
  name?: string;
  descriptionAr?: string;
  descAr?: string;
  description?: string;
  desc?: string;
  category?: string;
  origin?: string;
  brand?: string;
  power?: string | number;
  deviceType?: string;
  cooling?: string;
  stages?: string | number;
  filtrationType?: string;
  sterilization?: string;
  price?: number | string;
  image?: string;
  createdAt?: string | null;
  [key: string]: any;
}

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, cartItems } = useCart();
  const [showAdded, setShowAdded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayTitle = product.nameAr || product.titleAr || product.title || product.name || '';
  const displayDesc = product.descriptionAr || product.descAr || product.description || '';
  
  const getProductDetails = () => {
    const category = product.category || "";
    
    if (category === "قطع غيار فلاتر" || category === "قطع غيار تكييفات") {
      return [
        { label: "الفئة:", value: category },
        { label: "بلد المنشأ:", value: product.origin }
      ];
    } else if (category === "تكييفات") {
      return [
        { label: "الفئة:", value: "تكييفات" },
        { label: "الماركة:", value: product.brand },
        { label: "القدرة:", value: product.power ? `${product.power} حصان` : null },
        { label: "نوع الجهاز:", value: product.deviceType },
        { label: "نظام التبريد:", value: product.cooling },
        { label: "بلد المنشأ:", value: product.origin }
      ];
    } else {
      // الافتراضي للفلاتر
      return [
        { label: "الفئة:", value: "فلاتر" },
        { label: "الماركة:", value: product.brand },
        { label: "عدد المراحل:", value: product.stages },
        { label: "نوع التصفية:", value: product.filtrationType },
        { label: "نظام التعقيم:", value: product.sterilization },
        { label: "بلد المنشأ:", value: product.origin }
      ];
    }
  };

  const details = getProductDetails().filter(d => d.value);

  const safeCart = Array.isArray(cartItems) ? cartItems : [];
  const cartItem = isMounted ? safeCart.find((item: any) => String(item?.id) === String(product?.id) && (!item?.type || item?.type === 'new')) : null;
  const isAdded = !!cartItem;
  const cartItemCount = cartItem ? cartItem.quantity : 0;

  if (!isMounted) return <div className="animate-pulse h-[400px] w-full bg-[var(--background)] rounded-[2.5rem]"></div>;

  return (
    <main className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 bg-[var(--background)] text-[var(--foreground)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-md">
        
        <div className="h-72 md:h-80 bg-[var(--background)] rounded-3xl flex items-center justify-center overflow-hidden border border-[var(--border)]">
          {product.image ? <img src={product.image} alt={displayTitle} className="w-full h-full object-cover" /> : <span className="text-8xl">📦</span>}
        </div>
        
        <div className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-block bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs px-3 py-1 rounded-full font-black">منتج جديد</span>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--secondary)]">{displayTitle}</h1>
            <p className="text-2xl font-black">{product.price ? `${product.price} ج.م` : dict.callForPrice}</p>
            
            <div className="text-sm text-[var(--muted-foreground)] space-y-2 bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)]">
               {details.map((d, i) => (
                 <p key={i}><span className="font-bold text-[var(--foreground)]">{d.label}</span> <span className="text-[var(--foreground)] font-medium">{d.value}</span></p>
               ))}
            </div>

            {displayDesc && (
              <div className="pt-3 border-t border-[var(--border)]">
                <h3 className="font-bold text-[var(--foreground)] mb-2">{dict.description}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{displayDesc}</p>
              </div>
            )}
          </div>

          {!isAdded ? (
            <button 
              onClick={() => { 
                addToCart({ ...product, type: 'new' }); 
                setShowAdded(true); 
                setTimeout(() => setShowAdded(false), 1500);
              }} 
              className="w-full bg-[var(--secondary)] text-white py-4 rounded-2xl font-black active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              {showAdded ? dict.added : dict.addToCart}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="w-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 py-3 rounded-2xl font-bold text-center text-sm">{dict.addedCartCheck}</div>
              <div className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border)]">
                <span className="text-sm font-bold">{dict.quantity}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => decreaseQuantity(product.id, 'new')} className="w-8 h-8 rounded-xl bg-[var(--border)] font-bold cursor-pointer flex items-center justify-center text-[var(--secondary)]" type="button">-</button>
                  <span className="font-black w-6 text-center">{cartItemCount}</span>
                  <button onClick={() => increaseQuantity(product.id, 'new')} className="w-8 h-8 rounded-xl bg-[var(--border)] font-bold cursor-pointer flex items-center justify-center text-[var(--secondary)]" type="button">+</button>
                </div>
              </div>
              <button onClick={() => removeFromCart(product.id, 'new')} className="w-full text-red-600 border border-red-500/30 py-3 rounded-2xl font-bold cursor-pointer hover:bg-red-500/10 transition-all text-sm" type="button">{dict.remove}</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}