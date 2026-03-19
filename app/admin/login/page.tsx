'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import userService from '@/services/user.service';
import { useUserStore } from '@/store/user.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email("Noto'g'ri email"),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await userService.login(values);
      const { user, token } = res;
      if ((user as { role?: string }).role !== 'admin') {
        toast.error('Faqat administrator kirishi mumkin.');
        setLoading(false);
        return;
      }
      setUser(user);
      if (typeof window !== 'undefined') localStorage.setItem('auth_token', token);
      toast.success('Kirish muvaffaqiyatli');
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error("Login catch error:", error);
      const message = error?.response?.data?.error || error?.message || "Email yoki parol noto'g'ri.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEFBEE] p-4 font-sans">
      <Card className="w-full max-w-md border-[#7A2E2E]/10 bg-white text-[#5D1111] shadow-2xl shadow-[#5D1111]/10 rounded-2xl overflow-hidden">
        <div className="h-2 w-full bg-[#5D1111]" />
        <CardHeader className="space-y-3 pb-6">
          <CardTitle className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-[#FEFBEE] flex items-center justify-center border border-[#7A2E2E]/20">
              <Lock className="h-6 w-6 text-[#5D1111]" />
            </div>
            <span className="font-serif font-bold tracking-wider text-2xl text-[#5D1111]">
              ADMIN PANEL
            </span>
          </CardTitle>
          <CardDescription className="text-center text-[#7A2E2E]/80 font-medium">
            Tizimga kirish uchun ma'lumotlarni kiriting. Faqat administratorlar uchun ruxsat etiladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#5D1111] font-semibold">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A2E2E]/60" />
                        <Input
                          type="email"
                          placeholder="admin@uygunlik.uz"
                          className="pl-10 h-12 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] placeholder:text-[#5D1111]/40 rounded-xl transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#5D1111] font-semibold">Parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A2E2E]/60" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-12 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] placeholder:text-[#5D1111]/40 rounded-xl transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 bg-[#5D1111] hover:bg-[#7A2E2E] text-white font-bold tracking-wide rounded-xl shadow-md transition-all duration-200 mt-4"
                disabled={loading}
              >
                {loading ? 'Kirilmoqda...' : 'Kirish'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
