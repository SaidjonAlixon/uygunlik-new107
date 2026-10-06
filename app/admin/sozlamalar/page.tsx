'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useUserStore } from '@/store/user.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminAccountPage() {
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/account', { headers: authHeaders() })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.email) return;
        setEmail(data.email);
        setCurrentEmail(data.email);
      })
      .catch(() => undefined);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Yangi parollar bir xil emas');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error('Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    const emailChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase();
    if (!emailChanged && !newPassword) {
      toast.error('Yangi email yoki yangi parol kiriting');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          currentPassword,
          email: emailChanged ? email.trim() : '',
          newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.error || 'Saqlanmadi');
        return;
      }
      if (data.token) localStorage.setItem('auth_token', data.token);
      if (data.user) {
        setUser(data.user);
        setEmail(data.user.email);
        setCurrentEmail(data.user.email);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Login ma’lumotlari yangilandi');
    } catch {
      toast.error('Server bilan bog‘lanib bo‘lmadi');
    } finally {
      setSaving(false);
    }
  };

  const passwordType = showPasswords ? 'text' : 'password';
  const inputClass =
    'h-12 rounded-xl border-[#7A2E2E]/20 bg-[#FEFBEE]/50 text-[#5D1111] focus-visible:border-[#5D1111] focus-visible:ring-[#5D1111]';

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Hisob sozlamalari</h1>
        <p className="mt-1 text-sm text-[#5D1111]/70">Admin panelga kirish emaili va parolini shu yerda o‘zgartiring.</p>
      </div>

      <Card className="overflow-hidden rounded-2xl border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5">
        <CardHeader className="border-b border-[#7A2E2E]/10 bg-[#FEFBEE]/50 pb-4">
          <CardTitle className="text-xl font-bold text-[#5D1111]">Login va parol</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-[#5D1111]">Email (login)</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                autoComplete="username"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-new-password" className="text-[#5D1111]">Yangi parol</Label>
                <Input
                  id="admin-new-password"
                  type={passwordType}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password" className="text-[#5D1111]">Yangi parolni takrorlang</Label>
                <Input
                  id="admin-confirm-password"
                  type={passwordType}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#7A2E2E]/10 bg-[#FEFBEE]/60 p-4">
              <Label htmlFor="admin-current-password" className="text-[#5D1111]">Joriy parol</Label>
              <Input
                id="admin-current-password"
                type={passwordType}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className={`${inputClass} bg-white`}
                autoComplete="current-password"
              />
              <p className="text-xs text-[#5D1111]/60">Xavfsizlik uchun o‘zgartirishdan oldin hozirgi parolni kiriting.</p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setShowPasswords((value) => !value)}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#7A2E2E] hover:text-[#5D1111]"
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPasswords ? 'Parollarni yashirish' : 'Parollarni ko‘rsatish'}
              </button>
              <Button
                type="submit"
                disabled={saving}
                className="h-12 rounded-xl bg-[#5D1111] px-6 font-bold text-white hover:bg-[#7A2E2E]"
              >
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
