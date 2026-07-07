'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/services/admin.service';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Users, ArrowRight, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

export default function AdminTestsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    // Fetch all lessons with their tariff info
    api.get('/admin/lessons/all')
      .then((res) => setLessons(res.data || []))
      .catch(() => setLessons([]))
      .finally(() => setLoadingLessons(false));

    // Fetch all test submissions
    adminApi.getTestSubmissions()
      .then((res) => setSubmissions(res.data || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubmissions(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Testlar va Natijalar</h1>
          <p className="text-[#7A2E2E]/80 mt-1">Darslar testlarini boshqarish va foydalanuvchilar natijalari</p>
        </div>
      </div>

      <Tabs defaultValue="lessons" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6 bg-[#FEFBEE] border border-[#7A2E2E]/20 p-1 rounded-xl">
          <TabsTrigger value="lessons" className="rounded-lg data-[state=active]:bg-[#5D1111] data-[state=active]:text-white">
            <ClipboardList className="h-4 w-4 mr-2" />
            Darslar testlari
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-[#5D1111] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Natijalar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10">
              <CardTitle className="text-xl font-bold text-[#5D1111]">Darslar ro'yxati</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLessons ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent mb-4" />
                  <p className="text-[#5D1111]/70">Darslar yuklanmoqda...</p>
                </div>
              ) : lessons.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Darslar topilmadi.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold border-b border-[#7A2E2E]/10">
                      <tr>
                        <th className="py-4 px-6">Dars nomi</th>
                        <th className="py-4 px-6">Ta'rif</th>
                        <th className="py-4 px-6">Ichki test</th>
                        <th className="py-4 px-6 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7A2E2E]/5">
                      {lessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-[#FEFBEE]/30 transition-colors">
                          <td className="py-4 px-6 font-medium text-[#5D1111]">{lesson.title}</td>
                          <td className="py-4 px-6 text-[#5D1111]/70">
                             <span className="px-2 py-1 bg-[#FEFBEE] border border-[#7A2E2E]/10 rounded-lg text-xs font-semibold">
                               {lesson.tariff_name || '—'}
                             </span>
                          </td>
                          <td className="py-4 px-6">
                            {lesson.test_questions && lesson.test_questions.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                {lesson.test_questions.length} savol
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Mavjud emas</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" className="text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" asChild>
                              <Link href={`/admin/lessons/${lesson.id}`}>
                                Savollarni tahrirlash
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

        <TabsContent value="results">
          <Card className="border-[#7A2E2E]/10 bg-white shadow-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10">
              <CardTitle className="text-xl font-bold text-[#5D1111]">Oxirgi test natijalari</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSubmissions ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent mb-4" />
                  <p className="text-[#5D1111]/70">Natijalar yuklanmoqda...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center text-[#7A2E2E]/70">Hali hech qanday natija mavjud emas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-semibold border-b border-[#7A2E2E]/10">
                      <tr>
                        <th className="py-4 px-6">Foydalanuvchi</th>
                        <th className="py-4 px-6">Dars</th>
                        <th className="py-4 px-6">Ball</th>
                        <th className="py-4 px-6">Sana</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#7A2E2E]/5">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#FEFBEE]/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-medium text-[#5D1111]">{sub.first_name} {sub.last_name}</div>
                            <div className="text-xs text-[#7A2E2E]/60">{sub.email}</div>
                          </td>
                          <td className="py-4 px-6 text-[#5D1111]">{sub.lesson_title}</td>
                          <td className="py-4 px-6">
                            <div className="text-lg font-bold text-[#5D1111]">{sub.score} / {sub.total_questions}</div>
                            <div className="text-[10px] uppercase font-bold text-[#7A2E2E]/50">Foiz: {Math.round((sub.score / sub.total_questions) * 100)}%</div>
                          </td>
                          <td className="py-4 px-6 text-[#5D1111]/70">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#7A2E2E]/40" />
                              {format(new Date(sub.created_at), 'd-MMM, HH:mm', { locale: uz })}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              (sub.score / sub.total_questions) >= 0.7 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {(sub.score / sub.total_questions) >= 0.7 ? 'Muvaffaqiyatli' : 'Yozilmadi'}
                            </span>
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
      </Tabs>
    </div>
  );
}
