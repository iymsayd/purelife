'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/app/context/CartContext';

const dict = {
  conditionLabel: "حالة المنتج:",
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
  conditionAr?: string;
  condition?: string;
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
  const condition = product.conditionAr || product.condition || '';

  const getProductDetails = () => {
    const category = product.category || "";
    
    const detailsList: { label: string; value: any }[] = [{ label: "الفئة:", value: category || "فلاتر" }];

    if (category === "قطع غيار فلاتر" || category === "قطع غيار تكييفات") {
      detailsList.push({ label: "بلد المنشأ:", value: product.origin });
    } else if (category === "تكييفات") {
      detailsList.push(
        { label: "الماركة:", value: product.brand },
        { label: "القدرة:", value: product.power ? `${product.power} حصان` : null },
        { label: "نوع الجهاز:", value: product.deviceType },
        { label: "نظام التبريد:", value: product.cooling },
        { label: "بلد المنشأ:", value: product.origin }
      );
    } else {
      // الافتراضي للفلاتر
      detailsList.push(
        { label: "الماركة:", value: product.brand },
        { label: "عدد المراحل:", value: product.stages },
        { label: "نوع التصفية:", value: product.filtrationType },
        { label: "نظام التعقيم:", value: product.sterilization },
        { label: "بلد المنشأ:", value: product.origin }
      );
    }

    if (condition) {
      detailsList.push({ label: "حالة المنتج:", value: condition });
    }

    return detailsList;
  };

  const details = getProductDetails().filter(d => d.value);

  // تجهيز المنتج المستعمل للسلة مع الثوابت المطلوبة وبدون أي مشاكل تايب
  const productForCart = {
    ...product,
    title: displayTitle,
    name: displayTitle,
    type: 'used',
    isUsed: true,
  };

  const safeCart = Array.isArray(cartItems) ? cartItems : [];
  const cartItem = isMounted ? safeCart.find((item: any) => String(item?.id) === String(product?.id) && item?.type === 'used') : null;
  const isAdded = !!cartItem;
  const cartItemCount = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    addToCart(productForCart);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1500);
  };

  if (!isMounted) {
    return <div className="animate-pulse h-[400px] w-full bg-[var(--background)] rounded-[2.5rem]"></div>;
  }

  return (
    <main className="max-w-4xl mx-auto" dir="rtl">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 bg-[var(--background)] text-[var(--foreground)] p-6 md:p-8 rounded-[2.5rem] border border-[var(--border)] shadow-md transition-colors duration-300">
        
        {/* صورة المنتج المستعمل مع بادج الحالة */}
        <div className="h-72 md:h-80 bg-[var(--background)] rounded-3xl flex items-center justify-center overflow-hidden relative border border-[var(--border)] shadow-inner">
          {product.image ? (
            <img src={product.image} alt={displayTitle} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="text-8xl">📦</span>
          )}
          {condition && (
            <span className="absolute top-4 right-4 bg-[var(--secondary)] text-white text-xs px-3.5 py-1.5 rounded-full font-bold shadow-md">
              {dict.conditionLabel} {condition}
            </span>
          )}
        </div>
        
        {/* تفاصيل المنتج المستعمل */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="inline-block bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs px-3 py-1 rounded-full font-black">
              منتج مستعمل
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[var(--foreground)]">{displayTitle}</h1>
            <p className="text-2xl text-[var(--secondary)] font-black">
              {product.price ? `${product.price} ج.م` : dict.callForPrice}
            </p>
            
            <div className="text-sm text-[var(--muted-foreground)] space-y-2 bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)]">
               {details.map((d, i) => (
                 <p key={i}><span className="font-bold text-[var(--foreground)]">{d.label}</span> <span className="text-[var(--foreground)] font-medium">{d.value}</span></p>
               ))}
            </div>

            {displayDesc && (
              <div className="pt-3 border-t border-[var(--border)]">
                <h3 className="font-bold text-[var(--foreground)] mb-2">{dict.description}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-line">
                  {displayDesc}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-[var(--border)]">
            {!isAdded ? (
              <button 
                onClick={handleAddToCart} 
                className="w-full bg-[var(--secondary)] text-white py-4 rounded-2xl font-black transition-all hover:opacity-90 shadow-md cursor-pointer active:scale-95"
                type="button"
              >
                {showAdded ? dict.added : dict.addToCart}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 py-3 rounded-2xl font-bold text-center text-sm flex items-center justify-center gap-2">
                  <span>{dict.addedCartCheck}</span>
                </div>

                <div className="flex items-center justify-between bg-[var(--background)] p-3 rounded-2xl border border-[var(--border)]">
                  <span className="text-sm font-bold text-[var(--foreground)]">{dict.quantity}</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => decreaseQuantity(product.id, 'used')}
                      className="w-8 h-8 bg-[var(--background)] border border-[var(--border)] rounded-xl font-bold text-[var(--secondary)] shadow-sm hover:opacity-80 flex items-center justify-center cursor-pointer"
                      type="button"
                    >
                      -
                    </button>
                    <span className="font-black text-lg w-6 text-center text-[var(--foreground)]">{cartItemCount}</span>
                    <button 
                      onClick={() => increaseQuantity(product.id, 'used')}
                      className="w-8 h-8 bg-[var(--background)] border border-[var(--border)] rounded-xl font-bold text-[var(--secondary)] shadow-sm hover:opacity-80 flex items-center justify-center cursor-pointer"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => removeFromCart(product.id, 'used')} 
                  className="w-full bg-red-500/15 hover:bg-red-500/25 text-red-600 border border-red-500/30 py-3 rounded-2xl font-bold transition-all text-sm cursor-pointer"
                  type="button"
                >
                  {dict.remove}
                </button>
              </div>
            )}

            <div className="p-3 bg-[var(--background)] rounded-xl text-center border border-[var(--border)] text-xs md:text-sm text-[var(--muted-foreground)]">
              <p>
                {dict.cartQuantityLabel} <span className="font-bold text-[var(--secondary)]">{cartItemCount}</span> | {dict.cartTotalLabel} <span className="font-semibold text-[var(--foreground)]">{safeCart.length}</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}