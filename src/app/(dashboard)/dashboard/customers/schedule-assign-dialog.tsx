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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  CheckSquare,
  Square
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
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      setSelectedIds([]);
    }
  }, [open, customer]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules');
      // Filter schedules to only show courses the customer has actually bought
      // AND also filter out schedules where the customer is already assigned
      const filtered = res.data.filter((s: any) => {
        const hasBought = boughtCourseIds.includes(s.courseId);
        const isAlreadyAssigned = s.students.some((sub: any) => sub.customerId === customer.id);
        return hasBought && !isAlreadyAssigned;
      });
      setSchedules(filtered);
    } catch (err) {
      toast.error('Lỗi khi tải lịch học');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map(s => s.id));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedIds.length === 0) return;
    
    setAssigningLoading(true);
    try {
      const res = await api.post('/schedules/bulk-students', {
        scheduleIds: selectedIds,
        customerId: customer.id
      });
      
      const { success, failed } = res.data;
      
      if (success.length > 0) {
        toast.success(`Đã gán thành công ${success.length} buổi học`);
      }
      
      if (failed.length > 0) {
        toast.error(`Có ${failed.length} buổi không thể gán (do hết chỗ hoặc lỗi)`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gán lịch học');
    } finally {
      setAssigningLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Gán Lịch Học Cho: {customer?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Chọn các buổi học để gán đồng loạt cho khách hàng.
              </DialogDescription>
            </div>
            
            {schedules.length > 0 && !loading && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSelectAll}
                className="text-[10px] h-7 px-2 font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                {selectedIds.length === schedules.length ? 'Huỷ chọn tất cả' : 'Chọn tất cả buổi'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map(schedule => {
                const isPaid = isCoursePaid(schedule.courseId);
                const registered = schedule._count?.students || 0;
                const capacity = schedule.maxCapacity || 10;
                const isFull = registered >= capacity;
                const isSelected = selectedIds.includes(schedule.id);
                
                return (
                  <div 
                    key={schedule.id} 
                    onClick={() => !isFull && toggleSelect(schedule.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                      isSelected ? "bg-indigo-50/50 border-indigo-200 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200",
                      isFull && "opacity-60 cursor-not-allowed bg-slate-50"
                    )}
                  >
                    <div className="shrink-0">
                      <Checkbox 
                        checked={isSelected} 
                        disabled={isFull}
                        onCheckedChange={() => toggleSelect(schedule.id)}
                        className="data-[state=checked]:bg-indigo-600 border-slate-300"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[9px] h-4 font-bold bg-white text-slate-600 border-slate-200">
                             {schedule.course?.code}
                           </Badge>
                           {!isPaid && (
                             <Badge className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] h-4 gap-1 hover:bg-rose-50 px-1">
                               <AlertTriangle className="w-2.5 h-2.5" /> Nợ phí
                             </Badge>
                           )}
                           {isFull && (
                             <Badge className="bg-slate-200 text-slate-600 border-none text-[9px] h-4">Hết chỗ</Badge>
                           )}
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-slate-800 leading-none">
                            {format(new Date(schedule.startTime), 'EEEE, dd/MM', { locale: vi })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{schedule.course?.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                             <div className="flex items-center gap-1 font-medium">
                               <Clock className="w-3 h-3" />
                               {format(new Date(schedule.startTime), 'HH:mm')} - {format(new Date(schedule.endTime), 'HH:mm')}
                             </div>
                             <span className="opacity-30">|</span>
                             <span>GV: <span className="text-slate-700">{schedule.instructor?.name}</span></span>
                          </div>
                        </div>
                        
                        <div className="text-[10px] font-bold text-slate-400">
                           {registered}/{capacity} chỗ
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
               <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
               <p className="text-sm text-slate-500 px-10">
                 Không có buổi học nào khả dụng hoặc khách đã được gán vào tất cả các buổi hiện có.
               </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 flex sm:justify-between items-center gap-3">
          <div className="text-[11px] text-slate-500">
            Đã chọn: <span className="font-bold text-indigo-600">{selectedIds.length}</span> buổi học
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9 px-4">Đóng</Button>
            <Button 
              disabled={selectedIds.length === 0 || assigningLoading}
              onClick={handleBulkAssign}
              className="text-xs h-9 px-6 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200"
            >
              {assigningLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Gán {selectedIds.length > 0 ? selectedIds.length : ''} buổi đã chọn</>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
