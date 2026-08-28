'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminTariffLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const tariffId = String(params.id);

  useEffect(() => {
    if (tariffId) {
      router.replace(`/admin/lessons?tariffId=${tariffId}`);
    }
  }, [tariffId, router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5D1111] border-t-transparent" />
    </div>
  );
}
