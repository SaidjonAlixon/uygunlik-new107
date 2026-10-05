import { crc32, deflateRawSync } from "zlib";

interface ZipEntry {
  name: string;
  method: number;
  flag: number;
  time: number;
  date: number;
  crc: number;
  compressed: Buffer;
  uncompressedSize: number;
  localOffset: number;
}

function findEocd(buf: Buffer): number {
  const min = Math.max(0, buf.length - 22 - 65535);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("Excel arxivi buzilgan");
}

function readEntries(buf: Buffer): ZipEntry[] {
  const eocd = findEocd(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let cursor = buf.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("Excel katalogi o‘qilmadi");
    }
    const method = buf.readUInt16LE(cursor + 10);
    const flag = buf.readUInt16LE(cursor + 8);
    const time = buf.readUInt16LE(cursor + 12);
    const date = buf.readUInt16LE(cursor + 14);
    const crc = buf.readUInt32LE(cursor + 16);
    const compressedSize = buf.readUInt32LE(cursor + 20);
    const uncompressedSize = buf.readUInt32LE(cursor + 24);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localOffset = buf.readUInt32LE(cursor + 42);
    const name = buf.slice(cursor + 46, cursor + 46 + nameLen).toString("utf8");
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const compressed = buf.slice(dataStart, dataStart + compressedSize);
    entries.push({
      name,
      method,
      flag: flag & ~0x8,
      time,
      date,
      crc,
      compressed,
      uncompressedSize,
      localOffset,
    });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function writeLocal(entry: ZipEntry): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(entry.flag & ~0x8, 6);
  header.writeUInt16LE(entry.method, 8);
  header.writeUInt16LE(entry.time, 10);
  header.writeUInt16LE(entry.date, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, name, entry.compressed]);
}

function writeCentral(entry: ZipEntry, offset: number): Buffer {
  const name = Buffer.from(entry.name, "utf8");
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(entry.flag & ~0x8, 8);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(entry.time, 12);
  header.writeUInt16LE(entry.date, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressed.length, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, name]);
}

export function patchZip(
  source: Buffer,
  replacements: Record<string, string | Buffer>,
  extras: Array<{ name: string; data: string | Buffer }> = []
): Buffer {
  const entries = readEntries(source);
  const known = new Set(entries.map((entry) => entry.name));
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const replacement = replacements[entry.name];
    let next = entry;
    if (replacement != null) {
      const raw = Buffer.isBuffer(replacement) ? replacement : Buffer.from(replacement, "utf8");
      const compressed = deflateRawSync(raw);
      next = {
        ...entry,
        method: 8,
        crc: crc32(raw) >>> 0,
        compressed,
        uncompressedSize: raw.length,
      };
    }
    const local = writeLocal(next);
    locals.push(local);
    centrals.push(writeCentral(next, offset));
    offset += local.length;
  }
  const sample = entries[0];
  for (const extra of extras) {
    if (known.has(extra.name)) continue;
    const raw = Buffer.isBuffer(extra.data) ? extra.data : Buffer.from(extra.data, "utf8");
    const compressed = deflateRawSync(raw);
    const next: ZipEntry = {
      name: extra.name,
      method: 8,
      flag: 0,
      time: sample?.time || 0,
      date: sample?.date || 0,
      crc: crc32(raw) >>> 0,
      compressed,
      uncompressedSize: raw.length,
      localOffset: 0,
    };
    const local = writeLocal(next);
    locals.push(local);
    centrals.push(writeCentral(next, offset));
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  const count = entries.length + extras.filter((extra) => !known.has(extra.name)).length;
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, central, eocd]);
}
