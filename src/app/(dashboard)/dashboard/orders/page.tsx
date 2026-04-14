'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time listener for incoming payments that change order statuses
  useSocket((event) => {
    if (event === 'payment.received') {
      fetchOrders();
    }
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.customer?.name.toLowerCase().includes(term) ||
      order.customer?.phone.includes(term) ||
      order.memo?.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Tất cả đơn hàng
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Quản lý và theo dõi trạng thái các đơn đăng ký khóa học.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm relative z-0">
        <CardContent className="p-1.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo Tên KH, SĐT, Mã Đơn, Nội dung CK..." 
              className="pl-9 h-9 text-xs bg-white border-slate-200 shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="h-9 hover:bg-transparent">
              <TableHead className="w-24 text-[11px] font-bold py-1">Mã Đơn</TableHead>
              <TableHead className="text-[11px] font-bold py-1">Ngày tạo</TableHead>
              <TableHead className="text-[11px] font-bold py-1">Khách hàng</TableHead>
              <TableHead className="text-[11px] font-bold py-1">Khóa học</TableHead>
              <TableHead className="text-[11px] font-bold py-1">Nội dung CK</TableHead>
              <TableHead className="text-right text-[11px] font-bold py-1">Giá trị</TableHead>
              <TableHead className="text-right text-[11px] font-bold py-1">Đã thanh toán</TableHead>
              <TableHead className="text-center text-[11px] font-bold py-1">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-32 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2 w-5 h-5" /> Đang tải dữ liệu...</TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-slate-400 flex-col items-center justify-center">
                  <FileText className="w-10 h-10 mb-2 opacity-20 mx-auto" />
                  Không tìm thấy đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                 const isPaid = order.status === 'PAID';
                 const isPartial = order.status === 'PARTIALLY_PAID';
                 
                 return (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-default h-12">
                    <TableCell className="py-1">
                      <span className="font-mono text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {order.id.split('-')[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-500 py-1">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="py-1">
                      <div>
                        <p className="font-bold text-xs text-slate-900">{order.customer?.name || '---'}</p>
                        <p className="text-[10px] text-slate-500">{order.customer?.phone || '---'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-1">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {order.items.map((item: any, idx: number) => (
                           <Badge key={idx} variant="secondary" className="font-medium text-[9px] px-1 py-0 h-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100">
                             {item.course?.code}
                           </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-1">
                       <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                           {order.memo || '---'}
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[11px] py-1">
                      {formatCurrency(order.finalPrice)}
                    </TableCell>
                    <TableCell className="text-right py-1">
                       <span className={`font-bold text-[11px] ${order.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {formatCurrency(order.paidAmount)}
                       </span>
                    </TableCell>
                    <TableCell className="text-center py-1">
                       {isPaid ? (
                           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[9px] px-1.5 py-0 h-4"><CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Đã trả đủ</Badge>
                       ) : isPartial ? (
                           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[9px] px-1.5 py-0 h-4"><AlertCircle className="w-2.5 h-2.5 mr-1" /> Đóng 1 phần</Badge>
                       ) : (
                           <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[9px] px-1.5 py-0 h-4"><AlertCircle className="w-2.5 h-2.5 mr-1" /> Chờ thanh toán</Badge>
                       )}
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
