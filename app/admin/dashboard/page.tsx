'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/admin.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gift, Clock, DollarSign, Plus, UserPlus, MessageSquare } from 'lucide-react';

type Stats = {
  usersCount: number;
  activeTariffsCount: number;
  pendingPayments: number;
  todayRevenue: number;
  usersWithTariff: number;
};

const statCards: { key: keyof Stats; label: string; icon: React.ElementType; iconColor: string; cardBg: string }[] = [
  { key: 'usersCount', label: "Jami foydalanuvchilar", icon: Users, iconColor: 'text-blue-400', cardBg: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'usersWithTariff', label: "Faol ta'riflar (sotilgan)", icon: Gift, iconColor: 'text-emerald-400', cardBg: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'pendingPayments', label: "Kutilayotgan to'lovlar", icon: Clock, iconColor: 'text-amber-400', cardBg: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'todayRevenue', label: "Bugungi daromad (so'm)", icon: DollarSign, iconColor: 'text-rose-400', cardBg: 'bg-rose-500/10 border-rose-500/30' },
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard (Bosh sahifa)</h1>
        <p className="text-gray-400 mt-1">Statistika va tezkor amallar</p>
      </div>

      {/* Stat cards — aniq ranglar va belgilar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, iconColor, cardBg }) => (
          <Card key={key} className={`overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] border ${cardBg}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {label}
              </CardTitle>
              <span className={`p-2 rounded-lg bg-white/5`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white tabular-nums">
                {loading ? '—' : (stats ? String(stats[key] ?? 0) : '0')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tezkor amallar — qorong'u karta */}
      <Card className="border border-gray-700/50 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Tezkor amallar</CardTitle>
          <CardDescription className="text-gray-400">Admin panelda tez bajariladigan amallar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm" className="border-gray-600 bg-gray-700/50 text-gray-100 hover:bg-gray-600/50 hover:text-white">
            <Link href="/admin/lessons?action=add">
              <Plus className="h-4 w-4 mr-2 text-blue-400" />
              Yangi dars qo&apos;shish
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-gray-600 bg-gray-700/50 text-gray-100 hover:bg-gray-600/50 hover:text-white">
            <Link href="/admin/users?action=add">
              <UserPlus className="h-4 w-4 mr-2 text-emerald-400" />
              Yangi foydalanuvchi qo&apos;shish
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-gray-600 bg-gray-700/50 text-gray-100 hover:bg-gray-600/50 hover:text-white">
            <Link href="/admin/tariffs?action=add">
              <Gift className="h-4 w-4 mr-2 text-amber-400" />
              Ta&apos;rif yaratish
            </Link>
          </Button>
          <Button variant="outline" size="sm" disabled className="border-gray-600 bg-gray-700/30 text-gray-500">
            <MessageSquare className="h-4 w-4 mr-2" />
            Telegram bot sozlamalari
          </Button>
        </CardContent>
      </Card>

      {/* Oxirgi faoliyatlar — qorong'u karta */}
      <Card className="border border-gray-700/50 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Oxirgi faoliyatlar</CardTitle>
          <CardDescription className="text-gray-400">Real-vaqt yangilanish keyingi versiyada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Vaqt | Hodisa | Foydalanuvchi | Status jadvali va grafiklar keyingi yangilanishda qo‘shiladi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
