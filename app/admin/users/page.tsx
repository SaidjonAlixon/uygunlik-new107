'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Pencil, Trash2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: boolean;
  tariff_id: number | null;
  tariff_name?: string;
  created_at: string;
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [tariffs, setTariffs] = useState<{ id: number; name: string }[]>([]);
  const [grantTariffId, setGrantTariffId] = useState<string>('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'user',
    status: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminApi.getUsers({ page, limit: 20, search: search || undefined })
      .then((res) => {
        setUsers(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => toast.error('Foydalanuvchilarni yuklashda xato'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') setAddOpen(true);
  }, [searchParams]);

  const openGrant = (user: UserRow) => {
    setSelectedUser(user);
    setGrantTariffId(user.tariff_id ? String(user.tariff_id) : '');
    adminApi.getTariffs().then((r) => setTariffs(r.data || [])).catch(() => {});
    setGrantOpen(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Parol kamida 8 ta belgi bo'lishi kerak");
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createUser(form);
      toast.success('Foydalanuvchi qo‘shildi');
      setAddOpen(false);
      setForm({ first_name: '', last_name: '', email: '', password: '', role: 'user', status: true });
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantTariff = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await adminApi.grantTariff(String(selectedUser.id), grantTariffId ? parseInt(grantTariffId, 10) : null);
      setGrantOpen(false);
      setSelectedUser(null);
      loadUsers();
      toast.success("Ta'rif berildi. Oyna yopildi.", { duration: 4000 });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Rostan o‘chirilsinmi?')) return;
    try {
      await adminApi.deleteUser(String(id));
      toast.success('O‘chirildi');
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Foydalanuvchilar</h1>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Qidiruv (ism, email)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="pl-9 bg-gray-700/50 border-gray-600 text-gray-200 placeholder:text-gray-500"
            />
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-gray-700 hover:bg-gray-600 border border-gray-600">
            <UserPlus className="h-4 w-4 mr-2" />
            Qo&apos;shish
          </Button>
        </div>
      </div>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Ro'yxat</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-400 py-8 text-center">Yuklanmoqda…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-2 text-gray-300">ID</th>
                    <th className="text-left py-3 px-2 text-gray-300">Ism Familiya</th>
                    <th className="text-left py-3 px-2 text-gray-300">Email</th>
                    <th className="text-left py-3 px-2 text-gray-300">Ro'yxatdan o'tgan</th>
                    <th className="text-left py-3 px-2 text-gray-300">Status</th>
                    <th className="text-left py-3 px-2 text-gray-300">Ta'rif</th>
                    <th className="text-left py-3 px-2 text-gray-300">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-700">
                      <td className="py-3 px-2 text-gray-200">{u.id}</td>
                      <td className="py-3 px-2 text-gray-200">{u.first_name} {u.last_name}</td>
                      <td className="py-3 px-2 text-gray-200">{u.email}</td>
                      <td className="py-3 px-2 text-gray-200">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('uz-UZ') : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={u.status ? 'default' : 'secondary'}>
                          {u.status ? '🟢 Faol' : '🔴 Nofaol'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-200">{u.tariff_name || '—'}</td>
                      <td className="py-3 px-2 flex items-center gap-1 text-gray-300">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/users/${u.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openGrant(u)} title="Ta'rif berish">
                          <Gift className="h-4 w-4" />
                        </Button>
                        {u.role !== 'admin' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Oldingi
              </Button>
              <span className="flex items-center px-2 text-sm">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Keyingi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add user modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchi qo‘shish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ism *</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Familiya *</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Parol * (kamida 8 belgi)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div className="flex gap-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saqlanmoqda…' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grant tariff modal */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta‘rif berish</DialogTitle>
            {selectedUser && (
              <CardDescription>
                Foydalanuvchi: {selectedUser.first_name} {selectedUser.last_name}
              </CardDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ta‘rifni tanlang</Label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-background"
                value={grantTariffId}
                onChange={(e) => setGrantTariffId(e.target.value)}
              >
                <option value="">Ta‘rifsiz</option>
                {tariffs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleGrantTariff} disabled={submitting}>
              {submitting ? 'Saqlanmoqda…' : 'Berish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
