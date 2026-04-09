import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
  tags: string[];
  assignedSaleId?: string;
  assignedSale?: { id: string, name: string };
}

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any | null;
  onSave: (data: Partial<Customer>) => Promise<void>;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSave }: CustomerFormDialogProps) {
  const { user } = useAuth();
  
  // Defensive role check
  const isAdmin = user?.role === 'ADMIN' || (typeof user?.role === 'object' && (user.role as any).name === 'ADMIN');
  
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    notes: '',
    assignedSaleId: '',
  });

  useEffect(() => {
    if (open && isAdmin) {
      api.get('/users')
        .then(res => {
          // Filter to show only relevant staff if needed, or all users
          setStaffList(res.data);
        })
        .catch(err => {
          console.error('Failed to load staff list', err);
        });
    }
  }, [open, isAdmin]);

  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          source: customer.source || '',
          notes: customer.notes || '',
          assignedSaleId: customer.assignedSaleId || '',
        });
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          source: '',
          notes: '',
          // Default to current user for new customers
          assignedSaleId: user?.id || '',
        });
      }
    }
  }, [open, customer, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') cleanData[key] = value;
      });
      
      await onSave(cleanData);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? 'Cập nhật Khách hàng' : 'Thêm Khách hàng mới'}</DialogTitle>
          <DialogDescription>
            Nhập thông tin cơ bản để lưu trữ vào hệ thống CRM.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cust-name">Họ và tên</Label>
            <Input 
              id="cust-name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="VD: Nguyễn Văn A"
              required 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cust-phone">Số điện thoại</Label>
            <Input 
              id="cust-phone" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="0912xxxxxx"
              required 
            />
          </div>
          {/* Nhân viên phụ trách - Hiện cho tất cả nhưng chỉ Admin mới đổi được */}
          <div className="grid gap-2 border-y border-slate-50 py-3 my-1">
            <Label htmlFor="cust-assigned" className="text-primary font-bold">Nhân viên phụ trách</Label>
            {isAdmin ? (
              <select
                id="cust-assigned"
                value={formData.assignedSaleId}
                onChange={e => setFormData({...formData, assignedSaleId: e.target.value})}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <option value="">-- Tự động gán (Theo người tạo) --</option>
                {user && !staffList.find(s => s.id === user.id) && (
                  <option value={user.id}>Tôi ({user.name})</option>
                )}
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id === user?.id ? `Tôi (${s.name})` : s.name} — {s.role?.name || 'Nhân viên'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-9 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-medium">
                {customer?.assignedSale?.name || user?.name || 'Đang tự động gán...'}
              </div>
            )}
            <p className="text-[10px] text-slate-400 italic">
              {isAdmin ? 'Vì bạn là Admin, bạn có thể chọn nhân viên sẽ quản lý khách hàng này.' : 'Trường này được hệ thống tự động gán theo người tạo.'}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cust-email">Email (Không bắt buộc)</Label>
            <Input 
              id="cust-email" 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              placeholder="khachhang@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cust-source">Nguồn (Source)</Label>
            <Input 
              id="cust-source" 
              value={formData.source} 
              onChange={e => setFormData({...formData, source: e.target.value})} 
              placeholder="Facebook, Google, TikTok..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cust-notes">Ghi chú</Label>
            <Input 
              id="cust-notes" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              placeholder="Yêu cầu đặc biệt..."
            />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu khách hàng'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
