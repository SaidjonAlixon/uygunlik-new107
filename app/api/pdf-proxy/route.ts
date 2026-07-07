import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function htmlErrorPage(message: string, openLink: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;background:#1f2937;color:#e5e7eb;padding:2rem;text-align:center;max-width:480px;margin:2rem auto;">
<p style="margin-bottom:1rem;">${message}</p>
<p><a href="${openLink}" target="_blank" rel="noopener" style="display:inline-block;padding:0.5rem 1rem;background:#dc2626;color:white;text-decoration:none;border-radius:0.5rem;">Yangi oynada ochish</a></p>
</body></html>`;
}

function isGoogleLoginPage(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes('sign in') ||
    lower.includes('signin') ||
    lower.includes('kirish') ||
    lower.includes('continue to google drive') ||
    lower.includes('sign in to continue') ||
    (lower.includes('google drive') && (lower.includes('email') || lower.includes('phone'))) ||
    lower.includes('forgot email') ||
    lower.includes('email or phone') ||
    lower.includes('accounts.google.com') ||
    (lower.includes('not your computer') && lower.includes('sign in'))
  );
}

function getConfirmDownloadUrl(html: string, fileId: string): string | null {
  const base = 'https://drive.google.com';
  const decoded = html.replace(/&amp;/g, '&');
  const actionMatch = decoded.match(/action="(https:\/\/drive\.google\.com\/uc\?[^"]+)"/i)
    || decoded.match(/action="(\/uc\?[^"]+export=download[^"]+)"/i);
  if (actionMatch) {
    const u = actionMatch[1];
    if (u.startsWith('http')) return u;
    return base + u;
  }
  const hrefMatch = decoded.match(/href="(\/uc\?[^"]*export=download[^"]*)"/i);
  if (hrefMatch) return base + hrefMatch[1];
  const tokenMatch = decoded.match(/confirm=([a-zA-Z0-9_-]+)/);
  if (tokenMatch) return `${base}/uc?export=download&id=${fileId}&confirm=${tokenMatch[1]}`;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Noto\'g\'ri file ID' }, { status: 400 });
  }

  const driveViewLink = `https://drive.google.com/file/d/${id}/view`;

  function err(msg: string) {
    return new NextResponse(htmlErrorPage(msg, driveViewLink), {
      status: 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    let driveUrl: string = `https://drive.google.com/uc?export=download&id=${id}`;
    let res = await fetch(driveUrl, { headers: { 'User-Agent': UA }, redirect: 'manual' });

    if (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
      const loc = (res.headers.get('location') || '').trim();
      if (loc.includes('accounts.google.com') || loc.includes('signin') || loc.includes('ServiceLogin')) {
        return err('PDF shu kartada ko\'rinishi uchun Drive da faylni "Havola bilan ulashish" qiling. Google kirish so\'ralmaydi.');
      }
      if (loc && (loc.includes('drive.google.com') || loc.startsWith('/'))) {
        const nextUrl = loc.startsWith('http') ? loc : `https://drive.google.com${loc.startsWith('/') ? loc : '/' + loc}`;
        res = await fetch(nextUrl, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      }
    }

    if (!res.ok && res.status >= 300) {
      return err('PDF yuklanmadi.');
    }

    const finalUrl = res.url || '';
    if (finalUrl.includes('accounts.google.com') || finalUrl.includes('signin') || finalUrl.includes('ServiceLogin')) {
      return err('PDF shu kartada ko\'rinishi uchun faylni "Havola bilan ulashish" qiling.');
    }

    let contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const bodyText = await res.text();
      if (isGoogleLoginPage(bodyText)) {
        return err('Faylni Drive da "Havola bilan ulashish" qiling – PDF shu kartada ko\'rinadi.');
      }
      const confirmUrl = getConfirmDownloadUrl(bodyText, id);
      if (confirmUrl) {
        res = await fetch(confirmUrl, { headers: { 'User-Agent': UA }, redirect: 'manual' });
        const loc = res.headers.get('location');
        if (loc && (loc.includes('accounts.google.com') || loc.includes('signin'))) {
          return err('Fayl yopiq. "Havola bilan ulashish" qiling.');
        }
        if (res.status >= 300 && res.status < 400 && loc) {
          res = await fetch(loc.startsWith('http') ? loc : `https://drive.google.com${loc}`, { headers: { 'User-Agent': UA }, redirect: 'follow' });
        }
        if (!res.ok) return err('PDF yuklanmadi.');
        if (res.url && (res.url.includes('accounts.google.com') || res.url.includes('signin'))) {
          return err('Fayl yopiq. "Havola bilan ulashish" qiling.');
        }
        contentType = res.headers.get('content-type') || 'application/pdf';
        if (contentType.includes('text/html')) {
          const nextBody = await res.text();
          if (isGoogleLoginPage(nextBody)) return err('Fayl yopiq. "Havola bilan ulashish" qiling.');
          contentType = 'application/pdf';
        }
      } else {
        return err('Fayl ochiq emas. "Havola bilan ulashish" qiling.');
      }
    }

    if (!contentType.includes('pdf')) contentType = 'application/pdf';
    if (contentType.includes('text/html') || (contentType.includes('text/') && !contentType.includes('pdf'))) {
      return err('PDF yuklanmadi. Faylni Drive da "Havola bilan ulashish" qiling.');
    }

    const body = await res.arrayBuffer();
    if (!body || body.byteLength === 0) {
      return err('PDF yuklanmadi.');
    }
    const firstChunk = new Uint8Array(body.byteLength < 8192 ? body.byteLength : 8192);
    firstChunk.set(new Uint8Array(body).subarray(0, firstChunk.length));
    const head = new TextDecoder().decode(firstChunk);
    if (head.trimStart().startsWith('<') || head.includes('<html') || head.includes('<!DOCTYPE') || isGoogleLoginPage(head)) {
      return err('Faylni Drive da "Havola bilan ulashish" qiling. Google kirish so\'ralmaydi.');
    }
    if (!head.startsWith('%PDF') && !contentType.includes('pdf')) {
      return err('PDF yuklanmadi. Faylni "Havola bilan ulashish" qiling.');
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType.includes('pdf') ? contentType : 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('PDF proxy error:', e);
    return NextResponse.json({ error: 'Server xatoligi' }, { status: 500 });
  }
}
