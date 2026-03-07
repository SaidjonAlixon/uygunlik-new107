'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-gray-700" asChild>
          <Link href="/admin/tariffs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {tariffName} – Darslar
          </h1>
          <p className="text-sm text-gray-400">Tartib raqami bo'yicha</p>
        </div>
        <Button asChild className="bg-gray-700 hover:bg-gray-600 border border-gray-600">
          <Link href={`/admin/lessons?tariffId=${tariffId}&action=add`}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi dars
          </Link>
        </Button>
      </div>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Jadval</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
              <p className="text-gray-400 py-4">Yuklanmoqda…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 px-2 text-gray-300">T/R</th>
                      <th className="text-left py-2 px-2 text-gray-300">Dars nomi</th>
                      <th className="text-left py-2 px-2 text-gray-300">Video</th>
                      <th className="text-left py-2 px-2 text-gray-300">Tartib</th>
                      <th className="text-left py-2 px-2 text-gray-300">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l, i) => (
                      <tr key={l.id} className="border-b border-gray-700">
                        <td className="py-2 px-2 text-gray-200">{i + 1}</td>
                        <td className="py-2 px-2 text-gray-200">{l.title}</td>
                        <td className="py-2 px-2 text-gray-200">{l.video_url ? '✅' : '—'}</td>
                        <td className="py-2 px-2 text-gray-200">{l.order_number}</td>
                        <td className="py-2 px-2 flex items-center gap-1 text-gray-300">
                          {l.video_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Videoni ko'rish">
                              <Link href={`/watch/${l.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/lessons/${l.id}`}>Tahrirlash</Link>
                          </Button>
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
