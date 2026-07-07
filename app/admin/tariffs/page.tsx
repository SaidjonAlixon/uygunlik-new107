'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Gift, Plus, Eye, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Tariff = { id: number; name: string; description?: string; price: number; lessons_count?: number };

export default function AdminTariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '' });
  const [deleteTariff, setDeleteTariff] = useState<Tariff | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.getTariffs()
      .then((r) => setTariffs(r.data || []))
      .catch(() => toast.error('Yuklashda xato'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Nomi va narx to\'ldirilishi kerak');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createTariff({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
      });
      toast.success('Ta\'rif yaratildi');
      setAddOpen(false);
      setForm({ name: '', description: '', price: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t: Tariff) => {
    setEditingTariff(t);
    setEditForm({
      name: t.name,
      description: t.description ?? '',
      price: String(t.price),
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff || !editForm.name.trim() || !editForm.price) {
      toast.error('Nomi va narx to\'ldirilishi kerak');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.updateTariff(editingTariff.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        price: Number(editForm.price),
      });
      toast.success('Ta\'rif yangilandi');
      setEditOpen(false);
      setEditingTariff(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteTariff(id);
      toast.success('Ta\'rif o\'chirildi');
      setDeleteTariff(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Ta'riflar</h1>
        <Button onClick={() => setAddOpen(true)} className="h-11 bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md transition-colors px-5">
          <Plus className="h-5 w-5 mr-2" />
          Ta'rif yaratish
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tariffs.map((t) => (
            <Card key={t.id} className="overflow-hidden border border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl transition hover:shadow-xl hover:-translate-y-1 duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEFBEE] shadow-sm border border-[#7A2E2E]/5">
                  <Gift className="h-6 w-6 text-[#5D1111]" />
                </div>
                <CardTitle className="text-lg font-bold tracking-tight text-[#5D1111]">{t.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-3xl font-bold tracking-tight text-[#5D1111] mt-2">
                  {Number(t.price).toLocaleString('uz-UZ')} <span className="text-base font-medium text-[#7A2E2E]/70">so'm</span>
                </p>
                <p className="text-sm font-medium text-[#7A2E2E]/80 mt-2 bg-[#FEFBEE] inline-block px-3 py-1 rounded-full border border-[#7A2E2E]/10">
                  {t.lessons_count ?? 0} ta dars
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-6">
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#5D1111] text-white shadow-md hover:bg-[#7A2E2E] transition-colors font-medium h-10 px-4"
                    asChild
                  >
                    <Link href={`/admin/tariffs/${t.id}/lessons`} className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Darslar
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-[#7A2E2E] hover:bg-[#FEFBEE] hover:text-[#5D1111] rounded-xl" asChild title="Ko'rish">
                    <Link href={`/admin/tariffs/${t.id}/lessons`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-[#7A2E2E] hover:bg-[#FEFBEE] hover:text-[#5D1111] rounded-xl" onClick={() => openEdit(t)} title="Tahrirlash">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl" onClick={() => setDeleteTariff(t)} title="O'chirish">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Ta'rif yaratish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: Premium"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tavsif</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Narx (so'm) *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10 flex gap-2">
              <Button type="button" variant="outline" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" onClick={() => setAddOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md" disabled={submitting}>{submitting ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingTariff(null); }}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Ta'rifni tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: Premium"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tavsif</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Narx (so'm) *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10 flex gap-2">
              <Button type="button" variant="outline" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" onClick={() => setEditOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md" disabled={submitting}>{submitting ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTariff} onOpenChange={(open) => !open && setDeleteTariff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta'rifni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTariff?.name}&quot; ta'rifini rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTariff && handleDelete(deleteTariff.id)} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
