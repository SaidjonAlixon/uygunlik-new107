'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Loader2, ClipboardList } from 'lucide-react';
import { RatingEntry, RatingData } from '@/types/rating';

type Period = 'today' | 'week' | 'last_week';
type ViewType = 'overall' | 'section' | 'lesson';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Haftalik' },
  { value: 'last_week', label: "O'tgan hafta" },
];

const VIEW_OPTIONS: { value: ViewType; label: string; needsTariff?: boolean }[] = [
  { value: 'overall', label: 'Umumiy' },
  { value: 'section', label: "Bo'lim", needsTariff: true },
  { value: 'lesson', label: 'Darslik', needsTariff: true },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-bold text-gray-500">{rank}</span>;
}

function RatingTable({
  entries,
  emptyMessage,
}: {
  entries: RatingEntry[];
  emptyMessage: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-4 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="py-3 px-4 text-left font-semibold w-14">#</th>
            <th className="py-3 px-4 text-left font-semibold">Foydalanuvchi</th>
            <th className="py-3 px-4 text-center font-semibold">Ishlangan testlar</th>
            <th className="py-3 px-4 text-center font-semibold">Umumiy natija</th>
            <th className="py-3 px-4 text-center font-semibold">Foiz</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr
              key={entry.user_id}
              className={entry.rank <= 3 ? 'bg-amber-50/40' : 'hover:bg-gray-50/80'}
            >
              <td className="py-3 px-4">
                <div className="flex items-center justify-center">
                  <RankBadge rank={entry.rank} />
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{entry.full_name}</span>
                  {entry.is_perfect && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-emerald-600" />
                      100%
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-bold">
                  {entry.tests_count} ta
                </span>
              </td>
              <td className="py-3 px-4 text-center text-gray-700 font-medium">
                {entry.score} / {entry.total_questions}
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-full text-xs font-bold ${
                    entry.is_perfect
                      ? 'bg-emerald-100 text-emerald-800'
                      : entry.percentage >= 70
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {entry.percentage}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardRatingTab({ tariffId, tariffName }: { tariffId?: number; tariffName?: string }) {
  const [period, setPeriod] = useState<Period>('week');
  const [viewType, setViewType] = useState<ViewType>('overall');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [data, setData] = useState<RatingData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = tariffId
      ? `/ratings?period=${period}&tariffId=${tariffId}`
      : `/ratings?period=${period}`;
    api
      .get<RatingData>(query)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tariffId, period]);

  const allLessons = useMemo(() => {
    if (!data) return [];
    return data.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        ...lesson,
        sectionName: section.name,
        sectionId: section.id,
      }))
    );
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (viewType === 'section' && !selectedSectionId && data.sections.length > 0) {
      setSelectedSectionId(String(data.sections[0].id));
    }
    if (viewType === 'lesson' && !selectedLessonId && allLessons.length > 0) {
      setSelectedLessonId(String(allLessons[0].id));
    }
  }, [data, viewType, selectedSectionId, selectedLessonId, allLessons]);

  const activeLeaderboard = useMemo(() => {
    if (!data) return { entries: [] as RatingEntry[], title: '', description: '' };

    if (viewType === 'overall') {
      return {
        entries: data.overall_leaderboard,
        title: 'Umumiy reyting',
        description: `${data.period_label} — kim ko'p test ishlagan, shuncha yuqorida`,
      };
    }

    if (viewType === 'section') {
      const section = data.sections.find((s) => String(s.id) === selectedSectionId);
      return {
        entries: section?.leaderboard || [],
        title: section ? `${section.name} — bo'lim reytingi` : "Bo'lim reytingi",
        description: section
          ? `${data.period_label} — bo'limdagi testlar soni bo'yicha`
          : "Bo'limni tanlang",
      };
    }

    const lesson = allLessons.find((l) => String(l.id) === selectedLessonId);
    return {
      entries: lesson?.leaderboard || [],
      title: lesson ? `${lesson.title} — darslik reytingi` : 'Darslik reytingi',
      description: lesson
        ? `${data.period_label} — darslik testlari soni bo'yicha`
        : 'Darslikni tanlang',
    };
  }, [data, viewType, selectedSectionId, selectedLessonId, allLessons]);

  const handleViewChange = (next: ViewType) => {
    if ((next === 'section' || next === 'lesson') && !tariffId) return;
    setViewType(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reyting jadvali</h2>
            <p className="text-sm text-gray-600 mt-1">
              Barcha testlar bo'yicha — ishlangan testlar soni asosida reyting
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  period === opt.value
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-2 flex-wrap">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleViewChange(opt.value)}
                disabled={opt.needsTariff && !tariffId}
                title={opt.needsTariff && !tariffId ? "Bo'lim va darslik uchun tarif kerak" : undefined}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  viewType === opt.value
                    ? 'bg-[#5D1111] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {viewType === 'section' && data && data.sections.length > 0 && (
            <select
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 min-w-[200px]"
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            >
              {data.sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          {viewType === 'lesson' && allLessons.length > 0 && (
            <select
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 min-w-[240px]"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
            >
              {data?.sections.map((section) => {
                const sectionLessons = section.lessons;
                if (sectionLessons.length === 0) return null;
                return (
                  <optgroup key={section.id} label={section.name}>
                    {sectionLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <span className="text-gray-600">Reyting yuklanmoqda...</span>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Reyting ma'lumotlarini yuklashda xatolik yuz berdi.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle>{activeLeaderboard.title}</CardTitle>
                <CardDescription>{activeLeaderboard.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {viewType !== 'overall' && !tariffId ? (
              <div className="py-8 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm">
                  Bo'lim yoki darslik reytingi uchun tarifga ega bo'lishingiz kerak.
                </p>
              </div>
            ) : (
              <>
                <RatingTable
                  entries={activeLeaderboard.entries}
                  emptyMessage={
                    data.total_submissions === 0
                      ? `${data.period_label} davrida hech kim test topshirmagan.`
                      : `${data.period_label} davrida bu bo'yicha natijalar topilmadi.`
                  }
                />
                {viewType === 'overall' && data.overall_leaderboard.length > 0 && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Reyting tartibi: avval ishlangan testlar soni, keyin umumiy foiz
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
