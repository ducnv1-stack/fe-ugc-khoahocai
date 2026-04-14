'use client';

import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  Circle,
  Loader2,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduleDetailPanelProps {
  schedule: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onAddStudent: () => void;
}

export function ScheduleDetailPanel({ 
  schedule, 
  open, 
  onOpenChange, 
  onRefresh,
  onAddStudent 
}: ScheduleDetailPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!schedule) return null;

  const startTime = new Date(schedule.startTime);
  const endTime = new Date(schedule.endTime);
  const registered = schedule.students?.length || 0;
  const capacity = schedule.maxCapacity || 10;

  const handleToggleAttendance = async (customerId: string) => {
    setLoadingId(customerId);
    try {
      await api.patch(`/schedules/${schedule.id}/students/${customerId}/attendance`);
      toast.success('Cập nhật trạng thái điểm danh thành công');
      onRefresh();
    } catch (err) {
      toast.error('Lỗi khi cập nhật điểm danh');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="p-6 bg-slate-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 mb-2">
                {schedule.course?.code}
              </Badge>
              <SheetTitle className="text-xl font-bold">{schedule.course?.name}</SheetTitle>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(startTime, 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Giảng viên: <span className="font-bold text-slate-900">{schedule.instructor?.name}</span></span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              Học viên trong lớp 
              <Badge variant="outline" className="font-mono">{registered}/{capacity}</Badge>
            </h3>
            <Button 
              size="sm" 
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
              disabled={registered >= capacity}
              onClick={onAddStudent}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Thêm nhanh
            </Button>
          </div>

          <div className="space-y-3">
            {schedule.students?.length > 0 ? (
              schedule.students.map((record: any) => (
                <div 
                  key={record.customerId} 
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      record.isAttended ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {record.customer?.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{record.customer?.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{record.customer?.phone}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={record.isAttended ? "default" : "outline"}
                    className={cn(
                      "h-8 px-3 text-[10px] font-bold rounded-lg transition-all",
                      record.isAttended 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" 
                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                    )}
                    onClick={() => handleToggleAttendance(record.customerId)}
                    disabled={loadingId === record.customerId}
                  >
                    {loadingId === record.customerId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : record.isAttended ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Đã điểm danh
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 mr-1.5" />
                        Chưa điểm danh
                      </>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Chưa có học viên nào tham gia buổi học này.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-between gap-4">
           <Button variant="outline" className="flex-1 h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100">
             <Trash2 className="w-4 h-4 mr-2" /> Xóa buổi học
           </Button>
           <Button variant="outline" className="flex-1 h-10 border-slate-200" onClick={() => onOpenChange(false)}>
             Đóng
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
