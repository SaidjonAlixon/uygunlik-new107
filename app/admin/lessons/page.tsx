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
  const [form, setForm] = useState({ title: '', description: '', video_url: '', pdf_url: '', order_number: '1', tariff_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    adminApi.getTariffs().then((r) => setTariffs(r.data || [])).catch(() => {});
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
        order_number: parseInt(form.order_number, 10) || 1,
      });
      toast.success('Dars qo\'shildi');
      setAddOpen(false);
      setForm({ title: '', description: '', video_url: '', pdf_url: '', order_number: '1', tariff_id: tid });
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Darslar</h1>
        <div className="flex gap-2">
          <select
            className="border border-gray-600 rounded-md px-3 py-2 bg-gray-700/50 text-gray-200 text-sm"
            value={selectedTariffId}
            onChange={(e) => setSelectedTariffId(e.target.value)}
          >
            <option value="">Ta'rifni tanlang</option>
            {tariffs.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Button onClick={() => setAddOpen(true)} disabled={!selectedTariffId} className="bg-gray-700 hover:bg-gray-600 border border-gray-600">
            <Plus className="h-4 w-4 mr-2" />
            Yangi dars
          </Button>
        </div>
      </div>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Ro'yxat</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedTariffId ? (
              <p className="text-gray-400 py-4">Ta'rifni tanlang</p>
            ) : loading ? (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/20" onClick={() => setDeleteLesson(l)} title="O'chirish">
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-gray-700 bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-white">Yangi dars qo&apos;shish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4">
            <div>
              <Label className="text-gray-300">Ta'rif *</Label>
              <select
                className="w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700/50 text-gray-200"
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
            <div>
              <Label className="text-gray-300">Dars nomi *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Tavsif</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-300">Video havola (YouTube unlisted yoki to'g'ridan-to'g'ri URL)</Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtu.be/..."
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-300">PDF havola (Google Drive ochiq link – dars materiali)</Label>
              <Input
                value={form.pdf_url}
                onChange={(e) => setForm((f) => ({ ...f, pdf_url: e.target.value }))}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-gray-300">Tartib raqami</Label>
              <Input
                type="number"
                min={1}
                value={form.order_number}
                onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" onClick={() => setAddOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground">{submitting ? 'Saqlanmoqda…' : 'Saqlash'}</Button>
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
