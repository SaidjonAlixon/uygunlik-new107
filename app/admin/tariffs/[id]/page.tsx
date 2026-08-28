'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminTariffIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) router.replace(`/admin/tariffs/${id}/lessons`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-gray-400">Yo‘naltirilmoqda…</p>
    </div>
  );
}
