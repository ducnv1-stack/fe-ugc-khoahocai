'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  ReceiptText,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuth } from '@/provider/auth-provider';
import { useConfirm } from '@/provider/confirm-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ExpenseFormDialog, ExpenseRecord } from './expense-form-dialog';

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Tất cả nhóm' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OPERATIONS', label: 'Vận hành' },
  { value: 'HR', label: 'Nhân sự' },
  { value: 'FACILITIES', label: 'Cơ sở vật chất' },
  { value: 'SOFTWARE', label: 'Phần mềm' },
  { value: 'TEACHING', label: 'Giảng dạy' },
  { value: 'OTHER', label: 'Khác' },
];

const COST_CENTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả bộ phận' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES', label: 'Sales' },
  { value: 'OPERATIONS', label: 'Vận hành' },
  { value: 'TEACHING', label: 'Đào tạo' },
  { value: 'GENERAL', label: 'Toàn hệ thống' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-100 text-rose-700 hover:bg-rose-100' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();

  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stats, setStats] = useState<{ total: number; count: number; byCategory: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [costCenter, setCostCenter] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const canCreate = hasPermission('expenses.create') || hasPermission('expenses.manage');
  const canEdit = hasPermission('expenses.update') || hasPermission('expenses.manage');
  const canDelete = hasPermission('expenses.delete') || hasPermission('expenses.manage');
  const canConfirm = hasPermission('expenses.confirm') || hasPermission('expenses.manage');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '12');
    if (search.trim()) params.set('search', search.trim());
    if (category !== 'ALL') params.set('category', category);
    if (costCenter !== 'ALL') params.set('costCenter', costCenter);
    if (status !== 'ALL') params.set('status', status);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.toString();
  }, [page, search, category, costCenter, status, startDate, endDate]);

  const statsQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.toString();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get(`/expenses?${queryString}`),
        api.get(`/expenses/stats${statsQueryString ? `?${statsQueryString}` : ''}`),
      ]);

      setExpenses(listRes.data.items || []);
      setPagination({
        total: listRes.data.total || 0,
        totalPages: listRes.data.totalPages || 1,
      });
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải dữ liệu chi phí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [queryString, statsQueryString]);

  useEffect(() => {
    setPage(1);
  }, [search, category, costCenter, status, startDate, endDate]);

  const topCategories = useMemo(() => {
    const entries = Object.entries(stats?.byCategory || {});
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [stats]);

  const handleDelete = async (expense: ExpenseRecord) => {
    const approved = await confirm({
      title: `Xóa khoản chi: ${expense.name}`,
      description: 'Thao tác này sẽ xóa hẳn khoản chi khỏi hệ thống.',
      confirmText: 'Xóa khoản chi',
      variant: 'destructive',
    });

    if (!approved) return;

    try {
      await api.delete(`/expenses/${expense.id}`);
      toast.success('Đã xóa khoản chi');
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa khoản chi');
    }
  };

  const handleConfirmExpense = async (expense: ExpenseRecord) => {
    try {
      await api.patch(`/expenses/${expense.id}/confirm`);
      toast.success('Đã xác nhận khoản chi');
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận khoản chi');
    }
  };

  const handleCancelExpense = async (expense: ExpenseRecord) => {
    const approved = await confirm({
      title: `Hủy khoản chi: ${expense.name}`,
      description: 'Khoản chi bị hủy sẽ không được tính vào báo cáo lãi lỗ.',
      confirmText: 'Hủy khoản chi',
      variant: 'default',
    });

    if (!approved) return;

    try {
      await api.patch(`/expenses/${expense.id}/cancel`);
      toast.success('Đã hủy khoản chi');
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy khoản chi');
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <ReceiptText className="h-5 w-5 text-rose-500" />
            Quản lý chi phí
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Theo dõi mọi khoản phát sinh để tính dòng tiền và lãi lỗ chính xác.
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingExpense(null);
              setDialogOpen(true);
            }}
          >
            <BadgeDollarSign className="h-4 w-4" />
            Thêm khoản chi
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-rose-100 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tổng chi phí đã xác nhận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(stats?.total || 0)}</div>
            <p className="mt-1 text-[11px] text-slate-500">Chỉ tính các khoản đã xác nhận</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Số khoản chi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.count || 0}</div>
            <p className="mt-1 text-[11px] text-slate-500">Trong phạm vi thời gian đang lọc</p>
          </CardContent>
        </Card>

        <Card className="bg-white md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Nhóm chi phí lớn nhất</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-3">
            {topCategories.length > 0 ? topCategories.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500">{CATEGORY_OPTIONS.find((item) => item.value === key)?.label || key}</p>
                <p className="mt-1 text-base font-bold text-slate-900">{formatCurrency(value)}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Chưa có dữ liệu chi phí đã xác nhận.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, loại chi phí, nhà cung cấp..."
                className="h-9 pl-9 text-sm"
              />
            </div>

            <Select value={category} onValueChange={(value) => setCategory(value || 'ALL')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Nhóm chi phí">
                  {CATEGORY_OPTIONS.find((item) => item.value === category)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={costCenter} onValueChange={(value) => setCostCenter(value || 'ALL')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Bộ phận">
                  {COST_CENTER_OPTIONS.find((item) => item.value === costCenter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COST_CENTER_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => setStatus(value || 'ALL')}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Trạng thái">
                  {STATUS_OPTIONS.find((item) => item.value === status)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent">
              <TableHead>Ngày chi</TableHead>
              <TableHead>Khoản chi</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Bộ phận</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                  <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                  Đang tải dữ liệu chi phí...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                  <FileText className="mx-auto mb-3 h-10 w-10 opacity-25" />
                  Chưa có khoản chi nào khớp bộ lọc hiện tại.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-[12px] text-slate-500">
                    {new Date(expense.date).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{expense.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>{expense.type}</span>
                        {expense.vendorName && <span>• {expense.vendorName}</span>}
                        {expense.referenceId && <span>• {expense.referenceId}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {CATEGORY_OPTIONS.find((item) => item.value === expense.category)?.label || expense.category}
                      </Badge>
                      <p className="text-[11px] text-slate-500">{expense.subCategory || expense.type}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px] text-slate-600">
                    {COST_CENTER_OPTIONS.find((item) => item.value === expense.costCenter)?.label || expense.costCenter}
                  </TableCell>
                  <TableCell className="text-[12px] text-slate-600">
                    <div className="space-y-1">
                      <p>{expense.createdBy?.name || '---'}</p>
                      {expense.approvedBy?.name && (
                        <p className="text-[11px] text-emerald-600">Duyệt: {expense.approvedBy.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold text-rose-600">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn('text-[11px] font-semibold', STATUS_META[expense.status]?.className)}>
                      {STATUS_META[expense.status]?.label || expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && expense.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingExpense(expense);
                            setDialogOpen(true);
                          }}
                          title="Sửa khoản chi"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {canConfirm && expense.status !== 'CONFIRMED' && expense.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => handleConfirmExpense(expense)}
                          title="Xác nhận khoản chi"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      {canConfirm && expense.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => handleCancelExpense(expense)}
                          title="Hủy khoản chi"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDelete(expense)}
                          title="Xóa khoản chi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-[12px] text-slate-500">
            Tổng <span className="font-bold text-slate-800">{pagination.total}</span> khoản chi
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
            >
              Trang trước
            </Button>
            <div className="rounded-lg border bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Trang {page}/{pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={page >= pagination.totalPages || loading}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-indigo-100 bg-indigo-50/40">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
          <div>
            Chỉ các khoản chi ở trạng thái <strong>Đã xác nhận</strong> mới được cộng vào thống kê chi phí và lợi
            nhuận. Khoản chi ở trạng thái <strong>Nháp</strong> chỉ để nhập tạm, còn <strong>Đã hủy</strong> sẽ bị loại
            khỏi báo cáo.
          </div>
        </CardContent>
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        onSaved={fetchExpenses}
      />
    </div>
  );
}
