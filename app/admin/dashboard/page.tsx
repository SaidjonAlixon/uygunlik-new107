'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/admin.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gift, Clock, DollarSign, Plus, UserPlus, MessageSquare, ClipboardCheck } from 'lucide-react';

type Stats = {
  usersCount: number;
  activeTariffsCount: number;
  pendingPayments: number;
  todayRevenue: number;
  usersWithTariff: number;
};

const statCards: { key: keyof Stats; label: string; icon: React.ElementType; iconColor: string; cardBg: string }[] = [
  { key: 'usersCount', label: "Jami foydalanuvchilar", icon: Users, iconColor: 'text-[#5D1111]', cardBg: 'bg-white border-[#7A2E2E]/10' },
  { key: 'usersWithTariff', label: "Faol ta'riflar", icon: Gift, iconColor: 'text-[#5D1111]', cardBg: 'bg-white border-[#7A2E2E]/10' },
  { key: 'pendingPayments', label: "Kutilayotgan to'lovlar", icon: Clock, iconColor: 'text-[#5D1111]', cardBg: 'bg-white border-[#7A2E2E]/10' },
  { key: 'todayRevenue', label: "Bugungi daromad", icon: DollarSign, iconColor: 'text-[#5D1111]', cardBg: 'bg-white border-[#7A2E2E]/10' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({
        usersCount: 0,
        activeTariffsCount: 0,
        pendingPayments: 0,
        todayRevenue: 0,
        usersWithTariff: 0,
      }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Dashboard</h1>
        <p className="text-[#7A2E2E]/80 mt-1">Statistika va tezkor amallar</p>
      </div>

      {/* Stat cards — premium dizayn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ key, label, icon: Icon, iconColor, cardBg }) => (
          <Card key={key} className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${cardBg} shadow-md shadow-[#7A2E2E]/5 rounded-2xl`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold text-[#7A2E2E]">
                {label}
              </CardTitle>
              <span className={`p-2.5 rounded-xl bg-[#FEFBEE] shadow-sm`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#5D1111] tabular-nums tracking-tight">
                {loading ? '—' : (stats ? String(stats[key] ?? 0) : '0')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tezkor amallar — premium karta */}
      <Card className="border border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#5D1111]">Tezkor amallar</CardTitle>
          <CardDescription className="text-[#7A2E2E]/80">Admin panelda tez bajariladigan amallar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild variant="outline" className="border-[#7A2E2E]/20 bg-[#FEFBEE] text-[#5D1111] hover:bg-[#5D1111] hover:text-white rounded-xl transition-colors">
            <Link href="/admin/lessons?action=add">
              <Plus className="h-4 w-4 mr-2" />
              Yangi dars qo&apos;shish
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#7A2E2E]/20 bg-[#FEFBEE] text-[#5D1111] hover:bg-[#5D1111] hover:text-white rounded-xl transition-colors">
            <Link href="/admin/users?action=add">
              <UserPlus className="h-4 w-4 mr-2" />
              Yangi foydalanuvchi qo&apos;shish
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#7A2E2E]/20 bg-[#FEFBEE] text-[#5D1111] hover:bg-[#5D1111] hover:text-white rounded-xl transition-colors">
            <Link href="/admin/lessons">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Test qo&apos;shish
            </Link>
          </Button>
          <Button variant="outline" disabled className="border-gray-200 bg-gray-50 text-gray-400 rounded-xl">
            <MessageSquare className="h-4 w-4 mr-2" />
            Telegram bot sozlamalari
          </Button>
        </CardContent>
      </Card>

      {/* Oxirgi faoliyatlar — premium karta */}
      <Card className="border border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#5D1111]">Oxirgi faoliyatlar</CardTitle>
          <CardDescription className="text-[#7A2E2E]/80">Real-vaqt yangilanish keyingi versiyada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 italic">
            Vaqt | Hodisa | Foydalanuvchi | Status jadvali va grafiklar keyingi yangilanishda qo‘shiladi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
