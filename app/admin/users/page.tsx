'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/services/admin.service';
import { useDebounce } from '@/hooks/use-debounce';
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
import { Search, UserPlus, Pencil, Trash2, Gift, XCircle, Eye, EyeOff, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatTashkentDateTime } from '@/lib/datetime';

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
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'user',
    status: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const loadUsers = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ page, limit: 20, search: debouncedSearch || undefined })
      .then((res) => {
        setUsers(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => toast.error('Foydalanuvchilarni yuklashda xato'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (searchParams.get('action') === 'add') setAddOpen(true);
  }, [searchParams]);

  const openGrant = (user: UserRow) => {
    setSelectedUser(user);
    setGrantTariffId(user.tariff_id ? String(user.tariff_id) : '');
    adminApi.getTariffs().then((r) => setTariffs(r.data || [])).catch(() => { });
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

  const handleCancelTariff = async (user: UserRow) => {
    if (!user.tariff_id) return;
    if (!confirm(`${user.first_name} ${user.last_name} uchun ta'rif bekor qilinsinmi?`)) return;
    try {
      await adminApi.grantTariff(String(user.id), null);
      toast.success("Ta'rif bekor qilindi");
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xato');
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

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportUsersExcel();
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      const disposition = res.headers?.['content-disposition'] as string | undefined;
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `foydalanuvchilar-${Date.now()}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel yuklandi');
    } catch {
      toast.error('Excel yuklashda xato');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  const tariffBadgeClass = (name?: string | null) => {
    const n = (name || '').toLowerCase();
    if (n.includes('vip') || n.includes('premium')) {
      return 'bg-violet-100 text-violet-900 border-violet-300';
    }
    if (n.includes('optimal')) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (n.includes('start') || n.includes('boshlang') || n.includes('basic')) {
      return 'bg-sky-100 text-sky-900 border-sky-300';
    }
    if (n.includes('standart') || n.includes('standard')) {
      return 'bg-teal-100 text-teal-900 border-teal-300';
    }
    // Berilgan, lekin noma'lum tarif
    return 'bg-[#5D1111]/10 text-[#5D1111] border-[#5D1111]/25';
  };

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Foydalanuvchilar</h1>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#7A2E2E]/60" />
            <Input
              placeholder="Qidiruv (ism, email)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="pl-10 h-11 bg-white border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] placeholder:text-[#5D1111]/40 rounded-xl shadow-sm transition-all"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={handleExportExcel}
            className="h-11 border-[#5D1111]/30 text-[#5D1111] hover:bg-[#5D1111]/5 rounded-xl px-4"
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            {exporting ? 'Yuklanmoqda…' : 'Excel yuklash'}
          </Button>
          <Button onClick={() => setAddOpen(true)} className="h-11 bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md transition-colors px-5">
            <UserPlus className="h-5 w-5 mr-2" />
            Qo&apos;shish
          </Button>
        </div>
      </div>

      <Card className="border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5 rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#FEFBEE]/50 border-b border-[#7A2E2E]/10 pb-4">
          <CardTitle className="text-xl font-bold text-[#5D1111]">Ro'yxat</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FEFBEE]/80 text-[#7A2E2E] font-bold border-b border-[#7A2E2E]/10">
                  <tr>
                    <th className="py-4 px-4 font-semibold w-[80px]">ID</th>
                    <th className="py-4 px-4 font-semibold">Ism Familiya</th>
                    <th className="py-4 px-4 font-semibold">Email</th>
                    <th className="py-4 px-4 font-semibold min-w-[180px]">Ro'yxatdan o'tgan</th>
                    <th className="py-4 px-4 font-semibold w-[100px]">Status</th>
                    <th className="py-4 px-4 font-semibold min-w-[180px] whitespace-nowrap">Ta'rif</th>
                    <th className="py-4 px-4 font-semibold text-right w-[160px]">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7A2E2E]/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FEFBEE]/40 transition-colors group border-b border-[#7A2E2E]/5 last:border-0">
                      <td className="py-4 px-4 text-[#5D1111]/70 font-medium">{u.id}</td>
                      <td className="py-4 px-4 font-semibold text-[#5D1111] whitespace-nowrap">{u.first_name} {u.last_name}</td>
                      <td className="py-4 px-4 text-[#5D1111]/80">{u.email}</td>
                      <td className="py-4 px-4 text-[#5D1111]/80 text-sm whitespace-nowrap font-medium tabular-nums">
                        {formatTashkentDateTime(u.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${u.status ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                          {u.status ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#5D1111] font-medium whitespace-nowrap">
                        {u.tariff_name || u.tariff_id ? (
                          <span
                            className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${tariffBadgeClass(u.tariff_name)}`}
                          >
                            {u.tariff_name || `Tarif #${u.tariff_id}`}
                          </span>
                        ) : (
                          <span className="text-[#5D1111]/40">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7A2E2E] hover:bg-[#FEFBEE] hover:text-[#5D1111]" asChild>
                            <Link href={`/admin/users/${u.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openGrant(u)} title="Ta'rif berish">
                            <Gift className="h-4 w-4" />
                          </Button>
                          {u.role !== 'admin' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(u.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {u.tariff_id && u.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              onClick={() => handleCancelTariff(u)}
                              title="Ta'rifni bekor qilish"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#7A2E2E]/10 bg-[#FEFBEE]/30">
              <span className="text-sm text-[#7A2E2E]">
                Sahifa <span className="font-semibold text-[#5D1111]">{page}</span> / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE]" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Oldingi
                </Button>
                <Button variant="outline" size="sm" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE]" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Keyingi
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add user modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Foydalanuvchi qo&apos;shish</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#5D1111] font-semibold">Ism *</Label>
                <Input
                  className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#5D1111] font-semibold">Familiya *</Label>
                <Input
                  className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Email *</Label>
              <Input
                type="email"
                className="h-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Parol * <span className="text-xs font-normal text-[#7A2E2E]/70">(kamida 8 belgi)</span></Label>
              <div className="relative">
                <Input
                  type={showAddPassword ? 'text' : 'password'}
                  className="h-11 pr-11 bg-[#FEFBEE]/50 border-[#7A2E2E]/20 text-[#5D1111] focus-visible:ring-[#5D1111] focus-visible:border-[#5D1111] rounded-xl"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A2E2E]/70 hover:text-[#5D1111]"
                  aria-label={showAddPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                >
                  {showAddPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  className="w-4 h-4 text-[#5D1111] focus:ring-[#5D1111] border-[#7A2E2E]/20 cursor-pointer"
                  checked={form.role === 'user'}
                  onChange={() => setForm((f) => ({ ...f, role: 'user' }))}
                />
                <span className="text-sm font-medium text-[#5D1111] group-hover:text-[#7A2E2E]">Foydalanuvchi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  className="w-4 h-4 text-[#5D1111] focus:ring-[#5D1111] border-[#7A2E2E]/20 cursor-pointer"
                  checked={form.role === 'admin'}
                  onChange={() => setForm((f) => ({ ...f, role: 'admin' }))}
                />
                <span className="text-sm font-medium text-[#5D1111] group-hover:text-[#7A2E2E]">Admin</span>
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group pt-2 border-t border-[#7A2E2E]/10">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-[#5D1111] focus:ring-[#5D1111] border-[#7A2E2E]/20 cursor-pointer"
                checked={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
              />
              <span className="text-sm font-medium text-[#5D1111] group-hover:text-[#7A2E2E]">Faol status</span>
            </label>
            <DialogFooter className="pt-4 border-t border-[#7A2E2E]/10 flex gap-2">
              <Button type="button" variant="outline" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" onClick={() => setAddOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md" disabled={submitting}>
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grant tariff modal */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="bg-white border-[#7A2E2E]/20 shadow-2xl rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-[#5D1111]">Ta'rif berish</DialogTitle>
            {selectedUser && (
              <CardDescription className="text-[#7A2E2E]/80">
                Foydalanuvchi: <span className="font-semibold text-[#5D1111]">{selectedUser.first_name} {selectedUser.last_name}</span>
              </CardDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#5D1111] font-semibold">Ta'rifni tanlang</Label>
              <select
                className="w-full h-11 border border-[#7A2E2E]/20 rounded-xl px-4 py-2 bg-[#FEFBEE]/50 text-[#5D1111] focus:ring-2 focus:ring-[#5D1111] focus:border-transparent outline-none transition-all cursor-pointer appearance-none"
                value={grantTariffId}
                onChange={(e) => setGrantTariffId(e.target.value)}
              >
                <option value="">Ta'rifsiz (Bekor qilish)</option>
                {tariffs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" className="border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE] rounded-xl" onClick={() => setGrantOpen(false)}>Bekor qilish</Button>
            <Button className="bg-[#5D1111] hover:bg-[#7A2E2E] text-white rounded-xl shadow-md" onClick={handleGrantTariff} disabled={submitting}>
              {submitting ? 'Saqlanmoqda...' : 'Berish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
