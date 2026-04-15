import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, QrCode, Copy, CheckCircle2, Percent, Banknote } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Course {
  id: string;
  name: string;
  code: string;
  price: number;
}

interface OrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string; phone: string } | null;
}

export function OrderCreateDialog({ open, onOpenChange, customer }: OrderCreateDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [primaryCourseId, setPrimaryCourseId] = useState('');
  
  // States cho tính toán liên kết
  const [localDiscountAmount, setLocalDiscountAmount] = useState<number | ''>('');
  const [localDiscountPercent, setLocalDiscountPercent] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchCourses();
      setOrderResult(null);
      setSelectedCourseIds([]);
      setDiscountValue(0);
      setLocalDiscountAmount('');
      setLocalDiscountPercent('');
      setPaymentAmount(0);
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.filter((c: any) => c.status === 'ACTIVE'));
    } catch (error) {
      toast.error('Lỗi tải danh sách khóa học');
    }
  };

  const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
  const totalPrice = selectedCourses.reduce((sum, c) => sum + c.price, 0);

  // Đồng bộ lại khi tổng tiền thay đổi (ví dụ: gỡ khóa học thì % hoặc tiền phải nhảy lại)
  useEffect(() => {
    if (totalPrice === 0) {
        setLocalDiscountAmount('');
        setLocalDiscountPercent('');
        return;
    }

    if (discountType === 'FIXED' && localDiscountAmount !== '') {
        const percent = (Number(localDiscountAmount) / totalPrice) * 100;
        setLocalDiscountPercent(Number(percent.toFixed(2)));
    } else if (discountType === 'PERCENT' && localDiscountPercent !== '') {
        const amount = totalPrice * (Number(localDiscountPercent) / 100);
        setLocalDiscountAmount(Math.round(amount));
    }
  }, [totalPrice]);

  const handleAmountChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setLocalDiscountAmount(num);
    setDiscountType('FIXED');
    setDiscountValue(num === '' ? 0 : num);

    if (totalPrice > 0 && num !== '') {
        const percent = (Number(num) / totalPrice) * 100;
        setLocalDiscountPercent(Number(percent.toFixed(2)));
    } else {
        setLocalDiscountPercent('');
    }
  };

  const handlePercentChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setLocalDiscountPercent(num);
    setDiscountType('PERCENT');
    setDiscountValue(num === '' ? 0 : num);

    if (totalPrice > 0 && num !== '') {
        const amount = totalPrice * (Number(num) / 100);
        setLocalDiscountAmount(Math.round(amount));
    } else {
        setLocalDiscountAmount('');
    }
  };
  
  let finalPrice = totalPrice;
  if (discountType === 'PERCENT') {
    finalPrice = totalPrice * (1 - (Number(discountValue) || 0) / 100);
  } else {
    finalPrice = Math.max(0, totalPrice - (Number(discountValue) || 0));
  }

  const handleToggleCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (!primaryCourseId || !selectedCourseIds.includes(primaryCourseId)) {
        setPrimaryCourseId(id);
    }
  };

  const handleCreateOrder = async (showQR: boolean = true) => {
    if (selectedCourseIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khóa học');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        customerId: customer?.id,
        courseIds: selectedCourseIds,
        discountType,
        discountValue: Number(discountValue) || 0,
        paymentAmount: paymentAmount > 0 ? paymentAmount : finalPrice,
        primaryCourseId: primaryCourseId || selectedCourseIds[0]
      });
      
      toast.success('Đã tạo đơn hàng thành công');

      if (showQR) {
        setOrderResult(data);
      } else {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (orderResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" /> Đơn hàng đã tạo
            </DialogTitle>
            <DialogDescription>
              Quét mã dưới đây để khách hàng thanh toán nhanh qua SePay/MBBank.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-slate-100">
              <img src={orderResult.qrCode} alt="Payment QR" className="w-64 h-64 object-contain" />
            </div>
            
            <div className="w-full bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500">Người nhận:</span>
                    <span className="font-bold underline">Hệ thống Admin</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Mã chuyển khoản:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{orderResult.memo}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            navigator.clipboard.writeText(orderResult.memo);
                            toast.success('Đã sao chép nội dung');
                        }}>
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Số tiền QR:</span>
                    <span className="text-primary">{formatCurrency(orderResult.finalPrice)}</span>
                </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full">Hoàn tất & Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Gán khóa học & Tạo đơn thanh toán</DialogTitle>
          <DialogDescription>
            Tạo đơn hàng mới cho: <span className="font-bold text-slate-900">{customer?.name} ({customer?.phone})</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">1. Chọn khóa học</Label>
            <div className="border rounded-lg h-[320px] overflow-y-auto p-2 space-y-2 bg-slate-50/50">
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer ${selectedCourseIds.includes(course.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white hover:border-slate-300'}`}
                  onClick={() => handleToggleCourse(course.id)}
                >
                  <Checkbox checked={selectedCourseIds.includes(course.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-none truncate">{course.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatCurrency(course.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">2. Thiết lập giảm giá & QR</Label>
            
            <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 via-white to-white rounded-2xl space-y-4 border border-indigo-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                <span>Tạm tính (Giá gốc)</span>
                <span className="line-through decoration-slate-300">{formatCurrency(totalPrice)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <Label className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Banknote className="w-3 h-3 text-indigo-500" /> Giảm tiền</Label>
                   <div className="relative">
                     <Input 
                          type="number" 
                          placeholder="0"
                          value={localDiscountAmount} 
                          onChange={e => handleAmountChange(e.target.value)}
                          className="bg-white border-slate-200 h-8 text-xs text-slate-900 font-bold focus-visible:ring-indigo-500/20 pr-7"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">đ</span>
                   </div>
                </div>

                <div className="space-y-1">
                   <Label className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Percent className="w-3 h-3 text-indigo-500" /> Giảm %</Label>
                   <div className="relative">
                     <Input 
                          type="number" 
                          placeholder="0"
                          min="0"
                          max="100"
                          value={localDiscountPercent} 
                          onChange={e => handlePercentChange(e.target.value)}
                          className="bg-white border-slate-200 h-8 text-xs text-slate-900 font-bold focus-visible:ring-indigo-500/20 pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">%</span>
                   </div>
                </div>
              </div>

              <div className="bg-white/60 p-2.5 rounded-xl border border-indigo-100/50 flex justify-between items-center shadow-inner">
                <div className="space-y-0 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Tổng cuối cùng</span>
                  <div className="text-indigo-600 font-medium">Tiết kiệm: {formatCurrency(totalPrice - finalPrice)}</div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600 tracking-tight">{formatCurrency(finalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                <Label htmlFor="pay-amt" className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    Số tiền thanh toán trước (Cọc / Trả một phần)
                </Label>
                <div className="relative">
                    <Input 
                        id="pay-amt" 
                        type="number" 
                        placeholder="Để trống để thanh toán hết..."
                        className="h-9 pr-10 text-sm"
                        value={paymentAmount || ''}
                        onChange={e => setPaymentAmount(Number(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">VND</div>
                </div>
                <p className="text-[9px] text-slate-400 italic leading-tight">
                    * Mã QR sẽ sinh theo số tiền này. Nếu khách chỉ cọc một phần, phần còn thiếu sẽ được ghi nhận là <strong>nợ học phí</strong>.
                </p>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-lg border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy bỏ</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleCreateOrder(false)} disabled={loading || selectedCourseIds.length === 0}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Chỉ lưu đơn'}
            </Button>
            <Button onClick={() => handleCreateOrder(true)} disabled={loading || selectedCourseIds.length === 0} className="min-w-[150px] shadow-md shadow-primary/20">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><QrCode className="w-4 h-4 mr-2" /> Tạo đơn & Hiện QR</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
