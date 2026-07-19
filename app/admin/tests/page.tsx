'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/admin.service';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ClipboardList,
  Users,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FolderOpen,
  Plus,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  Search,
  XCircle,
  Percent,
  X,
} from 'lucide-react';
import { formatTashkentDateTime } from '@/lib/datetime';
import { toast } from 'sonner';
import { LessonSection } from '@/types/section';

type Q = { id: number; question: string; options: string[]; correctOptionIndex: number };

function submissionPercent(sub: { score: number; total_questions: number }) {
  if (!sub.total_questions) return 0;
  return Math.round((sub.score / sub.total_questions) * 100);
}

export default function AdminTestsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsFilter, setResultsFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [exporting, setExporting] = useState(false);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LessonSection | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(() => {
    setLoadingLessons(true);
    setLoadingSections(true);
    setLoadingSubmissions(true);

    api.get('/admin/lessons/all')
      .then((res) => setLessons(res.data || []))
      .catch(() => setLessons([]))
      .finally(() => setLoadingLessons(false));

    api.get('/sections')
      .then((res) => setSections(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));

    adminApi.getTestSubmissions()
      .then((res) => setSubmissions(res.data || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubmissions(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openSectionTest = (section: LessonSection) => {
    setEditingSection(section);
    const qs = Array.isArray(section.test_questions) ? section.test_questions : [];
    setQuestions(
      qs.length
        ? qs.map((q: any, i: number) => ({
            id: q.id || Date.now() + i,
            question: q.question || '',
            options: q.options?.length ? q.options : ['', ''],
            correctOptionIndex: q.correctOptionIndex ?? 0,
          }))
        : [{ id: Date.now(), question: '', options: ['', ''], correctOptionIndex: 0 }]
    );
    setSectionDialogOpen(true);
  };

  const saveSectionTest = async () => {
    if (!editingSection) return;
    const cleaned = questions
      .map((q) => ({
        id: q.id,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correctOptionIndex: q.correctOptionIndex,
      }))
      .filter((q) => q.question && q.options.length >= 2);

    setSubmitting(true);
    try {
      await api.patch(`/sections/${editingSection.id}`, { test_questions: cleaned });
      toast.success("Bo'lim testi saqlandi");
      setSectionDialogOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const clearSectionTest = async (section: LessonSection) => {
    if (!confirm(`"${section.name}" bo'limidagi barcha test savollari o'chirilsinmi?`)) return;
    try {
      await api.patch(`/sections/${section.id}`, { test_questions: [] });
      toast.success("Bo'lim testi tozalandi");
      if (editingSection?.id === section.id) {
        setSectionDialogOpen(false);
        setEditingSection(null);
      }
      loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const allowRetake = async (submissionId: number) => {
    try {
      await adminApi.allowTestRetake(submissionId);
      toast.success('Qayta ishlashga ruxsat berildi');
      loadAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const filteredSubmissions = useMemo(() => {
    const q = resultsSearch.trim().toLowerCase();
    return submissions.filter((sub) => {
      const pct = submissionPercent(sub);
      if (resultsFilter === 'pass' && pct < 70) return false;
      if (resultsFilter === 'fail' && pct >= 70) return false;
      if (!q) return true;
      const hay = [
        sub.first_name,
        sub.last_name,
        sub.email,
        sub.lesson_title,
        sub.section_name,
        sub.tariff_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [submissions, resultsSearch, resultsFilter]);

  const resultsStats = useMemo(() => {
    const total = submissions.length;
    const uniqueUsers = new Set(submissions.map((s) => s.user_id)).size;
    const passed = submissions.filter((s) => submissionPercent(s) >= 70).length;
    const failed = total - passed;
    const avgPct =
      total > 0
        ? Math.round(
            submissions.reduce((sum, s) => sum + submissionPercent(s), 0) / total
          )
        : 0;
    return { total, uniqueUsers, passed, failed, avgPct };
  }, [submissions]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportTestsExcel();
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      const disposition = res.headers?.['content-disposition'] as string | undefined;
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `test-natijalari-${Date.now()}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel yuklandi');
    } catch {
      toast.error('Excel yuklashda xato');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Testlar va Natijalar</h1>
        <p className="text-[#7A2E2E]/80 mt-1">
          Barcha darslar, bo&apos;lim testlari va qayta ishlash ruxsati
        </p>
      </div>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[560px] mb-6 bg-[#FEFBEE] border border-[#7A2E2E]/20 p-1 rounded-xl">
          <TabsTrigger value="lessons" className="rounded-lg data-[state=active]:bg-[#5D1111] data-[state=active]:text-white">
            <ClipboardList className="h-4 w-4 mr-2" />
            Darslar
          </TabsTrigger>
          <TabsTrigger value="sections" className="rounded-lg data-[state=active]:bg-[#5D1111] data-[state=active]:text-white">
            <FolderOpen className="h-4 w-4 mr-2" />
            Bo&apos;lim testlari
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-[#5D1111] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Natijalar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10">
              <CardTitle className="text-xl font-bold text-[#5D1111]">
                Barcha kiritilgan darslar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLessons ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Darslar topilmadi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold border-b border-[#7A2E2E]/10">
                      <tr>
                        <th className="py-4 px-6">Dars nomi</th>
                        <th className="py-4 px-6">Bo&apos;lim</th>
                        <th className="py-4 px-6">Ta&apos;rif</th>
                        <th className="py-4 px-6">Test</th>
                        <th className="py-4 px-6 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7A2E2E]/5">
                      {lessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-[#FEFBEE]/30">
                          <td className="py-4 px-6 font-medium text-[#5D1111]">{lesson.title}</td>
                          <td className="py-4 px-6 text-[#5D1111]/70">{lesson.section_name || '—'}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-1 bg-[#FEFBEE] border border-[#7A2E2E]/10 rounded-lg text-xs font-semibold">
                              {lesson.tariff_name || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {lesson.test_questions?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                {lesson.test_questions.length} savol
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Yo&apos;q</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" className="text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" asChild>
                              <Link href={`/admin/lessons/${lesson.id}`}>
                                Test qo&apos;shish / tahrirlash
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
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
        </TabsContent>

        <TabsContent value="sections">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10">
              <CardTitle className="text-xl font-bold text-[#5D1111]">
                Bo&apos;lim yakuniy testlari
              </CardTitle>
              <p className="text-sm text-[#7A2E2E]/70 mt-1">
                Barcha darslar ko&apos;rilgach foydalanuvchi bo&apos;lim testini ishlay oladi
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSections ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
                </div>
              ) : sections.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Bo&apos;limlar yo&apos;q.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold border-b">
                      <tr>
                        <th className="py-4 px-6">Bo&apos;lim</th>
                        <th className="py-4 px-6">Darslar</th>
                        <th className="py-4 px-6">Test</th>
                        <th className="py-4 px-6 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7A2E2E]/5">
                      {sections.map((section) => {
                        const qCount = Array.isArray(section.test_questions)
                          ? section.test_questions.length
                          : 0;
                        return (
                          <tr key={section.id} className="hover:bg-[#FEFBEE]/30">
                            <td className="py-4 px-6 font-medium text-[#5D1111]">{section.name}</td>
                            <td className="py-4 px-6 text-[#5D1111]/70">
                              {section.lessons?.length ?? '—'}
                            </td>
                            <td className="py-4 px-6">
                              {qCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {qCount} savol
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Yo&apos;q</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  className="text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl"
                                  onClick={() => openSectionTest(section)}
                                >
                                  {qCount > 0 ? 'Tahrirlash' : "Test yaratish"}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                {qCount > 0 && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                    title="Testni tozalash"
                                    onClick={() => clearSectionTest(section)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Jami topshirish', value: resultsStats.total, icon: ClipboardList },
              { label: 'Ishtirokchilar', value: resultsStats.uniqueUsers, icon: Users },
              { label: "O'tganlar", value: resultsStats.passed, icon: CheckCircle2 },
              { label: 'Yiqilganlar', value: resultsStats.failed, icon: XCircle },
              { label: "O'rtacha foiz", value: `${resultsStats.avgPct}%`, icon: Percent },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#7A2E2E]/12 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2 text-[#7A2E2E]/70 text-xs font-medium">
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </div>
                <div className="mt-1 text-2xl font-serif font-bold text-[#5D1111]">{stat.value}</div>
              </div>
            ))}
          </div>

          <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-bold text-[#5D1111]">Test natijalari</CardTitle>
                  <p className="text-sm text-[#7A2E2E]/70 mt-1">
                    To&apos;liq ro&apos;yxat — Excelda 3 varaq: natijalar, umumiy, reyting
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={exporting || submissions.length === 0}
                  onClick={handleExportExcel}
                  className="h-11 bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl px-5 shadow-sm"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  {exporting ? 'Yuklanmoqda…' : 'Excel yuklash'}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A2E2E]/50" />
                  <Input
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    placeholder="Ism, email, test, bo'lim, tarif..."
                    className="pl-10 h-10 bg-white border-[#7A2E2E]/20 rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  {(
                    [
                      { key: 'all', label: 'Hammasi' },
                      { key: 'pass', label: "O'tgan" },
                      { key: 'fail', label: 'Yiqilgan' },
                    ] as const
                  ).map((f) => (
                    <Button
                      key={f.key}
                      type="button"
                      size="sm"
                      variant={resultsFilter === f.key ? 'default' : 'outline'}
                      onClick={() => setResultsFilter(f.key)}
                      className={`rounded-xl h-10 ${
                        resultsFilter === f.key
                          ? 'bg-[#5D1111] text-white hover:bg-[#7A2E2E]'
                          : 'border-[#7A2E2E]/20 text-[#5D1111]'
                      }`}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSubmissions ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Natijalar yo&apos;q.</div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Qidiruv bo&apos;yicha natija topilmadi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[960px]">
                    <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold border-b border-[#7A2E2E]/10">
                      <tr>
                        <th className="py-3.5 px-4">#</th>
                        <th className="py-3.5 px-4">Foydalanuvchi</th>
                        <th className="py-3.5 px-4">Tarif</th>
                        <th className="py-3.5 px-4">Bo&apos;lim</th>
                        <th className="py-3.5 px-4">Test</th>
                        <th className="py-3.5 px-4">Ball</th>
                        <th className="py-3.5 px-4">Foiz</th>
                        <th className="py-3.5 px-4">Holat</th>
                        <th className="py-3.5 px-4">Sana (Toshkent)</th>
                        <th className="py-3.5 px-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7A2E2E]/5">
                      {filteredSubmissions.map((sub, index) => {
                        const pct = submissionPercent(sub);
                        const wrong = Math.max(0, (sub.total_questions || 0) - (sub.score || 0));
                        const passed = pct >= 70;
                        return (
                          <tr key={sub.id} className="hover:bg-[#FEFBEE]/40">
                            <td className="py-3.5 px-4 text-[#7A2E2E]/50 font-medium">{index + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#5D1111]">
                                {sub.first_name} {sub.last_name}
                              </div>
                              <div className="text-xs text-[#7A2E2E]/60">{sub.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold bg-[#FEFBEE] border border-[#7A2E2E]/10 text-[#5D1111]">
                                {sub.tariff_name || '—'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#5D1111]/80">{sub.section_name || '—'}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-[#5D1111]">
                                {sub.lesson_title || sub.section_name || '—'}
                              </div>
                              {sub.section_id && !sub.lesson_id && (
                                <span className="text-[11px] text-[#7A2E2E]/60">Bo&apos;lim testi</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#5D1111]">
                                {sub.score} / {sub.total_questions}
                              </div>
                              <div className="text-[11px] text-[#7A2E2E]/55">
                                To&apos;g&apos;ri {sub.score} · Noto&apos;g&apos;ri {wrong}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#5D1111]">{pct}%</div>
                              <div className="mt-1 h-1.5 w-16 rounded-full bg-[#7A2E2E]/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                  passed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {passed ? "O'tdi" : 'Yiqildi'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#5D1111]/75 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {formatTashkentDateTime(sub.created_at)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {!sub.retake_allowed ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-[#7A2E2E]/25"
                                  onClick={() => allowRetake(sub.id)}
                                  title="Qayta ishlashga ruxsat"
                                >
                                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                  Qayta ruxsat
                                </Button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">Ruxsat berilgan</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-[#7A2E2E]/10 text-xs text-[#7A2E2E]/60 bg-[#FEFBEE]/40">
                    Ko&apos;rsatilmoqda: <b className="text-[#5D1111]">{filteredSubmissions.length}</b> / {submissions.length}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bo'lim testi dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="bg-white sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#5D1111]">
              {editingSection?.name} — bo&apos;lim testi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-[#7A2E2E]/15 p-4 space-y-3 bg-[#FEFBEE]/30">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold text-[#5D1111]">{qi + 1}-savol</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    title="Savolni o'chirish"
                    onClick={() =>
                      setQuestions((prev) => {
                        const next = prev.filter((_, i) => i !== qi);
                        return next.length
                          ? next
                          : [{ id: Date.now(), question: '', options: ['', ''], correctOptionIndex: 0 }];
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={q.question}
                  onChange={(e) =>
                    setQuestions((prev) =>
                      prev.map((item, i) => (i === qi ? { ...item, question: e.target.value } : item))
                    )
                  }
                  placeholder="Savol matni"
                  className="rounded-xl"
                />
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctOptionIndex === oi}
                      onChange={() =>
                        setQuestions((prev) =>
                          prev.map((item, i) =>
                            i === qi ? { ...item, correctOptionIndex: oi } : item
                          )
                        )
                      }
                      className="h-4 w-4 accent-[#5D1111] cursor-pointer"
                      title="To'g'ri javob sifatida belgilash"
                    />
                    <Input
                      value={opt}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item, i) => {
                            if (i !== qi) return item;
                            const options = [...item.options];
                            options[oi] = e.target.value;
                            return { ...item, options };
                          })
                        )
                      }
                      placeholder={`${oi + 1}-variant`}
                      className="rounded-xl flex-1"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={q.options.length <= 2}
                      className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 rounded-lg"
                      title="Variantni o'chirish"
                      onClick={() =>
                        setQuestions((prev) =>
                          prev.map((item, i) => {
                            if (i !== qi) return item;
                            const options = item.options.filter((_, idx) => idx !== oi);
                            const correctOptionIndex =
                              item.correctOptionIndex === oi
                                ? 0
                                : item.correctOptionIndex > oi
                                  ? item.correctOptionIndex - 1
                                  : item.correctOptionIndex;
                            return { ...item, options, correctOptionIndex };
                          })
                        )
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setQuestions((prev) =>
                      prev.map((item, i) =>
                        i === qi ? { ...item, options: [...item.options, ''] } : item
                      )
                    )
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Variant
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() =>
                setQuestions((prev) => [
                  ...prev,
                  { id: Date.now(), question: '', options: ['', ''], correctOptionIndex: 0 },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Savol qo&apos;shish
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              Bekor
            </Button>
            <Button
              className="bg-[#5D1111] text-white"
              disabled={submitting}
              onClick={saveSectionTest}
            >
              {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
