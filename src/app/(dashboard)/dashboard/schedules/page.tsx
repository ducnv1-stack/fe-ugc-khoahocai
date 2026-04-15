'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Link as LinkIcon
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyCalendar } from './weekly-calendar';
import { ScheduleDetailPanel } from './schedule-detail-panel';
import { CreateScheduleDialog } from './create-schedule-dialog';
import { EditScheduleDialog } from './edit-schedule-dialog';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [view, setView] = useState<'cards' | 'calendar'>('calendar');

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schedules');
      setSchedules(res.data);
      
      // Update selectedSchedule if it's open to ensure detail panel shows fresh data
      if (selectedSchedule) {
        const updated = res.data.find((s: any) => s.id === selectedSchedule.id);
        if (updated) setSelectedSchedule(updated);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách lịch học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchPotentialStudents = async (silent = false) => {
    if (!selectedSchedule) return;
    try {
      if (!silent) setIsSearching(true);
      setHasSearched(true);
      const res = await api.get(`/schedules/${selectedSchedule.id}/potential-students`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchCustomer = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length === 0) {
      fetchPotentialStudents(true);
      return;
    }
    try {
      setIsSearching(true);
      setHasSearched(true);
      const scheduleId = selectedSchedule?.id || '';
      const res = await api.get(`/schedules/search-customers?q=${encodeURIComponent(q)}&scheduleId=${scheduleId}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, [selectedSchedule]);

  useEffect(() => {
    if (isAddStudentOpen) {
      fetchPotentialStudents();
    }
  }, [isAddStudentOpen, selectedSchedule]);

  const handleAddStudent = async (customerId: string) => {
    if (!selectedSchedule) return;
    try {
      await api.post(`/schedules/${selectedSchedule.id}/students`, { customerId });
      toast.success('Thêm học viên thành công');
      
      // Refresh prospective students list silently to avoid flicker
      fetchPotentialStudents(true); 
      
      // Refresh the background schedules list to update Detail Panel
      const updatedSchedules = await api.get('/schedules');
      setSchedules(updatedSchedules.data);
      if (isDetailOpen) {
        const updatedOne = updatedSchedules.data.find((s: any) => s.id === selectedSchedule.id);
        if (updatedOne) setSelectedSchedule(updatedOne);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm học viên');
    }
  };

  const handleRemoveStudent = async (customerId: string) => {
    if (!selectedSchedule) return;
    try {
      await api.delete(`/schedules/${selectedSchedule.id}/students/${customerId}`);
      toast.success('Đã gỡ học viên khỏi lớp');
      
      fetchPotentialStudents(true); 
      
      const updatedSchedules = await api.get('/schedules');
      setSchedules(updatedSchedules.data);
      if (isDetailOpen) {
        const updatedOne = updatedSchedules.data.find((s: any) => s.id === selectedSchedule.id);
        if (updatedOne) setSelectedSchedule(updatedOne);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gỡ học viên');
    }
  };

  const handleTimeUpdate = async (id: string, startTime: Date, endTime: Date) => {
    try {
      await api.patch(`/schedules/${id}/time`, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      toast.success('Đã cập nhật thời gian buổi học');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật thời gian');
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
              Danh sách lớp
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
              onTimeUpdate={handleTimeUpdate}
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
                      <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-white text-[9px] px-1.5 py-0 h-4">{schedule.course?.code || 'NO-CODE'}</Badge>
                           {schedule.isOnline ? (
                             <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[8px] h-4 px-1 border-blue-200">ONLINE</Badge>
                           ) : (
                             <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[8px] h-4 px-1 border-orange-200">OFFLINE</Badge>
                           )}
                        </div>
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
                      {schedule.meetingUrl && (
                        <div className={cn(
                          "flex items-center gap-2 font-medium",
                          schedule.isOnline ? "text-indigo-600" : "text-slate-600"
                        )}>
                          {schedule.isOnline ? (
                            <LinkIcon className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <MapPin className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="truncate">{schedule.meetingUrl}</span>
                        </div>
                      )}
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
          setHasSearched(false);
        }}
        onEdit={() => setIsEditOpen(true)}
      />

      <EditScheduleDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => {
          fetchSchedules();
          // Also update selectedSchedule to reflect changes in panel
          if (selectedSchedule) {
            api.get('/schedules').then(res => {
              const updated = res.data.find((s: any) => s.id === selectedSchedule.id);
              if (updated) setSelectedSchedule(updated);
            });
          }
        }}
        schedule={selectedSchedule}
      />

      <CreateScheduleDialog 
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchSchedules}
      />

      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-4 border-b border-slate-100 bg-white">
            <DialogTitle className="text-sm font-bold text-slate-900">Gán học viên vào lớp</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-xs">
              {selectedSchedule?.course?.name} — {selectedSchedule?.startTime ? format(new Date(selectedSchedule.startTime), 'dd/MM/yyyy', { locale: vi }) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-white space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm SĐT hoặc Tên học viên..."
                className="pl-9 h-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-none"
                value={searchQuery}
                onChange={(e) => handleSearchCustomer(e.target.value)}
              />
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/10 min-h-[100px] flex flex-col items-center justify-center relative">
                {/* Silent Refresh Indicator */}
                {isSearching && searchResults.length > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  </div>
                )}

                <div className="w-full overflow-y-auto max-h-[380px] divide-y divide-slate-100/50 custom-scrollbar">
                {isSearching && searchResults.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Đang tải danh sách...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(customer => (
                    <div key={customer.id} className="p-3 bg-white flex justify-between items-center hover:bg-slate-50/80 transition-all">
                      <div className="space-y-1 pr-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 truncate">{customer.name}</p>
                          {customer.isAssigned && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] h-4 py-0">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Có mặt
                            </Badge>
                          )}
                          {customer.tuitionStatus === 'UNPAID' && (
                            <Badge variant="default" className="bg-rose-500 text-white text-[9px] h-4 border-none py-0">Nợ phí</Badge>
                          )}
                          {customer.tuitionStatus === 'PAID' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] h-4 py-0">Đã đủ</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                           <span className="font-mono bg-slate-100 px-1 rounded">{customer.phone}</span>
                           {customer.unpaidAmount > 0 && (
                             <span className="text-rose-500 font-medium">({customer.unpaidAmount.toLocaleString()}đ)</span>
                           )}
                        </div>
                      </div>
                      
                      {customer.isAssigned ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã gán
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleRemoveStudent(customer.id)} 
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Gỡ khỏi lớp"
                          >
                            <Plus className="w-3.5 h-3.5 rotate-45" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleAddStudent(customer.id)} 
                          className="bg-indigo-600 hover:bg-indigo-700 h-7 text-[10px] px-3 rounded-lg shadow-sm transition-all"
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Gán
                        </Button>
                      )}
                    </div>
                  ))
                ) : hasSearched ? (
                  <div className="p-10 text-center">
                    <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Không tìm thấy học viên</p>
                    <p className="text-[10px] text-slate-400">Thử tìm theo tên hoặc SĐT khác</p>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-xs text-slate-400 italic">
                      Nhập thông tin hoặc số điện thoại để tìm kiếm...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
