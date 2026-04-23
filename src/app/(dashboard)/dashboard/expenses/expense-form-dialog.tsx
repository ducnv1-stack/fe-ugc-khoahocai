'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, PlusCircle, WalletCards } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface ExpenseRecord {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  subCategory?: string | null;
  costCenter: string;
  paymentMethod: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  nature: 'FIXED' | 'VARIABLE';
  vendorName?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  date: string;
  createdBy?: { id: string; name: string } | null;
  approvedBy?: { id: string; name: string } | null;
}

const CATEGORY_OPTIONS = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OPERATIONS', label: 'Vận hành' },
  { value: 'HR', label: 'Nhân sự' },
  { value: 'FACILITIES', label: 'Cơ sở vật chất' },
  { value: 'SOFTWARE', label: 'Phần mềm & dịch vụ' },
  { value: 'TEACHING', label: 'Giảng dạy' },
  { value: 'OTHER', label: 'Khác' },
];

const COST_CENTER_OPTIONS = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES', label: 'Sales' },
  { value: 'OPERATIONS', label: 'Vận hành' },
  { value: 'TEACHING', label: 'Đào tạo' },
  { value: 'GENERAL', label: 'Toàn hệ thống' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'CARD', label: 'Thẻ' },
  { value: 'EWALLET', label: 'Ví điện tử' },
  { value: 'OTHER', label: 'Khác' },
];

const NATURE_OPTIONS = [
  { value: 'VARIABLE', label: 'Biến đổi' },
  { value: 'FIXED', label: 'Cố định' },
];

type ExpenseFormState = {
  name: string;
  amount: string;
  category: string;
  type: string;
  subCategory: string;
  costCenter: string;
  paymentMethod: string;
  nature: string;
  vendorName: string;
  referenceType: string;
  referenceId: string;
  date: string;
  notes: string;
};

const getDefaultFormState = (): ExpenseFormState => ({
  name: '',
  amount: '',
  category: 'OPERATIONS',
  type: '',
  subCategory: '',
  costCenter: 'OPERATIONS',
  paymentMethod: 'BANK_TRANSFER',
  nature: 'VARIABLE',
  vendorName: '',
  referenceType: '',
  referenceId: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
});

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseRecord | null;
  onSaved: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSaved,
}: ExpenseFormDialogProps) {
  const [form, setForm] = useState<ExpenseFormState>(getDefaultFormState());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!expense) {
      setForm(getDefaultFormState());
      return;
    }

    setForm({
      name: expense.name || '',
      amount: expense.amount ? String(expense.amount) : '',
      category: expense.category || 'OPERATIONS',
      type: expense.type || '',
      subCategory: expense.subCategory || '',
      costCenter: expense.costCenter || 'OPERATIONS',
      paymentMethod: expense.paymentMethod || 'BANK_TRANSFER',
      nature: expense.nature || 'VARIABLE',
      vendorName: expense.vendorName || '',
      referenceType: expense.referenceType || '',
      referenceId: expense.referenceId || '',
      date: expense.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: expense.notes || '',
    });
  }, [open, expense]);

  const handleSubmit = async () => {
    const amount = Number(form.amount);
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên khoản chi');
      return;
    }
    if (!form.type.trim()) {
      toast.error('Vui lòng nhập loại chi phí');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount,
        category: form.category,
        type: form.type.trim(),
        subCategory: form.subCategory.trim() || form.type.trim(),
        costCenter: form.costCenter,
        paymentMethod: form.paymentMethod,
        nature: form.nature,
        vendorName: form.vendorName.trim() || undefined,
        referenceType: form.referenceType.trim() || undefined,
        referenceId: form.referenceId.trim() || undefined,
        date: form.date,
        notes: form.notes.trim() || undefined,
      };

      if (expense?.id) {
        await api.patch(`/expenses/${expense.id}`, payload);
        toast.success('Đã cập nhật khoản chi');
      } else {
        await api.post('/expenses', payload);
        toast.success('Đã tạo khoản chi mới');
      }

      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu khoản chi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-rose-500" />
            {expense ? 'Cập nhật chi phí' : 'Thêm khoản chi mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold">Tên khoản chi</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ví dụ: Chạy Facebook Ads ngày 23-04"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Số tiền</Label>
            <Input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ngày chi</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Nhóm chi phí</Label>
            <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value || 'OPERATIONS' }))}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Chọn nhóm chi phí">
                  {CATEGORY_OPTIONS.find((option) => option.value === form.category)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Loại chi phí</Label>
            <Input
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="Ví dụ: Facebook Ads, Bánh kẹo, Zoom"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Bộ phận chịu phí</Label>
            <Select value={form.costCenter} onValueChange={(value) => setForm((prev) => ({ ...prev, costCenter: value || 'OPERATIONS' }))}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Chọn bộ phận">
                  {COST_CENTER_OPTIONS.find((option) => option.value === form.costCenter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COST_CENTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Phương thức thanh toán</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(value) => setForm((prev) => ({ ...prev, paymentMethod: value || 'BANK_TRANSFER' }))}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Chọn phương thức">
                  {PAYMENT_METHOD_OPTIONS.find((option) => option.value === form.paymentMethod)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Tính chất chi phí</Label>
            <Select value={form.nature} onValueChange={(value) => setForm((prev) => ({ ...prev, nature: value || 'VARIABLE' }))}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Chọn tính chất">
                  {NATURE_OPTIONS.find((option) => option.value === form.nature)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {NATURE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Nhà cung cấp / người nhận</Label>
            <Input
              value={form.vendorName}
              onChange={(e) => setForm((prev) => ({ ...prev, vendorName: e.target.value }))}
              placeholder="Ví dụ: Meta, tiệm bánh, giảng viên A"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Mã tham chiếu</Label>
            <Input
              value={form.referenceId}
              onChange={(e) => setForm((prev) => ({ ...prev, referenceId: e.target.value }))}
              placeholder="Mã chiến dịch, mã khóa học..."
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Loại tham chiếu</Label>
            <Input
              value={form.referenceType}
              onChange={(e) => setForm((prev) => ({ ...prev, referenceType: e.target.value }))}
              placeholder="campaign, course, staff..."
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold">Ghi chú</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Thông tin bổ sung để đối soát sau này"
              className="min-h-[100px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Đóng
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {expense ? 'Lưu thay đổi' : 'Tạo khoản chi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
