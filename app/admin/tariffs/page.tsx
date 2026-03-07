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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Ta'riflar</h1>
        <Button onClick={() => setAddOpen(true)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600">
          <Plus className="h-4 w-4 mr-2" />
          Ta'rif yaratish
        </Button>
      </div>

      {loading ? (
        <p className="text-gray-400 py-8 text-center">Yuklanmoqda…</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tariffs.map((t) => (
            <Card key={t.id} className="overflow-hidden border border-gray-600/80 bg-gray-800/80 shadow-xl shadow-black/20 rounded-xl backdrop-blur-sm transition hover:border-gray-500/50 hover:shadow-2xl hover:shadow-black/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/80">
                  <Gift className="h-5 w-5 text-amber-400" />
                </div>
                <CardTitle className="text-base font-semibold tracking-tight text-white">{t.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-5">
                <p className="text-2xl font-bold tracking-tight text-white">
                  {Number(t.price).toLocaleString('uz-UZ')} <span className="text-sm font-normal text-gray-400">so'm</span>
                </p>
                <p className="text-sm text-gray-400 mt-1.5">
                  {t.lessons_count ?? 0} ta dars
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <Button
                    size="sm"
                    className="rounded-lg bg-emerald-600 text-white shadow-md hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500/50 font-medium"
                    asChild
                  >
                    <Link href={`/admin/tariffs/${t.id}/lessons`} className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Darslar
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white" asChild title="Ko'rish">
                    <Link href={`/admin/tariffs/${t.id}/lessons`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white" onClick={() => openEdit(t)} title="Tahrirlash">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300" onClick={() => setDeleteTariff(t)} title="O'chirish">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta'rif yaratish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nomi *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: Premium"
                required
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif"
              />
            </div>
            <div>
              <Label>Narx (so'm) *</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saqlanmoqda…' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingTariff(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta'rifni tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Nomi *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: Premium"
                required
              />
            </div>
            <div>
              <Label>Tavsif</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Qisqacha tavsif"
              />
            </div>
            <div>
              <Label>Narx (so'm) *</Label>
              <Input
                type="number"
                min={0}
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saqlanmoqda…' : 'Saqlash'}</Button>
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
