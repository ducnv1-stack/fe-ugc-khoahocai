'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Plus, 
  Loader2, 
  Search, 
  UserPlus, 
  LayoutGrid, 
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyCalendar } from './weekly-calendar';
import { ScheduleDetailPanel } from './schedule-detail-panel';
import { CreateScheduleDialog } from './create-schedule-dialog';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'cards' | 'calendar'>('calendar');

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schedules');
      setSchedules(res.data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách lịch học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSearchCustomer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await api.get(`/schedules/search-customers?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStudent = async (customerId: string) => {
    if (!selectedSchedule) return;
    try {
      await api.post(`/schedules/${selectedSchedule.id}/students`, { customerId });
      toast.success('Thêm học viên thành công');
      setIsAddStudentOpen(false);
      // Refresh both list and the panel if open
      const updatedSchedules = await api.get('/schedules');
      setSchedules(updatedSchedules.data);
      if (isDetailOpen) {
        const updatedOne = updatedSchedules.data.find((s: any) => s.id === selectedSchedule.id);
        setSelectedSchedule(updatedOne);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm học viên');
    }
  };

  if (loading && !schedules.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Điều hành Lịch học & Sĩ số</h1>
          <p className="text-xs text-slate-500 mt-1">Giao diện quản lý chuyên nghiệp cho vận hành.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700" 
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tạo Lịch Học
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(val: any) => setView(val)} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-slate-100 p-1 h-9">
            <TabsTrigger value="calendar" className="text-xs gap-1.5 h-7">
              <CalendarDays className="w-3.5 h-3.5" />
              Lịch biểu
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-xs gap-1.5 h-7">
              <LayoutGrid className="w-3.5 h-3.5" />
              Danh sách thẻ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <WeeklyCalendar 
              schedules={schedules} 
              onEventClick={(s) => {
                setSelectedSchedule(s);
                setIsDetailOpen(true);
              }}
              onTimeUpdate={async (id, start, end) => {
                try {
                  await api.patch(`/schedules/${id}/time`, { startTime: start, endTime: end });
                  toast.success('Đã cập nhật thời gian buổi học');
                  fetchSchedules();
                } catch (err) {
                  toast.error('Lỗi khi cập nhật thời gian');
                }
              }}
           />
        </TabsContent>

        <TabsContent value="cards" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule) => {
              const startTime = new Date(schedule.startTime);
              const endTime = new Date(schedule.endTime);
              const registered = schedule._count.students;
              const capacity = schedule.maxCapacity;
              const fillPercentage = Math.min((registered / capacity) * 100, 100);
              const isFull = fillPercentage >= 100;

              return (
                <Card key={schedule.id} className="overflow-hidden border-slate-200">
                  <CardHeader className="bg-slate-50 p-3 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 bg-white text-[9px] px-1.5 py-0 h-4">{schedule.course?.code || 'NO-CODE'}</Badge>
                        <CardTitle className="text-sm font-bold text-slate-800">{schedule.course?.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{startTime.toLocaleDateString('vi-VN')} {startTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {endTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Giảng viên: <span className="font-semibold">{schedule.instructor?.name || 'N/A'}</span></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">Sĩ số lớp</span>
                        <span className="font-bold text-slate-900">{registered} / {capacity}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`}
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-2 h-8 text-xs" 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setIsDetailOpen(true);
                      }}
                    >
                      Xem chi tiết & Điểm danh
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <ScheduleDetailPanel 
        schedule={selectedSchedule}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onRefresh={fetchSchedules}
        onAddStudent={() => {
          setIsAddStudentOpen(true);
          setSearchQuery('');
          setSearchResults([]);
        }}
      />

      <CreateScheduleDialog 
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchSchedules}
      />

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Gán học viên vào lớp</DialogTitle>
            <DialogDescription>
              {selectedSchedule?.course?.name} — {new Date(selectedSchedule?.startTime).toLocaleDateString('vi-VN')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm SĐT hoặc Tên học viên..."
                className="pl-9 h-9 text-xs"
                value={searchQuery}
                onChange={handleSearchCustomer}
              />
            </div>

            <div className="border border-slate-100 rounded-lg max-h-60 overflow-y-auto bg-slate-50">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-slate-500">Đang tìm...</div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map(customer => (
                    <div key={customer.id} className="p-2 bg-white flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{customer.name}</p>
                        <p className="text-[10px] text-slate-500">{customer.phone}</p>
                      </div>
                      <Button size="sm" onClick={() => handleAddStudent(customer.id)} className="bg-indigo-600 hover:bg-indigo-700 h-7 text-[10px] px-2">
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Gán
                      </Button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-3 text-center text-xs text-slate-500">Không tìm thấy học viên nào.</div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">Nhập thông tin để tìm kiếm...</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStudentOpen(false)}>Hủy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
