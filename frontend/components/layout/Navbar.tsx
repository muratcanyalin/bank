'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.error('User load error:', err);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/accounts', label: 'Hesaplarım', icon: '💳' },
    { href: '/transfer', label: 'Para Transferi', icon: '💸' },
    { href: '/transactions', label: 'İşlem Geçmişi', icon: '📜' },
    { href: '/bills', label: 'Faturalar', icon: '📱' },
    { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
    { href: '/employee', label: 'Çalışan Paneli', icon: '👔' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-primary-600 whitespace-nowrap">
                🏦 Mini Bank
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-2 lg:px-3 py-1 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    pathname === item.href
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="mr-1 lg:mr-2">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center flex-shrink-0 ml-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap hidden sm:inline">
                {user ? `${user.firstName} ${user.lastName}` : 'Yükleniyor...'}
              </span>
              <button onClick={handleLogout} className="btn-secondary text-xs sm:text-sm px-2 sm:px-4">
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}


