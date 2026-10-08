"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PlayCircle, LogOut, Video, MessageSquareText, ArrowLeft, ChevronRight, ChevronDown, Lock, Layers, Eye, EyeOff, CheckCircle2, ClipboardCheck, Trophy, RotateCcw } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import UserService from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { LessonSection } from "@/types/section";
import type { Lesson } from "@/types/lesson";
import { lessonStep, sectionPercent, type LessonStep } from "@/lib/section-progress";
import DashboardRatingTab from "@/components/dashboard-rating-tab";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const profileFormSchema = z.object({
  first_name: z
    .string()
    .min(2, { message: "Ism kamida 2 harfdan iborat bo'lishi kerak." }),
  last_name: z
    .string()
    .min(2, { message: "Familiya kamida 2 harfdan iborat bo'lishi kerak." }),
  email: z.string().email({ message: "Noto'g'ri email format." }),
  password: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function DashboardPage() {
  const { user, setUser, clearUser } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tariffSections, setTariffSections] = useState<LessonSection[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<Record<number, number>>({});
  const [feedbackGiven, setFeedbackGiven] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [showRemaining, setShowRemaining] = useState(false);

  useEffect(() => {
    setShowRemaining(false);
  }, [selectedSectionId]);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    clearUser();
    window.location.href = '/';
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user === undefined) {
      setLoading(true);
      return;
    }
    if (user === null) {
      router.push("/auth");
      return;
    }
    setLoading(false);
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    form.reset({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      password: "",
    });
  }, [user?.id, user?.first_name, user?.last_name, user?.email, form]);

  const loadTariffLessons = useCallback(async (tariffId: number) => {
    try {
      setLoadingLessons(true);
      const [sectionsRes, progressRes, feedbackRes] = await Promise.all([
        api.get<LessonSection[]>(`/tariffs/${tariffId}/sections`),
        api.get<Record<string, number>>('/lesson-progress?tariffId=' + tariffId).catch(() => ({ data: {} })),
        api.get<Record<string, unknown>>('/lesson-feedback').catch(() => ({ data: {} })),
      ]);
      setFeedbackGiven(new Set(Object.keys(feedbackRes.data || {}).map(Number)));
      setTariffSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : []);
      const progress: Record<number, number> = {};
      Object.entries(progressRes.data || {}).forEach(([k, v]) => {
        progress[Number(k)] = Number(v);
      });
      setLessonProgress(progress);
    } catch {
      setTariffSections([]);
      setLessonProgress({});
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'courses') {
      setSelectedSectionId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = new URLSearchParams(window.location.search).get("section");
    if (section && !Number.isNaN(Number(section))) {
      setActiveTab("courses");
      setSelectedSectionId(Number(section));
    }
  }, []);

  const needsFeedback = (lesson: Lesson) =>
    lesson.feedback_mode !== 'optional' && !feedbackGiven.has(lesson.id);

  const lessonHref = (lessonId: number, step: LessonStep) =>
    step === 'feedback' ? `/watch/${lessonId}#lesson-izoh` : `/watch/${lessonId}`;

  const getLessonState = (lesson: Lesson) => {
    const percent = Math.min(100, Math.max(0, lessonProgress[lesson.id] ?? 0));
    const feedbackOk = !needsFeedback(lesson);
    return { lesson, percent, feedbackOk, step: lessonStep(percent, feedbackOk) };
  };

  const getSectionSummary = (section: LessonSection) => {
    const states = (section.lessons || []).map(getLessonState);
    const remaining = states.filter((s) => s.step !== 'done');
    return {
      states,
      remaining,
      total: states.length,
      watched: states.filter((s) => s.percent >= 100).length,
      feedbackDone: states.filter((s) => s.lesson.feedback_mode !== 'optional' && feedbackGiven.has(s.lesson.id)).length,
      feedbackTotal: states.filter((s) => s.lesson.feedback_mode !== 'optional').length,
      done: states.length - remaining.length,
      percent: sectionPercent(states),
      complete: states.length > 0 && remaining.length === 0,
    };
  };

  const selectedSection = tariffSections.find((section) => section.id === selectedSectionId) ?? null;

  useEffect(() => {
    if (activeTab !== 'courses' || !user?.tariff_id) {
      if (!user?.tariff_id) {
        setTariffSections([]);
        setLessonProgress({});
      }
      return;
    }
    loadTariffLessons(user.tariff_id);
  }, [user?.tariff_id, activeTab, loadTariffLessons]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      const updateData: Partial<ProfileFormValues> = { ...values };
      if (!updateData.password || updateData.password === "") {
        delete updateData.password;
      }

      const updatedUser = await UserService.updateProfile(updateData);
      setUser(updatedUser);
      toast({ 
        title: "Muvaffaqiyatli!", 
        description: "Ma'lumotlaringiz yangilandi."
      });
      form.reset({ ...form.getValues(), password: "" });
    } catch (error) {
      toast({
        title: "Xatolik!",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  const userInfo = {
    name: `${user.first_name} ${user.last_name}`,
    plan: user.tariff?.name || '',
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Orqa fon rasmi */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/fon.png"
          alt="Background"
              className="w-full h-full object-cover opacity-50"
          style={{ 
            minHeight: '100vh',
            transform: 'scale(1.2)',
            transformOrigin: 'center',
            maxHeight: '100vh'
          }}
        />
      </div>
      <header className="bg-white border-b relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center shrink-0">
              <img
                src="/images/logo-main.png"
                alt="Uygunlik"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#5D1111]/15 bg-[#FEFBEE] px-3 py-2 text-xs font-semibold text-[#5D1111] hover:bg-[#FEFBEE]/80 shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Asosiy sahifa</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {userInfo.plan && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 hidden sm:inline-flex">
                {userInfo.plan}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50 px-2 sm:px-3"
              aria-label="Chiqish"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Chiqish</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xush kelibsiz, {userInfo.name}!
          </h1>
          <p className="text-gray-600">
            Kurslaringizni davom ettiring va yangi bilimlar oling
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="courses">Kurslarim</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="rating">Reyting</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="space-y-8">
              {user.tariff_id && (
                <div>
                  {!selectedSection ? (
                    <>
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {user.tariff?.name ? `${user.tariff.name} bo'limlari` : "Bo'limlar"}
                        </h2>
                        <p className="text-sm text-gray-600">
                          Darslarni ko'rish uchun bo'limni tanlang
                        </p>
                      </div>

                      {loadingLessons ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600">Bo'limlar yuklanmoqda...</p>
                        </div>
                      ) : tariffSections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {tariffSections.map((section, sectionIndex) => {
                            const summary = getSectionSummary(section);
                            const hasTest = Array.isArray(section.test_questions) && section.test_questions.length > 0;
                            return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setSelectedSectionId(section.id)}
                              className="text-left bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/90 shadow-lg overflow-hidden hover:shadow-xl hover:border-red-200 transition-all"
                            >
                              <div className="px-4 py-4 sm:px-6 sm:py-5">
                                <div className="flex items-start gap-3 sm:gap-4">
                                  <span
                                    className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white text-sm font-bold shrink-0 shadow-md ${
                                      summary.complete ? "bg-green-600 shadow-green-600/20" : "bg-red-600 shadow-red-600/20"
                                    }`}
                                  >
                                    {summary.complete ? <CheckCircle2 className="h-5 w-5" /> : sectionIndex + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                                      {section.name}
                                    </h3>
                                    {section.description && (
                                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed line-clamp-2">
                                        {section.description}
                                      </p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-medium">
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                        {summary.total} ta dars
                                      </span>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                        <Eye className="h-3 w-3" /> {summary.watched}/{summary.total}
                                      </span>
                                      {summary.feedbackTotal > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                          <MessageSquareText className="h-3 w-3" /> {summary.feedbackDone}/{summary.feedbackTotal}
                                        </span>
                                      )}
                                      {hasTest && (
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                            summary.complete ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
                                          }`}
                                        >
                                          {summary.complete ? <ClipboardCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                          {summary.complete ? "Test ochiq" : "Test yopiq"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Umumiy progress</span>
                                        <span className={`font-semibold ${summary.complete ? "text-green-600" : "text-gray-700"}`}>
                                          {summary.percent}%
                                        </span>
                                      </div>
                                      <Progress value={summary.percent} className="h-2" />
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                                </div>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Layers className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium text-gray-900">
                            Sizning tarifingiz uchun bo'limlar mavjud emas
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Tez orada bo'limlar qo'shiladi.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSectionId(null)}
                          className="mb-4 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Bo'limlarga qaytish
                        </Button>
                        {(() => {
                          const summary = getSectionSummary(selectedSection);
                          const hasTest =
                            Array.isArray(selectedSection.test_questions) && selectedSection.test_questions.length > 0;
                          const next = summary.remaining[0];
                          const unwatched = summary.remaining.filter((s) => s.step === "watch").length;
                          const noFeedback = summary.remaining.filter((s) => s.step === "feedback").length;
                          const reasons = [
                            unwatched > 0 ? `${unwatched} ta dars hali to'liq ko'rilmagan` : null,
                            noFeedback > 0 ? `${noFeedback} ta darsga izoh yozilmagan` : null,
                          ].filter(Boolean);
                          return (
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/90 shadow-lg overflow-hidden">
                              <div className="px-4 py-4 sm:px-6 sm:py-5">
                                <div className="flex items-start gap-3 sm:gap-4">
                                  <span
                                    className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white text-sm font-bold shrink-0 shadow-md ${
                                      summary.complete ? "bg-green-600 shadow-green-600/20" : "bg-red-600 shadow-red-600/20"
                                    }`}
                                  >
                                    {summary.complete ? (
                                      <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                      tariffSections.findIndex((s) => s.id === selectedSection.id) + 1
                                    )}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                                      {selectedSection.name}
                                    </h2>
                                    {selectedSection.description && (
                                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                                        {selectedSection.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 rounded-xl bg-gray-50 p-3 sm:p-4">
                                  <div className="flex items-end justify-between gap-3">
                                    <span className="text-sm font-semibold text-gray-700">Bo'lim progressi</span>
                                    <span
                                      className={`text-2xl font-bold tabular-nums leading-none ${
                                        summary.complete ? "text-green-600" : "text-gray-900"
                                      }`}
                                    >
                                      {summary.percent}%
                                    </span>
                                  </div>
                                  <Progress value={summary.percent} className="mt-2 h-2.5" />
                                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                    {[
                                      { label: "Ko'rildi", value: summary.watched, total: summary.total, icon: Eye },
                                      { label: "Izoh", value: summary.feedbackDone, total: summary.feedbackTotal, icon: MessageSquareText },
                                      { label: "Yakunlandi", value: summary.done, total: summary.total, icon: CheckCircle2 },
                                    ].map(({ label, value, total, icon: Icon }) => (
                                      <div key={label} className="rounded-lg bg-white px-1.5 py-2 shadow-sm ring-1 ring-gray-100">
                                        <p
                                          className={`text-base font-bold tabular-nums ${
                                            total > 0 && value >= total ? "text-green-600" : "text-gray-900"
                                          }`}
                                        >
                                          {value}/{total}
                                        </p>
                                        <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-gray-500">
                                          <Icon className="h-3 w-3 shrink-0" /> {label}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {summary.total === 0 ? null : summary.complete ? (
                                <div className="border-t border-green-100 bg-green-50 px-4 py-4 sm:px-6">
                                  <p className="flex items-center gap-2 font-semibold text-green-800">
                                    <Trophy className="h-5 w-5 shrink-0" /> Barcha darslar yakunlandi
                                  </p>
                                  <p className="mt-1 text-sm text-green-700">
                                    {hasTest
                                      ? "Bo'lim testi ochiq — bilimingizni sinab ko'ring."
                                      : "Ajoyib! Bu bo'limni to'liq tugatdingiz."}
                                  </p>
                                  {hasTest && (
                                    <Button
                                      className="mt-3 h-11 w-full bg-red-600 text-base hover:bg-red-700 sm:w-auto"
                                      onClick={() => router.push(`/quiz/section/${selectedSection.id}`)}
                                    >
                                      <PlayCircle className="mr-2 h-5 w-5" />
                                      Bo'lim testini ishlash
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-4 sm:px-6">
                                  <p className="flex items-center gap-2 font-semibold text-gray-900">
                                    <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                                    {hasTest ? "Bo'lim testi hali yopiq" : "Bo'lim hali yakunlanmagan"}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {reasons.join(", ")}.
                                    {hasTest ? " Hammasi bajarilgach test ochiladi." : ""}
                                  </p>

                                  {next && (
                                    <div className="mt-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-amber-200">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                        Keyingi qadam
                                      </p>
                                      <p className="mt-0.5 font-semibold text-gray-900 line-clamp-2">{next.lesson.title}</p>
                                      <p className="mt-0.5 text-xs text-gray-500">
                                        {next.step === "watch"
                                          ? `Ko'rildi: ${next.percent}% — darsni oxirigacha ko'ring`
                                          : "Dars ko'rildi — endi izoh yozing"}
                                      </p>
                                      {next.lesson.video_url && (
                                        <Link href={lessonHref(next.lesson.id, next.step)} className="mt-2.5 block sm:inline-block">
                                          <Button
                                            className={`h-10 w-full sm:w-auto ${
                                              next.step === "feedback"
                                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                                : "bg-red-600 hover:bg-red-700"
                                            }`}
                                          >
                                            {next.step === "feedback" ? (
                                              <MessageSquareText className="mr-2 h-4 w-4" />
                                            ) : (
                                              <PlayCircle className="mr-2 h-4 w-4" />
                                            )}
                                            {next.step === "feedback"
                                              ? "Izoh yozish"
                                              : next.percent > 0
                                                ? "Ko'rishni davom ettirish"
                                                : "Darsni ko'rish"}
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  )}

                                  {summary.remaining.length > 1 && (
                                    <button
                                      type="button"
                                      aria-expanded={showRemaining}
                                      onClick={() => setShowRemaining((v) => !v)}
                                      className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm font-semibold text-red-700 hover:text-red-800"
                                    >
                                      <span>Barcha qolgan darslar ({summary.remaining.length})</span>
                                      <ChevronDown className={`h-4 w-4 transition-transform ${showRemaining ? "rotate-180" : ""}`} />
                                    </button>
                                  )}
                                  {summary.remaining.length > 1 && showRemaining && (
                                    <div className="mt-2 space-y-2">
                                      {summary.remaining.map(({ lesson, percent, step }) => (
                                        <div
                                          key={lesson.id}
                                          className="flex flex-col gap-2 rounded-lg bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:gap-3"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 line-clamp-2">{lesson.title}</p>
                                            <p
                                              className={`mt-0.5 flex items-center gap-1 text-xs ${
                                                step === "feedback" ? "text-amber-700" : "text-gray-500"
                                              }`}
                                            >
                                              {step === "feedback" ? (
                                                <>
                                                  <MessageSquareText className="h-3.5 w-3.5 shrink-0" /> Ko'rildi — izoh yozilmagan
                                                </>
                                              ) : (
                                                <>
                                                  <Eye className="h-3.5 w-3.5 shrink-0" /> Ko'rildi: {percent}% — yana {100 - percent}% qoldi
                                                </>
                                              )}
                                            </p>
                                            {step === "watch" && <Progress value={percent} className="mt-1.5 h-1.5" />}
                                          </div>
                                          {lesson.video_url ? (
                                            <Link href={lessonHref(lesson.id, step)} className="sm:shrink-0">
                                              <Button
                                                size="sm"
                                                className={`h-9 w-full sm:w-auto ${
                                                  step === "feedback"
                                                    ? "bg-amber-500 text-white hover:bg-amber-600"
                                                    : "bg-red-600 hover:bg-red-700"
                                                }`}
                                              >
                                                {step === "feedback" ? "Izoh yozish" : "Ko'rish"}
                                              </Button>
                                            </Link>
                                          ) : (
                                            <span className="text-xs text-gray-400">Video mavjud emas</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {selectedSection.lessons && selectedSection.lessons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {selectedSection.lessons.map((lesson) => {
                            const state = getLessonState(lesson);
                            return (
                            <Card
                              key={lesson.id}
                              className={`flex flex-col shadow-md ${
                                state.step === "done"
                                  ? "border-green-200"
                                  : state.step === "feedback"
                                    ? "border-amber-300"
                                    : "border-gray-100"
                              }`}
                            >
                              <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                                    {lesson.title}
                                  </CardTitle>
                                  {state.step === "done" ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Yakunlandi
                                    </span>
                                  ) : state.step === "feedback" ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                      <MessageSquareText className="h-3.5 w-3.5" /> Izoh kerak
                                    </span>
                                  ) : state.percent > 0 ? (
                                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                                      Jarayonda
                                    </span>
                                  ) : null}
                                </div>
                                <CardDescription className="text-gray-600 text-sm leading-relaxed mt-1.5 line-clamp-3 sm:min-h-[3.75rem]">
                                  {lesson.description || 'Tavsif mavjud emas'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex-grow px-4 py-2 sm:px-6 space-y-3">
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  {lesson.video_url && (
                                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                                      <Video className="h-4 w-4 text-red-600 shrink-0" />
                                      Video
                                    </span>
                                  )}
                                  {!lesson.video_url && (
                                    <span className="text-gray-500">Material yo'q</span>
                                  )}
                                  {feedbackGiven.has(lesson.id) ? (
                                    <span className="inline-flex items-center gap-1.5 text-green-700">
                                      <MessageSquareText className="h-4 w-4 shrink-0" />
                                      Izoh qoldirilgan
                                    </span>
                                  ) : lesson.feedback_mode !== 'optional' ? (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                                      <MessageSquareText className="h-4 w-4 shrink-0" />
                                      Izoh majburiy
                                    </span>
                                  ) : null}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{state.percent >= 100 ? "To'liq ko'rildi ✓" : "Ko'rildi"}</span>
                                    <span className={`font-medium ${state.percent >= 100 ? "text-green-600" : "text-gray-700"}`}>
                                      {state.percent}%
                                    </span>
                                  </div>
                                  <Progress value={state.percent} className="h-2" />
                                </div>
                                {state.step === "feedback" && (
                                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
                                    Dars ko'rildi. Izoh yozing — shundan so'ng dars yakunlanadi va testi ochiladi.
                                  </p>
                                )}
                              </CardContent>
                              <CardFooter className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
                                {!lesson.video_url ? (
                                  <Button className="w-full" disabled>
                                    Video mavjud emas
                                  </Button>
                                ) : state.step === "feedback" ? (
                                  <Link href={lessonHref(lesson.id, state.step)} className="w-full">
                                    <Button className="h-11 w-full bg-amber-500 text-white hover:bg-amber-600">
                                      <MessageSquareText className="mr-2 h-4 w-4" />
                                      Izoh yozish
                                    </Button>
                                  </Link>
                                ) : state.step === "done" ? (
                                  <Link href={`/watch/${lesson.id}`} className="w-full">
                                    <Button variant="outline" className="h-11 w-full border-red-200 text-red-700 hover:bg-red-50">
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Qayta ko'rish
                                    </Button>
                                  </Link>
                                ) : (
                                  <Link href={`/watch/${lesson.id}`} className="w-full">
                                    <Button className="h-11 w-full bg-red-600 hover:bg-red-700">
                                      <PlayCircle className="mr-2 h-4 w-4" />
                                      {state.percent > 0 ? "Ko'rishni davom ettirish" : "Darsni ko'rish"}
                                    </Button>
                                  </Link>
                                )}
                              </CardFooter>
                            </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic text-center py-8 bg-white/80 rounded-xl border border-gray-100">
                          Bu bo'limda hali darslar yo'q
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Kurslar */}
              {(user.courses && user.courses.length > 0) && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Kurslarim
                    </h2>
                    <p className="text-sm text-gray-600">
                      Sizga tayinlangan kurslar
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.courses.map((course) => (
                      <Card key={course._id || course.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-xl">{course.title}</CardTitle>
                          <CardDescription className="h-10 overflow-hidden">
                            {course.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="space-y-2">
                            <Progress value={30} className="w-full" />
                            <p className="text-sm text-gray-600">30% tugallandi</p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Link href={`/course/${course._id || course.id}`} className="w-full">
                            <Button className="w-full bg-red-600 hover:bg-red-700">
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Davom ettirish
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Agar hech qanday kurs va tarif darslari bo'lmasa */}
              {(!user.tariff_id || tariffSections.length === 0) && (!user.courses || user.courses.length === 0) && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Sizda hali kurslar yoki darslar mavjud emas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Yangi bilimlar olish uchun kurslarimizni ko'rib chiqing.
                  </p>
                  <div className="mt-6">
                    <Button asChild className="bg-red-600 hover:bg-red-700">
                      <Link href="/pricing">Kurslarni ko'rish</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
                <CardDescription>
                  Hisobingiz va shaxsiy ma'lumotlaringizni boshqaring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ism</FormLabel>
                            <FormControl>
                              <Input placeholder="Ismingiz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Familiya</FormLabel>
                            <FormControl>
                              <Input placeholder="Familiyangiz" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Emailingiz"
                                {...field}
                                type="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yangi parol (ixtiyoriy)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="pr-10"
                                  {...field}
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Saqlanmoqda..."
                        : "Saqlash"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rating">
            {activeTab === 'rating' && (
              <DashboardRatingTab
                tariffId={user.tariff_id}
                tariffName={user.tariff?.name}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
