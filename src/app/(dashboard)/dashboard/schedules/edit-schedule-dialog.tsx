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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  Repeat, 
  Loader2, 
  Link,
  Info,
  Edit2 
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schedule: any | null;
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

export function EditScheduleDialog({ open, onOpenChange, onSuccess, schedule }: EditScheduleDialogProps) {
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
    meetingUrl: '',
    notes: '',
    isOnline: true,
    isRecurring: false,
    selectedDays: [] as number[],
    totalSessions: 1,
  });

  const getSeriesEndDate = () => {
    if (!formData.startDate || !formData.selectedDays.length || formData.totalSessions <= 1) return null;
    
    let currentDate = new Date(formData.startDate);
    let count = 0;
    let lastDate = new Date(formData.startDate);

    while (count < formData.totalSessions) {
      if (formData.selectedDays.includes(currentDate.getDay())) {
        lastDate = new Date(currentDate);
        count++;
      }
      if (count < formData.totalSessions) {
        currentDate = addDays(currentDate, 1);
      }
      if (currentDate.getTime() > addDays(new Date(formData.startDate), 365 * 2).getTime()) break;
    }
    return lastDate;
  };

  const seriesEndDate = getSeriesEndDate();

  useEffect(() => {
    if (open && schedule) {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      
      setFormData({
        courseId: schedule.courseId,
        instructorId: schedule.instructorId,
        startDate: start.toISOString().split('T')[0],
        startTime: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        endTime: end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        maxCapacity: schedule.maxCapacity || 10,
        meetingUrl: schedule.meetingUrl || '',
        notes: schedule.notes || '',
        isOnline: schedule.isOnline ?? true,
        isRecurring: false, // Default to false when opening an existing one
        selectedDays: [],
        totalSessions: 1,
      });
      fetchData();
    }
  }, [open, schedule]);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const fetchData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        api.get('/courses'),
        api.get('/users')
      ]);
      setCourses(coursesRes.data);
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

      await api.patch(`/schedules/${schedule.id}`, {
        courseId: formData.courseId,
        instructorId: formData.instructorId,
        startTime: startDateTime,
        endTime: endDateTime,
        maxCapacity: Number(formData.maxCapacity),
        meetingUrl: formData.meetingUrl,
        notes: formData.notes,
        isOnline: formData.isOnline,
        recurring: formData.isRecurring ? {
          daysOfWeek: formData.selectedDays,
          totalSessions: Number(formData.totalSessions),
        } : null
      });
      toast.success('Cập nhật lịch học thành công');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật lịch học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-indigo-600" />
            Chỉnh Sửa Thông Tin Lịch Học
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
                <SelectTrigger className="h-9 text-xs w-full bg-slate-50 border-slate-200 overflow-hidden flex items-center justify-between">
                  <SelectValue placeholder="Chọn khóa học">
                    <span className="truncate max-w-[200px] block">
                      {courses.find(c => c.id === formData.courseId)?.name || schedule?.course?.name}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs py-2">
                       <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-[10px] text-slate-500">{c.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Giảng viên *</Label>
              <Select 
                value={formData.instructorId} 
                onValueChange={(val) => setFormData({ ...formData, instructorId: val || '' })}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-slate-50 border-slate-200 overflow-hidden flex items-center justify-between">
                  <SelectValue placeholder="Chọn giảng viên">
                    <span className="truncate max-w-[200px] block">
                      {instructors.find(u => u.id === formData.instructorId)?.name || schedule?.instructor?.name}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {instructors.map(u => (
                    <SelectItem key={u.id} value={u.id} className="text-xs py-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{u.name}</span>
                        <span className="text-[10px] text-slate-500">Giảng viên</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Ngày học *</Label>
              <Input 
                type="date" 
                className="h-9 text-sm" 
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Bắt đầu</Label>
              <Input 
                type="time" 
                className="h-9 text-sm" 
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Kết thúc</Label>
              <Input 
                type="time" 
                className="h-9 text-sm" 
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-slate-700">Hình thức học</Label>
              <p className="text-[10px] text-slate-500">Chọn giữa học trực tuyến hoặc tại lớp</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold", !formData.isOnline ? "text-orange-600" : "text-slate-400")}>OFFLINE</span>
              <Switch 
                checked={formData.isOnline}
                onCheckedChange={(checked) => setFormData({ ...formData, isOnline: !!checked })}
              />
              <span className={cn("text-[10px] font-bold", formData.isOnline ? "text-indigo-600" : "text-slate-400")}>ONLINE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Sĩ số tối đa</Label>
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
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">
                {formData.isOnline ? 'Link học trực tuyến' : 'Địa điểm / Phòng học'}
              </Label>
              <Input 
                placeholder={formData.isOnline ? "https://meet.google.com/..." : "VD: Phòng 201, Tầng 2..."}
                className="h-9 text-xs" 
                value={formData.meetingUrl}
                onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Ghi chú cho buổi học</Label>
            <Textarea 
              placeholder="Nhập ghi chú hoặc dặn dò cho học viên/giảng viên..."
              className="text-xs min-h-[80px]"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-recurring" 
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
              />
              <label htmlFor="edit-recurring" className="text-xs font-bold cursor-pointer flex items-center gap-1.5 text-slate-700">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Thiết lập lặp lại từ buổi này
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
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-500">Tổng số buổi:</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number" 
                    className="h-8 w-20 text-xs font-bold" 
                    value={formData.totalSessions}
                    min={1}
                    onChange={(e) => setFormData({ ...formData, totalSessions: Math.max(1, Number(e.target.value)) })}
                  />
                  {formData.totalSessions > 1 && seriesEndDate && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 animate-in fade-in slide-in-from-left-1 duration-300">
                      <Info className="w-3 h-3" />
                      <span className="text-[10px] font-medium">
                        Kết thúc lúc: <span className="font-bold">{format(seriesEndDate, 'dd/MM/yyyy', { locale: vi })}</span>
                      </span>
                    </div>
                  )}
                  {formData.totalSessions === 1 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100">
                      <Info className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Chỉ tạo 1 buổi duy nhất</span>
                    </div>
                  )}
                </div>
                {formData.totalSessions > 1 && !formData.selectedDays.length && (
                  <p className="text-[9px] text-rose-500 font-bold italic">* Vui lòng chọn ít nhất một thứ để lặp lại</p>
                )}
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
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
