'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { adminApi } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Lesson = { id: number; title: string; tariff_id: number; order_number: number; video_url?: string; pdf_url?: string };
type Tariff = { id: number; name: string };

export default function AdminLessonsPage() {
  const searchParams = useSearchParams();
  const tariffIdParam = searchParams.get('tariffId');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState(tariffIdParam || '');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', pdf_url: '', test_url: '', order_number: '1', tariff_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    adminApi.getTariffs().then((r) => setTariffs(r.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedTariffId) {
      setLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/tariffs/${selectedTariffId}/lessons`)
      .then((r) => setLessons(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [selectedTariffId]);

  useEffect(() => {
    if (tariffIdParam) setSelectedTariffId(tariffIdParam);
  }, [tariffIdParam]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setForm((f) => ({ ...f, tariff_id: selectedTariffId || (tariffs[0]?.id ? String(tariffs[0].id) : '') }));
      setAddOpen(true);
    }
  }, [searchParams, selectedTariffId, tariffs]);

  useEffect(() => {
    if (addOpen && selectedTariffId) {
      const nextOrder = lessons.length === 0 ? 1 : Math.max(0, ...lessons.map((l) => l.order_number)) + 1;
      setForm((f) => ({ ...f, order_number: String(nextOrder), tariff_id: selectedTariffId }));
    }
  }, [addOpen, selectedTariffId, lessons]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const tid = form.tariff_id || selectedTariffId;
    if (!tid || !form.title.trim()) {
      toast.error("Ta'rif va dars nomi to'ldirilishi kerak");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/tariffs/${tid}/lessons`, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        video_url: form.video_url.trim() || undefined,
        pdf_url: form.pdf_url.trim() || undefined,
        test_url: form.test_url.trim() || undefined,
        order_number: parseInt(form.order_number, 10) || 1,
      });
      toast.success('Dars qo\'shildi');
      setAddOpen(false);
      setForm({ title: '', description: '', video_url: '', pdf_url: '', test_url: '', order_number: '1', tariff_id: tid });
      if (tid === selectedTariffId) {
        const r = await api.get(`/tariffs/${tid}/lessons`);
        setLessons(Array.isArray(r.data) ? r.data : []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    try {
      await api.delete(`/lessons/${id}`);
      toast.success('Dars o\'chirildi');
      setDeleteLesson(null);
      if (selectedTariffId) {
        const r = await api.get(`/tariffs/${selectedTariffId}/lessons`);
        setLessons(Array.isArray(r.data) ? r.data : []);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Darslar</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            className="w-full sm:w-64 border border-[#7A2E2E]/20 rounded-xl px-4 py-2 bg-[#FEFBEE]/50 text-[#5D1111] font-medium shadow-sm transition-all focus:ring-2 focus:ring-[#5D1111] outline-none"
            value={selectedTariffId}
            onChange={(e) => setSelectedTariffId(e.target.value)}
          >
            <option value="">Ta'rifni tanlang</option>
            {tariffs.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Button onClick={() => setAddOpen(true)} disabled={!selectedTariffId} className="w-full sm:w-auto h-11 bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md transition-colors px-5">
            Yangi dars
          </Button>
        </div>
      </div>

      <Card className="border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 pb-4">
          <CardTitle className="text-xl font-bold text-[#5D1111]">Ro'yxat</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedTariffId ? (
            <div className="flex justify-center items-center py-12 px-6 text-center text-[#7A2E2E]/80 font-medium tracking-wide">
              Iltimos, darslarni ko'rish uchun yuqoridan ta'rifni tanlang
            </div>
          ) : loading ? (
            <div className="flex flex-col justify-center items-center py-12 px-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent mb-4" />
              <p className="text-[#5D1111]/70">Darslar yuklanmoqda...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 px-6 text-center text-[#7A2E2E]/70 font-medium tracking-wide">
              Ushbu ta'rifda hali darslar mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold">
                  <tr>
                    <th className="py-4 px-6 font-medium">T/R</th>
                    <th className="py-4 px-6 font-medium">Dars nomi</th>
                    <th className="py-4 px-6 font-medium">Video</th>
                    <th className="py-4 px-6 font-medium">Tartib</th>
                    <th className="py-4 px-6 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7A2E2E]/5">
                  {lessons.map((l, i) => (
                    <tr key={l.id} className="hover:bg-[#FEFBEE]/30 transition-colors group">
                      <td className="py-4 px-6 text-[#5D1111]/70">{i + 1}</td>
                      <td className="py-4 px-6 font-medium text-[#5D1111]">{l.title}</td>
                      <td className="py-4 px-6">
                        {l.video_url ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Mavjud
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-4 px-6 text-[#5D1111]/80">{l.order_number}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {l.video_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl" asChild title="Videoni ko'rish">
                              <Link href={`/watch/${l.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 text-[#7A2E2E] font-medium hover:bg-[#FEFBEE] hover:text-[#5D1111] rounded-xl" asChild>
                            <Link href={`/admin/lessons/${l.id}`}>Tahrirlash</Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl" onClick={() => setDeleteLesson(l)} title="O'chirish">
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Yangi dars qo&apos;shish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Ta'rif *</Label>
              <select
                className="w-full h-11 border border-[#7A2E2E]/20 rounded-xl px-4 py-2 bg-[#FEFBEE]/50 text-[#5D1111] focus:ring-2 focus:ring-[#5D1111] focus:border-transparent outline-none transition-all cursor-pointer appearance-none"
                value={form.tariff_id || selectedTariffId}
                onChange={(e) => setForm((f) => ({ ...f, tariff_id: e.target.value }))}
                required
              >
                <option value="">Tanlang</option>
                {tariffs.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Dars nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tavsif</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Video havola <span className="text-xs font-normal text-[#7A2E2E]/70">(YouTube unlisted)</span></Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtu.be/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">PDF havola <span className="text-xs font-normal text-[#7A2E2E]/70">(Google Drive)</span></Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.pdf_url}
                onChange={(e) => setForm((f) => ({ ...f, pdf_url: e.target.value }))}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                type="number"
                min={1}
                value={form.order_number}
                onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10 flex gap-2">
              <Button type="button" variant="outline" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" onClick={() => setAddOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md" disabled={submitting}>{submitting ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteLesson?.title}&quot; darsini rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLesson && handleDeleteLesson(deleteLesson.id)} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
