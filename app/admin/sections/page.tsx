'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FolderPlus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { LessonSection } from '@/types/section';

type Tariff = { id: number; name: string };

export default function AdminSectionsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LessonSection | null>(null);
  const [deleteSection, setDeleteSection] = useState<LessonSection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    order_number: '1',
    tariff_ids: [] as number[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, tariffsRes] = await Promise.all([
        api.get('/sections'),
        adminApi.getTariffs(),
      ]);
      setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
      setTariffs(Array.isArray(tariffsRes.data) ? tariffsRes.data : []);
    } catch {
      toast.error('Yuklashda xato');
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTariff = (tariffId: number, checked: boolean) => {
    setForm((f) => {
      const set = new Set(f.tariff_ids);
      if (checked) set.add(tariffId);
      else set.delete(tariffId);
      return { ...f, tariff_ids: [...set] };
    });
  };

  const openCreate = () => {
    const nextOrder =
      sections.length === 0 ? 1 : Math.max(0, ...sections.map((s) => s.order_number)) + 1;
    setForm({
      name: '',
      description: '',
      order_number: String(nextOrder),
      tariff_ids: [],
    });
    setAddOpen(true);
  };

  const openEdit = (section: LessonSection) => {
    setEditing(section);
    setForm({
      name: section.name,
      description: section.description || '',
      order_number: String(section.order_number),
      tariff_ids: section.tariff_ids?.length
        ? [...section.tariff_ids]
        : [section.tariff_id],
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Bo'lim nomi to'ldirilishi kerak");
      return;
    }
    if (form.tariff_ids.length === 0) {
      toast.error('Kamida bitta tarif tanlanishi kerak');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sections', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        order_number: parseInt(form.order_number, 10) || 1,
        tariff_ids: form.tariff_ids,
      });
      toast.success("Bo'lim qo'shildi");
      setAddOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !form.name.trim()) return;
    if (form.tariff_ids.length === 0) {
      toast.error('Kamida bitta tarif tanlanishi kerak');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/sections/${editing.id}`, {
        name: form.name.trim(),
        description: form.description.trim() || '',
        order_number: parseInt(form.order_number, 10) || editing.order_number,
        tariff_ids: form.tariff_ids,
      });
      toast.success("Bo'lim yangilandi");
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/sections/${id}`);
      toast.success("Bo'lim o'chirildi");
      setDeleteSection(null);
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const tariffNames = (section: LessonSection) => {
    const ids = section.tariff_ids?.length ? section.tariff_ids : [section.tariff_id];
    return ids
      .map((id) => tariffs.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const TariffPicker = () => (
    <div className="space-y-2">
      <Label className="text-[#5D1111] font-semibold">Qaysi tariflarda chiqsin? *</Label>
      {tariffs.length === 0 ? (
        <p className="text-sm text-[#7A2E2E]/70">Avval ta&apos;rif yarating.</p>
      ) : (
        <div className="rounded-xl border border-[#7A2E2E]/15 bg-[#FEFBEE]/40 p-3 space-y-2 max-h-48 overflow-y-auto">
          {tariffs.map((t) => {
            const checked = form.tariff_ids.includes(t.id);
            return (
              <label
                key={t.id}
                className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/70"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggleTariff(t.id, v === true)}
                />
                <span className="text-sm text-[#5D1111] font-medium">{t.name}</span>
              </label>
            );
          })}
        </div>
      )}
      <p className="text-xs text-[#7A2E2E]/70">
        Bir nechta tarifni belgilashingiz mumkin (masalan Standard + Premium).
      </p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Bo&apos;limlar</h1>
          <p className="text-sm text-[#7A2E2E]/80 mt-1">
            Bo&apos;limni yaratib, qaysi tariflarda chiqishini tanlang
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-11 bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md px-5"
        >
          <FolderPlus className="h-5 w-5 mr-2" />
          Bo&apos;lim qo&apos;shish
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
        </div>
      ) : sections.length === 0 ? (
        <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-[#7A2E2E]/80 font-medium mb-4">Hali bo&apos;limlar yo&apos;q.</p>
            <Button
              onClick={openCreate}
              className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Birinchi bo&apos;limni yaratish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card
              key={section.id}
              className="border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl overflow-hidden"
            >
              <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5D1111] text-white text-sm font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <CardTitle className="text-xl font-bold text-[#5D1111]">
                        {section.name}
                      </CardTitle>
                      {section.description && (
                        <p className="text-sm text-[#7A2E2E]/80 mt-2 leading-relaxed max-w-2xl">
                          {section.description}
                        </p>
                      )}
                      <p className="text-sm text-[#7A2E2E]/60 mt-1.5">
                        Tartib: {section.order_number}
                        {tariffNames(section) ? ` · Tariflar: ${tariffNames(section)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-[#7A2E2E]/25 text-[#5D1111]"
                      asChild
                    >
                      <Link href={`/admin/lessons?tariffId=${section.tariff_id}`}>
                        <BookOpen className="h-4 w-4 mr-1.5" />
                        Darslar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#7A2E2E] hover:bg-[#FEFBEE] rounded-xl"
                      onClick={() => openEdit(section)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 rounded-xl"
                      onClick={() => setDeleteSection(section)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Qo'shish */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">
              Yangi bo&apos;lim
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Bo&apos;lim nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: 1-bo'lim. Kirish"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Izoh</Label>
              <Textarea
                className="min-h-[90px] bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl resize-y"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Bo'lim haqida qisqacha izoh..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                type="number"
                min={1}
                value={form.order_number}
                onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <TariffPicker />
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
                disabled={submitting}
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tahrirlash */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">
              Bo&apos;limni tahrirlash
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Bo&apos;lim nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Izoh</Label>
              <Textarea
                className="min-h-[90px] bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl resize-y"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                type="number"
                min={1}
                value={form.order_number}
                onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <TariffPicker />
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                type="submit"
                className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
                disabled={submitting}
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSection} onOpenChange={(o) => !o && setDeleteSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bo&apos;limni o&apos;chirish</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteSection?.name}&quot; bo&apos;limini va uning barcha darslarini
              o&apos;chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteSection && handleDelete(deleteSection.id)}
            >
              O&apos;chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
