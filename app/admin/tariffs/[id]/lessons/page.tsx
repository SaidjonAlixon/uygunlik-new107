'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Eye, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

type Lesson = { id: number; title: string; description?: string; order_number: number; video_url?: string };

export default function AdminTariffLessonsPage() {
  const params = useParams();
  const tariffId = String(params.id);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tariffName, setTariffName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/tariffs/${tariffId}/lessons`).then((r) => r.data),
      api.get(`/tariffs/${tariffId}`).catch(() => ({ data: null })),
    ])
      .then(([lessonsData, tariffRes]: [Lesson[], any]) => {
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setTariffName(tariffRes?.data?.name || `Ta'rif #${tariffId}`);
      })
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false));
  }, [tariffId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 border-[#7A2E2E]/20 bg-white text-[#5D1111] hover:bg-[#FEFBEE] hover:text-[#7A2E2E] shadow-sm rounded-xl" asChild>
            <Link href="/admin/tariffs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#5D1111] tracking-tight">
              {tariffName} – Darslar
            </h1>
            <p className="text-[#7A2E2E]/60 font-medium">Tarif darslari ro'yxati va tartibi</p>
          </div>
        </div>
        <Button asChild className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-[#5D1111]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
          <Link href={`/admin/lessons?tariffId=${tariffId}&action=add`}>
            <Plus className="h-5 w-5 mr-2" />
            Yangi dars qo'shish
          </Link>
        </Button>
      </div>

      <Card className="border-[#7A2E2E]/10 bg-white/80 backdrop-blur-sm shadow-xl shadow-[#5D1111]/5 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-[#7A2E2E]/5 bg-[#FEFBEE]/50 py-4 px-6">
          <CardTitle className="text-lg font-bold text-[#5D1111] flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Darslar jadvali
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 border-2 border-[#5D1111] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#7A2E2E]/60 font-medium">Ma'lumotlar yuklanmoqda…</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-16 w-16 bg-[#FEFBEE] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#7A2E2E]/10">
                <BookOpen className="h-8 w-8 text-[#7A2E2E]/40" />
              </div>
              <p className="text-[#5D1111] font-semibold text-lg">Hali darslar qo'shilmagan</p>
              <p className="text-[#7A2E2E]/60 max-w-xs mx-auto mt-1">Ushbu tarif uchun darslarni qo'shishni boshlang.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#FEFBEE]/50">
                    <th className="text-left py-4 px-6 text-[#5D1111] font-bold text-xs uppercase tracking-wider border-b border-[#7A2E2E]/10">T/R</th>
                    <th className="text-left py-4 px-6 text-[#5D1111] font-bold text-xs uppercase tracking-wider border-b border-[#7A2E2E]/10">Dars nomi</th>
                    <th className="text-left py-4 px-6 text-[#5D1111] font-bold text-xs uppercase tracking-wider border-b border-[#7A2E2E]/10 text-center">Video</th>
                    <th className="text-left py-4 px-6 text-[#5D1111] font-bold text-xs uppercase tracking-wider border-b border-[#7A2E2E]/10 text-center">Tartib</th>
                    <th className="text-right py-4 px-6 text-[#5D1111] font-bold text-xs uppercase tracking-wider border-b border-[#7A2E2E]/10">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7A2E2E]/10">
                  {lessons.map((l, i) => (
                    <tr key={l.id} className="group hover:bg-[#FEFBEE]/30 transition-colors duration-200">
                      <td className="py-4 px-6 text-[#5D1111]/70 font-semibold">{i + 1}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#5D1111] group-hover:text-[#7A2E2E] transition-colors">{l.title}</div>
                        {l.description && (
                          <div className="text-xs text-[#7A2E2E]/60 line-clamp-1 mt-0.5">{l.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {l.video_url ? (
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-50 text-green-600 border border-green-100">
                            <Plus className="h-4 w-4 rotate-45" /> {/* Just a play-like icon or check */}
                          </span>
                        ) : (
                          <span className="text-[#7A2E2E]/30">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[#FEFBEE] text-[#5D1111] text-xs font-bold border border-[#7A2E2E]/10">
                          {l.order_number}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {l.video_url && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#5D1111]/60 hover:text-[#5D1111] hover:bg-[#FEFBEE] rounded-lg border border-transparent hover:border-[#7A2E2E]/10 transition-all" asChild title="Videoni ko'rish">
                              <Link href={`/watch/${l.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-5 w-5" />
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" className="h-9 px-4 text-xs font-bold text-[#5D1111] hover:text-[#7A2E2E] hover:bg-[#FEFBEE] rounded-lg border border-transparent hover:border-[#7A2E2E]/10 transition-all" asChild>
                            <Link href={`/admin/lessons/${l.id}`}>Tahrirlash</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
