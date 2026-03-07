'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/user.store';
import { LayoutDashboard, Users, Gift, BookOpen, MessageSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/admin/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/tariffs', label: "Ta'riflar", icon: Gift },
  { href: '/admin/lessons', label: 'Darslar', icon: BookOpen },
  { href: '/admin/reviews', label: 'Sharhlar', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (user === undefined) return;
    if (!user || (user as { role?: string }).role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [user, isLoginPage, router]);

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
    router.replace('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || (user as { role?: string }).role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">Admin</h1>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200 dark:border-gray-800">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Chiqish
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur flex items-center justify-between px-6">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(user as { email?: string }).email}
          </span>
        </header>
        <div className="p-6 admin-panel">{children}</div>
      </main>
    </div>
  );
}
