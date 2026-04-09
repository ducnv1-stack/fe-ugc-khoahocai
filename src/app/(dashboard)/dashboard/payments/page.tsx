'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, ArrowDownLeft, Receipt, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/payments');
      setPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Real-time listener for incoming payments
  useSocket((event) => {
    if (event === 'payment.received') {
      fetchPayments();
    }
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      payment.transactionCode?.toLowerCase().includes(term) ||
      payment.order?.customer?.name.toLowerCase().includes(term) ||
      payment.order?.memo?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            Lịch sử Giao dịch
          </h2>
          <p className="text-muted-foreground mt-1">Ghi nhận toàn bộ luồng tiền chuyển khoản từ khách hàng.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo Mã GD, Tên người chuyển, Nội dung CK..." 
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
              <TableHead className="w-16 text-center">In/Out</TableHead>
              <TableHead>Khách hàng / Tham chiếu</TableHead>
              <TableHead>Nội dung CK thực tế</TableHead>
              <TableHead>Mã Giao dịch</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2 w-5 h-5" /> Đang tải dữ liệu...</TableCell></TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-slate-400 flex-col items-center justify-center">
                  <Receipt className="w-10 h-10 mb-2 opacity-20 mx-auto" />
                  Chưa có giao dịch nào được ghi nhận.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                 return (
                  <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {payment.order ? (
                            <>
                                <p className="font-bold text-sm text-slate-900">{payment.order.customer?.name}</p>
                                <p className="text-[11px] text-slate-500 flex gap-2">
                                  <span>Đơn: {payment.order.id.split('-')[0]}</span>
                                  {payment.order.items?.length > 0 && (
                                      <span>• {payment.order.items[0]?.course?.code} {payment.order.items.length > 1 ? `(+${payment.order.items.length - 1})` : ''}</span>
                                  )}
                                </p>
                            </>
                        ) : (
                            <p className="font-bold text-sm text-slate-500 italic">Không phân loại được</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                       <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 block max-w-xs truncate" title={payment.rawData?.content || payment.rawData?.description}>
                           {payment.rawData?.content || payment.rawData?.description || '---'}
                       </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-500">
                        {payment.transactionCode || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(payment.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-emerald-600">
                      +{formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                       {payment.status === 'SUCCESS' ? (
                           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Thành công</Badge>
                       ) : (
                           <Badge variant="secondary" className="text-slate-500"><AlertCircle className="w-3 h-3 mr-1" /> {payment.status}</Badge>
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
