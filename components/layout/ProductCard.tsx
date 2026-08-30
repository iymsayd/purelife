'use client';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  product: any;
  isUsed?: boolean;
}

export default function ProductCard({ product, isUsed = false }: ProductCardProps) {
  const cartContext = useCart() || {};
  const { addToCart, increaseQuantity, decreaseQuantity, removeFromCart, cartItems, isMounted } = cartContext as {
    addToCart?: (item: any) => void;
    increaseQuantity?: (id: string, type?: string) => void;
    decreaseQuantity?: (id: string, type?: string) => void;
    removeFromCart?: (id: string, type?: string) => void;
    cartItems?: any[];
    isMounted?: boolean;
  };

  const [showAdded, setShowAdded] = useState(false);

  const itemType = isUsed ? 'used' : undefined;
  const productData = { ...product, type: itemType, isUsed: isUsed };
  
  const safeArray = Array.isArray(cartItems) ? cartItems : [];
  const cartItem = isMounted ? safeArray.find((item: any) => 
    String(item?.id) === String(product?.id) && 
    ((item?.type || (item?.isUsed ? 'used' : undefined)) === (itemType || undefined))
  ) : null;
  
  const isAdded = !!cartItem;
  const cartItemCount = cartItem ? cartItem.quantity : 0;

  const title = product.nameAr || product.title || '';
  const category = product.categoryAr || product.category || '';
  const brand = product.brandAr || product.brand || '';
  const categoryKey = String(product.category || product.categoryKey || '').toLowerCase();
  
  const isSparePart = categoryKey.includes('part') || categoryKey.includes('قطع') || categoryKey.includes('غيار');
  const linkPath = isUsed ? `/used-products/${product.slug || product.id}` : `/products/${product.slug || product.id}`;

  const handleAction = (e: React.MouseEvent, action: 'add' | 'remove' | 'inc' | 'dec') => {
    e.preventDefault();
    e.stopPropagation();
    
    switch (action) {
      case 'add':
        addToCart?.(productData);
        setShowAdded(true);
        setTimeout(() => setShowAdded(false), 1500);
        break;
      case 'remove':
        removeFromCart?.(product.id, itemType);
        break;
      case 'inc':
        increaseQuantity?.(product.id, itemType);
        break;
      case 'dec':
        decreaseQuantity?.(product.id, itemType);
        break;
    }
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-[var(--border)] flex flex-col justify-between group hover:-translate-y-1.5 relative p-4 sm:p-5" dir="rtl">
      
      {product.condition && (
        <span className="absolute top-6 right-6 z-10 bg-[var(--secondary)] text-white text-[10px] px-3 py-1.5 rounded-full font-black shadow-md">
          {product.condition}
        </span>
      )}

      <div className="h-48 sm:h-52 bg-[var(--card)] rounded-2xl mb-4 overflow-hidden relative border border-[var(--border)] flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-[var(--card)]">📦</div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow justify-between gap-3">
        <div>
          <h3 className="font-black text-base sm:text-lg mb-2 line-clamp-1 group-hover:text-[var(--secondary)] transition-colors">{title}</h3>
          
          <div className="text-xs sm:text-sm text-[var(--muted-foreground)] mb-3 space-y-1">
            {category && <p className="line-clamp-1">النوع: <span className="font-bold text-[var(--foreground)]">{category}</span></p>}
            
            {!isSparePart && brand && (
              <p className="line-clamp-1">الماركة: <span className="font-bold text-[var(--foreground)]">{brand}</span></p>
            )}

            {product.stages && <p className="line-clamp-1">المراحل: <span className="font-bold text-[var(--foreground)]">{product.stages}</span></p>}
            {product.power && <p className="line-clamp-1">القدرة: <span className="font-bold text-[var(--foreground)]">{product.power} حصان</span></p>}
          </div>
        </div>

        <div>
          <p className="text-[var(--secondary)] font-black text-lg sm:text-xl mb-4">
            {product.price ? `${product.price} ج.م` : 'اتصل للسعر'}
          </p>
          
          {!isMounted ? (
            <div className="grid grid-cols-2 gap-2.5 mt-auto">
              <div className="bg-[var(--card)] border border-[var(--border)] text-center py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center text-[var(--foreground)] opacity-0">
                تفاصيل
              </div>
              <div className="bg-[var(--secondary)] text-white py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center opacity-0">
                اضافة للسلة
              </div>
            </div>
          ) : !isAdded ? (
            <div className="grid grid-cols-2 gap-2.5 mt-auto">
              <Link href={linkPath} className="bg-[var(--card)] border border-[var(--border)] text-center py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-[var(--secondary)]/10 transition flex items-center justify-center text-[var(--foreground)]">
                تفاصيل
              </Link>
              <button 
                type="button" 
                onClick={(e) => handleAction(e, 'add')} 
                className="bg-[var(--secondary)] text-white py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold hover:opacity-90 transition shadow-sm cursor-pointer flex items-center justify-center"
              >
                {showAdded ? 'تمت الإضافة ✓' : 'اضافة للسلة'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 mt-auto">
              <div className="flex items-center justify-between bg-[var(--card)] px-3 py-2 rounded-2xl border border-[var(--border)]">
                <span className="text-xs font-bold text-[var(--foreground)]">الكمية:</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={(e) => handleAction(e, 'dec')} className="w-7 h-7 bg-[var(--background)] border border-[var(--border)] rounded-xl font-black text-[var(--secondary)] flex items-center justify-center text-xs hover:bg-[var(--secondary)] hover:text-white transition cursor-pointer">-</button>
                  <span className="font-black text-xs w-5 text-center text-[var(--foreground)]">{cartItemCount}</span>
                  <button type="button" onClick={(e) => handleAction(e, 'inc')} className="w-7 h-7 bg-[var(--background)] border border-[var(--border)] rounded-xl font-black text-[var(--secondary)] flex items-center justify-center text-xs hover:bg-[var(--secondary)] hover:text-white transition cursor-pointer">+</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link href={linkPath} className="bg-[var(--card)] border border-[var(--border)] text-center py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold hover:bg-[var(--secondary)]/10 transition flex items-center justify-center text-[var(--foreground)]">
                  تفاصيل
                </Link>
                <button type="button" onClick={(e) => handleAction(e, 'remove')} className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 py-2.5 rounded-2xl font-extrabold transition-all text-xs cursor-pointer flex items-center justify-center">
                  إزالة 🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}