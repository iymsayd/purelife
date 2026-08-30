'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ComparePage() {
  const [list, setList] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string | null>(null);

  useEffect(() => { setList(JSON.parse(localStorage.getItem('compare') || '[]')); }, []);

  const handleSort = (key: string) => {
    const sorted = [...list].sort((a, b) => {
      if (sortBy === `${key}-asc`) return a[key] - b[key];
      return b[key] - a[key];
    });
    setList(sorted);
    setSortBy(sortBy === `${key}-asc` ? `${key}-desc` : `${key}-asc`);
  };

  if (list.length === 0) return <div className="p-8 text-center">لا توجد منتجات للمقارنة</div>;

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">جدول المقارنة التفاعلي</h1>

      <div className="bg-white rounded-3xl border shadow-sm overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4">اسم المنتج</th>
              <th className="p-4 cursor-pointer hover:text-secondary" onClick={() => handleSort('price')}>
                السعر {sortBy?.startsWith('price') ? (sortBy.includes('asc') ? '▲' : '▼') : '↕'}
              </th>
              <th className="p-4 cursor-pointer hover:text-secondary" onClick={() => handleSort('rating')}>
                التقييم {sortBy?.startsWith('rating') ? (sortBy.includes('asc') ? '▲' : '▼') : '↕'}
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-bold">{p.title}</td>
                <td className="p-4">{p.price} ج.م</td>
                <td className="p-4">⭐ {p.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-4">
        <button onClick={() => { localStorage.removeItem('compare'); setList([]); }} className="bg-red-500 text-white px-6 py-3 rounded-xl">مسح المقارنة</button>
        <Link href="/products" className="bg-gray-800 text-white px-6 py-3 rounded-xl">رجوع للمتجر</Link>
      </div>
    </main>
  );
}