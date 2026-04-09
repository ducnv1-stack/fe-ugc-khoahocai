'use client';

import React, { useState } from 'react';
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, Loader2, Eye, EyeOff, ShieldCheck, Sparkles, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      login(access_token, refresh_token, user);
      toast.success('Chào mừng trở lại! Đang chuyển hướng...');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 px-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-violet-500/10 blur-[100px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-grid-white/[0.02] dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-20 blur-sm animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center">
              <Command className="w-8 h-8 text-blue-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Hệ thống Quản lý Khách hàng - <span className="text-blue-600 font-bold">UGC KhoahocAI</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="group relative">
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl px-8 py-10 rounded-[2rem] border border-white/40 dark:border-slate-800/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form Content */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Tài khoản Email
                  </Label>
                  <div className="relative group/input">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@csms.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-base pl-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Mật khẩu
                    </Label>
                    <button 
                      type="button" 
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer outline-none focus:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative group/input">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all text-base pr-12 pl-4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-base font-bold shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] group/btn cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang xác thực bảo mật...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      Gia nhập hệ thống
                    </div>
                  )}
                </Button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 pt-4">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Secure Identity Platform v2.0
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 dark:text-slate-600 text-[12px] font-medium tracking-wide">
            &copy; 2026 Admin Portal. Bảo mật bởi <span className="font-bold text-slate-500 dark:text-slate-500">KhoahocAI Team</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

