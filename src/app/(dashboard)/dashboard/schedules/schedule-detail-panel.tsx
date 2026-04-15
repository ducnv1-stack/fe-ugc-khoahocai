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
  Trash2,
  MapPin,
  Link,
  ExternalLink,
  Repeat
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/provider/confirm-provider';
import { Edit2 } from 'lucide-react';

interface ScheduleDetailPanelProps {
  schedule: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onAddStudent: () => void;
  onEdit: () => void;
}

export function ScheduleDetailPanel({ 
  schedule, 
  open, 
  onOpenChange, 
  onRefresh,
  onAddStudent,
  onEdit
}: ScheduleDetailPanelProps) {
  const confirm = useConfirm();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    const isRecurring = !!schedule.recurringGroupId;
    const studentCount = schedule.students?.length || 0;
    const studentWarning = studentCount > 0 
      ? `Buổi học này đang có ${studentCount} học viên. Việc xóa sẽ làm mất toàn bộ dữ liệu điểm danh liên quan. ` 
      : "";
    
    if (isRecurring) {
      const wantToDelete = await confirm({
        title: 'Xác nhận xóa lịch học',
        description: `${studentWarning}Buổi học này thuộc một chuỗi lặp lại. Bạn có chắc chắn muốn xóa không?`,
        confirmText: 'Đồng ý xóa',
        cancelText: 'Hủy',
        variant: 'destructive'
      });

      if (!wantToDelete) return;

      const deleteAll = await confirm({
        title: 'Chọn phạm vi xóa',
        description: 'Hệ thống hỗ trợ xóa lẻ một buổi hoặc xóa toàn bộ chuỗi. Bạn chọn phương án nào?',
        confirmText: 'Xóa toàn bộ chuỗi',
        cancelText: 'Chỉ xóa buổi này',
        variant: 'destructive'
      });

      executeDelete(deleteAll);
    } else {
      const isConfirmed = await confirm({
        title: 'Xác nhận xóa lịch học',
        description: `${studentWarning}Bạn có chắc chắn muốn xóa buổi học này không?`,
        confirmText: 'Xóa ngay',
        cancelText: 'Hủy',
        variant: 'destructive'
      });
      if (isConfirmed) executeDelete(false);
    }
  };

  const executeDelete = async (series: boolean) => {
    setIsDeleting(true);
    try {
      await api.delete(`/schedules/${schedule.id}${series ? '?series=true' : ''}`);
      toast.success(series ? 'Đã xóa toàn bộ chuỗi lịch học' : 'Đã xóa buổi học');
      onOpenChange(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa lịch học');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[500px] flex flex-col p-0">
        <SheetHeader className="p-6 bg-slate-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  {schedule.course?.code}
                </Badge>
                {schedule.isOnline ? (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 h-5 px-1.5 border-blue-200">
                    <Link className="w-3 h-3" /> Online
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1 h-5 px-1.5 border-orange-200">
                    <MapPin className="w-3 h-3" /> Offline
                  </Badge>
                )}
                {schedule.recurringGroupId && (
                  <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50 gap-1.5 h-5 px-1.5">
                    <Repeat className="w-3 h-3" /> Lịch lặp lại
                  </Badge>
                )}
              </div>
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
            {schedule.meetingUrl && (
              <div className="flex items-start gap-2 text-indigo-600 font-medium pt-1 border-t border-slate-100 mt-2">
                {schedule.isOnline ? (
                  <Link className="w-4 h-4 text-indigo-400 mt-0.5" />
                ) : (
                  <MapPin className="w-4 h-4 text-indigo-400 mt-0.5" />
                )}
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                     {schedule.isOnline ? 'Link học trực tuyến' : 'Địa điểm học'}
                   </span>
                   {schedule.isOnline ? (
                     <a 
                       href={schedule.meetingUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="hover:underline flex items-center gap-1 text-sm"
                     >
                       {schedule.meetingUrl}
                       <ExternalLink className="w-3 h-3" />
                     </a>
                   ) : (
                     <span className="text-sm text-slate-900">{schedule.meetingUrl}</span>
                   )}
                </div>
              </div>
            )}

            {schedule.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg mt-2">
                <span className="text-[10px] text-amber-600 font-bold uppercase block mb-1">Ghi chú buổi học:</span>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{schedule.notes}"</p>
              </div>
            )}
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

        <div className="p-6 bg-slate-50 border-t flex justify-between gap-3">
           <Button 
             variant="outline" 
             className="flex-1 h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
             onClick={handleDelete}
             disabled={isDeleting}
           >
             {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
             Xóa buổi
           </Button>
           <Button 
             variant="outline" 
             className="flex-1 h-10 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
             onClick={onEdit}
           >
             <Edit2 className="w-4 h-4 mr-2" /> Sửa thông tin
           </Button>
           <Button variant="outline" className="h-10 border-slate-200" onClick={() => onOpenChange(false)}>
             Đóng
           </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
