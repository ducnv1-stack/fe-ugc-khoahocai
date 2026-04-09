'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, CreditCard, ShoppingBag,
  Users, BarChart3, Loader2, ChevronLeft, ChevronRight, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

function formatCurrency(val: number) {
  return `${val.toLocaleString('vi-VN')}₫`;
}

function formatShort(val: number) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return `${val}`;
}

const MONTH_LABELS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const SHORT_LABELS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [chart, setChart] = useState<any>(null);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chartRes, coursesRes] = await Promise.all([
          api.get(`/stats/revenue-chart?year=${year}`),
          api.get('/stats/top-courses?limit=8'),
        ]);
        setChart(chartRes.data);
        setTopCourses(coursesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  const summary = useMemo(() => {
    if (!chart) return null;
    const totalRevenue = chart.months.reduce((s: number, m: any) => s + m.revenue, 0);
    const totalOrders = chart.months.reduce((s: number, m: any) => s + m.orders, 0);
    const bestMonthIdx = chart.months.reduce((best: number, m: any, i: number) =>
      m.revenue > chart.months[best].revenue ? i : best, 0);
    const currentMonthRevenue = chart.months[new Date().getMonth()]?.revenue || 0;
    const prevMonthRevenue = chart.months[Math.max(0, new Date().getMonth() - 1)]?.revenue || 0;
    const growth = prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)
      : '0';
    return { totalRevenue, totalOrders, bestMonthIdx, currentMonthRevenue, growth: parseFloat(growth) };
  }, [chart]);

  const chartMax = useMemo(() =>
    chart ? Math.max(...chart.months.map((m: any) => m.revenue), 1) : 1,
    [chart]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-primary" />
            Báo cáo Doanh thu
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Phân tích hiệu suất kinh doanh và xu hướng tăng trưởng theo thời gian
          </p>
        </div>

        {/* Year Picker */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-slate-700 w-12 text-center">{year}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={year >= currentYear} onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng doanh thu</span>
                  <div className="p-2 bg-violet-50 rounded-xl">
                    <CreditCard className="w-4 h-4 text-violet-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{formatShort(summary?.totalRevenue || 0)}<span className="text-sm font-normal text-slate-400 ml-1">₫</span></div>
                <p className="text-xs text-slate-500 mt-1">Cả năm {year}</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng đơn hàng</span>
                  <div className="p-2 bg-orange-50 rounded-xl">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{summary?.totalOrders.toLocaleString('vi-VN') || 0}</div>
                <p className="text-xs text-slate-500 mt-1">Cả năm {year}</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tháng tốt nhất</span>
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <div className="text-xl font-bold tracking-tight">{MONTH_LABELS[summary?.bestMonthIdx ?? 0]}</div>
                <p className="text-xs text-slate-500 mt-1">{formatShort(chart?.months[summary?.bestMonthIdx ?? 0]?.revenue || 0)}₫</p>
              </CardContent>
            </Card>

            <Card className={`border shadow-sm ${(summary?.growth || 0) >= 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tháng hiện tại</span>
                  <div className={`p-2 rounded-xl ${(summary?.growth || 0) >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {(summary?.growth || 0) >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                      : <TrendingDown className="w-4 h-4 text-rose-600" />
                    }
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{formatShort(summary?.currentMonthRevenue || 0)}<span className="text-sm font-normal text-slate-400 ml-1">₫</span></div>
                <p className={`text-xs mt-1 font-semibold ${(summary?.growth || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(summary?.growth || 0) >= 0 ? '↑' : '↓'} {Math.abs(summary?.growth || 0)}% so với tháng trước
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-base font-bold">Biểu đồ doanh thu theo tháng — Năm {year}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Tổng tiền đã thu từ khách hàng mỗi tháng</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* Chart: bars area + labels below */}
              <div className="mt-4">
                {/* Bars row - fixed height, items-end aligns to bottom */}
                <div className="flex items-end gap-1.5 h-44 border-b border-slate-100">
                  {chart?.months.map((m: any, i: number) => {
                    const pct = chartMax > 0 && m.revenue > 0
                      ? Math.max((m.revenue / chartMax) * 100, 2)
                      : 0;
                    const isCurrentMonth = i === new Date().getMonth() && year === currentYear;
                    return (
                      <div key={i} className="flex-1 h-full flex flex-col justify-end group">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-center text-slate-500 whitespace-nowrap mb-0.5 leading-tight">
                          {m.revenue > 0 && <><span className="font-semibold">{formatShort(m.revenue)}₫</span><br /></>}
                          {m.orders > 0 && <span className="text-[8px]">{m.orders} đơn</span>}
                        </div>
                        {/* Bar */}
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isCurrentMonth
                              ? 'bg-primary'
                              : m.revenue > 0
                                ? 'bg-primary/25 group-hover:bg-primary/60'
                                : 'bg-slate-100/60'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* Labels row - separate from bars */}
                <div className="flex gap-1.5 mt-1.5">
                  {chart?.months.map((_: any, i: number) => {
                    const isCurrentMonth = i === new Date().getMonth() && year === currentYear;
                    return (
                      <div key={i} className="flex-1 text-center">
                        <span className={`text-[9px] font-medium ${
                          isCurrentMonth ? 'text-primary font-bold' : 'text-slate-400'
                        }`}>
                          {SHORT_LABELS[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Table */}
              <div className="mt-6 border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left py-2.5 px-4 text-slate-500 font-semibold">Tháng</th>
                      <th className="text-right py-2.5 px-4 text-slate-500 font-semibold">Số đơn</th>
                      <th className="text-right py-2.5 px-4 text-slate-500 font-semibold">Doanh thu</th>
                      <th className="text-right py-2.5 px-4 text-slate-500 font-semibold">Tỉ trọng / Năm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {chart?.months.map((m: any, i: number) => {
                      const totalRevenue = summary?.totalRevenue || 0;
                      const pct = totalRevenue > 0
                        ? ((m.revenue / totalRevenue) * 100).toFixed(1) : '0';
                      const isCurrentMonth = i === new Date().getMonth() && year === currentYear;
                      return (
                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors ${isCurrentMonth ? 'bg-primary/5' : ''}`}>
                          <td className="py-2 px-4 font-medium">
                            {MONTH_LABELS[i]}
                            {isCurrentMonth && <Badge className="ml-2 text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0 hover:bg-primary/10">Hiện tại</Badge>}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-600">{m.orders > 0 ? m.orders : '—'}</td>
                          <td className="py-2 px-4 text-right font-semibold text-slate-800">{m.revenue > 0 ? formatCurrency(m.revenue) : '—'}</td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary/50 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-slate-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                      <td className="py-3 px-4 text-slate-700">Tổng cộng</td>
                      <td className="py-3 px-4 text-right text-slate-700">{summary?.totalOrders}</td>
                      <td className="py-3 px-4 text-right text-primary">{formatCurrency(summary?.totalRevenue || 0)}</td>
                      <td className="py-3 px-4 text-right text-slate-500">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Courses */}
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Top khóa học bán chạy
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Dựa trên số lượng đơn hàng chứa khóa học đó</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3 mt-2">
                {topCourses.map((c, i) => (
                  <div key={c.courseId} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-200 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-800 truncate">{c.name}</span>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-xs text-slate-500">{c.count} đơn</span>
                          <span className="text-xs font-bold text-slate-700">{formatShort(c.revenue)}₫</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${i === 0 ? 'bg-amber-400' : 'bg-primary/50'}`}
                          style={{ width: `${topCourses[0]?.count > 0 ? (c.count / topCourses[0].count * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {topCourses.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
