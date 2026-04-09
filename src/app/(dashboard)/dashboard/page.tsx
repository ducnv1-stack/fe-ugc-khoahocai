'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, ShoppingBag, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, Package, Clock, CheckCircle2, Loader2
} from 'lucide-react';
import api from '@/lib/api';

function formatCurrency(val: number) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return `${val.toLocaleString('vi-VN')}₫`;
}

const MONTH_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const STATUS_ORDER_MAP: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-700' },
  PARTIALLY_PAID: { label: 'Một phần', className: 'bg-blue-100 text-blue-700' },
  PENDING: { label: 'Chờ', className: 'bg-amber-100 text-amber-700' },
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
      title: 'Tổng số khách hàng',
      value: stats.totalCustomers.toLocaleString('vi-VN'),
      icon: Users,
      description: `${stats.customerGrowth >= 0 ? '+' : ''}${stats.customerGrowth}% so với tháng trước`,
      trend: stats.customerGrowth >= 0 ? 'up' : 'down',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Đơn hàng hôm nay',
      value: stats.ordersToday.toLocaleString('vi-VN'),
      icon: ShoppingBag,
      description: `${stats.orderGrowth >= 0 ? '+' : ''}${stats.orderGrowth}% so với hôm qua`,
      trend: stats.orderGrowth >= 0 ? 'up' : 'down',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.revenueThisMonth),
      icon: CreditCard,
      description: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth}% so với tháng trước`,
      trend: stats.revenueGrowth >= 0 ? 'up' : 'down',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Tỷ lệ chốt đơn',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: `Tháng này (Đã thanh toán / Tổng)`,
      trend: stats.conversionRate >= 50 ? 'up' : 'down',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ] : [];

  const chartMax = chart ? Math.max(...chart.months.map((m: any) => m.revenue), 1) : 1;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tổng quan hệ thống</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Chào mừng bạn trở lại, đây là những gì đang diễn ra hôm nay.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title} className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-md transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
                  <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</div>
                  <p className="text-xs flex items-center gap-1 font-medium">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>
                      {stat.description}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-5 md:grid-cols-5">
            {/* Revenue Chart */}
            <Card className="md:col-span-3 border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="text-base font-bold">Biểu đồ doanh thu {chart?.year}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Tổng tiền đã thu theo từng tháng</p>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="mt-2">
                  {/* Bars row */}
                  <div className="flex items-end gap-1.5 h-44 border-b border-slate-100">
                    {chart?.months.map((m: any, i: number) => {
                      const pct = chartMax > 0 && m.revenue > 0
                        ? Math.max((m.revenue / chartMax) * 100, 2)
                        : 0;
                      return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end group">
                          {m.revenue > 0 && (
                            <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 whitespace-nowrap text-center">
                              {formatCurrency(m.revenue)}
                            </span>
                          )}
                          <div
                            className="w-full bg-primary/20 group-hover:bg-primary/60 transition-all duration-500 rounded-t-md"
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Labels row */}
                  <div className="flex gap-1.5 mt-1.5">
                    {chart?.months.map((_: any, i: number) => (
                      <div key={i} className="flex-1 text-center">
                        <span className="text-[9px] text-slate-400 font-medium">{MONTH_LABELS[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Courses */}
            <Card className="md:col-span-2 border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="px-5 pt-5 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Top khóa học
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Khóa bán nhiều nhất</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                {topCourses.map((c, i) => (
                  <div key={c.courseId} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center rounded-full ${i === 0 ? 'text-amber-600 bg-amber-50' : i === 1 ? 'text-slate-600 bg-slate-100' : 'text-orange-700 bg-orange-50'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-800 truncate" title={c.name}>{c.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2 shrink-0">{c.count} đơn</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${topCourses[0]?.count > 0 ? (c.count / topCourses[0].count * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {topCourses.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Đơn hàng gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const statusInfo = STATUS_ORDER_MAP[order.status] || { label: order.status, className: 'bg-slate-100 text-slate-600' };
                  const courseNames = order.items?.map((it: any) => it.course?.name || '').join(', ');
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-slate-800">{order.customer?.name || 'N/A'}</span>
                          <p className="text-xs text-slate-500 truncate max-w-[300px]">{courseNames}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(order.finalPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
