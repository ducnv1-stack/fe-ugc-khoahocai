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
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          Cài đặt hệ thống
        </h2>
        <p className="text-slate-400 mt-0.5 text-[10px] uppercase font-medium tracking-wide">Tùy chỉnh cấu hình & giao diện</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="p-3 px-4 bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight">
              <Palette className="w-3.5 h-3.5 text-blue-500" />
              Giao diện & Màu sắc
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Chế độ hiển thị</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  Sáng
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  Tối
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${theme === 'system' ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-bold text-slate-600">Hệ màu UI</label>
              
              <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-50">
                <input 
                  type="color" 
                  value={colors.primary}
                  onChange={(e) => setColors({...colors, primary: e.target.value})}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700">Màu chủ đạo</span>
                  <span className="font-mono text-[9px] uppercase text-slate-400">{colors.primary}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-50">
                <input 
                  type="color" 
                  value={colors.sidebarDark}
                  onChange={(e) => setColors({...colors, sidebarDark: e.target.value})}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700">Sidebar (Tối)</span>
                  <span className="font-mono text-[9px] uppercase text-slate-400">{colors.sidebarDark}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-50">
                <input 
                  type="color" 
                  value={colors.bgDark}
                  onChange={(e) => setColors({...colors, bgDark: e.target.value})}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700">Nền chính (Tối)</span>
                  <span className="font-mono text-[9px] uppercase text-slate-400">{colors.bgDark}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSaveTheme}
              className="w-full mt-2 h-8 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Lưu cấu hình giao diện
            </button>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-xl overflow-hidden self-start">
          <CardHeader className="p-3 px-4 bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight">
              <Building className="w-3.5 h-3.5 text-indigo-500" />
              Thông tin chung
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
             <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Tên hệ thống</label>
              <input 
                type="text" 
                className="w-full h-8 px-3 text-xs border rounded-lg bg-transparent focus:ring-1 focus:ring-primary outline-none" 
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Logo</label>
              <div className="h-14 w-14 border border-dashed rounded-lg flex items-center justify-center text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 transition-colors">
                Tải lên
              </div>
            </div>
            <button 
              onClick={handleSaveGeneral}
              className="w-full h-8 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Lưu thông tin chung
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
