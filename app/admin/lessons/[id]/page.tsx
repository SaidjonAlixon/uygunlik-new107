'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', pdf_url: '', order_number: '1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/lessons/${id}`)
      .then((r) => {
        const l = r.data;
        setLesson(l);
        setForm({
          title: l.title || '',
          description: l.description || '',
          video_url: l.video_url || '',
          pdf_url: l.pdf_url || '',
          order_number: String(l.order_number ?? 1),
        });
      })
      .catch(() => {
        toast.error('Dars topilmadi');
        router.push('/admin/lessons');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/lessons/${id}`, {
        title: form.title,
        description: form.description || undefined,
        video_url: form.video_url || undefined,
        pdf_url: form.pdf_url || undefined,
        order_number: parseInt(form.order_number, 10) || 1,
      });
      toast.success('Saqlandi');
      const r = await api.get(`/lessons/${id}`);
      setLesson(r.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent text-primary" />
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-gray-700" asChild>
          <Link href={lesson.tariff_id ? `/admin/tariffs/${lesson.tariff_id}/lessons` : '/admin/lessons'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-white">Darsni tahrirlash</h1>
      </div>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Asosiy ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <Label className="text-gray-300">Dars nomi *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-300">Tavsif</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-gray-700/50 border-gray-600 text-white"
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
              <p className="text-gray-500 text-xs mt-1">Foydalanuvchi va admin dars videosi sahifasida videoning tagida PDF ni platforma ichida ko‘radi.</p>
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
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </Button>
              <Button type="button" variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-700" asChild>
                <Link href={lesson.tariff_id ? `/admin/tariffs/${lesson.tariff_id}/lessons` : '/admin/lessons'}>
                  Orqaga
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
