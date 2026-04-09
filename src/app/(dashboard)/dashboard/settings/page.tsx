'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Settings as SettingsIcon, Palette, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState({
    primary: '#2563eb',
    sidebarDark: '#1e293b',
    bgDark: '#0f172a',
  });
  const [systemName, setSystemName] = useState('CSMS CRM');

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get('/settings');
        if (data.theme?.colors) {
          setColors((prev) => ({ ...prev, ...data.theme.colors }));
        }
        if (data.general?.systemName) {
          setSystemName(data.general.systemName);
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveTheme = async () => {
    try {
      await api.patch('/settings', {
        theme: { colors, mode: theme }
      });
      document.documentElement.style.setProperty('--primary', colors.primary);
      document.documentElement.style.setProperty('--custom-bg-dark', colors.bgDark);
      document.documentElement.style.setProperty('--custom-sidebar-dark', colors.sidebarDark);
      alert('Đã lưu cấu hình giao diện');
    } catch (error) {
      alert('Lỗi lưu cấu hình');
    }
  };

  const handleSaveGeneral = async () => {
    try {
      await api.patch('/settings', {
        general: { systemName }
      });
      alert('Đã lưu thông tin chung');
    } catch (error) {
      alert('Lỗi lưu thông tin');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-muted-foreground mt-1">Quản lý cấu hình, giao diện và các tuỳ chọn mặc định của hệ thống.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-500" />
              Giao diện & Màu sắc
            </CardTitle>
            <CardDescription>Tuỳ chỉnh màu sắc và chế độ sáng/tối</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chế độ hiển thị (Dark Mode)</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-md border ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Sáng (Light)
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-md border ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Tối (Dark)
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-4 py-2 rounded-md border ${theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Hệ thống
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">Chọn hệ màu</label>
              
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={colors.primary}
                  onChange={(e) => setColors({...colors, primary: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  aria-label="Màu chủ đạo"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Màu chủ đạo</span>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{colors.primary}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={colors.sidebarDark}
                  onChange={(e) => setColors({...colors, sidebarDark: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  aria-label="Màu Sidebar (Tối)"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Màu Sidebar (Tối)</span>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{colors.sidebarDark}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={colors.bgDark}
                  onChange={(e) => setColors({...colors, bgDark: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                  aria-label="Màu nền (Tối)"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Màu nền chính (Tối)</span>
                  <span className="font-mono text-xs uppercase text-muted-foreground">{colors.bgDark}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSaveTheme}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Lưu giao diện
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              Thông tin chung
            </CardTitle>
            <CardDescription>Tên hệ thống, logo công ty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">Tên hệ thống</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md bg-transparent" 
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo</label>
              <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                Upload
              </div>
            </div>
            <button 
              onClick={handleSaveGeneral}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md text-sm font-medium transition-colors"
            >
              Lưu thông tin
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
