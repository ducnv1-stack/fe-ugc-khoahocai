'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, BookOpen, Layers, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/provider/auth-provider';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Course, CourseFormDialog } from './course-form-dialog';

export default function CoursesPage() {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const canManage = hasPermission('courses.manage');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'ACTIVE').length;
  const avgPrice = totalCourses > 0 ? courses.reduce((acc, curr) => acc + curr.price, 0) / totalCourses : 0;

  if (loading && courses.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý Khóa học</h2>
          <p className="text-muted-foreground mt-1">Quản lý danh sách các khóa học đào tạo của bạn.</p>
        </div>
        {canManage && (
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm khóa học
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng khóa học</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Khóa học Đang mở</CardTitle>
            <BookOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Giá trị TB/Khóa</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(avgPrice)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã khóa</TableHead>
                <TableHead>Tên khóa học</TableHead>
                <TableHead className="text-right">Thời lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
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
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-xs">{course.code}</TableCell>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell className="text-right">{course.duration} phút</TableCell>
                    <TableCell className="text-right font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={course.status === 'ACTIVE' ? 'default' : 'secondary'} className={course.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0' : ''}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span title="Không có quyền chỉnh sửa">
                          <AlertCircle className="inline-block h-4 w-4 text-muted-foreground/30" />
                        </span>
                      )}
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
