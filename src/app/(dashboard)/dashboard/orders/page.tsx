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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Tất cả đơn hàng
          </h2>
          <p className="text-muted-foreground mt-1">Quản lý và theo dõi trạng thái các đơn đăng ký khóa học.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo Tên KH, SĐT, Mã Đơn, Nội dung CK..." 
              className="pl-10 h-11 bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-24">Mã Đơn</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Khóa học</TableHead>
              <TableHead>Nội dung CK</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead className="text-right">Đã thanh toán</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
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
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors cursor-default">
                    <TableCell>
                      <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {order.id.split('-')[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{order.customer?.name || '---'}</p>
                        <p className="text-[11px] text-slate-500">{order.customer?.phone || '---'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {order.items.map((item: any, idx: number) => (
                           <Badge key={idx} variant="secondary" className="font-medium text-[10px] py-0 h-4 bg-blue-50 text-blue-700 hover:bg-blue-100">
                             {item.course?.code}
                           </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                           {order.memo || '---'}
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {formatCurrency(order.finalPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                       <span className={`font-bold text-sm ${order.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                         {formatCurrency(order.paidAmount)}
                       </span>
                    </TableCell>
                    <TableCell className="text-center">
                       {isPaid ? (
                           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã trả đủ</Badge>
                       ) : isPartial ? (
                           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><AlertCircle className="w-3 h-3 mr-1" /> Đóng 1 phần</Badge>
                       ) : (
                           <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100"><AlertCircle className="w-3 h-3 mr-1" /> Chờ thanh toán</Badge>
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
