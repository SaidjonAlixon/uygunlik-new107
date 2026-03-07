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
    } catch {
      toast.error("Email yoki parol noto'g'ri.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md border-gray-700 bg-gray-800/95 text-gray-100 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="h-6 w-6 text-primary" />
            Admin panel
          </CardTitle>
          <CardDescription className="text-gray-400">
            Log va parol orqali kirish. Faqat admin hisobi ruxsat etilgan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          className="pl-9 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                          {...field}
                        />
                      </div>
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
                    <FormLabel className="text-gray-300">Parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? 'Kirilmoqda…' : 'Kirish'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
