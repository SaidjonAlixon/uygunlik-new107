'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import userService from '@/services/user.service';
import { useUserStore } from '@/store/user.store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const registerSchema = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "Ism kamida 2 harfdan iborat bo'lishi kerak." }),
    last_name:
      z.string().min(2, { message: "Familiya kamida 2 harfdan iborat bo'lishi kerak." }),
    email: z.string().email({ message: "Noto'g'ri email format." }),
    password:
      z.string().min(4, { message: 'Parol kamida 4 belgidan iborat bo\'lishi kerak.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = values;
      const response = await userService.register(registerData);
      const { user, token } = response;
      
      // Save user data and token to localStorage
      setUser(user);
      localStorage.setItem('auth_token', token);
      
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      router.push('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Bu email allaqachon ro\'yxatdan o\'tgan.');
      } else {
        toast.error("Ro'yxatdan o'tishda xatolik yuz berdi.");
      }
      console.error('Registration failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
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
      <div className="w-full max-w-md relative z-10">
        <Card>
          <CardContent className="p-4">
            <CardHeader>
              <CardTitle>Yangi hisob yaratish</CardTitle>
              <CardDescription>
                Ma'lumotlaringizni to'ldiring.
              </CardDescription>
            </CardHeader>
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4 px-6 pb-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
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
                    control={registerForm.control}
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
                </div>
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parol</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parolni tasdiqlang</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading
                    ? 'Kutilmoqda...'
                    : "Ro'yxatdan o'tish"}
                </Button>
              </form>
            </Form>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Allaqachon hisobingiz bormi?{' '}
                <Link href="/auth" className="text-red-600 hover:text-red-700 font-medium">
                  Kirish
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
