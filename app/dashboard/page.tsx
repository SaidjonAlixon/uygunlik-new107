"use client";

import { useState, useEffect } from "react";
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
import { Settings, BookOpen, PlayCircle, LogOut, Video, FileText } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import UserService from "@/services/user.service";
import LessonService from "@/services/lesson.service";
import { useToast } from "@/components/ui/use-toast";
import { Lesson } from "@/types/lesson";
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
  const [tariffLessons, setTariffLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<Record<number, number>>({});

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem('auth_token');
    // Redirect to home
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
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
      
      // Load tariff lessons if user has a tariff
      if (user.tariff_id) {
        loadTariffLessons(user.tariff_id);
      } else {
        setTariffLessons([]);
      }
    }

    setLoading(false);
  }, [user, router, form]);

  const loadTariffLessons = async (tariffId: number) => {
    try {
      setLoadingLessons(true);
      const [lessons, progressRes] = await Promise.all([
        LessonService.findAllByTariff(String(tariffId)),
        api.get<Record<string, number>>('/lesson-progress?tariffId=' + tariffId).catch(() => ({ data: {} })),
      ]);
      setTariffLessons(lessons);
      const progress: Record<number, number> = {};
      Object.entries(progressRes.data || {}).forEach(([k, v]) => {
        progress[Number(k)] = Number(v);
      });
      setLessonProgress(progress);
    } catch (error) {
      setTariffLessons([]);
      setLessonProgress({});
    } finally {
      setLoadingLessons(false);
    }
  };

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
    plan: user.tariff?.name || (user.tariff_id ? 'Tarif' : 'Tarif tanlanmagan'),
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {userInfo.plan} tarif
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Sozlamalar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-300 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Chiqish
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

        <Tabs defaultValue="courses">
          <TabsList className="mb-6">
            <TabsTrigger value="courses">Kurslarim</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="space-y-8">
              {/* Tarif darslari */}
              {user.tariff_id && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {user.tariff?.name || 'Tarif'} darslari
                    </h2>
                    <p className="text-sm text-gray-600">
                      Sizning tarifingizga tegishli darslar
                    </p>
                  </div>
                  {loadingLessons ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Darslar yuklanmoqda...</p>
                    </div>
                  ) : tariffLessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tariffLessons.map((lesson) => (
                        <Card key={lesson.id} className="flex flex-col shadow-md">
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
                                <span className="text-gray-500">Material yo‘q</span>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Ko‘rilgan</span>
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
                                  Darsni ko'rish
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
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Video className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">
                        Bu tarifda hali darslar mavjud emas
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Tez orada darslar qo'shiladi.
                      </p>
                    </div>
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
              {(!user.tariff_id || tariffLessons.length === 0) && (!user.courses || user.courses.length === 0) && (
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
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                autoComplete="new-password"
                              />
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

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>To'lov tarixi</CardTitle>
                <CardDescription>
                  Barcha to'lovlaringiz va hisob-kitoblar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    To'lovlar tarixi bo'sh
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Siz hali hech qanday to'lov qilmagansiz.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
