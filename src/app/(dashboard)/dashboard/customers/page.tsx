'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  ChevronDown, 
  ChevronRight, 
  Phone, 
  FileText, 
  Loader2, 
  UserCircle, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Check, 
  X, 
  Banknote, 
  Percent,
  Trash2,
  FileCheck,
  FileX
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Customer, CustomerFormDialog } from './customer-form-dialog';
import { OrderCreateDialog } from './order-create-dialog';
import { useSocket } from '@/hooks/use-socket';
import { useConfirm } from '@/provider/confirm-provider';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQr, setActiveQr] = useState<any>(null);

  // States cho việc chỉnh sửa memo
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoValue, setMemoValue] = useState('');
  const [memoLoading, setMemoLoading] = useState(false);

  // States cho việc chỉnh sửa tiền đã đóng
  const [editingPaidAmountId, setEditingPaidAmountId] = useState<string | null>(null);
  const [paidAmountValue, setPaidAmountValue] = useState<number | ''>('');
  const [paidAmountLoading, setPaidAmountLoading] = useState(false);

  // States cho việc chỉnh sửa giá/chiết khấu
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceEditData, setPriceEditData] = useState<{
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    finalPrice: number;
    totalPrice: number;
    localAmount: number | '';
    localPercent: number | '';
  } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const canManage = hasPermission('customers.manage');

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const url = search ? `/customers?search=${search}` : '/customers';
      const { data } = await api.get(url);
      setCustomers(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Listen for realtime payments
  useSocket((event, data) => {
    if (event === 'payment.received') {
      fetchCustomers(searchTerm);
      toast.success(`Đã nhận thanh toán ${new Intl.NumberFormat('vi-VN').format(data.amount)}đ từ ${data.customerName}`, {
        description: 'Dữ liệu đã được cập nhật tự động.',
        duration: 5000,
      });
    }
  });

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer.id}`, data);
        toast.success('Cập nhật khách hàng thành công');
      } else {
        await api.post('/customers', data);
        toast.success('Thêm khách hàng thành công');
      }
      fetchCustomers(searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      throw error;
    }
  };

  const handleUpdateMemo = async (orderId: string) => {
    setMemoLoading(true);
    try {
      await api.patch(`/orders/${orderId}/memo`, { memo: memoValue });
      toast.success('Đã cập nhật nội dung chuyển khoản');
      setEditingMemoId(null);
      fetchCustomers(searchTerm);
    } catch (error) {
      toast.error('Lỗi khi cập nhật nội dung');
    } finally {
      setMemoLoading(false);
    }
  };

  const handleUpdatePaidAmount = async (orderId: string) => {
    const amount = Number(paidAmountValue);
    if (isNaN(amount) || amount < 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    
    setPaidAmountLoading(true);
    try {
      await api.patch(`/orders/${orderId}/paid-amount`, { paidAmount: amount });
      toast.success('Đã cập nhật số tiền khách thanh toán');
      setEditingPaidAmountId(null);
      fetchCustomers(searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số tiền');
    } finally {
      setPaidAmountLoading(false);
    }
  };

  // Logic chỉnh sửa giá liên kết
  const startEditingPrice = (order: any) => {
    const totalPrice = order.totalPrice || 0;
    const discountType = order.discountType || 'FIXED';
    const discountValue = order.discountValue || 0;
    
    let localAmount: number | '' = '';
    let localPercent: number | '' = '';

    if (discountType === 'FIXED') {
      localAmount = discountValue;
      localPercent = totalPrice > 0 ? Number(((discountValue / totalPrice) * 100).toFixed(2)) : 0;
    } else {
      localPercent = discountValue;
      localAmount = Math.round(totalPrice * (discountValue / 100));
    }

    setPriceEditData({
      discountType,
      discountValue,
      finalPrice: order.finalPrice,
      totalPrice,
      localAmount,
      localPercent
    });
    setEditingPriceId(order.id);
  };

  const handlePriceAmountChange = (val: string) => {
    if (!priceEditData) return;
    const amount = val === '' ? 0 : Number(val);
    const percent = priceEditData.totalPrice > 0 ? Number(((amount / priceEditData.totalPrice) * 100).toFixed(2)) : 0;
    
    setPriceEditData({
      ...priceEditData,
      discountType: 'FIXED',
      discountValue: amount,
      localAmount: val === '' ? '' : amount,
      localPercent: percent,
      finalPrice: Math.max(0, priceEditData.totalPrice - amount)
    });
  };

  const handlePricePercentChange = (val: string) => {
    if (!priceEditData) return;
    const percent = val === '' ? 0 : Number(val);
    const amount = Math.round(priceEditData.totalPrice * (percent / 100));
    
    setPriceEditData({
      ...priceEditData,
      discountType: 'PERCENT',
      discountValue: percent,
      localPercent: val === '' ? '' : percent,
      localAmount: amount,
      finalPrice: Math.max(0, priceEditData.totalPrice - amount)
    });
  };

  const saveOrderPrice = async (orderId: string) => {
    if (!priceEditData) return;
    setPriceLoading(true);
    try {
      await api.patch(`/orders/${orderId}/price`, {
        discountType: priceEditData.discountType,
        discountValue: priceEditData.discountValue,
        finalPrice: priceEditData.finalPrice
      });
      toast.success('Đã cập nhật giá đơn hàng');
      setEditingPriceId(null);
      fetchCustomers(searchTerm);
    } catch (error) {
      toast.error('Lỗi khi cập nhật giá');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const isConfirmed = await confirm({
      title: 'Xác nhận gỡ khóa học',
      description: 'Bạn có chắc chắn muốn gỡ khóa học này? Thao tác này sẽ xóa đơn hàng và không thể hoàn tác.',
      confirmText: 'Gỡ khóa học',
      variant: 'destructive'
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Đã gỡ khóa học khỏi khách hàng');
      fetchCustomers(searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa đơn hàng');
    }
  };

  const handleToggleInvoice = async (orderId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/orders/${orderId}/invoice-status`, { invoiceIssued: !currentStatus });
      toast.success(currentStatus ? 'Đã đánh dấu chưa xuất hóa đơn' : 'Đã đánh dấu đã xuất hóa đơn');
      fetchCustomers(searchTerm);
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái hóa đơn');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getCustomerInsights = (customer: any) => {
    const orders = customer.orders || [];
    const totalSpent = orders.reduce((sum: number, o: any) => sum + o.paidAmount, 0);
    const totalDue = orders.reduce((sum: number, o: any) => sum + o.finalPrice, 0);
    const hasUnpaid = orders.some((o: any) => o.status !== 'PAID');
    const courseCount = orders.reduce((sum: number, o: any) => sum + (o.items?.length || 0), 0);
    
    const paidOrdersCount = orders.filter((o: any) => o.status === 'PAID').length;
    const pendingOrdersCount = orders.filter((o: any) => o.status !== 'PAID').length;

    const tags = [...customer.tags];
    if (totalSpent > 20000000) tags.push('VIP');
    if (courseCount >= 3) tags.push('Học viên cũ');
    if (courseCount === 1) tags.push('Mới');

    return { totalSpent, totalDue, hasUnpaid, courseCount, paidOrdersCount, pendingOrdersCount, tags };
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hệ thống CRM Khách hàng</h2>
          <p className="text-muted-foreground mt-1">Quản lý sâu sát hành trình học tập và thanh toán.</p>
        </div>
        <div className="flex gap-2">
            {canManage && (
                <Button onClick={() => { setEditingCustomer(null); setFormOpen(true); }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Thêm Khách hàng
                </Button>
            )}
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo Tên, SĐT, Mã KH... (VD: Nguyễn Văn A, 09x, KH1001)" 
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
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="min-w-[200px]">Thông tin khách</TableHead>
              <TableHead>Khóa học</TableHead>
              <TableHead>Trạng thái đơn</TableHead>
              <TableHead>Trình trạng học phí</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Đang tải...</TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">Không có dữ liệu.</TableCell></TableRow>
            ) : (
              customers.map((customer) => {
                const isExpanded = expandedRows.has(customer.id);
                const { totalSpent, totalDue, hasUnpaid, courseCount, paidOrdersCount, pendingOrdersCount, tags } = getCustomerInsights(customer);
                
                return (
                  <React.Fragment key={customer.id}>
                    <TableRow className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50 border-b-0' : ''}`} onClick={() => toggleRow(customer.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tags.includes('VIP') ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            <UserCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 leading-none">{customer.name}</p>
                              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 bg-slate-50 border-slate-200 text-slate-500">
                                {customer.code || 'KH---'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2"><Phone className="w-3 h-3" /> {customer.phone}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {tags.map(tag => (
                                <Badge key={tag} className={`text-[9px] px-1 py-0 font-normal uppercase ${tag === 'VIP' ? 'bg-amber-500 hover:bg-amber-600' : tag === 'Mới' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-none'}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="font-bold bg-blue-50 text-blue-700 border-blue-100">{courseCount} Khóa</Badge>
                          <div className="flex -space-x-1 overflow-hidden">
                            {customer.orders?.flatMap((o: any) => o.items).slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} title={item.course.name} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                                    {item.course.code.substring(0, 2)}
                                </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                            {paidOrdersCount > 0 && <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {paidOrdersCount} Đã xong</span>}
                            {pendingOrdersCount > 0 && <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {pendingOrdersCount} Chờ xử lý</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 w-full max-w-[140px]">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[10px] text-slate-400">Tổng:</span>
                            <span className="text-[11px] font-medium">{formatCurrency(totalDue)}</span>
                          </div>
                          <div className="flex items-baseline justify-between border-b border-dashed border-slate-200 pb-1">
                            <span className="text-[10px] text-slate-400">Đã đóng:</span>
                            <span className="text-[11px] font-bold text-emerald-600">{formatCurrency(totalSpent)}</span>
                          </div>
                          {totalDue - totalSpent > 0 && (
                            <div className="flex items-baseline justify-between pt-0.5">
                              <span className="text-[10px] font-medium text-rose-500">Còn nợ:</span>
                              <span className="text-[11px] font-bold text-rose-600">{formatCurrency(totalDue - totalSpent)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-500">{customer.assignedSale?.name || '---'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:bg-primary/5 text-primary text-xs" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setOrderOpen(true); }}>
                          <Plus className="w-3 h-3 mr-1" /> Gán khóa học
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableCell colSpan={7} className="py-4 pl-14 pr-8">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-3 bg-slate-50/50 border-b flex justify-between items-center mt-0">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch sử đơn hàng & Thanh toán</h4>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditingCustomer(customer); setFormOpen(true); }}>
                                    <FileText className="w-3 h-3 mr-1" /> Chỉnh sửa hồ sơ
                                </Button>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                  <TableHead className="h-10 text-[11px]">Ngày tạo</TableHead>
                                  <TableHead className="h-10 text-[11px]">Khóa học</TableHead>
                                  <TableHead className="h-10 text-[11px]">Giá trị đơn</TableHead>
                                  <TableHead className="h-10 text-[11px]">Nội dung CK</TableHead>
                                  <TableHead className="h-10 text-[11px]">Đã thanh toán</TableHead>
                                  <TableHead className="h-10 text-[11px]">Trạng thái</TableHead>
                                  <TableHead className="h-10 text-[11px]">Hóa đơn</TableHead>
                                  <TableHead className="h-10 text-[11px] text-right">QR / Thu tiền</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.orders && customer.orders.length > 0 ? (
                                  customer.orders.map((order: any) => {
                                    const defaultMemo = `${order.items[0]?.course?.code || 'UGC'} ${customer.phone}`.trim();
                                    const displayMemo = order.memo || defaultMemo;
                                    
                                    return (
                                      <TableRow key={order.id} className="hover:bg-slate-50 group border-slate-100 last:border-0 h-10">
                                        <TableCell className="text-[11px] py-1">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell className="text-[11px] py-1 font-medium">
                                          {order.items.map((i: any) => i.course.code).join(', ')}
                                        </TableCell>
                                        
                                        {/* Cột Giá trị đơn - Có tính năng chỉnh sửa nhanh */}
                                        <TableCell className="py-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold">{formatCurrency(order.finalPrice)}</span>
                                                {editingPriceId === order.id && priceEditData ? (
                                                    <Popover open={true} onOpenChange={(open) => !open && setEditingPriceId(null)}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-4 shadow-xl border-slate-200" align="start">
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <h5 className="font-bold text-xs uppercase text-slate-500">Cấu hình giảm giá</h5>
                                                                    <Badge variant="outline" className="text-[9px]">Gốc: {formatCurrency(priceEditData.totalPrice)}</Badge>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] flex items-center gap-1"><Banknote className="w-3 h-3" /> Tiền mặt (VNĐ)</Label>
                                                                        <Input 
                                                                            type="number" 
                                                                            className="h-8 text-xs font-bold" 
                                                                            value={priceEditData.localAmount} 
                                                                            onChange={e => handlePriceAmountChange(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] flex items-center gap-1"><Percent className="w-3 h-3" /> Phần trăm (%)</Label>
                                                                        <Input 
                                                                            type="number" 
                                                                            className="h-8 text-xs font-bold" 
                                                                            value={priceEditData.localPercent} 
                                                                            onChange={e => handlePricePercentChange(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="pt-2 border-t flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400">Giá mới:</p>
                                                                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(priceEditData.finalPrice)}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPriceId(null)}>
                                                                            <X className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button size="icon" className="h-7 w-7 bg-emerald-600" onClick={() => saveOrderPrice(order.id)} disabled={priceLoading}>
                                                                            {priceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 px-1.5 text-[9px] text-slate-400 hover:text-primary hover:bg-primary/10 flex items-center gap-1"
                                                        onClick={() => startEditingPrice(order)}
                                                    >
                                                        <Edit2 className="w-2.5 h-2.5" /> Giảm giá
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Cột Nội dung CK */}
                                        <TableCell className="py-1">
                                          {editingMemoId === order.id ? (
                                              <div className="flex items-center gap-1">
                                                  <Input 
                                                      className="h-7 text-[10px] w-32" 
                                                      value={memoValue} 
                                                      onChange={e => setMemoValue(e.target.value)} 
                                                      autoFocus
                                                  />
                                                  <Button size="icon" className="h-6 w-6 bg-emerald-500" onClick={() => handleUpdateMemo(order.id)} disabled={memoLoading}>
                                                      {memoLoading ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Check className="w-3 h-3 text-white" />}
                                                  </Button>
                                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingMemoId(null)}>
                                                      <X className="w-3 h-3" />
                                                  </Button>
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-2 group/memo cursor-pointer" onClick={() => { setEditingMemoId(order.id); setMemoValue(displayMemo); }}>
                                                  <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                      {displayMemo}
                                                  </span>
                                                  <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/memo:opacity-100 transition-opacity" />
                                              </div>
                                          )}
                                        </TableCell>

                                        <TableCell className="text-[11px] py-1">
                                          {editingPaidAmountId === order.id ? (
                                              <div className="flex items-center gap-1">
                                                  <Input 
                                                      type="number"
                                                      className="h-7 text-[10px] w-24 font-bold text-emerald-600" 
                                                      value={paidAmountValue} 
                                                      onChange={e => setPaidAmountValue(e.target.value === '' ? '' : Number(e.target.value))} 
                                                      autoFocus
                                                  />
                                                  <Button size="icon" className="h-6 w-6 bg-emerald-500" onClick={() => handleUpdatePaidAmount(order.id)} disabled={paidAmountLoading}>
                                                      {paidAmountLoading ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Check className="w-3 h-3 text-white" />}
                                                  </Button>
                                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingPaidAmountId(null)}>
                                                      <X className="w-3 h-3" />
                                                  </Button>
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-2 group/paid cursor-pointer" onClick={() => { setEditingPaidAmountId(order.id); setPaidAmountValue(order.paidAmount); }}>
                                                  <span className="text-[11px] text-emerald-600 font-bold border-b border-dashed border-transparent group-hover/paid:border-emerald-300">
                                                      {formatCurrency(order.paidAmount)}
                                                  </span>
                                                  <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/paid:opacity-100 transition-opacity" />
                                              </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="py-1">
                                          {order.status === 'PAID' ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[9px] h-4">Đủ</Badge>
                                          ) : order.status === 'PARTIALLY_PAID' ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[9px] h-4">Một phần</Badge>
                                          ) : (
                                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-[9px] h-4">Chờ</Badge>
                                          )}
                                        </TableCell>
                                        
                                        <TableCell className="py-1">
                                          <div 
                                            className="flex items-center justify-start"
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className={cn(
                                                "h-7 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                                                order.invoiceIssued 
                                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" 
                                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-600"
                                              )}
                                              onClick={() => handleToggleInvoice(order.id, order.invoiceIssued)}
                                            >
                                              {order.invoiceIssued ? (
                                                <>
                                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                  <span>Đã xuất HĐ</span>
                                                </>
                                              ) : (
                                                <>
                                                  <FileX className="w-3 h-3 text-slate-400" />
                                                  <span>Chưa xuất</span>
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </TableCell>
                                        
                                        <TableCell className="text-right py-1 flex justify-end gap-1">
                                          {order.status !== 'PAID' && order.paidAmount === 0 && (
                                              <Button 
                                                  size="sm" 
                                                  variant="ghost" 
                                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                  onClick={() => handleDeleteOrder(order.id)}
                                                  title="Gỡ khóa học"
                                              >
                                                  <Trash2 className="w-3 h-3" />
                                              </Button>
                                          )}
                                          {order.status !== 'PAID' ? (
                                            <Button size="sm" variant="outline" className="h-7 text-[10px] bg-primary/5 border-primary/20 text-primary hover:bg-primary" onClick={() => { setActiveQr({ ...order, memo: displayMemo }); setQrModalOpen(true); }}>
                                              <QrCode className="w-3 h-3 mr-1" /> Sinh mã QR
                                            </Button>
                                          ) : (
                                            <div className="flex justify-end text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow><TableCell colSpan={7} className="text-center py-4 text-[11px] text-slate-400 italic">Chưa có khóa học nào được gán.</TableCell></TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      <OrderCreateDialog 
        open={orderOpen}
        onOpenChange={(open) => { setOrderOpen(open); if(!open) fetchCustomers(searchTerm); }}
        customer={selectedCustomer}
      />

      {/* Modal nhanh hiển thị QR */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Mã QR Thanh toán nhanh</DialogTitle>
            <DialogDescription>Quét mã để ghi nhận thanh toán cho đơn hàng.</DialogDescription>
          </DialogHeader>
          {activeQr && (() => {
            const bankId = 'MB'; 
            const accountNo = '094989498'; 
            const accountName = 'ssss AI';
            const amount = activeQr.finalPrice - activeQr.paidAmount;
            const memo = activeQr.memo || `${selectedCustomer?.code || 'KH'} ${activeQr.items[0]?.course?.code || 'UGC'} ${selectedCustomer?.phone || ''}`;
            
            const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

            const handleCopyImage = async () => {
                try {
                    toast.loading('Đang sao chép ảnh...');
                    const response = await fetch(qrImageUrl);
                    const blob = await response.blob();
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ]);
                    toast.dismiss();
                    toast.success('Đã sao chép ảnh QR!');
                } catch (err) {
                    toast.dismiss();
                    toast.error('Trình duyệt chặn sao chép tự động. Hãy nhấn chuột phải vào ảnh > Sao chép ảnh.');
                }
            };

            return (
              <div className="flex flex-col items-center py-6 space-y-4">
                 <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100 group relative">
                    <img src={qrImageUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleCopyImage}
                    >
                        <FileText className="w-4 h-4" />
                    </Button>
                 </div>
                 <div className="bg-slate-50 w-full p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Nội dung CK:</span>
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{memo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Số tiền QR:</span>
                      <span className="font-bold text-primary">{formatCurrency(amount)}</span>
                    </div>
                 </div>
                 
                 <Button className="w-full h-11 bg-primary hover:bg-primary/90 font-bold" onClick={handleCopyImage}>
                    <QrCode className="w-4 h-4 mr-2" /> Sao chép ảnh QR
                 </Button>
              </div>
            );
          })()}
          <Button variant="ghost" onClick={() => setQrModalOpen(false)} className="w-full mt-2">Đóng</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
