'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Users, Plus, Pencil, Trash2, Loader2, Search,
  ShieldCheck, Circle, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import api from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '' });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', roleId: user.roleId });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.roleId) return;
    if (!editingUser && !form.password) return;
    try {
      setSaving(true);
      if (editingUser) {
        const payload: any = { name: form.name, email: form.email, roleId: form.roleId };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    SALE: 'bg-blue-50 text-blue-700 border-blue-200',
    INSTRUCTOR: 'bg-violet-50 text-violet-700 border-violet-200',
    ACCOUNTANT: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Quản lý Nhân sự
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Thêm, chỉnh sửa và phân quyền cho tài khoản nhân viên.</p>
        </div>
        <Button className="shadow-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Thêm nhân sự
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Nhân sự</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Vai trò</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Ngày tạo</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={`text-xs font-semibold ${ROLE_COLORS[user.role?.name] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      {user.role?.name || 'Không có'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {user.isOnline ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Circle className="w-3.5 h-3.5" /> Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => openEdit(user)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600" onClick={() => setDeleteTarget(user)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    Không tìm thấy nhân sự nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Họ tên *</label>
              <Input placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email *</label>
              <Input type="email" placeholder="email@csms.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                {editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Vai trò *</label>
              <select
                value={form.roleId}
                onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                className="w-full h-9 px-3 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
              >
                <option value="">-- Chọn vai trò --</option>
                {roles.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name} — {r.description}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Xác nhận xóa tài khoản</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-2">
            Bạn có chắc muốn xóa tài khoản <span className="font-bold">{deleteTarget?.name}</span>?<br />
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving} className="min-w-[80px]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
