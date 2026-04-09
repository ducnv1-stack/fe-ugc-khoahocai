import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Course {
  id: string;
  name: string;
  code: string;
  price: number;
  duration: number;
  description?: string;
  status: string;
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSave: (data: Partial<Course>) => Promise<void>;
}

export function CourseFormDialog({ open, onOpenChange, course, onSave }: CourseFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: 0,
    duration: 60,
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (open) {
      if (course) {
        setFormData({
          name: course.name,
          code: course.code,
          price: course.price,
          duration: course.duration,
          description: course.description || '',
          status: course.status,
        });
      } else {
        setFormData({
          name: '',
          code: '',
          price: 0,
          duration: 60,
          description: '',
          status: 'ACTIVE',
        });
      }
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration)
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{course ? 'Chỉnh sửa Khóa học' : 'Thêm mới Khóa học'}</DialogTitle>
          <DialogDescription>
            Tạo và tuỳ chỉnh thông số khóa học trên hệ thống.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên khóa học</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Mã khóa học</Label>
              <Input 
                id="code" 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Giá (VNĐ)</Label>
              <Input 
                id="price" 
                type="number"
                min="0"
                value={formData.price} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Thời lượng (Phút)</Label>
              <Input 
                id="duration" 
                type="number"
                min="1"
                value={formData.duration} 
                onChange={e => setFormData({...formData, duration: Number(e.target.value)})} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <select 
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả thêm</Label>
            <Input 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu lại'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
