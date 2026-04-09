'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSocket } from '@/hooks/use-socket';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for realtime notifications
  useSocket((event, data) => {
    if (event === 'notification.received') {
      setNotifications(prev => [data, ...prev].slice(0, 20));
      // Optional: Play sound
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
       console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
       console.error('Failed to mark all as read', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WARNING': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'ERROR': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[12px] h-3 px-0.5 flex items-center justify-center bg-red-500 text-[8px] font-bold text-white rounded-full border border-white dark:border-slate-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden shadow-2xl border-slate-200 dark:border-slate-800" align="end">
        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">Thông báo</h3>
            {unreadCount > 0 && <Badge variant="secondary" className="px-1.5 py-0 rounded-full text-[10px]">{unreadCount} mới</Badge>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-slate-500 hover:text-primary" onClick={markAllAsRead}>
              <Check className="w-3 h-3 mr-1" /> Đã đọc hết
            </Button>
          )}
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
               <Bell className="w-8 h-8 mb-2 opacity-20" />
               <p className="text-xs">Chưa có thông báo nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group",
                    !notif.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                  )}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="space-y-1 pr-4">
                      <p className={cn("text-xs font-bold leading-tight", !notif.isRead ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400")}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-normal">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 pt-0.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        <div className="p-1 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <button className="text-[11px] font-medium text-slate-500 hover:text-primary transition-colors cursor-pointer">Xem tất cả thông báo</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
