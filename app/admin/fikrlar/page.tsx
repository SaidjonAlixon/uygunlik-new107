'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatTashkentDate, formatTashkentDateTime } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type FeedbackMode = 'optional' | 'required';

type FeedbackItem = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  tariff_name: string | null;
  lesson_id: number;
  lesson_title: string;
  feedback_mode: FeedbackMode;
  section_id: number | null;
  section_name: string | null;
};

type LessonSummary = {
  id: number;
  title: string;
  order_number: number;
  feedback_mode: FeedbackMode;
  section_id: number | null;
  section_name: string | null;
  feedback_count: number;
  average: number;
  last_feedback_at: string | null;
  completed_count: number;
};

type Stats = {
  total: number;
  average: number;
  last7: number;
  authors: number;
  lessons: number;
  distribution: Record<number, number>;
};

type Filters = {
  search: string;
  lessonId: string;
  rating: string;
  from: string;
  to: string;
  sort: 'newest' | 'oldest' | 'rating_desc' | 'rating_asc';
};

const EMPTY_FILTERS: Filters = { search: '', lessonId: '', rating: '', from: '', to: '', sort: 'newest' };
const PAGE_SIZE = 20;
const RATING_LABELS = ['', 'Juda yomon', 'Qoniqarsiz', 'O‘rtacha', 'Yaxshi', 'A’lo'];

function fullName(item: { first_name: string | null; last_name: string | null; email: string }) {
  const name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
  return name || item.email;
}

function initials(item: { first_name: string | null; last_name: string | null; email: string }) {
  const a = (item.first_name || '').trim().charAt(0);
  const b = (item.last_name || '').trim().charAt(0);
  return (a + b || item.email.charAt(0)).toUpperCase();
}

function wasEdited(item: FeedbackItem) {
  return new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 60_000;
}

function ratingTone(rating: number) {
  if (rating >= 4) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (rating === 3) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} yulduz`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-[#7A2E2E]/20'}`}
        />
      ))}
    </span>
  );
}

function buildQuery(filters: Filters, extra: Record<string, string>) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.lessonId) params.set('lessonId', filters.lessonId);
  if (filters.rating) params.set('rating', filters.rating);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('sort', filters.sort);
  Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  return params.toString();
}

function csvCell(value: unknown) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function FeedbackCard({ item, onDelete }: { item: FeedbackItem; onDelete: (item: FeedbackItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const long = item.comment.length > 320;

  return (
    <article className="group rounded-2xl border border-[#7A2E2E]/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5D1111] text-sm font-bold text-[#FEFBEE]">
            {initials(item)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/users/${item.user_id}`}
              className="block truncate font-semibold text-[#5D1111] hover:underline"
            >
              {fullName(item)}
            </Link>
            <p className="truncate text-xs text-[#7A2E2E]/70">
              {item.email}
              {item.tariff_name ? ` · ${item.tariff_name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-2">
            <Stars value={item.rating} />
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ratingTone(item.rating)}`}>
              {item.rating}/5 · {RATING_LABELS[item.rating]}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-[#7A2E2E]/70">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatTashkentDateTime(item.created_at, { withSeconds: false })}
            {wasEdited(item) && (
              <span
                className="ml-1 rounded bg-[#FEFBEE] px-1.5 py-0.5 text-[10px] font-medium text-[#7A2E2E]"
                title={`Tahrirlangan: ${formatTashkentDateTime(item.updated_at, { withSeconds: false })}`}
              >
                tahrirlangan
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#5D1111]/15 bg-[#FEFBEE] px-3 py-1 text-xs font-semibold text-[#5D1111]">
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.lesson_title}</span>
        </span>
        {item.section_name && (
          <span className="rounded-full bg-[#7A2E2E]/5 px-3 py-1 text-xs text-[#7A2E2E]">{item.section_name}</span>
        )}
        {item.feedback_mode === 'required' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#5D1111] px-2.5 py-1 text-[11px] font-semibold text-white">
            <ShieldCheck className="h-3 w-3" /> Majburiy
          </span>
        )}
      </div>

      <blockquote className="mt-3 rounded-xl border-l-4 border-[#5D1111]/40 bg-[#FEFBEE]/60 px-4 py-3 text-sm leading-relaxed text-[#3d0b0b]">
        <p className={`whitespace-pre-wrap break-words ${long && !expanded ? 'line-clamp-5' : ''}`}>{item.comment}</p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-semibold text-[#5D1111] hover:underline"
          >
            {expanded ? 'Qisqartirish' : 'To‘liq o‘qish'}
          </button>
        )}
      </blockquote>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item)}
          className="h-8 rounded-lg text-red-500 opacity-70 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> O‘chirish
        </Button>
      </div>
    </article>
  );
}

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<'feedback' | 'lessons'>('feedback');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState<FeedbackItem | null>(null);
  const [modeSaving, setModeSaving] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/feedback?${buildQuery(filters, { page: String(page), pageSize: String(PAGE_SIZE) })}`
      );
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats || null);
      if (Array.isArray(res.data.lessons)) setLessons(res.data.lessons);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Fikrlarni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setPage(1);
  };

  const hasFilters =
    Boolean(filters.search || filters.lessonId || filters.rating || filters.from || filters.to) ||
    filters.sort !== 'newest';

  const lessonGroups = useMemo(() => {
    const groups: { key: string; name: string; lessons: LessonSummary[] }[] = [];
    lessons.forEach((l) => {
      const key = String(l.section_id ?? 'none');
      let g = groups.find((x) => x.key === key);
      if (!g) {
        g = { key, name: l.section_name || 'Bo‘limsiz', lessons: [] };
        groups.push(g);
      }
      g.lessons.push(l);
    });
    return groups;
  }, [lessons]);

  const selectedLesson = lessons.find((l) => String(l.id) === filters.lessonId) || null;
  const requiredCount = lessons.filter((l) => l.feedback_mode === 'required').length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const maxBar = stats ? Math.max(1, ...Object.values(stats.distribution)) : 1;

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/admin/feedback/${deleting.id}`);
      toast.success('Fikr o‘chirildi');
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else setReloadKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'O‘chirib bo‘lmadi');
    }
  };

  const toggleMode = async (lesson: LessonSummary) => {
    const next: FeedbackMode = lesson.feedback_mode === 'required' ? 'optional' : 'required';
    setModeSaving(lesson.id);
    try {
      await api.patch('/admin/feedback', { lesson_id: lesson.id, feedback_mode: next });
      setLessons((prev) => prev.map((l) => (l.id === lesson.id ? { ...l, feedback_mode: next } : l)));
      setItems((prev) => prev.map((i) => (i.lesson_id === lesson.id ? { ...i, feedback_mode: next } : i)));
      toast.success(`"${lesson.title}" — fikr ${next === 'required' ? 'majburiy' : 'ixtiyoriy'} qilindi`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setModeSaving(null);
    }
  };

  const openLessonFeedback = (lessonId: number) => {
    setFilters({ ...EMPTY_FILTERS, lessonId: String(lessonId) });
    setSearchInput('');
    setPage(1);
    setTab('feedback');
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/admin/feedback?${buildQuery(filters, { all: '1', summary: '0' })}`);
      const rows: FeedbackItem[] = res.data.items || [];
      if (!rows.length) {
        toast.info('Eksport uchun fikr topilmadi');
        return;
      }
      const header = [
        'Sana (Toshkent)',
        'Tahrirlangan',
        'Foydalanuvchi',
        'Email',
        'Tarif',
        'Bo‘lim',
        'Dars',
        'Fikr rejimi',
        'Baho',
        'Fikr',
      ];
      const lines = rows.map((r) =>
        [
          formatTashkentDateTime(r.created_at),
          wasEdited(r) ? formatTashkentDateTime(r.updated_at) : '',
          fullName(r),
          r.email,
          r.tariff_name || '',
          r.section_name || '',
          r.lesson_title,
          r.feedback_mode === 'required' ? 'Majburiy' : 'Ixtiyoriy',
          r.rating,
          r.comment,
        ]
          .map(csvCell)
          .join(';')
      );
      const csv = '\uFEFF' + [header.map(csvCell).join(';'), ...lines].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dars-fikrlari-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} ta fikr yuklab olindi`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Eksport qilib bo‘lmadi');
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    {
      label: 'Jami fikrlar',
      value: stats?.total ?? 0,
      hint: stats ? `${stats.lessons} ta darsda` : '',
      icon: MessageSquareText,
    },
    {
      label: 'O‘rtacha baho',
      value: stats ? stats.average.toFixed(1) : '0.0',
      hint: stats ? <Stars value={stats.average} size="h-3.5 w-3.5" /> : '',
      icon: Star,
    },
    { label: 'Oxirgi 7 kun', value: stats?.last7 ?? 0, hint: 'yangi fikrlar', icon: TrendingUp },
    { label: 'Fikr bildirganlar', value: stats?.authors ?? 0, hint: 'noyob o‘quvchi', icon: Users },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#5D1111]">Dars fikrlari</h1>
          <p className="mt-1 text-sm text-[#7A2E2E]/75">
            O‘quvchilarning har bir dars bo‘yicha bahosi va fikrlari — kim, qachon, qaysi dars haqida nima degani.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setReloadKey((k) => k + 1)}
            className="h-10 rounded-xl border-[#7A2E2E]/25 text-[#5D1111] hover:bg-white"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Yangilash
          </Button>
          <Button
            onClick={exportCsv}
            disabled={exporting}
            className="h-10 rounded-xl bg-[#5D1111] text-white hover:bg-[#7A2E2E]"
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Excel (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {statCards.map(({ label, value, hint, icon: Icon }) => (
            <Card key={label} className="rounded-2xl border-[#7A2E2E]/10 bg-white shadow-sm">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7A2E2E]/65">{label}</p>
                  <p className="mt-1.5 text-3xl font-bold tabular-nums text-[#5D1111]">{value}</p>
                  <div className="mt-1 text-xs text-[#7A2E2E]/65">{hint}</div>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEFBEE] text-[#5D1111]">
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-[#7A2E2E]/10 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A2E2E]/65">Baholar taqsimoti</p>
              {filters.rating && (
                <button
                  type="button"
                  onClick={() => updateFilter('rating', '')}
                  className="text-[11px] font-semibold text-[#5D1111] hover:underline"
                >
                  Hammasi
                </button>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = stats?.distribution[r] ?? 0;
                const share = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                const active = filters.rating === String(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => updateFilter('rating', active ? '' : String(r))}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors ${
                      active ? 'bg-[#FEFBEE] ring-1 ring-[#5D1111]/30' : 'hover:bg-[#FEFBEE]/70'
                    }`}
                    title={`${r} yulduzli fikrlarni ko‘rsatish`}
                  >
                    <span className="flex w-8 items-center gap-0.5 text-xs font-semibold text-[#5D1111]">
                      {r} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#7A2E2E]/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-[width] duration-500"
                        style={{ width: `${(count / maxBar) * 100}%` }}
                      />
                    </span>
                    <span className="w-16 text-right text-xs tabular-nums text-[#7A2E2E]/80">
                      {count} <span className="text-[#7A2E2E]/50">({share}%)</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="inline-flex rounded-xl border border-[#7A2E2E]/15 bg-white p-1 shadow-sm">
        {(
          [
            ['feedback', 'Barcha fikrlar', MessageSquareText],
            ['lessons', 'Darslar bo‘yicha', BookOpen],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === key ? 'bg-[#5D1111] text-white shadow' : 'text-[#5D1111] hover:bg-[#FEFBEE]'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'feedback' ? (
        <div className="space-y-4">
          <Card className="rounded-2xl border-[#7A2E2E]/10 bg-white shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="relative md:col-span-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A2E2E]/50" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Ism, email yoki fikr matni..."
                    className="h-10 rounded-xl border-[#7A2E2E]/20 bg-[#FEFBEE]/50 pl-9 text-[#5D1111]"
                  />
                </div>
                <select
                  value={filters.lessonId}
                  onChange={(e) => updateFilter('lessonId', e.target.value)}
                  className="h-10 rounded-xl border border-[#7A2E2E]/20 bg-[#FEFBEE]/50 px-3 text-sm text-[#5D1111] outline-none focus:ring-2 focus:ring-[#5D1111] md:col-span-4"
                >
                  <option value="">Barcha darslar</option>
                  {lessonGroups.map((g) => (
                    <optgroup key={g.key} label={g.name}>
                      {g.lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} ({l.feedback_count})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <select
                  value={filters.rating}
                  onChange={(e) => updateFilter('rating', e.target.value)}
                  className="h-10 rounded-xl border border-[#7A2E2E]/20 bg-[#FEFBEE]/50 px-3 text-sm text-[#5D1111] outline-none focus:ring-2 focus:ring-[#5D1111] md:col-span-2"
                >
                  <option value="">Barcha baholar</option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} yulduz — {RATING_LABELS[r]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value as Filters['sort'])}
                  className="h-10 rounded-xl border border-[#7A2E2E]/20 bg-[#FEFBEE]/50 px-3 text-sm text-[#5D1111] outline-none focus:ring-2 focus:ring-[#5D1111] md:col-span-2"
                >
                  <option value="newest">Eng yangilari</option>
                  <option value="oldest">Eng eskilari</option>
                  <option value="rating_desc">Baho: yuqoridan</option>
                  <option value="rating_asc">Baho: pastdan</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#7A2E2E]/65">
                  <Filter className="h-3.5 w-3.5" /> Sana
                </span>
                <Input
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) => updateFilter('from', e.target.value)}
                  className="h-9 w-auto rounded-lg border-[#7A2E2E]/20 bg-[#FEFBEE]/50 text-sm text-[#5D1111]"
                />
                <span className="text-[#7A2E2E]/50">—</span>
                <Input
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) => updateFilter('to', e.target.value)}
                  className="h-9 w-auto rounded-lg border-[#7A2E2E]/20 bg-[#FEFBEE]/50 text-sm text-[#5D1111]"
                />
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-9 rounded-lg text-[#5D1111] hover:bg-[#FEFBEE]"
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> Filtrlarni tozalash
                  </Button>
                )}
                <span className="ml-auto text-sm text-[#7A2E2E]/75">
                  Topildi: <b className="text-[#5D1111]">{total}</b> ta fikr
                </span>
              </div>
            </CardContent>
          </Card>

          {selectedLesson && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#5D1111]/15 bg-white px-5 py-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7A2E2E]/65">
                  {selectedLesson.section_name || 'Dars'}
                </p>
                <p className="truncate text-lg font-bold text-[#5D1111]">{selectedLesson.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#7A2E2E]">
                <span>
                  Ko‘rib bo‘lgan: <b className="text-[#5D1111]">{selectedLesson.completed_count}</b>
                </span>
                <span>
                  Fikr: <b className="text-[#5D1111]">{selectedLesson.feedback_count}</b>
                </span>
                <span className="flex items-center gap-1.5">
                  <Stars value={selectedLesson.average} size="h-3.5 w-3.5" />
                  <b className="text-[#5D1111]">{selectedLesson.average.toFixed(1)}</b>
                </span>
                <ModeToggle
                  mode={selectedLesson.feedback_mode}
                  saving={modeSaving === selectedLesson.id}
                  onToggle={() => toggleMode(selectedLesson)}
                />
              </div>
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#7A2E2E]/10 bg-white py-16 text-[#7A2E2E]/70">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#5D1111]" />
              Yuklanmoqda...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#7A2E2E]/15 bg-white/70 px-6 py-16 text-center">
              <MessageSquareText className="mb-3 h-12 w-12 text-[#7A2E2E]/25" />
              <p className="font-semibold text-[#5D1111]">
                {hasFilters ? 'Filtr bo‘yicha fikr topilmadi' : 'Hali fikrlar yo‘q'}
              </p>
              <p className="mt-1 max-w-md text-sm text-[#7A2E2E]/70">
                {hasFilters
                  ? 'Filtrlarni o‘zgartirib ko‘ring.'
                  : 'O‘quvchilar darsni to‘liq ko‘rgach, dars sahifasida baho va fikr qoldira oladi. Ular shu yerda paydo bo‘ladi.'}
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
              {items.map((item) => (
                <FeedbackCard key={item.id} item={item} onDelete={setDeleting} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border-[#7A2E2E]/20 text-[#5D1111]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm text-[#7A2E2E]">
                <b className="text-[#5D1111]">{page}</b> / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border-[#7A2E2E]/20 text-[#5D1111]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-[#7A2E2E]/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#7A2E2E]/10 bg-[#FEFBEE]/50 px-5 py-4">
            <p className="text-sm text-[#7A2E2E]">
              Jami <b className="text-[#5D1111]">{lessons.length}</b> ta dars · fikr majburiy:{' '}
              <b className="text-[#5D1111]">{requiredCount}</b>
            </p>
            <p className="text-xs text-[#7A2E2E]/65">
              “Majburiy” darslarda o‘quvchi fikr qoldirmaguncha test ochilmaydi. Rejimni bosib almashtiring.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] [&_th]:whitespace-nowrap">
                <tr>
                  <th className="px-5 py-3 font-medium">Dars</th>
                  <th className="px-5 py-3 font-medium">Fikr rejimi</th>
                  <th className="px-5 py-3 text-center font-medium">To‘liq ko‘rgan</th>
                  <th className="px-5 py-3 text-center font-medium">Fikrlar</th>
                  <th className="px-5 py-3 font-medium">Qamrov</th>
                  <th className="px-5 py-3 font-medium">O‘rtacha baho</th>
                  <th className="px-5 py-3 font-medium">Oxirgi fikr</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {lessonGroups.map((g) => (
                  <Fragment key={g.key}>
                    <tr className="bg-[#5D1111]/[0.04]">
                      <td colSpan={8} className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-[#5D1111]">
                        {g.name}
                      </td>
                    </tr>
                    {g.lessons.map((l) => {
                      const coverage = l.completed_count
                        ? Math.min(100, Math.round((l.feedback_count / l.completed_count) * 100))
                        : 0;
                      return (
                        <tr key={l.id} className="border-t border-[#7A2E2E]/5 hover:bg-[#FEFBEE]/40">
                          <td className="max-w-[280px] px-5 py-3 font-medium text-[#5D1111]">
                            <span className="line-clamp-2">{l.title}</span>
                          </td>
                          <td className="px-5 py-3">
                            <ModeToggle
                              mode={l.feedback_mode}
                              saving={modeSaving === l.id}
                              onToggle={() => toggleMode(l)}
                            />
                          </td>
                          <td className="px-5 py-3 text-center tabular-nums text-[#5D1111]">{l.completed_count}</td>
                          <td className="px-5 py-3 text-center font-semibold tabular-nums text-[#5D1111]">
                            {l.feedback_count}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#7A2E2E]/10">
                                <span
                                  className="block h-full rounded-full bg-[#5D1111]"
                                  style={{ width: `${coverage}%` }}
                                />
                              </span>
                              <span className="text-xs tabular-nums text-[#7A2E2E]">{coverage}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {l.feedback_count ? (
                              <span className="flex items-center gap-1.5">
                                <Stars value={l.average} size="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold text-[#5D1111]">{l.average.toFixed(1)}</span>
                              </span>
                            ) : (
                              <span className="text-[#7A2E2E]/40">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-xs text-[#7A2E2E]/80">
                            {l.last_feedback_at ? formatTashkentDate(l.last_feedback_at) : '—'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!l.feedback_count}
                              onClick={() => openLessonFeedback(l.id)}
                              className="h-8 whitespace-nowrap rounded-lg text-[#5D1111] hover:bg-[#FEFBEE]"
                            >
                              Fikrlarni ko‘rish
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                {lessons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#7A2E2E]/70">
                      {loading ? 'Yuklanmoqda...' : 'Darslar topilmadi'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fikrni o‘chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `${fullName(deleting)} ning "${deleting.lesson_title}" darsi bo‘yicha fikri o‘chiriladi.` : ''}
              {deleting?.feedback_mode === 'required' &&
                ' Bu dars uchun fikr majburiy — o‘quvchi testni ishlash uchun qayta fikr qoldirishi kerak bo‘ladi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              O‘chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ModeToggle({ mode, saving, onToggle }: { mode: FeedbackMode; saving: boolean; onToggle: () => void }) {
  const required = mode === 'required';
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      title="Bosib almashtiring"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
        required
          ? 'border-[#5D1111] bg-[#5D1111] text-white hover:bg-[#7A2E2E]'
          : 'border-[#7A2E2E]/20 bg-[#FEFBEE] text-[#7A2E2E] hover:border-[#5D1111]/50'
      }`}
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : required ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : (
        <MessageSquareText className="h-3.5 w-3.5" />
      )}
      {required ? 'Majburiy' : 'Ixtiyoriy'}
    </button>
  );
}
