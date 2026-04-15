'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, BookOpen, Layers, DollarSign, Loader2, AlertCircle, Trash, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Course, CourseFormDialog } from './course-form-dialog';
import { useConfirm } from '@/provider/confirm-provider';

export default function CoursesPage() {
  const { hasPermission } = useAuth();
  const confirm = useConfirm();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [counts, setCounts] = useState({ active: 0, trash: 0 });

  const canManage = hasPermission('courses.manage');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'trash' ? '/courses/trash' : '/courses';
      const { data } = await api.get(url);
      setCourses(data);
      
      // Update local count for the active tab
      if (activeTab === 'trash') {
        setCounts(prev => ({ ...prev, trash: data.length }));
      } else {
        setCounts(prev => ({ ...prev, active: data.length }));
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [{ data: activeData }, { data: trashData }] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/trash')
      ]);
      setCounts({ active: activeData.length, trash: trashData.length });
    } catch (error) {}
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [activeTab]);

  const handleCreateNew = () => {
    setEditingCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleSave = async (courseData: Partial<Course>) => {
    try {
      if (editingCourse) {
        await api.patch(`/courses/${editingCourse.id}`, courseData);
        toast.success('Đã cập nhật thông tin khóa học');
      } else {
        await api.post('/courses', courseData);
        toast.success('Đã tạo khóa học mới');
      }
      fetchCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu');
      throw error;
    }
  };

  const handleSoftDelete = async (course: Course) => {
    const isConfirmed = await confirm({
      title: 'Xác nhận xóa tạm',
      description: `Khóa học "${course.name}" sẽ được chuyển vào thùng rác.`,
      confirmText: 'Xóa tạm',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/courses/${course.id}`);
      toast.success('Đã chuyển khóa học vào thùng rác');
      fetchCourses();
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa');
    }
  };

  const handleRestore = async (course: Course) => {
    try {
      await api.patch(`/courses/${course.id}/restore`);
      toast.success('Đã khôi phục khóa học thành công');
      fetchCourses();
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi khôi phục');
    }
  };

  const handlePermanentDelete = async (course: Course) => {
    const isConfirmed = await confirm({
      title: 'XÓA VĨNH VIỄN',
      description: `Khóa học "${course.name}" sẽ bị xóa hoàn toàn khỏi hệ thống. Thao tác này KHÔNG THỂ HOÀN TÁC.`,
      confirmText: 'XÓA VĨNH VIỄN',
      variant: 'destructive'
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/courses/${course.id}/permanent`);
      toast.success('Đã xóa vĩnh viễn khóa học');
      fetchCourses();
      fetchCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa vĩnh viễn khóa học');
    }
  };

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;
  const avgPrice = totalCourses > 0 ? courses.reduce((acc, curr) => acc + curr.price, 0) / totalCourses : 0;

  if (loading && courses.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Quản lý Khóa học</h2>
          <p className="text-xs text-muted-foreground mt-1">Quản lý danh sách các khóa học đào tạo của bạn.</p>
        </div>
        {canManage && (
          <Button size="sm" className="h-8 text-xs" onClick={handleCreateNew}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm khóa học
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'active'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Đang hoạt động
          {counts.active > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
              }`}>{counts.active}</span>
          )}
        </button>
        {canManage && (
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'trash'
                ? 'bg-rose-100 text-rose-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Trash className="w-3.5 h-3.5" />
            Thùng rác
            {counts.trash > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'trash' ? 'bg-rose-200 text-rose-800' : 'bg-rose-100 text-rose-500'
                }`}>{counts.trash}</span>
            )}
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tổng khóa học</CardTitle>
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-bold text-slate-800">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Khóa học Đang mở</CardTitle>
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-bold text-slate-800">{activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Giá trị TB/Khóa</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-blue-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl font-bold text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgPrice)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="h-9 hover:bg-transparent">
                <TableHead className="py-1 text-[11px] font-bold">Mã khóa</TableHead>
                <TableHead className="py-1 text-[11px] font-bold">Tên khóa học</TableHead>
                <TableHead className="py-1 text-[11px] font-bold text-right">Thời lượng</TableHead>
                <TableHead className="py-1 text-[11px] font-bold text-right">Đơn giá</TableHead>
                <TableHead className="py-1 text-[11px] font-bold text-center">Trạng thái</TableHead>
                <TableHead className="py-1 text-[11px] font-bold text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Chưa có dữ liệu khóa học nào.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="h-10 hover:bg-slate-50/50">
                    <TableCell className="py-1.5 font-mono text-[11px] text-slate-500">{course.code}</TableCell>
                    <TableCell className="py-1.5 font-bold text-xs text-slate-800">{course.name}</TableCell>
                    <TableCell className="py-1.5 text-right text-xs text-slate-600">{course.duration} phút</TableCell>
                    <TableCell className="py-1.5 text-right font-bold text-[11px]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      <Badge variant={course.status === 'ACTIVE' ? 'default' : 'secondary'} className={`text-[9px] px-1.5 py-0 h-4 ${course.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0' : ''}`}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 text-right">
                      <div className="flex justify-end gap-1">
                        {activeTab === 'trash' ? (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-700" onClick={() => handleRestore(course)}>
                              <RotateCcw className="h-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700" onClick={() => handlePermanentDelete(course)}>
                              <Trash className="h-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {canManage ? (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(course)}>
                                <Edit2 className="h-3 h-3" />
                              </Button>
                            ) : null}
                            {canManage ? (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-rose-500" onClick={() => handleSoftDelete(course)}>
                                <Trash className="h-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <span title="Không có quyền thao tác">
                                <AlertCircle className="inline-block h-3.5 w-3.5 text-slate-300" />
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
        onSave={handleSave}
      />
    </div>
  );
}
