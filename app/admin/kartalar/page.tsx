'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/services/admin.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, Search } from 'lucide-react';
import { toast } from 'sonner';

type CardRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  filledDays: number;
  dayCount: number;
  hasCard: boolean;
  updatedAt: string;
};

function statusLabel(row: CardRow): string {
  if (!row.hasCard) return 'Karta yo‘q';
  if (row.filledDays <= 0) return 'Hali to‘ldirilmagan';
  if (row.filledDays >= row.dayCount) return 'To‘liq';
  return `${row.filledDays}/${row.dayCount} kun`;
}

function saveBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileNameFrom(row: CardRow): string {
  const name = [row.firstName, row.lastName].map((part) => part.trim()).filter(Boolean).join(' ');
  const safe = (name || 'Karta').replace(/[\\/:*?"<>|]/g, '').slice(0, 31);
  return `${safe}.xlsx`;
}

export default function AdminCardsPage() {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [templateBusy, setTemplateBusy] = useState(false);

  useEffect(() => {
    adminApi
      .getObservationCards()
      .then((res) => setRows(res.data.data || []))
      .catch(() => toast.error('Kartalarni yuklashda xato'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.firstName, row.lastName, row.email, row.cardNumber].join(' ').toLowerCase().includes(query)
    );
  }, [rows, search]);

  const downloadPerson = async (row: CardRow) => {
    setDownloadingId(row.id);
    try {
      const res = await adminApi.exportObservationExcel(row.id);
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      saveBlob(blob, fileNameFrom(row));
      toast.success('Excel yuklandi');
    } catch {
      toast.error('Excel yuklashda xato');
    } finally {
      setDownloadingId('');
    }
  };

  const downloadTemplate = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      toast.error('1-kun sanasini tanlang');
      return;
    }
    setTemplateBusy(true);
    try {
      const res = await adminApi.exportObservationTemplate(startDate);
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      saveBlob(blob, 'kuzatuv-shablon.xlsx');
      toast.success('Shablon yuklandi');
      setTemplateOpen(false);
    } catch {
      toast.error('Shablon yuklashda xato');
    } finally {
      setTemplateBusy(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#5D1111]">Kuzatuv kartalari</h1>
          <p className="mt-1 text-sm text-[#5D1111]/70">Istalgan odamning natijasi va holatini Excel qilib yuklab oling.</p>
        </div>
        <Button
          type="button"
          onClick={() => setTemplateOpen(true)}
          className="h-11 rounded-xl bg-[#5D1111] px-5 text-white hover:bg-[#7A2E2E]"
        >
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Tayyor shablon
        </Button>
      </div>

      <Card className="overflow-hidden rounded-2xl border-[#7A2E2E]/10 bg-white shadow-md shadow-[#7A2E2E]/5">
        <CardHeader className="flex flex-col gap-3 border-b border-[#7A2E2E]/10 bg-[#FEFBEE]/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-bold text-[#5D1111]">Ro‘yxat</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A2E2E]/60" />
            <Input
              placeholder="Ism, email yoki karta"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-xl border-[#7A2E2E]/20 bg-white pl-10 text-[#5D1111]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5D1111] border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#7A2E2E]/10 bg-[#FEFBEE]/80 font-bold text-[#7A2E2E]">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Ism familiya</th>
                    <th className="px-4 py-4 font-semibold">Email</th>
                    <th className="px-4 py-4 font-semibold">Karta</th>
                    <th className="px-4 py-4 font-semibold">Holat</th>
                    <th className="px-4 py-4 text-right font-semibold">Excel</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id} className="border-b border-[#7A2E2E]/5 last:border-0 hover:bg-[#FEFBEE]/40">
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-[#5D1111]">
                        {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-4 text-[#5D1111]/80">{row.email || '—'}</td>
                      <td className="px-4 py-4 font-medium text-[#5D1111]">{row.cardNumber || '—'}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                            !row.hasCard
                              ? 'border-[#e6dfd6] bg-white text-[#6d625c]'
                              : row.filledDays > 0
                                ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                : 'border-amber-200 bg-amber-100 text-amber-900'
                          }`}
                        >
                          {statusLabel(row)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!row.hasCard || downloadingId === row.id}
                          onClick={() => downloadPerson(row)}
                          className="h-9 rounded-xl border-[#5D1111]/30 text-[#5D1111] hover:bg-[#5D1111]/5"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {downloadingId === row.id ? 'Yuklanmoqda…' : 'Yuklab olish'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[#5D1111]/60">
                        Hech narsa topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="border-[#e6dfd6] bg-[#FEFBEE] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#5D1111]">Tayyor shablon</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="shablon-sana" className="text-[#5D1111]">
              1-kun qaysi sanadan boshlansin?
            </Label>
            <Input
              id="shablon-sana"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-xl border-[#e6dfd6] bg-white"
            />
            <p className="text-sm text-[#6d625c]">
              12 ta oy alohida varaqda bo‘ladi. Tanlangan sana faqat shu oyning varag‘iga yoziladi, boshqa oylar o‘zgarmaydi. Shu varaqda 1-kun sanasini o‘zgartirsangiz, pastdagi kunlar va jadvallar faqat shu varaqda yangilanadi.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTemplateOpen(false)} className="rounded-xl">
              Bekor qilish
            </Button>
            <Button
              type="button"
              disabled={!startDate || templateBusy}
              onClick={downloadTemplate}
              className="rounded-xl bg-[#5D1111] text-white hover:bg-[#7A2E2E]"
            >
              {templateBusy ? 'Yuklanmoqda…' : 'Yuklab olish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
