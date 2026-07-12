import ExcelJS from 'exceljs';
import { formatTashkentDateTime } from '@/lib/datetime';

export type UserExportRow = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  status?: boolean;
  tariff_id?: number | null;
  tariff_name?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF5D1111' },
};

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEFBEE' },
};

const TARIFF_YES_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEF3C7' },
};

const TARIFF_NO_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE7D8D0' } },
  left: { style: 'thin', color: { argb: 'FFE7D8D0' } },
  bottom: { style: 'thin', color: { argb: 'FFE7D8D0' } },
  right: { style: 'thin', color: { argb: 'FFE7D8D0' } },
};

const HEADERS = [
  'ID',
  'Ism',
  'Familiya',
  'To‘liq ism',
  'Email',
  'Rol',
  'Status',
  'Tarif nomi',
  'Tarif holati',
  'Ro‘yxatdan o‘tgan (Toshkent)',
  'Oxirgi yangilanish (Toshkent)',
] as const;

function roleLabel(role?: string) {
  if (role === 'admin') return 'Administrator';
  return 'Foydalanuvchi';
}

function statusLabel(status?: boolean) {
  return status ? 'Faol' : 'Nofaol';
}

export async function generateUsersExcel(users: UserExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Uyg'unlik";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Foydalanuvchilar", {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
  });

  sheet.columns = [
    { key: 'id', width: 8 },
    { key: 'first_name', width: 16 },
    { key: 'last_name', width: 18 },
    { key: 'full_name', width: 26 },
    { key: 'email', width: 32 },
    { key: 'role', width: 16 },
    { key: 'status', width: 12 },
    { key: 'tariff_name', width: 22 },
    { key: 'tariff_status', width: 16 },
    { key: 'created_at', width: 28 },
    { key: 'updated_at', width: 28 },
  ];

  const headerRow = sheet.addRow([...HEADERS]);
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF3D0C0C' } },
      left: { style: 'thin', color: { argb: 'FF3D0C0C' } },
      bottom: { style: 'medium', color: { argb: 'FF3D0C0C' } },
      right: { style: 'thin', color: { argb: 'FF3D0C0C' } },
    };
  });

  const sorted = [...users].sort((a, b) => a.id - b.id);

  sorted.forEach((u, index) => {
    const hasTariff = Boolean(u.tariff_id || u.tariff_name);
    const row = sheet.addRow({
      id: u.id,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      full_name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      email: u.email || '',
      role: roleLabel(u.role),
      status: statusLabel(u.status),
      tariff_name: u.tariff_name || '—',
      tariff_status: hasTariff ? 'Berilgan' : 'Berilmagan',
      created_at: formatTashkentDateTime(u.created_at),
      updated_at: formatTashkentDateTime(u.updated_at),
    });

    row.height = 22;
    const alt = index % 2 === 1 ? ALT_ROW_FILL : undefined;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 ? 'center' : 'left',
        wrapText: true,
      };
      cell.font = { size: 11, name: 'Calibri', color: { argb: 'FF5D1111' } };
      if (alt) cell.fill = alt;
    });

    const tariffCell = row.getCell('tariff_status');
    tariffCell.fill = hasTariff ? TARIFF_YES_FILL : TARIFF_NO_FILL;
    tariffCell.font = {
      bold: true,
      size: 11,
      color: { argb: hasTariff ? 'FF92400E' : 'FF475569' },
    };
    tariffCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: HEADERS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function usersExcelFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 16).replace(/[:T]/g, '-');
  return `foydalanuvchilar-${stamp}.xlsx`;
}
