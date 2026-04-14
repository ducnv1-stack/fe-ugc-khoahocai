'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ScheduleAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any | null;
  onSuccess: () => void;
}

export function ScheduleAssignDialog({ open, onOpenChange, customer, onSuccess }: ScheduleAssignDialogProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Extract course IDs that the customer has bought
  const boughtCourseIds = useMemo(() => {
    if (!customer?.orders) return [];
    return customer.orders.flatMap((o: any) => o.items.map((i: any) => i.courseId));
  }, [customer]);

  // Check if a specific course is fully paid
  const isCoursePaid = (courseId: string) => {
    if (!customer?.orders) return false;
    const order = customer.orders.find((o: any) => o.items.some((i: any) => i.courseId === courseId));
    return order?.status === 'PAID';
  };

  useEffect(() => {
    if (open && customer) {
      fetchSchedules();
    }
  }, [open, customer]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules');
      // Filter schedules to only show courses the customer has actually bought
      const filtered = res.data.filter((s: any) => boughtCourseIds.includes(s.courseId));
      setSchedules(filtered);
    } catch (err) {
      toast.error('Lỗi khi tải lịch học');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (scheduleId: string) => {
    setAssigningId(scheduleId);
    try {
      await api.post(`/schedules/${scheduleId}/students`, { customerId: customer.id });
      toast.success('Gán lịch học thành công');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gán lịch');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Gán Lịch Học Cho: {customer?.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hệ thống chỉ hiển thị các lớp học thuộc khóa học khách hàng đã đăng ký.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map(schedule => {
                const isPaid = isCoursePaid(schedule.courseId);
                const registered = schedule._count?.students || 0;
                const capacity = schedule.maxCapacity || 10;
                const isFull = registered >= capacity;
                
                return (
                  <div key={schedule.id} className="p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                             {schedule.course?.code}
                           </Badge>
                           {!isPaid && (
                             <Badge className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] gap-1 hover:bg-rose-50">
                               <AlertTriangle className="w-3 h-3" /> Chưa đủ học phí
                             </Badge>
                           )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{schedule.course?.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">{format(new Date(schedule.startTime), 'HH:mm')} - {format(new Date(schedule.endTime), 'HH:mm')}</p>
                        <p className="text-[10px] text-slate-500">{format(new Date(schedule.startTime), 'EEEE, dd/MM', { locale: vi })}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                           <Users className="w-3 h-3" />
                           {registered}/{capacity}
                        </div>
                        <span>Giảng viên: <span className="text-slate-900">{schedule.instructor?.name}</span></span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        disabled={isFull || assigningId === schedule.id}
                        onClick={() => handleAssign(schedule.id)}
                        className={cn(
                          "h-7 text-[10px] px-3 font-bold",
                          !isPaid ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"
                        )}
                      >
                        {assigningId === schedule.id ? (
                           <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFull ? (
                           "Lớp đầy"
                        ) : (
                           <>
                             {isPaid ? "Gán vào lớp" : "Xác nhận & Gán lớp"}
                           </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
               <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
               <p className="text-sm text-slate-500 px-10">
                 Khách hàng chưa đăng ký khóa học nào hoặc các khóa học đã đăng ký chưa có lịch khai giảng phù hợp.
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
