import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/provider/auth-provider';
import { Copy, Check, QrCode, UserPlus, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cccd?: string;
  address?: string;
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
  const isAdmin = user?.role === 'ADMIN' || (typeof user?.role === 'object' && (user.role as any).name === 'ADMIN');

  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cccd: '',
    address: '',
    source: '',
    notes: '',
    assignedSaleId: '',
  });

  // Quy trình QR 10 giây
  const [isQuickQR, setIsQuickQR] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [showQRResult, setShowQRResult] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [bankSettings, setBankSettings] = useState<{ id: string; accountNo: string; accountName: string } | null>(null);

  const paymentCardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Load staff if admin
      if (isAdmin) {
        api.get('/users').then(res => setStaffList(res.data)).catch(console.error);
      }
      // Load courses for quick QR
      api.get('/courses').then(res => {
        const activeCourses = res.data.filter((c: any) => c.status === 'ACTIVE');
        setCourses(activeCourses);
        if (activeCourses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(activeCourses[0].id);
        }
      }).catch(console.error);
      // Load bank settings
      api.get('/payments/settings').then(res => {
        if (res.data?.bankInfo) setBankSettings(res.data.bankInfo);
      }).catch(() => { });
    }
  }, [open, isAdmin]);

  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          cccd: customer.cccd || '',
          address: customer.address || '',
          source: customer.source || '',
          notes: customer.notes || '',
          assignedSaleId: customer.assignedSaleId || '',
        });
        setIsQuickQR(false);
      } else {
        setFormData({
          name: '',
          phone: '',
          email: '',
          cccd: '',
          address: '',
          source: '',
          notes: '',
          assignedSaleId: user?.id || '',
        });
        setIsQuickQR(true); // Mặc định bật cho khách mới
      }
    }
  }, [open, customer, user?.id]);

  useEffect(() => {
    if (open && selectedCourseId && isQuickQR) {
      // Load upcoming schedules for selected course
      api.get(`/schedules?courseId=${selectedCourseId}`).then(res => {
        // Filter only upcoming classes with capacity
        const now = new Date();
        const upcoming = res.data.filter((s: any) => 
          new Date(s.startTime) > now && 
          s._count.students < s.maxCapacity
        );
        setScheduleList(upcoming);
      }).catch(console.error);
    }
  }, [open, selectedCourseId, isQuickQR]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isQuickQR && !customer) {
        // Luồng tạo nhanh: Tạo Customer + Order + QR trong 1 nốt nhạc
        const res = await api.post('/orders', {
          customerName: formData.name,
          customerPhone: formData.phone,
          customerCccd: formData.cccd,
          customerAddress: formData.address,
          courseIds: [selectedCourseId],
          discountType: 'FIXED',
          discountValue: Number(discountValue),
          primaryCourseId: selectedCourseId,
          customerNotes: formData.notes,
        });

        setOrderResult(res.data);
        setShowQRResult(true);

        // Auto-assign to schedule if selected
        if (selectedScheduleId && res.data.customer?.id) {
          try {
            await api.post(`/schedules/${selectedScheduleId}/students`, { 
              customerId: res.data.customer.id 
            });
          } catch (err) {
            console.error('Failed to auto-assign student to schedule', err);
          }
        }

        toast.success('Đã tạo khách hàng và mã QR thành công!');
      } else {
        // Luồng lưu khách bình thường
        const cleanData: any = {};
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== '') cleanData[key] = value;
        });
        await onSave(cleanData);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCardImage = async () => {
    if (!paymentCardRef.current) return;
    try {
      toast.loading('Đang chuẩn bị ảnh QR...');
      
      // Safari iOS yêu cầu ClipboardItem nhận vào một Promise để không làm mất "user gesture"
      const blobPromise = (async () => {
        const canvas = await html2canvas(paymentCardRef.current!, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => s.remove());
          }
        });
        return new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/png');
        });
      })();

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blobPromise
        })
      ]);

      toast.dismiss();
      toast.success('Đã sao chép ảnh QR!');
    } catch (err) {
      toast.dismiss();
      toast.error('Không thể sao chép ảnh QR. Hãy kiểm tra quyền truy cập clipboard.');
      console.error(err);
    }
  };

  const handleCopyPaymentText = () => {
    const amount = orderResult?.finalPrice ?? 0;
    const memo = orderResult?.memo ?? '';
    const text = `Ngân hàng: ${bankSettings?.id || 'MB'}
Số tài khoản: ${bankSettings?.accountNo || ''}
Chủ tài khoản: ${bankSettings?.accountName || ''}
Số tiền: ${amount}
Nội dung CK: ${memo}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung văn bản!');
  };

  if (showQRResult) {
    const amount = orderResult?.finalPrice ?? 0;
    const memo = orderResult?.memo ?? '';

    return (
      <Dialog open={showQRResult} onOpenChange={(val) => {
        setShowQRResult(val);
        if (!val) onOpenChange(false);
      }}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] sm:w-full p-4 sm:p-5 flex flex-col max-h-[96vh] overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <QrCode className="w-5 h-5 text-indigo-600" /> Mã QR Thanh toán nhanh
            </DialogTitle>
            <DialogDescription className="text-xs">Quét mã để ghi nhận thanh toán.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 gap-2 pt-2">
            {/* Khung này sẽ được chụp ảnh - Thu gọn kích thước để tránh thanh cuộn */}
            <div ref={paymentCardRef} style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', width: '340px', margin: '0 auto', fontFamily: 'sans-serif' }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0', height: '140px', width: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={orderResult?.qrCode} 
                    alt="QR Code" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Ngân hàng:</span>
                    <span style={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{bankSettings?.id || '---'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Số tài khoản:</span>
                    <span style={{ color: '#1e293b', fontSize: '11px', fontWeight: 'bold' }}>{bankSettings?.accountNo || '---'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Chủ tài khoản:</span>
                    <span style={{ color: '#1e293b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', lineHeight: '1.2', maxWidth: '65%' }}>{bankSettings?.accountName || '---'}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Số tiền:</span>
                    <span style={{ color: '#2563eb', fontSize: '16px', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '2px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', paddingTop: '2px' }}>Nội dung CK:</span>
                    <div style={{ color: '#0f172a', backgroundColor: '#e2e8f0', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.01em', wordBreak: 'break-all', maxWidth: '70%', textAlign: 'right' }}>
                      {memo}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
              <Button className="h-9 text-[11px] font-bold" onClick={handleCopyCardImage}>
                <QrCode className="w-3.5 h-3.5 mr-1.5" /> Sao chép QR
              </Button>
              <Button variant="outline" className="h-9 text-[11px] border-slate-200 font-bold" onClick={handleCopyPaymentText}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Thông tin CK
              </Button>
            </div>
            <Button variant="ghost" className="w-full h-8 text-xs mt-2 shrink-0" onClick={() => { setShowQRResult(false); onOpenChange(false); }}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {customer ? <UserPlus className="w-5 h-5" /> : <QrCode className="w-5 h-5 text-indigo-600" />}
            {customer ? 'Cập nhật Khách hàng' : 'Thêm Khách & Tạo đơn hàng'}
          </DialogTitle>
          <DialogDescription>
            {customer ? 'Chỉnh sửa thông tin khách hàng hiện có.' : 'Tạo nhanh khách hàng và sinh mã QR thanh toán trong 10 giây.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cust-name">Họ và tên</Label>
              <Input
                id="cust-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cust-phone">Số điện thoại</Label>
              <Input
                id="cust-phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912xxxxxx"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cust-cccd">Căn cước công dân <span className="text-[10px] text-slate-400 font-normal italic">(Để xuất HĐ)</span></Label>
              <Input
                id="cust-cccd"
                value={formData.cccd}
                onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                placeholder="0010xxxxxxxx"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cust-address">Địa chỉ <span className="text-[10px] text-slate-400 font-normal italic">(Để xuất HĐ)</span></Label>
              <Input
                id="cust-address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Quận/Huyện, Tỉnh/TP..."
              />
            </div>
          </div>

          {!customer && (
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-indigo-900 font-bold flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Quy trình QR 10 giây
                  </Label>
                  <p className="text-[11px] text-indigo-600 italic">Hệ thống sẽ tự tạo đơn hàng & QR sau khi lưu khách.</p>
                </div>
                <Switch
                  checked={isQuickQR}
                  onCheckedChange={setIsQuickQR}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {isQuickQR && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Chọn khóa học</Label>
                    <select
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="w-full h-9 rounded-md border border-indigo-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({new Intl.NumberFormat('vi-VN').format(c.price)}đ)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Giảm giá trực tiếp (VNĐ)</Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="border-indigo-200"
                    />
                  </div>
                </div>
              )}

              {isQuickQR && scheduleList.length > 0 && (
                <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <Label className="text-xs">Chọn lớp học (không bắt buộc)</Label>
                  <select
                    value={selectedScheduleId}
                    onChange={e => setSelectedScheduleId(e.target.value)}
                    className="w-full h-9 rounded-md border border-indigo-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Để sau --</option>
                    {scheduleList.map(s => {
                      const date = new Date(s.startTime);
                      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
                      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                      const instructorName = s.instructor?.name || 'Chưa gán GV';
                      const remaining = s.maxCapacity - s._count.students;

                      return (
                        <option key={s.id} value={s.id}>
                          {dayName}, {dateStr} - {timeStr} | {instructorName} (Còn {remaining} chỗ)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cust-source">Nguồn (Source)</Label>
              <Input
                id="cust-source"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                placeholder="Facebook, TikTok..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cust-assigned">Nhân viên phụ trách</Label>
              {isAdmin ? (
                <select
                  id="cust-assigned"
                  value={formData.assignedSaleId}
                  onChange={e => setFormData({ ...formData, assignedSaleId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-1 focus:ring-ring outline-none"
                >
                  <option value="">-- Tự động gán --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="h-9 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-600">
                  {user?.name}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cust-notes">Ghi chú & Yêu cầu</Label>
            <Textarea
              id="cust-notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="VD: Khách cần học tối thứ 7, đã có nền tảng cơ bản..."
              className="min-h-[100px] bg-slate-50/50 border-slate-200"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button
              type="submit"
              disabled={loading}
              className={isQuickQR ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
            >
              {loading ? 'Đang lý...' : isQuickQR ? 'Lưu khách & Lấy mã QR' : 'Lưu khách hàng'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
