'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, ShoppingBag, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, Package, Clock, CheckCircle2, Loader2,
  Wallet, PieChart, Activity, DollarSign
} from 'lucide-react';
import api from '@/lib/api';

function formatCurrency(val: number) {
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return `${val.toLocaleString('vi-VN')}₫`;
}

function formatFullCurrency(val: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const STATUS_ORDER_MAP: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-700 font-bold' },
  PARTIALLY_PAID: { label: 'Một phần', className: 'bg-blue-100 text-blue-700' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chart, setChart] = useState<any>(null);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [statsRes, chartRes, coursesRes, ordersRes] = await Promise.all([
          api.get('/stats/dashboard'),
          api.get('/stats/revenue-chart'),
          api.get('/stats/top-courses'),
          api.get('/stats/recent-orders'),
        ]);
        setStats(statsRes.data);
        setChart(chartRes.data);
        setTopCourses(coursesRes.data);
        setRecentOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats ? [
    {
      title: 'Tiền thu trước (Cashflow)',
      value: formatCurrency(stats.totalCashflow),
      fullValue: formatFullCurrency(stats.totalCashflow),
      icon: Wallet,
      description: 'Tổng tiền thực tế đã thu trong tháng này',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      title: 'Doanh thu thực tế (Revenue)',
      value: formatCurrency(stats.realRevenue),
      fullValue: formatFullCurrency(stats.realRevenue),
      icon: TrendingUp,
      description: 'Dựa trên số buổi học đã dạy',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      title: 'Chi phí tháng này',
      value: formatCurrency(stats.totalExpenses),
      fullValue: formatFullCurrency(stats.totalExpenses),
      icon: CreditCard,
      description: 'Bao gồm Ads & Vận hành',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    },
    {
      title: 'Lợi nhuận ròng',
      value: formatCurrency(stats.netProfit),
      fullValue: formatFullCurrency(stats.netProfit),
      icon: DollarSign,
      description: 'Doanh thu thực tế - Chi phí',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
  ] : [];

  const chartMax = chart ? Math.max(...chart.months.map((m: any) => Math.max(m.cashflow, m.expenses)), 1) : 1;

  return (
    <div className="space-y-4 pb-12 bg-slate-50/50 -m-6 p-4 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 px-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Báo cáo Tài chính & Vận hành</h1>
          <p className="text-slate-400 font-medium mt-0.5 uppercase text-[9px] tracking-wider flex items-center gap-1.5">
            <Activity className="w-2.5 h-2.5 text-indigo-400" /> Cập nhật theo thời gian thực — {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">Tổng khách hàng</p>
              <p className="text-base font-bold text-slate-700">{stats?.totalCustomers || 0}</p>
          </div>
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <div className="text-right">
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-tight">Đơn mới hôm nay</p>
              <p className="text-base font-bold text-indigo-500">{stats?.ordersToday || 0}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 font-medium animate-pulse">Đang nạp dữ liệu tài chính...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title} className={`border ${stat.border} shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300`}>
                <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3">
                  <CardTitle className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</CardTitle>
                  <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} transition-all`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="flex flex-col">
                    <div className={`text-lg font-bold mb-0.5 tracking-tight ${stat.color}`}>{stat.value}</div>
                    <p className="text-[9px] text-slate-400 font-normal border-t border-slate-50 pt-1.5 mt-0.5">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-5">
            {/* Revenue Chart */}
            <Card className="md:col-span-3 border-none shadow-sm bg-white rounded-xl overflow-hidden">
              <CardHeader className="p-3 px-4 bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-indigo-400" /> Hiệu suất tài chính {chart?.year}
                  </CardTitle>
                  <p className="text-[9px] text-slate-400 font-medium">Đối soát giữa Tiền mặt và Chi phí</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span className="text-[9px] font-medium text-slate-500 uppercase">TIỀN MẶT</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-rose-400 rounded-full" />
                        <span className="text-[9px] font-medium text-slate-500 uppercase">CHI PHÍ</span>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 px-6 pt-6">
                <div className="h-48 relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-black" />)}
                  </div>
                  
                  {/* Bars Row */}
                  <div className="relative z-10 flex items-end gap-2 h-full">
                    {chart?.months.map((m: any, i: number) => {
                      const cashPct = (m.cashflow / chartMax) * 100;
                      const expPct = (m.expenses / chartMax) * 100;
                      
                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end gap-px group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 left-1/2 -rotate-90 origin-bottom-left md:rotate-0 md:origin-center md:-translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] p-1.5 rounded-lg z-20 pointer-events-none whitespace-nowrap font-bold">
                            T{i+1}: +{formatCurrency(m.cashflow)} / -{formatCurrency(m.expenses)}
                          </div>

                          <div 
                            className="w-full bg-rose-400 rounded-sm opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                            style={{ height: `${Math.max(expPct, 2)}%` }}
                          />
                          <div
                            className="w-full bg-indigo-500 rounded-t-sm shadow-sm transition-all cursor-pointer"
                            style={{ height: `${Math.max(cashPct, 5)}%` }}
                          />
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400">{MONTH_LABELS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders Side */}
            <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-xl overflow-hidden">
                <CardHeader className="p-3 px-4 border-b border-slate-50">
                    <CardTitle className="text-xs font-bold uppercase tracking-tight flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Các đơn hàng mới nhất
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                        {recentOrders.map((order) => {
                            const statusInfo = STATUS_ORDER_MAP[order.status] || { label: order.status, className: 'bg-slate-100 text-slate-600' };
                            return (
                                <div key={order.id} className="p-2 px-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                    <div className="flex gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                                            {order.customer?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 leading-none">{order.customer?.name}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5 font-normal truncate max-w-[120px]">{order.items?.[0]?.course?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-700">{formatCurrency(order.finalPrice)}</p>
                                        <span className={`text-[7px] font-bold uppercase tracking-tight px-1 py-0.5 rounded ${statusInfo.className}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Top Courses & Quick Actions */}
          <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-2xl p-6">
                <CardTitle className="text-sm font-black uppercase tracking-tight mb-6 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" /> Tuyến khóa học hiệu quả nhất
                </CardTitle>
                <div className="grid gap-6">
                    {topCourses.map((c, i) => (
                        <div key={c.courseId} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1 inline-block">#{i+1} RANKING</span>
                                    <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-slate-900">{c.count} HỌC VIÊN</span>
                                    <p className="text-[10px] text-slate-400 font-bold">{formatCurrency(c.revenue)} ĐÃ THU</p>
                                </div>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                                    style={{ width: `${topCourses[0]?.count > 0 ? (c.count / topCourses[0].count * 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
              </Card>

              {/* Conversion Pie Placeholder / Additional Stat */}
              <Card className="border-none shadow-sm bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Hiệu suất chốt đơn</CardTitle>
                        <h2 className="text-5xl font-black">{stats?.conversionRate}%</h2>
                        <p className="text-[10px] text-indigo-200 mt-2 font-medium">Tỷ lệ đơn hàng ĐÃ THANH TOÁN (PAID) trên tổng số đơn hàng khởi tạo trong tháng.</p>
                    </div>
                    
                    <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">Thông tin vận hành</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">Tỉ lệ phủ lớp</span>
                            <span className="text-xs font-black">78.5%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                            <div className="w-[78.5%] h-full bg-white" />
                        </div>
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
              </Card>
          </div>
        </>
      )}
    </div>
  );
}
