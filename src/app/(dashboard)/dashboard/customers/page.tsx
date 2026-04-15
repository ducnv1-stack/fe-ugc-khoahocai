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
  Calendar,
  RotateCcw,
  Trash,
  Clock,
  UserX,
  FileX,
  Trash2,
  Copy,
  Monitor,
  MapPin,
  MoreVertical,
  ChevronDownCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Customer, CustomerFormDialog } from './customer-form-dialog';
import { OrderCreateDialog } from './order-create-dialog';
import { ScheduleAssignDialog } from './schedule-assign-dialog';
import { useSocket } from '@/hooks/use-socket';
import { useConfirm } from '@/provider/confirm-provider';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankSettings, setBankSettings] = useState<{ id: string; accountNo: string; accountName: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'customers' | 'leads' | 'trash'>('customers');

  const [orderOpen, setOrderOpen] = useState(false);
  const [scheduleAssignOpen, setScheduleAssignOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState({ active: 0, leads: 0, trash: 0 });
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
      let url = '/customers';
      if (activeTab === 'trash') {
        url = '/customers/trash';
      }
      if (search) {
        url += `${url.includes('?') ? '&' : '?'}search=${search}`;
      }
      const { data } = await api.get(url);
      setCustomers(data);
      
      // Update counts based on the mode - This is a quick fix. 
      // Ideally, the backend should return these counts.
      if (activeTab === 'trash') {
        setCounts(prev => ({ ...prev, trash: data.length }));
      } else {
        const leads = data.filter((c: any) => c.isLead).length;
        const regulars = data.filter((c: any) => !c.isLead).length;
        setCounts(prev => ({ ...prev, active: regulars, leads: leads }));
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts independently to keep headers accurate
  const fetchCounts = async () => {
    try {
      const [{ data: activeData }, { data: trashData }] = await Promise.all([
        api.get('/customers'),
        api.get('/customers/trash')
      ]);
      const leads = activeData.filter((c: any) => c.isLead).length;
      const regulars = activeData.filter((c: any) => !c.isLead).length;
      setCounts({ active: regulars, leads: leads, trash: trashData.length });
    } catch (error) {}
  };

  useEffect(() => {
    fetchCounts();
  },[]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  // Load bank settings once
  useEffect(() => {
    api.get('/payments/settings').then(res => {
      if (res.data?.bankInfo) setBankSettings(res.data.bankInfo);
    }).catch(() => { });
  }, []);

  // Listen for realtime events
  useSocket((event, data) => {
    if (event === 'payment.received') {
      fetchCustomers(searchTerm);
      fetchCounts();
      toast.success(`Đã nhận thanh toán ${new Intl.NumberFormat('vi-VN').format(data.amount)}đ từ ${data.customerName}`, {
        description: 'Dữ liệu đã được cập nhật tự động.',
        duration: 5000,
      });
    }

    if (event === 'customer.created') {
      fetchCustomers(searchTerm);
      fetchCounts();
      toast.info(`Có khách hàng mới: ${data.name}`, {
        description: 'Danh sách đã được làm mới.',
        icon: <UserPlus className="w-4 h-4 text-blue-500" />
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
      fetchCounts();
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
      fetchCounts();
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

  const handleDeleteLeadCustomer = async (customerId: string, customerName: string) => {
    const isConfirmed = await confirm({
      title: `Xóa khách tạm: ${customerName}`,
      description: 'Khách này chưa thanh toán. Hành động này sẽ xóa tạm thời và đưa vào thùng rác.',
      confirmText: 'Đưa vào thùng rác',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/customers/${customerId}`);
      toast.success('Đã đưa khách hàng vào thùng rác');
      fetchCustomers(searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa khách hàng');
    }
  };

  const handleSoftDeleteCustomer = async (customerId: string, customerName: string) => {
    const isConfirmed = await confirm({
      title: `Xác nhận xóa: ${customerName}`,
      description: 'Khách hàng này sẽ được đưa vào thùng rác và có thể khôi phục sau này.',
      confirmText: 'Xóa tạm thời',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/customers/${customerId}`);
      toast.success('Đã đưa khách hàng vào thùng rác');
      fetchCustomers(searchTerm);
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa khách hàng');
    }
  };

  const handleRestoreCustomer = async (customerId: string) => {
    try {
      await api.patch(`/customers/${customerId}/restore`);
      toast.success('Đã khôi phục khách hàng thành công');
      fetchCustomers(searchTerm);
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi khôi phục');
    }
  };

  const handlePermanentDeleteCustomer = async (customerId: string, customerName: string) => {
    const isConfirmed = await confirm({
      title: `XÓA VĨNH VIỄN: ${customerName}`,
      description: 'Hành động này KHÔNG THỂ HOÀN TÁC. Dữ liệu khách hàng sẽ bị xóa hoàn toàn khỏi hệ thống.',
      confirmText: 'XÓA VĨNH VIỄN',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/customers/${customerId}/permanent`);
      toast.success('Đã xóa vĩnh viễn khách hàng');
      fetchCustomers(searchTerm);
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa vĩnh viễn. Có thể do ràng buộc dữ liệu.');
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

  const leadCustomers = customers.filter((c: any) => c.isLead);
  const regularCustomers = customers.filter((c: any) => !c.isLead);
  const displayedCustomers = activeTab === 'leads' ? leadCustomers : regularCustomers;

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Hệ thống CRM Khách hàng</h2>
          <p className="text-xs text-muted-foreground mt-1">Quản lý sâu sát hành trình học tập và thanh toán.</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button size="sm" className="h-8 text-xs" onClick={() => { setEditingCustomer(null); setFormOpen(true); }}>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Thêm Khách hàng
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'customers'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <UserCircle className="w-3.5 h-3.5" />
          Học viên
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'customers' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
            }`}>{counts.active}</span>
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'leads'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Khách tạm (Chờ thanh toán)
          {counts.leads > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'leads' ? 'bg-orange-100 text-orange-600' : 'bg-orange-200 text-orange-600'
              }`}>{counts.leads}</span>
          )}
        </button>
        {canManage && (
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'trash'
                ? 'bg-rose-100 text-rose-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Trash className="w-3.5 h-3.5" />
            Thùng rác
            {counts.trash > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'trash' ? 'bg-rose-200 text-rose-800' : 'bg-rose-100 text-rose-500'
                }`}>{counts.trash}</span>
            )}
          </button>
        )}
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <Input
          placeholder="Tìm Tên, SĐT, Mã KH..."
          className="pl-8 h-8 text-[11px] bg-white shadow-sm border-slate-200 w-full md:max-w-md rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent h-8">
              <TableHead className="w-10"></TableHead>
              <TableHead className="min-w-[200px] text-[11px] font-bold">Thông tin khách</TableHead>
              <TableHead className="text-[11px] font-bold">Khóa học</TableHead>
              <TableHead className="text-[11px] font-bold">Lịch học</TableHead>
              <TableHead className="text-[11px] font-bold">Trạng thái đơn</TableHead>
              <TableHead className="text-[11px] font-bold">Trình trạng học phí</TableHead>
              <TableHead className="text-[11px] font-bold">Ghi chú</TableHead>
              <TableHead className="text-[11px] font-bold">Nhân viên</TableHead>
              <TableHead className="text-right text-[11px] font-bold">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="h-32 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Đang tải...</TableCell></TableRow>
            ) : displayedCustomers.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-32 text-center text-slate-400 italic">
                {activeTab === 'leads' ? '✅ Không có khách tạm nào — tất cả đã thanh toán!' : 'Không có dữ liệu khách hàng.'}
              </TableCell></TableRow>
            ) : (
              displayedCustomers.map((customer) => {
                const isExpanded = expandedRows.has(customer.id);
                const { totalSpent, totalDue, hasUnpaid, courseCount, paidOrdersCount, pendingOrdersCount, tags } = getCustomerInsights(customer);

                return (
                  <React.Fragment key={customer.id}>
                    <TableRow className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50 border-b-0' : ''}`} onClick={() => toggleRow(customer.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tags.includes('VIP') ? 'bg-amber-100 text-amber-600' : customer.isLead ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'}`}>
                            {customer.isLead ? <Clock className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-[11px] text-slate-900 leading-none">{customer.name}</p>
                              <p className="text-[9px] text-slate-500 flex items-center gap-0.5 ml-1"><Phone className="w-2.5 h-2.5" /> {customer.phone}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge variant="outline" className="text-[8px] font-mono py-0 h-3 bg-slate-50 border-slate-200 text-slate-500 leading-none px-1">
                                {customer.code || 'KH---'}
                              </Badge>
                              {customer.isLead && (
                                <Badge className="text-[7px] px-1 py-0 h-3 bg-orange-100 text-orange-600 border border-orange-200 font-bold uppercase hover:bg-orange-100 leading-none">
                                  Khách tạm
                                </Badge>
                              )}
                              {tags.map(tag => (
                                <Badge key={tag} className={`text-[7px] px-1 py-0 h-3 font-normal uppercase leading-none ${tag === 'VIP' ? 'bg-amber-500 hover:bg-amber-600' : tag === 'Mới' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-700 border-none'}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="font-bold bg-blue-50 text-blue-700 border-blue-100 text-[9px] px-1 h-4 py-0">{courseCount} Khóa</Badge>
                          <div className="flex -space-x-1 overflow-hidden">
                            {customer.orders?.flatMap((o: any) => o.items).slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} title={item.course.name} className="w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[7px] font-bold text-slate-600">
                                {item.course.code.substring(0, 2)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {customer.schedules?.length > 0 ? (
                            customer.schedules.map((item: any, idx: number) => {
                              const s = item.schedule;
                              if (!s) return null;
                              
                              const now = new Date();
                              const start = new Date(s.startTime);
                              const end = new Date(s.endTime);
                              
                              let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
                              if (now >= start && now <= end) status = 'ongoing';
                              else if (now > end) status = 'completed';

                              const dateStr = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                              const timeStr = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                              const fullDateStr = start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
                              const isAttended = item.isAttended;
                              
                              const statusStyles = {
                                upcoming: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                                ongoing: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                                completed: 'bg-slate-50 text-slate-400 border-slate-100'
                              };

                              return (
                                <Tooltip key={idx}>
                                <TooltipTrigger
                                  render={
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-[9px] px-1.5 py-0 h-4 font-medium border shadow-none flex items-center gap-1 cursor-help max-w-[200px]",
                                        statusStyles[status]
                                      )}
                                    >
                                      {s.isOnline ? <Monitor className="w-2.5 h-2.5" /> : <MapPin className="w-2.5 h-2.5" />}
                                      <span className="shrink-0">{dateStr} ({timeStr}) - </span>
                                      <span className="truncate">{s.course?.code || 'N/A'}</span>
                                      {isAttended && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 ml-0.5" />}
                                    </Badge>
                                  }
                                />
                                  <TooltipContent side="right" className="p-0 border-none bg-slate-900 shadow-2xl overflow-hidden min-w-[240px] flex flex-col items-stretch">
                                      {/* Header */}
                                      <div className="p-3 bg-white/5 border-b border-white/10 w-full">
                                        <div className="flex justify-between items-start mb-1">
                                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest opacity-70">Chi tiết lịch học</h4>
                                          {isAttended ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] h-3.5 px-1.5 gap-1">
                                              <CheckCircle2 className="w-2 h-2" /> Đã điểm danh
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-slate-500/20 text-slate-400 border-none text-[8px] h-3.5 px-1.5">
                                              Chưa điểm danh
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-[13px] font-bold leading-tight text-white">{s.course?.name}</p>
                                        <p className="text-[10px] text-white/50 mt-1 font-medium">{fullDateStr}</p>
                                      </div>
                                      
                                      {/* Content body */}
                                      <div className="p-3 space-y-3 w-full">
                                        <div className="flex items-start gap-2.5">
                                          <UserCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                          <div className="flex flex-col">
                                            <span className="text-white/40 text-[9px] uppercase font-bold">Giảng viên</span>
                                            <span className="text-[11px] font-medium text-white">{s.instructor?.name || 'Chưa gán'}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-2.5">
                                          <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                          <div className="flex flex-col">
                                            <span className="text-white/40 text-[9px] uppercase font-bold">Thời gian</span>
                                            <span className="text-[11px] font-medium text-white">{timeStr}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-2.5">
                                          {s.isOnline ? <Monitor className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> : <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                                          <div className="flex flex-col">
                                            <span className="text-white/40 text-[9px] uppercase font-bold">{s.isOnline ? 'Lớp Online' : 'Phòng học'}</span>
                                            {s.isOnline ? (
                                              s.meetingUrl ? (
                                                <div className="flex flex-col gap-1.5 pt-1">
                                                  <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1 px-3 rounded shadow-sm transition-colors no-underline" onClick={e => e.stopPropagation()}>
                                                    Vào học ngay
                                                  </a>
                                                  <span className="text-[9px] text-white/30 truncate max-w-[180px]">{s.meetingUrl}</span>
                                                </div>
                                              ) : (
                                                <span className="text-white/30 text-[11px] italic">Chưa có link</span>
                                              )
                                            ) : (
                                              <span className="text-[11px] font-medium text-white">{s.room || 'TBA'}</span>
                                            )}
                                          </div>
                                        </div>

                                        {s.notes && (
                                          <div className="flex items-start gap-2.5 pt-1 border-t border-white/5 mt-1">
                                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <div className="flex flex-col">
                                              <span className="text-white/40 text-[9px] uppercase font-bold">Ghi chú buổi học</span>
                                              <span className="text-[10px] text-white/70 italic leading-snug">{s.notes}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Status Footer */}
                                      <div className="px-3 py-2 bg-black/20 border-t border-white/5 flex items-center justify-between w-full">
                                         <span className="text-white/30 text-[9px] uppercase font-bold">Trạng thái</span>
                                         <Badge variant="outline" className={cn(
                                           "text-[9px] h-4.5 px-2 border-none font-bold shadow-none",
                                           status === 'ongoing' ? "bg-emerald-500/20 text-emerald-400" : 
                                           status === 'upcoming' ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-500/20 text-slate-400"
                                         )}>
                                           {status === 'ongoing' ? 'Đang học' : status === 'upcoming' ? 'Sắp học' : 'Kết thúc'}
                                         </Badge>
                                      </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Chưa gán</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {paidOrdersCount > 0 && <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> {paidOrdersCount} Đã xong</span>}
                          {pendingOrdersCount > 0 && <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> {pendingOrdersCount} Chờ xử lý</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0 w-full max-w-[120px] leading-none">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-[9px] text-slate-400">Tổng</span>
                            <span className="text-[10px] font-medium">{formatCurrency(totalDue)}</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5 border-b border-slate-100 mb-0.5">
                            <span className="text-[9px] text-slate-400">Đã đóng</span>
                            <span className="text-[10px] font-bold text-emerald-600">{formatCurrency(totalSpent)}</span>
                          </div>
                          {totalDue - totalSpent > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-rose-500">Còn nợ</span>
                              <span className="text-[10px] font-bold text-rose-600">{formatCurrency(totalDue - totalSpent)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px]">
                          {customer.notes ? (
                            <TooltipProvider delay={300}>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <p className="text-[10px] text-slate-500 line-clamp-6 leading-snug cursor-help italic whitespace-pre-line">
                                      {customer.notes}
                                    </p>
                                  }
                                />
                                <TooltipContent className="max-w-xs bg-slate-900 border-none text-white text-[11px] p-2 shadow-2xl">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú khách hàng</span>
                                    <span>{customer.notes}</span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-[10px] text-slate-300">---</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[80px]">{customer.assignedSale?.name || '---'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'trash' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                                onClick={(e) => { e.stopPropagation(); handleRestoreCustomer(customer.id); }}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Khôi phục
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] text-rose-600 border-rose-100 hover:bg-rose-50"
                                onClick={(e) => { e.stopPropagation(); handlePermanentDeleteCustomer(customer.id, customer.name); }}
                              >
                                <Trash className="w-3 h-3 mr-1" /> Xóa vĩnh viễn
                              </Button>
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-48 text-[11px]">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-[10px] font-bold text-slate-500">Thao tác</DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setOrderOpen(true); }}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-2" /> Gán khóa học
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                                  onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setScheduleAssignOpen(true); }}
                                >
                                  <Calendar className="w-3.5 h-3.5 mr-2" /> Gán lịch học
                                </DropdownMenuItem>
                                
                                {customer.isLead && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteLeadCustomer(customer.id, customer.name); }}
                                    >
                                      <Trash className="w-3.5 h-3.5 mr-2" /> Xóa tạm
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {!customer.isLead && canManage && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                                      onClick={(e) => { e.stopPropagation(); handleSoftDeleteCustomer(customer.id, customer.name); }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa khách hàng
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableCell colSpan={9} className="py-2 pl-9 pr-4">
                          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-2 px-3 bg-slate-50/50 border-b flex justify-between items-center mt-0">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lịch sử đơn hàng & Thanh toán</h4>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => { setEditingCustomer(customer); setFormOpen(true); }}>
                                <FileText className="w-3 h-3 mr-1" /> Chỉnh sửa hồ sơ
                              </Button>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-transparent hover:bg-transparent border-none">
                                  <TableHead className="py-1 text-[10px]">Ngày tạo</TableHead>
                                  <TableHead className="py-1 text-[10px]">Khóa học</TableHead>
                                  <TableHead className="py-1 text-[10px]">Giá trị đơn</TableHead>
                                  <TableHead className="py-1 text-[10px]">Nội dung CK</TableHead>
                                  <TableHead className="py-1 text-[10px]">Đã thanh toán</TableHead>
                                  <TableHead className="py-1 text-[10px]">Trạng thái</TableHead>
                                  <TableHead className="py-1 text-[10px]">Hóa đơn</TableHead>
                                  <TableHead className="py-1 text-[10px] text-right">QR / Thu tiền</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.orders && customer.orders.length > 0 ? (
                                  customer.orders.map((order: any) => {
                                    const defaultMemo = `${order.items[0]?.course?.code || 'UGC'} ${customer.phone}`.trim();
                                    const displayMemo = order.memo || defaultMemo;

                                    return (
                                      <TableRow key={order.id} className="hover:bg-slate-50 group border-slate-100 last:border-0 h-8">
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
        onOpenChange={(open) => { setOrderOpen(open); if (!open) fetchCustomers(searchTerm); }}
        customer={selectedCustomer}
      />

      <ScheduleAssignDialog
        customer={selectedCustomer}
        open={scheduleAssignOpen}
        onOpenChange={setScheduleAssignOpen}
        onSuccess={() => fetchCustomers(searchTerm)}
      />

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] sm:w-full p-4 sm:p-5 flex flex-col max-h-[96vh] overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">Mã QR Thanh toán nhanh</DialogTitle>
            <DialogDescription className="text-xs">Quét mã để ghi nhận thanh toán.</DialogDescription>
          </DialogHeader>
          {activeQr && (() => {
            const bankId = bankSettings?.id || 'MB';
            const accountNo = bankSettings?.accountNo || '';
            const accountName = bankSettings?.accountName || '';
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
              <div className="flex flex-col flex-1 min-h-0 gap-2 pt-2">
                <div className="flex-1 shrink min-h-[80px] w-full flex items-center justify-center">
                  <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 h-full max-h-[200px] w-full max-w-[200px] flex items-center justify-center relative">
                    <img src={qrImageUrl} alt="QR Code" className="w-full h-full object-contain" />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-0 right-0 h-8 w-8 rounded-full shadow-md bg-white border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/4 -translate-y-1/4 z-10"
                      onClick={handleCopyImage}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 w-full rounded-xl border border-slate-100 shrink-0">
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ngân hàng:</span>
                      <span className="font-semibold text-slate-800 uppercase">{bankId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <div className="flex items-center gap-1 group">
                        <span className="font-semibold text-slate-800">{accountNo}</span>
                        <button onClick={() => { navigator.clipboard.writeText(accountNo); toast.success('Đã sao chép'); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-start text-xs">
                      <span className="text-slate-500 shrink-0">Chủ tài khoản:</span>
                      <span className="font-semibold text-slate-800 uppercase text-right leading-tight max-w-[60%]">{accountName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Khách hàng:</span>
                      <span className="font-semibold text-slate-800 truncate pl-4">{selectedCustomer?.name || '---'}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <span className="text-slate-500 text-xs">Số tiền:</span>
                      <span className="font-bold text-base text-primary">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-slate-500 text-xs pt-1">Nội dung CK:</span>
                      <div className="flex items-center gap-1 group">
                        <span className="font-bold text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded tracking-wide text-xs">{memo}</span>
                        <button onClick={() => { navigator.clipboard.writeText(memo); toast.success('Đã sao chép nội dung'); }} className="text-slate-400 hover:text-slate-600 transition-colors pt-1">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 space-y-1.5 mt-1 w-full">
                  <Button className="w-full h-9 text-xs bg-primary hover:bg-primary/90 font-bold" onClick={handleCopyImage}>
                    <QrCode className="w-4 h-4 mr-2" /> Sao chép ảnh QR
                  </Button>
                </div>
              </div>
            );
          })()}
          <Button variant="ghost" onClick={() => setQrModalOpen(false)} className="w-full h-8 text-xs shrink-0">Đóng</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
