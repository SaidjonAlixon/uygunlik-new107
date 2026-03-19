'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Sharhlar</h1>
      <Card className="border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 pb-4">
          <CardTitle className="text-xl font-bold text-[#5D1111]">Moderatsiya</CardTitle>
          <CardDescription className="text-[#7A2E2E]/80 mt-1">
            Sharhlar bo'limi keyingi yangilanishda qo'shiladi. Jadval: ID | Sana | Foydalanuvchi | Reyting | Matn | Status | Amallar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4 text-sm font-medium text-[#5D1111]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Kutilmoqda</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tasdiqlangan</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Rad etilgan</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
