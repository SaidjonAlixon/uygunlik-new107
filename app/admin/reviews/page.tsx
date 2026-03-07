'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Sharhlar</h1>
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Moderatsiya</CardTitle>
          <CardDescription className="text-gray-400">
            Sharhlar bo'limi keyingi yangilanishda qo'shiladi. Jadval: ID | Sana | Foydalanuvchi | Reyting | Matn | Status | Amallar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            🟡 Kutilmoqda | 🟢 Tasdiqlangan | 🔴 Rad etilgan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
