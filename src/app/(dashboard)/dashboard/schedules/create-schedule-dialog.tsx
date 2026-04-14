'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Clock, Users, Repeat, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ Nhật' },
];

export function CreateScheduleDialog({ open, onOpenChange, onSuccess }: CreateScheduleDialogProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    courseId: '',
    instructorId: '',
    startDate: '',
    startTime: '08:00',
    endTime: '10:00',
    maxCapacity: 10,
    isRecurring: false,
    selectedDays: [] as number[],
    totalSessions: 1,
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        api.get('/courses'),
        api.get('/users') // Needs to filter by role in real app, but for now let's assume all users
      ]);
      setCourses(coursesRes.data);
      // Filter for instructors if role info is available
      setInstructors(usersRes.data);
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu cấu hình');
    }
  };

  const handleSubmit = async () => {
    if (!formData.courseId || !formData.instructorId || !formData.startDate) {
      toast.error('Vui lòng điền đủ các trường bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

      const payload = {
        courseId: formData.courseId,
        instructorId: formData.instructorId,
        startTime: startDateTime,
        endTime: endDateTime,
        maxCapacity: Number(formData.maxCapacity),
        recurring: formData.isRecurring ? {
          daysOfWeek: formData.selectedDays,
          totalSessions: Number(formData.totalSessions),
        } : null
      };

      await api.post('/schedules', payload);
      toast.success(formData.isRecurring ? 'Đã tạo chuỗi lịch học thành công' : 'Đã tạo lịch học thành công');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo lịch học');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Tạo Lịch Học Mới
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Khóa học *</Label>
              <Select 
                value={formData.courseId} 
                onValueChange={(val) => setFormData({ ...formData, courseId: val || '' })}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Chọn khóa học" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length > 0 ? (
                    courses.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} ({c.code})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-xs italic">Không có dữ liệu</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Giảng viên *</Label>
              <Select 
                value={formData.instructorId} 
                onValueChange={(val) => setFormData({ ...formData, instructorId: val || '' })}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Chọn giảng viên" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.length > 0 ? (
                    instructors.map(u => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-xs italic">Không có dữ liệu</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Ngày bắt đầu *</Label>
              <Input 
                type="date" 
                className="h-9 text-xs" 
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Giờ bắt đầu</Label>
              <Input 
                type="time" 
                className="h-9 text-xs" 
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Giờ kết thúc</Label>
              <Input 
                type="time" 
                className="h-9 text-xs" 
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="recurring" 
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
              />
              <label htmlFor="recurring" className="text-xs font-bold cursor-pointer flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Thiết lập lịch lặp lại
              </label>
            </div>
          </div>

          {formData.isRecurring && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Lặp lại vào thứ:</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div 
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border",
                        formData.selectedDays.includes(day.id)
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {day.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-w-[150px]">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Tổng số buổi:</Label>
                <Input 
                  type="number" 
                  className="h-8 text-xs font-bold" 
                  value={formData.totalSessions}
                  onChange={(e) => setFormData({ ...formData, totalSessions: Number(e.target.value) })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 max-w-[150px]">
            <Label className="text-xs font-bold">Sĩ số tối đa</Label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <Input 
                type="number" 
                className="h-9 text-xs" 
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-xs">Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Tạo Lịch Học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
