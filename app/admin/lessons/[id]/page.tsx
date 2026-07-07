'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2, ClipboardList, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', pdf_url: '', test_url: '', order_number: '1', test_questions: [] as any[] });
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
          test_url: l.test_url || '',
          order_number: String(l.order_number ?? 1),
          test_questions: Array.isArray(l.test_questions) ? l.test_questions : [],
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
        test_url: form.test_url || undefined,
        order_number: parseInt(form.order_number, 10) || 1,
        test_questions: form.test_questions,
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

  const addQuestion = () => {
    setForm(f => ({
      ...f,
      test_questions: [
        ...f.test_questions,
        { id: Date.now(), question: '', options: ['', ''], correctOptionIndex: 0 }
      ]
    }));
  };

  const removeQuestion = (qIndex: number) => {
    setForm(f => ({
      ...f,
      test_questions: f.test_questions.filter((_, i) => i !== qIndex)
    }));
  };

  const updateQuestion = (qIndex: number, field: string, value: any) => {
    setForm(f => ({
      ...f,
      test_questions: f.test_questions.map((q, i) => i === qIndex ? { ...q, [field]: value } : q)
    }));
  };

  const addOption = (qIndex: number) => {
    setForm(f => ({
      ...f,
      test_questions: f.test_questions.map((q, i) => i === qIndex ? { ...q, options: [...q.options, ''] } : q)
    }));
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setForm(f => ({
      ...f,
      test_questions: f.test_questions.map((q, i) => i === qIndex ? { 
        ...q, 
        options: q.options.filter((_: any, oi: number) => oi !== optIndex),
        correctOptionIndex: q.correctOptionIndex === optIndex ? 0 : (q.correctOptionIndex > optIndex ? q.correctOptionIndex - 1 : q.correctOptionIndex)
      } : q)
    }));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setForm(f => ({
      ...f,
      test_questions: f.test_questions.map((q, i) => i === qIndex ? {
        ...q,
        options: q.options.map((o: string, oi: number) => oi === optIndex ? value : o)
      } : q)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent text-[#5D1111]" />
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-[#5D1111] hover:bg-[#FEFBEE]" asChild>
          <Link href={lesson.tariff_id ? `/admin/lessons?tariffId=${lesson.tariff_id}` : '/admin/lessons'}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Darsni tahrirlash</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10">
              <CardTitle className="text-xl font-bold text-[#5D1111]">Asosiy ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#5D1111] font-semibold">Dars nomi *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] rounded-xl h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#5D1111] font-semibold">Tavsif</Label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full min-h-[100px] p-3 bg-[#FEFBEE]/50 border border-[#7A2E2E]/20 text-[#5D1111] focus:ring-2 focus:ring-[#5D1111] outline-none rounded-xl transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#5D1111] font-semibold">Video URL</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                    className="bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] rounded-xl h-11"
                    placeholder="YouTube unlisted..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#5D1111] font-semibold">PDF URL</Label>
                  <Input
                    value={form.pdf_url}
                    onChange={(e) => setForm((f) => ({ ...f, pdf_url: e.target.value }))}
                    className="bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] rounded-xl h-11"
                    placeholder="Google Drive..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#5D1111] font-semibold">Tartib raqami</Label>
                  <Input
                    type="number"
                    value={form.order_number}
                    onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))}
                    className="bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] rounded-xl h-11"
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl h-11 shadow-md transition-all font-bold mt-2">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saqlanmoqda…' : 'O\'zgarishlarni saqlash'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-[#5D1111]">Ichki Test Savollari</CardTitle>
                <p className="text-xs text-[#7A2E2E]/70 mt-1">Loyiha ichidagi interaktiv test savollari</p>
              </div>
              <Button onClick={addQuestion} variant="outline" className="border-[#5D1111] text-[#5D1111] hover:bg-[#5D1111] hover:text-white rounded-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Savol qo'shish
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {form.test_questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#7A2E2E]/10 rounded-2xl bg-[#FEFBEE]/30">
                  <ClipboardList className="h-12 w-12 text-[#7A2E2E]/20 mx-auto mb-4" />
                  <p className="text-[#7A2E2E]/60 font-medium">Hali savollar qo'shilmagan</p>
                  <Button onClick={addQuestion} variant="link" className="text-[#5D1111] mt-2">Yangi savol yaratish</Button>
                </div>
              ) : (
                form.test_questions.map((q, qIndex) => (
                  <div key={q.id || qIndex} className="p-6 border border-[#7A2E2E]/10 rounded-2xl bg-[#FEFBEE]/10 space-y-4 relative group">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="space-y-2">
                      <Label className="text-[#5D1111] font-bold">Savol #{qIndex + 1}</Label>
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Savol matnini kiriting..."
                        className="bg-white border-[#7A2E2E]/20 text-[#5D1111] rounded-xl"
                      />
                    </div>

                    <div className="space-y-3 pl-4 border-l-2 border-[#5D1111]/10">
                      <Label className="text-[#5D1111] font-semibold text-xs uppercase tracking-wider">Variantlar</Label>
                      {q.options.map((opt: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctOptionIndex === optIndex}
                            onChange={() => updateQuestion(qIndex, 'correctOptionIndex', optIndex)}
                            className="h-4 w-4 accent-[#5D1111] cursor-pointer"
                            title="To'g'ri javob sifatida belgilash"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Variant ${optIndex + 1}`}
                            className={`flex-1 bg-white border-[#7A2E2E]/20 text-[#5D1111] rounded-lg h-9 ${
                              q.correctOptionIndex === optIndex ? 'border-[#5D1111] ring-1 ring-[#5D1111]' : ''
                            }`}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={q.options.length <= 2}
                            className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg"
                            onClick={() => removeOption(qIndex, optIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#5D1111]/60 hover:text-[#5D1111] hover:bg-white text-xs"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Variant qo'shish
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {form.test_questions.length > 0 && (
                <div className="pt-4 flex justify-end">
                   <Button onClick={handleSave} disabled={saving} className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl h-11 px-8 shadow-md">
                    <Save className="h-4 w-4 mr-2" />
                    Barcha o'zgarishlarni saqlash
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
