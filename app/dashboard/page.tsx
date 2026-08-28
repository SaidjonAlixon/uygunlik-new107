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
import { BookOpen, PlayCircle, LogOut, Video, FileText, ArrowLeft, ChevronRight, Layers, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import UserService from "@/services/user.service";
import { useToast } from "@/components/ui/use-toast";
import { LessonSection } from "@/types/section";
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
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
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
      const [sectionsRes, progressRes] = await Promise.all([
        api.get<LessonSection[]>(`/tariffs/${tariffId}/sections`),
        api.get<Record<string, number>>('/lesson-progress?tariffId=' + tariffId).catch(() => ({ data: {} })),
      ]);
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

  const getSectionProgress = (section: LessonSection) => {
    const lessons = section.lessons || [];
    if (lessons.length === 0) return 0;
    const total = lessons.reduce((sum, lesson) => sum + (lessonProgress[lesson.id] ?? 0), 0);
    return Math.round(total / lessons.length);
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
                          {tariffSections.map((section, sectionIndex) => (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setSelectedSectionId(section.id)}
                              className="text-left bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/90 shadow-lg overflow-hidden hover:shadow-xl hover:border-red-200 transition-all"
                            >
                              <div className="px-6 py-5">
                                <div className="flex items-start gap-4">
                                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white text-sm font-bold shrink-0 shadow-md shadow-red-600/20">
                                    {sectionIndex + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                                      {section.name}
                                    </h3>
                                    {section.description && (
                                      <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
                                        {section.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2 font-medium">
                                      {section.lessons?.length || 0} ta dars
                                    </p>
                                    <div className="mt-4 space-y-1.5">
                                      <div className="flex justify-between text-xs text-gray-500">
                                        <span>Umumiy progress</span>
                                        <span className="font-medium text-gray-700">{getSectionProgress(section)}%</span>
                                      </div>
                                      <Progress value={getSectionProgress(section)} className="h-2" />
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-red-600 shrink-0 mt-1" />
                                </div>
                              </div>
                            </button>
                          ))}
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
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/90 shadow-lg px-6 py-5">
                          <div className="flex items-start gap-4">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600 text-white text-sm font-bold shrink-0 shadow-md shadow-red-600/20">
                              {tariffSections.findIndex((s) => s.id === selectedSection.id) + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-2xl font-bold text-gray-900">{selectedSection.name}</h2>
                              {selectedSection.description && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                                  {selectedSection.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2 font-medium">
                                {selectedSection.lessons?.length || 0} ta dars
                                {" · "}Progress: {getSectionProgress(selectedSection)}%
                              </p>
                              {Array.isArray(selectedSection.test_questions) &&
                                selectedSection.test_questions.length > 0 && (
                                  <div className="mt-4">
                                    <Button
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={getSectionProgress(selectedSection) < 100}
                                      onClick={() => {
                                        window.open(`/quiz/section/${selectedSection.id}`, "_blank");
                                      }}
                                    >
                                      {getSectionProgress(selectedSection) >= 100
                                        ? "Bo'lim yakuniy testini boshlash"
                                        : `Bo'lim testi (barcha darslarni ko'ring: ${getSectionProgress(selectedSection)}%)`}
                                    </Button>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedSection.lessons && selectedSection.lessons.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {selectedSection.lessons.map((lesson) => (
                            <Card key={lesson.id} className="flex flex-col shadow-md border-gray-100">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xl font-semibold text-gray-900 leading-tight">
                                  {lesson.title}
                                </CardTitle>
                                <CardDescription className="text-gray-600 text-sm leading-relaxed mt-1.5 line-clamp-3 min-h-[3.75rem]">
                                  {lesson.description || 'Tavsif mavjud emas'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="flex-grow py-2 space-y-3">
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  {lesson.video_url && (
                                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                                      <Video className="h-4 w-4 text-red-600 shrink-0" />
                                      Video
                                    </span>
                                  )}
                                  {lesson.pdf_url && (
                                    <span className="inline-flex items-center gap-1.5 text-gray-700">
                                      <FileText className="h-4 w-4 text-red-600 shrink-0" />
                                      PDF
                                    </span>
                                  )}
                                  {!lesson.video_url && !lesson.pdf_url && (
                                    <span className="text-gray-500">Material yo'q</span>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Ko'rilgan</span>
                                    <span className="font-medium text-gray-700">{lessonProgress[lesson.id] ?? 0}%</span>
                                  </div>
                                  <Progress value={lessonProgress[lesson.id] ?? 0} className="h-2" />
                                </div>
                              </CardContent>
                              <CardFooter className="pt-2">
                                {lesson.video_url ? (
                                  <Link href={`/watch/${lesson.id}`} className="w-full">
                                    <Button className="w-full bg-red-600 hover:bg-red-700">
                                      <PlayCircle className="mr-2 h-4 w-4" />
                                      {(lessonProgress[lesson.id] ?? 0) >= 100
                                        ? "Qayta ko'rish"
                                        : "Darsni ko'rish"}
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button className="w-full" disabled>
                                    Video mavjud emas
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          ))}
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
