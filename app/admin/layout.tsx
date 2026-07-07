'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/store/user.store';
import { LayoutDashboard, Users, Gift, BookOpen, MessageSquare, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/admin/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/admin/tariffs', label: "Ta'riflar", icon: Gift },
  { href: '/admin/lessons', label: 'Darslar', icon: BookOpen },
  { href: '/admin/tests', label: 'Testlar', icon: ClipboardList },
  { href: '/admin/reviews', label: 'Sharhlar', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  // Pathname o'zgarganda menyuni yopish (mobile uchun)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#FEFBEE]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#5D1111] border-t-transparent" />
      </div>
    );
  }

  if (!user || (user as { role?: string }).role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#FEFBEE] text-[#5D1111] font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 border-r border-[#7A2E2E]/20 bg-[#5D1111] text-[#FEFBEE] flex flex-col shadow-xl z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between lg:justify-center">
          <h1 className="font-serif font-extrabold tracking-widest text-2xl text-[#FEFBEE]">UYG'UNLIK</h1>
          <button
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${pathname === href
                ? 'bg-[#FEFBEE] text-[#5D1111] shadow-md'
                : 'text-[#FEFBEE]/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Button variant="ghost" className="w-full justify-start gap-3 text-[#FEFBEE] hover:bg-white/10 hover:text-white" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Chiqish
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FEFBEE]">
        <header className="sticky top-0 z-10 h-16 border-b border-[#7A2E2E]/10 bg-[#FEFBEE]/100 sm:bg-[#FEFBEE]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shadow-sm">
          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-[#5D1111] hover:bg-[#7A2E2E]/5 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-[#7A2E2E]/20 shadow-sm ml-auto">
            <div className="h-8 w-8 rounded-full bg-[#5D1111] flex items-center justify-center text-[#FEFBEE] font-bold shrink-0">
              {((user as { first_name?: string }).first_name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-[#5D1111] hidden sm:block">
              {(user as { email?: string }).email}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
