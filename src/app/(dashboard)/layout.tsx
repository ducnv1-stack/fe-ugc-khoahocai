'use client';

import React, { useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useAuth } from '@/provider/auth-provider';
import { useRouter } from 'next/navigation';
import { Loader2, Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NotificationCenter } from '@/components/layout/notification-center';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50/50 dark:bg-slate-950/50">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-6 border-b border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm nhanh..." 
                className="pl-9 bg-slate-100/50 dark:bg-slate-800/50 border-none focus-visible:ring-1" 
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="h-8 w-[1px] bg-border mx-1"></div>
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-semibold leading-none">{user.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1 tracking-wide font-medium uppercase">{user.role}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
