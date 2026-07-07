'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'user', status: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getUser(id)
      .then((res) => {
        const u = res.data.user;
        setUser(u);
        setForm({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          role: u.role || 'user',
          status: u.status !== false,
        });
      })
      .catch(() => {
        toast.error('Foydalanuvchi topilmadi');
        router.push('/admin/users');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateUser(id, form);
      toast.success('Saqlandi');
      const res = await adminApi.getUser(id);
      setUser(res.data.user);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Foydalanuvchi profili</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Umumiy ma’lumotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ism</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Familiya</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.role === 'user'}
                  onChange={() => setForm((f) => ({ ...f, role: 'user' }))}
                />
                User
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.role === 'admin'}
                  onChange={() => setForm((f) => ({ ...f, role: 'admin' }))}
                />
                Admin
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
              />
              Faol
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saqlanmoqda…' : 'Tahrirlash'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/users">Orqaga</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qisqacha</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400">
          <p>Ro‘yxatdan o‘tgan: {user.created_at ? new Date(user.created_at).toLocaleString('uz-UZ') : '—'}</p>
          <p>Status: <Badge variant={user.status ? 'default' : 'secondary'}>{user.status ? 'Faol' : 'Nofaol'}</Badge></p>
          <p>Ta’rif: {user.tariff_name || user.tariff?.name || '—'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
