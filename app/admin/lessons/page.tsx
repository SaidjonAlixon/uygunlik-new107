'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Eye, Trash2, FolderPlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Lesson } from '@/types/lesson';
import { LessonSection } from '@/types/section';

type Tariff = { id: number; name: string };

export default function AdminLessonsPage() {
  const searchParams = useSearchParams();
  const tariffIdParam = searchParams.get('tariffId');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [selectedTariffId, setSelectedTariffId] = useState(tariffIdParam || '');
  const [loading, setLoading] = useState(true);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: '', description: '', order_number: '1' });
  const [editingSection, setEditingSection] = useState<LessonSection | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    pdf_url: '',
    test_url: '',
    order_number: '1',
    section_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [deleteSection, setDeleteSection] = useState<LessonSection | null>(null);

  const loadSections = useCallback(async (tariffId: string) => {
    const r = await api.get(`/tariffs/${tariffId}/sections`);
    setSections(Array.isArray(r.data) ? r.data : []);
  }, []);

  useEffect(() => {
    adminApi.getTariffs().then((r) => setTariffs(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTariffId) {
      setSections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadSections(selectedTariffId)
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, [selectedTariffId, loadSections]);

  useEffect(() => {
    if (tariffIdParam) setSelectedTariffId(tariffIdParam);
  }, [tariffIdParam]);

  useEffect(() => {
    if (searchParams.get('action') === 'add' && selectedTariffId && sections.length > 0) {
      setLessonForm((f) => ({ ...f, section_id: String(sections[0].id) }));
      setAddLessonOpen(true);
    }
  }, [searchParams, selectedTariffId, sections]);

  const openAddLesson = (sectionId: number) => {
    const section = sections.find((s) => s.id === sectionId);
    const sectionLessons = section?.lessons || [];
    const nextOrder = sectionLessons.length === 0 ? 1 : Math.max(0, ...sectionLessons.map((l) => l.order_number)) + 1;
    setLessonForm({
      title: '',
      description: '',
      video_url: '',
      pdf_url: '',
      test_url: '',
      order_number: String(nextOrder),
      section_id: String(sectionId),
    });
    setAddLessonOpen(true);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTariffId || !sectionForm.name.trim()) {
      toast.error("Bo'lim nomi to'ldirilishi kerak");
      return;
    }
    setSubmitting(true);
    try {
      const nextOrder = sections.length === 0 ? 1 : Math.max(0, ...sections.map((s) => s.order_number)) + 1;
      await api.post(`/tariffs/${selectedTariffId}/sections`, {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim() || undefined,
        order_number: parseInt(sectionForm.order_number, 10) || nextOrder,
      });
      toast.success("Bo'lim qo'shildi");
      setAddSectionOpen(false);
      setSectionForm({ name: '', description: '', order_number: '1' });
      await loadSections(selectedTariffId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !sectionForm.name.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/sections/${editingSection.id}`, {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim() || '',
        order_number: parseInt(sectionForm.order_number, 10) || editingSection.order_number,
      });
      toast.success("Bo'lim yangilandi");
      setEditSectionOpen(false);
      setEditingSection(null);
      if (selectedTariffId) await loadSections(selectedTariffId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    try {
      await api.delete(`/sections/${id}`);
      toast.success("Bo'lim o'chirildi");
      setDeleteSection(null);
      if (selectedTariffId) await loadSections(selectedTariffId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTariffId || !lessonForm.title.trim() || !lessonForm.section_id) {
      toast.error("Bo'lim va dars nomi to'ldirilishi kerak");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/tariffs/${selectedTariffId}/lessons`, {
        section_id: parseInt(lessonForm.section_id, 10),
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || undefined,
        video_url: lessonForm.video_url.trim() || undefined,
        pdf_url: lessonForm.pdf_url.trim() || undefined,
        test_url: lessonForm.test_url.trim() || undefined,
        order_number: parseInt(lessonForm.order_number, 10) || 1,
      });
      toast.success("Dars qo'shildi");
      setAddLessonOpen(false);
      await loadSections(selectedTariffId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    try {
      await api.delete(`/lessons/${id}`);
      toast.success("Dars o'chirildi");
      setDeleteLesson(null);
      if (selectedTariffId) await loadSections(selectedTariffId);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0);

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
          <Button
            onClick={() => {
              const nextOrder = sections.length === 0 ? 1 : Math.max(0, ...sections.map((s) => s.order_number)) + 1;
              setSectionForm({ name: '', description: '', order_number: String(nextOrder) });
              setAddSectionOpen(true);
            }}
            disabled={!selectedTariffId}
            variant="outline"
            className="w-full sm:w-auto h-11 border-[#7A2E2E]/30 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Yangi bo'lim
          </Button>
        </div>
      </div>

      {!selectedTariffId ? (
        <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl">
          <CardContent className="py-12 text-center text-[#7A2E2E]/80 font-medium">
            Iltimos, darslarni ko'rish uchun yuqoridan ta'rifni tanlang
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl">
          <CardContent className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent mb-4" />
            <p className="text-[#5D1111]/70">Yuklanmoqda...</p>
          </CardContent>
        </Card>
      ) : sections.length === 0 ? (
        <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-[#7A2E2E]/80 font-medium mb-4">Ushbu ta'rifda hali bo'limlar mavjud emas.</p>
            <Button
              onClick={() => setAddSectionOpen(true)}
              className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Birinchi bo'limni yaratish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              <Card className="border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl overflow-hidden">
              <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5D1111] text-white text-sm font-bold shrink-0 mt-0.5">
                      {sectionIndex + 1}
                    </span>
                    <div>
                      <CardTitle className="text-xl font-bold text-[#5D1111]">{section.name}</CardTitle>
                      {section.description && (
                        <p className="text-sm text-[#7A2E2E]/80 mt-2 leading-relaxed max-w-2xl">
                          {section.description}
                        </p>
                      )}
                      <p className="text-sm text-[#7A2E2E]/60 mt-1.5">
                        {section.lessons?.length || 0} ta dars · Tartib: {section.order_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[#7A2E2E] hover:bg-[#FEFBEE] rounded-xl"
                      onClick={() => {
                        setEditingSection(section);
                        setSectionForm({
                          name: section.name,
                          description: section.description || '',
                          order_number: String(section.order_number),
                        });
                        setEditSectionOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-50 rounded-xl"
                      onClick={() => setDeleteSection(section)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openAddLesson(section.id)}
                      className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Dars qo'shish
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!section.lessons || section.lessons.length === 0 ? (
                  <div className="py-8 text-center text-[#7A2E2E]/60 text-sm">
                    Bu bo'limda hali darslar yo'q
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold">
                        <tr>
                          <th className="py-3 px-6 font-medium w-16">T/R</th>
                          <th className="py-3 px-6 font-medium">Dars nomi</th>
                          <th className="py-3 px-6 font-medium">Video</th>
                          <th className="py-3 px-6 font-medium">Tartib</th>
                          <th className="py-3 px-6 font-medium text-right">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#7A2E2E]/5">
                        {section.lessons.map((l, i) => (
                          <tr key={l.id} className="hover:bg-[#FEFBEE]/30 transition-colors group">
                            <td className="py-3 px-6 text-[#5D1111]/70">{i + 1}</td>
                            <td className="py-3 px-6 font-medium text-[#5D1111]">{l.title}</td>
                            <td className="py-3 px-6">
                              {l.video_url ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Mavjud
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-3 px-6 text-[#5D1111]/80">{l.order_number}</td>
                            <td className="py-3 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {l.video_url && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-xl" asChild>
                                    <Link href={`/watch/${l.id}`} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-8 text-[#7A2E2E] hover:bg-[#FEFBEE] rounded-xl" asChild>
                                  <Link href={`/admin/lessons/${l.id}`}>Tahrirlash</Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => setDeleteLesson(l)}>
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
              {sectionIndex < sections.length - 1 && (
                <div className="flex items-center gap-4 my-2 px-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#7A2E2E]/25 to-transparent" />
                </div>
              )}
            </div>
          ))}
          {totalLessons > 0 && (
            <p className="text-sm text-[#7A2E2E]/60 text-center">
              Jami: {sections.length} bo'lim, {totalLessons} dars
            </p>
          )}
        </div>
      )}

      {/* Yangi bo'lim dialog */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Yangi bo'lim</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Bo'lim nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={sectionForm.name}
                onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Masalan: 1-bo'lim. Kirish"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Izoh</Label>
              <Textarea
                className="min-h-[100px] bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl resize-y"
                value={sectionForm.description}
                onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Bo'lim haqida qisqacha izoh..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                type="number"
                min={1}
                value={sectionForm.order_number}
                onChange={(e) => setSectionForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10">
              <Button type="button" variant="outline" onClick={() => setAddSectionOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white" disabled={submitting}>
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bo'limni tahrirlash dialog */}
      <Dialog open={editSectionOpen} onOpenChange={setEditSectionOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Bo'limni tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSection} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Bo'lim nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={sectionForm.name}
                onChange={(e) => setSectionForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Izoh</Label>
              <Textarea
                className="min-h-[100px] bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl resize-y"
                value={sectionForm.description}
                onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Bo'lim haqida qisqacha izoh..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                type="number"
                min={1}
                value={sectionForm.order_number}
                onChange={(e) => setSectionForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10">
              <Button type="button" variant="outline" onClick={() => setEditSectionOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white" disabled={submitting}>
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Yangi dars dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Yangi dars qo&apos;shish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Bo'lim *</Label>
              <select
                className="w-full h-11 border border-[#7A2E2E]/20 rounded-xl px-4 bg-[#FEFBEE]/50 text-[#5D1111] outline-none"
                value={lessonForm.section_id}
                onChange={(e) => setLessonForm((f) => ({ ...f, section_id: e.target.value }))}
                required
              >
                <option value="">Tanlang</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Dars nomi *</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tavsif</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={lessonForm.description}
                onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Video havola</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtu.be/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">PDF havola</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                value={lessonForm.pdf_url}
                onChange={(e) => setLessonForm((f) => ({ ...f, pdf_url: e.target.value }))}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
              <Input
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 rounded-xl"
                type="number"
                min={1}
                value={lessonForm.order_number}
                onChange={(e) => setLessonForm((f) => ({ ...f, order_number: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10">
              <Button type="button" variant="outline" onClick={() => setAddLessonOpen(false)}>Bekor qilish</Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white" disabled={submitting}>
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLesson} onOpenChange={(open) => !open && setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteLesson?.title}&quot; darsini rostdan ham o'chirmoqchimisiz?
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

      <AlertDialog open={!!deleteSection} onOpenChange={(open) => !open && setDeleteSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bo'limni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteSection?.name}&quot; bo'limini va uning barcha darslarini o'chirmoqchimisiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSection && handleDeleteSection(deleteSection.id)} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
