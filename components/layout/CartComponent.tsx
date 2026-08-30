'use client';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';

export default function CartComponent() {
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, totalAmount, isMounted, dict } = useCart();
  const safeArray = Array.isArray(cartItems) ? cartItems : [];

  if (!isMounted) {
    return (
      <div className="bg-card text-card-foreground rounded-[2.5rem] border border-border shadow-md p-6 min-h-[250px]" dir="rtl">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </div>
        <div className="space-y-4">
          <div className="h-16 bg-muted/40 rounded-2xl"></div>
          <div className="h-16 bg-muted/40 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (safeArray.length === 0) {
    return (
      <div className="text-center p-6 bg-card text-card-foreground rounded-[2.5rem] border border-border shadow-md" dir="rtl">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
          <h2 className="text-xl font-black text-foreground">{dict?.cartTitle || 'سلة التسوق'}</h2>
        </div>
        <p className="font-bold text-muted-foreground py-6">{dict?.emptyCart || 'السلة فارغة حالياً'}</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-[2.5rem] border border-border shadow-md p-6 transition-colors duration-300" dir="rtl">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
        <h2 className="text-xl font-black text-foreground">{dict?.cartTitle || 'سلة التسوق'}</h2>
        <button 
          onClick={clearCart} 
          className="text-xs text-destructive font-extrabold cursor-pointer hover:underline"
          type="button"
        >
          {dict?.clearAll || 'حذف الكل'}
        </button>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {safeArray.map((item: any) => {
          if (!item) return null;
          const itemTitle = item.titleAr || item.nameAr || item.title || item.name || 'منتج';
          const itemType = item.type || (item.isUsed ? 'used' : undefined);
          const itemId = item.id;

          return (
            <div key={`${itemId}-${itemType || 'normal'}`} className="flex flex-col gap-3 border-b border-border/60 pb-4 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-muted rounded-2xl overflow-hidden shrink-0 border border-border flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={itemTitle} className="w-full h-full object-cover" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="flex justify-between items-start flex-1 min-w-0">
                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{itemTitle}</h3>
                    {itemType === 'used' && (
                      <span className="inline-block bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-md font-bold mt-1">
                        مستعمل
                      </span>
                    )}
                  </div>
                  <p className="text-secondary font-black text-sm whitespace-nowrap ml-2">
                    {Number(item.price || 0) * Number(item.quantity || 1)} ج.م
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-muted p-1.5 rounded-xl border border-border">
                  <button 
                    type="button" 
                    onClick={() => decreaseQuantity(itemId, itemType)} 
                    className="w-6 h-6 bg-background shadow-sm font-black text-xs text-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition"
                  >
                    -
                  </button>
                  <span className="font-black text-xs w-6 text-center text-foreground">{item.quantity || 1}</span>
                  <button 
                    type="button" 
                    onClick={() => increaseQuantity(itemId, itemType)} 
                    className="w-6 h-6 bg-background shadow-sm font-black text-xs text-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition"
                  >
                    +
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeFromCart(itemId, itemType)} 
                  className="text-muted-foreground hover:text-destructive text-xs font-bold cursor-pointer transition"
                >
                  {dict?.remove || 'إزالة'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground font-bold">{dict?.total || 'الإجمالي'}</span>
          <span className="text-xl font-black text-secondary">{totalAmount || 0} ج.م</span>
        </div>
        <Link 
          href="/checkout" 
          className="block w-full bg-secondary text-secondary-foreground text-center py-3.5 rounded-2xl font-black hover:opacity-90 transition shadow-md"
        >
          {dict?.checkout || 'إتمام الطلب'}
        </Link>
      </div>
    </div>
  );
}