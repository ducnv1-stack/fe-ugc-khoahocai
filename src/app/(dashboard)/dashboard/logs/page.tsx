'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, ShieldCheck, AlertOctagon, FileEdit, Trash2, ShieldAlert, UserPlus, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/audit');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.user?.name?.toLowerCase().includes(term) ||
      log.entityId.toLowerCase().includes(term)
    );
  });

  const getLogDisplayDetails = (log: any) => {
    switch (log.action) {
      case 'UPDATE_PAID_AMOUNT':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-amber-600" />,
          badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
          iconBg: 'bg-amber-100',
          title: 'Sửa số tiền thanh toán',
          detailsComponent: (
            <div className="flex flex-col gap-1 text-xs font-mono">
              <span className="text-slate-500 line-through">Cũ: {formatCurrency(log.oldData?.paidAmount || 0)}</span>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded w-fit border border-emerald-100">
                Mới: {formatCurrency(log.newData?.paidAmount || 0)}
              </span>
            </div>
          )
        };
      case 'UPDATE_ORDER_PRICE':
        return {
          icon: <FileEdit className="w-4 h-4 text-blue-600" />,
          badgeClass: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
          iconBg: 'bg-blue-100',
          title: 'Sửa giá/chiết khấu',
          detailsComponent: (
             <div className="flex flex-col gap-1 text-xs font-mono">
              <span className="text-slate-500 line-through">Giá cũ: {formatCurrency(log.oldData?.finalPrice || 0)}</span>
              <span className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded w-fit border border-blue-100">
                Giá mới: {formatCurrency(log.newData?.finalPrice || 0)}
              </span>
            </div>
          )
        };
      case 'CREATE_CUSTOMER':
        return {
          icon: <UserPlus className="w-4 h-4 text-emerald-600" />,
          badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
          iconBg: 'bg-emerald-100',
          title: 'Tạo khách hàng mới',
          detailsComponent: (
             <div className="flex flex-col text-xs font-mono">
              <span className="font-bold text-slate-800">{log.newData?.name} - {log.newData?.code}</span>
              <span className="text-slate-500">{log.newData?.phone}</span>
            </div>
          )
        };
      case 'CREATE_ORDER':
        return {
          icon: <ShoppingBag className="w-4 h-4 text-teal-600" />,
          badgeClass: 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100',
          iconBg: 'bg-teal-100',
          title: 'Gán khóa học (Tạo đơn)',
          detailsComponent: (
             <div className="flex flex-col text-xs font-mono">
              <span className="font-bold text-slate-800">{log.newData?.courses || ''}</span>
              <span className="text-teal-700 bg-teal-50 px-1 py-0.5 w-fit rounded border border-teal-100 mt-1">
                Tổng trị giá: {formatCurrency(log.newData?.finalPrice || 0)}
              </span>
            </div>
          )
        };
      case 'DELETE_ORDER':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-600" />,
          badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
          iconBg: 'bg-rose-100',
          title: 'Xóa đơn hàng (Gỡ khóa)',
          detailsComponent: (
             <div className="flex flex-col text-xs font-mono">
              <span className="text-rose-600 font-bold">Xác nhận xóa hệ thống</span>
              {log.oldData?.total && <span className="text-slate-500 line-through mt-0.5">Giá trị: {formatCurrency(log.oldData.total)}</span>}
            </div>
          )
        };
      default:
        return {
          icon: <ShieldCheck className="w-4 h-4 text-slate-600" />,
          badgeClass: 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100',
          iconBg: 'bg-slate-100',
          title: log.action,
          detailsComponent: (
            <span className="text-xs text-slate-500 font-mono">ID: {log.entityId}</span>
          )
        };
    }
  };

  const getTargetDisplay = (log: any) => {
    const code = log.oldData?.context?.customerCode || log.newData?.context?.customerCode || log.newData?.code;
    const name = log.oldData?.context?.customerName || log.newData?.context?.customerName || log.newData?.name;
    const phone = log.oldData?.context?.customerPhone || log.newData?.context?.customerPhone || log.newData?.phone;

    if (code && name) {
      return (
        <div className="flex flex-col gap-1 w-fit">
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 rounded-md font-mono text-[10px] w-fit px-1.5 py-0.5">
            {code}
          </Badge>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-800 leading-tight">{name}</span>
            <span className="text-[11px] text-slate-500">{phone}</span>
          </div>
        </div>
      );
    }

    return (
      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 mb-1 block w-fit">
        {log.entityType}: {log.entityId.split('-')[0]}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            Audit Logs (Kiểm toán)
          </h2>
          <p className="text-slate-400 mt-0.5 text-[10px] uppercase font-medium tracking-wide">Ghi vết hành động nhạy cảm trên hệ thống</p>
        </div>
      </div>

      <Card className="border border-slate-100 shadow-sm bg-white/50 backdrop-blur-sm rounded-xl">
        <CardContent className="p-2 px-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
              placeholder="Tìm hành động, nhân sự..." 
              className="pl-8 h-8 text-xs bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <Table className="text-[11px]">
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-10 py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Icon</TableHead>
              <TableHead className="py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Thời gian</TableHead>
              <TableHead className="py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Người thực hiện</TableHead>
              <TableHead className="py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Hành động</TableHead>
              <TableHead className="py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Đối tượng</TableHead>
              <TableHead className="max-w-[300px] py-1.5 px-3 font-bold text-slate-400 text-[10px] uppercase tracking-tight">Thay đổi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2 w-5 h-5" /> Đang tải log...</TableCell></TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-slate-400 flex-col items-center justify-center">
                  <ShieldCheck className="w-10 h-10 mb-2 opacity-20 mx-auto" />
                  Hệ thống an toàn. Chưa có hành động nhạy cảm nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                 const display = getLogDisplayDetails(log);
                 return (
                   <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-1.5 px-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${display.iconBg}`}>
                        {React.cloneElement(display.icon as React.ReactElement<any>, { className: 'w-3 h-3' })}
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-400 py-1.5 px-3 font-medium">
                      {new Date(log.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <p className="font-bold text-slate-700 leading-tight">{log.user?.name || 'Hệ thống'}</p>
                      <p className="text-[10px] text-slate-400">{log.user?.email || 'N/A'}</p>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase py-0 px-1.5 h-4 ${display.badgeClass}`}>
                        {display.title}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 px-3">
                      <div className="scale-90 origin-left">
                        {getTargetDisplay(log)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] py-1.5 px-3 scale-90 origin-left">
                      {display.detailsComponent}
                    </TableCell>
                  </TableRow>
                 );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
