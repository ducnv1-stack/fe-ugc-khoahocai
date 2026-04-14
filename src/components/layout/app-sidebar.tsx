'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BookOpen,
  Calendar,
  CreditCard,
  ShieldCheck,
  LogOut,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/provider/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible } from '@base-ui/react/collapsible';
import { cn } from '@/lib/utils';
import { useSettings } from '@/provider/settings-provider';

const navItems = [
  {
    title: 'Tổng quan',
    href: '/dashboard',
    icon: LayoutDashboard,
    permissions: ['dashboard.view'],
  },
  {
    title: 'Quản lý Khách hàng',
    href: '/dashboard/customers',
    icon: Users,
    permissions: ['customers.view'],
  },
  {
    title: 'Đơn hàng & Thanh toán',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    permissions: ['orders.view', 'payments.view'],
    items: [
      { title: 'Tất cả đơn hàng', href: '/dashboard/orders' },
      { title: 'Lịch sử giao dịch', href: '/dashboard/payments' },
    ],
  },
  {
    title: 'Khóa học',
    href: '/dashboard/courses',
    icon: BookOpen,
    permissions: ['courses.view'],
  },
  {
    title: 'Lịch học',
    href: '/dashboard/schedules',
    icon: Calendar,
    permissions: ['schedules.view'],
  },
  {
    title: 'Báo cáo doanh thu',
    href: '/dashboard/reports',
    icon: CreditCard,
    permissions: ['reports.view'],
  },
  {
    title: 'Hệ thống',
    href: '/dashboard/system',
    icon: ShieldCheck,
    permissions: ['users.view', 'roles.view', 'settings.view', 'webhooks.view'],
    items: [
      { title: 'Quản lý nhân sự', href: '/dashboard/users' },
      { title: 'Phân quyền', href: '/dashboard/roles' },
      { title: 'Cấu hình Webhook', href: '/dashboard/webhooks' },
      { title: 'Cài đặt chung', href: '/dashboard/settings' },
      { title: 'Audit Logs', href: '/dashboard/logs' },
    ],
  },
];

export function AppSidebar() {
  const { user, logout, hasPermission } = useAuth();
  const { systemName } = useSettings();
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const filteredNavItems = navItems.filter(item => 
    !item.permissions || item.permissions.some(perm => hasPermission(perm))
  );

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.items) {
      return item.items.some(sub => pathname === sub.href);
    }
    if (item.href === '/dashboard' && pathname === '/dashboard') return true;
    return pathname.startsWith(item.href) && item.href !== '/dashboard';
  };

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
      {/* Logo Section */}
      <SidebarHeader className="h-14 px-3 flex items-center justify-center overflow-hidden border-b border-sidebar-border/30">
        <Link href="/dashboard" className="flex items-center gap-3 w-full group transition-all duration-300">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            {systemName?.substring(0, 2).toUpperCase() || 'CS'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-bold text-sm tracking-tight leading-none text-slate-800 dark:text-slate-200">{systemName}</span>
              <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider mt-0.5">CMS Platform</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      
      {/* Navigation section */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">
              Menu chính
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">
            {filteredNavItems.map((item) => {
              const active = isItemActive(item);
              const hasChildren = item.items && item.items.length > 0;

              // Case 1: Expanded Sidebar with Children
              if (hasChildren && !isCollapsed) {
                return (
                  <CollapsibleMenuItem 
                    key={item.title} 
                    item={item} 
                    pathname={pathname}
                    isParentActive={active}
                  />
                );
              }

              // Case 2: Collapsed Sidebar with Children (Shown as Dropdown)
              if (hasChildren && isCollapsed) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuButton 
                            tooltip={item.title}
                            isActive={active}
                            className={cn(
                              "h-9 px-2.5 rounded-lg transition-all duration-200 group/btn",
                              active 
                                ? "bg-blue-600/10 text-blue-600 font-bold dark:bg-blue-500/10 dark:text-blue-400" 
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                            )}
                          />
                        }
                      >
                        <item.icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          active ? "text-blue-600 dark:text-blue-400" : "group-hover/btn:text-slate-700 dark:group-hover/btn:text-slate-300"
                        )} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="min-w-48 ml-2 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-lg">
                        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/50 mb-1">
                          {item.title}
                        </div>
                        {item.items!.map((sub) => {
                          const subActive = pathname === sub.href;
                          return (
                            <DropdownMenuItem 
                              key={sub.title}
                              render={
                                <Link
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer mx-1",
                                    subActive 
                                      ? "bg-blue-600/10 text-blue-600 font-bold dark:bg-blue-500/10 dark:text-blue-400"
                                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                  )}
                                />
                              }
                            >
                              {sub.title}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }

              // Case 3: Normal Link (Expanded or Collapsed)
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    render={<Link href={item.href} />}
                    tooltip={item.title}
                    isActive={active}
                    className={cn(
                      "h-9 px-2.5 rounded-lg transition-all duration-200 group/btn",
                      active 
                        ? "bg-blue-600/10 text-blue-600 font-bold dark:bg-blue-500/10 dark:text-blue-400" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active ? "text-blue-600 dark:text-blue-400" : "group-hover/btn:text-slate-700 dark:group-hover/btn:text-slate-300"
                    )} />
                    {!isCollapsed && <span className="text-[12.5px] ml-1">{item.title}</span>}
                    {active && !isCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-in zoom-in duration-300" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer section */}
      <SidebarFooter className="p-2 border-t border-sidebar-border/30">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton 
                size="default" 
                className="w-full justify-start gap-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors px-1"
              />
            }
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 rounded-lg border border-white dark:border-slate-800 shadow-sm">
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px] font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900 shadow-sm" />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-32 text-left leading-none">{user?.name || 'User'}</span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">{user?.role || 'Guest'}</span>
              </div>
            )}
            {!isCollapsed && <MoreHorizontal className="ml-auto w-3.5 h-3.5 text-slate-300" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isCollapsed ? "right" : "top"} align={isCollapsed ? "center" : "end"} className="min-w-56 mb-2 rounded-xl shadow-2xl border-sidebar-border/50 backdrop-blur-lg">
            <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 mb-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500" /> Tài khoản hệ thống
            </div>
            <DropdownMenuItem 
              className="text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30 cursor-pointer py-3 rounded-lg mx-1" 
              onClick={logout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-semibold">Đăng xuất tài khoản</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Collapsible menu item with smooth height animation
function CollapsibleMenuItem({ 
  item, 
  pathname,
  isParentActive,
}: { 
  item: typeof navItems[0]; 
  pathname: string;
  isParentActive: boolean;
}) {
  const [open, setOpen] = React.useState(isParentActive);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) return null; // Logic is handled in main map for collapsed state

  return (
    <SidebarMenuItem>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isParentActive}
              className={cn(
                "h-9 px-2.5 rounded-lg transition-all duration-200",
                isParentActive 
                  ? "bg-slate-50 text-blue-700 font-bold dark:bg-slate-800/50 dark:text-blue-400" 
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            />
          }
        >
          <item.icon className={cn(
            "w-4 h-4 shrink-0",
            isParentActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
          )} />
          <span className="text-[12.5px] ml-1">{item.title}</span>
          <ChevronDown 
            className={cn(
              "ml-auto w-3.5 h-3.5 text-slate-300 transition-transform duration-300 ease-in-out",
              open ? "rotate-180" : "rotate-0"
            )} 
          />
        </Collapsible.Trigger>
        <Collapsible.Panel className="overflow-hidden transition-all data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
          <ul className="mt-1 ml-[21px] space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-1">
            {item.items!.map((sub) => {
              const subActive = pathname === sub.href;
              return (
                <li key={sub.title}>
                  <Link
                    href={sub.href}
                    className={cn(
                      "flex items-center h-7 px-2 rounded-lg text-xs transition-all duration-200",
                      subActive
                        ? "bg-blue-600/5 text-blue-600 font-bold dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {sub.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Collapsible.Panel>
      </Collapsible.Root>
    </SidebarMenuItem>
  );
}

